import { BattleActor } from "../actor.js";
import { SkillEffectDamage, SkillEffectPassive } from "./skill.js";

export let pikemanPassive: SkillEffectPassive = {
    type: "passive",
    handler: (passiveOwner, event, _actors, map) => {
	    if (!isSameAllyType(passiveOwner, event.source)) return;
	    const dist = map.getTaxicabDistance(passiveOwner.positionSquare, event.source.positionSquare);
	    if (dist == 1) event.criticalHit = true;
    },
    shouldApply: (passiveOwner, actor, _actors, map) => {
	    if (!isSameAllyType(passiveOwner, actor)) return false;
	    const dist = map.getTaxicabDistance(passiveOwner.positionSquare, actor.positionSquare);
	    return dist == 1;
    },

}

function isSameAllyType(a: BattleActor, b: BattleActor) {
    return a.enemy == b.enemy && a.name == b.name && a !== b;
}

export let pikemanSkill001: SkillEffectDamage = {
    type: "damage",
    damage: (hero, _target, skill) => {
	    return hero.strength * 0.3 + 3*skill.level;
    },
    damageType: "normal",
    target: "hero",
}
