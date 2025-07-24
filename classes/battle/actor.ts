import { Actor, ActorSprite } from "../actor.js";
import { getLogger, Logger } from "../logger.js";
import { MapLayer, Position } from "../map-layer.js";
import { HeroDefinition, HeroStat } from "./hero-library.js";
import { Skill } from "./skill/skill.js";

export type HeroRank = "common" | "rare"; 

export interface HeroStats {
	maxHp: number;
	strength: number;
	agility: number;
	intelligence: number;
	defence: number;
	resistance: number;
	luck: number;
	speed: number;
	vampirism: number;
}

export class BattleActor extends Actor {
	enemy: boolean = false;
	placed: boolean = false;
	name: string = "???";
	movement: number = 5;
	type: HeroType = "normal";
	hp: number = 0;
	skills: Skill[] = []
	logger: Logger = getLogger("BattleActor");
	rank: HeroRank = "common";

	moving: boolean = false;
	path?: Position[]

	selected: boolean = false;
	strength: number = 10;
	agility: number = 10;

	definition?: HeroDefinition;

	moved: boolean = false;
	finishedTurn: boolean = false;
	level: number = 1;
	stats: HeroStats;

	constructor(sprite: ActorSprite, position: Position) {
		super(sprite, position);
		this.stats = {
			maxHp: 0,
			strength: 0,
			agility: 0,
			intelligence: 0,
			defence: 0,
			resistance: 0,
			luck: 0,
			speed: 0,
			vampirism: 0,
		}
	}

	calculateStat(stat: keyof HeroStats) {
		if (!this.definition) return;
		// TODO: type safety
		const data = this.definition[stat as keyof HeroDefinition] as HeroStat;
		this.stats[stat] = data.base + this.level*data.growth;
	}

	applyHeroDefinition(definition: HeroDefinition) {
		this.definition = definition;
		this.name = definition.name;
		this.hp = definition.baseHp;
		for (let skill of definition.skills) {
			this.skills.push({
				name: skill.visibleName,
				level: 1,
				effect: skill.effect,
				icon: skill.icon,
				cooldown: skill.cooldown,
				cooldownTimer: 0,
				maxDistance: skill.maxDistance,
				targetType: skill.targetType,
				passive: skill.passive,
			});
		}

		this.calculateStat("maxHp");
		this.calculateStat("strength");
		this.calculateStat("agility");
		this.calculateStat("intelligence");
		this.calculateStat("defence");
		this.calculateStat("resistance");
		this.calculateStat("luck");
		this.calculateStat("speed");
		// this.calculateStat("vampirism");
	}

	tick(deltaTime: number, _roads: MapLayer, _randMap: number[]): boolean {
		return this.move(deltaTime);
	}

	setPath(path: Position[]) {
		if (this.goal) {
			return;
		}
		this.path = path;
		this.path.reverse();
		this.path.pop();
		this.goal = this.path.pop();
		this.direction.x = this.goal!.x - this.positionSquare.x;
		this.direction.y = this.goal!.y - this.positionSquare.y; 
		this.logger.debug("Ultimate goal:", this.path[0]);
	}

	nextGoal(): boolean {
		this.goal = this.path?.pop();
		this.logger.debug("new goal", this.goal);
		if (!this.goal) {
			this.logger.debug("Reached position", this.position);
			return false;
		}
		this.direction.x = this.goal.x - this.positionSquare.x;
		this.direction.y = this.goal.y - this.positionSquare.y;
		return true;
	}

	move(deltaTime: number): boolean {
		if(!this.goal) {
			return false;
		}
		if (this.reachedGoal()) {
			const foundGoal = this.nextGoal();
			if (!foundGoal) return false;
		}

		this.updatePosition(this.direction.x*deltaTime, this.direction.y*deltaTime);

		if (this.positionSquare.x + this.positionSquare.y != this.diagonal) {
			this.diagonal = this.positionSquare.x + this.positionSquare.y;
			return true;
		}
		return false;
	}
}

export type HeroType = "normal" | "fire" | "water" |
	"earth" | "air" | "shadow" | "light";
