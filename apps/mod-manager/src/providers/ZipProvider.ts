export default abstract class ZipProvider {
  private static provider: () => ZipProvider;
  static provide(provided: () => ZipProvider): void {
    this.provider = provided;
  }

  public static get instance(): ZipProvider {
    if (ZipProvider.provider === undefined) {
      throw new Error("ZipProvider not provided");
    }
    return ZipProvider.provider();
  }

  public abstract extractAllTo(
    zipPath: string,
    outputFolder: string
  ): Promise<void>;
}
