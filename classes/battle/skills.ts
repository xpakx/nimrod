import { BattleActor, HeroStats, HeroType } from "./actor.js";
import { DefaultHandler, EffectHook, EventContext, HookHandlerMap, TurnEvent } from "./effect-system.js";
import { Applychecker, Skill, SkillEffectBuff, SkillEffectDamage, SkillEffectHeal, SkillEffectPassive, SkillEffectToken, SpecialEffect } from "./skill/skill.js";

export class Skills {
	constructor() {
		throw new Error('Skills is a static class and cannot be instantiated');
	}

	static createPassive<T extends EffectHook>(
		hook: T,
		handler: HookHandlerMap[T],
		shouldApply?: Applychecker
	): SkillEffectPassive<T> {
		return { type: "passive", hook, handler, shouldApply };
	}

	static onSkillPassive(
		handler: HookHandlerMap["onSkill"],
		shouldApply?: Applychecker
	): SkillEffectPassive<"onSkill"> {
		return { type: "passive", hook: "onSkill", handler, shouldApply };
	}

	static onKillPassive(
		handler: HookHandlerMap["onKill"],
		shouldApply?: Applychecker
	): SkillEffectPassive<"onKill"> {
		return { type: "passive", hook: "onKill", handler, shouldApply };
	}

	static onMovePassive(
		handler: HookHandlerMap["onMove"],
		shouldApply?: Applychecker
	): SkillEffectPassive<"onMove"> {
		return { type: "passive", hook: "onMove", handler, shouldApply };
	}

	static postSkillPassive(
		handler: HookHandlerMap["postSkill"],
		shouldApply?: Applychecker
	): SkillEffectPassive<"postSkill"> {
		return { type: "passive", hook: "postSkill", handler, shouldApply };
	}

	static onStatusAppliedPassive(
		handler: HookHandlerMap["onStatusApplied"],
		shouldApply?: Applychecker
	): SkillEffectPassive<"onStatusApplied"> {
		return { type: "passive", hook: "onStatusApplied", handler, shouldApply };
	}

	static preDamagePassive(
		handler: HookHandlerMap["preDamage"],
		shouldApply?: Applychecker
	): SkillEffectPassive<"preDamage"> {
		return { type: "passive", hook: "preDamage", handler, shouldApply };
	}

	static onDamagePassive(
		handler: HookHandlerMap["onDamage"],
		shouldApply?: Applychecker
	): SkillEffectPassive<"onDamage"> {
		return { type: "passive", hook: "onDamage", handler, shouldApply };
	}

	static onTurnStartPassive(
		handler: HookHandlerMap["onTurnStart"],
		shouldApply?: Applychecker
	): SkillEffectPassive<"onTurnStart"> {
		return { type: "passive", hook: "onTurnStart", handler, shouldApply };
	}

	static onTurnEndPassive(
		handler: HookHandlerMap["onTurnEnd"],
		shouldApply?: Applychecker
	): SkillEffectPassive<"onTurnEnd"> {
		return { type: "passive", hook: "onTurnEnd", handler, shouldApply };
	}

	static createDamageFunc(
		stat: "strength" | "agility" | "intelligence",
		multiplier: number,
		growth: number,
		type: HeroType = "normal",
		distance?: number,
		specialEffects?: SpecialEffect[]
	): SkillEffectDamage {
		return {
			type: "damage",
			damage: (hero, _target, skill) => {
				const level = skill ? skill.level : 1;
				return hero.getStat(stat) * multiplier + growth*level;
			},
			damageType: type,
			distance: distance,
			target: "hero",
			specialEffects: specialEffects,
		}
	}

	static createAoEDamageFunc(
		stat: "strength" | "agility" | "intelligence",
		multiplier: number,
		growth: number,
		radius: number,
		type: HeroType = "normal",
		distance?: number,
		specialEffects?: SpecialEffect[]
	): SkillEffectDamage {
		return {
			type: "damage",
			damage: (hero, _target, skill) => {
				const level = skill ? skill.level : 1;
				return hero.getStat(stat) * multiplier + growth*level;
			},
			damageType: type,
			distance: distance,
			target: "hero",
			effectRadius: radius,
			specialEffects: specialEffects,
		}
	}


	static createSpecialEffect<T extends EffectHook>(
		hook: T,
		handler: HookHandlerMap[T],
		descriptors: string[]
	): SpecialEffect<T> {
		return { hook, handler, descriptors};
	}

	static createBuff(stat: keyof HeroStats, value: number, duration: number): SkillEffectBuff {
		return {
			type: "buff",
			buffType: "buff",
			stat: stat,
			duration: duration,
			value: value,
		}
	}

	static createDebuff(stat: keyof HeroStats, value: number, duration: number): SkillEffectBuff {
		return {
			type: "buff",
			buffType: "debuff",
			stat: stat,
			duration: duration,
			value: value,
		}
	}

	static createControlEffect(type: "sleep" | "stun", duration: number): SkillEffectToken {
		return {
			type: "token",
			tokenName: type,
			duration: duration,
		}
	}

	static createStaticDamage(
		damage: number,
		type: HeroType = "normal"
	): SkillEffectDamage {
		return {
			type: "damage",
			damage: damage,
			damageType: type,
			target: "hero",
		}
	}

	static createHealing(value: number, tags?: string[]): SkillEffectHeal {
		return {
			type: "heal",
			value: value,
			tags: tags ?? [],
		}
	}

	static createDamageStatusHandler(tokenName: string, 
					 damageType: HeroType,
					 effectFn: (damageType: HeroType, tokenValue: number) => SkillEffectDamage,
			    timing: "onTurnStart" | "onTurnEnd") {
		return Skills.createPassive(
			timing,
			(_passiveOwner, event, context) => {
				for (let hero of context.actors) {
					if (!hero.hasToken(tokenName)) continue;
					const tokenValue = hero.totalTokenValue(tokenName);
					const damageEvent = effectFn(damageType, tokenValue);
					event.additionalDamage.push({
						sourceSkill: undefined as any as Skill, // TODO
						source: hero,
						target: hero,
						effect: damageEvent,
						targetType: "hero",
					});
				}
			},
		);
	}

	static createStatusHandler(tokenName: string, 
			    effectFn: (hero: BattleActor, tokenValue: number, context: EventContext, event: TurnEvent) => void,
			    timing: "onTurnStart" | "onTurnEnd") {
		return Skills.createPassive(
			timing,
			(_passiveOwner, event, context) => {
				for (let hero of context.actors) {
					if (!hero.hasToken(tokenName)) continue;
					const tokenValue = hero.totalTokenValue(tokenName);
					effectFn(hero, tokenValue, context, event);
				}
			},
		);
	}

	static createDefaultHandler<T extends EffectHook>(
		hook: T,
		handler: HookHandlerMap[T]
	): DefaultHandler<T> {
		return { hook, handler };
	}

	static createStatusDefaultHandler(tokenName: string, 
			    effectFn: (hero: BattleActor, tokenValue: number, context: EventContext, event: TurnEvent) => void,
			    timing: "onTurnStart" | "onTurnEnd"): DefaultHandler<"onTurnEnd" | "onTurnStart"> {
		return Skills.createDefaultHandler(
			timing,
			(_passiveOwner, event, context) => {
				for (let hero of context.actors) {
					if (!hero.hasToken(tokenName)) continue;
					const tokenValue = hero.totalTokenValue(tokenName);
					effectFn(hero, tokenValue, context, event);
				}
			},
		);
	}

	static createDamageDefaultHandler(tokenName: string, 
					 damageType: HeroType,
					 effectFn: (damageType: HeroType, tokenValue: number) => SkillEffectDamage,
					 timing: "onTurnStart" | "onTurnEnd"): DefaultHandler<"onTurnEnd" | "onTurnStart"> {
		return Skills.createDefaultHandler(
			timing,
			(_passiveOwner, event, context) => {
				for (let hero of context.actors) {
					if (!hero.hasToken(tokenName)) continue;
					const tokenValue = hero.totalTokenValue(tokenName);
					const damageEvent = effectFn(damageType, tokenValue);
					event.additionalDamage.push({
						sourceSkill: undefined as any as Skill, // TODO
						source: hero,
						target: hero,
						effect: damageEvent,
						targetType: "hero",
					});
				}
			},
		);
	}
}
