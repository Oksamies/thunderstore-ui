import FsProvider, { StatInterface } from "../FsProvider";

export default class ElectronFsProvider extends FsProvider {
  public async readFile(path: string): Promise<string> {
    return window.electronAPI.fs.readFile(path);
  }

  public async writeFile(path: string, content: string): Promise<void> {
    return window.electronAPI.fs.writeFile(path, content);
  }

  public async readdir(path: string): Promise<string[]> {
    return window.electronAPI.fs.readdir(path);
  }

  public async mkdirs(path: string): Promise<void> {
    return window.electronAPI.fs.mkdirs(path);
  }

  public async unlink(path: string): Promise<void> {
    return window.electronAPI.fs.unlink(path);
  }

  public async rmdir(path: string): Promise<void> {
    return window.electronAPI.fs.rmdir(path);
  }

  public async rename(oldPath: string, newPath: string): Promise<void> {
    return window.electronAPI.fs.rename(oldPath, newPath);
  }

  public async exists(path: string): Promise<boolean> {
    return window.electronAPI.fs.exists(path);
  }

  public async stat(path: string): Promise<StatInterface | null> {
    return window.electronAPI.fs.stat(path);
  }

  public async lstat(path: string): Promise<StatInterface | null> {
    return window.electronAPI.fs.lstat(path);
  }
}
