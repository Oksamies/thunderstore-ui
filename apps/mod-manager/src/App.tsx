import path from "path-browserify";
import React, { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";

import { LinkingProvider, TooltipProvider } from "@thunderstore/cyberstorm";
import { DapperProvider } from "@thunderstore/dapper";
import { DapperTs } from "@thunderstore/dapper-ts";

import "./App.css";
import UrlHandler from "./components/UrlHandler";
import LoggerProvider, { LogSeverity } from "./providers/LoggerProvider";
import ManagerSettings from "./r2mm/manager/ManagerSettings";
import PathResolver from "./r2mm/manager/PathResolver";
import { router } from "./router/routes";
import { store } from "./store";
import "./styles/theme-light.css";
import { linkLibrary } from "./utils/LinkLibrary";

const dapper = new DapperTs(() => ({
  apiHost: "https://thunderstore.io",
}));

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const appData = await window.electronAPI.getPath("appData");
        PathResolver.APPDATA_DIR = appData;

        // Define default root
        const defaultRoot = path.join(appData, "ThunderstoreModManager");
        PathResolver.ROOT = defaultRoot;
        PathResolver.CONFIG_DIR = path.join(defaultRoot, "config");

        LoggerProvider.instance.Log(
          LogSeverity.INFO,
          `Initializing Paths. Root: ${defaultRoot}`
        );

        // Load settings to check for custom data directory
        await ManagerSettings.instance.load();

        // Apply Theme
        if (ManagerSettings.instance.theme === "light") {
          document.body.classList.add("theme-light");
        } else {
          document.body.classList.remove("theme-light");
        }

        if (ManagerSettings.instance.dataDirectory) {
          PathResolver.ROOT = ManagerSettings.instance.dataDirectory;
          LoggerProvider.instance.Log(
            LogSeverity.INFO,
            `Custom Data Directory: ${ManagerSettings.instance.dataDirectory}`
          );
        }

        // TCLI Initialization
        if (window.electronAPI) {
          // TODO: Determine correct path in production
          let tcliPath = "C:\\projects\\tcli-rust\\target\\debug\\tcli.exe";

          // Check for production path relative to app
          // In packaged electron, this might be nearby
          // const prodPath = await window.electronAPI.pathJoin(process.resourcesPath, "tcli.exe");

          if (await window.electronAPI.fs.exists(tcliPath)) {
            await window.electronAPI.tcli.init(tcliPath, PathResolver.ROOT);
            LoggerProvider.instance.Log(
              LogSeverity.INFO,
              `TCLI Initialized at ${tcliPath}`
            );
          } else {
            LoggerProvider.instance.Log(
              LogSeverity.WARNING,
              `TCLI executable not found at ${tcliPath}`
            );
          }
        }

        setReady(true);
      } catch (e: any) {
        console.error("Failed to initialize application paths", e);
        LoggerProvider.instance.Log(
          LogSeverity.ERROR,
          `Failed to initialize application paths: ${e.message}`,
          e
        );
      }
    };
    init();
  }, []);

  if (!ready) {
    return <div className="app-loading">Initializing...</div>;
  }

  return (
    <Provider store={store}>
      <DapperProvider dapperConstructor={() => dapper}>
        <TooltipProvider>
          <LinkingProvider value={linkLibrary}>
            <UrlHandler />
            <RouterProvider router={router} />
          </LinkingProvider>
        </TooltipProvider>
      </DapperProvider>
    </Provider>
  );
}

export default App;
