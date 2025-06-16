import { BattleActor } from "../../battle/actor.js";
import { Game } from "../../game.js";

export interface TurnController {
	tryEndTurn(game: Game, skipAnimations: boolean): boolean;
	checkTurnEnd(game: Game, skipAnimations: boolean): boolean;
	clearMoved(actors: BattleActor[]): void;
	onTurnEnd(game: Game): void;
	getUnitsForAiToMove(game: Game): BattleActor[];
	isMovementBlocked(): boolean;
	tryUnlockMovement(): void;
}
