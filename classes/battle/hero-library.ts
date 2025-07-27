import { ActorSprite } from "../actor";
import { SpriteLibrary } from "../sprite-library.js";
import { BattleActor, HeroStats, HeroType } from "./actor.js";
import { SkillEffect } from "./skill/skill";

export interface SkillConfig {
	name: string;
	visibleName: string;
	effect: SkillEffect[];
	icon?: string;
	cooldown: number;
	maxDistance?: number;
	targetType?: "actor" | "square";
	passive?: boolean;
}

export interface SkillDefinition {
	name: string;
	visibleName: string;
	effect: SkillEffect[];
	icon: HTMLImageElement;
	cooldown: number;
	maxDistance: number;
	targetType: "actor" | "square";
	passive: boolean;
}

/**
 * Represents the configuration for a hero character.
 * This interface defines properties for hero characters including their visual representation,
 * base stats, and identification.
 * 
 * @property {string} name - The unique identifier for the hero type.
 * @property {string} sprite - The filename of the hero's sprite image (without extension).
 * @property {number} baseHp - The initial hit points for the hero before any modifiers.
 */
export interface HeroConfig {
	name: string;
	sprite: string;
	baseHp: number;
	skills?: (SkillConfig | string)[];

	hp?: HeroStat;
	strength?: HeroStat;
	agility?: HeroStat;
	intelligence?: HeroStat;
	defence?: HeroStat;
	resistance?: HeroStat;
	luck?: HeroStat;
	speed?: HeroStat;
	vampirism?: HeroStat;
	movement?: number;
}

export class HeroLibrary {
	heroes: Map<string, HeroDefinition> = new Map();
	skills: Map<string, SkillDefinition> = new Map();

	defaultBaseStat: number = 10;
	defaultGrowthStat: number = 0;

	registerSkill(config: SkillConfig, sprites: SpriteLibrary) {
		const skill = this.createSkillDefinition(config, sprites);
		this.skills.set(config.name, skill);
	}

	registerSkills(config: SkillConfig[], sprites: SpriteLibrary) {
		for (const skill of config) this.registerSkill(skill, sprites);
	}

	private createSkillDefinition(config: SkillConfig, sprites: SpriteLibrary): SkillDefinition {
		return {
			name: config.name,
			visibleName: config.visibleName,
			icon: sprites.icons[config.icon || config.name],
			effect: config.effect,
			cooldown: config.cooldown,
			maxDistance: config.maxDistance || 1,
			targetType: config.targetType || "square",
			passive: config.passive || false,
		};
	}

	private createSkillDefinitonsForHero(config: HeroConfig, sprites: SpriteLibrary): SkillDefinition[] {
		if (!config.skills) return [];
		const skills: SkillDefinition[] = []
		for (let skill of config.skills) {
			if (typeof skill == "string") {
				const skillDef = this.skills.get(skill);
				if (skillDef) skills.push(skillDef);
			} else {
				const skillDef = this.createSkillDefinition(skill, sprites);
				skills.push(skillDef);
			}
		}
		return skills;
	}

	getStatFromConfig(config: HeroConfig, stat: keyof HeroStats): HeroStat {
		if (config[stat]) return config[stat];
		return {
			base: this.defaultBaseStat,
			growth: this.defaultGrowthStat,
		}
	}

	registerHero(config: HeroConfig, sprites: SpriteLibrary) {
		const hero: HeroDefinition = {
			name: config.name,
			visibleName: config.name,
			hp: { base: config.baseHp, growth: 0 },
			sprite: sprites.actors[config.sprite || config.name],
			movement: config.movement || 5,
			type: "normal",
			strength: this.getStatFromConfig(config, "strength"),
			agility: this.getStatFromConfig(config, "agility"),
			intelligence: this.getStatFromConfig(config, "intelligence"),
			defence: this.getStatFromConfig(config, "defence"),
			resistance: this.getStatFromConfig(config, "resistance"),
			luck: this.getStatFromConfig(config, "luck"),
			speed: this.getStatFromConfig(config, "speed"),
			vampirism: this.getStatFromConfig(config, "vampirism"),
			skills: this.createSkillDefinitonsForHero(config, sprites),
		};

		this.heroes.set(config.name, hero);
	}

	registerHeroes(config: HeroConfig[], sprites: SpriteLibrary) {
		for (const hero of config) this.registerHero(hero, sprites);
	}

	getHero(name: string): BattleActor | undefined {
		const hero = this.heroes.get(name);
		if (!hero) return;
		return this.createHero(hero);
	}

	createHero(hero: HeroDefinition): BattleActor {
		const actor = new BattleActor(hero.sprite, {x: 0, y: 0});
		actor.applyHeroDefinition(hero);
		return actor;
	}
}

export interface HeroDefinition {
	name: string;
	visibleName: string;
	visibleTitle?: string;

	sprite: ActorSprite;
	movement: number;
	type: HeroType;

	hp: HeroStat;
	strength: HeroStat;
	agility: HeroStat;
	intelligence: HeroStat;
	defence: HeroStat;
	resistance: HeroStat;
	luck: HeroStat;
	speed: HeroStat;
	vampirism: HeroStat;
	
	typeAttackBonus?: HeroStat;
	typeResistanceBonus?: HeroStat;
	skills: SkillDefinition[];
}

export interface HeroStat {
	base: number;
	growth: number;
}
