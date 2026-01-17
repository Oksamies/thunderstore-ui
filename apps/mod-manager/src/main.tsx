import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.css";
import FsProvider from "./providers/FsProvider";
import LoggerProvider from "./providers/LoggerProvider";
import ProfileInstallerProvider from "./providers/ProfileInstallerProvider";
import ProfileProvider from "./providers/ProfileProvider";
import ZipProvider from "./providers/ZipProvider";
import ElectronFsProvider from "./providers/impl/ElectronFsProvider";
import ElectronLoggerProvider from "./providers/impl/ElectronLoggerProvider";
import ElectronProfileInstallerProvider from "./providers/impl/ElectronProfileInstallerProvider";
import ElectronProfileProvider from "./providers/impl/ElectronProfileProvider";
import ElectronZipProvider from "./providers/impl/ElectronZipProvider";

// Initialize providers
LoggerProvider.provide(new ElectronLoggerProvider());
FsProvider.provide(() => new ElectronFsProvider());
ProfileProvider.provide(() => new ElectronProfileProvider());
ZipProvider.provide(() => new ElectronZipProvider());
ProfileInstallerProvider.provide(() => new ElectronProfileInstallerProvider());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
