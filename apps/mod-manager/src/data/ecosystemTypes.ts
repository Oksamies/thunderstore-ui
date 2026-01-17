export interface ThunderstoreEcosystem {
  communities: { [key: string]: ThunderstoreEcosyste };
  games: { [key: string]: Game };
  modloaderPackages: ModloaderPackage[];
  packageInstallers: { [key: string]: PackageInstaller };
  schemaVersion: string;
}

export interface ThunderstoreEcosyste {
  autolistPackageIds?: string[];
  categories: { [key: string]: Category };
  discordUrl?: string;
  displayName: string;
  sections: { [key: string]: Section };
  shortDescription?: string;
  wikiUrl?: string;
}

export interface Category {
  hidden?: boolean;
  label: string;
}

export interface Section {
  excludeCategories?: string[];
  name: string;
  requireCategories?: string[];
}

export interface Game {
  distributions: Distribution[];
  label: string;
  meta: Meta;
  r2modman: R2Modman[] | null;
  tcli?: { [key: string]: any };
  thunderstore?: ThunderstoreEcosyste;
  uuid: string;
}

export interface Distribution {
  identifier?: any;
  platform: Platform;
}

export enum Platform {
  EPIC_GAMES_STORE = "epic-games-store",
  OCULUS_STORE = "oculus-store",
  ORIGIN = "origin",
  OTHER = "other",
  STEAM = "steam",
  STEAM_DIRECT = "steam-direct",
  XBOX_GAME_PASS = "xbox-game-pass",
}

export interface Meta {
  displayName: string;
  iconUrl: null | string;
}

export interface R2Modman {
  additionalSearchStrings: string[];
  dataFolderName: string;
  distributions: Distribution[];
  exeNames: string[];
  gameInstanceType: GameInstanceType;
  gameSelectionDisplayMode: GameSelectionDisplayMode;
  installRules: InstallRule[];
  internalFolderName: string;
  meta: Meta;
  packageIndex: string;
  packageLoader: Loader;
  relativeFileExclusions: string[] | null;
  settingsIdentifier: string;
  steamFolderName: string;
}

export enum GameInstanceType {
  GAME = "game",
  SERVER = "server",
}

export enum GameSelectionDisplayMode {
  HIDDEN = "hidden",
  VISIBLE = "visible",
}

export interface InstallRule {
  defaultFileExtensions: string[];
  isDefaultLocation: boolean;
  route: string;
  subRoutes: InstallRule[];
  trackingMethod: TrackingMethod;
}

export enum TrackingMethod {
  NONE = "none",
  PACKAGE_ZIP = "package-zip",
  STATE = "state",
  SUBDIR = "subdir",
  SUBDIR_NO_FLATTEN = "subdir-no-flatten",
}

export enum Loader {
  BEPINEX = "bepinex",
  BEPISLOADER = "bepisloader",
  GDWEAVE = "gdweave",
  GODOTML = "godotml",
  LOVELY = "lovely",
  MELONLOADER = "melonloader",
  NONE = "none",
  NORTHSTAR = "northstar",
  RECURSIVE_MELONLOADER = "recursive-melonloader",
  RETURN_OF_MODDING = "return-of-modding",
  RIVET = "rivet",
  SHIMLOADER = "shimloader",
  UMM = "umm",
}

export interface ModloaderPackage {
  loader: Loader;
  packageId: string;
  rootFolder: string;
}

export interface PackageInstaller {
  description: string;
  name: string;
}
