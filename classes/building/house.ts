import { Building, BuildingPrototype, HouseOptions } from "../buildings.js";
import { GameState } from "../game-state.js";
import { Position } from "../map-layer.js";

export class House extends Building {
	storage: { [key: string]: number } = { "water": 0, "food": 0 }; // TODO
	population: number = 8; // TODO
	maxPopulation: number = 8;


	constructor(prototype: BuildingPrototype, position: Position, accepted: boolean = true) {
		super(prototype, position, accepted);
		if (prototype.houseOptions !== undefined) {
			this.initializeHouse(prototype.houseOptions);
		}
	}

	initializeHouse(options: HouseOptions) {
		if (options.levels && options.levels.length > 0) {
			this.maxPopulation = options.levels[0].maxPopulation;
			this.storage = {};
			for (let need of options.levels[0].needs) {
				if ("resource" in need) this.storage[need.resource] = 0;
			}
		}
	}

	onMinuteEnd(state: GameState) {
		super.onMinuteEnd(state);
		const waterConsumption = Math.ceil(0.25 * this.population)
		const foodConsumption = Math.ceil(0.5 * this.population)
		this.consume("water", waterConsumption);
		this.consume("food", foodConsumption);
	}
}

export type HouseNeeds = HouseResourceNeeds | HouseVisitorNeeds;

interface HouseResourceNeeds {
	resource: string;
	quality?: number;
}

interface HouseVisitorNeeds {
	service: string;
	amount: number;
}

export interface HouseLevel {
	needs: HouseNeeds[];
	maxPopulation: number;
}
