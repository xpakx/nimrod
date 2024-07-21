import { getSize } from "../script.js";
import { ActorSprite } from "./actor.js";
import { Position, Size } from "./map-layer.js";

export class BuildingSprite {
	size: Size;
	image: HTMLImageElement;
	baseSize: number;

	constructor(image: HTMLImageElement, size: number) {
		this.image = image;
		this.size = getSize(image, size)
		this.baseSize = size;
	}

	refreshSize() {
		this.size = getSize(this.image, this.baseSize);
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

	constructor(sprite: BuildingSprite, position: Position, accepted: boolean = true) {
		this.sprite =  sprite;
		this.position = position;
		this.accepted = accepted;
		this.underCursor = false;

		const centerA = [Math.floor((position.x + position.x - sprite.baseSize + 1)/2), Math.floor((position.y + position.y - sprite.baseSize + 1)/2)]
		this.diagonal = (centerA[0] + centerA[1]);
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
	size: Size;
	sprites: HTMLImageElement[];
	baseSize: number;

	constructor(sprites: HTMLImageElement[]) {
		this.sprites = sprites;
		this.size = getSize(this.sprites[0], 1)
		this.baseSize = 1;
	}

	refreshSize() {
		this.size = getSize(this.sprites[0], this.baseSize);
	}

}
