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


export let heroPassive001 = Skills.onKillPassive(
	(passiveOwner, event, _context) => {
		if (event.source !== passiveOwner) return;
		event.source.skills.forEach((skill) => {
			if (skill.cooldownTimer > 0) skill.cooldownTimer -= 1;
		});
	},
);

export let heroDamage001 = Skills.createDamageFunc(
	"agility",
	0.4,
	4,
	"fire",
	5,
	[
		Skills.createSpecialEffect(
			"onDamage",
			(passiveOwner, event, _context) => {
				if (event.source !== passiveOwner) return;
				const rand = Math.random();
				if (rand > 0.4) return;

				// TODO: move this to event.effects, and make debuff last two turns
				event.target.stats.speed -= 2; 
			},
			["debuff", "slowness"]
		)
	]
);

export let heroDamage002 = Skills.createDamageFunc(
	"agility",
	0.7,
	10,
	"fire",
	5,
	[
		Skills.createSpecialEffect(
			"onDamage",
			(passiveOwner, event, _context) => {
				if (event.source !== passiveOwner) return;
				const rand = Math.random();
				if (rand > 0.75) return;
				// TODO: move this to event.effects, and make it stun target for 2 turns
				event.target.finishedTurn = true; 
			},
			["control", "stun"]
		),

		Skills.createSpecialEffect(
			"onDamage",
			(passiveOwner, event, context) => {
				if (event.source !== passiveOwner) return;
				let damage = event.calculatedDamage;
				if (!event.target.dead) {
					damage = 0.3*damage;
				}
				const additionalTargets = Heroes.getAlliesInRange(event.target, context.actors, 5);
				// TODO: register as effects
				additionalTargets.forEach((a) => {
					a.currentHp -= damage;
					if (a.currentHp <= 0) a.dead = true;
				});
			},
			["damage", "splash", "control", "stun"]
		)
	]
);

export let heroDamage003 = Skills.createAoEDamageFunc(
	"agility",
	0.4,
	4,
	4,
	"fire",
	5,
	[
		Skills.createSpecialEffect(
			"onDamage",
			(passiveOwner, event, _context) => {
				if (event.source !== passiveOwner) return;
				const lostHp = event.source.stats.hp - event.source.currentHp;
				const toHeal = Math.floor(lostHp * 0.50);
				// TODO: register as effect
				event.source.currentHp += toHeal;
			},
			["heal"]
		)
	]
);
