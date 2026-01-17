import ProfileProvider from "../ProfileProvider";

export default class DummyProfileProvider extends ProfileProvider {
  public async ensureProfileDirectory(
    directory: string,
    profile: string
  ): Promise<void> {
    // No-op
  }
  public async createProfile(profile: string): Promise<void> {
    // No-op
  }
  public async renameProfile(oldName: string, newName: string): Promise<void> {
    // No-op
  }
  public async deleteProfile(profile: string): Promise<void> {
    // No-op
  }
  public async importProfile(
    sourceFile: string,
    newName: string
  ): Promise<void> {
    // No-op
  }
  public async importProfileCode(code: string, newName: string): Promise<void> {
    // No-op
  }
  public async exportProfile(profile: string): Promise<string> {
    return "";
  }
  public async exportProfileCode(profile: string): Promise<string> {
    return "";
  }
}
