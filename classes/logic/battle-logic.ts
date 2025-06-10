import { BattleActor } from "../battle/actor";
import { Game } from "../game";
import { getLogger, Logger } from "../logger.js";
import { Position } from "../map-layer";

export class BattleLogicLayer {
	logger: Logger = getLogger("BattleLogicLayer");

	currentHero?: BattleActor;


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

		if (!this.currentHero) {
			this.currentHero = this.isMouseOverPedestrian(game);
			return;
		}

		this.currentHero.selected = false;

		const placed = battle.placeHero(this.currentHero, {x: x, y: y});
		if (!placed) {
			return;
		}
		if (game.state.pedestrians.indexOf(this.currentHero) < 0) {
			game.state.pedestrians.push(this.currentHero);
		}
		this.currentHero = undefined;

		battle.finishPlacement();
		this.logger.debug(`started: ${game.state.currentBattle.battleStarted}`);
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

	selectHero(hero: BattleActor) {
		if (this.currentHero) this.currentHero.selected = false;
		this.currentHero = hero;
		this.currentHero.selected = true;
	}
}

type EffectType = "control" | "heal" | "damage" | "buff" | "debuff";

interface Effect {
	type: EffectType;
	name: string;
}

interface EffectApplyEvent {
	source: BattleActor;
	target: BattleActor | Position;
	radius?: number;
	line?: number;
	effect: Effect;
	duration?: number;

	blocks: { by: BattleActor; reason: string }[];
	mitigations: { by: BattleActor; chance: number }[];

	result?: "applied" | "blocked" | "mitigated";
	reactions: (() => void)[];
}

type EffectHandler = (event: EffectApplyEvent) => void;

class EffectSystem {
	private handlers: EffectHandler[] = [];

	on(handler: EffectHandler) {
		this.handlers.push(handler);
	}

	emit(source: BattleActor, target: BattleActor, effect: Effect) {
		const event: EffectApplyEvent = {
			source,
			target,
			effect,
			blocks: [],
			mitigations: [],
			reactions: [],
		};

		for (const handler of this.handlers) {
			handler(event);
		}

		this.resolve(event);
	}

	private resolve(e: EffectApplyEvent) {
		if (e.blocks.length === 0) {
			e.result = "applied";
		} else if (e.mitigations.length > 0) {
			e.result = "mitigated";
		} else {
			e.result = "blocked";
		}

		if (e.result === "applied" || e.result === "mitigated") {
			// apply effect
		}

		for (const reaction of e.reactions) {
			reaction();
		}
	}
}
