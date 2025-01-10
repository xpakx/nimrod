import { Building } from "../buildings.js";
import { GameState } from "../game-state.js";

export class House extends Building {
	storage: { [key: string]: number } = { "water": 0, "food": 0 }; // TODO
	population: number = 8; // TODO
	maxPopulation: number = 8;

	onMinuteEnd(state: GameState) {
		super.onMinuteEnd(state);
		const waterConsumption = Math.ceil(0.25 * this.population)
		const foodConsumption = Math.ceil(0.5 * this.population)
		this.consume("water", waterConsumption);
		this.consume("food", foodConsumption);
	}
}
