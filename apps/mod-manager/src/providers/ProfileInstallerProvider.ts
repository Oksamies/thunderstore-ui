import ManifestV2 from "../model/ManifestV2";
import { ImmutableProfile } from "../model/Profile";
import R2Error from "../model/errors/R2Error";

export default abstract class ProfileInstallerProvider {
  private static provider: () => ProfileInstallerProvider;
  static provide(provided: () => ProfileInstallerProvider): void {
    this.provider = provided;
  }

  public static get instance(): ProfileInstallerProvider {
    if (ProfileInstallerProvider.provider === undefined) {
      throw new Error("ProfileInstallerProvider not provided");
    }
    return ProfileInstallerProvider.provider();
  }

  public abstract uninstallMod(
    mod: ManifestV2,
    profile: ImmutableProfile
  ): Promise<R2Error | null>;
  public abstract disableMod(
    mod: ManifestV2,
    profile: ImmutableProfile
  ): Promise<R2Error | void>;
  public abstract enableMod(
    mod: ManifestV2,
    profile: ImmutableProfile
  ): Promise<R2Error | void>;
  public abstract installMod(
    mod: ManifestV2,
    profile: ImmutableProfile
  ): Promise<R2Error | null>;
}
