import { beforeEach, describe, expect, it, vi } from "vitest";

import { extractPackageContents } from "./zipUtils";

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
