import { Actor } from "./actor.js";
import { BattleActor, HeroType } from "./battle/actor.js";
import { BuildingWorker } from "./building/buildings.js";
import { House, Migrant } from "./building/house.js";
import { GameState, View } from "./game-state.js";
import { Game } from "./game.js";
import { getLogger, Logger } from "./logger.js";
import { MapLayer, Position, Size } from "./map-layer.js";

export class SaveManager {
	logger: Logger = getLogger("SaveManager");

	// TODO: save game.state, pedestrians, battle…
	saveState(game: Game, key: string) {
		const data: SaveData = {
			version: 3,
			map: this.serializeMapWithState(game.map, game.state),
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

			const version = savedMap.version as number;
			this.logger.debug(`Save version: ${version}`);

			if (version == 1) {
				const map = savedMap as OldSaveData;
				this.applyMap(game, map.map, true);
				return true;
			}

			if (version == 2) {
				const map = savedMap as OldSaveData;
				this.applyMap(game, map.map, true);
				game.state.view = map.state.view;
				game.state.money = map.state.money;
				this.applyBuildingData(game, map.map.buildings);
				return true;
			}

			if (version == 3) {
				const map = savedMap as SaveData;
				this.applySave(game, map.map, true);
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
		game.cityLogic.orders.updateDimensions(data.size);

		for (let pos of data.roads) {
			game.map.putRoad({x: pos.x, y: pos.y}, game.sprites.getRoad(), true);
		}

		for (let building of data.buildings) {
			game.map.putBuilding({x: building.x, y: building.y}, game.sprites.buildings[building.type]);
			game.cityLogic.orders.onBuildingCreation(game.map.getBuilding({x: building.x, y: building.y}));
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

	serializeMapWithState(map: MapLayer, state: GameState): MapDataWithState {
		const roads: RoadData[] = [];
		const buildings: BuildingDataWithState[] = [];
		const pedestrians: PedestrianDataWithState[] = [];
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

		for (const pedestrian of state.pedestrians) {
			let pedestrianData: PedestrianDataWithState = {
				x: pedestrian.position.x,
				y: pedestrian.position.y,
				dead: pedestrian.dead,
				name: pedestrian.name.toString(),
				sprite: pedestrian.sprite.key,
				directionMask: pedestrian.directionMask,
				direction: pedestrian.direction,
				traveledSquares: pedestrian.traveledSquares,
				maxTravel: pedestrian.maxTravel,
				travelFinished: pedestrian.travelFinished,
				home: {x: pedestrian.home.x, y: pedestrian.home.y}, 
				goal: pedestrian.goal,
			};

			if (pedestrian instanceof Migrant) {
				pedestrianData.migrant = {
					path: pedestrian.path,
					targetHome: pedestrian.targetHome?.position,
					settled: pedestrian.settled,
				};
			}

			if (pedestrian instanceof BuildingWorker) {
				pedestrianData.worker = {
					isAwayFromHome: pedestrian.isAwayFromHome,
					timeSinceLastReturn: pedestrian.timeSinceLastReturn,
					workStartTime: pedestrian.workStartTime,
					resource: pedestrian.resource,
					inventory: pedestrian.inventory,
					storage: pedestrian.storage,
					repairing: pedestrian.repairing,
					resourceQuality: pedestrian.resourceQuality,
				};
			}

			pedestrians.push(pedestrianData);
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
			actors: pedestrians,
		};
	}

	applyBuildingData(game: Game, data: BuildingDataWithState[]) {
		for (let buildingData of data) {
			const pos: Position = { x: buildingData.x, y: buildingData.y };
			const building = game.map.getBuilding(pos);
			if (!building) continue;
			building.accepted = buildingData.accepted;
			building.health = buildingData.health;
			building.readyToSpawn = buildingData.readyToSpawn;
			building.workers = buildingData.workers;
			building.maxWorkers = buildingData.maxWorkers;
			building.constructed = buildingData.constructed;
			if (buildingData.constructed) building.constructionManager = undefined;
			building.storage = buildingData.storage;

			if (building instanceof House && buildingData.houseData) {
				building.qualities = buildingData.houseData.qualities;
				building.population = buildingData.houseData.population;
				building.maxPopulation = buildingData.houseData.maxPopulation;
				building.employed = buildingData.houseData.employed;
				game.state.population += building.population;
			}
		}
	}

	applySave(game: Game, data: MapDataWithState, updateDistances: boolean = false) {
		this.logger.debug("Applying save", data);
		game.map.resetMap(data.size);
		game.cityLogic.orders.updateDimensions(data.size);

		for (let pos of data.roads) {
			game.map.putRoad({x: pos.x, y: pos.y}, game.sprites.getRoad(), true);
		}

		for (let building of data.buildings) {
			game.map.putBuilding({x: building.x, y: building.y}, game.sprites.buildings[building.type]);
			game.cityLogic.orders.onBuildingCreation(game.map.getBuilding({x: building.x, y: building.y}));
		}
		this.applyBuildingData(game, data.buildings);


		for (let terrain of data.terrain) {
			if (terrain.cost) {
				game.map.costs[terrain.x][terrain.y] = terrain.cost;
			}
			if (terrain.color) {
				game.map.map[terrain.x][terrain.y] = terrain.color;
			}
		}

		game.state.pedestrians = [];

		for (let pedestrianData of data.actors) {
			let pedestrian;
			const sprite = game.sprites.actors[pedestrianData.sprite];
			const position = {x: pedestrianData.x, y: pedestrianData.y};
			if (pedestrianData.migrant) {
				pedestrian = new Migrant(sprite, position);
				pedestrian.path = pedestrianData.migrant.path;
				pedestrian.settled = pedestrianData.migrant.settled;
				if (pedestrianData.migrant.targetHome) {
					const building = game.map.getBuilding(pedestrianData.migrant.targetHome);
					if (building && building instanceof House) pedestrian.targetHome = building;
					
				}
			} else if (pedestrianData.worker) {
				pedestrian = new BuildingWorker(sprite, position);
				pedestrian.isAwayFromHome = pedestrianData.worker.isAwayFromHome;
				pedestrian.timeSinceLastReturn = pedestrianData.worker.timeSinceLastReturn;
				pedestrian.workStartTime = pedestrianData.worker.workStartTime;
				pedestrian.resource = pedestrianData.worker.resource;
				pedestrian.inventory = pedestrianData.worker.inventory;
				pedestrian.storage = pedestrianData.worker.storage;
				pedestrian.repairing = pedestrianData.worker.repairing;
				pedestrian.resourceQuality = pedestrianData.worker.resourceQuality;
			} else {
				pedestrian = new Actor(sprite, position);
			}

			pedestrian.dead = pedestrianData.dead;
			pedestrian.name = pedestrianData.name;
			pedestrian.directionMask = pedestrianData.directionMask;
			pedestrian.direction = pedestrianData.direction;
			pedestrian.traveledSquares = pedestrianData.traveledSquares;
			pedestrian.maxTravel = pedestrianData.maxTravel;
			pedestrian.travelFinished = pedestrianData.travelFinished;
			pedestrian.home = pedestrianData.home;
			pedestrian.position = {x: pedestrianData.x, y: pedestrianData.y}; 
			pedestrian.goal = pedestrianData.goal;

			pedestrian.positionSquare = {x: Math.floor(pedestrian.position.x), y: Math.floor(pedestrian.position.y)};
			pedestrian.diagonal = pedestrian.positionSquare.x + pedestrian.positionSquare.y;

			game.state.pedestrians.push(pedestrian);
		}
		game.state.sortPedestrians();
		this.logger.debug("Pedestrians", game.state.pedestrians);


		if (updateDistances) game.map.floydWarshall();
		for (let building of game.map.buildings) {
			if (building instanceof House) {
				game.state.population += building.population;
				game.state.maxPopulation += building.maxPopulation;
			}
		}
	}

}

export interface OldSaveData {
	version: number;
	map: OldMapDataWithState;
	state: StateData;
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



export interface OldMapDataWithState {
	size: Size;
	roads: RoadData[];
	buildings: BuildingDataWithState[];
	terrain: TerrainData[];
	actors: ActorData[];
}

export interface MapDataWithState {
	size: Size;
	roads: RoadData[];
	buildings: BuildingDataWithState[];
	terrain: TerrainData[];
	actors: PedestrianDataWithState[];
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

interface PedestrianDataWithState {
	x: number;
	y: number;
	dead: boolean;
	name: string;
	sprite: string;
	directionMask: number;
	direction: Position;
	traveledSquares: number;
	maxTravel: number;
	travelFinished: boolean;
	home: Position;
	goal?: Position;
	migrant?: MigrantData;
	worker?: BuildingWorkerData;
	// TODO: battle?
}

interface MigrantData {
	path?: Position[];
	targetHome?: Position;
	settled: boolean;
}

interface BuildingWorkerData {
	isAwayFromHome: boolean;
	timeSinceLastReturn: number;
	workStartTime: number;
	resource?: string;
	inventory: number;
	storage: number;
	repairing: boolean;
	resourceQuality?: number;
}

