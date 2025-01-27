import { ActorSprite } from "../actor.js";
import { Building, BuildingPrototype, BuildingWorker, StorageOptions } from "../buildings.js";
import { MapLayer, Position } from "../map-layer.js";

export class Storage extends Building {
	storage: { [key: string]: number } = { "water": 0, "food": 0 }; // TODO
	deliveryInProgress: boolean = false;
	maxDistance: number = 30;

	constructor(prototype: BuildingPrototype, position: Position, accepted: boolean = true) {
		super(prototype, position, accepted);
		if (prototype.storageOptions) this.initializeResources(prototype.storageOptions);
	}

	tick(_deltaTime: number) {
		if(!this.worker || this.worker.isAwayFromHome || !this.workerSpawn) {
			return false;
		}
	}

	initializeResources(options: StorageOptions) {
		if (options.resources) {
			for(let resource of options.resources) {
				this.storage[resource] = 0;
			}
		}
		if (options.capacity) {
			this.capacity = options.capacity;
		}
	}
	
	order(resource: string, amount: number, building: Building, map: MapLayer): number {
		if (!(resource in this.storage)) return 0;
		if (!this.workerSpawn) return 0;
		if (!this.worker) return 0;
		if (!building.workerSpawn) return 0;

		const dist = map.getDistance(this.workerSpawn, building.workerSpawn);
		if (dist == Infinity) return 0;
		if (dist > this.maxDistance) return 0;
		
		const inStorage = this.storage[resource];
		const toDeliver = Math.min(inStorage, amount);
		this.storage[resource] -= toDeliver;

		this.readyToSpawn = true;
		this.worker.isAwayFromHome = true;
		this.worker.dead = false;
		this.worker.travelFinished = false;
		this.worker.goal = building.workerSpawn;
		this.worker.resource = resource;
		this.worker.inventory = toDeliver;

		return toDeliver;
	}

	setWorker(sprite: ActorSprite) {
		this.worker = new DeliveryWorker(sprite, this.workerSpawn);
	}
}

export class DeliveryWorker extends BuildingWorker {
	tick(deltaTime: number, map: MapLayer, _randMap: number[]): boolean {
		const result =  this.tickInternal(deltaTime, map);
		this.handleDeath();
		return result;
	}

	tickInternal(deltaTime: number, map: MapLayer): boolean {
		if(this.travelFinished) return this.returnToHome(deltaTime, map);
		return this.deliverOrder(deltaTime, map);
	}

	deliverOrder(deltaTime: number, map: MapLayer): boolean {
		if(!this.goal || this.reachedGoal()) {
			const foundGoal = this.nextGoal(map);
			if (!foundGoal) {
				this.travelFinished = true; // TODO: time to unpack?
				return false;
			}
		}
		this.updatePosition(this.direction.x*deltaTime, this.direction.y*deltaTime);

		if (this.positionSquare.x + this.positionSquare.y != this.diagonal) {
			this.diagonal = this.positionSquare.x + this.positionSquare.y;
			return true;
		}
		return false;
	}
}
