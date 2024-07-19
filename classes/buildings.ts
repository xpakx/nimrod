import { getSize } from "../script.js";
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

	left: number = 0;
	right: number = 0;
	top: number = 0;
	bottom: number = 0;

	constructor(sprite: BuildingSprite, position: Position, accepted: boolean = true) {
		this.sprite =  sprite;
		this.position = position;
		this.accepted = accepted;
		this.underCursor = false;
	}

	calculateBorders(screenPosition: Position, tileHeight: number) {
		this.left = screenPosition.x - this.sprite.size.width/2; 
		this.right = screenPosition.x + this.sprite.size.width/2; 
		this.top = screenPosition.y - this.sprite.size.height + tileHeight; 
		this.bottom = screenPosition.y + tileHeight; 
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
