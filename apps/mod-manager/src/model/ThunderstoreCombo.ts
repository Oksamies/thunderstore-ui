import Game from "./Game";
import ThunderstoreMod from "./ThunderstoreMod";
import ThunderstoreVersion from "./ThunderstoreVersion";
import R2Error from "./errors/R2Error";

// import * as PackageDb from '../r2mm/manager/PackageDexieStore';

export default class ThunderstoreCombo {
  private mod: ThunderstoreMod = new ThunderstoreMod();
  private version: ThunderstoreVersion = new ThunderstoreVersion();

  // fromProtocol implementation requires DB access, skipping for now as it's not strictly needed for ManifestV2
  /*
    public static async fromProtocol(protocol: string, game: Game): Promise<ThunderstoreCombo | R2Error> {
        // ...
    }
    */

  public getMod(): ThunderstoreMod {
    return this.mod;
  }

  public setMod(mod: ThunderstoreMod) {
    this.mod = mod;
  }

  public getVersion(): ThunderstoreVersion {
    return this.version;
  }

  public setVersion(version: ThunderstoreVersion) {
    this.version = version;
  }

  public getDependencyString(): string {
    return `${this.mod.getFullName()}-${this.version
      .getVersionNumber()
      .toString()}`;
  }

  public getUserFriendlyString(): string {
    return `${this.mod.getName()} (${this.version
      .getVersionNumber()
      .toString()})`;
  }
}
