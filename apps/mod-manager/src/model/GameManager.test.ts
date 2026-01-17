import { describe, expect, it } from "vitest";

import GameManager from "./GameManager";

describe("GameManager", () => {
  it("should list supported games from ecosystem", () => {
    const games = GameManager.gameList;
    expect(games.length).toBeGreaterThan(0);
    console.log(`Found ${games.length} games`);

    const ror2 = games.find((g) => g.internalFolderName === "RiskOfRain2");
    expect(ror2).toBeDefined();
    expect(ror2?.displayName).toBe("Risk of Rain 2");
  });

  it("should find default game", () => {
    const defaultGame = GameManager.defaultGame;
    expect(defaultGame).toBeDefined();
    expect(defaultGame.internalFolderName).toBe("RiskOfRain2");
  });
});
