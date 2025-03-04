import { ActorSprite } from "./actor.js";
import { BuildingInterface, BuildingPrototype, BuildingSprite, HouseOptions, Recipe, StorageOptions, TilingSprite, WorkerOptions } from "./buildings.js";
import { getLogger, Logger } from "./logger.js";
import { Size } from "./map-layer.js";

export interface BuildingConfig {
	sprite: string;
	size: number;
	name: string;
	visibleName: string;
	interface?: string | BuildingInterface;
	cost: number;
	workerOptions?: WorkerConfig;
	houseOptions?: HouseOptions;
	storageOptions?: StorageOptions;
	productionOptions?: Recipe[];
}

export interface WorkerConfig {
	sprite: string;
	repairing?: boolean;
	resource?: string;
	inventory?: number;
	workerStartTime?: number;
}

export class SpriteLibrary {
	buildings: {[key: string]: BuildingPrototype} = {};
	avatars: {[key: string]: HTMLImageElement} = {};
	icons: {[key: string]: HTMLImageElement} = {};
	actors: {[key: string]: ActorSprite} = {};
	road?: TilingSprite;
	arrow?: TilingSprite;
	buildingInterfaces: { [key: string]: new () => BuildingInterface } = {};
	logger: Logger = getLogger("SpriteLibrary");

	registerBuildingInterface<T extends BuildingInterface>(interfaceClass: new () => T): void {
		const key = interfaceClass.name;
		if (this.buildingInterfaces[key]) {
			this.logger.warn(`Interface with key "${key}" is already registered.`);
			return;
		}
		this.buildingInterfaces[key] = interfaceClass;
	}

	async prepareBuildingSprites(config: string | BuildingConfig[], tileSize: Size): Promise<boolean> {
		if (typeof(config) === "string") {
			config = await loadBuildings(config);
		}
		for (let buildingConfig of config) {
			const sprite = new BuildingSprite(
				await loadImage(`./img/${buildingConfig.sprite}.svg`),
				buildingConfig.size,
				tileSize
			);
			let interf: BuildingInterface;
			if (buildingConfig.interface) {
				if (typeof(buildingConfig.interface) === "string") {
					if (buildingConfig.interface in this.buildingInterfaces) {
						interf = new this.buildingInterfaces[buildingConfig.interface]();
					} else {
						this.logger.warn(`Interface "${buildingConfig.interface}" not registered.`);
						interf = new BuildingInterface();
					}
				} else {
					interf = buildingConfig.interface;
				}
			} else {
				interf = new BuildingInterface();
			}
			
			const building: BuildingPrototype = {
				sprite: sprite,
				interface: interf,
				name: buildingConfig.name,
				visibleName: buildingConfig.visibleName,
				cost: buildingConfig.cost,
				houseOptions: buildingConfig.houseOptions,
				storageOptions: buildingConfig.storageOptions,
				productionOptions: buildingConfig.productionOptions,
			}
			if (buildingConfig.workerOptions) {
				const workerOptions: WorkerOptions = {
					sprite: this.actors[buildingConfig.workerOptions.sprite],
					repairing: buildingConfig.workerOptions.repairing,
					resource: buildingConfig.workerOptions.resource,
					inventory: buildingConfig.workerOptions.inventory,
					workerStartTime: buildingConfig.workerOptions.workerStartTime,
				};
				building.workerOptions = workerOptions;

			}

			this.buildings[buildingConfig.name] = building;
		}
		return true;
	}

	async prepareAvatars(): Promise<boolean> {
		this.avatars['ratman'] = await loadImage("./img/portraits/ratman.svg");
		return true;
	}

	async prepareIcons(): Promise<boolean> {
		this.icons['coins'] = await loadImage("./img/coins.svg");
		this.icons['population'] = await loadImage("./img/people.svg");
		this.icons['road'] = await loadImage("./img/road-button.svg");
		this.icons['delete'] = await loadImage("./img/delete-button.svg");
		this.icons['world'] = await loadImage("./img/world.svg");
		this.icons['city'] = await loadImage("./img/city.svg");
		this.icons['kingdom'] = await loadImage("./img/kingdom.svg");
		return true;
	}

	async prepareActorSprites(tileSize: Size): Promise<boolean> {
		this.actors['test'] = new ActorSprite(await loadImage("./img/house.svg"), 2, tileSize);
		this.actors['delivery'] = new ActorSprite(await loadImage("./img/house.svg"), 2, tileSize);
		this.actors['delivery'].fillStyle = "blue";
		this.actors['delivery'].refreshSize(tileSize);
		return true;
	}

	getRoad(): TilingSprite {
		return this.road!;
	}

	getArrow(): TilingSprite {
		return this.arrow!;
	}

	async prepareRoadSprites(tileSize: Size): Promise<boolean> {
		const roads = [
			await loadImage("./img/road0000.svg"), 
			await loadImage("./img/road0001.svg"), 
			await loadImage("./img/road0010.svg"), 
			await loadImage("./img/road0011.svg"), 
			await loadImage("./img/road0100.svg"), 
			await loadImage("./img/road0101.svg"), 
			await loadImage("./img/road0110.svg"), 
			await loadImage("./img/road0111.svg"), 
			await loadImage("./img/road1000.svg"), 
			await loadImage("./img/road1001.svg"), 
			await loadImage("./img/road1010.svg"), 
			await loadImage("./img/road1011.svg"), 
			await loadImage("./img/road1100.svg"), 
			await loadImage("./img/road1101.svg"), 
			await loadImage("./img/road1110.svg"), 
			await loadImage("./img/road1111.svg"), 
		];
		this.road = new TilingSprite(roads, tileSize);
		return true;
	}

	async prepareArrowSprites(tileSize: Size): Promise<boolean> {
		const arrows = [
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow0101.svg"), 
			await loadImage("./img/arrow0110.svg"), 
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow1001.svg"), 
			await loadImage("./img/arrow1010.svg"), 
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow1100.svg"), 
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow0011.svg"), 
		];

		this.arrow = new TilingSprite(arrows, tileSize);
		return true;
	}

	rescaleSprites(tileSize: Size) {
		for (const key in this.buildings) {
			this.buildings[key].sprite.refreshSize(tileSize);
		}
		this.getRoad().refreshSize(tileSize);
		this.getArrow().refreshSize(tileSize);
	}
}

async function loadImage(url: string): Promise<any> {
    const image = new Image();
    image.src = url;
    return new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = reject;
    });
}

async function loadBuildings(filename: string): Promise<BuildingConfig[]> {
	try {
		const response = await fetch(`config/${filename}`);
		if (!response.ok) {
			throw new Error(`Cannot load config for buldings: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		throw error;
	}
}
