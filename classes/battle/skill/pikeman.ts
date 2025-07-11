import { SkillEffectDamage, SkillEffectPassive } from "./skill.js";

export let pikemanPassive: SkillEffectPassive = {
    type: "passive",
    handler: (passiveOwner, event, _actors, map) => {
	    if (passiveOwner.enemy != event.source.enemy) return;
	    if (passiveOwner.name != event.source.name) return;
	    if (passiveOwner === event.source) return;
	    const dist = map.getTaxicabDistance(passiveOwner.positionSquare, event.source.positionSquare);
	    if (dist == 1) event.criticalHit = true;
    },
    shouldApply: (passiveOwner, actor, _actors, map) => {
	    if (passiveOwner.enemy != actor.enemy) return false;
	    if (passiveOwner.name != actor.name) return false;
	    if (passiveOwner === actor) return false;
	    const dist = map.getTaxicabDistance(passiveOwner.positionSquare, actor.positionSquare);
	    return dist == 1;
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
