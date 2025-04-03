import { House } from "../building/house.js";
import { Game } from "../game.js";
import { GameState } from "../game-state.js";
import { getLogger, Logger } from "../logger.js";
import { MapLayer } from "../map-layer.js";
import { SpriteLibrary } from "../sprite-library.js";
import { BuildingPrototype } from "../building/buildings.js";
import { InterfaceLayer } from "../interface/interface.js";

export class CityLogicLayer {
	static roadCost: number = 2;
	logger: Logger = getLogger("CityLogicLayer");

	onMouseLeftClick(game: Game) {
		if(game.map.mode.action == "build") {
			this.putBuilding(game.map, game.state, game.map.mode.prototype, game);
		} else if(game.map.mode.action == "delete") {
			this.deleteBuilding(game.map, game.state, game);
			this.deleteRoad(game.map);
		} else if(game.map.mode.action == "buildRoad") {
			this.putRoad(game.map, game.state, game.sprites);
		} else {
			this.openBuildingInterface(game.map, game.state, game.interf);
		}
	}

	putRoad(map: MapLayer, state: GameState, sprites: SpriteLibrary) {
		const roadCost = CityLogicLayer.roadCost;
		if (state.money < roadCost) return;
		state.money -= roadCost;
		map.putRoad(map.isoPlayerMouse, sprites.getRoad());
		this.updateCost(map, state);
		map.updateAfterAddition(map.isoPlayerMouse); // TODO: optimize
	}

	putBuilding(map: MapLayer, state: GameState, building: BuildingPrototype, game: Game) {
		if (state.money < building.cost) return;
		state.money -= building.cost;
		map.putBuilding(map.isoPlayerMouse, building, false);
		this.updateCost(map, state);
		map.finalizeBuildingPlacement(map.isoPlayerMouse);
		if (building.houseOptions) {
			const house = map.getBuilding(map.isoPlayerMouse) as House;
			state.maxPopulation += house.maxPopulation;
		}
		state.orders.onBuildingCreation(map.getBuilding(map.isoPlayerMouse));
		game.assignWorkers();
	}

	deleteBuilding(map: MapLayer, state: GameState, game: Game) {
		const building = map.getBuilding(map.isoPlayerMouse);
		if (!building) return;

		map.deleteBuilding(map.isoPlayerMouse);
		if (building instanceof House) {
			state.maxPopulation -=  building.maxPopulation;
			state.population -=  building.population;
		}

		state.orders.onBuildingDeletion(building);
		building.onDeletion();
		game.assignWorkers();
	}

	deleteRoad(map: MapLayer) {
		if (!map.isRoad(map.isoPlayerMouse)) return;
		map.deleteRoad(map.isoPlayerMouse);
		map.updateAfterDeletion(map.isoPlayerMouse); // TODO: optimize
	}

	openBuildingInterface(map: MapLayer, state: GameState, interf: InterfaceLayer) {
		const building = map.getCurrentBuilding();
		if (building) {
			interf.buildingInterface = building.interface;
			building.interface.open(state, building);
		}
	}

	updateCost(map: MapLayer, state: GameState) {
		if(map.mode.action == "build") {
			map.tooCostly = state.money < map.mode.prototype.cost;
		} else if (map.mode.action == "buildRoad") {
			map.tooCostly = state.money < 2;
		}
	}
}
