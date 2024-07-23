import { getSize } from "../script.js";
import { Road } from "./buildings.js";
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
	positionSquare: Position;
	diagonal: number;

	directionMask: number;
	direction: Position;

	traveledSquares = 0;
	maxTravel = 30;
        travelFinished = false;

	constructor(sprite: ActorSprite, position: Position) {
		this.sprite =  sprite;
		this.position = position;
		this.positionSquare = {x: Math.floor(position.x), y: Math.floor(position.y)};

		this.diagonal = this.positionSquare.x + this.positionSquare.y;
		this.directionMask = 0b0000;
		this.direction = {x: 0, y: 0};
	}

	tick(deltaTime: number, roads: (Road | undefined)[][]): boolean {
		if(this.travelFinished) {
			return false;
		}
		let newX = this.position.x + this.direction.x*deltaTime;
		let newY = this.position.y + this.direction.y*deltaTime;
		let x = Math.floor(newX);
		let y = Math.floor(newY);
		let diagonalChanged = false;
		if(this.directionMask == 0 || hasStepOverHalf(this.direction, this.positionSquare, this.position, newX, newY)) {
			let correctionX = 0
			let correctionY = 0
			if(this.direction.x != 0) {
				newX = this.positionSquare.x + 0.5; // TODO
				correctionX = (this.position.x - newX);
			} else {
				newY = this.positionSquare.y + 0.5; // TODO
				correctionY = (this.position.y - newY);
			}
			const road = roads[y][x]
			if(road) {
				const newDirection = road.direction ^ this.directionMask;
				if(newDirection == 0) {
					this.directionMask = reverseMask(this.directionMask);
				} else if (oneBit(newDirection)) {
					this.directionMask = reverseMask(newDirection);
				} else {
					// todo: randomize if more than one option
					this.directionMask = reverseMask(simpifyDir(newDirection));
				}
				this.direction.x = maskToDirectionX(this.directionMask);
				this.direction.y = maskToDirectionY(this.directionMask);
			}
			this.position.x += correctionX*this.direction.x;
			this.position.y += correctionY*this.direction.y;
		}
		if(x != this.positionSquare.x || y != this.positionSquare.y) {
			this.positionSquare.x = x;
			this.positionSquare.y = y;
			this.diagonal = x + y;
			diagonalChanged = true;
			this.traveledSquares += 1;
			if(this.traveledSquares == this.maxTravel) {
				this.traveledSquares = 0;
				this.travelFinished = true;
			}
		} 
		this.position.x = newX;
		this.position.y = newY;
		return diagonalChanged;
	}
}

function hasStepOverHalf(direction: Position, square: Position, pre: Position, postX: number, postY: number): boolean {
	if(direction.x > 0) {
		const x = square.x + 0.5;
		return pre.x < x && postX >= x;
	}
	if(direction.x < 0) {
		const x = square.x + 0.5;
		return pre.x > x && postX <= x;
	}
	if(direction.y > 0) {
		const y = square.y + 0.5;
		return pre.y < y && postY >= y;
	}
	if(direction.y < 0) {
		const y = square.y + 0.5;
		return pre.y > y && postY <= y;
	}
	return false;
}

function maskToDirectionX(mask: number): number {
	if(mask == 0b0001) {
		return 1;
	}
	if(mask == 0b0100) {
		return -1;
	}
	return 0;
}

function maskToDirectionY(mask: number): number {
	if(mask == 0b1000) {
		return 1;
	}
	if(mask == 0b0010) {
		return -1;
	}
	return 0;
}

function reverseMask(mask: number): number {
	if(mask == 0b0001) {
		return 0b0100;
	}
	if(mask == 0b0100) {
		return 0b0001;
	}
	if(mask == 0b0010) {
		return 0b1000;
	}
	if(mask == 0b1000) {
		return 0b0010;
	}
	return 0;
}

function oneBit(mask: number): boolean {
	return (mask & (mask-1)) == 0;
}

function simpifyDir(mask: number): number {
	if((mask & 0b0001) != 0) {
		return 0b0001;
	}
	if((mask & 0b0010) != 0) {
		return 0b0010;
	}
	if((mask & 0b0100) != 0) {
		return 0b0100;
	}
	return 0b1000;
}
