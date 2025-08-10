import { MapLayer } from "../../map-layer.js";
import { BattleActor, HeroStats, HeroType } from "../actor.js";
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
	targetSubtype?: "ally" | "enemy";
	passive: boolean;
}

export type SkillEffect = SkillEffectDamage | SkillEffectPassive | SkillEffectBuff |
	SkillEffectToken | SkillEffectHeal;

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
	specialEffects?: SpecialEffect[];
}

export type Applychecker = (passiveOwner: BattleActor, actor: BattleActor, actors: BattleActor[],
			     map: MapLayer) => boolean;

export interface SkillEffectPassive<T extends EffectHook = EffectHook> {
	type: "passive";
	chance?: number; // undefined -> 100%
	hook: T;
	handler: HookHandlerMap[T],
	shouldApply?: Applychecker;
	specialEffects?: SpecialEffect[];
}

export interface SpecialEffect<T extends EffectHook = EffectHook> {
	chance?: number; // undefined -> 100%
	hook: T;
	handler: HookHandlerMap[T],
	descriptors: string[];
}

export type BuffFunction = (hero: BattleActor, actors: BattleActor[], map: MapLayer) => number; 

export interface SkillEffectBuff {
	type: "buff";
	buffType: "buff" | "debuff";
	stat: keyof HeroStats;
	duration: number,
	value?: number;
	percentage?: number;
	chance?: number; // undefined -> 100%
	onExpire?: BuffFunction;
	onCreation?: BuffFunction;
	onTick?: BuffFunction;
	specialEffects?: SpecialEffect[];
}

export type TokenFunction = (hero: BattleActor, token: string, actors: BattleActor[], map: MapLayer) => number; 

export interface SkillEffectToken {
	type: "token";
	tokenName: string;
	duration: number;
	value?: number;
	chance?: number; // undefined -> 100%
	onExpire?: TokenFunction;
	onCreation?: TokenFunction;
	onTick?: TokenFunction;
	specialEffects?: SpecialEffect[];
}

export type HealFunction = (hero: BattleActor, actors: BattleActor[], map: MapLayer) => number; 

export interface SkillEffectHeal {
	type: "heal";
	tags: string[];
	value?: number;
	percentage?: number;
	chance?: number; // undefined -> 100%
	specialEffects?: SpecialEffect[];
}
