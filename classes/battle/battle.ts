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

	placeHero(num: number, pos: Position): boolean {
		console.log(num);
		console.log(pos);
		if(this.battleStarted) {
			console.log("Started already");
			return false;
		}
		if (num < 0 || num >= this.heroes.length) {
			console.log("Not a hero");
			return false;
		}
		if (!this.isInSpawn(pos)) {
			console.log("Not a spawn");
			return false;
		}
		let hero = this.heroes[num];
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
	}

	isInSpawn(pos: Position): boolean {
		if(this.playerSpawns?.length == 0) {
			return true;
		}
		return this.playerSpawns.some((p) => p.x == pos.x && p.y == pos.y);
	}
}
