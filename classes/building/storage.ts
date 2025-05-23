import { Actor, ActorSprite } from "../actor.js";
import { Building, BuildingPrototype, BuildingWorker, Recipe, StorageOptions } from "./buildings.js";
import { getLogger, Logger } from "../logger.js";
import { MapLayer, Position, Size } from "../map-layer.js";

export class Storage extends Building {
	storage: { [key: string]: number } = {}; // TODO
	deliveryInProgress: boolean = false;
	maxDistance: number = 30;
	logger: Logger = getLogger("Storage");

	constructor(prototype: BuildingPrototype, position: Position, accepted: boolean = true) {
		super(prototype, position, accepted);
		if (prototype.storageOptions) this.initializeResources(prototype.storageOptions);
		if (prototype.workerOptions) this.setWorker(prototype.workerOptions.sprite);
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
		this.logger.debug("Registering order");
		if (!(order.resource in this.storage)) return 0;
		this.logger.debug("Accepting resource");
		if (!this.worker) return 0;
		this.logger.debug("Has worker");
		if (this.worker.isAwayFromHome) return 0;
		this.logger.debug("Worker in building");
		if (order.to) return this.registerDeliveryOrder(order, map)
		else if (order.from) return this.registerRetrievingOrder(order, map);
		return 0;
	}

	registerDeliveryOrder(order: DeliveryOrder, map: MapLayer): number {
		if (!this.workerSpawn) return 0;
		const building = order.to!;
		const resource = order.resource;
		const amount = order.notScheduled ?? order.amount;

		if (!building.workerSpawn) return 0;

		const dist = map.getDistance(this.workerSpawn, building.workerSpawn);
		if (dist == Infinity) return 0;
		if (dist > this.maxDistance) return 0;
		
		const inStorage = this.storage[resource];
		const toDeliver = Math.min(inStorage, amount);
		this.storage[resource] -= toDeliver;

		const worker = this.worker as DeliveryWorker;
		worker.startOrder(order, toDeliver);
		this.logger.debug(`Started delivery order: ${resource} (${toDeliver})`);
		this.addBuildingToOrder(order);
		this.readyToSpawn = true;

		return toDeliver;
	}

	addBuildingToOrder(order: DeliveryOrder) {
		if (order.assignedBuildings) {
			order.assignedBuildings.push(this);
		} else {
			order.assignedBuildings = [this];
		}
	}

	inDistance(building: Building, map: MapLayer): boolean {
		if (!this.workerSpawn) return false;
		if (!building.workerSpawn) return false;
		const dist = map.getDistance(this.workerSpawn, building.workerSpawn);
		if (dist == Infinity) return false;
		return dist <= this.maxDistance;
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
		const capacity = this.capacity - inStorage;
		if (capacity <= 0) return 0;
		const amount = Math.min(capacity, order.amount);

		const worker = this.worker as DeliveryWorker;
		worker.startOrder(order);
		this.logger.debug(`Started retrieving order: ${resource} (${amount})`);
		worker.toFetch = amount;
		this.addBuildingToOrder(order);
		this.readyToSpawn = true;

		return amount;
	}

	setWorker(sprite: ActorSprite) {
		this.worker = new DeliveryWorker(sprite, this.workerSpawn);
	}

	supply(worker: BuildingWorker, resource: string, inventory: number): number {
		if (worker != this.worker) return super.supply(worker, resource, inventory);
		if (this.storage.hasOwnProperty(resource) && inventory > 0 && this.storage[resource] < this.capacity) {
			const amount = Math.min(inventory, this.capacity - this.storage[resource]);
			this.storage[resource] += amount;
			return amount;
		}
		return 0;
	}
}

export class DeliveryWorker extends BuildingWorker {
	order?: DeliveryOrder;
	homeBuilding?: Building;
	toFetch: number = 0;
	logger: Logger = getLogger("DeliveryWorker");

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
		this.resource = order.resource;
		this.inventory = toDeliver;
	}

	nextGoal(map: MapLayer): boolean {
		const ultimateGoal = this.getUltimateGoal();
		if (!ultimateGoal) return false;
		const step = map.getNextStep(this.positionSquare, ultimateGoal);
		if(!step) {
			return false;
		}
		this.goal = step;
		this.direction.x = step.x - this.positionSquare.x;
		this.direction.y = step.y - this.positionSquare.y;
		return true;
	}

	getUltimateGoal(): undefined | Position {
		if (this.travelFinished) return this.home;
		if (!this.order) return undefined;
		const building = this.order.from ? this.order.from : this.order.to;
		if (!building) return undefined;
		return building.workerSpawn;
	}

	tickInternal(deltaTime: number, map: MapLayer): boolean {
		// TODO: aligning
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

	returnToHome(deltaTime: number, map: MapLayer): boolean {
		const result = super.returnToHome(deltaTime, map);
		if (this.dead && this.atSpawn()) this.unpackOrder(this.homeBuilding!);
		return result;
	}

	atSpawn(): boolean {
		if (!this.homeBuilding) return false;
		const spawn = this.homeBuilding.workerSpawn;
		if (!spawn) return false
		return this.positionSquare.x == spawn.x && this.positionSquare.y == spawn.y;
	}

	unpackOrder(building: Building) {
		this.logger.debug("Unpacking order");
		if (!this.resource) return;
		const amount = building.supply(this, this.resource, this.inventory);
		this.logger.debug(`Supplied ${amount} of ${this.resource}`);
		this.inventory -= amount;

		if (this.order?.to) {
			this.order.amount -= amount;
		}
	}

	getOrder(building: Building) {
		this.logger.debug("Getting order");
		if (!this.order) return;
		this.resource = this.order.resource;
		this.inventory = building.getResources(this, this.order.resource, this.toFetch);
		this.order.amount -= this.inventory;
		this.logger.debug(`Got ${this.inventory} of ${this.resource}`);
	}
}

export interface DeliveryOrder {
	from?: Building;
	to?: Building;
	resource: string;
	amount: number;
	notScheduled?: number;
	assignedBuildings?: Storage[];
}

export class DeliveryScheduler {
	orderMap: Map<string, DeliveryOrder>[][] = [];
	toSchedule: DeliveryOrder[] = [];
	nondeliverable: Set<string> = new Set<string>();;
	timeSinceLastScheduling: number = 0;
	schedulingFrequencyInSeconds: number = 5;
	logger = getLogger("DeliveryScheduler");

	constructor() {
		this.nondeliverable.add("water");
	}

	updateDimensions(size: Size) {
		this.orderMap = Array(size.height)
		.fill(null)
		.map(() => 
		     Array(size.width)
		     .fill(null)
		     .map(() => new Map<string, DeliveryOrder>())
		    );
	}

	addOrder(order: DeliveryOrder) {
		const building = order.from ? order.from : order.to;
		if (!building) return;
		const orders = this.getOrdersForBuilding(building);
		if (orders.has(order.resource)) this.invalidateOrder(order);
		orders.set(order.resource, order);
	}

	getOrdersForBuilding(building: Building): Map<string, DeliveryOrder> {
		return this.orderMap[building.position.y][building.position.x];
	}

	hasDeliveryOrder(building: Building, resource: string): boolean {
		const orders = this.getOrdersForBuilding(building);
		const order = orders.get(resource);
		if (!order) return false;
		if (!order.to) return false;
		if (order.to !== building) return false;
		return order.amount > 0;
	}

	hasRetrievingOrder(building: Building, resource: string) {
		const orders = this.getOrdersForBuilding(building);
		const order = orders.get(resource);
		if (!order) return false;
		if (!order.from) return false;
		if (order.from !== building) return false;
		return order.amount > 0;
	}

	invalidateOrder(order: DeliveryOrder) {
		if (order.amount == 0) return;
		this.resetWorkers(order);
		order.amount = 0;
		order.assignedBuildings = [];
	}

	resetWorkers(order: DeliveryOrder) {
		if (!order.assignedBuildings) return;
		for (let storage of order.assignedBuildings) {
			const worker = storage.worker as DeliveryWorker | undefined;
			if (!worker) continue;
			worker.travelFinished = true;
			worker.order = undefined;
		}
	}

	scheduleOrder(order: DeliveryOrder) {
		if(this.toSchedule.includes(order)) return;
		this.toSchedule.push(order);
	}

	onBuildingDeletion(building: Building | undefined) {
		if (!building) return;
		const orders = this.getOrdersForBuilding(building);
		for (const order of orders.values()) {
			this.invalidateOrder(order);
		}
		orders.clear();
		if (building instanceof Storage) this.onStorageDeletion(building);
	}

	onStorageDeletion(storage: Storage) {
		if (!storage.worker) return;
		this.onWorkerDeath(storage.worker); 
	}

	clearWorkerOrder(worker: DeliveryWorker, order: DeliveryOrder) {
		worker.order = undefined;
		if (order.amount <= 0) return;
		if (order.to) {
			if (!order.notScheduled) order.notScheduled = 0;
			order.notScheduled += worker.inventory;
		} else if (order.from) {
			if (!order.notScheduled) order.notScheduled = 0;
			order.notScheduled += worker.toFetch;
		}
	}

	onBuildingCreation(building: Building | undefined) {
		if (!building) return;
		if (!building.constructed) {
			this.checkRequirements(building);
			return;
		}
		if (!building.recipes) return;
		this.checkRecipes(building);
	}

	onWorkerDeath(worker: Actor) {
		if (!(worker instanceof DeliveryWorker)) return;
		const order = worker.order;
		if (!order) return;
		if (order.amount == 0) return;
		if (order.assignedBuildings) {
			order.assignedBuildings = order.assignedBuildings.filter(x => x != worker.homeBuilding);
		}
		this.clearWorkerOrder(worker, order);
		this.scheduleOrder(order);
	}

	createStorageMap(buildings: Building[], neededResources: string[]): Map<string, Storage[]> {
		let map = new Map<string, Storage[]>();
		for (let resource of neededResources) {
			map.set(resource, []);
		}
		for (let building of buildings) {
			if (!(building instanceof Storage)) continue;
			this.updateStorageMap(neededResources, building, map);
		}
		return map;
	}

	updateStorageMap(resources: string[], storage: Storage, map: Map<string, Storage[]>) {
		for (let resource of resources) {
			if (storage.getResourceAmount(resource) > 0) {
				map.get(resource)!.push(storage);
			}
		}
	}

	tick(deltaTime: number, buildings: Building[], map: MapLayer) {
		this.timeSinceLastScheduling += deltaTime;
		if(this.timeSinceLastScheduling < this.schedulingFrequencyInSeconds) return;
		this.timeSinceLastScheduling = 0;

		if (this.toSchedule.length == 0) return;
		this.logger.debug("Calculate orders");
		let neededResources = this.toSchedule.filter((r) => r.to).map((r) => r.resource);
		const storages = this.createStorageMap(buildings, neededResources);
		let allStorages = [];
		for (let building of buildings) {
			if (!(building instanceof Storage)) continue;
			allStorages.push(building);
		}
		let newToSchedule: DeliveryOrder[] = [];

		for (let order of this.toSchedule) {
			this.logger.debug(`Scheduling order: ${order.resource} (${order.amount})`);
			if (order.amount == 0) continue;
			let candidates = order.to ? storages.get(order.resource) : allStorages;
			if (!candidates) continue;
			const newOrder = this.finalizeSchedulingOrder(order, candidates, map);
			if (newOrder) newToSchedule.push(newOrder);
		}
		this.toSchedule = newToSchedule;
	}

	finalizeSchedulingOrder(order: DeliveryOrder, candidates: Storage[], map: MapLayer): DeliveryOrder | undefined {
		this.logger.debug(`Potential storages: ${candidates?.length}`);
		let toDeliver = order.notScheduled ?? order.amount;
		for (let storage of candidates) {
			this.logger.debug(`Left to deliver ${toDeliver}`);
			if (toDeliver <= 0) break;
			toDeliver -= storage.registerOrder(order, map); 
		}
		if (toDeliver > 0) {
			order.notScheduled = toDeliver;
			return order;
		}
		return undefined;
	}

	onMinuteEnd(buildings: Building[]) {
		for (let building of buildings) {
			this.checkRecipes(building);
			this.checkShopOrders(building);
		}
	}

	checkRecipes(building: Building) {
		if (!building.recipes) return;
		for (let recipe of building.recipes) {
			this.prepareOutOrders(building, recipe);
			this.prepareInOrders(building, recipe);
		}
	}
	
	checkRequirements(building: Building) {
		if (!building.constructionManager) return;
		for (let resource in building.constructionManager.needs) {
			const amount = building.constructionManager.needs[resource];
			this.prepareConstructionOrders(building, resource, amount);
		}
	}

	checkShopOrders(building: Building) {
		if (!building.shop) return;
		for (let resource of building.shopNeeds) {
			this.prepareShopOrders(building, resource);
		}
	}

	prepareInOrders(building: Building, recipe: Recipe) {
		for (let ingredient of recipe.ingredients) {
			const amount = building.getResourceAmount(ingredient.resource);
			this.logger.debug(`Checking in order: ${ingredient.resource} (${amount})`);
			if (amount < 2*ingredient.amount) this.prepareOrder(building, ingredient.resource, building.capacity - amount, "to");
		}
	}

	prepareOutOrders(building: Building, recipe: Recipe) {
		const amount = building.getResourceAmount(recipe.output.resource);
		const output = recipe.output.resource;
		this.logger.debug(`Checking out order: ${output} (${amount})`);
		if (amount >= building.capacity) this.prepareOrder(building, output, amount, "from");
	}

	prepareShopOrders(building: Building, resource: string) {
		const amount = building.getResourceAmount(resource);
		this.logger.debug(`Checking shop order: ${resource} (${amount})`);
		if (amount < 10) {
			this.prepareOrder(building, resource, building.capacity - amount, "to");
		}
	}

	prepareConstructionOrders(building: Building, resource: string, amount: number) {
		this.logger.debug(`Checking construction order: ${resource} (${amount})`);
		this.prepareOrder(building, resource, amount, "to");
	}

	prepareOrder(building: Building, resource: string, amount: number, type: "to" | "from") {
		if (this.nondeliverable.has(resource)) return;
		const orders = this.getOrdersForBuilding(building);
		let order = orders.get(resource);
		if (order && order.amount > 0) return; 
		order = this.resetOrder(order, amount, resource);
		if (type == "from") order.from = building;
		else if (type == "to") order.to = building;
		this.logger.debug("Preparing order");
		this.scheduleOrder(order);
		orders.set(resource, order);
	}

	resetOrder(order: DeliveryOrder | undefined, amount: number, resource: string): DeliveryOrder {
		if (!order) return {resource: resource, amount: amount}
		order.amount = amount;
		order.notScheduled = undefined;
		order.assignedBuildings = [];
		return order;
	}
}
