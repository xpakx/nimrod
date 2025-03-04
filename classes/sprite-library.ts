import { ActorSprite } from "./actor.js";
import { BuildingInterface, BuildingPrototype, BuildingSprite, HouseOptions, Recipe, StorageOptions, TilingSprite, WorkerOptions } from "./buildings.js";
import { getLogger, Logger } from "./logger.js";
import { Size } from "./map-layer.js";

/**
 * Represents the configuration for a building.
 * This interface defines the properties required to create and manage a building,
 * including its sprite, size, cost, and optional features like worker options or production capabilities.
 * 
 * @property {string} sprite - The filename of the building's sprite image (without extension).
 * @property {number} size - The size of the building **in tiles**. Represents the building's
 *   footprint on the game grid (e.g., a size of 2 means the building occupies 2x2 tiles).
 * @property {string} name - The unique identifier for the building.
 * @property {string} visibleName - The display name of the building, shown to the player.
 * @property {string | BuildingInterface} [interface] - The interface associated with the building.
 *   This can be either a string (key for a registered interface) or a `BuildingInterface` instance.
 *   If not provided, a default interface will be used.
 * @property {number} cost - The cost to construct the building.
 * @property {WorkerConfig} [workerOptions] - Configuration options for workers associated with the building (optional).
 *   If provided, the building will produce pedestrians (workers) that distribute resources to other buildings (e.g., houses).
 * @property {HouseOptions} [houseOptions] - Configuration options for housing functionality (optional).
 *   If provided, the building will function as a housing building.
 * @property {StorageOptions} [storageOptions] - Configuration options for storage functionality (optional).
 *   If provided, the building will function as a storage facility, allowing resources to be stored and retrieved.
 * @property {Recipe[]} [productionOptions] - Configuration options for production capabilities (optional).
 *   If provided, the building will function as a production facility, converting input resources into output resources. 
 */
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

/**
 * Represents the configuration for a worker associated with a building.
 * This interface defines properties for customizing worker behavior, such as their sprite,
 * repair capabilities, resource distribution, and inventory management.
 * 
 * @property {string} sprite - The filename of the worker's sprite image (without extension).
 * @property {boolean} [repairing] - Whether the worker is capable of repairing buildings (optional).
 *   If `true`, the worker will repair houses and other buildings while walking through the city.
 * @property {string} [resource] - The type of resource the worker is associated with (optional).
 *   If provided, the worker will distribute this resource to buildings (e.g., houses) while walking through the city.
 * @property {number} [inventory] - The worker's inventory capacity (optional).
 *   This determines how much of the resource the worker can carry at a time. If not provided, a default value will be used.
 * * @property {number} [workerStartTime] - The delay (in seconds) between the worker returning to the building
 *   and starting their next walk in the city (optional). 
 *   This controls how long the worker rests before resuming their tasks.
 */
export interface WorkerConfig {
	sprite: string;
	repairing?: boolean;
	resource?: string;
	inventory?: number;
	workerStartTime?: number;
}

/**
 * Represents the configuration for a sprite.
 * This interface defines the properties required to load and manage a sprite,
 * including its name and associated image file.
 * 
 * @property {string} name - The unique identifier for the sprite.
 * @property {string} sprite - The filename of the sprite image (without extension).
 */
export interface SpriteConfig {
    name: string;
    sprite: string;
}

/**
 * A library for managing and loading sprites used in the game.
 * This class handles the loading, scaling, and organization of various types of sprites,
 * including buildings, avatars, icons, actors, roads, and arrows.
 * 
 * @property {Object.<string, BuildingPrototype>} buildings - A map of building prototypes, keyed by building name.
 * @property {Object.<string, HTMLImageElement>} avatars - A map of avatar images, keyed by avatar name.
 * @property {Object.<string, HTMLImageElement>} icons - A map of icon images, keyed by icon name.
 * @property {Object.<string, ActorSprite>} actors - A map of actor sprites, keyed by actor name.
 * @property {TilingSprite | undefined} road - The tiling sprite used for roads.
 * @property {TilingSprite | undefined} arrow - The tiling sprite used for arrows.
 * @property {Object.<string, new () => BuildingInterface>} buildingInterfaces - A map of building interface constructors, keyed by interface name.
 * @property {Logger} logger - The logger instance used for logging messages and errors.
 * 
 * @example
 * // Example usage: Create a SpriteLibrary instance and prepare all sprites
 * const tileSize = {width: 64, height: 32};
 * const spriteLibrary = new SpriteLibrary();
 * await spriteLibrary.prepareActorSprites(tileSize);
 * await spriteLibrary.prepareBuildingSprites('buildings.json', tileSize);
 * await spriteLibrary.prepareAvatars('avatars.json');
 * await spriteLibrary.prepareIcons('icons.json');
 * await spriteLibrary.prepareRoadSprites(tileSize);
 * await spriteLibrary.prepareArrowSprites(tileSize);
 */
export class SpriteLibrary {
	buildings: {[key: string]: BuildingPrototype} = {};
	avatars: {[key: string]: HTMLImageElement} = {};
	icons: {[key: string]: HTMLImageElement} = {};
	actors: {[key: string]: ActorSprite} = {};
	road?: TilingSprite;
	arrow?: TilingSprite;
	buildingInterfaces: { [key: string]: new () => BuildingInterface } = {};
	logger: Logger = getLogger("SpriteLibrary");

	/**
	 * Registers a building interface class in the `buildingInterfaces` map.
	 * This allows the interface to be dynamically instantiated when preparing building sprites.
	 * This method adds the provided class constructor to the `buildingInterfaces` map, 
	 * which is used to dynamically instantiate building interfaces when preparing building sprites.
	 * If an interface with the same key (class name) is already registered, a warning is logged, and the method 
	 * exits without overwriting the existing entry. 
	 * 
	 * @template T - A generic type parameter that extends `BuildingInterface`, representing the specific type of building interface being registered.
	 *
	 * @param {new () => T} interfaceClass - The class constructor for the building interface. This must be a class 
	 *   that implements the `BuildingInterface` type and can be instantiated with no arguments.
	 * 
	 * @example
	 * // Example usage: Registering a custom building interface
	 * class HouseInterface extends BuildingInterface {
	 *   // Custom implementation...
	 * }
	 * spriteLibrary.registerBuildingInterface(HouseInterface);
	 * 
	 * @example
	 * // Example usage: Registering an interface with a warning for duplicates
	 * class FarmInterface extends BuildingInterface {
	 *   // Custom implementation...
	 * }
	 * spriteLibrary.registerBuildingInterface(FarmInterface); // Registers successfully
	 * spriteLibrary.registerBuildingInterface(FarmInterface); // Logs a warning: Interface with key "FarmInterface" is already registered.
	 */
	registerBuildingInterface<T extends BuildingInterface>(interfaceClass: new () => T): void {
		const key = interfaceClass.name;
		if (this.buildingInterfaces[key]) {
			this.logger.warn(`Interface with key "${key}" is already registered.`);
			return;
		}
		this.buildingInterfaces[key] = interfaceClass;
	}

	/**
	* Prepares building sprites based on the provided configuration.
	* This method loads building sprites, initializes their interfaces, and registers them in the `buildings` map.
	* 
	* @param {string | BuildingConfig[]} config - The configuration for buildings. This can be either:
	*   - A string representing the path to a JSON file containing the building configurations.
	*   - An array of `BuildingConfig` objects directly.
	* @param {Size} tileSize - The size of the tiles used in the game. 
	*   This is used to scale the building sprites to match the game's grid system.
	* 
	* @returns {Promise<boolean>} A promise that resolves to `true` if all building sprites were prepared successfully.
	*
	* @example
	* // Example usage with a JSON file path
	* await spriteLibrary.prepareBuildingSprites('buildings.json', { width: 32, height: 32 });
	* 
	* @example
	* // Example usage with an array of BuildingConfig objects
	* const config = [
	*   {
	*     name: 'house',
	*     sprite: 'house_sprite',
	*     size: 2,
	*     interface: 'HouseInterface',
	*     cost: 100,
	*     visibleName: 'House',
	*   },
	* ];
	* await spriteLibrary.prepareBuildingSprites(config, { width: 32, height: 32 });
	*/
	async prepareBuildingSprites(config: string | BuildingConfig[], tileSize: Size): Promise<boolean> {
		if (typeof(config) === "string") {
			config = await loadBuildings(config);
		}
		const promises = config.map(async (buildingConfig) => this.prepareBuilding(buildingConfig, tileSize));
		await Promise.all(promises);
		return true;
	}

	private async prepareBuilding(buildingConfig: BuildingConfig, tileSize: Size): Promise<boolean> {
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
		return true;
	}

	/**
	 * Prepares avatar sprites based on the provided configuration.
	 * This method loads avatar images and stores them in the `avatars` map for later use.
	 * 
	 * @param {string | SpriteConfig[]} config - The configuration for avatars. This can be either:
	 *   - A string representing the path to a JSON file containing the avatar configurations.
	 *   - An array of `SpriteConfig` objects directly.
	 * 
	 * @returns {Promise<boolean>} A promise that resolves to `true` if all avatar sprites were loaded successfully.
	 * 
	 * @example
	 * // Example usage with a JSON file path
	 * await spriteLibrary.prepareAvatars('avatars.json');
	 * 
	 * @example
	 * // Example usage with an array of SpriteConfig objects
	 * const config = [
	 *   { name: 'warrior', sprite: 'warrior_avatar' },
	 *   { name: 'mage', sprite: 'mage_avatar' },
	 * ];
	 * await spriteLibrary.prepareAvatars(config);
	 */
	async prepareAvatars(config: string | SpriteConfig[]): Promise<boolean> {
		return this.prepareSprites(config, this.avatars, "./img/portraits");
	}

	/**
	 * Prepares icon sprites based on the provided configuration.
	 * This method loads icon images and stores them in the `icons` map for later use.
	 * 
	 * @param {string | SpriteConfig[]} config - The configuration for icons. This can be either:
	 *   - A string representing the path to a JSON file containing the icon configurations.
	 *   - An array of `SpriteConfig` objects directly.
	 * 
	 * @returns {Promise<boolean>} A promise that resolves to `true` if all icon sprites were loaded successfully.
	 * 
	 * @example
	 * // Example usage with a JSON file path
	 * await spriteLibrary.prepareIcons('./config/icons.json');
	 * 
	 * @example
	 * // Example usage with an array of SpriteConfig objects
	 * const config = [
	 *   { name: 'health', sprite: 'health_icon' },
	 *   { name: 'mana', sprite: 'mana_icon' },
	 * ];
	 * await spriteLibrary.prepareIcons(config);
	 */
	async prepareIcons(config: string | SpriteConfig[]): Promise<boolean> {
		return this.prepareSprites(config, this.icons);
	}

	async prepareSprites(config: string | SpriteConfig[], result: {[key: string]: HTMLImageElement}, uriPrefix: string = "./img"): Promise<boolean> {
		if (typeof config === 'string') {
			config = await loadSpriteConfig(config);
		}

		for (const spriteConfig of config) {
			try {
				const image = await loadImage(`${uriPrefix}/${spriteConfig.sprite}.svg`);
				result[spriteConfig.name] = image;
			} catch (error) {
				console.error(`Failed to load image for key "${spriteConfig.name}":`, error);
				return false;
			}
		}

		return true;
	}

	async prepareActorSprites(tileSize: Size): Promise<boolean> {
		// Placeholder: Using house.svg as a temporary image for actors.
		// TODO: Replace with actual actor sprites
		this.actors['test'] = new ActorSprite(await loadImage("./img/house.svg"), 2, tileSize);
		this.actors['delivery'] = new ActorSprite(await loadImage("./img/house.svg"), 2, tileSize);
		this.actors['delivery'].fillStyle = "blue";
		this.actors['delivery'].refreshSize(tileSize);
		return true;
	}

	/**
	 * Retrieves the `TilingSprite` instance representing the road.
	 * 
	 * @returns {TilingSprite} The `TilingSprite` instance for the road.
	 */
	getRoad(): TilingSprite {
		return this.road!;
	}

	/**
	 * Retrieves the `TilingSprite` instance representing the arrow.
	 * 
	 * @returns {TilingSprite} The `TilingSprite` instance for the arrow.
	 */
	getArrow(): TilingSprite {
		return this.arrow!;
	}

	/**
	 * Prepares the road sprites by loading and initializing them as a `TilingSprite`.
	 * 
	 * @param {Size} tileSize - The size of the tiles used in the game. This is used to scale the road sprites appropriately.
	 * @returns {Promise<boolean>} A promise that resolves to `true` once the road sprites are prepared successfully.
	 */
	async prepareRoadSprites(tileSize: Size): Promise<boolean> {
		this.road = await this.prepareTilingSprites("road", tileSize);
		return true;
	}

	/**
	 * Prepares a set of tiling sprites for a given type.
	 * This method loads sprite images, handles edge cases (e.g., invalid or missing images),
	 * and creates a `TilingSprite` instance.
	 * 
	 * @param {string} name - The base name of the sprite type (e.g., "road").
	 * @param {Size} tileSize - The size of the tiles used in the game. This is used to scale the sprites appropriately.
	 * @param {number} [minOnes=0] - The minimum number of "1"s in the binary representation of the sprite index to include it.
	 * @param {number} [maxOnes=4] - The maximum number of "1"s in the binary representation of the sprite index to include it.
	 * 
	 * @returns {Promise<TilingSprite>} A promise that resolves to a `TilingSprite` instance containing the prepared sprites.
	 * 
	 * @example
	 * // Example usage: Prepare tiling sprites for arrows
	 * const arrowSprites = await spriteLibrary.prepareTilingSprites("arrow", { width: 32, height: 32 }, 2, 2);
	 */
	private async prepareTilingSprites(name: string, tileSize: Size, minOnes: number = 0, maxOnes: number = 4): Promise<TilingSprite> {
		// TODO: manually setting size of the first tile is just a hack
		// to make everything work for not-full tilesets
		const size: Size = {width: 0, height: 0};
		const sprites = [];
		for (let i = 0; i < 16; i++) {
			const ones = this.countOnes(i);
			if (ones < minOnes || ones > maxOnes) {
				sprites.push(this.getDummyTile());
				continue;
			}
			const binary = i.toString(2).padStart(4, '0');
			const path = `./img/${name}${binary}.svg`;
			try {
				const image = await loadImage(path);
				sprites.push(image);
				size.width = image.width;
				size.height = image.height;
			} catch (error) {
				this.logger.error(`Failed to load ${name} image: ${path}`, error);
				sprites.push(this.getDummyTile());
			}
		}
		sprites[0].width = size.width;
		sprites[0].height = size.height;
		return new TilingSprite(sprites, tileSize);
	}

	private getDummyTile(): HTMLImageElement {
		const image = new Image();
		image.width = 10;
		image.height = 10;
		return image;
	}

	private countOnes(n: number): number {
		let count = 0;
		while (n > 0) {
			count += n & 1;
			n >>>= 1;
		}
		return count;
	}

	/**
	 * Prepares the arrow sprites by loading and initializing them as a `TilingSprite`.
	 * 
	 * @param {Size} tileSize - The size of the tiles used in the game. This is used to scale the arrow sprites appropriately.
	 * @returns {Promise<boolean>} A promise that resolves to `true` once the arrow sprites are prepared successfully.
	 */
	async prepareArrowSprites(tileSize: Size): Promise<boolean> {
		this.arrow = await this.prepareTilingSprites("arrow", tileSize, 2, 2);
		return true;
	}

	/**
	 * Rescales all sprites (buildings, road, and arrow) to match the current tile size.
	 * This method ensures that all sprites are properly scaled when the tile size changes,
	 * such as when the game's zoom level is adjusted.
	 * 
	 * @param {Size} tileSize - The new size of the tiles used in the game. This is typically calculated
	 *   based on the current zoom level or other scaling factors.
	 * 
	 * @example
	 * // Example usage: Rescale all sprites to match a new tile size after zooming
	 * const zoom = 2; // Example zoom factor
	 * spriteLibrary.rescaleSprites({ width: 64 * zoom, height: 32 * zoom });
	 */
	rescaleSprites(tileSize: Size) {
		for (const key in this.buildings) {
			this.buildings[key].sprite.refreshSize(tileSize);
		}
		this.getRoad().refreshSize(tileSize);
		this.getArrow().refreshSize(tileSize);
	}
}

async function loadImage(url: string): Promise<HTMLImageElement> {
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

async function loadSpriteConfig(filename: string): Promise<SpriteConfig[]> {
    const response = await fetch(`config/${filename}`);
    if (!response.ok) {
	    throw new Error(`Cannot load config for avatars: ${response.status}`);
    }
    return await response.json();
}
