import { HeroType } from "../actor.js";
import { EffectHandler } from "../effect-system.js";
import { DamageFunction, SkillEffectDamage, SkillEffectPassive } from "./skill.js";


export class PikemanPassive implements SkillEffectPassive {
    type: "passive" = "passive";
    handler: EffectHandler = (event, actors, _map) => {
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
	    
    };
}

export class PikemanSkill1 implements SkillEffectDamage {
    type: "damage" = "damage";
    damage: DamageFunction = (hero, _target) => {
	    return hero.strength * 0.3 + 3*hero.skills[0].level;
    };
    damageType: HeroType = "normal";
    target: "square" | "hero" = "hero";
}
