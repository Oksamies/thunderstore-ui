import { MainWindowController } from "./controllers/main-window.controller";

export class Application {
  constructor(private readonly mainWindowController: MainWindowController) {}

  public run() {
    this.initialize();
  }

  private initialize() {
    const showDevTools = true;
    this.mainWindowController.createAndShow(showDevTools);
  }
}
