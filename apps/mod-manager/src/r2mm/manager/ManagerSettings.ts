import Game from "../../model/Game";
import GameManager from "../../model/GameManager";
import LoggerProvider, { LogSeverity } from "../../providers/LoggerProvider";
import PathResolver from "./PathResolver";

interface GameSettings {
  gameDirectory: string;
  launchParameters: string;
  lastSelectedProfile?: string;
}

interface GlobalSettings {
  steamDirectory: string;
  dataDirectory?: string;
  lastSelectedGame?: string;
  defaultGame?: string;
  favoriteGames?: string[];
  theme?: "dark" | "light";
}

interface SettingsSchema {
  global: GlobalSettings;
  games: Record<string, GameSettings>;
}

export default class ManagerSettings {
  private static _instance: ManagerSettings;
  private settings: SettingsSchema;

  private constructor() {
    this.settings = {
      global: {
        steamDirectory: "",
        theme: "dark",
      },
      games: {},
    };
  }

  public static get instance(): ManagerSettings {
    if (!this._instance) {
      this._instance = new ManagerSettings();
    }
    return this._instance;
  }

  private get configPath(): Promise<string> {
    // Assume PathResolver.CONFIG_DIR is set (done in App.tsx)
    return window.electronAPI.pathJoin(
      PathResolver.CONFIG_DIR,
      "settings.json"
    );
  }

  public async load(): Promise<void> {
    try {
      const api = window.electronAPI;
      const path = await this.configPath;
      if (await api.fs.exists(path)) {
        const content = await api.fs.readFile(path);
        const loaded = JSON.parse(content);
        // Merge loaded with default to ensure structure
        this.settings = {
          global: { ...this.settings.global, ...loaded.global },
          games: { ...this.settings.games, ...loaded.games },
        };
        LoggerProvider.instance.Log(
          LogSeverity.INFO,
          `Settings loaded from ${path}`
        );
      } else {
        LoggerProvider.instance.Log(
          LogSeverity.INFO,
          `No settings file found at ${path}, using defaults.`
        );
      }
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Failed to load settings: ${e.message}`,
        e
      );
    }
  }

  public async save(): Promise<void> {
    try {
      const api = window.electronAPI;
      await api.fs.mkdirs(PathResolver.CONFIG_DIR);
      const path = await this.configPath;
      await api.fs.writeFile(path, JSON.stringify(this.settings, null, 4));
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Failed to save settings: ${e.message}`,
        e
      );
    }
  }

  // Global Settings
  public get steamDirectory(): string {
    return this.settings.global.steamDirectory;
  }

  public async setSteamDirectory(path: string): Promise<void> {
    this.settings.global.steamDirectory = path;
    await this.save();
  }

  public get dataDirectory(): string | undefined {
    return this.settings.global.dataDirectory;
  }

  public async setDataDirectory(path: string): Promise<void> {
    this.settings.global.dataDirectory = path;
    await this.save();
  }

  public get lastSelectedGame(): string | undefined {
    return this.settings.global.lastSelectedGame;
  }

  public async setLastSelectedGame(gameIdentifier: string): Promise<void> {
    this.settings.global.lastSelectedGame = gameIdentifier;
    await this.save();
  }

  public get theme(): "dark" | "light" {
    return this.settings.global.theme || "dark";
  }

  public async setTheme(theme: "dark" | "light"): Promise<void> {
    this.settings.global.theme = theme;
    await this.save();
  }

  public get favoriteGames(): string[] {
    return this.settings.global.favoriteGames || [];
  }

  public async toggleFavorite(gameIdentifier: string): Promise<void> {
    const favorites = this.favoriteGames;
    if (favorites.includes(gameIdentifier)) {
      this.settings.global.favoriteGames = favorites.filter(
        (g) => g !== gameIdentifier
      );
    } else {
      this.settings.global.favoriteGames = [...favorites, gameIdentifier];
    }
    await this.save();
  }

  // Game Specific Settings
  private getGameSettings(game: Game): GameSettings {
    if (!this.settings.games[game.internalFolderName]) {
      this.settings.games[game.internalFolderName] = {
        gameDirectory: "",
        launchParameters: "",
      };
    }
    return this.settings.games[game.internalFolderName];
  }

  public getGameDirectory(game: Game): string {
    return this.getGameSettings(game).gameDirectory;
  }

  public async setGameDirectory(game: Game, path: string): Promise<void> {
    this.getGameSettings(game).gameDirectory = path;
    await this.save();
  }

  public getLaunchParameters(game: Game): string {
    return this.getGameSettings(game).launchParameters;
  }

  public async setLaunchParameters(game: Game, params: string): Promise<void> {
    this.getGameSettings(game).launchParameters = params;
    await this.save();
  }

  public getLastSelectedProfile(game: Game): string | undefined {
    return this.getGameSettings(game).lastSelectedProfile;
  }

  public async setLastSelectedProfile(
    game: Game,
    profile: string
  ): Promise<void> {
    this.getGameSettings(game).lastSelectedProfile = profile;
    await this.save();
  }
}
