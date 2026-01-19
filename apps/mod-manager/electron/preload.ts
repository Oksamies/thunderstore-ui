import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  versions: process.versions,
  fs: {
    exists: (path: string) => ipcRenderer.invoke("fs-exists", path),
    readFile: (path: string) => ipcRenderer.invoke("fs-readFile", path),
    writeFile: (path: string, content: string) =>
      ipcRenderer.invoke("fs-writeFile", path, content),
    writeFileBase64: (path: string, base64Content: string) =>
      ipcRenderer.invoke("fs-writeFileBase64", path, base64Content),
    readFileBase64: (path: string) =>
      ipcRenderer.invoke("fs-readFileBase64", path),
    readdir: (path: string) => ipcRenderer.invoke("fs-readdir", path),
    mkdirs: (path: string) => ipcRenderer.invoke("fs-mkdirs", path),
    unlink: (path: string) => ipcRenderer.invoke("fs-unlink", path),
    rmdir: (path: string) => ipcRenderer.invoke("fs-rmdir", path),
    copy: (source: string, dest: string) =>
      ipcRenderer.invoke("fs-copy", source, dest),
    rename: (oldPath: string, newPath: string) =>
      ipcRenderer.invoke("fs-rename", oldPath, newPath),
    stat: (path: string) => ipcRenderer.invoke("fs-stat", path),
    lstat: (path: string) => ipcRenderer.invoke("fs-lstat", path),
  },
  getPath: (name: string) => ipcRenderer.invoke("get-path", name),
  pathJoin: (...args: string[]) => ipcRenderer.invoke("path-join", ...args),
  downloadFile: (url: string, targetPath: string) =>
    ipcRenderer.invoke("download-file", url, targetPath),
  extractZip: (zipPath: string, targetPath: string) =>
    ipcRenderer.invoke("extract-zip", zipPath, targetPath),
  createZip: (sourcePath: string, zipPath: string) =>
    ipcRenderer.invoke("create-zip", sourcePath, zipPath),
  spawn: (command: string, args: string[], cwd: string) =>
    ipcRenderer.invoke("spawn", command, args, cwd),
  exec: (command: string) => ipcRenderer.invoke("exec", command),
  openDialog: (options: any) => ipcRenderer.invoke("open-dialog", options),
  onOpenUrl: (callback: (url: string) => void) => {
    const handler = (_event: any, url: string) => callback(url);
    ipcRenderer.on("open-url", handler);
    return () => ipcRenderer.removeListener("open-url", handler);
  },
  window: {
    minimize: () => ipcRenderer.invoke("window-minimize"),
    maximize: () => ipcRenderer.invoke("window-maximize"),
    close: () => ipcRenderer.invoke("window-close"),
  },
  tcli: {
    init: (executablePath: string, workingDirectory: string) =>
      ipcRenderer.invoke("tcli-init", executablePath, workingDirectory),
    openProject: (path: string) =>
      ipcRenderer.invoke("tcli-open-project", path),
    addPackages: (packages: string[]) =>
      ipcRenderer.invoke("tcli-add-packages", packages),
    removePackages: (packages: string[]) =>
      ipcRenderer.invoke("tcli-remove-packages", packages),
    installedPackages: () => ipcRenderer.invoke("tcli-installed-packages"),
  },
});
