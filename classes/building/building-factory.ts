import { House } from "./house.js";
import { Storage } from "./storage.js";
import { Building, BuildingPrototype } from "./buildings.js";
import { Position } from "../map-layer.js";

// TODO
export function createBuilding(position: Position, prototype: BuildingPrototype, accepted: boolean): Building {
	if (prototype.houseOptions !== undefined) {
		return new House(prototype, position, accepted);
	}
	if (prototype.storageOptions !== undefined) {
		return new Storage(prototype, position, accepted);
	}
	return new Building(prototype, position, accepted);
}


