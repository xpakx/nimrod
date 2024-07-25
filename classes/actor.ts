import { Road } from "./buildings.js";
import { Position, Size } from "./map-layer.js";

export class ActorSprite {
	size: Size = {height: 0, width: 0};
	image: HTMLImageElement;
	baseSize: number;

	constructor(image: HTMLImageElement, size: number, tileSize: Size) {
		this.image = image;
		this.baseSize = size;
		this.refreshSize(tileSize);
	}

	refreshSize(tileSize: Size) {
		this.size.width = tileSize.width * this.baseSize;
		this.size.height = this.image.height*(this.size.width/this.image.width);
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
		this.positionSquare = {x: Math.floor(position.x), y: Math.floor(position.y)};
		this.position = {x: this.positionSquare.x + 0.5, y: this.positionSquare.y + 0.5};

		this.diagonal = this.positionSquare.x + this.positionSquare.y;
		this.directionMask = 0b0000;
		this.direction = {x: 0, y: 0};
	}

	getNewDir(roads: (Road | undefined)[][], randMap: number[], newX: number, newY: number, x: number, y: number) {
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
					this.directionMask = reverseMask(simpifyDir(newDirection, randMap));
				}
				this.direction.x = maskToDirectionX(this.directionMask);
				this.direction.y = maskToDirectionY(this.directionMask);
			}
			this.position.x += correctionX*this.direction.x;
			this.position.y += correctionY*this.direction.y;
		}
	}

	enterSquare(x: number, y: number) {
			this.positionSquare.x = x;
			this.positionSquare.y = y;
			this.diagonal = x + y;
			if(!this.travelFinished) {
				this.traveledSquares += 1;
				if(this.traveledSquares == this.maxTravel) {
					this.traveledSquares = 0;
					this.travelFinished = true;
				}
			}
	}

	tick(deltaTime: number, roads: (Road | undefined)[][], randMap: number[]): boolean {
		if(this.travelFinished) {
			return false;
		}
		let newX = this.position.x + this.direction.x*deltaTime;
		let newY = this.position.y + this.direction.y*deltaTime;
		let x = Math.floor(newX);
		let y = Math.floor(newY);
		let diagonalChanged = false;

		if(this.directionMask == 0 || beforeHalf(this.direction, this.positionSquare, this.position.x, this.position.y)) {
			this.getNewDir(roads, randMap, newX, newY, x, y);
			if(x != this.positionSquare.x || y != this.positionSquare.y) {
				this.enterSquare(x, y)
				diagonalChanged = true;
			} 
		} else if(afterHalf(this.direction, this.positionSquare, this.position.x, this.position.y)) {
			if(x != this.positionSquare.x || y != this.positionSquare.y) {
				this.enterSquare(x, y)
				diagonalChanged = true;
			} 
			this.getNewDir(roads, randMap, newX, newY, x, y); // this should only be problem while lagging
		}
		this.position.x = newX;
		this.position.y = newY;
		return diagonalChanged;
	}
}

function beforeHalf(direction: Position, square: Position, x: number, y: number): boolean {
	if(direction.x > 0) {
		const half = square.x + 0.5;
		return x < half;
	}
	if(direction.x < 0) {
		const half = square.x + 0.5;
		return x >= half;
	}
	if(direction.y > 0) {
		const half = square.y + 0.5;
		return y < half;
	}
	if(direction.y < 0) {
		const half = square.y + 0.5;
		return y >= half;
	}
	return false;
}

function afterHalf(direction: Position, square: Position, x: number, y: number): boolean {
	if(direction.x > 0) {
		const half = square.x + 0.5;
		return x >= half;
	}
	if(direction.x < 0) {
		const half = square.x + 0.5;
		return x < half;
	}
	if(direction.y > 0) {
		const half = square.y + 0.5;
		return y >= half;
	}
	if(direction.y < 0) {
		const half = square.y + 0.5;
		return y < half;
	}
	return false;
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

const randomizationMap: { [key: number]: number[] } = {
	0b0001: [0b0001],
	0b0010: [0b0010],
	0b0011: [0b0001, 0b0010],
	0b0100: [0b0100],
	0b0101: [0b0001, 0b0100],
	0b0110: [0b0010, 0b0100],
	0b0111: [0b0001, 0b0010, 0b0100],
	0b1000: [0b1000],
	0b1001: [0b1000, 0b0001],
	0b1010: [0b1000, 0b0010],
	0b1011: [0b1000, 0b0001, 0b0010],
	0b1100: [0b1000, 0b0100],
	0b1101: [0b1000, 0b0001, 0b0100],
	0b1110: [0b1000, 0b0010, 0b0100],
	0b1111: [0b1000, 0b0001, 0b0010, 0b0100],
}

function simpifyDir(mask: number, randomMap: number[]): number {
	const toRandomize = randomizationMap[mask];
	return toRandomize[randomMap[toRandomize.length - 2]];
}