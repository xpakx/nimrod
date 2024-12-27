import { Actor } from "../actor.js";
import { Road } from "../buildings.js";
import { Position } from "../map-layer.js";

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
	goal?: Position;
	lastPosition: Position = {x: 0, y: 0};

	tick(deltaTime: number, _roads: (Road | undefined)[][], _randMap: number[]): boolean {
		return this.move(deltaTime);
	}

	setPath(path: Position[]) {
		this.path = path;
		this.path.reverse();
		this.path.pop();
		this.goal = this.path.pop();
		this.lastPosition.x = this.positionSquare.x;
		this.lastPosition.y = this.positionSquare.y;
		this.direction.x = this.goal!.x - this.positionSquare.x;
		this.direction.y = this.goal!.y - this.positionSquare.y; 
		console.log("Start goal:", this.goal);
		console.log("Start dir:", this.direction);
	}

	reachedGoal(): boolean {
		if (!this.goal) {
			return true;
		}
		return this.positionSquare.x == this.goal.x && this.positionSquare.y == this.goal.y;
	}

	move(deltaTime: number): boolean {
		if(!this.goal) {
			return false;
		}
		console.log("goal:",this.goal);
		console.log("curr:",this.positionSquare);
		console.log("dir:", this.direction);
		if (this.reachedGoal()) {
			console.log("new goal");
			this.goal = this.path?.pop();
			console.log(this.goal);
			if (this.goal) {
				this.direction.x = this.goal.x - this.lastPosition.x;
				this.direction.y = this.goal.y - this.lastPosition.y;
				this.lastPosition.x = this.positionSquare.x;
				this.lastPosition.y = this.positionSquare.y;
			}
		}

		this.position.x = this.position.x + this.direction.x*deltaTime;
		this.position.y = this.position.y + this.direction.y*deltaTime;
		this.positionSquare.x = Math.floor(this.position.x);
		this.positionSquare.y = Math.floor(this.position.y);
		return false;
	}
}

export class Skill {
}

export type HeroType = "normal" | "fire" | "water" |
	"earth" | "air" | "shadow" | "light";
