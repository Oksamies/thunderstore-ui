export default abstract class ProfileProvider {
  private static provider: () => ProfileProvider;

  static provide(provided: () => ProfileProvider): void {
    this.provider = provided;
  }

  public static get instance(): ProfileProvider {
    if (ProfileProvider.provider === undefined) {
      throw new Error("ProfileProvider has not been provided");
    }
    return ProfileProvider.provider();
  }

  public abstract ensureProfileDirectory(
    directory: string,
    profile: string
  ): Promise<void>;

  public abstract createProfile(profile: string): Promise<void>;
  public abstract renameProfile(
    oldName: string,
    newName: string
  ): Promise<void>;
  public abstract deleteProfile(profile: string): Promise<void>;
  public abstract importProfile(
    sourceFile: string,
    newName: string
  ): Promise<void>;
  public abstract importProfileCode(
    code: string,
    newName: string
  ): Promise<void>;
  public abstract exportProfile(profile: string): Promise<string>;
  public abstract exportProfileCode(profile: string): Promise<string>;
}
