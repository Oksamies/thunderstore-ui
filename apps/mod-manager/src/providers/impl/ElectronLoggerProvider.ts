import PathResolver from "../../r2mm/manager/PathResolver";
import LoggerProvider, { LogSeverity } from "../LoggerProvider";

export default class ElectronLoggerProvider extends LoggerProvider {
  private logList: string[] = [];

  public async Log(
    severity: LogSeverity,
    message: string,
    error?: unknown
  ): Promise<void> {
    const logEntry = `${new Date().toLocaleTimeString()} [${severity}]: ${message}${
      error ? `\n${error}` : ""
    }`;
    this.logList.push(logEntry);
    console.log(logEntry, error || "");
    await this.Write();
  }

  public async Write(): Promise<void> {
    try {
      const api = window.electronAPI;
      const root = PathResolver.ROOT;
      if (!root) return;
      await api.fs.mkdirs(root);
      const logPath = await api.pathJoin(root, "log.txt");
      await api.fs.writeFile(logPath, this.logList.join("\n"));
    } catch (e) {
      console.error("Failed to write log file", e);
    }
  }

  public getLogs(): string[] {
    return this.logList;
  }
}
