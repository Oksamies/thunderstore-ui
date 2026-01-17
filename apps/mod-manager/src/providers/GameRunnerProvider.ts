import Game from "../model/Game";
import Profile from "../model/Profile";

export default abstract class GameRunnerProvider {
  abstract startModded(game: Game, profile: Profile): Promise<void>;
  abstract startVanilla(game: Game, profile: Profile): Promise<void>;
}
