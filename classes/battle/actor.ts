import { Actor } from "../actor.js";
import { MapLayer, Position } from "../map-layer.js";

export class BattleActor extends Actor {
	enemy: boolean = false;
	placed: boolean = false;
	name: string = "???";
	movement: number = 5;
	type: HeroType = "normal";
	hp: number = 0;
	skills: Skill[] = []

	moving: boolean = false;
	path?: Position[]

	tick(deltaTime: number, _roads: MapLayer, _randMap: number[]): boolean {
		return this.move(deltaTime);
	}

	setPath(path: Position[]) {
		this.path = path;
		this.path.reverse();
		this.path.pop();
		this.goal = this.path.pop();
		this.direction.x = this.goal!.x - this.positionSquare.x;
		this.direction.y = this.goal!.y - this.positionSquare.y; 
		console.log("Ultimate goal:", this.path[0]);
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

	nextGoal(): boolean {
		console.log("new goal");
		this.goal = this.path?.pop();
		console.log(this.goal);
		if (!this.goal) {
			console.log(this.position);
			return false;
		}
		this.direction.x = this.goal.x - this.positionSquare.x;
		this.direction.y = this.goal.y - this.positionSquare.y;
		return true;
	}

	move(deltaTime: number): boolean {
		if(!this.goal) {
			return false;
		}
		if (this.reachedGoal()) {
			const foundGoal = this.nextGoal();
			if (!foundGoal) return false;
		}

		this.updatePosition(this.direction.x*deltaTime, this.direction.y*deltaTime);

		if (this.positionSquare.x + this.positionSquare.y != this.diagonal) {
			this.diagonal = this.positionSquare.x + this.positionSquare.y;
			return true;
		}
		return false;
	}
}

export class Skill {
}

export type HeroType = "normal" | "fire" | "water" |
	"earth" | "air" | "shadow" | "light";
