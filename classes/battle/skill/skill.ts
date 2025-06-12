import { BattleActor, HeroType } from "../actor.js";

export interface Skill {
	name: string;
	effect: SkillEffect[];
}

export type SkillEffect = SkillEffectDamage;

export type DamageFunction = (hero: BattleActor, target: BattleActor) => number; 

interface SkillEffectDamage {
	type: "damage";
	chance?: number; // undefined -> 100%
	damage: number | DamageFunction;
	damageType: HeroType;
	target: "square" | "hero";
	effectRadius?: number;
	effectLine?: number;
	effectCone?: number;
}
