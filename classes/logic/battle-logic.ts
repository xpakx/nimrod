import { BattleActor } from "../battle/actor.js";
import { Game } from "../game.js";
import { getLogger, Logger } from "../logger.js";
import { Position } from "../map-layer.js";

export class BattleLogicLayer {
	logger: Logger = getLogger("BattleLogicLayer");

	currentHero?: BattleActor;
	savedPositions: SavedPosition[] = [];
	spawnColor: string =  "#6666ff";

	skipAnimations: boolean = true;

	turnController: TurnController = new TurnController();

	showSpawnArea(game: Game) {
		if (!game.state.currentBattle) return;
		const battle = game.state.currentBattle;

		for (let position of battle.playerSpawns) {
			const color = game.map.getColor(position);
			this.savedPositions.push({position: position, color: color});
			game.map.setColor(position, this.spawnColor);
		}
	}

	restoreSpawnsColor(game: Game) {
		for (let position of this.savedPositions) {
			game.map.setColor(position.position, position.color);
		}
	}

	onMouseLeftClick(game: Game) {
		if (game.state.currentBattle?.battleStarted) {
			this.leftMouseBattle(game);
		} else {
			this.leftMouseBattlePrep(game);
		}
	}

	leftMouseBattle(game: Game) {
		if (!game.state.currentBattle) {
			return;
		}
		if (!game.map.isTileOnMap(game.map.isoPlayerMouse)) {
			return;
		}
		const battle = game.state.currentBattle;
		const x = game.map.isoPlayerMouse.x;
		const y = game.map.isoPlayerMouse.y;


		if (this.turnController.blockTillAnimationEnds) return; // TODO
		if (!battle.playerPhase) {
			// TODO
			return;
		}

		if (battle.selectedTile) {
			this.battleProcessAction(game, battle.selectedTile, {x: x, y: y}, battle.selectedActor);
			battle.selectedTile = undefined;
			battle.selectedActor = undefined;
			return;
		}

		battle.selectedTile = {x: x, y: y};
		battle.selectedActor = this.isMouseOverPedestrian(game);
		if (battle.selectedActor?.moved) {
			// TODO
			battle.selectedActor = undefined;
		}
		this.logger.debug("Selected actor", battle.selectedActor);
		this.logger.debug("Selected tile", battle.selectedTile);
	}

	battleMouseOver(game: Game) {
		if (!game.state.currentBattle) {
			return;
		}
		const battle = game.state.currentBattle;
		if (!battle.selectedTile) {
			return;
		}
		const start = battle.selectedTile;
		if (!game.map.isTileOnMap(game.map.isoPlayerMouse)) {
			return;
		}

		if (battle.selectedActor) {
			const dist = game.map.shortestPath(start, game.map.isoPlayerMouse, game.sprites.getArrow());
			game.map.pathCorrect =  dist <= battle.selectedActor.movement;
		}
	}

        isMouseOverPedestrian(game: Game): BattleActor | undefined {
		const mouse = game.map.isoPlayerMouse;
		for (let pedestrian of game.state.pedestrians) {
			const pos = pedestrian.positionSquare;
			if(pos.x == mouse.x && pos.y == mouse.y) {
				return pedestrian as BattleActor;
			}
		}
		return undefined;
	}


	battleProcessAction(game: Game, from: Position, to: Position, actor: BattleActor | undefined) {
		if (!actor || actor.enemy) {
			game.map.clearPath();
			return;
		}
		const dist = game.map.shortestPath(from, to, game.sprites.getArrow());
		let path = game.map.path?.map((x) => x.position);
		game.map.clearPath();
		if (dist <= actor.movement && path) {
			this.moveActor(actor, to, path);
			actor.moved = true;
		}
		const turnEnded = this.turnController.checkTurnEnd(game, this.skipAnimations);
		if (turnEnded) this.onTurnEnd(game);
	}

	moveActor(actor: BattleActor, to: Position, path: Position[]) {
		if (this.skipAnimations) {
			actor.setPosition(to);
		} else {
			actor.setPath(path);
		}
	}

	leftMouseBattlePrep(game: Game) {
		if (!game.state.currentBattle) {
			return;
		}
		if (!game.map.isTileOnMap(game.map.isoPlayerMouse)) {
			return;
		}
		if (game.map.isBlocked(game.map.isoPlayerMouse)) {
			return;
		}
		const battle = game.state.currentBattle;
		const x = game.map.isoPlayerMouse.x;
		const y = game.map.isoPlayerMouse.y;

		if (!this.currentHero) {
			this.currentHero = this.isMouseOverPedestrian(game);
			return;
		}

		const placed = battle.placeHero(this.currentHero, {x: x, y: y});
		if (!placed) {
			return;
		}
		this.currentHero.selected = false;
		if (game.state.pedestrians.indexOf(this.currentHero) < 0) {
			game.state.pedestrians.push(this.currentHero);
		}
		this.currentHero = undefined;

		battle.finishPlacement();
		this.logger.debug(`started: ${game.state.currentBattle.battleStarted}`);
		if (battle.battleStarted) {
			this.restoreSpawnsColor(game);
			if (!battle.playerPhase) this.aiMove(game);
		}
	}

	calcBuildingsState(_game: Game, _deltaTime: number) {
		// TODO: decide if needed
	}

	calcPedestriansState(game: Game, deltaTime: number) {
		const dTime = deltaTime > 0.5 ? 0.5 : deltaTime;

		let pedestrians = game.state.pedestrians;
		game.state.pedestrians = [];
		let moving = false;
		for(let pedestrian of pedestrians) {
			pedestrian.tick(dTime, game.map, []);
			if (!pedestrian.dead) {
				game.state.insertPedestrian(pedestrian);
			} 
			const hero = pedestrian as BattleActor;
			if (hero.goal) moving = true;
		}
		if (!moving && this.turnController.blockTillAnimationEnds) {
			this.turnController.blockTillAnimationEnds = false;
			this.onTurnEnd(game);
		}
	}

	calcState(game: Game, deltaTime: number, _minuteEnded: boolean) {
		this.calcBuildingsState(game, deltaTime);
		this.calcPedestriansState(game, deltaTime);
	}

	selectHero(hero: BattleActor) {
		if (this.currentHero) this.currentHero.selected = false;
		this.currentHero = hero;
		this.currentHero.selected = true;
	}

	onTurnEnd(game: Game) {
		this.turnController.onTurnEnd(game);
		if (!game.state.currentBattle?.playerPhase) {
			this.aiMove(game);
		}
	}

	aiMove(game: Game) {
		// TODO
		console.log("enemy phase");
		const turnEnded = this.turnController.tryEndTurn(game, this.skipAnimations);
		if (turnEnded) this.onTurnEnd(game);
	}
}

interface SavedPosition {
	color: string;
	position: Position;
}

class TurnController {
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
			if (!hero.moved) return false;
		}
		return this.tryEndTurn(game, skipAnimations);
	}

	clearMoved(actors: BattleActor[]) {
		for (let actor of actors) {
			actor.moved = false;
		}
	}

	onTurnEnd(game: Game) {
		if (!game.state.currentBattle) return;
		const battle = game.state.currentBattle;

		if (battle.playerStarts != battle.playerPhase) {
			game.state.currentBattle.currentTurn += 1;
		}
		this.clearMoved(battle.playerPhase ? battle.heroes : battle.enemies);

		battle.playerPhase = !battle.playerPhase;
	}
}
