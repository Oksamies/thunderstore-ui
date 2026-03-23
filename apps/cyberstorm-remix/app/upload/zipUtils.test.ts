import { beforeEach, describe, expect, it, vi } from "vitest";

import { extractPackageContents, createNewPackageZip, repackageExistingZip } from "./zipUtils";

const loadAsyncMock = vi.fn();
const fileMock = vi.fn();
const forEachMock = vi.fn();
const folderMock = vi.fn();
const generateAsyncMock = vi.fn();

// Mock JSZip
vi.mock("jszip", () => {
  const JSZipMock = class {
    loadAsync = loadAsyncMock;
    file = fileMock;
    forEach = forEachMock;
    folder = folderMock;
    generateAsync = generateAsyncMock;
  };

  return { __esModule: true, default: JSZipMock };
});

describe("extractPackageContents", () => {
  let mockFile: File;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset URL.createObjectURL mock
    globalThis.URL.createObjectURL = vi.fn(
      () => "blob:http://localhost/mock-url"
    );

    // Provide a mocked File
    mockFile = {
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    } as unknown as File;
  });

  it("handles 'Can't find end of central directory' error", async () => {
    loadAsyncMock.mockRejectedValueOnce(
      new Error("Can't find end of central directory")
    );

    await expect(extractPackageContents(mockFile)).rejects.toThrow(
      "The imported file is not a ZIP."
    );
  });

  it("throws other errors normally", async () => {
    loadAsyncMock.mockRejectedValueOnce(new Error("Some other read error"));

    await expect(extractPackageContents(mockFile)).rejects.toThrow(
      "Some other read error"
    );
  });

  it("extracts readme, changelog, manifest, icon and virtual files correctly", async () => {
    loadAsyncMock.mockResolvedValueOnce(undefined);

    const mockManifestData = {
      version_number: "1.2.3",
      name: "MockMod",
      description: "A cool mod",
      dependencies: ["author-dep-1.0.0"],
    };

    fileMock.mockImplementation((filename: string) => {
      if (filename === "README.md") {
        return { async: vi.fn().mockResolvedValue("Mock README") };
      }
      if (filename === "CHANGELOG.md") {
        return { async: vi.fn().mockResolvedValue("Mock CHANGELOG") };
      }
      if (filename === "manifest.json") {
        return {
          async: vi.fn().mockResolvedValue(JSON.stringify(mockManifestData)),
        };
      }
      if (filename === "icon.png") {
        return {
          async: vi.fn().mockResolvedValue(new Blob(["mock icon"])),
        };
      }
      return null;
    });

    forEachMock.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (callback: (relativePath: string, file: any) => void) => {
        // Skip root special file
        callback("README.md", { dir: false });

        // A standard folder
        callback("plugins/", { dir: true });

        // A nested file
        callback("plugins/mod.dll", {
          dir: false,
          async: vi.fn().mockResolvedValue(new Blob(["mock dll"])),
        });
      }
    );

    const result = await extractPackageContents(mockFile);

    expect(result.readme).toBe("Mock README");
    expect(result.changelog).toBe("Mock CHANGELOG");
    expect(result.manifest.version_number).toBe("1.2.3");
    expect(result.manifest.name).toBe("MockMod");
    expect(result.manifest.description).toBe("A cool mod");
    expect(result.manifest.dependencies).toEqual(["author-dep-1.0.0"]);
    expect(result.iconPreviewUrl).toBe("blob:http://localhost/mock-url");

    expect(result.virtualFiles.length).toBe(2);
    expect(result.virtualFiles[0].path).toBe("plugins/");
    expect(result.virtualFiles[1].path).toBe("plugins/mod.dll");
  });

  it("handles missing version, name, description, and dependencies gracefully", async () => {
    loadAsyncMock.mockResolvedValueOnce(undefined);

    fileMock.mockImplementation((filename: string) => {
      if (filename === "manifest.json") {
        return {
          async: vi.fn().mockResolvedValue(JSON.stringify({})),
        };
      }
      return null;
    });

    // Simulate empty files
    forEachMock.mockImplementation(() => {});

    const result = await extractPackageContents(mockFile);

    expect(result.manifest.version_number).toBeUndefined();
    expect(result.manifest.name).toBeUndefined();
    expect(result.manifest.description).toBeUndefined();
    expect(result.manifest.dependencies).toBeUndefined();
  });

  it("handles invalid manifest JSON", async () => {
    loadAsyncMock.mockResolvedValueOnce(undefined);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    fileMock.mockImplementation((filename: string) => {
      if (filename === "manifest.json") {
        return {
          async: vi.fn().mockResolvedValue("invalid json {"),
        };
      }
      return null;
    });

    forEachMock.mockImplementation(() => {});

    const result = await extractPackageContents(mockFile);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to parse manifest.json",
      expect.any(Error)
    );
    expect(result.manifest).toEqual({});
    consoleSpy.mockRestore();
  });

  it("handles icon reading failure", async () => {
    loadAsyncMock.mockResolvedValueOnce(undefined);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    fileMock.mockImplementation((filename: string) => {
      if (filename === "icon.png") {
        return {
          async: vi.fn().mockRejectedValue(new Error("blob error")),
        };
      }
      return null;
    });
    forEachMock.mockImplementation(() => {});

    const result = await extractPackageContents(mockFile);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to load icon.png",
      expect.any(Error)
    );
    expect(result.iconPreviewUrl).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("createNewPackageZip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateAsyncMock.mockResolvedValue(new Blob(["test"]));
  });

  it("creates a new zip with folder and icon", async () => {
    const virtualFiles = [
      { path: "folder/", content: undefined as any },
    ];
    const newIconFile = new File(["icon"], "icon.png");

    const result = await createNewPackageZip({
      virtualFiles,
      readmeContent: "test readme",
      changelogContent: "test changelog",
      newIconFile,
      packageName: "TestPackage",
      versionNumber: "1.0.0",
      packageDescription: "desc",
      dependencies: [],
      authorName: "Author",
    });

    expect(result).toBeInstanceOf(File);
    expect(result.name).toBe("Author-TestPackage-1.0.0.zip");
    expect(folderMock).toHaveBeenCalledWith("folder/");
    expect(fileMock).toHaveBeenCalledWith("README.md", "test readme");
    expect(fileMock).toHaveBeenCalledWith("CHANGELOG.md", "test changelog");
  });

  it("handles missing package details for zip name", async () => {
    const result = await createNewPackageZip({
      virtualFiles: [],
      readmeContent: null,
      changelogContent: null,
      newIconFile: null,
      packageName: "",
      versionNumber: "",
      packageDescription: "",
      dependencies: [],
      authorName: "",
    });

    expect(result.name).toBe("package.zip");
  });
});

describe("repackageExistingZip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateAsyncMock.mockResolvedValue(new Blob(["test"]));
    loadAsyncMock.mockResolvedValue(undefined as any);
  });

  it("repackages an existing zip correctly", async () => {
    fileMock.mockReturnValue({
      async: vi.fn().mockResolvedValue(JSON.stringify({ dependencies: ["dep-name-1"] })),
    });

    const result = await repackageExistingZip({
      originalZipBuffer: new ArrayBuffer(0),
      virtualFiles: [
        { path: "test.txt", content: new File(["txt"], "test.txt") },
        { path: "folder/", content: undefined as unknown as File }
      ],
      readmeContent: "new readme",
      changelogContent: "new changelog",
      newIconFile: new File(["icon"], "icon.png"),
      packageName: "p2",
      versionNumber: "2.0.0",
      packageDescription: "new desc",
      dependencies: [{ namespace: "hello", name: "world", version: "1.0.0" }],
      authorName: "TestAuthor",
      originalFileName: "orig.zip",
    });

    expect(result.name).toBe("TestAuthor-p2-2.0.0.zip");
    expect(folderMock).toHaveBeenCalledWith("folder/");
    expect(fileMock).toHaveBeenCalledWith("README.md", "new readme");
    expect(fileMock).toHaveBeenCalledWith(
      "manifest.json",
      expect.stringContaining("hello-world-1.0.0")
    );
  });

  it("handles repackaging failures gracefully", async () => {
    fileMock.mockReturnValue({
      async: vi.fn().mockRejectedValue(new Error("Parse fail")),
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await repackageExistingZip({
      originalZipBuffer: new ArrayBuffer(0),
      virtualFiles: [],
      readmeContent: null,
      changelogContent: null,
      newIconFile: null,
      packageName: "",
      versionNumber: "",
      packageDescription: "",
      dependencies: [],
      authorName: "",
      originalFileName: "",
    });

    expect(result.name).toBe("package.zip");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
