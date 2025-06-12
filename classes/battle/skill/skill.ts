import { BattleActor, HeroType } from "../actor.js";
import { EffectHandler } from "../effect-system";

export interface Skill {
	name: string;
	effect: SkillEffect[];
}

export type SkillEffect = SkillEffectDamage | SkillEffectPassive;

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

export interface SkillEffectPassive {
	type: "passive";
	chance?: number; // undefined -> 100%
	handler: EffectHandler;
}
