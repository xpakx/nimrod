import { Skill, SkillEffectDamage } from "./skill.js";
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

export let heroPassive002 = Skills.onDamagePassive(
	(passiveOwner, event, _context) => {
		if (event.source !== passiveOwner) return;
		const controlTokens = Heroes.countControlTokens(event.target);
		const modifier = Math.min(10, controlTokens)*0.5;
		const bonusDamage = Math.floor(modifier*event.calculatedDamage);
		event.calculatedDamage += bonusDamage;
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
				event.buffs.push({
					effect: Skills.createDebuff("speed", 2, 2), 
					source: event.source, 
					target: event.target,
					sourceSkill: event.sourceSkill,
				});
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
				event.controlEffects.push({
					effect: Skills.createControlEffect("stun", 2),
					source: event.source, 
					target: event.target,
					sourceSkill: event.sourceSkill,
				});
			},
			["control", "stun"]
		),

		Skills.createSpecialEffect(
			"onDamage",
			(passiveOwner, event, context) => {
				if (event.source !== passiveOwner) return;
				let splashFactor = event.target.dead ? 0.7 : 0.3;
				const damage = Math.ceil(splashFactor*event.calculatedDamage);
				const additionalTargets = Heroes.getAlliesInRange(event.target, context.actors, 5);
				additionalTargets.forEach((a) => {
					const damageEvent = Skills.createStaticDamage(damage, "fire")
					event.additionalDamage.push({
						source: event.source,
						target: a,
						effect: damageEvent,
						sourceSkill: event.sourceSkill,
						targetType: "hero",
					});
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
				const lostHp = event.source.getStat("hp") - event.source.currentHp;
				const toHeal = Math.floor(lostHp * 0.50);
				event.healing.push({
					source: event.source,
					target: event.source,
					sourceSkill: event.sourceSkill,
					effect: Skills.createHealing(toHeal, ["self"]),
				});
			},
			["heal", "self-heal"]
		)
	]
);


export let poisonPassiveBase = Skills.createPassive(
	"onTurnStart",
	(_passiveOwner, event, context) => {
		const poisonedTokenName = "poisoned";
		for (let hero of context.actors) {
			if (!hero.hasToken(poisonedTokenName)) continue;
			const poisonValue = hero.totalTokenValue(poisonedTokenName);
			const damageEvent = Skills.createStaticDamage(poisonValue*10, "poison")
			event.additionalDamage.push({
				sourceSkill: undefined as any as Skill, // TODO
				source: hero,
				target: hero,
				effect: damageEvent,
				targetType: "hero",
			});
		}
	},
);
