import { Road } from "./building/buildings.js";
import { getLogger, Logger } from "./logger.js";
import { MapLayer, Position, Size } from "./map-layer.js";

export interface ActorSprite {
	refreshSize(tileSize: Size): void;
	getImage(): HTMLImageElement;
	getScaledImage(): HTMLImageElement | OffscreenCanvas;
	getKey(): string;
	tick?(deltaTime: number, actor?: Actor): void;
}

export class StaticActorSprite implements ActorSprite {
	size: Size = {height: 0, width: 0};
	image: HTMLImageElement;
	baseSize: number;
	offscreen: OffscreenCanvas;
	context: OffscreenCanvasRenderingContext2D;
	key: string;

	constructor(image: HTMLImageElement, size: number, tileSize: Size, key: string) {
		this.image = image;
		this.baseSize = size;
		this.offscreen =  new OffscreenCanvas(100, 100);
		const offscreenCtx = this.offscreen.getContext('2d');
		if (!offscreenCtx) {
			throw new Error("Couldn't create OffscreenCanvas context");
		}
		this.context = offscreenCtx;

		this.refreshSize(tileSize);
		this.key = key;
	}

	refreshSize(tileSize: Size) {
		this.size.width = tileSize.width * this.baseSize;
		this.size.height = this.image.height*(this.size.width/this.image.width);

		this.offscreen.width = this.size.width;
		this.offscreen.height = this.size.height;
		this.context.drawImage(this.image, 0, 0, this.offscreen.width, this.offscreen.height);
	}

	getImage(): HTMLImageElement {
	    return this.image;
	}

	getScaledImage(): OffscreenCanvas {
		return this.offscreen;
	}

	getKey(): string {
	    return this.key;
	}
}

export interface DebugActorSpriteOptions {
	fillStyle?: "red" | "blue" | "green";
}

export class DebugActorSprite extends StaticActorSprite {
	fillStyle: "red" | "blue" | "green" = "red";

	constructor(image: HTMLImageElement, size: number, tileSize: Size, key: string, opt?: DebugActorSpriteOptions) {
		super(image, size, tileSize, key);
		this.fillStyle = opt?.fillStyle ?? "red";
		this.refreshSize(tileSize);
	}

	refreshSize(tileSize: Size) {
		this.size.width = tileSize.width * this.baseSize;
		this.size.height = this.image.height*(this.size.width/this.image.width);

		this.offscreen.width = 20;
		this.offscreen.height = 30;
		this.context.clearRect(0, 0, this.size.width, this.size.height);
		this.context.fillStyle = this.fillStyle;
		this.context.beginPath();
		this.context.ellipse(10, 15, 10, 15, 0, 0, 2 * Math.PI);
		this.context.fill();
	}
}

export class Actor {
	sprite: ActorSprite;
	portrait?: HTMLImageElement;
	position: Position;
	positionSquare: Position;
	diagonal: number;
	dead: boolean = false;
	name: String = "actor";

	directionMask: number;
	direction: Position;

	traveledSquares = 0;
	maxTravel = 10;
        travelFinished = false;
	home = {x: 0, y: 0};
	goal?: Position;
	logger: Logger = getLogger("Actor");

	constructor(sprite: ActorSprite, position: Position) {
		this.sprite =  sprite;
		this.positionSquare = {x: Math.floor(position.x), y: Math.floor(position.y)};
		this.position = {x: this.positionSquare.x + 0.5, y: this.positionSquare.y + 0.5};

		this.diagonal = this.positionSquare.x + this.positionSquare.y;
		this.directionMask = 0b0000;
		this.direction = {x: 0, y: 0};
	}

	setPosition(position: Position) {
		this.positionSquare = {x: Math.floor(position.x), y: Math.floor(position.y)};
		this.position = {x: this.positionSquare.x + 0.5, y: this.positionSquare.y + 0.5};
		this.diagonal = this.positionSquare.x + this.positionSquare.y;
		this.directionMask = 0b0000;
		this.direction = {x: 0, y: 0};
	}

	// change only direction and directionMask, return true if direction changed
	getNewDir(roads: (Road | undefined)[][], randMap: number[], x: number, y: number) {
		const road = roads[y][x]
		if(road) {
			const oldDirection = this.directionMask;
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
			return oldDirection != this.directionMask;
		}
		return false;
	}

	// change only square info, not real position
	enterSquare(x: number, y: number) {
			this.positionSquare.x = x;
			this.positionSquare.y = y;
			this.diagonal = x + y;
			if(!this.travelFinished) {
				this.traveledSquares += 1;
				if(this.traveledSquares == this.maxTravel) {
					this.traveledSquares = 0;
					this.travelFinished = true;
					this.logger.debug("going home");
				}
			}
	}

	isInCenter(): boolean {
		return this.positionSquare.x + 0.5 == this.position.x && this.positionSquare.y  + 0.5 == this.position.y
	}

	canMove(map: MapLayer): boolean {
		const roads = map.roads;
		return !roads[this.positionSquare.y][this.positionSquare.x]
	}

	// TODO: add interface for pathfinders
	tick(deltaTime: number, map: MapLayer, randMap: number[]): boolean {
		if (this.sprite.tick) this.sprite.tick(deltaTime, this);

		const roads = map.roads;
		if(this.travelFinished) {
			return this.returnToHome(deltaTime, map)
		}
		if(this.canMove(map)) {
			this.dead = true;
			this.direction.x = 0;
			this.direction.y = 0;
		}

		// (newX, newY) here is only a potential (x, y), shouldn't be really used later on if direction changed
		const newX = this.position.x + this.direction.x*deltaTime;
		const newY = this.position.y + this.direction.y*deltaTime;
		const x = Math.floor(newX);
		const y = Math.floor(newY);
		let diagonalChanged = false;

		if(this.directionMask == 0) {
			this.getNewDir(roads, randMap, x, y);
		}

		if(beforeHalf(this.direction, this.positionSquare, this.position.x, this.position.y)) {
			let dirChanged = false;
			if(hasStepOverHalf(this.direction, this.positionSquare, this.position, newX, newY)) {
				dirChanged = this.getNewDir(roads, randMap, x, y);
			} 

			if(dirChanged) {
				this.position.x = this.positionSquare.x + 0.5; // TODO
				this.position.y = this.positionSquare.y + 0.5; // TODO
			} else {
				this.position.x = newX;
				this.position.y = newY;
			}

			const currX = Math.floor(this.position.x);
			const currY = Math.floor(this.position.y);
			if(currX != this.positionSquare.x || currY != this.positionSquare.y) {
				this.enterSquare(currX, currY)
				diagonalChanged = true;
			} 
		} else if(afterHalf(this.direction, this.positionSquare, this.position.x, this.position.y)) {
			if(x != this.positionSquare.x || y != this.positionSquare.y) {
				this.enterSquare(x, y)
				diagonalChanged = true;
			} 
			if(hasStepOverHalf(this.direction, this.positionSquare, this.position, newX, newY)) {
				if (this.travelFinished) {
					this.position.x = this.positionSquare.x + 0.5;
					this.position.y = this.positionSquare.y + 0.5;
					return diagonalChanged;
				}
				this.getNewDir(roads, randMap, x, y);
			}
			this.position.x = newX;
			this.position.y = newY;
		}
		return diagonalChanged;
	}


	reachedGoal(): boolean {
		if (!this.goal) {
			return true;
		}
		return this.position.x == this.goal.x + 0.5 && this.position.y == this.goal.y + 0.5;
	}

	updatePosition(deltaX: number, deltaY: number) {
		let positionX = this.position.x + deltaX;
		let positionY = this.position.y + deltaY;
		if (!this.goal) {
			return;
		}
		if (this.position.x < this.goal.x + 0.5 && positionX > this.goal.x + 0.5) {
			positionX = this.goal.x + 0.5;
		}
		else if (this.position.x > this.goal.x + 0.5 && positionX < this.goal.x + 0.5) {
			positionX = this.goal.x + 0.5;
		} if (this.position.y < this.goal.y + 0.5 && positionY > this.goal.y + 0.5) {
			positionY = this.goal.y + 0.5;
		} else if (this.position.y > this.goal.y + 0.5 && positionY < this.goal.y + 0.5) {
			positionY = this.goal.y + 0.5;
		}
		this.position.x = positionX;
		this.position.y = positionY;
		this.positionSquare.x = Math.floor(this.position.x);
		this.positionSquare.y = Math.floor(this.position.y);
	}

	nextGoal(map: MapLayer): boolean {
		const step = map.pathfinder.getNextStep(this.positionSquare, this.home);
		this.logger.debug(`${this.logger.formatPosition(this.positionSquare)}=>${this.logger.formatPosition(this.home)}: ${this.logger.formatPosition(step)}`);
		if(!step) {
			return false;
		}
		this.goal = step;
		this.direction.x = step.x - this.positionSquare.x;
		this.direction.y = step.y - this.positionSquare.y;
		return true;
	}

	align(deltaTime: number) {
		const newX = this.position.x + this.direction.x*deltaTime;
		const newY = this.position.y + this.direction.y*deltaTime;
		if(hasStepOverHalf(this.direction, this.positionSquare, this.position, newX, newY)) {
			this.position.x = this.positionSquare.x + 0.5
			this.position.y = this.positionSquare.y + 0.5
		} else {
			this.position.x = newX;
			this.position.y = newY;
		}
	}

	returnToHome(deltaTime: number, map: MapLayer): boolean {
		if(!this.goal && !this.isInCenter()) {
			this.logger.debug(`trying to align actor`);
			this.align(deltaTime);
			return false;
		}
		if(!this.goal || this.reachedGoal()) {
			const foundGoal = this.nextGoal(map);
			if (!foundGoal) {
				this.dead = true;
				return false;
			}
		}
		this.updatePosition(this.direction.x*deltaTime, this.direction.y*deltaTime);

		if (this.positionSquare.x + this.positionSquare.y != this.diagonal) {
			this.diagonal = this.positionSquare.x + this.positionSquare.y;
			return true;
		}
		return false;
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
