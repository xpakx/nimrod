import { SkillEffectDamage, SkillEffectPassive } from "./skill.js";

export let pikemanPassive: SkillEffectPassive = {
    type: "passive",
    handler: (event, actors, _map) => {
	    for (let actor of actors) {
		    if (actor.enemy != event.source.enemy) return;
		    if (actor.name != event.source.name) return;
		    if (actor === event.source) return;
		    const dX = Math.abs(actor.position.x - event.source.position.x);
		    const dY = Math.abs(actor.position.y - event.source.position.y);
		    if (dX <= 1 && dY <= 1) {
			    event.criticalHit = true;
			    return;
		    }
	    }
	    
    }
}

export let pikemanSkill001: SkillEffectDamage = {
    type: "damage",
    damage: (hero, _target) => {
	    return hero.strength * 0.3 + 3*hero.skills[0].level;
    },
    damageType: "normal",
    target: "hero",
}
