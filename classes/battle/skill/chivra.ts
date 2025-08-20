import { Heroes } from "../actors.js";
import { HeroConfig, SkillConfig } from "../hero-library.js";
import { Skills } from "../skills.js";

export let chivraPassive001 = Skills.onKillPassive(
	(passiveOwner, event, _context) => {
		if (event.source !== passiveOwner) return;
		event.source.skills.forEach((skill) => {
			if (skill.cooldownTimer > 0) skill.cooldownTimer -= 1;
		});
	},
);

export let chivraPassive002 = Skills.preDamagePassive(
	(passiveOwner, event, _context) => {
		if (event.source !== passiveOwner) return;
		const controlTokens = Heroes.countControlTokens(event.target);
		const modifier = Math.min(10, controlTokens)*0.5;
		event.damageBonusPercent += modifier;
	},
);

export let chivraDamage001 = Skills.createDamageFunc(
	"agility",
	0.4,
	4,
	"electric",
	5,
	[
		Skills.createSpecialEffect(
			"onDamage",
			(passiveOwner, event, context) => {
				if (event.source !== passiveOwner) return;
				if (!context.rng.chance(0.4)) return;
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

export let chivraDamage002 = Skills.createAoEDamageFunc(
	"agility",
	0.4,
	4,
	4,
	"electric",
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

export let chivraDamage003 = Skills.createDamageFunc(
	"agility",
	0.7,
	10,
	"electric",
	5,
	[
		Skills.createSpecialEffect(
			"onDamage",
			(passiveOwner, event, context) => {
				if (event.source !== passiveOwner) return;
				if (!context.rng.chance(0.75)) return;
				event.tokens.push({
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
					if (a === event.target) return;
					const damageEvent = Skills.createStaticDamage(damage, "electric")
					event.additionalDamage.push({
						source: event.source,
						target: a,
						effect: damageEvent,
						sourceSkill: event.sourceSkill,
						targetType: "hero",
					});
				});
			},
			["damage", "splash"]
		)
	]
);

export const chivraPassive: SkillConfig = {
	name: "chivraPassive",
	visibleName: "Busy Spark",
	effect: [chivraPassive001, chivraPassive002],
	icon: "kingdom",
	cooldown: 0,
}

export const chivraSkill001: SkillConfig = {
	name: "chivraSkill001",
	visibleName: "Tingling Current",
	effect: [chivraDamage001],
	icon: "kingdom",
	cooldown: 3,
	targetType: "actor",
	targetSubType: "enemy",
}

export const chivraSkill002: SkillConfig = {
	name: "chivraSkill002",
	visibleName: "Charge Transmission",
	effect: [chivraDamage002],
	icon: "kingdom",
	cooldown: 3,
	targetType: "actor",
	targetSubType: "enemy",
}

export const chivraSkill003: SkillConfig = {
	name: "chivraSkill003",
	visibleName: "Rainbow Thunder",
	effect: [chivraDamage003],
	icon: "kingdom",
	cooldown: 5,
	targetType: "actor",
	targetSubType: "enemy",
}

export const chivra: HeroConfig = {
	name: "chivra",
	sprite: "warrior",
	baseHp: 65,
	skills: ["chivraPassive", "chivraSkill001",  "chivraSkill002",  "chivraSkill003"],
}
