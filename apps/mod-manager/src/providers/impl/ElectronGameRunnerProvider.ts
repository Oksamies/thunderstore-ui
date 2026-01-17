import path from "path-browserify";

import { Loader } from "../../data/ecosystemTypes";
import Game from "../../model/Game";
import Profile from "../../model/Profile";
import ManagerSettings from "../../r2mm/manager/ManagerSettings";
import GameResolverService from "../../services/GameResolverService";
import GameRunnerProvider from "../GameRunnerProvider";
import LoggerProvider, { LogSeverity } from "../LoggerProvider";

export default class ElectronGameRunnerProvider extends GameRunnerProvider {
  // Cache steam path
  private steamPath: string | null = null;

  private async getSteamExecutable(): Promise<string> {
    const steamPath = await GameResolverService.getSteamInstallPath();
    if (steamPath) {
      const exePath = await window.electronAPI.pathJoin(steamPath, "Steam.exe");
      if (await window.electronAPI.fs.exists(exePath)) {
        return exePath;
      } else {
        LoggerProvider.instance.Log(
          LogSeverity.WARNING,
          `Steam.exe not found at ${exePath}`
        );
      }
    } else {
      LoggerProvider.instance.Log(
        LogSeverity.WARNING,
        `Steam install path could not be resolved.`
      );
    }
    return "";
  }

  private async resolveGamePath(game: Game): Promise<string> {
    const path = await GameResolverService.resolveGamePath(game);
    if (!path) {
      LoggerProvider.instance.Log(
        LogSeverity.WARNING,
        `Could not resolve game path for ${game.displayName} (${game.internalFolderName})`
      );
    } else {
      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Resolved game path for ${game.displayName}: ${path}`
      );
    }
    return path || "";
  }

  // Constructing the Doorstop arguments
  private async getModdedArgs(game: Game, profile: Profile): Promise<string[]> {
    const loader = game.packageLoader;
    const profilePath = await profile.getProfilePath();

    LoggerProvider.instance.Log(
      LogSeverity.INFO,
      `Generating modded arguments for ${game.displayName}. Loader: ${loader}`
    );

    if (loader === Loader.MELONLOADER) {
      return ["--melonloader.basedir", profilePath];
    }

    if (loader === Loader.NORTHSTAR) {
      return ["-northstar", `-profile="${profilePath}"`];
    }

    // Default to BepInEx logic for now if strictly BepInEx or unknown
    // (Legacy r2modman often defaults to BepInEx for Unity games)
    if (loader === Loader.BEPINEX) {
      const bepInExCore = await window.electronAPI.pathJoin(
        profilePath,
        "BepInEx",
        "core"
      );

      // Find Preloader
      let preloader = "BepInEx.Preloader.dll";
      try {
        const files = await window.electronAPI.fs.readdir(bepInExCore);
        const found = files.find((x) =>
          [
            "BepInEx.Unity.Mono.Preloader.dll",
            "BepInEx.Unity.IL2CPP.dll",
            "BepInEx.Preloader.dll",
            "BepInEx.IL2CPP.dll",
          ].includes(x)
        );
        if (found) {
          preloader = found;
        } else {
          LoggerProvider.instance.Log(
            LogSeverity.WARNING,
            "Could not find standard Preloader dll, defaulting to BepInEx.Preloader.dll"
          );
        }
      } catch (e) {
        LoggerProvider.instance.Log(
          LogSeverity.WARNING,
          "Could not list BepInEx/core, assuming BepInEx.Preloader.dll"
        );
      }

      const target = await window.electronAPI.pathJoin(bepInExCore, preloader);
      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Doorstop Target: ${target}`
      );

      return ["--doorstop-enable", "true", "--doorstop-target", target];
    }

    return [];
  }

  private async ensureDoorstop(game: Game, profile: Profile): Promise<void> {
    const gamePath = await this.resolveGamePath(game);
    if (!gamePath) {
      LoggerProvider.instance.Log(
        LogSeverity.WARNING,
        "Could not find game path, skipping Doorstop deployment."
      );
      return;
    }

    // Doorstop deployment only for BepInEx
    if (game.packageLoader !== Loader.BEPINEX) {
      return;
    }

    const profilePath = await profile.getProfilePath();

    // Look for winhttp.dll in profile
    // Usually in Profile Root (if installed via my new logic)
    // or in BepInExPack folder if older install.

    const sourceName = "winhttp.dll";
    const sourcePath = await window.electronAPI.pathJoin(
      profilePath,
      sourceName
    );

    if (await window.electronAPI.fs.exists(sourcePath)) {
      const targetPath = await window.electronAPI.pathJoin(
        gamePath,
        sourceName
      );
      // Copy if not exists or if different?
      // Just overwrite.
      await window.electronAPI.fs.copy(sourcePath, targetPath);
      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Deployed ${sourceName} to ${targetPath}`
      );
    } else {
      LoggerProvider.instance.Log(
        LogSeverity.WARNING,
        `Could not find ${sourceName} in profile at ${sourcePath}. Game might not load mods.`
      );
    }

    // Also deploy doorstop_config.ini if we want to enforce defaults,
    // but we pass args so it's less critical.
  }

  async startModded(game: Game, profile: Profile): Promise<void> {
    try {
      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Launching ${game.displayName} (Modded)`
      );
      await this.ensureDoorstop(game, profile);
      const args = await this.getModdedArgs(game, profile);

      // Append User-Defined Launch Parameters
      const settingsLaunchParams =
        ManagerSettings.instance.getLaunchParameters(game);
      if (settingsLaunchParams) {
        LoggerProvider.instance.Log(
          LogSeverity.INFO,
          `Adding Custom Launch Params: ${settingsLaunchParams}`
        );
        // Basic argument parser favoring quoted strings
        const regex = /[^\s"]+|"([^"]*)"/gi;
        let match;
        const customArgs = [];
        while ((match = regex.exec(settingsLaunchParams)) !== null) {
          // match[1] is the content of quotes if matched, match[0] is the whole match otherwise
          customArgs.push(match[1] ? match[1] : match[0]);
        }
        args.push(...customArgs);
      }

      const appId = game.activePlatform.storeIdentifier;

      const steamExe = await this.getSteamExecutable();

      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Steam Executable: ${steamExe || "Not Found, using Protocol"}`
      );
      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Launch Args: ${args.join(" ")}`
      );

      if (steamExe) {
        // Use direct executable
        await window.electronAPI.spawn(
          `"${steamExe}"`,
          ["-applaunch", appId, ...args],
          "."
        );
      } else {
        // Fallback to protocol
        // For protocol, we need a single string encoded
        // args array to string:
        const argsStr = args
          .map((a) => (a.includes(" ") ? `"${a}"` : a))
          .join(" ");
        const command = `start steam://run/${appId}//${encodeURIComponent(
          argsStr
        )}`;
        LoggerProvider.instance.Log(
          LogSeverity.INFO,
          `Launch Command: ${command}`
        );
        await window.electronAPI.spawn(command, [], ".");
      }
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Failed to launch game: ${e.message}`,
        e
      );
    }
  }

  async startVanilla(game: Game, profile: Profile): Promise<void> {
    try {
      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Launching ${game.displayName} (Vanilla)`
      );
      const appId = game.activePlatform.storeIdentifier;
      const steamExe = await this.getSteamExecutable();

      let args: string[] = [];
      if (game.packageLoader === Loader.BEPINEX) {
        args = ["--doorstop-enable", "false"];
      } else if (game.packageLoader === Loader.MELONLOADER) {
        args = ["--no-mods"];
      } else if (game.packageLoader === Loader.NORTHSTAR) {
        args = ["-vanilla"];
      }

      // Append User-Defined Launch Parameters
      const settingsLaunchParams =
        ManagerSettings.instance.getLaunchParameters(game);
      if (settingsLaunchParams) {
        LoggerProvider.instance.Log(
          LogSeverity.INFO,
          `Adding Custom Launch Params: ${settingsLaunchParams}`
        );
        // Simple split by space, respecting quotes would be better but simple for now
        args.push(...settingsLaunchParams.split(" "));
      }

      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Launch Args: ${args.join(" ")}`
      );

      if (steamExe) {
        await window.electronAPI.spawn(
          `"${steamExe}"`,
          ["-applaunch", appId, ...args],
          "."
        );
      } else {
        // For protocol support, we might need to handle args differently if they contain spaces
        const argsStr = args
          .map((a) => (a.includes(" ") ? `"${a}"` : a))
          .join(" ");
        const command = `start steam://run/${appId}//${encodeURIComponent(
          argsStr
        )}`;
        LoggerProvider.instance.Log(
          LogSeverity.INFO,
          `Launch Command: ${command}`
        );
        await window.electronAPI.spawn(command, [], ".");
      }
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Failed to launch vanilla: ${e.message}`,
        e
      );
    }
  }
}
