import { getLogger, Logger } from "../logger.js";
import { Building, BuildingWorker, ConstructionOptions } from "./buildings.js";

export class ConstructionManager {
	accepts: Set<string>;
	logger: Logger = getLogger("ConstructionManager");
	needs: { [key: string]: number } = {};
	capacity: number = 0;

	constructor(options: ConstructionOptions) {
		this.accepts = new Set<string>();
		for (let requirement of options.requirements) {
			this.needs[requirement.resource] = requirement.amount;
			this.accepts.add(requirement.resource);
		}
	}

	supply(building: Building, worker: BuildingWorker, resource: string, inventory: number): number {
		if (!this.accepts.has(resource)) return 0;
		const inStock = this.getResourceAmount(resource);

		if (resource in this.needs && inventory > 0 && inStock > 0) {
			const amount = Math.min(inventory, inStock);
			this.needs[resource] -= amount;
			this.logger.debug(`${worker.name} supplied ${amount} ${resource} to ${building.name} at (${building.position.x}, ${building.position.y})`);

			if (this.checkConstruction()) {
				this.logger.debug(`${building.name} at (${building.position.x}, ${building.position.y}) is constructed`);
				building.finishConstruction();
			}

			return amount;
		}
		this.logger.debug(`${worker.name} visited ${building.name} at (${building.position.x}, ${building.position.y})`);
		return 0;
	}

	getResourceAmount(resource: string) {
		if (!(resource in this.needs)) return 0;
		return this.needs[resource];
	}

	checkConstruction(): boolean {
		for (let resource in this.needs) {
			if (this.needs[resource] > 0) return false;
		}
		return true;
	}
}

