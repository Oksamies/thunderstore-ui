export interface StatInterface {
  isDirectory: boolean;
  isFile: boolean;
  mtime: Date;
  size: number;
}

export default abstract class FsProvider {
  private static provider: () => FsProvider;

  static provide(provided: () => FsProvider): void {
    this.provider = provided;
  }

  public static get instance(): FsProvider {
    if (FsProvider.provider === undefined) {
      throw new Error("FsProvider not provided");
    }
    return FsProvider.provider();
  }

  public abstract readFile(path: string): Promise<string>;
  public abstract writeFile(path: string, content: string): Promise<void>;
  public abstract readdir(path: string): Promise<string[]>;
  public abstract mkdirs(path: string): Promise<void>;
  public abstract unlink(path: string): Promise<void>;
  public abstract rmdir(path: string): Promise<void>;
  public abstract rename(oldPath: string, newPath: string): Promise<void>;
  public abstract exists(path: string): Promise<boolean>;
  public abstract stat(path: string): Promise<StatInterface | null>;
  public abstract lstat(path: string): Promise<StatInterface | null>;
}
