/// <reference types="vite/client" />
/// <reference types="vite-plugin-electron/electron-env" />

interface Window {
  electronAPI: {
    versions: NodeJS.ProcessVersions;
    fs: {
      exists: (path: string) => Promise<boolean>;
      readFile: (path: string) => Promise<string>;
      writeFile: (path: string, content: string) => Promise<void>;
      writeFileBase64: (path: string, base64Content: string) => Promise<void>;
      readFileBase64: (path: string) => Promise<string>;
      readdir: (path: string) => Promise<string[]>;
      mkdirs: (path: string) => Promise<void>;
      unlink: (path: string) => Promise<void>;
      rmdir: (path: string) => Promise<void>;
      copy: (source: string, dest: string) => Promise<void>;
      rename: (oldPath: string, newPath: string) => Promise<void>;
      stat: (path: string) => Promise<{
        isDirectory: boolean;
        isFile: boolean;
        mtime: Date;
        size: number;
      } | null>;
      lstat: (path: string) => Promise<{
        isDirectory: boolean;
        isFile: boolean;
        mtime: Date;
        size: number;
      } | null>;
    };
    getPath: (name: string) => Promise<string>;
    pathJoin: (...args: string[]) => Promise<string>;
    downloadFile: (url: string, targetPath: string) => Promise<void>;
    extractZip: (zipPath: string, targetPath: string) => Promise<boolean>;
    createZip: (sourcePath: string, zipPath: string) => Promise<boolean>;
    spawn: (command: string, args: string[], cwd: string) => Promise<number>;
    exec: (command: string) => Promise<{ stdout: string; stderr: string }>;
    openDialog: (options: any) => Promise<string[]>;
    onOpenUrl: (callback: (url: string) => void) => () => void;
    window: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
    };
  };
}
