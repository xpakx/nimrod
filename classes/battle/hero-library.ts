import { ActorSprite } from "../actor";
import { SpriteLibrary } from "../sprite-library.js";
import { HeroType } from "./actor.js";
import { SkillEffect } from "./skill/skill";

export interface SkillConfig {
	name: string;
	visibleName: string;
	effect: SkillEffect[];
	icon?: string;
	cooldown: number;
}

export interface SkillDefinition {
	name: string;
	visibleName: string;
	effect: SkillEffect[];
	icon: HTMLImageElement;
	cooldown: number;
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
}

export class HeroLibrary {
	heroes: Map<string, HeroDefinition> = new Map();
	skills: Map<string, SkillDefinition> = new Map();

	registerSkill(config: SkillConfig, sprites: SpriteLibrary) {
		const skill = this.createSkillDefinition(config, sprites);
		this.skills.set(config.name, skill);
	}

	private createSkillDefinition(config: SkillConfig, sprites: SpriteLibrary): SkillDefinition {
		return {
			name: config.name,
			visibleName: config.visibleName,
			icon: sprites.icons[config.icon || config.name],
			effect: config.effect,
			cooldown: config.cooldown,
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

	registerHero(config: HeroConfig, sprites: SpriteLibrary) {
		const hero: HeroDefinition = {
			name: config.name,
			visibleName: config.name,
			baseHp: config.baseHp,
			sprite: sprites.actors[config.name],
			movement: 5,
			type: "normal",
			strength: { base: 10, growth: 0 },
			agility: { base: 10, growth: 0 },
			intelligence: { base: 10, growth: 0 },
			defence: { base: 10, growth: 0 },
			resistance: { base: 10, growth: 0 },
			luck: { base: 10, growth: 0 },
			speed: { base: 10, growth: 0 },
			skills: this.createSkillDefinitonsForHero(config, sprites),
		};

		this.heroes.set(config.name, hero);
	}

	registerHeroes(config: HeroConfig[], sprites: SpriteLibrary) {
		for (const hero of config) this.registerHero(hero, sprites);
	}
}

export interface HeroDefinition {
	name: string;
	visibleName: string;
	visibleTitle?: string;

	sprite: ActorSprite;
	movement: number;
	type: HeroType;

	baseHp: number;

	strength: HeroStat;
	agility: HeroStat;
	intelligence: HeroStat;
	defence: HeroStat;
	resistance: HeroStat;
	luck: HeroStat;
	speed: HeroStat;
	
	typeAttackBonus?: HeroStat;
	typeResistanceBonus?: HeroStat;
	skills: SkillDefinition[];
}

export interface HeroStat {
	base: number;
	growth: number;
}
