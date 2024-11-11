/* eslint-disable @typescript-eslint/no-explicit-any */
import { app as electronApp, BrowserWindow } from "electron";
import { join } from "path";
import { overwolf } from "@overwolf/ow-electron";

const owElectronApp = electronApp as overwolf.OverwolfApp;

export class MainWindowController {
  private browserWindow: BrowserWindow = null;

  constructor() {
    owElectronApp.overwolf.packages.on("crashed", (e, ...args) => {
      this.printLogMessage("package crashed", ...args);
      // ow-electron package manager crashed (will be auto relaunch)
      // e.preventDefault();
      // calling `e.preventDefault();` will stop the GEP Package from
      // automatically re-launching
    });

    owElectronApp.overwolf.packages.on(
      "failed-to-initialize",
      this.logPackageManagerErrors.bind(this)
    );
  }

  /**
   *
   */
  public printLogMessage(message: string, ...args: any[]) {
    if (this.browserWindow?.isDestroyed() ?? true) {
      return;
    }
    this.browserWindow?.webContents?.send("console-message", message, ...args);
  }

  //----------------------------------------------------------------------------
  private logPackageManagerErrors(e, packageName, ...args: any[]) {
    this.printLogMessage(
      "Overwolf Package Manager error!",
      packageName,
      ...args
    );
  }

  public createAndShow(showDevTools: boolean) {
    this.browserWindow = new BrowserWindow({
      width: 1920,
      height: 1080,
      show: true,
      webPreferences: {
        // NOTE: nodeIntegration and contextIsolation are only required for this
        // specific demo app, they are not a neceassry requirement for any other
        // ow-electron applications
        // nodeIntegration: true,
        // contextIsolation: true,
        devTools: showDevTools,
        // relative to root folder of the project
        preload: join(__dirname, "../preload/preload.js"),
      },
    });

    // console.log(join(__dirname, "../renderer/index.html"));
    // this.browserWindow.loadFile(join(__dirname, "../renderer/index.html"));
    this.browserWindow.loadFile("src/renderer/index.html");
    // this.browserWindow.loadFile("src/renderer/renderer.tsx");
  }
}
