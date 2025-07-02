import { House } from "./house.js";
import { Storage } from "./storage.js";
import { Building, BuildingPrototype } from "./buildings.js";
import { Position } from "../map-layer.js";
import { HeroLibrary } from "../battle/hero-library.js";

// TODO
export function createBuilding(position: Position, prototype: BuildingPrototype, accepted: boolean, heroes: HeroLibrary): Building {
	if (prototype.houseOptions !== undefined) {
		const house = new House(prototype, position, accepted);
		if (prototype.heroOptions) {
			console.log(prototype.heroOptions);
			if (typeof prototype.heroOptions == "string") {
				const hero = heroes.getHero(prototype.heroOptions);
				if (hero) house.addHero(hero);
			} else {
				const hero = heroes.createHero(prototype.heroOptions);
				house.addHero(hero);
			}
		}
		return house;
	}
	if (prototype.storageOptions !== undefined) {
		return new Storage(prototype, position, accepted);
	}
	return new Building(prototype, position, accepted);
}


