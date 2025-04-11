import { House, Migrant } from "../building/house.js";
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

	timeSinceLastHeroCheck: number = 0;
	heroSpawnFrequencyInSeconds: number = 5;

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
			if (building.workforce != "warrior") {
				state.maxPopulation -=  building.maxPopulation;
				state.population -=  building.population;
			}

			if (building.workforce == "warrior" && building.hero) {
				const indexAll = state.allHeroes.indexOf(building.hero);
				if (indexAll !== -1) state.allHeroes.splice(indexAll, 1);

				const indexTeam = state.team.indexOf(building.hero);
				if (indexTeam !== -1) state.team.splice(indexTeam, 1);
			}
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

	spawnMigrants(game: Game) {
		if (game.state.view != "City") return;
		this.logger.debug("Spawning migrants");

		const happiness = game.getNormalWorkforce().reduce((sum, b) => sum + b.getHappiness(), 0);
		this.logger.debug(`Current happines: ${happiness}`);

		// TODO: vary spawned migrants based on happiness
		// TODO: spawn migrants for elite houses
		if (happiness < 0) {
			return;
		}
		const freePlaces = game.state.maxPopulation - game.state.population;
		const newMigrants = Math.min(20, freePlaces);
		const emptyHouses = game.map.getEmptyHouses();
		if (emptyHouses.length == 0) return;
		for (let i=0; i<newMigrants; i++) {
			const migrant = new Migrant(game.sprites.actors["test"], {x: 0, y: 0});
			const randomIndex = Math.floor(Math.random() * emptyHouses.length);
			const emptyHouse = emptyHouses[randomIndex];
			const path = game.map.shortestMigrantPath(migrant.positionSquare, emptyHouse);
			if (path.length > 0) {
				this.logger.debug("Path for migrant:", path);
				migrant.setHome(emptyHouse, path);
				game.state.insertPedestrian(migrant);
			}
		}
	}

	spawnHeroes(game: Game, deltaTime: number) {
		if (game.state.view != "City") return;
		this.timeSinceLastHeroCheck += deltaTime;
		if(this.timeSinceLastHeroCheck < this.heroSpawnFrequencyInSeconds) return;
		this.timeSinceLastHeroCheck = 0;
		this.logger.debug("Spawning heroes");

		const houses = game.map.getEmptyHeroHouses();
		for (let house of houses) {
			this.logger.debug(`Spawning ${house.hero!.name}`);
			const migrant = new Migrant(house.hero!.sprite, {x: 0, y: 0});
			const index = game.state.spawnedHeroes.indexOf(house.hero!);
			if (index != -1) continue;
			const path = game.map.shortestMigrantPath(migrant.positionSquare, house);
			if (path.length > 0) {
				migrant.setHome(house, path);
				game.state.insertPedestrian(migrant);
				game.state.spawnedHeroes.push(house.hero!);
			}
		}
	}
}
