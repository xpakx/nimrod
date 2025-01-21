import { Building, BuildingPrototype, BuildingWorker, HouseOptions } from "../buildings.js";
import { GameState } from "../game-state.js";
import { Position } from "../map-layer.js";

export class House extends Building {
	storage: { [key: string]: number } = { "water": 0, "food": 0 }; // TODO
	qualities: { [key: string]: number } = { "water": 0, "food": 0 }; // TODO
	population: number = 0;
	maxPopulation: number = 8;
	resourceNeeds: HouseResourceNeeds[] = [];

	constructor(prototype: BuildingPrototype, position: Position, accepted: boolean = true) {
		super(prototype, position, accepted);
		if (prototype.houseOptions !== undefined) {
			this.initializeHouse(prototype.houseOptions);
		}
		this.accepts.add("water");
		this.accepts.add("food");
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
			this.checkQuality(need);
		}
	}

	checkQuality(need: HouseResourceNeeds): boolean {
		if (!need.quality) {
			return true;
		}
		const qualityCorrect = need.quality <= this.qualities[need.resource];
		this.qualities[need.resource] = Math.max(this.qualities[need.resource] - 1, 1); // TODO
		return qualityCorrect;
	}

	isOfBetterQuality(resource: string, newQuality: number): boolean {
		return this.qualities.hasOwnProperty(resource) && this.qualities[resource] < newQuality;
	}

	supply(worker: BuildingWorker, resource: string, inventory: number): number {
		const amountSupplied = super.supply(worker, resource, inventory);
		if (amountSupplied == 0) return amountSupplied;
		if (worker.resourceQuality && this.isOfBetterQuality(resource, worker.resourceQuality)) {
			this.qualities[resource] = worker.resourceQuality;
		}
		return amountSupplied;
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
