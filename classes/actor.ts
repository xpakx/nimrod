import { getSize } from "../script.js";
import { Position, Size } from "./map-layer.js";

export class ActorSprite {
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

export class Actor {
	sprite: ActorSprite;
	position: Position;
	diagonal: number;

	constructor(sprite: ActorSprite, position: Position) {
		this.sprite =  sprite;
		this.position = position;

		this.diagonal = position.x + position.y;
	}
}
