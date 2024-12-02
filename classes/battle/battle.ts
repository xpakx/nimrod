import { Position } from "../map-layer";
import { BattleActor } from "./actor";

export class Battle {
	public battleStarted = false;
	public selectedTile?: Position;
	public selectedActor?: BattleActor;

	public heroes: BattleActor[] = [];
	public enemies: BattleActor[] = [];
	public maxHeroes: number = 6;

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
		if(this.maxHeroes >= this.heroes.length) {
			return false;
		}
		this.heroes.push(hero);
		return true;
	}
}
