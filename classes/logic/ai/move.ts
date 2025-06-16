import { BattleActor } from "../../battle/actor.js";
import { Game } from "../../game.js";

export interface MoveGenerator {
	makeMove(game: Game, actors: BattleActor[]): void;
}
