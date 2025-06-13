import { Position } from "../map-layer";
import { BattleActor } from "./actor";

export class Battle {
	public battleStarted = false;
	public selectedTile?: Position;
	public selectedActor?: BattleActor;

	public heroes: BattleActor[] = [];
	public enemies: BattleActor[] = [];
	public maxHeroes: number = 6;
	public playerSpawns: Position[] = [];

	public currentTurn: number = 0;
	public playerPhase: boolean = true;
	public playerStarts: boolean = true;

	getPedestrians(): BattleActor[] {
		const pedestrians = [];
		pedestrians.push(...this.heroes, ...this.enemies);
		return pedestrians;
	}

	selectHero(num: number) {
		if (num < 0 || num >= this.heroes.length) {
			return;
		}
		this.selectedActor = this.heroes[num];
	}

	addHero(hero: BattleActor): boolean {
		if(!this.battleStarted) {
			return false;
		}
		if(this.maxHeroes >= this.heroes.length) {
			return false;
		}
		this.heroes.push(hero);
		return true;
	}

	placeHero(hero: BattleActor, pos: Position): boolean {
		if(this.battleStarted) {
			return false;
		}
		if (!this.isInSpawn(pos)) {
			return false;
		}
		if (this.heroes.indexOf(hero) < 0) {
			return false;
		}
		hero.setPosition(pos);
		hero.placed = true;
		return true;
	}

	isPlacementFinished(): boolean {
		return this.heroes.every((h) => h.placed);
	}

	finishPlacement() {
		if(!this.isPlacementFinished()) {
			return;
		}
		this.battleStarted = true;
		this.currentTurn = 1;
		this.playerPhase = this.playerStarts;
		this.selectedActor = undefined;
	}

	isInSpawn(pos: Position): boolean {
		if(this.playerSpawns?.length == 0) {
			return true;
		}
		return this.playerSpawns.some((p) => p.x == pos.x && p.y == pos.y);
	}
}
