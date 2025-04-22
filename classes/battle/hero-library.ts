import { ActorSprite } from "../actor";
import { HeroConfig, SpriteLibrary } from "../sprite-library.js";
import { HeroType } from "./actor.js";

export class HeroLibrary {
	heroes: Map<string, HeroDefinition> = new Map();

	registerHero(config: HeroConfig, sprites: SpriteLibrary) {
		const hero: HeroDefinition = {
			name: config.name,
			visibleName: config.name,
			hp: config.baseHp,
			sprite: sprites.actors[config.name],
			movement: 5,
			type: "normal",
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

	hp: number;
}


