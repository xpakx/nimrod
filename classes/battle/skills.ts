import { EffectHook, HookHandlerMap } from "./effect-system";
import { Applychecker, SkillEffectPassive } from "./skill/skill";

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
}

