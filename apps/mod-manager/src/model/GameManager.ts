import { Ecosystem } from "../data/ecosystem";
import { Platform } from "../data/ecosystemTypes";
import FsProvider from "../providers/FsProvider";
import PathResolver from "../r2mm/manager/PathResolver";
import Game from "./Game";
import StorePlatformMetadata from "./StorePlatformMetadata";

export default class GameManager {
  private static _activeGame: Game;

  static get activeGame(): Game {
    return this._activeGame;
  }

  static set activeGame(game: Game) {
    this._activeGame = game;
  }

  // Used for loading game specific settings before game is selected.
  static get defaultGame(): Game {
    return this.gameList.find(
      (value) => value.internalFolderName === "RiskOfRain2"
    )!;
  }

  static get gameList(): Game[] {
    return Ecosystem.supportedGames.map(
      (game) =>
        new Game(
          game.meta.displayName,
          game.internalFolderName,
          game.settingsIdentifier,
          game.steamFolderName,
          game.exeNames,
          game.dataFolderName,
          game.packageIndex,
          game.distributions.map(
            (x) =>
              new StorePlatformMetadata(x.platform, x.identifier || undefined)
          ),
          game.meta.iconUrl || "thunderstore-beta.webp",
          game.gameSelectionDisplayMode,
          game.gameInstanceType,
          game.packageLoader,
          game.additionalSearchStrings,
          game.communityIdentifier
        )
    );
  }

  public static async activate(game: Game) {
    this._activeGame = game;
    // Platform isn't strictly needed for folder setup, but if we had it we'd set it here.

    const api = window.electronAPI;
    const root = PathResolver.ROOT;
    const modRoot = api
      ? await api.pathJoin(root, game.internalFolderName)
      : `${root}/${game.internalFolderName}`;

    PathResolver.MOD_ROOT = modRoot;
    await FsProvider.instance.mkdirs(modRoot);
  }

  public static findByFolderName(name?: string | null) {
    return name
      ? this.gameList.find((game) => game.internalFolderName === name)
      : undefined;
  }
}
