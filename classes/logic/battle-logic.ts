import { BattleActor } from "../battle/actor.js";
import { Battle } from "../battle/battle.js";
import { EffectSystem } from "../battle/effect-system.js";
import { Skill } from "../battle/skill/skill.js";
import { Game } from "../game.js";
import { getLogger, Logger } from "../logger.js";
import { Position } from "../map-layer.js";
import { MoveGenerator } from "./ai/move.js";
import { TurnController } from "./turn/turn.js";


interface HeroSelection {
	hero?: BattleActor;
	initialPosition?: Position;
}

export class BattleLogicLayer {
	logger: Logger = getLogger("BattleLogicLayer");

	currentHero: HeroSelection = {hero: undefined, initialPosition: undefined};
	savedPositions: SavedPosition[] = [];
	spawnColor: string =  "#6666ff";

	skipAnimations: boolean = false;

	turnController: TurnController;
	aiMoveGenerator: MoveGenerator;

	skillProcessor: EffectSystem;

	constructor(turnController: TurnController, moveGenerator: MoveGenerator) {
		this.turnController = turnController;
		this.aiMoveGenerator = moveGenerator;
		this.skillProcessor = new EffectSystem();
	}

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

		if (this.isBattleBlocked(battle)) return; // TODO

		if (battle.selectedTile) {
			this.battleProcessMovement(game, battle.selectedTile, {x: x, y: y}, battle.selectedActor);
			battle.selectedTile = undefined;
			battle.selectedActor = undefined;
			return;
		}

		this.battleSelectTile(game, battle, x, y);
	}

	isBattleBlocked(battle: Battle): boolean {
		if (this.turnController.isMovementBlocked()) return true; // TODO
		if (!battle.playerPhase) return true;
		return false;
	}

	battleSelectTile(game: Game, battle: Battle, x: number, y: number) {
		battle.selectedTile = {x: x, y: y};
		battle.selectedActor = this.isMouseOverPedestrian(game);
		if (battle.selectedActor?.moved) {
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


	battleProcessMovement(game: Game, from: Position, to: Position, actor: BattleActor | undefined) {
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

		if (!this.currentHero.hero) {
			this.currentHero.hero = this.isMouseOverPedestrian(game);
			this.currentHero.initialPosition = {x: x, y: y};
			return;
		}

		const placed = battle.placeHero(this.currentHero.hero, {x: x, y: y});
		if (!placed) {
			return;
		}
		this.currentHero.hero.selected = false;
		if (game.state.pedestrians.indexOf(this.currentHero.hero) < 0) {
			game.state.pedestrians.push(this.currentHero.hero);
		}
		this.currentHero.hero = undefined;

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
		if (!moving && this.turnController.isMovementBlocked()) {
			this.turnController.tryUnlockMovement();
			this.onTurnEnd(game);
		}
	}

	calcState(game: Game, deltaTime: number, _minuteEnded: boolean) {
		this.calcBuildingsState(game, deltaTime);
		this.calcPedestriansState(game, deltaTime);
	}

	selectHero(hero: BattleActor) {
		if (this.currentHero.hero) this.currentHero.hero.selected = false;
		this.currentHero.hero = hero;
		this.currentHero.hero.selected = true;
	}

	onTurnEnd(game: Game) {
		this.turnController.onTurnEnd(game);
		if (!game.state.currentBattle?.playerPhase) {
			this.aiMove(game);
		}
	}

	aiMove(game: Game) {
		console.log("enemy phase");
		const unitsToMove = this.turnController.getUnitsForAiToMove(game);
		this.aiMoveGenerator.makeMove(game, unitsToMove);
		const turnEnded = this.turnController.tryEndTurn(game, this.skipAnimations);
		if (turnEnded) this.onTurnEnd(game);
	}

	useSkill(game: Game, skill: Skill, actor: BattleActor, position: Position) {
		if (!game.state.currentBattle) return;
		const battle = game.state.currentBattle;

		let target: Position | BattleActor = position;
		for (let pedestrian of game.state.pedestrians) {
			const pos = pedestrian.positionSquare;
			if(pos.x == position.x && pos.y == position.y) {
				target = pedestrian as BattleActor;
				break;
			}
		}

		for (let effect of skill.effect) {
			this.skillProcessor.emit(
				actor,
				target,
				effect,
				battle.getPedestrians(),
				game.map
			)
		}
	}

	cancelCurrentMove() {
		if (!this.currentHero.hero) return;
		if (!this.currentHero.initialPosition) return;
		const actor = this.currentHero.hero;
		actor.setPosition(this.currentHero.initialPosition);

		actor.path = undefined;
		actor.goal = undefined;
		actor.moved = false;
	}
}

interface SavedPosition {
	color: string;
	position: Position;
}
