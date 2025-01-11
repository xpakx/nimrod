import { House } from "./building/house.js";
import { Building, BuildingPrototype } from "./buildings.js";
import { Position } from "./map-layer.js";

// TODO
export function createBuilding(position: Position, prototype: BuildingPrototype, accepted: boolean): Building {
	if (prototype.houseOptions !== undefined) {
		return new House(prototype, position, accepted);
	}
	return new Building(prototype, position, accepted);
}


