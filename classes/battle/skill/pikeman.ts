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

export let pikemanSkill001: SkillEffectDamage = {
	type: "damage",
	damage: (hero, _target, skill) => {
		return hero.strength * 0.3 + 3*skill.level;
	},
	damageType: "normal",
	target: "hero",
}
