export enum LogSeverity {
  ACTION_STOPPED = "ACTION_STOPPED",
  BREAKING = "BREAKING",
  INFO = "INFO",
  ERROR = "ERROR",
  WARNING = "WARNING",
}

export default abstract class LoggerProvider {
  private static _instance: LoggerProvider;

  static provide(instance: LoggerProvider): void {
    this._instance = instance;
  }

  public static get instance(): LoggerProvider {
    if (!LoggerProvider._instance) {
      throw new Error("LoggerProvider has not been provided");
    }
    return LoggerProvider._instance;
  }

  public abstract Log(
    severity: LogSeverity,
    message: string,
    error?: unknown
  ): Promise<void>;
  public abstract Write(): Promise<void>;
  public abstract getLogs(): string[];
}
