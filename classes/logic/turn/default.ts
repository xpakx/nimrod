import { BattleActor } from "../../battle/actor.js";
import { Game } from "../../game.js";
import { TurnController } from "./turn.js";

export class DefaultTurnController implements TurnController {
	blockTillAnimationEnds: boolean = false;

	tryEndTurn(_game: Game, skipAnimations: boolean): boolean {
		if (skipAnimations) {
			return true
		} 
		this.blockTillAnimationEnds = true;
		return false;
	}

	checkTurnEnd(game: Game, skipAnimations: boolean): boolean {
		if (!game.state.currentBattle) return false;
		const battle = game.state.currentBattle;
		for (let hero of battle.heroes) {
			if (!hero.finishedTurn) return false;
		}
		return this.tryEndTurn(game, skipAnimations);
	}

	clearActors(actors: BattleActor[]) {
		for (let actor of actors) {
			actor.moved = false;
			actor.finishedTurn = false;
			for (let skill of actor.skills) {
				if (skill.cooldownTimer > 0) {
					skill.cooldownTimer -= 1;
				}
			}
		}
	}

	onTurnEnd(game: Game) {
		if (!game.state.currentBattle) return;
		const battle = game.state.currentBattle;

		if (battle.playerStarts != battle.playerPhase) {
			game.state.currentBattle.currentTurn += 1;
		}
		this.clearActors(battle.playerPhase ? battle.heroes : battle.enemies);

		battle.playerPhase = !battle.playerPhase;
	}

	getUnitsForAiToMove(game: Game): BattleActor[] {
		if (!game.state.currentBattle) return [];
		return game.state.currentBattle.enemies;
	}

	isMovementBlocked(): boolean {
		return this.blockTillAnimationEnds;
	}

	tryUnlockMovement() {
		this.blockTillAnimationEnds = false;
	}
}
