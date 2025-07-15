import { SkillEffectDamage, SkillEffectPassive } from "./skill.js";
import { Heroes } from "../actors.js";

export let pikemanPassive: SkillEffectPassive = {
    type: "passive",
    handler: (passiveOwner, event, _actors, _map) => {
	    if (event.type != "onSkill") return;
	    if (!Heroes.isSameAllyType(passiveOwner, event.source)) return;
	    const isNeighbour = Heroes.areAdjacent(passiveOwner, event.source);
	    if (isNeighbour) event.criticalHit = true;
    },
    shouldApply: (passiveOwner, actor, _actors, _map) => {
	    if (!Heroes.isSameAllyType(passiveOwner, actor)) return false;
	    return Heroes.areAdjacent(passiveOwner, actor);
    },

}

export let pikemanSkill001: SkillEffectDamage = {
    type: "damage",
    damage: (hero, _target, skill) => {
	    return hero.strength * 0.3 + 3*skill.level;
    },
    damageType: "normal",
    target: "hero",
}
