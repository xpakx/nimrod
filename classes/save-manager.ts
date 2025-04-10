import { BattleActor, HeroType } from "./battle/actor.js";
import { House } from "./building/house.js";
import { View } from "./game-state.js";
import { Game } from "./game.js";
import { getLogger, Logger } from "./logger.js";
import { MapLayer, Position, Size } from "./map-layer.js";

export class SaveManager {
	logger: Logger = getLogger("SaveManager");

	// TODO: save game.state, pedestrians, battle…
	saveState(game: Game, key: string) {
		const data: SaveData = {
			version: 2,
			map: this.serializeMapWithState(game.map),
			state: {
				view: game.state.view,
				money: game.state.money,
			}
		}
		localStorage.setItem(key, JSON.stringify(data));
	}

	// TODO: load game.state, pedestrians, battle…
	loadState(game: Game, key: string): boolean {
		const savedMapJson = localStorage.getItem(key);
		if (savedMapJson) {
			const savedMap = JSON.parse(savedMapJson);

			//version 0
			if (!("version" in savedMap)) {
				this.applyMap(game, savedMap, true);
				return true; 
			}

			const map = savedMap as SaveData;

			if (map.version == 1) {
				this.applyMap(game, map.map, true);
				return true;
			}

			if (map.version == 2) {
				this.applyMap(game, map.map, true);
				game.state.view = map.state.view;
				game.state.money = map.state.money;
				return true;
			}

			//wrong version
			return false;
		}
		return false;
	}

	saveMapToStorage(map: MapLayer, key: string) {
		const mapData = this.serializeMap(map);
		localStorage.setItem(key, JSON.stringify(mapData));
	}

	loadMapFromStorage(game: Game, key: string, updateDistances: boolean = false): boolean {
		const savedMapJson = localStorage.getItem(key);
		if (savedMapJson) {
			const savedMap = JSON.parse(savedMapJson);
			this.applyMap(game, savedMap, updateDistances);
			return true;
		}
		return false;
	}

	loadMapFromUrl(game: Game, filename: string, updateDistances: boolean = false) {
		fetch(`maps/${filename}`)
		.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error while loading a map! status: ${response.status}`);
			}
			return response.json();
		})
		.then((data: MapData) => this.applyMap(game, data, updateDistances))
		.catch(error => {
			this.logger.error(error);
			throw new Error(`Error loading the JSON file: ${error}`);
		});
	}

	serializeMap(map: MapLayer): MapData {
		const roads: RoadData[] = [];
		const buildings: BuildingData[] = [];
		const terrain: TerrainData[] = [];

		for (let x = 0; x < map.roads.length; x++) {
			for (let y = 0; y < map.roads[0].length; y++) {
				if (map.roads[x][y]) {
					roads.push({ y: x, x: y }); // TODO: fix indexing for roads
				}
			}
		}

		for (const building of map.buildings) {
			buildings.push({
				x: building.position.x,
				y: building.position.y,
				type: building.name,
			});
		}

		for (let x = 0; x < map.map.length; x++) {
			for (let y = 0; y < map.map[0].length; y++) {
				if (map.costs[x][y] != 1 || map.map[x][y] != map.defaultColor) {
					terrain.push({
						x,
						y,
						cost: map.costs[x][y],
						color: map.map[x][y],
					});
				}
			}
		}

		return {
			size: { width: map.map.length, height: map.map[0].length },
			roads,
			buildings,
			terrain,
			actors: [],
		};
	}



	applyMap(game: Game, data: MapData, updateDistances: boolean = false) {
		this.logger.debug("Applying map", data);
		game.map.resetMap(data.size);
		game.state.orders.updateDimensions(data.size);

		for (let pos of data.roads) {
			game.map.putRoad({x: pos.x, y: pos.y}, game.sprites.getRoad(), true);
		}

		for (let building of data.buildings) {
			game.map.putBuilding({x: building.x, y: building.y}, game.sprites.buildings[building.type]);
			game.state.orders.onBuildingCreation(game.map.getBuilding({x: building.x, y: building.y}));
		}

		for (let terrain of data.terrain) {
			if (terrain.cost) {
				game.map.costs[terrain.x][terrain.y] = terrain.cost;
			}
			if (terrain.color) {
				game.map.map[terrain.x][terrain.y] = terrain.color;
			}
		}

		game.state.pedestrians = [];
		if (updateDistances) game.map.floydWarshall();
		for (let building of game.map.buildings) {
			if (building instanceof House) {
				game.state.population += building.population;
				game.state.maxPopulation += building.maxPopulation;
			}
		}
	}


	isPlacedActor(obj: UnplacedActorData): obj is ActorData {
		return 'x' in obj && 'y' in obj;
	}


	applyBattle(game: Game, data: BattleMapData) {
		if (!game.state.currentBattle) {
			return;
		}
		game.state.currentBattle.enemies  = [];
		game.state.currentBattle.heroes  = [];

		if (data.actors) {
			for (let actor of data.actors) {
				const sprite = game.sprites.actors[actor.image];
				let [x, y] = [0, 0];
				let toPlace = false;
				if (this.isPlacedActor(actor)) {
					[x, y] = [actor.x, actor.y];
					toPlace = true;
				} 
				let pedestrian = new BattleActor(sprite, {x: x, y: y}); 
				if (actor.enemy === false || actor.enemy === undefined) {
					pedestrian.enemy = false;
				} else {
					pedestrian.enemy = true;
				}
				pedestrian.name = actor.name;
				pedestrian.movement = actor.movement;
				pedestrian.hp = actor.hp;
				if (actor.type) {
					pedestrian.type = actor.type;
				}
				if(pedestrian.enemy) {
					game.state.pedestrians.push(pedestrian);
					game.state.currentBattle.enemies.push(pedestrian);
				} else {
					game.state.currentBattle.heroes.push(pedestrian);
					if (toPlace) {
						pedestrian.placed = true;
						game.state.pedestrians.push(pedestrian);
					}
				}

			}
		}

		game.state.currentBattle.playerSpawns = [];
		if (data.spawns) {
			game.state.currentBattle.playerSpawns = data.spawns;
		}
	}

	serializeMapWithState(map: MapLayer): MapDataWithState {
		const roads: RoadData[] = [];
		const buildings: BuildingDataWithState[] = [];
		const terrain: TerrainData[] = [];

		for (let x = 0; x < map.roads.length; x++) {
			for (let y = 0; y < map.roads[0].length; y++) {
				if (map.roads[x][y]) {
					roads.push({ y: x, x: y }); // TODO: fix indexing for roads
				}
			}
		}

		for (const building of map.buildings) {
			let buildingData: BuildingDataWithState = {
				x: building.position.x,
				y: building.position.y,
				type: building.name,
				accepted: building.accepted,
				health: building.health,
				readyToSpawn: building.readyToSpawn,
				workers: building.workers,
				maxWorkers: building.maxWorkers,
				constructed: building.constructed,
				storage: building.storage,
			} ;
			if (building instanceof House) {
				buildingData.houseData = {
					qualities: building.qualities,
					population: building.population,
					maxPopulation: building.maxPopulation,
					employed: building.employed,
				};
			}
		
			buildings.push(buildingData);
		}

		for (let x = 0; x < map.map.length; x++) {
			for (let y = 0; y < map.map[0].length; y++) {
				if (map.costs[x][y] != 1 || map.map[x][y] != map.defaultColor) {
					terrain.push({
						x,
						y,
						cost: map.costs[x][y],
						color: map.map[x][y],
					});
				}
			}
		}

		return {
			size: { width: map.map.length, height: map.map[0].length },
			roads,
			buildings,
			terrain,
			actors: [],
		};
	}
}


export interface SaveData {
	version: number;
	map: MapDataWithState;
	state: StateData;
}

export interface StateData {
	view: View;
	money: number;
}

export type MapData = CityMapData | BattleMapData;

export interface CityMapData {
	size: Size;
	roads: RoadData[];
	buildings: BuildingData[];
	terrain: TerrainData[];
	actors: ActorData[];
}

export interface BattleMapData {
	size: Size;
	roads: RoadData[];
	buildings: BuildingData[];
	terrain: TerrainData[];
	actors: (ActorData | UnplacedActorData)[];
	spawns: Position[] | undefined;
}

interface RoadData {
	x: number;
	y: number;
}

interface BuildingData {
	x: number;
	y: number;
	type: string;
}

interface TerrainData {
	x: number;
	y: number;
	color?: string;
	cost?: number;
}

interface ActorData extends UnplacedActorData {
	x: number;
	y: number;
}


interface UnplacedActorData {
	enemy?: boolean;
	name: string;
	movement: number;
	type?: HeroType;
	hp: number;
	image: string;
}




export interface MapDataWithState {
	size: Size;
	roads: RoadData[];
	buildings: BuildingDataWithState[];
	terrain: TerrainData[];
	actors: ActorData[];
}

interface BuildingDataWithState {
	x: number;
	y: number;
	accepted: boolean;
	type: string;
	health: number;
	readyToSpawn: boolean;
	workers: number;
	maxWorkers: number;
	constructed: boolean;
	storage: { [key: string]: number };
	houseData?: HouseData;
}

interface HouseData {
	qualities: { [key: string]: number };
	population: number;
	employed: number;
	maxPopulation: number;
}
