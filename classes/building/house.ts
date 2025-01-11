import { Building, BuildingPrototype, HouseOptions } from "../buildings.js";
import { GameState } from "../game-state.js";
import { Position } from "../map-layer.js";

export class House extends Building {
	storage: { [key: string]: number } = { "water": 0, "food": 0 }; // TODO
	population: number = 8; // TODO
	maxPopulation: number = 8;
	resourceNeeds: HouseResourceNeeds[] = [];

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
			this.resourceNeeds = [];
			for (let need of options.levels[0].needs) {
				if ("resource" in need) {
					this.storage[need.resource] = 0;
					this.resourceNeeds.push(need);
				}
			}
		}
	}

	onMinuteEnd(state: GameState) {
		super.onMinuteEnd(state);
		for(let need of this.resourceNeeds) {
			const baseConsumption = need.consumption || 0;
			const perPerson = need.consumptionPerPerson || 0;
			const totalConsumption = baseConsumption + Math.ceil(perPerson * this.population)
			this.consume(need.resource, totalConsumption);
		}
	}
}

export type HouseNeeds = HouseResourceNeeds | HouseVisitorNeeds;

interface HouseResourceNeeds {
	resource: string;
	quality?: number;
	consumption?: number;
	consumptionPerPerson?: number;
}

interface HouseVisitorNeeds {
	service: string;
	amount: number;
}

export interface HouseLevel {
	needs: HouseNeeds[];
	maxPopulation: number;
}
