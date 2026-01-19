import ManifestV2 from "../../model/ManifestV2";
import { ImmutableProfile } from "../../model/Profile";
import R2Error from "../../model/errors/R2Error";
import LoggerProvider, { LogSeverity } from "../LoggerProvider";
import ProfileInstallerProvider from "../ProfileInstallerProvider";

export default class ElectronProfileInstallerProvider extends ProfileInstallerProvider {
  async uninstallMod(
    mod: ManifestV2,
    profile: ImmutableProfile
  ): Promise<R2Error | null> {
    try {
      const api = window.electronAPI;
      const profilePath = await profile.getProfilePath();
      const modName = mod.getName();
      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Uninstalling mod: ${modName} from ${profilePath}`
      );

      // Try to remove from plugins
      const pluginsDir = await api.pathJoin(
        profilePath,
        "BepInEx",
        "plugins",
        modName
      );
      if (await api.fs.exists(pluginsDir)) {
        LoggerProvider.instance.Log(
          LogSeverity.INFO,
          `Removing plugin directory: ${pluginsDir}`
        );
        await api.fs.rmdir(pluginsDir);
      }

      // Try to remove from disabled plugins (if it was disabled)
      const disabledDir = await api.pathJoin(
        profilePath,
        "BepInEx",
        "plugins_disabled",
        modName
      );
      if (await api.fs.exists(disabledDir)) {
        LoggerProvider.instance.Log(
          LogSeverity.INFO,
          `Removing disabled plugin directory: ${disabledDir}`
        );
        await api.fs.rmdir(disabledDir);
      }

      return null;
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Uninstall failed for ${mod.getName()}: ${e.message}`,
        e
      );
      return new R2Error("Uninstall failed", e.message);
    }
  }

  async disableMod(
    mod: ManifestV2,
    profile: ImmutableProfile
  ): Promise<R2Error | void> {
    try {
      const api = window.electronAPI;
      const profilePath = await profile.getProfilePath();
      const modName = mod.getName();
      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Disabling mod: ${modName}`
      );

      const pluginsDir = await api.pathJoin(
        profilePath,
        "BepInEx",
        "plugins",
        modName
      );
      const disabledDir = await api.pathJoin(
        profilePath,
        "BepInEx",
        "plugins_disabled",
        modName
      );

      // If already disabled (exists in disabledDir), just return
      if (await api.fs.exists(disabledDir)) {
        // If it also exists in plugins (weird state), remove it from plugins
        if (await api.fs.exists(pluginsDir)) {
          LoggerProvider.instance.Log(
            LogSeverity.WARNING,
            `Mod ${modName} found in both plugins and disabled. Cleaning up plugins.`
          );
          await api.fs.rmdir(pluginsDir);
        }
        return;
      }

      if (await api.fs.exists(pluginsDir)) {
        await api.fs.mkdirs(
          await api.pathJoin(profilePath, "BepInEx", "plugins_disabled")
        );
        // Copy to disabled
        await api.fs.copy(pluginsDir, disabledDir);
        // Remove original
        await api.fs.rmdir(pluginsDir);
      } else {
        LoggerProvider.instance.Log(
          LogSeverity.INFO,
          `Mod ${modName} not found in plugins directory during disable. Assuming files are already removed.`
        );
      }
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Failed to disable mod ${mod.getName()}: ${e.message}`,
        e
      );
      return new R2Error("Failed to disable mod", e.message);
    }
  }

  async enableMod(
    mod: ManifestV2,
    profile: ImmutableProfile
  ): Promise<R2Error | void> {
    try {
      const api = window.electronAPI;
      const profilePath = await profile.getProfilePath();
      const modName = mod.getName();
      LoggerProvider.instance.Log(LogSeverity.INFO, `Enabling mod: ${modName}`);

      const pluginsDir = await api.pathJoin(
        profilePath,
        "BepInEx",
        "plugins",
        modName
      );
      const disabledDir = await api.pathJoin(
        profilePath,
        "BepInEx",
        "plugins_disabled",
        modName
      );

      if (await api.fs.exists(pluginsDir)) {
        // If it also exists in disabled (weird state), remove it from disabled
        if (await api.fs.exists(disabledDir)) {
          LoggerProvider.instance.Log(
            LogSeverity.WARNING,
            `Mod ${modName} found in both plugins and disabled. Cleaning up disabled.`
          );
          await api.fs.rmdir(disabledDir);
        }
        return; // Already enabled
      }

      if (await api.fs.exists(disabledDir)) {
        await api.fs.mkdirs(
          await api.pathJoin(profilePath, "BepInEx", "plugins")
        );
        // Copy to plugins
        await api.fs.copy(disabledDir, pluginsDir);
        // Remove from disabled
        await api.fs.rmdir(disabledDir);
      } else {
        LoggerProvider.instance.Log(
          LogSeverity.WARNING,
          `Mod ${modName} not found in disabled directory, cannot enable.`
        );
      }
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Failed to enable mod ${mod.getName()}: ${e.message}`,
        e
      );
      return new R2Error("Failed to enable mod", e.message);
    }
  }

  async installMod(
    mod: ManifestV2,
    profile: ImmutableProfile
  ): Promise<R2Error | null> {
    try {
      const api = window.electronAPI;
      const profilePath = await profile.getProfilePath();
      const cachePath = await api.getPath("userData"); // using UserData/cache for now
      const modCacheDir = await api.pathJoin(
        cachePath,
        "cache",
        mod.getName(),
        mod.getVersionNumber().toString()
      );

      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Installing mod ${mod.getName()} v${mod.getVersionNumber()} to ${profilePath}`
      );

      if (!(await api.fs.exists(modCacheDir))) {
        const err = `Mod files not found in cache: ${modCacheDir}`;
        LoggerProvider.instance.Log(LogSeverity.ERROR, err);
        return new R2Error("Install failed", err);
      }

      // Check if this is a BepInEx pack (contains BepInEx folder at root)
      // or follows the root install pattern.
      const rootFiles = await api.fs.readdir(modCacheDir);

      // Heuristic: If it contains "BepInEx" folder or "winhttp.dll", assume it is a loader pack
      // that needs to go to the profile root.
      const isLoaderPack =
        rootFiles.includes("BepInEx") &&
        (rootFiles.includes("winhttp.dll") || rootFiles.includes("core"));

      if (
        isLoaderPack ||
        (rootFiles.includes("BepInEx") &&
          rootFiles.includes("doorstop_config.ini"))
      ) {
        LoggerProvider.instance.Log(
          LogSeverity.INFO,
          `Installing Loader Pack ${mod.getName()} to Profile Root`
        );
        await api.fs.copy(modCacheDir, profilePath);
        return null;
      }

      // Install to BepInEx/plugins/<ModName>/
      // We install strictly to plugins.

      const pluginsDir = await api.pathJoin(
        profilePath,
        "BepInEx",
        "plugins",
        mod.getName()
      );

      // Remove existing directory to ensure clean install (including disabled version)
      if (await api.fs.exists(pluginsDir)) {
        await api.fs.rmdir(pluginsDir);
      }

      const disabledDir = await api.pathJoin(
        profilePath,
        "BepInEx",
        "plugins_disabled",
        mod.getName()
      );
      if (await api.fs.exists(disabledDir)) {
        await api.fs.rmdir(disabledDir);
      }

      // Ensure target dir exists
      await api.fs.mkdirs(pluginsDir);

      // Recursive copy from cache to pluginsDir
      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Copying files to ${pluginsDir}`
      );
      await api.fs.copy(modCacheDir, pluginsDir);

      return null;
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Install failed for ${mod.getName()}: ${e.message}`,
        e
      );
      return new R2Error("Install failed", e.message);
    }
  }
}
