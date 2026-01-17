export default class ConfigFile {
  private readonly name: string;
  private readonly path: string;
  private readonly lastUpdated: Date;

  public constructor(name: string, path: string, date: Date) {
    this.name = name;
    this.path = path;
    this.lastUpdated = date;
  }

  public getName(): string {
    return this.name;
  }

  public getPath(): string {
    return this.path;
  }

  public getLastUpdated(): Date {
    return this.lastUpdated;
  }
}
