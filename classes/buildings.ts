import { ActorSprite } from "./actor.js";
import { GameState } from "./game-state.js";
import { Position, Size } from "./map-layer.js";

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

	constructor(sprite: BuildingSprite, position: Position, accepted: boolean = true) {
		this.sprite =  sprite;
		this.position = position;
		this.accepted = accepted;
		this.underCursor = false;

		const centerA = [Math.floor((position.x + position.x - sprite.baseSize + 1)/2), Math.floor((position.y + position.y - sprite.baseSize + 1)/2)]
		this.diagonal = (centerA[0] + centerA[1]);
		this.interface = new BuildingInterface();
	}

	setWorker(sprite: ActorSprite) {
		this.worker = new BuildingWorker(sprite);
	}

	calculateSpawn(roads: (Road | undefined)[][]) {
		for(let i = this.position.x-this.sprite.baseSize+1; i<=this.position.x; i++) {
				const y = this.position.y - this.sprite.baseSize;
				if(y >= 0 && roads[y][i]) {
					this.workerSpawn = {x: i, y: y};
					return;
				}
		}
		for(let i = this.position.y-this.sprite.baseSize+1; i<=this.position.y; i++) {
				const x = this.position.x + 1;
				if(x >= 0 && roads[i][x]) {
					this.workerSpawn = {x: x, y: i};
					return;
				}
		}

		for(let i = this.position.x; i>this.position.x-this.sprite.baseSize; i--) {
				const y = this.position.y + 1;
				if(y < roads.length && roads[y][i]) {
					this.workerSpawn = {x: i, y: y};
					return;
				}
		}
		for(let i = this.position.y; i>this.position.y-this.sprite.baseSize; i--) {
				const x = this.position.x - this.sprite.baseSize;
				if(x >= 0 && roads[i][x]) {
					this.workerSpawn = {x: x, y: i};
					return;
				}
		}
		this.workerSpawn = undefined;
	}

	tick(deltaTime: number): boolean {
		if(!this.worker || this.worker.workerOut || !this.workerSpawn) {
			return false;
		}
		this.worker.workerTimer += deltaTime;
		if(this.worker.workerTimer >= this.worker.workerAt) {
			this.worker.workerTimer = 0;
			this.worker.workerOut = true;
			return true;
		}
		return false;
	}
}

export class BuildingWorker {
	workerOut: boolean = false;
	workerTimer: number = 0;
	workerAt: number = 10;
	sprite: ActorSprite;

	constructor(sprite: ActorSprite) {
		this.sprite = sprite;
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
