import { Building, BuildingPrototype } from "../buildings.js";
import { MapLayer, Position } from "../map-layer.js";

export class Storage extends Building {
	storage: { [key: string]: number } = { "water": 0, "food": 0 }; // TODO
	deliveryInProgress: boolean = false;
	maxDistance: number = 30;

	constructor(prototype: BuildingPrototype, position: Position, accepted: boolean = true) {
		super(prototype, position, accepted);
		this.initializeResources();
	}

	initializeResources() {

	}
	
	order(resource: string, amount: number, building: Building, map: MapLayer): number {
		if (!this.canSpawnWorker()) return 0;
		if (!this.workerSpawn) return 0;
		if (!building.workerSpawn) return 0;

		const dist = map.getDistance(this.workerSpawn, building.workerSpawn);
		if (dist == Infinity) return 0;
		if (dist > this.maxDistance) return 0;
		
		const inStorage = resource in this.storage ? this.storage[resource] : 0;
		const toDeliver = Math.min(inStorage, amount);
		this.storage[resource] -= toDeliver;

		// TODO: send worker;
		return toDeliver;
	}
}
