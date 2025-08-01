import { BattleActor } from "../battle/actor.js";
import { Heroes } from "../battle/actors.js";
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
	phase: "selection" | "movement" | "skill";
	hero?: BattleActor;
	initialPosition?: Position;
	skill?: Skill;
}

export class BattleLogicLayer {
	logger: Logger = getLogger("BattleLogicLayer");

	selection: HeroSelection = { phase: "selection" };
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

		if (this.selection.phase != "selection" && this.selection.hero) {
			this.processActorAction(game, battle, this.selection.hero, {x: x, y: y});
		} else {
			this.logger.debug("Selecting actor");
			this.battleSelectActor(game, battle, x, y);
		}

	}

	processActorAction(game: Game, battle: Battle, actor: BattleActor, target: Position) {
		if (!actor.moved && battle.selectedTile) {
			this.logger.debug("Processing movement");
			const moveAccepted = this.battleProcessMovement(game, battle.selectedTile, target, this.selection.hero);
			if (!moveAccepted) return;
			if (this.selection.hero) battle.selectedTile = undefined;
			if (moveAccepted) this.selection.phase = "skill";
			if (actor.finishedTurn) this.selection.phase = "selection";
		} else if (!actor.finishedTurn) {
			this.logger.debug("Processing skill", this.selection.skill);
			this.battleProcessSkill(game, actor, target);
			if (actor.finishedTurn) this.selection.phase = "selection";
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
		this.selection.hero = this.isMouseOverPedestrian(game);
		if (this.selection.hero?.moved) {
			this.selection.hero = undefined;
		}
		if (this.selection.hero) {
			this.switchToSkillMode(game, this.selection.hero);
			this.selection.phase = "movement";
		}
		this.logger.debug("Selected actor", this.selection.hero);
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
		if (this.selection.phase != "movement") return;
		if (!battle.selectedTile) return;
		const start = battle.selectedTile;
		if (!game.map.isTileOnMap(game.map.isoPlayerMouse)) {
			return;
		}

		if (this.selection.hero) {
			const dist = game.map.shortestPath(start, game.map.isoPlayerMouse, game.sprites.getArrow());
			game.map.pathCorrect =  dist <= this.selection.hero.movement;
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

		if (!this.selection.hero) {
			this.logger.debug("Selecting a hero from map.");
			this.selection.hero = this.isMouseOverPedestrian(game);
			this.selection.initialPosition = {x: x, y: y};
			this.selection.skill = undefined;
			this.logger.debug("Selected hero.", this.selection.hero);
			return;
		}

		const placed = battle.placeHero(this.selection.hero, {x: x, y: y});
		if (!placed) {
			this.logger.debug("Couldn't place a hero.");
			return;
		}
		this.selection.hero.selected = false;
		if (game.state.pedestrians.indexOf(this.selection.hero) < 0) {
			game.state.pedestrians.push(this.selection.hero);
		}
		this.logger.debug("Placed hero.", this.selection.hero);
		this.selection.hero = undefined;

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
		if (this.selection.hero) this.selection.hero.selected = false;
		this.selection.hero = hero;
		this.selection.hero.selected = true;
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
		if (!this.selection.hero) return;
		this.selection.hero.moved = true;
		this.selection.skill = skill;
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
		this.logger.debug(`Selecting target of type ${skill.targetType}`, position);
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
		if (!this.selection.skill) return false;
		if (!this.selection.hero) return false;
		if (!this.isSkillReady(this.selection.skill)) return false;
		if (!this.isTargetInReach(this.selection.skill, actor, position)) return false;
		const battle = game.state.currentBattle;

		let target = this.getTarget(game, this.selection.skill, position);
		if (!target) return false;
		if (this.selection.skill.targetType == "actor") {
			if (!this.isCorrectTarget(this.selection.skill, actor, target as BattleActor)) return false;
		}
		this.logger.debug("Selected target", target);

		this.switchToHeroMode(game);

		this.selection.skill.cooldownTimer = this.selection.skill.cooldown;
		for (let effect of this.selection.skill.effect) {
			this.skillProcessor.emitSkill(
				actor,
				target,
				effect,
				this.selection.skill,
				battle.getPedestrians(),
				game.map
			)
		}
		return true;
	}

	battleProcessSkill(game: Game, actor: BattleActor, position: Position) {
		if (!this.selection.skill) return;
		const skillUsed = this.useSkill(game, actor, position);
		if (!skillUsed) return;
		actor.finishedTurn = true;
		this.selection.skill = undefined;
		this.selection.hero = undefined;

		const turnEnded = this.turnController.checkTurnEnd(game, this.skipAnimations);
		if (turnEnded) this.onTurnEnd(game);
	}

	cancelCurrentMove() {
		if (!this.selection.hero) return;
		if (!this.selection.initialPosition) return;
		const actor = this.selection.hero;
		actor.setPosition(this.selection.initialPosition);

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

	isCorrectTarget(skill: Skill, source: BattleActor, target: BattleActor): boolean {
		if (!skill.targetSubtype) return true;
		if (skill.targetSubtype == "ally") return Heroes.areAllies(source, target);
		return Heroes.areEnemies(source, target);
	}

	// TODO: add to interface
	skipActor(game: Game) {
		const actor = this.selection.hero;
		if (!actor) return;
		this.selection.skill = undefined;
		this.selection.hero = undefined;
		game.state.currentBattle = undefined;

		actor.finishedTurn = true;
		actor.moved = true;
		this.switchToHeroMode(game);

		const turnEnded = this.turnController.checkTurnEnd(game, this.skipAnimations);
		if (turnEnded) this.onTurnEnd(game);
	}
}

interface SavedPosition {
	color: string;
	position: Position;
}
