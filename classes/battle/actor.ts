import { Actor } from "../actor.js";

export class BattleActor extends Actor {
	enemy: boolean = false;
	name: string = "???";
	movement: number = 5;
	type: HeroType = "normal";
	hp: number = 0;
	skills: Skill[] = []
}

export class Skill {
}

export type HeroType = "normal" | "fire" | "water" |
	"earth" | "air" | "shadow" | "light";
