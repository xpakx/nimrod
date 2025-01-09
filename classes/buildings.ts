import { Actor, ActorSprite } from "./actor.js";
import { GameState } from "./game-state.js";
import { MapLayer, Position, Size } from "./map-layer.js";

export interface BuildingPrototype {
	sprite: BuildingSprite;
	interface: BuildingInterface;
	name: string;
	cost: number;
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
	health: number = 100;

	constructor(prototype: BuildingPrototype, position: Position, accepted: boolean = true) {
		this.sprite =  prototype.sprite;
		this.position = position;
		this.accepted = accepted;
		this.underCursor = false;
		this.name = prototype.name;

		const centerA = [Math.floor((position.x + position.x - this.sprite.baseSize + 1)/2), Math.floor((position.y + position.y - this.sprite.baseSize + 1)/2)]
		this.diagonal = (centerA[0] + centerA[1]);
		this.interface = prototype.interface;
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

	tick(deltaTime: number): boolean {
		if(!this.worker || this.worker.isAwayFromHome || !this.workerSpawn) {
			return false;
		}
		this.worker.timeSinceLastReturn += deltaTime;
		if(this.worker.timeSinceLastReturn >= this.worker.workStartTime) {
			this.worker.timeSinceLastReturn = 0;
			this.worker.isAwayFromHome = true;
			this.worker.dead = false;
			return true;
		}
		return false;
	}

	updateWorkerHome() {
		if (!this.worker || !this.workerSpawn) {
			return;
		}
		this.worker.home = this.workerSpawn;
	}

	storage: { [key: string]: number } = { "water": 0 }; // TODO
	capacity: number = 20;
	supply(worker: BuildingWorker, resource: string, inventory: number): number {
		if (this.storage.hasOwnProperty(resource) && inventory > 0 && this.storage[resource] < this.capacity) {
			const amount = Math.min(inventory, this.capacity - this.storage[resource]);
			this.storage[resource] += amount;
			console.log(`${worker.name} supplied ${amount} ${resource} to ${this.name} at (${this.position.x}, ${this.position.y})`);
			return amount;
		}
		console.log(`${worker.name} visited ${this.name} at (${this.position.x}, ${this.position.y})`);
		return 0;
	}

	minuteEnd(_state: GameState) {
		this.health = Math.max(this.health - 2, 0);
		console.log(`${this.name} health is ${this.health} at (${this.position.x}, ${this.position.y})`);

	}
}

export class BuildingWorker extends Actor {
	isAwayFromHome: boolean = false;
	timeSinceLastReturn: number = 0;
	workStartTime: number = 10;
	resource: string = "water";
	inventory: number = 50;

	constructor(sprite: ActorSprite, home: Position | undefined) {
		super(sprite, {x: 0, y: 0});
		if (home) this.home = home;
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
		// console.log("i am dead");
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
			}
		}
	}

	work(building: Building) {
		if (this.inventory == 0) return;
		this.inventory -= building.supply(this, this.resource, this.inventory);
		if (this.inventory <= 0) {
			this.travelFinished = true;
			console.log(`${this.name} is out of ${this.resource}, heading home`);
		}
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

	click(_state: GameState) { }
	open(_state: GameState) { }

	renderInterface(context: CanvasRenderingContext2D, _deltaTime: number, state: GameState) { 
		const width = state.canvasWidth - 20 - this.menuWidth;
		const height = 100;
		const x = 10;
		const y = state.canvasHeight - height - 10;

		context.fillStyle = '#444';
		context.fillRect(x, y, width, height);

		context.strokeStyle = '#fff';
		context.strokeRect(x, y, width, height);

		context.fillStyle = '#fff';
		context.font = '16px Arial';
	}

}
