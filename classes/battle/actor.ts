import { Actor, ActorSprite } from "../actor.js";
import { getLogger, Logger } from "../logger.js";
import { MapLayer, Position } from "../map-layer.js";
import { Skill } from "./skill/skill.js";

export type HeroRank = "common" | "rare"; 

export class BattleActor extends Actor {
	enemy: boolean = false;
	placed: boolean = false;
	name: string = "???";
	movement: number = 5;
	type: HeroType = "normal";
	hp: number = 0;
	skills: Skill[] = []
	logger: Logger = getLogger("BattleActor");
	rank: HeroRank = "common";

	moving: boolean = false;
	path?: Position[]

	selected: boolean = false;
	strength: number = 10;
	agility: number = 10;

	tick(deltaTime: number, _roads: MapLayer, _randMap: number[]): boolean {
		return this.move(deltaTime);
	}

	setPath(path: Position[]) {
		if (this.goal) {
			return;
		}
		this.path = path;
		this.path.reverse();
		this.path.pop();
		this.goal = this.path.pop();
		this.direction.x = this.goal!.x - this.positionSquare.x;
		this.direction.y = this.goal!.y - this.positionSquare.y; 
		this.logger.debug("Ultimate goal:", this.path[0]);
	}

	nextGoal(): boolean {
		this.goal = this.path?.pop();
		this.logger.debug("new goal", this.goal);
		if (!this.goal) {
			this.logger.debug("Reached position", this.position);
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

export type HeroType = "normal" | "fire" | "water" |
	"earth" | "air" | "shadow" | "light";

// TODO
export interface HeroPrototype {
	name: string;
	sprite: ActorSprite;
	movement?: number;
	type?: HeroType;
	baseHp: number;
	skills?: string[];
	rank?: HeroRank;
}
