import { Buffer } from "buffer";
import * as path from "path-browserify";

import LoggerProvider, { LogSeverity } from "../../providers/LoggerProvider";
import PathResolver from "../../r2mm/manager/PathResolver";
import { ProfileApiClient } from "../../services/ProfileApiClient";
import FsProvider from "../FsProvider";
import ProfileProvider from "../ProfileProvider";

export default class ElectronProfileProvider extends ProfileProvider {
  public async ensureProfileDirectory(
    directory: string,
    profile: string
  ): Promise<void> {
    const target = path.join(directory, profile);
    try {
      if (!(await FsProvider.instance.exists(target))) {
        await FsProvider.instance.mkdirs(target);
      }
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `[ElectronProfileProvider] Failed to ensure directory: ${target}`,
        e
      );
      throw e;
    }
  }

  public async createProfile(profile: string): Promise<void> {
    const root = path.join(PathResolver.MOD_ROOT, "profiles");
    await this.ensureProfileDirectory(root, profile);
    LoggerProvider.instance.Log(
      LogSeverity.INFO,
      `Created profile: ${profile}`
    );
  }

  public async renameProfile(oldName: string, newName: string): Promise<void> {
    const root = path.join(PathResolver.MOD_ROOT, "profiles");
    const oldPath = path.join(root, oldName);
    const newPath = path.join(root, newName);

    // Check if new name exists
    if (await FsProvider.instance.exists(newPath)) {
      throw new Error(`Profile ${newName} already exists`);
    }

    try {
      await FsProvider.instance.rename(oldPath, newPath);
      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Renamed profile: ${oldName} -> ${newName}`
      );
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `[ElectronProfileProvider] Failed to rename profile: ${oldName} -> ${newName}`,
        e
      );
      throw e;
    }
  }

  public async deleteProfile(profile: string): Promise<void> {
    const root = path.join(PathResolver.MOD_ROOT, "profiles");
    const profilePath = path.join(root, profile);

    try {
      if (await FsProvider.instance.exists(profilePath)) {
        await FsProvider.instance.rmdir(profilePath);
        LoggerProvider.instance.Log(
          LogSeverity.INFO,
          `Deleted profile: ${profile}`
        );
      }
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `[ElectronProfileProvider] Failed to delete profile: ${profile}`,
        e
      );
      throw e;
    }
  }

  public async importProfile(
    sourceFile: string,
    newName: string
  ): Promise<void> {
    const root = path.join(PathResolver.MOD_ROOT, "profiles");
    const target = path.join(root, newName);

    try {
      if (await FsProvider.instance.exists(target)) {
        throw new Error(`Profile ${newName} already exists`);
      }
      // Ensure target directory exists (though extractZip might do it? AdmZip usually needs dest dir)
      await FsProvider.instance.mkdirs(target);
      await window.electronAPI.extractZip(sourceFile, target);
      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Imported profile from ${sourceFile} to ${newName}`
      );
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `[ElectronProfileProvider] Failed to import profile: ${sourceFile} -> ${newName}`,
        e
      );
      // Clean up on failure?
      throw e;
    }
  }

  public async importProfileCode(code: string, newName: string): Promise<void> {
    const PROFILE_DATA_PREFIX = "#r2modman";
    const profileData = await ProfileApiClient.getProfile(code);

    if (!profileData.startsWith(PROFILE_DATA_PREFIX)) {
      throw new Error("Invalid profile data received/encoded");
    }

    const b64 = profileData.substring(PROFILE_DATA_PREFIX.length).trim();
    // Decode base64 to a temporary file
    const tempDir = path.join(PathResolver.APPDATA_DIR, "_temp_imports");
    await FsProvider.instance.mkdirs(tempDir);
    const tempFile = path.join(tempDir, `import_${Date.now()}.r2z`);

    try {
      await window.electronAPI.fs.writeFileBase64(tempFile, b64);
      await this.importProfile(tempFile, newName);
    } finally {
      // Cleanup temp file
      if (await FsProvider.instance.exists(tempFile)) {
        await FsProvider.instance.unlink(tempFile);
      }
    }
  }

  public async exportProfile(profile: string): Promise<string> {
    const root = path.join(PathResolver.MOD_ROOT, "profiles");
    const profilePath = path.join(root, profile);

    const cacheDir = PathResolver.APPDATA_DIR;
    const exportDir = path.join(PathResolver.ROOT, "exports");
    if (!(await FsProvider.instance.exists(exportDir))) {
      await FsProvider.instance.mkdirs(exportDir);
    }
    const exportPath = path.join(exportDir, `${profile}.r2z`);

    try {
      await window.electronAPI.createZip(profilePath, exportPath);
      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Exported profile ${profile} to ${exportPath}`
      );
      return exportPath;
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `[ElectronProfileProvider] Failed to export profile: ${profile}`,
        e
      );
      throw e;
    }
  }

  public async exportProfileCode(profile: string): Promise<string> {
    const filePath = await this.exportProfile(profile);
    const base64Content = await window.electronAPI.fs.readFileBase64(filePath);

    const PROFILE_DATA_PREFIX = "#r2modman";
    const payload = PROFILE_DATA_PREFIX + base64Content;

    return ProfileApiClient.createProfile(payload);
  }
}
