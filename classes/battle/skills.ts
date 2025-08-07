import { HeroType } from "./actor.js";
import { EffectHook, HookHandlerMap } from "./effect-system.js";
import { Applychecker, SkillEffectDamage, SkillEffectPassive, SpecialEffect } from "./skill/skill.js";

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
		specialEffects?: SpecialEffect[]
	): SkillEffectDamage {
		return {
			type: "damage",
			damage: (hero, _target, skill) => {
				return hero.stats[stat] * multiplier + growth*skill.level;
			},
			damageType: type,
			target: "hero",
			specialEffects: specialEffects,
		}
	}
}
