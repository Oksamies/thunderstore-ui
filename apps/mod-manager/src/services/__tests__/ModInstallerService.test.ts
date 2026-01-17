import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ImmutableProfile } from "../../model/Profile";
import ThunderstoreCombo from "../../model/ThunderstoreCombo";
import ThunderstoreMod from "../../model/ThunderstoreMod";
import ThunderstoreVersion from "../../model/ThunderstoreVersion";
import VersionNumber from "../../model/VersionNumber";
import R2Error from "../../model/errors/R2Error";
import ProfileInstallerProvider from "../../providers/ProfileInstallerProvider";
import ProfileModList from "../../r2mm/mods/ProfileModList";
import ModInstallerService from "../ModInstallerService";

// Mock dependencies
vi.mock("axios");
vi.mock("../../model/GameManager", () => ({
  default: {
    activeGame: {
      thunderstoreUrl: "https://thunderstore.io/api/experimental/package",
    },
  },
}));
vi.mock("../../providers/ProfileInstallerProvider", () => ({
  default: {
    instance: {
      installMod: vi.fn().mockResolvedValue(null),
      uninstallMod: vi.fn().mockResolvedValue(null),
      disableMod: vi.fn().mockResolvedValue(null),
      enableMod: vi.fn().mockResolvedValue(null),
    },
  },
}));

// Mock ProfileProvider to avoid initialization error in ImmutableProfile
vi.mock("../../providers/ProfileProvider", () => ({
  default: {
    instance: {
      ensureProfileDirectory: vi.fn(),
    },
  },
}));

vi.mock("../../r2mm/mods/ProfileModList", () => ({
  default: {
    addMod: vi.fn().mockResolvedValue([]),
    removeMod: vi.fn().mockResolvedValue([]),
  },
}));

describe("ModInstallerService", () => {
  let mockElectronAPI: any;

  beforeEach(() => {
    // Setup Window Mock
    mockElectronAPI = {
      getPath: vi.fn().mockResolvedValue("/mock/userData"),
      pathJoin: vi.fn((...args) => Promise.resolve(args.join("/"))),
      downloadFile: vi.fn().mockResolvedValue(undefined),
      extractZip: vi.fn().mockResolvedValue(true),
      fs: {
        mkdirs: vi.fn().mockResolvedValue(undefined),
        exists: vi.fn().mockResolvedValue(true), // Default to true, override in tests
        readFile: vi.fn(),
        rmdir: vi.fn().mockResolvedValue(undefined),
        copy: vi.fn().mockResolvedValue(undefined),
      },
    };
    (window as any).electronAPI = mockElectronAPI;

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should install a mod without dependencies", async () => {
    // Setup Mod Data
    const mod = new ThunderstoreMod();
    const version = new ThunderstoreVersion();
    version.setVersionNumber(new VersionNumber("1.0.0"));
    version.setDownloadUrl("http://example.com/mod.zip");
    version.setFullName("Author-ModName-1.0.0");
    version.setDescription("Test Description");
    mod.setLatestVersion("1.0.0");
    mod.setName("ModName");
    mod.setOwner("Author");

    const combo = new ThunderstoreCombo();
    combo.setMod(mod);
    combo.setVersion(version);

    const profile = new ImmutableProfile("Default");

    // Mock Manifest read
    mockElectronAPI.fs.readFile.mockResolvedValue(
      JSON.stringify({
        name: "ModName",
        version_number: "1.0.0",
        website_url: "",
        description: "Test Description",
        dependencies: [],
      })
    );

    // Mock exists to return false for ZIP file (trigger download) and true for manifest (allow finalize)
    mockElectronAPI.fs.exists.mockImplementation(async (path: string) => {
      if (path.endsWith(".zip")) return false;
      return true;
    });

    // Execute
    const result = await ModInstallerService.install(combo, profile);

    // Assert
    expect(result).toBeUndefined(); // Success returns void/undefined
    expect(mockElectronAPI.downloadFile).toHaveBeenCalledWith(
      "http://example.com/mod.zip",
      expect.stringContaining("Author-ModName-1.0.0.zip")
    );
    expect(mockElectronAPI.extractZip).toHaveBeenCalled();
    expect(ProfileInstallerProvider.instance.installMod).toHaveBeenCalled();
    expect(ProfileModList.addMod).toHaveBeenCalled();
  });

  it("should resolve and install dependencies", async () => {
    // Setup Mod with Dependency
    const mod = new ThunderstoreMod();
    const version = new ThunderstoreVersion();
    version.make({
      version_number: "1.0.0",
      full_name: "Author-ChildMod-1.0.0",
      download_url: "http://example.com/child.zip",
      dependencies: ["Author-ParentMod-1.0.0"],
      description: "Child Mod",
    });
    mod.setLatestVersion("1.0.0");

    const combo = new ThunderstoreCombo();
    combo.setMod(mod);
    combo.setVersion(version);

    const profile = new ImmutableProfile("Default");

    // Mock Axios Response for Dependency
    (axios.get as any).mockResolvedValue({
      data: {
        versions: [
          {
            version_number: "1.0.0",
            full_name: "Author-ParentMod-1.0.0",
            download_url: "http://example.com/parent.zip",
            dependencies: [],
          },
        ],
      },
    });

    // Mock Manifests and Exists
    mockElectronAPI.fs.exists.mockResolvedValue(true);

    mockElectronAPI.fs.readFile.mockImplementation(async (path: string) => {
      if (path.includes("ChildMod")) {
        return JSON.stringify({
          name: "ChildMod",
          version_number: "1.0.0",
          dependencies: ["Author-ParentMod-1.0.0"],
        });
      } else if (path.includes("ParentMod")) {
        return JSON.stringify({
          name: "ParentMod",
          version_number: "1.0.0",
          dependencies: [],
        });
      }
      return "{}";
    });

    // Execute
    await ModInstallerService.install(combo, profile);

    // Assert
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("Author/ParentMod")
    );
    // Should install both
    expect(ProfileInstallerProvider.instance.installMod).toHaveBeenCalledTimes(
      2
    );
  });

  it("should handle installation errors", async () => {
    const mod = new ThunderstoreMod();
    const version = new ThunderstoreVersion();
    version.setVersionNumber(new VersionNumber("1.0.0"));
    version.setFullName("Author-ErrorMod-1.0.0");
    version.setDownloadUrl("http://example.com/error.zip"); // Ensure it has a url

    const combo = new ThunderstoreCombo();
    combo.setMod(mod);
    combo.setVersion(version);
    const profile = new ImmutableProfile("Default");

    mockElectronAPI.downloadFile.mockRejectedValue(new Error("Network Error"));
    // Force download by saying zip does not exist
    mockElectronAPI.fs.exists.mockImplementation(async (path: string) => {
      if (path.endsWith(".zip")) return false;
      return true;
    });

    // Execute
    const result = await ModInstallerService.install(combo, profile);

    // Assert
    expect(result).toBeInstanceOf(R2Error);
    expect((result as R2Error).name).toBe("Install failed");
    expect((result as R2Error).message).toContain("Network Error");
  });

  it("should install local mod from zip", async () => {
    const filePath = "C:/Downloads/MyLocalMod.zip";
    const profile = new ImmutableProfile("Default");

    // Mock manifest found in temp
    mockElectronAPI.fs.readFile.mockResolvedValue(
      JSON.stringify({
        name: "MyLocalMod",
        version_number: "1.0.0",
        description: "Local Mod",
      })
    );

    mockElectronAPI.fs.exists.mockResolvedValue(true);

    const result = await ModInstallerService.installLocalMod(filePath, profile);

    expect(result).toBeUndefined();
    expect(mockElectronAPI.extractZip).toHaveBeenCalledWith(
      filePath,
      expect.stringContaining("temp_install")
    );
    expect(mockElectronAPI.fs.copy).toHaveBeenCalled(); // Copy temp to cache
    expect(ProfileInstallerProvider.instance.installMod).toHaveBeenCalled();
  });
});
