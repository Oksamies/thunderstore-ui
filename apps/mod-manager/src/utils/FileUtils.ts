import path from "path-browserify";

import FsProvider from "../providers/FsProvider";

export default class FileUtils {
  public static async ensureDirectory(dir: string) {
    const fs = FsProvider.instance;
    await fs.mkdirs(dir);
  }
}
