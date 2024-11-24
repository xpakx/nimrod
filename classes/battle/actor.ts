import { Actor } from "../actor.js";
import { Road } from "../buildings.js";

export class BattleActor extends Actor {
	enemy: boolean = false;
	name: string = "???";
	movement: number = 5;
	type: HeroType = "normal";
	hp: number = 0;
	skills: Skill[] = []

	tick(_deltaTime: number, _roads: (Road | undefined)[][], _randMap: number[]): boolean {
		return false;
	}
}

export class Skill {
}

export type HeroType = "normal" | "fire" | "water" |
	"earth" | "air" | "shadow" | "light";
