import { Actor } from "../actor.js";
import { Building, BuildingPrototype, BuildingWorker, HouseOptions } from "./buildings.js";
import { GameState } from "../game-state.js";
import { getLogger, Logger } from "../logger.js";
import { MapLayer, Position } from "../map-layer.js";

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
					this.accepts.add(need.resource);
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

	settle(num: number): boolean {
		const freeSpaces = this.maxPopulation - this.population;
		if (freeSpaces < num) {
			return false;
		}
		this.logger.debug(`${num} new settlers  in home`);
		this.population += num;
		return true;
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

export class Migrant extends Actor {
	name: String = "migrant";
	logger: Logger = getLogger("Migrant");
	path?: Position[]
	targetHome?: House;
	settled: boolean = false;

	canMove(_map: MapLayer): boolean {
	    return true;
	}

	setHome(home: House, path: Position[]) {
		this.targetHome = home;
		this.path = path;
		this.path.reverse();
		this.path.pop();
		this.goal = this.path.pop();
		this.direction.x = this.goal!.x - this.positionSquare.x;
		this.direction.y = this.goal!.y - this.positionSquare.y; 
		this.logger.debug("Ultimate goal:", this.path[0]);
	}

	moving: boolean = false;

	tick(deltaTime: number, map: MapLayer, _randMap: number[]): boolean {
		return this.move(deltaTime, map);
	}

	nextGoal(): boolean {
		this.goal = this.path?.pop();
		this.logger.debug("new goal", this.goal);
		if (!this.goal) {
			this.logger.debug("Reached position", this.position);
			return false;
		}
		this.direction.x = this.goal.x - this.positionSquare.x;
		this.direction.y = this.goal.y - this.positionSquare.y;
		return true;
	}

	move(deltaTime: number, map: MapLayer): boolean {
		if(!this.goal) {
			this.dead = true;
			return false;
		}
		if (this.reachedGoal()) {
			const foundGoal = this.nextGoal();
			if (!foundGoal) {
				this.settled = this.targetHome!.settle(1);
				this.dead = true;
				return false;
			}
		}
		if (map.isObstacle(this.goal)) {
			if (!this.targetHome) {
				this.dead = true;
				return false;
			}
			const path = map.shortestMigrantPath(this.positionSquare, this.targetHome);

			if (path.length == 1) {
				this.settled = this.targetHome!.settle(1);
				this.dead = true;
				return false;
			}
			if (path.length > 0) {
				this.logger.debug("New path:", path);
				this.setHome(this.targetHome, path);
			}
		}

		let newX = this.direction.x*deltaTime;
		let newY = this.direction.y*deltaTime;

		// speed adjustment for diagonal movement
		if (newX != 0 && newY != 0) {
			const diagonalFactor = Math.sqrt(2);
			newX /= diagonalFactor;
			newY /= diagonalFactor;
		}

		// TODO: this sometimes fails on diagonal movement
		this.updatePosition(newX, newY);

		if (this.positionSquare.x + this.positionSquare.y != this.diagonal) {
			this.diagonal = this.positionSquare.x + this.positionSquare.y;
			return true;
		}
		return false;
	}
}
