import { Actor, ActorSprite } from "./actor.js";
import { HouseLevel } from "./building/house.js";
import { GameState } from "./game-state.js";
import { Game } from "./game.js";
import { getLogger, Logger } from "./logger.js";
import { MapLayer, Position, Size } from "./map-layer.js";

export interface BuildingPrototype {
	sprite: BuildingSprite;
	interface: BuildingInterface;
	name: string;
	visibleName: string;
	cost: number;
	workerOptions?: WorkerOptions;
	houseOptions?: HouseOptions;
	storageOptions?: StorageOptions;
	productionOptions?: Recipe[];
}

export interface WorkerOptions {
	sprite: ActorSprite;
	repairing?: boolean;
	resource?: string;
	inventory?: number;
	workerStartTime?: number;
}

export interface HouseOptions {
	levels?: HouseLevel[];
}

export interface StorageOptions {
	resources?: string[];
	capacity?: number;
}

export class BuildingSprite {
	size: Size = {height: 0, width: 0};
	image: HTMLImageElement;
	baseSize: number;
	offscreen: OffscreenCanvas;

	constructor(image: HTMLImageElement, size: number, tileSize: Size) {
		this.image = image;
		this.baseSize = size;
		this.offscreen =  new OffscreenCanvas(100, 100);
		this.refreshSize(tileSize);
	}

	refreshSize(tileSize: Size) {
		this.size.width = tileSize.width * this.baseSize;
		this.size.height = this.image.height*(this.size.width/this.image.width);

		this.offscreen.width = this.size.width;
		this.offscreen.height = this.size.height;
		const offscreenCtx = this.offscreen.getContext('2d');
		if (offscreenCtx) {
			offscreenCtx.clearRect(0, 0, this.size.width, this.size.height);
			offscreenCtx.drawImage(this.image, 0, 0, this.size.width, this.size.height);
		}
	}

}

export class Building {
	sprite: BuildingSprite;
	position: Position;
	accepted: boolean;
	underCursor: boolean;
	diagonal: number;

	workerSpawn: Position | undefined;
	worker: BuildingWorker | undefined;
	interface: BuildingInterface;
	name: string;
	visibleName: string;
	health: number = 100;
	readyToSpawn: boolean = false;;
	recipes?: Recipe[];
	accepts: Set<string>;
	logger: Logger = getLogger("Building");

	constructor(prototype: BuildingPrototype, position: Position, accepted: boolean = true) {
		this.sprite =  prototype.sprite;
		this.position = position;
		this.accepted = accepted;
		this.underCursor = false;
		this.name = prototype.name;
		this.visibleName = prototype.visibleName;

		const centerA = [Math.floor((position.x + position.x - this.sprite.baseSize + 1)/2), Math.floor((position.y + position.y - this.sprite.baseSize + 1)/2)]
		this.diagonal = (centerA[0] + centerA[1]);
		this.interface = prototype.interface;
		if(prototype.workerOptions) this.applyWorkerOptions(prototype.workerOptions);
		if(prototype.productionOptions) this.applyProductionOptions(prototype.productionOptions);
		this.accepts = new Set<string>();
	}

	applyWorkerOptions(options: WorkerOptions) {
		this.setWorker(options.sprite);
		if (options.repairing) this.worker!.repairing = options.repairing;
		if (options.resource) this.worker!.resource = options.resource;
		if (options.inventory) this.worker!.inventory = options.inventory;
		if (options.workerStartTime) this.worker!.workStartTime = options.workerStartTime;
	}

	applyProductionOptions(options: Recipe[]) {
		this.recipes = options; // TODO
		for (let recipe of options) {
			this.storage[recipe.output.resource] = 0;
		}
	}

	setWorker(sprite: ActorSprite) {
		this.worker = new BuildingWorker(sprite, this.workerSpawn);
	}

	calculateSpawn(roads: (Road | undefined)[][]) {
		for(let i = this.position.x-this.sprite.baseSize+1; i<=this.position.x; i++) {
				const y = this.position.y - this.sprite.baseSize;
				if(y >= 0 && roads[y][i]) {
					this.workerSpawn = {x: i, y: y};
					this.updateWorkerHome()
					return;
				}
		}
		for(let i = this.position.y-this.sprite.baseSize+1; i<=this.position.y; i++) {
				const x = this.position.x + 1;
				if(x >= 0 && roads[i][x]) {
					this.workerSpawn = {x: x, y: i};
					this.updateWorkerHome()
					return;
				}
		}

		for(let i = this.position.x; i>this.position.x-this.sprite.baseSize; i--) {
				const y = this.position.y + 1;
				if(y < roads.length && roads[y][i]) {
					this.workerSpawn = {x: i, y: y};
					this.updateWorkerHome()
					return;
				}
		}
		for(let i = this.position.y; i>this.position.y-this.sprite.baseSize; i--) {
				const x = this.position.x - this.sprite.baseSize;
				if(x >= 0 && roads[i][x]) {
					this.workerSpawn = {x: x, y: i};
					this.updateWorkerHome()
					return;
				}
		}
		this.workerSpawn = undefined;
		this.updateWorkerHome()
	}

	tick(deltaTime: number) {
		if(!this.worker || this.worker.isAwayFromHome || !this.workerSpawn) {
			return false;
		}
		this.worker.timeSinceLastReturn += deltaTime;
		if(this.worker.timeSinceLastReturn >= this.worker.workStartTime) {
			this.worker.timeSinceLastReturn = 0;
			this.worker.isAwayFromHome = true;
			this.worker.dead = false;
			this.readyToSpawn = true;
		}
	}

	canSpawnWorker(): boolean {
		return this.readyToSpawn && this.workerSpawn != undefined && this.worker != undefined;
	}

	spawnWorker(): BuildingWorker {
		const worker = this.worker!;
		const spawn = this.workerSpawn!;
		worker.setPosition(spawn);
		this.readyToSpawn = false;
		return worker;
	}

	updateWorkerHome() {
		if (!this.worker || !this.workerSpawn) {
			return;
		}
		this.worker.home = this.workerSpawn;
	}

	storage: { [key: string]: number } = {}; // TODO
	capacity: number = 20;
	supply(worker: BuildingWorker, resource: string, inventory: number): number {
		if (!this.accepts.has(resource)) return 0;
		if (this.storage.hasOwnProperty(resource) && inventory > 0 && this.storage[resource] < this.capacity) {
			const amount = Math.min(inventory, this.capacity - this.storage[resource]);
			this.storage[resource] += amount;
			this.logger.debug(`${worker.name} supplied ${amount} ${resource} to ${this.name} at (${this.position.x}, ${this.position.y})`);
			return amount;
		}
		this.logger.debug(`${worker.name} visited ${this.name} at (${this.position.x}, ${this.position.y})`);
		return 0;
	}

	getResources(worker: BuildingWorker, resource: string, inventory: number): number {
		if (this.storage.hasOwnProperty(resource) && inventory > 0 && this.storage[resource] > 0) {
			const amount = Math.min(inventory, this.storage[resource]);
			this.storage[resource] -= amount;
			this.logger.debug(`${worker.name} took ${amount} ${resource} from ${this.name} at (${this.position.x}, ${this.position.y})`);
			return amount;
		}
		return 0;
	}

	repair(worker: BuildingWorker) {
		this.health = Math.min(this.health + 20, 100);
		this.logger.debug(`${worker.name} repaired ${this.name} at (${this.position.x}, ${this.position.y})`);
	}

	onMinuteEnd(_state: GameState) {
		this.health = Math.max(this.health - 2, 0);
		this.logger.debug(`${this.name} health is ${this.health} at (${this.position.x}, ${this.position.y})`);

		if(this.recipes) {
			this.applyProduction(this.recipes);
		}
	}

	consume(resource: string, amount: number) {
		this.storage[resource] = Math.max(this.storage[resource] - amount, 0);
		this.logger.debug(`${this.name} ${resource} is ${this.storage[resource]} at (${this.position.x}, ${this.position.y})`);
	}

	productionProgress: { [key: string]: number } = {};
	productionInProgress(resource: string): number {
		if (resource in this.productionProgress) {
			return this.productionProgress[resource];
		}
		return 0;
	}

	isProductionFinished(resource: string): boolean {
		return this.productionInProgress(resource) == 0;
	}

	applyProduction(recipes: Recipe[]) {
		for (let recipe of recipes) {
			this.applyRecipe(recipe);
		}
	}

	isResourceProducible(resource: string): boolean {
		return resource in this.storage && this.storage[resource] < this.capacity;
	}

	advanceProduction(recipe: Recipe) {
		const resource = recipe.output.resource;
		this.productionProgress[resource] = this.productionProgress[resource] + 1;
		if (this.productionProgress[resource] < recipe.time) return;
		this.productionProgress[resource] = 0;
	}

	hasResources(recipe: Recipe) {
		return recipe.ingredients.every((s) => s.resource in this.storage && this.storage[s.resource] >= s.amount);
	}

	getResourceAmount(resource: string) {
		if (!(resource in this.storage)) return 0;
		return this.storage[resource];
	}

	startProduction(recipe: Recipe) {
		const resource = recipe.output.resource;
		for (let res of recipe.ingredients) {
			this.storage[res.resource] = this.storage[res.resource] - res.amount;
		}
		if (recipe.time > 1) {
			this.productionProgress[resource] = 1;
		}
	}

	finishProduction(recipe: Recipe) {
		const resource = recipe.output.resource;
		const amount = Math.min(recipe.output.amount, this.capacity - this.storage[resource]);
		this.storage[resource] = this.storage[resource] + amount;
		this.logger.debug(`${this.name} produced ${amount} of ${resource} (${this.position.x}, ${this.position.y})`);
	}

	applyRecipe(recipe: Recipe) {
		const resource = recipe.output.resource;
		if (!this.isResourceProducible(resource)) return;
		if (this.productionInProgress(resource) > 0) {
			this.advanceProduction(recipe);
		} else {
			if (!this.hasResources(recipe)) return;
			this.startProduction(recipe);
		}
		if (!this.isProductionFinished(resource)) return;
		this.finishProduction(recipe);
	}

	onDeletion() {
		if (this.worker) this.worker.dead = true;
	}


	info() {
		this.logger.info(`Building of type ${this.name} at position (${this.position.x}, ${this.position.y})`);
		this.logger.info("Storage", this.storage);
	}
}

export class BuildingWorker extends Actor {
	isAwayFromHome: boolean = false;
	timeSinceLastReturn: number = 0;
	workStartTime: number = 10;
	resource?: string;
	inventory: number = 50;
	repairing: boolean;
	resourceQuality?: number;

	constructor(sprite: ActorSprite, home: Position | undefined, repairing: boolean = false) {
		super(sprite, {x: 0, y: 0});
		if (home) this.home = home;
		this.repairing = repairing;
	}

	tick(deltaTime: number, map: MapLayer, randMap: number[]): boolean {
		let [x, y] = [this.positionSquare.x, this.positionSquare.y];
		const result =  super.tick(deltaTime, map, randMap);
		this.handleDeath();
		if (x != this.positionSquare.x || y != this.positionSquare.y) {
			this.visitBuildings(map);
		}
		return result;
	}

	handleDeath() {
		if (!this.dead) {
			return;
		}
		this.logger.debug("Actor is dead");
		this.isAwayFromHome = false;
		this.travelFinished = false;
		this.traveledSquares = 0;
		this.inventory = 50; // TODO
		this.goal = undefined;
	}

	visitBuildings(map: MapLayer) {
		if (this.inventory == 0) {
			return;
		}
		const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
		for (const [dx, dy] of directions) {
			const pos = {x: this.positionSquare.x + dx, y: this.positionSquare.y + dy};
			const building = map.getBuilding(pos);
			if (building) {
				this.work(building);
				if (this.repairing) this.repair(building);
			}
		}
	}

	work(building: Building) {
		if (!this.resource) return;
		if (this.inventory == 0) return;
		this.inventory -= building.supply(this, this.resource, this.inventory);
		if (this.inventory <= 0) {
			this.travelFinished = true;
			this.logger.debug(`${this.name} is out of ${this.resource}, heading home`);
		}
	}

	repair(building: Building) {
		building.repair(this);
	}
}

export class Road {
	sprites: TilingSprite;
	sprite: HTMLImageElement;
	position: Position;
	accepted: boolean;
	direction: number;

	constructor(sprite: TilingSprite, position: Position, direction: number, accepted: boolean = true) {
		this.direction = direction;
		this.sprites = sprite;
		this.sprite =  sprite.sprites[this.direction];
		this.position = position;
		this.accepted = accepted;
	}

	xorDir(dir: number) {
		this.direction ^= dir;
		this.sprite = this.sprites.sprites[this.direction];
	}
}


export class TilingSprite {
	size: Size = {height: 0, width: 0};
	sprites: HTMLImageElement[];
	baseSize: number;

	constructor(sprites: HTMLImageElement[], tileSize: Size) {
		this.sprites = sprites;
		this.baseSize = 1;
		this.refreshSize(tileSize);
	}

	refreshSize(tileSize: Size) {
		this.size.width = tileSize.width * this.baseSize;
		this.size.height = this.sprites[0].height*(this.size.width/this.sprites[0].width);
	}

}

export class BuildingInterface {
	menuWidth = 420; // TODO: delete this
	topPanelHeight = 50;
	building?: Building;
	state?: GameState; // TODO: just update width, etc
	offscreen?: OffscreenCanvas;
	context?: OffscreenCanvasRenderingContext2D;

	click(_state: GameState) { }

	open(state: GameState, building: Building) {
		this.state = state;
		this.building = building;
		this.renderInterface(state);
	}

	inInterface(pos: Position): boolean {
		if (!this.state) return false;
		const leftMargin = 80;
		const width = this.state.canvasWidth - 2 * leftMargin - this.menuWidth;
		const height = 300;
		const x = leftMargin;
		const middleOfMap = (this.state.canvasHeight - this.topPanelHeight) / 2  + this.topPanelHeight;
		const y = middleOfMap - height / 2;
		return (pos.x >= x && pos.x <= x + width && pos.y >= y && pos.y <= y + height);
	}

	drawInterface(context: CanvasRenderingContext2D, _deltaTime: number, _state: GameState) {
		if (!this.offscreen) return;
		context.drawImage(this.offscreen, 0, 0);
	}

	renderInterface(state: GameState) { 
		const leftMargin = 80;
		const width = state.canvasWidth - 2 * leftMargin - this.menuWidth;
		const height = 300;
		const x = leftMargin;
		const middleOfMap = (state.canvasHeight - this.topPanelHeight) / 2  + this.topPanelHeight;
		const y = middleOfMap - height / 2;

		this.offscreen = new OffscreenCanvas(state.canvasWidth, state.canvasHeight);
		this.context = this.offscreen.getContext("2d")!;
		this.context.fillStyle = '#444';
		this.context.fillRect(x, y, width, height);

		this.context.strokeStyle = '#fff';
		this.context.strokeRect(x, y, width, height);

		this.context.fillStyle = '#fff';
		this.context.font = '16px Arial';

		const building = this.building!;
		const lineHeight = 24;
		const topPadding = 10;
		const leftPadding = 10;


		const imageSize = 80;
		const imagePadding = 20;
		const rectSize = imageSize + 2*imagePadding;
		const imageX = x + leftPadding;
		const imageY = y + topPadding;
		this.context.fillStyle = '#575757';
		this.context.fillRect(imageX, imageY, rectSize, rectSize);
		this.context.strokeStyle = '#fff';
		this.context.strokeRect(imageX, imageY, rectSize, rectSize);

		this.context.drawImage(building.sprite.image, imageX + imagePadding, imageY + imagePadding, imageSize, imageSize);

		const nameX = imageX + imageSize + 2*imagePadding + 20;
		const nameY = y + topPadding + lineHeight;

		this.context.fillStyle = '#fff';
		this.context.font = '24px Arial';
		this.context.fillText(building.visibleName, nameX, nameY);

		this.renderRecipes(state);
		
	}

	renderRecipes(state: GameState) {
		if (!this.building || !this.building.recipes) return;
		if (!this.context) return;
		const height = 300;
		const middleOfMap = (state.canvasHeight - this.topPanelHeight) / 2  + this.topPanelHeight;
		const y = middleOfMap - height / 2;
		const topPadding = 10;
		const imageSize = 80;
		const imagePadding = 20;
		const imageEnd = y + topPadding + 24 + 20;

		const leftMargin = 80;
		const leftPadding = 10;

		const lineHeight = 20;
		let i = 0;
		this.context.fillStyle = '#fff';
		this.context.font = '15px Arial';
		const recipesX = leftMargin + leftPadding + imageSize + 2*imagePadding + 20;

		for (let recipe of this.building.recipes) {
			if (recipe.output) {
				let ingredientString = "";
				for (let ingredient of recipe.ingredients) {
					const amount = this.building.getResourceAmount(ingredient.resource);
					ingredientString += `${ingredient.resource} (${amount}) `;
				}
				const amount = this.building.getResourceAmount(recipe.output.resource);
				this.context.fillText(`${ingredientString} -> ${recipe.output.resource} (${amount})`, recipesX, imageEnd + i * lineHeight);
			}
		}
	}


}

export interface Recipe {
	output: Ingredient;
	ingredients: Ingredient[];
	time: number;
}

interface Ingredient {
	resource: string;
	amount: number;
}
