import AdmZip from "adm-zip";
import axios from "axios";
import { spawn } from "child_process";
import { exec } from "child_process";
import { BrowserWindow, app, dialog, ipcMain } from "electron";
import { promises as fsPromises } from "fs";
import fs from "fs-extra";
import path from "path";

import { TcliClient } from "./tcli/client";

process.env.DIST = path.join(__dirname, "../dist");
process.env.PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, "../public");

let win: BrowserWindow | null = null;
let tcliClient: TcliClient | null = null;
let initLock: Promise<boolean> | null = null;
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// Protocol Handling
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("thunderstore", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("thunderstore");
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();

      // Handle protocol URL on Windows/Linux
      const url = commandLine.find((arg) => arg.startsWith("thunderstore://"));
      if (url) {
        win.webContents.send("open-url", url);
      }
    }
  });

  app.whenReady().then(() => {
    setupIpc();
    createWindow();
  });
}

// Handle protocol URL on macOS
app.on("open-url", (event, url) => {
  event.preventDefault();
  if (win) {
    win.webContents.send("open-url", url);
  }
});

const setupIpc = () => {
  ipcMain.handle("fs-exists", async (_, path) => {
    return fs.existsSync(path);
  });
  ipcMain.handle("fs-readFile", async (_, path) => {
    return fsPromises.readFile(path, "utf-8");
  });
  ipcMain.handle("fs-writeFile", async (_, path, content) => {
    return fsPromises.writeFile(path, content, "utf-8");
  });
  ipcMain.handle("fs-writeFileBase64", async (_, path, base64Content) => {
    return fsPromises.writeFile(path, Buffer.from(base64Content, "base64"));
  });
  ipcMain.handle("fs-readFileBase64", async (_, path) => {
    const buffer = await fsPromises.readFile(path);
    return buffer.toString("base64");
  });
  ipcMain.handle("fs-readdir", async (_, path) => {
    return fsPromises.readdir(path);
  });
  ipcMain.handle("fs-mkdirs", async (_, path) => {
    return fsPromises.mkdir(path, { recursive: true });
  });
  ipcMain.handle("fs-unlink", async (_, path) => {
    return fsPromises.unlink(path);
  });
  ipcMain.handle("fs-rmdir", async (_, path) => {
    return fs.remove(path);
  });
  ipcMain.handle("fs-lstat", async (_, path) => {
    try {
      const stats = await fsPromises.lstat(path);
      return {
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        mtime: stats.mtime,
        size: stats.size,
      };
    } catch (e) {
      return null;
    }
  });
  ipcMain.handle("fs-stat", async (_, path) => {
    try {
      const stats = await fsPromises.stat(path);
      return {
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        mtime: stats.mtime,
        size: stats.size,
      };
    } catch (e) {
      return null;
    }
  });
  ipcMain.handle("fs-copy", async (_, source: string, dest: string) => {
    return fs.copy(source, dest);
  });
  ipcMain.handle("fs-rename", async (_, oldPath, newPath) => {
    return fs.rename(oldPath, newPath);
  });
  ipcMain.handle("path-join", async (_, ...args: string[]) => {
    return path.join(...args);
  });
  ipcMain.handle("get-path", async (_, name: any) => {
    return app.getPath(name);
  });
  ipcMain.handle(
    "download-file",
    async (_, url: string, targetPath: string) => {
      const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
      });
      const writer = fs.createWriteStream(targetPath);
      response.data.pipe(writer);
      return new Promise((resolve, reject) => {
        writer.on("finish", () => resolve(true));
        writer.on("error", reject);
      });
    }
  );
  ipcMain.handle(
    "extract-zip",
    async (_, zipPath: string, targetPath: string) => {
      try {
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(targetPath, true);
        return true;
      } catch (e) {
        console.error("Extract error:", e);
        throw e;
      }
    }
  );
  ipcMain.handle(
    "create-zip",
    async (_, sourcePath: string, zipPath: string) => {
      try {
        const zip = new AdmZip();
        zip.addLocalFolder(sourcePath);
        zip.writeZip(zipPath);
        return true;
      } catch (e) {
        console.error("Zip creation error:", e);
        throw e;
      }
    }
  );

  // TCLI Handlers
  ipcMain.handle(
    "tcli-init",
    async (_, executablePath: string, workingDirectory: string) => {
      // Serialize init calls to prevent race conditions and lock contention
      if (initLock) {
        await initLock;
        if (tcliClient) return true; // Already initialized
      }

      initLock = (async () => {
        if (tcliClient) {
          await tcliClient.stop();
        }

        // Ensure we have a valid project directory for TCLI to start in
        // TCLI requires a valid Thunderstore.toml to start the server
        const sessionDir = path.join(workingDirectory, "_tcli_session");
        await fs.ensureDir(sessionDir);

        const manifestPath = path.join(sessionDir, "Thunderstore.toml");
        if (!(await fs.pathExists(manifestPath))) {
          const minimalManifest = `[config]
schemaVersion = "0.0.1"
`;
          await fs.writeFile(manifestPath, minimalManifest, "utf-8");
        }

        // Clean up any stale lock file from previous runs
        const lockFile = path.join(sessionDir, ".server-lock");
        if (await fs.pathExists(lockFile)) {
          try {
            await fs.remove(lockFile);
            console.log("Removed stale .server-lock file");
          } catch (e) {
            console.error("Failed to remove .server-lock", e);
          }
        }

        tcliClient = new TcliClient(executablePath, sessionDir);
        await tcliClient.start();
        return true;
      })();

      try {
        return await initLock;
      } finally {
        initLock = null;
      }
    }
  );

  ipcMain.handle("tcli-open-project", async (_, path: string) => {
    if (!tcliClient) throw new Error("TCLI not initialized");
    return tcliClient.openProject(path);
  });

  ipcMain.handle("tcli-add-packages", async (_, packages: string[]) => {
    if (!tcliClient) throw new Error("TCLI not initialized");
    return tcliClient.addPackages(packages);
  });

  ipcMain.handle("tcli-remove-packages", async (_, packages: string[]) => {
    if (!tcliClient) throw new Error("TCLI not initialized");
    return tcliClient.removePackages(packages);
  });

  ipcMain.handle("tcli-installed-packages", async () => {
    if (!tcliClient) throw new Error("TCLI not initialized");
    return tcliClient.installedPackages();
  });
};

function createWindow() {
  win = new BrowserWindow({
    width: 980,
    height: 700,
    minWidth: 980,
    minHeight: 700,
    frame: false,
    titleBarStyle: "hidden",
    icon: path.join(process.env.PUBLIC || "", "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Disable web security to avoid CORS issues
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST || "", "index.html"));
  }

  // Handle Startup URL (if app was closed)
  if (process.platform === "win32" || process.platform === "linux") {
    const url = process.argv.find((arg) => arg.startsWith("thunderstore://"));
    if (url) {
      // Send only once
      const sendUrlOnce = () => {
        win?.webContents.send("open-url", url);
        // Remove listener to prevent duplicates on reload
        // Actually, we can't easily remove this specific anonymous listener unless we store it.
        // But we can use .once()
      };

      win.webContents.once("did-finish-load", sendUrlOnce);
    }
  }
}

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC handler for child_process.spawn
ipcMain.handle(
  "spawn",
  async (event, command: string, args: string[], cwd: string) => {
    console.log("Spawning:", command, args, cwd);
    const subprocess = spawn(command, args, {
      cwd: cwd,
      detached: true,
      shell: true,
    });
    subprocess.unref(); // Allow the parent to exit independently
    return subprocess.pid;
  }
);

ipcMain.handle("exec", async (event, command: string) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        // Start of workaround: reg query returns 1 if key not found, which is an error but distinct
        console.warn(`Exec error for ${command}:`, error);
        resolve({ stdout: "", stderr: stderr, error: error.message });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
});

ipcMain.handle("open-dialog", async (event, options) => {
  return dialog
    .showOpenDialog(win!, options)
    .then((result) => result.filePaths);
});

ipcMain.handle("window-minimize", () => {
  win?.minimize();
});

ipcMain.handle("window-maximize", () => {
  if (win?.isMaximized()) {
    win.unmaximize();
  } else {
    win?.maximize();
  }
});

ipcMain.handle("window-close", () => {
  win?.close();
});

// Removed app.whenReady() because it's handled in the single instance lock check
// app.whenReady().then(() => {
//   setupIpc();
//   createWindow();
// });
