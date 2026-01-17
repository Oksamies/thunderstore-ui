import ecosystemData from "./ecosystem.json";
import { ThunderstoreEcosystem } from "./ecosystemTypes";

// We skip runtime validation with AJV for now as the file is bundled.
// In the future if we fetch this remotely, we should add validation back.
const ecosystem = ecosystemData as unknown as ThunderstoreEcosystem;

export class Ecosystem {
  static get ecosystem(): ThunderstoreEcosystem {
    return ecosystem;
  }

  /**
   * Get a list of r2modman entries i.e. games supported by the mod manager.
   */
  static get supportedGames() {
    return Object.values(this.ecosystem.games)
      .flatMap((game) => {
        if (!game.r2modman) return [];
        return game.r2modman.map((r2) => ({
          ...r2,
          communityIdentifier: game.label,
        }));
      })
      .filter((r2modman) => r2modman != null);
  }

  static get modloaderPackages() {
    return this.ecosystem.modloaderPackages;
  }
}
