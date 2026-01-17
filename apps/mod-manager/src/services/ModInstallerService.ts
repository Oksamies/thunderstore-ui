import axios from "axios";

import GameManager from "../model/GameManager";
import ManifestV2 from "../model/ManifestV2";
import { ImmutableProfile } from "../model/Profile";
import ThunderstoreCombo from "../model/ThunderstoreCombo";
import ThunderstoreVersion from "../model/ThunderstoreVersion";
import VersionNumber from "../model/VersionNumber";
import R2Error from "../model/errors/R2Error";
import LoggerProvider, { LogSeverity } from "../providers/LoggerProvider";
import ProfileInstallerProvider from "../providers/ProfileInstallerProvider";
import ProfileModList from "../r2mm/mods/ProfileModList";

export default class ModInstallerService {
  private static async resolveDependencies(
    mod: ThunderstoreVersion,
    resolved: Map<string, ThunderstoreVersion>
  ): Promise<void> {
    const dependencies = mod.getDependencies();

    for (const depString of dependencies) {
      if (resolved.has(depString)) continue;

      const parts = depString.split("-");
      if (parts.length < 3) continue;

      const versionStr = parts.pop()!;
      const name = parts.pop()!;
      const team = parts.join("-");

      try {
        const game = GameManager.activeGame;
        const packageIndex = game.thunderstoreUrl;
        const baseUrl = packageIndex.endsWith("/")
          ? packageIndex
          : packageIndex + "/";
        const url = `${baseUrl}${team}/${name}/`;

        const response = await axios.get(url);
        const modData = response.data;
        const versionData = modData.versions.find(
          (v: any) => v.version_number === versionStr
        );

        if (versionData) {
          const tsVersion = new ThunderstoreVersion();
          tsVersion.make(versionData);

          resolved.set(depString, tsVersion);
          await ModInstallerService.resolveDependencies(tsVersion, resolved);
        } else {
          LoggerProvider.instance.Log(
            LogSeverity.WARNING,
            `Dependency version not found: ${depString}`
          );
        }
      } catch (e) {
        LoggerProvider.instance.Log(
          LogSeverity.ERROR,
          `Failed to resolve dependency: ${depString}`,
          e
        );
      }
    }
  }

  static async install(
    mod: ThunderstoreCombo,
    profile: ImmutableProfile,
    progressCallback?: (status: string) => void
  ): Promise<R2Error | void> {
    const toInstall = new Map<string, ThunderstoreVersion>();
    toInstall.set(mod.getDependencyString(), mod.getVersion());

    try {
      const resolvingMsg = "Resolving dependencies...";
      LoggerProvider.instance.Log(LogSeverity.INFO, resolvingMsg);
      progressCallback?.(resolvingMsg);

      await ModInstallerService.resolveDependencies(
        mod.getVersion(),
        toInstall
      );

      const foundMsg = `Found ${toInstall.size} mods to install.`;
      LoggerProvider.instance.Log(LogSeverity.INFO, foundMsg);
      progressCallback?.(foundMsg);

      let i = 0;
      for (const [depId, version] of toInstall) {
        i++;
        const installMsg = `Installing ${depId}...`;
        LoggerProvider.instance.Log(LogSeverity.INFO, installMsg);
        progressCallback?.(`Installing ${i}/${toInstall.size}: ${depId}...`);
        await ModInstallerService.installSingle(version, profile);
      }
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Install failed: ${e.message}`
      );
      return new R2Error("Install failed", e.message);
    }
  }

  private static async installSingle(
    version: ThunderstoreVersion,
    profile: ImmutableProfile
  ): Promise<R2Error | void> {
    const api = window.electronAPI;
    const fullName = version.getFullName();

    const parts = fullName.split("-");
    const versionStr = parts.pop()!;
    const modName = parts.join("-");

    const downloadUrl = version.getDownloadUrl();

    try {
      const userData = await api.getPath("userData");
      const cacheDir = await api.pathJoin(
        userData,
        "cache",
        modName,
        versionStr
      );
      const zipPath = await api.pathJoin(
        cacheDir,
        `${modName}-${versionStr}.zip`
      );

      await api.fs.mkdirs(cacheDir);

      if (!(await api.fs.exists(zipPath))) {
        await api.downloadFile(downloadUrl, zipPath);
      }

      await api.extractZip(zipPath, cacheDir);

      return await ModInstallerService.finalizeInstallation(
        cacheDir,
        profile,
        modName,
        versionStr,
        version
      );
    } catch (e: any) {
      throw e;
    }
  }

  private static async finalizeInstallation(
    cacheDir: string,
    profile: ImmutableProfile,
    modName: string,
    versionStr: string,
    versionData?: ThunderstoreVersion | null
  ): Promise<R2Error | void> {
    const api = window.electronAPI;
    const manifestPath = await api.pathJoin(cacheDir, "manifest.json");
    let manifestV2 = new ManifestV2();
    if (await api.fs.exists(manifestPath)) {
      const content = await api.fs.readFile(manifestPath);
      const json = JSON.parse(content);
      manifestV2.setName(modName); // Use folder name as source of truth for ID if possible, or manifest name?
      // Manifest name might differ from TS name.
      // Usually we trust TS name.
      // For local install, we trust manifest.

      manifestV2.setVersionNumber(new VersionNumber(versionStr));
      manifestV2.setDisplayName(json.name || modName);
      manifestV2.setWebsiteUrl(json.website_url || "");
      manifestV2.setDescription(
        json.description || (versionData ? versionData.getDescription() : "")
      );
      manifestV2.setDependencies(
        json.dependencies || (versionData ? versionData.getDependencies() : [])
      );
    } else {
      return new R2Error(
        "Install failed",
        `No manifest.json found at ${manifestPath}`
      );
    }

    const installResult = await ProfileInstallerProvider.instance.installMod(
      manifestV2,
      profile
    );
    if (installResult instanceof R2Error) return installResult;

    const addResult = await ProfileModList.addMod(manifestV2, profile);
    if (addResult instanceof R2Error) return addResult;
  }

  static async installLocalMod(
    filePath: string,
    profile: ImmutableProfile
  ): Promise<R2Error | void> {
    try {
      const api = window.electronAPI;
      const userData = await api.getPath("userData");
      const tempDir = await api.pathJoin(
        userData,
        "temp_install",
        Date.now().toString()
      );
      await api.fs.mkdirs(tempDir);

      await api.extractZip(filePath, tempDir);

      // Read manifest to determine name/version
      const manifestPath = await api.pathJoin(tempDir, "manifest.json");
      if (!(await api.fs.exists(manifestPath))) {
        return new R2Error("Install failed", "No manifest.json found in zip");
      }

      const content = await api.fs.readFile(manifestPath);
      const json = JSON.parse(content);
      const name = json.name;
      const version = json.version_number;

      if (!name || !version) {
        return new R2Error(
          "Install failed",
          "Invalid manifest.json: missing name or version_number"
        );
      }

      // Move to proper cache: userData/cache/name/version
      const cacheDir = await api.pathJoin(userData, "cache", name, version);
      await api.fs.mkdirs(cacheDir); // Ensure parent exists

      // Copy files from temp to cache
      // Since we extracted to tempDir, let's copy the contents.
      // Actually, we can just copy tempDir to cacheDir.
      // But cacheDir might need to be the PARENT.

      // If cacheDir exists, clear it?
      if (await api.fs.exists(cacheDir)) {
        await api.fs.rmdir(cacheDir);
      }
      await api.fs.copy(tempDir, cacheDir);

      // Cleanup temp
      await api.fs.rmdir(tempDir);

      return await ModInstallerService.finalizeInstallation(
        cacheDir,
        profile,
        name,
        version,
        null
      );
    } catch (e: any) {
      return new R2Error("Install failed", e.message);
    }
  }

  static async uninstall(
    mod: ManifestV2,
    profile: ImmutableProfile
  ): Promise<R2Error | void> {
    const result = await ProfileInstallerProvider.instance.uninstallMod(
      mod,
      profile
    );
    if (result instanceof R2Error) return result;

    const removeResult = await ProfileModList.removeMod(mod, profile);
    if (removeResult instanceof R2Error) return removeResult;

    return;
  }

  static async disable(
    mod: ManifestV2,
    profile: ImmutableProfile
  ): Promise<R2Error | void> {
    const result = await ProfileInstallerProvider.instance.disableMod(
      mod,
      profile
    );
    if (result instanceof R2Error) return result;

    mod.disable();
    const updateResult = await ProfileModList.updateMod(mod, profile);
    if (updateResult instanceof R2Error) return updateResult;
  }

  static async enable(
    mod: ManifestV2,
    profile: ImmutableProfile
  ): Promise<R2Error | void> {
    const result = await ProfileInstallerProvider.instance.enableMod(
      mod,
      profile
    );
    if (result instanceof R2Error) return result;

    mod.enable();
    const updateResult = await ProfileModList.updateMod(mod, profile);
    if (updateResult instanceof R2Error) return updateResult;
  }
}
