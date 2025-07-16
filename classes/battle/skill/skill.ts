import { MapLayer } from "../../map-layer.js";
import { BattleActor, HeroType } from "../actor.js";
import { EffectHook, HookHandlerMap } from "../effect-system";

export interface Skill {
	name: string;
	effect: SkillEffect[];
	level: number;
	icon: HTMLImageElement;
	cooldown: number;
	cooldownTimer: number;
	maxDistance: number;
	targetType: "actor" | "square";
	passive: boolean;
}

export type SkillEffect = SkillEffectDamage | SkillEffectPassive<EffectHook>;

export type DamageFunction = (hero: BattleActor, target: BattleActor, skill: Skill) => number; 

export interface SkillEffectDamage {
	type: "damage";
	chance?: number; // undefined -> 100%
	damage: number | DamageFunction;
	damageType: HeroType;
	target: "square" | "hero";
	distance?: number; // undefined -> 1
	effectRadius?: number;
	effectLine?: number;
	effectCone?: number;
}

export type Applychecker = (passiveOwner: BattleActor, actor: BattleActor, actors: BattleActor[],
			     map: MapLayer) => boolean;

export interface SkillEffectPassive<T extends EffectHook> {
	type: "passive";
	chance?: number; // undefined -> 100%
	hook: T;
	handler: HookHandlerMap[T],
	shouldApply?: Applychecker;
}
