import { BattleActor } from "../battle/actor.js";
import { Battle } from "../battle/battle.js";
import { EffectSystem } from "../battle/effect-system.js";
import { Skill } from "../battle/skill/skill.js";
import { Game } from "../game.js";
import { BattleSidebar } from "../interface/battle-sidebar.js";
import { BattleTab } from "../interface/battle-tab.js";
import { getLogger, Logger } from "../logger.js";
import { Position } from "../map-layer.js";
import { MoveGenerator } from "./ai/move.js";
import { TurnController } from "./turn/turn.js";


interface HeroSelection {
	hero?: BattleActor;
	initialPosition?: Position;
	skill?: Skill;
}

export class BattleLogicLayer {
	logger: Logger = getLogger("BattleLogicLayer");

	currentHero: HeroSelection = {};
	savedPositions: SavedPosition[] = [];
	spawnColor: string =  "#6666ff";

	skipAnimations: boolean = false;

	turnController: TurnController;
	aiMoveGenerator: MoveGenerator;

	skillProcessor: EffectSystem;

	constructor(turnController: TurnController,
		    moveGenerator: MoveGenerator,
		    effectSystem: EffectSystem) {
		this.turnController = turnController;
		this.aiMoveGenerator = moveGenerator;
		this.skillProcessor = effectSystem;
	}

	showSpawnArea(game: Game) {
		this.logger.debug("Hiding spawn area.");
		if (!game.state.currentBattle) return;
		const battle = game.state.currentBattle;

		for (let position of battle.playerSpawns) {
			const color = game.map.getColor(position);
			this.savedPositions.push({position: position, color: color});
			game.map.setColor(position, this.spawnColor);
		}
		this.logger.debug("Spawn area hidden.");
	}

	restoreSpawnsColor(game: Game) {
		this.logger.debug("Restoring spawn area");
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

		if (this.isBattleBlocked(battle)) {
			// TODO: inform user
			this.logger.debug("Battle is blocked. Cannot initiate an action.");
			return;
		}

		if (battle.selectedActor) {
			this.processActorAction(game, battle, battle.selectedActor, {x: x, y: y});
		} else {
			this.logger.debug("Selecting actor");
			this.battleSelectActor(game, battle, x, y);
		}

	}

	processActorAction(game: Game, battle: Battle, actor: BattleActor, target: Position) {
		if (!actor.moved && battle.selectedTile) {
			this.logger.debug("Processing movement");
			const moveAccepted = this.battleProcessMovement(game, battle.selectedTile, target, battle.selectedActor);
			if (!moveAccepted) return;
			if (battle.selectedActor) battle.selectedTile = undefined;
			if (actor.finishedTurn) battle.selectedActor = undefined;
		} else if (!actor.finishedTurn) {
			this.logger.debug("Processing skill");
			this.battleProcessSkill(game, actor, target);
			if (actor.finishedTurn) battle.selectedActor = undefined;
		}
		this.updatePortraits(game);
	}

	isBattleBlocked(battle: Battle): boolean {
		if (this.turnController.isMovementBlocked()) return true;
		if (!battle.playerPhase) return true;
		return false;
	}

	battleSelectActor(game: Game, battle: Battle, x: number, y: number) {
		battle.selectedTile = {x: x, y: y};
		battle.selectedActor = this.isMouseOverPedestrian(game);
		if (battle.selectedActor?.moved) {
			battle.selectedActor = undefined;
		}
		if (battle.selectedActor) {
			this.switchToSkillMode(game, battle.selectedActor);
		}
		this.logger.debug("Selected actor", battle.selectedActor);
		this.logger.debug("Selected tile", battle.selectedTile);
	}

	switchToSkillMode(game: Game, hero: BattleActor) {
		if (!game.state.currentBattle?.battleStarted) return;
		const interf = game.interf.sidebars.get("battle");
		if (!interf) return;
		const tab = interf.tabs[0] as BattleTab;
		tab.switchToSkillMode(hero);
	}

	switchToHeroMode(game: Game) {
		const interf = game.interf.sidebars.get("battle");
		if (!interf) return;
		const tab = interf.tabs[0] as BattleTab;
		tab.switchToHeroMode();
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


	battleProcessMovement(game: Game, from: Position, to: Position, actor: BattleActor | undefined): boolean {
		if (!actor || actor.enemy) {
			game.map.clearPath();
			return false;
		}
		const dist = game.map.shortestPath(from, to, game.sprites.getArrow());
		let path = game.map.path?.map((x) => x.position);
		if (dist > actor.movement || !path) return false;
		game.map.clearPath();
		this.moveActor(actor, to, path);
		actor.moved = true;
		if (actor.skills.length == 0) actor.finishedTurn = true;
		const turnEnded = this.turnController.checkTurnEnd(game, this.skipAnimations);
		if (turnEnded) this.onTurnEnd(game);
		return true;
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
			this.logger.debug("Clicked outside the map.", game.map.isoPlayerMouse);
			return;
		}
		if (game.map.isBlocked(game.map.isoPlayerMouse)) {
			this.logger.debug("Position is blocked.", game.map.isoPlayerMouse);
			return;
		}
		const battle = game.state.currentBattle;
		const x = game.map.isoPlayerMouse.x;
		const y = game.map.isoPlayerMouse.y;

		if (!this.currentHero.hero) {
			this.logger.debug("Selecting a hero from map.");
			this.currentHero.hero = this.isMouseOverPedestrian(game);
			this.currentHero.initialPosition = {x: x, y: y};
			this.currentHero.skill = undefined;
			this.logger.debug("Selected hero.", this.currentHero.hero);
			return;
		}

		const placed = battle.placeHero(this.currentHero.hero, {x: x, y: y});
		if (!placed) {
			this.logger.debug("Couldn't place a hero.");
			return;
		}
		this.currentHero.hero.selected = false;
		if (game.state.pedestrians.indexOf(this.currentHero.hero) < 0) {
			game.state.pedestrians.push(this.currentHero.hero);
		}
		this.logger.debug("Placed hero.", this.currentHero.hero);
		this.currentHero.hero = undefined;

		battle.finishPlacement();

		this.logger.debug(`started: ${game.state.currentBattle.battleStarted}`);
		if (battle.battleStarted) {
			this.restoreSpawnsColor(game);
			this.registerPassives(game);
			if (!battle.playerPhase) this.aiMove(game);
		}
	}

	calcBuildingsState(_game: Game, _deltaTime: number) { }

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
			this.logger.debug("Movement finished.");
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
		this.logger.debug("Turn end");
		this.turnController.onTurnEnd(game);
		if (!game.state.currentBattle?.playerPhase) {
			this.aiMove(game);
		}
	}

	aiMove(game: Game) {
		this.logger.debug("Enemy phase");
		const unitsToMove = this.turnController.getUnitsForAiToMove(game);
		this.aiMoveGenerator.makeMove(game, unitsToMove);
		const turnEnded = this.turnController.tryEndTurn(game, this.skipAnimations);
		if (turnEnded) this.onTurnEnd(game);
	}

	selectSkill(game: Game, skill: Skill) {
		if (!game.state.currentBattle) return;
		const battle = game.state.currentBattle;
		if (!battle.selectedActor) return;
		battle.selectedActor.moved = true;
		// TODO: simplify
		this.currentHero.hero = battle.selectedActor;
		this.currentHero.skill = skill;
	}

	private getTaxicabDistance(actor: BattleActor, pos1: Position): number {
		const pos2 = actor.positionSquare;
		return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y)
	}

	private getTargetActor(game: Game, position: Position): BattleActor | undefined {
		for (let pedestrian of game.state.pedestrians) {
			const pos = pedestrian.positionSquare;
			if(pos.x == position.x && pos.y == position.y) {
				return pedestrian as BattleActor;
			}
		}
	}

	isSkillReady(skill: Skill): boolean {
		return skill.cooldownTimer <= 0;
	}

	private getTarget(game: Game, skill: Skill, position: Position): Position | BattleActor | undefined {
		if (skill.targetType == "square") return position;
		return this.getTargetActor(game, position);
	}

	private isTargetInReach(skill: Skill, actor: BattleActor, position: Position): boolean {
		const taxicabDist = this.getTaxicabDistance(actor, position);
		const maxDistance = skill.maxDistance;
		return taxicabDist <= maxDistance;
	}

	useSkill(game: Game, actor: BattleActor, position: Position): boolean {
		if (!game.state.currentBattle) return false;
		if (!this.currentHero.skill) return false;
		if (!this.currentHero.hero) return false;
		if (!this.isSkillReady(this.currentHero.skill)) return false;
		if (!this.isTargetInReach(this.currentHero.skill, actor, position)) return false;
		const battle = game.state.currentBattle;

		let target = this.getTarget(game, this.currentHero.skill, position);
		if (!target) return false;

		this.switchToHeroMode(game);

		this.currentHero.skill.cooldownTimer = this.currentHero.skill.cooldown;
		for (let effect of this.currentHero.skill.effect) {
			this.skillProcessor.emitSkill(
				actor,
				target,
				effect,
				this.currentHero.skill,
				battle.getPedestrians(),
				game.map
			)
		}
		return true;
	}

	battleProcessSkill(game: Game, actor: BattleActor, position: Position) {
		if (!this.currentHero.skill) return;
		const skillUsed = this.useSkill(game, actor, position);
		if (!skillUsed) return;
		actor.finishedTurn = true;
		this.currentHero.skill = undefined;
		this.currentHero.hero = undefined;

		const turnEnded = this.turnController.checkTurnEnd(game, this.skipAnimations);
		if (turnEnded) this.onTurnEnd(game);
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

	registerHeroPassives(actor: BattleActor) {
		for (let skill of actor.skills) {
			if (!skill.passive) return;
			for (let effect of skill.effect) {
				if ("handler" in effect) {
					this.skillProcessor.on(effect.handler, actor, effect.hook);
				}
			}
		}
	}

	registerPassives(game: Game) {
		if (!game.state.currentBattle) return;
		const battle = game.state.currentBattle;
		battle.enemies.forEach((a) => this.registerHeroPassives(a));
		battle.heroes.forEach((a) => this.registerHeroPassives(a));
	}

	updatePortraits(game: Game) {
		const sidebar = game.interf.sidebars.get("battle") as BattleSidebar | undefined;
		if (!sidebar) return;
		const heroTab = sidebar.tabs[0];
		heroTab.updateButtons();
	}
}

interface SavedPosition {
	color: string;
	position: Position;
}
