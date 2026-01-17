import { parse as parseVdf } from "@node-steam/vdf";

import { Platform } from "../data/ecosystemTypes";
import Game from "../model/Game";
import LoggerProvider, { LogSeverity } from "../providers/LoggerProvider";
import ManagerSettings from "../r2mm/manager/ManagerSettings";

const STEAM_REGISTRY_PATH = "HKCU\\Software\\Valve\\Steam";
const STEAM_REGISTRY_KEY = "SteamPath";

export default class GameResolverService {
  /**
   * Attempts to find the installation logic for a given game.
   * Checks ManagerSettings override first, then platform specific logic.
   */
  public static async resolveGamePath(game: Game): Promise<string | null> {
    const api = window.electronAPI;

    // 1. Check Manual Override in Settings
    const manualPath = ManagerSettings.instance.getGameDirectory(game);
    if (manualPath && (await api.fs.exists(manualPath))) {
      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Using manual game path for ${game.displayName}: ${manualPath}`
      );
      return manualPath;
    }

    // 2. Platform Specific Detection
    if (game.activePlatform.storePlatform === Platform.STEAM) {
      return this.resolveSteamGame(game);
    }

    if (game.activePlatform.storePlatform === Platform.EPIC_GAMES_STORE) {
      return this.resolveEpicGame(game);
    }

    // TODO: Add Generic/Other platform support
    return null;
  }

  private static async resolveSteamGame(game: Game): Promise<string | null> {
    const api = window.electronAPI;
    const appId = game.activePlatform.storeIdentifier;

    try {
      const steamPath = await this.getSteamInstallPath();
      if (!steamPath) {
        LoggerProvider.instance.Log(
          LogSeverity.WARNING,
          `Steam path not found. Cannot resolve ${game.displayName} automatically.`
        );
        return null;
      }

      const libraryFoldersPath = await api.pathJoin(
        steamPath,
        "steamapps",
        "libraryfolders.vdf"
      );

      if (!(await api.fs.exists(libraryFoldersPath))) {
        // Fallback: Check default steamapps/common
        const defaultCommon = await api.pathJoin(
          steamPath,
          "steamapps",
          "common",
          game.steamFolderName
        );
        if (await api.fs.exists(defaultCommon)) {
          LoggerProvider.instance.Log(
            LogSeverity.INFO,
            `Found game at default path: ${defaultCommon}`
          );
          return defaultCommon;
        }
        return null;
      }

      const vdfContent = await api.fs.readFile(libraryFoldersPath);
      const vdf: any = parseVdf(vdfContent);

      // libraryfolders.vdf structure varies by version, but usually:
      // "libraryfolders" { "0" { "path" "..." "apps" { "123" "1" } } "1" { ... } }

      const libraries = vdf.libraryfolders || {};

      for (const key in libraries) {
        const lib = libraries[key];
        const apps = lib.apps || {};

        if (appId && apps[appId]) {
          // Found the library containing the game
          const libraryPath = lib.path; // Absolute path to library root
          const gamePath = await api.pathJoin(
            libraryPath,
            "steamapps",
            "common",
            game.steamFolderName
          );
          if (await api.fs.exists(gamePath)) {
            LoggerProvider.instance.Log(
              LogSeverity.INFO,
              `Found game via libraryfolders.vdf at: ${gamePath}`
            );
            return gamePath;
          }
        }
      }

      // Double check default library if not explicitly in vdf apps (rare)
      const defaultPath = await api.pathJoin(
        steamPath,
        "steamapps",
        "common",
        game.steamFolderName
      );
      if (await api.fs.exists(defaultPath)) return defaultPath;
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Failed to resolve Steam game ${game.displayName}: ${e.message}`,
        e
      );
    }
    return null;
  }

  public static async getSteamInstallPath(): Promise<string | null> {
    const api = window.electronAPI;

    // 1. Check Settings
    const settingsPath = ManagerSettings.instance.steamDirectory;
    if (settingsPath && (await api.fs.exists(settingsPath)))
      return settingsPath;

    // 2. Check Standard Paths (Fastest)
    const defaults = [
      "C:\\Program Files (x86)\\Steam",
      "C:\\Program Files\\Steam",
    ];
    for (const p of defaults) {
      if (await api.fs.exists(p)) {
        await ManagerSettings.instance.setSteamDirectory(p);
        LoggerProvider.instance.Log(
          LogSeverity.INFO,
          `Found Steam at default location: ${p}`
        );
        return p;
      }
    }

    // 3. Registry Check (Windows Only)
    try {
      const { stdout } = await api.exec(
        "reg query HKCU\\Software\\Valve\\Steam /v SteamPath"
      );
      // Parse: "    SteamPath    REG_SZ    c:/program files (x86)/steam"
      const match = stdout.match(/SteamPath\s+REG_SZ\s+(.+)/);
      if (match && match[1]) {
        let path = match[1].trim();
        // Registry might use forward slashes or backslashes. Normalize if needed.
        // fs.exists should handle both on Windows generally, but let's be safe.
        if (await api.fs.exists(path)) {
          await ManagerSettings.instance.setSteamDirectory(path);
          LoggerProvider.instance.Log(
            LogSeverity.INFO,
            `Found Steam via Registry at: ${path}`
          );
          return path;
        }
      }
    } catch (e: any) {
      // Registry check might fail on non-windows or if key missing. Log as info/warning.
      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Registry check for Steam failed: ${e.message}`
      );
    }

    return null;
  }

  private static async resolveEpicGame(game: Game): Promise<string | null> {
    // Basic EGS detection placeholder
    const api = window.electronAPI;
    const defaults = [
      "C:\\Program Files\\Epic Games",
      "C:\\Program Files (x86)\\Epic Games",
    ];

    for (const root of defaults) {
      const path = await api.pathJoin(root, game.internalFolderName); // EGS folder names can vary
      if (await api.fs.exists(path)) return path;
    }
    return null;
  }
}
