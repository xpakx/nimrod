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
		if (this.worker) {
			const worker = this.worker as DeliveryWorker;
			worker.homeBuilding = this;
		}
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
	
	registerOrder(order: DeliveryOrder, map: MapLayer): number {
		if (!(order.resource in this.storage)) return 0;
		if (!this.worker) return 0;
		if (order.to) return this.registerDeliveryOrder(order, map)
		else if (order.from) return this.registerRetrievingOrder(order, map);
		return 0;
	}

	registerDeliveryOrder(order: DeliveryOrder, map: MapLayer): number {
		if (!this.workerSpawn) return 0;
		const building = order.to!;
		const resource = order.resource;
		const amount = order.amount;

		if (!building.workerSpawn) return 0;

		const dist = map.getDistance(this.workerSpawn, building.workerSpawn);
		if (dist == Infinity) return 0;
		if (dist > this.maxDistance) return 0;
		
		const inStorage = this.storage[resource];
		const toDeliver = Math.min(inStorage, amount);
		this.storage[resource] -= toDeliver;

		const worker = this.worker as DeliveryWorker;
		worker.startOrder(order, toDeliver);
		this.readyToSpawn = true;

		return toDeliver;
	}

	registerRetrievingOrder(order: DeliveryOrder, map: MapLayer): number {
		if (!this.workerSpawn) return 0;
		const building = order.from!;
		const resource = order.resource;

		if (!building.workerSpawn) return 0;

		const dist = map.getDistance(this.workerSpawn, building.workerSpawn);
		if (dist == Infinity) return 0;
		if (dist > this.maxDistance) return 0;
		
		const inStorage = this.storage[resource];
		if (inStorage >= this.capacity) return 0; // TODO

		const worker = this.worker as DeliveryWorker;
		worker.startOrder(order);
		this.readyToSpawn = true;

		return 0; // TODO
	}

	setWorker(sprite: ActorSprite) {
		this.worker = new DeliveryWorker(sprite, this.workerSpawn);
	}
}

export class DeliveryWorker extends BuildingWorker {
	order?: DeliveryOrder;
	homeBuilding?: Building;

	tick(deltaTime: number, map: MapLayer, _randMap: number[]): boolean {
		const result =  this.tickInternal(deltaTime, map);
		this.handleDeath();
		return result;
	}

	startOrder(order: DeliveryOrder, toDeliver: number = 0) {
		const building = order.from ? order.from : order.to;
		if (!building) return;
		this.order = order;
		this.isAwayFromHome = true;
		this.dead = false;
		this.travelFinished = false;
		this.goal = building.workerSpawn;
		this.resource = order.resource;
		this.inventory = toDeliver;
	}

	tickInternal(deltaTime: number, map: MapLayer): boolean {
		if(this.travelFinished) return this.returnToHome(deltaTime, map);
		return this.realizeOrder(deltaTime, map);
	}

	realizeOrder(deltaTime: number, map: MapLayer): boolean {
		if(!this.goal || this.reachedGoal()) {
			const foundGoal = this.nextGoal(map);
			if (!foundGoal) {
				this.travelFinished = true; // TODO: time to unpack?
				if (this.order?.to) this.unpackOrder(this.order.to);
				else if(this.order?.from) this.getOrder(this.order.from);
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

	returnHome(deltaTime: number, map: MapLayer): boolean {
		const result = super.returnToHome(deltaTime, map);
		if (this.dead) this.unpackOrder(this.homeBuilding!); // TODO: only if returned to home
		return result;
	}

	unpackOrder(building: Building) {
		if (!this.resource) return;
		const amount = building.supply(this, this.resource, this.inventory);
		this.inventory -= amount;

		if (this.order?.to) {
			this.order.amount -= amount;
		}
	}

	getOrder(building: Building) {
		// TODO: make sure to not take more than home can store
		if (!this.order) return;
		this.resource = this.order.resource;
		this.inventory = building.getResources(this, this.order.resource, this.order.amount);

		this.order.amount -= this.inventory;
	}
}

export interface DeliveryOrder {
	from?: Building;
	to?: Building;
	resource: string;
	amount: number;
}
