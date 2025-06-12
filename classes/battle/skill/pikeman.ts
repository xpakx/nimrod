import { EffectHandler } from "../effect-system.js";
import { SkillEffectPassive } from "./skill.js";


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
