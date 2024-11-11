import { app as ElectronApp } from "electron";
import { Application } from "./application";
import { MainWindowController } from "./controllers/main-window.controller";

/**
 * TODO: Integrate your own dependency-injection library
 */
const bootstrap = (): Application => {
  const mainWindowController = new MainWindowController();

  return new Application(mainWindowController);
};

const app = bootstrap();

ElectronApp.whenReady().then(() => {
  app.run();
});

ElectronApp.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    ElectronApp.quit();
  }
});
