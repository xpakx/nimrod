import { ActorSprite } from "../actor";
import { HeroConfig, SpriteLibrary } from "../sprite-library.js";
import { HeroType } from "./actor.js";

export class HeroLibrary {
	heroes: Map<string, HeroDefinition> = new Map();

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
}

export interface HeroStat {
	base: number;
	growth: number;
}
