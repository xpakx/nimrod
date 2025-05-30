import { BattleActor } from "../battle/actor";
import { Game } from "../game";
import { getLogger, Logger } from "../logger.js";
import { Position } from "../map-layer";

export class BattleLogicLayer {
	logger: Logger = getLogger("BattleLogicLayer");

	tempBattleIndex: number = 0; // TODO: improve placing


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

		if (battle.selectedTile) {
			this.battleProcessAction(game, battle.selectedTile, {x: x, y: y}, battle.selectedActor);
			battle.selectedTile = undefined;
			battle.selectedActor = undefined;
			return;
		}

		battle.selectedTile = {x: x, y: y};
		battle.selectedActor = this.isMouseOverPedestrian(game);
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
		let path = game.map.path;
		game.map.clearPath();
		if (dist <= actor.movement && path) {
			actor.setPath(path.map((x) => x.position));
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
		while(battle.heroes[this.tempBattleIndex].placed) {
			this.tempBattleIndex += 1;
		}
		const placed = battle.placeHero(this.tempBattleIndex, {x: x, y: y});
		if (!placed) {
			return;
		}
		game.state.pedestrians.push(battle.heroes[this.tempBattleIndex]);

		battle.finishPlacement();
		this.logger.debug(`current index: ${this.tempBattleIndex}, started: ${game.state.currentBattle.battleStarted}`);
	}

	calcBuildingsState(game: Game, deltaTime: number) {
		for(let building of game.map.buildings) {
			building.tick(deltaTime);
		}
	}

	calcPedestriansState(game: Game, deltaTime: number) {
		const dTime = deltaTime > 0.5 ? 0.5 : deltaTime;

		let pedestrians = game.state.pedestrians;
		game.state.pedestrians = [];
		for(let pedestrian of pedestrians) {
			pedestrian.tick(dTime, game.map, []);
			if (!pedestrian.dead) {
				game.state.insertPedestrian(pedestrian);
			} 
		}
	}

	calcState(game: Game, deltaTime: number, _minuteEnded: boolean) {
		this.calcBuildingsState(game, deltaTime);
		this.calcPedestriansState(game, deltaTime);
	}
}
