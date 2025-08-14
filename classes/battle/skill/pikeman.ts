import { Skill, SkillEffectDamage } from "./skill.js";
import { Heroes } from "../actors.js";
import { Skills } from "../skills.js";
import { BattleActor, HeroType } from "../actor.js";
import { EventContext, TurnEvent } from "../effect-system.js";

export let pikemanPassive = Skills.createPassive(
	"onSkill",
	(passiveOwner, event, _context) => {
		if (!Heroes.isSameAllyType(passiveOwner, event.source)) return;
		const isNeighbour = Heroes.areAdjacent(passiveOwner, event.source);
		if (isNeighbour) event.criticalHit = true;
	},
	(passiveOwner, actor, _actors, _map) => {
		if (!Heroes.isSameAllyType(passiveOwner, actor)) return false;
		return Heroes.areAdjacent(passiveOwner, actor);
	},
);

export let pikemanSkill001: SkillEffectDamage = Skills.createDamageFunc("strength", 0.3, 3);


export let archerPassive = Skills.createPassive(
	"onSkill",
	(passiveOwner, event, _context) => {
		if (event.source !== passiveOwner) return;
		if (event.source.distanceTravelledThisTurn == 0) event.criticalHit = true;
	},
	(passiveOwner, actor, _actors, _map) => {
		if (actor !== passiveOwner) return false;
		return actor.distanceTravelledThisTurn == 0;
	},
);

const poisonPassiveEffect = (tokenName: HeroType, tokenValue: number) => {
	return Skills.createStaticDamage(tokenValue * 10, tokenName);
};
export let poisonPassive = Skills.createDamageStatusHandler("poisoned", "poison", poisonPassiveEffect, "onTurnStart");

const sleepPassiveEffect = (hero: BattleActor, tokenValue: number, _context: EventContext, _event: TurnEvent) => {
	if (tokenValue > 0) hero.finishedTurn = true;
	const rand = Math.random();
	if (rand > 0.2) return;
	hero.resetTokens("sleep");
};

export let sleepPassive = Skills.createStatusHandler("sleep", sleepPassiveEffect, "onTurnStart");


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
export let burnPassive = Skills.createDamageStatusHandler("burning", "fire", burnPassiveEffect, "onTurnStart");

export let bleedPassive = Skills.createPassive(
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
				sourceSkill: undefined as any as Skill, // TODO
				targetType: "hero",
			});
		}
	},
);
