import * as path from "path-browserify";

import LoggerProvider, { LogSeverity } from "../providers/LoggerProvider";
import ProfileProvider from "../providers/ProfileProvider";
import PathResolver from "../r2mm/manager/PathResolver";

export interface ProfileCompatible {
  getProfileName: () => string;
  getProfilePath: () => string;
  joinToProfilePath: (...paths: [string, ...string[]]) => string;
}

/**
 * ImmutableProfile does not know about the current active profile or
 * other parts of the app state. It's ideal to be used as a function
 * argument in cases where the active profile changing during the
 * execution would cause unwanted behaviour.
 */
export class ImmutableProfile implements ProfileCompatible {
  private readonly profileName: string = "";
  private readonly rootDir: string = ".";

  public constructor(name: string) {
    this.profileName = name;
    this.rootDir = path.join(PathResolver.MOD_ROOT, "profiles");
    ProfileProvider.instance.ensureProfileDirectory(
      this.rootDir,
      this.profileName
    );
  }

  public getProfileName(): string {
    return this.profileName;
  }

  public getProfilePath(): string {
    return path.join(this.rootDir, this.profileName);
  }

  public joinToProfilePath(...paths: [string, ...string[]]): string {
    return path.join(this.getProfilePath(), ...paths);
  }
}

let activeProfile: Profile;

/**
 * Profile updates and provides access to activeProfile singleton.
 */
export default class Profile implements ProfileCompatible {
  private readonly profileName: string = "";

  public constructor(name: string) {
    this.profileName = name;
    activeProfile = this;

    // Notify TCLI (Fire and Forget)
    if (window.electronAPI && window.electronAPI.tcli) {
      const profilePath = this.getProfilePath();
      window.electronAPI.tcli
        .openProject(profilePath)
        .then(() => {
          LoggerProvider.instance.Log(
            LogSeverity.INFO,
            `[Profile] TCLI Project Opened: ${profilePath}`
          );
        })
        .catch((e) => {
          LoggerProvider.instance.Log(
            LogSeverity.ERROR,
            `[Profile] Failed to open project in TCLI: ${e.message}`,
            e
          );
        });
    }
  }

  // Return a snapshot of the currently active profile.
  public static getActiveAsImmutableProfile(): ImmutableProfile {
    return new ImmutableProfile(activeProfile.profileName);
  }

  public static getActiveProfile() {
    return activeProfile;
  }

  /**
   * Returns the root dir for profiles for the currently active game.
   * PathResolver.MOD_ROOT is updated when the active game changes.
   * E.g. DataFolder/[Game.internalFolderName]/profiles
   */
  public static getRootDir(): string {
    return path.join(PathResolver.MOD_ROOT, "profiles");
  }

  public asImmutableProfile(): ImmutableProfile {
    return Profile.getActiveAsImmutableProfile();
  }

  public getProfileName(): string {
    return this.profileName;
  }

  public getProfilePath(): string {
    return path.join(Profile.getRootDir(), this.profileName);
  }

  public joinToProfilePath(...paths: [string, ...string[]]): string {
    return path.join(this.getProfilePath(), ...paths);
  }
}
