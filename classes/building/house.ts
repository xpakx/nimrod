import { Building } from "../buildings.js";
import { GameState } from "../game-state.js";

export class House extends Building {
	storage: { [key: string]: number } = { "water": 0 }; // TODO
	population: number = 8; // TODO
	maxPopulation: number = 8;

	onMinuteEnd(state: GameState) {
		super.onMinuteEnd(state);
		const waterConsumption = Math.ceil(0.25 * this.population)
		this.storage["water"] = Math.max(this.storage["water"] - waterConsumption, 0);
		console.log(`${this.name} water is ${this.storage["water"]} at (${this.position.x}, ${this.position.y})`);
	}
}
