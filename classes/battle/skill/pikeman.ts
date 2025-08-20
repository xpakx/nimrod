import { SkillEffectDamage } from "./skill.js";
import { Heroes } from "../actors.js";
import { Skills } from "../skills.js";

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

export let archerSkill001: SkillEffectDamage = {
	type: "damage",
	damageType: "normal",
	target: "hero",
	distance: 6,
	damage:  (hero, target, skill) => {
		const level = skill ? skill.level : 1;
		const dist = Heroes.getTaxicabDistanceFor(hero, target);
		const mult = dist == 1 ? 0.1 : 0.2;
		const growth = dist == 1 ? 1 : 2;
		return hero.getStat("agility") * mult + growth*level;
	},
}


export let warriorPassive = Skills.createPassive(
	"onSkill",
	(passiveOwner, event, _context) => {
		if (event.source !== passiveOwner) return;
		if (passiveOwner.hasAnyBuff()) {
			event.criticalHit = true;
		}
	},
	(passiveOwner, actor, _actors, _map) => {
		if (actor !== passiveOwner) return false;
		return actor.hasAnyBuff();
	},
);

export let warriorSkill001: SkillEffectDamage = Skills.createDamageFunc("strength", 0.5, 3);

