import { Skills } from "../skills.js";
import { BattleActor, HeroType } from "../actor.js";
import { EventContext, TurnEvent } from "../effect-system.js";

const poisonPassiveEffect = (tokenName: HeroType, tokenValue: number) => {
	return Skills.createStaticDamage(tokenValue * 10, tokenName);
};
export let poisonPassive = Skills.createDamageDefaultHandler("poisoned", "poison", poisonPassiveEffect, "onTurnStart");

const sleepPassiveEffect = (hero: BattleActor, tokenValue: number, context: EventContext, _event: TurnEvent) => {
	if (tokenValue > 0) hero.finishedTurn = true;
	const rand = context.rng.nextFloat();
	if (rand > 0.2) return;
	hero.resetTokens("sleep");
};


export let sleepPassive = Skills.createStatusDefaultHandler("sleep", sleepPassiveEffect, "onTurnStart");

export let sleepDmgPassive = Skills.createPassive(
	"onDamage",
	(_passiveOwner, event, _context) => {
		const target = event.target;
		if (!target.hasToken("sleep")) return;
		if (event.calculatedDamageType == "shadow") return;
		target.resetTokens("sleep");
	},
);

const burnPassiveEffect = (tokenName: HeroType, tokenValue: number) => {
    return Skills.createStaticDamage(tokenValue * 8, tokenName);
};
export let burnPassive = Skills.createDamageDefaultHandler("burning", "fire", burnPassiveEffect, "onTurnStart");

export let bleedPassive = Skills.createDefaultHandler(
	"onTurnEnd",
	(_passiveOwner, event, context) => {
		for (let hero of context.actors) {
			const bleedTokens = hero.totalTokens("bleeding");
			if (bleedTokens == 0) continue;
			let dmg = Math.floor(bleedTokens * 8 * 0.1 * hero.currentHp);
			if (hero.moved) dmg = Math.floor(dmg * 1.5);
			const dmgEffect = Skills.createStaticDamage(dmg, "normal");

			event.additionalDamage.push({
				source: hero,
				target: hero,
				effect: dmgEffect,
				sourceSkill: undefined,
				targetType: "hero",
			});
		}
	},
);
