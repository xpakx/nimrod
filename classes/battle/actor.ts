import { Actor, ActorSprite } from "../actor.js";
import { getLogger, Logger } from "../logger.js";
import { MapLayer, Position } from "../map-layer.js";
import { Heroes } from "./actors.js";
import { HeroDefinition } from "./hero-library.js";
import { Skill } from "./skill/skill.js";

export type HeroRank = "common" | "rare"; 

export interface HeroStats {
	hp: number;
	strength: number;
	agility: number;
	intelligence: number;
	defence: number;
	resistance: number;
	luck: number;
	speed: number;
	vampirism: number;
}

interface Token {
	name: string;
	value?: number;
	duration?: number;
}

interface Modifier {
	stat: keyof HeroStats;
	value: number;
	duration?: number;
}

type ModifiersByStat = {
	[K in keyof HeroStats]?: Modifier[];
};

export class BattleActor extends Actor {
	enemy: boolean = false;
	placed: boolean = false;
	name: string = "???";
	movement: number = 5;
	type: HeroType = "normal";
	currentHp: number = 0;
	skills: Skill[] = []
	logger: Logger = getLogger("BattleActor");
	rank: HeroRank = "common";

	moving: boolean = false;
	path?: Position[]

	selected: boolean = false;

	definition?: HeroDefinition;

	moved: boolean = false;
	skillUsed: boolean = false;
	finishedTurn: boolean = false;
	distanceTravelledThisTurn: number = 0;
	level: number = 1;

	private stats: HeroStats;
	private modifiers: HeroStats;
	private equipmentMods: HeroStats;

	private tokens: Record<string, Token[]> = {};
	private buffs: ModifiersByStat = {};
	private debuffs: ModifiersByStat = {};

	// TODO: tokens and temporary mods

	constructor(sprite: ActorSprite, position: Position) {
		super(sprite, position);
		this.stats = Heroes.getEmptyStats();
		this.modifiers = Heroes.getEmptyStats();
		this.equipmentMods = Heroes.getEmptyStats();
	}

	applyHeroDefinition(definition: HeroDefinition) {
		this.definition = definition;
		this.name = definition.name;
		this.movement = definition.movement;
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
				targetSubtype: skill.targetSubType,
				passive: skill.passive,
			});
		}
		this.resetStats();
		this.currentHp = this.stats.hp;
	}

	resetStats() {
		if (!this.definition) return;
		this.calculateStat("hp");
		this.calculateStat("strength");
		this.calculateStat("agility");
		this.calculateStat("intelligence");
		this.calculateStat("defence");
		this.calculateStat("resistance");
		this.calculateStat("luck");
		this.calculateStat("speed");
		this.calculateStat("vampirism");
	}

	getBaseStat(stat: keyof HeroStats): number {
		return this.stats[stat];
	}

	getStat(stat: keyof HeroStats): number {
		const baseStat = this.stats[stat];
		const modifier = this.modifiers[stat];
		const equipment = this.equipmentMods[stat];
		return Math.max(1, baseStat + equipment + modifier);
	}

	applyBonus(stat: keyof HeroStats, bonus: number) {
		this.modifiers[stat] += bonus;
	}

	applyEquipmentBonus(stat: keyof HeroStats, bonus: number) {
		this.equipmentMods[stat] += bonus;
	}

	resetEquipment() {
		this.equipmentMods = Heroes.getEmptyStats();
	}

	resetBonuses() {
		this.modifiers = Heroes.getEmptyStats();
	}

	calculateStat(stat: keyof HeroStats) {
		if (!this.definition) return;
		const data = this.definition[stat];
		this.stats[stat] = data.base + this.level*data.growth;
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

	hasToken(key: string): boolean {
		if(!(key in this.tokens)) return false;
		return this.tokens[key].length > 0;
	}

	addToken(key: string, value: number = 1, duration: number | undefined = undefined) {
		if(!(key in this.tokens)) this.tokens[key] = [];
		this.tokens[key].push({name: key, value: value, duration: duration});
	}

	totalTokens(key: string): number {
		if(!(key in this.tokens)) return 0;
		return this.tokens[key].length;
	}

	totalTokenValue(key: string): number {
		if(!(key in this.tokens)) return 0;
		return this.tokens[key].reduce((sum, token) => sum + (token.value ?? 0), 0);
	}

	resetTokens(key: string) {
		this.tokens[key] = [];
	}


	isBuffed(key: keyof HeroStats): boolean {
		const buffs = this.buffs[key];
		return !!buffs && buffs.length > 0;
	}

	addBuff(key: keyof HeroStats, value: number, duration: number | undefined = undefined) {
		let buffs = this.buffs[key];
		if (!buffs) {
			buffs = [];
			this.buffs[key] = buffs;
		}
		buffs.push({stat: key, value: value, duration: duration});
		this.modifiers[key] += value;
	}


	isDebuffed(key: keyof HeroStats): boolean {
		const debuffs = this.debuffs[key];
		return !!debuffs && debuffs.length > 0;
	}

	addDebuff(key: keyof HeroStats, value: number, duration: number | undefined = undefined) {
		let debuffs = this.debuffs[key];
		if (!debuffs) {
			debuffs = [];
			this.debuffs[key] = debuffs;
		}
		debuffs.push({stat: key, value: value, duration: duration});
		this.modifiers[key] -= value;
	}

	advanceTokens() {
		for (let key in this.tokens) {
			let newTokens = [];
			for (let value of this.tokens[key]) {
				if (value.duration !== undefined) {
					value.duration -= 1;
					if (value.duration < 0) continue;
				}
				newTokens.push(value);
			}
			this.tokens[key] = newTokens;
		}
	}

	advanceBuffs() {
		for (let k in this.buffs) {
			const key = k as keyof HeroStats;
			if (!this.buffs[key]) continue;
			let newBuffs = [];
			for (let value of this.buffs[key]) {
				if (value.duration !== undefined) {
					value.duration -= 1;
					if (value.duration < 0) {
						const k = key;
						this.modifiers[k] -= value.value;
						continue;
					}
				}
				newBuffs.push(value);
			}
			this.buffs[key] = newBuffs;
		}
	}

	advanceDebuffs() {
		for (let k in this.debuffs) {
			const key = k as keyof HeroStats;
			if (!this.debuffs[key]) continue;
			let newDebuffs = [];
			for (let value of this.debuffs[key]) {
				if (value.duration !== undefined) {
					value.duration -= 1;
					if (value.duration < 0) {
						const k = key;
						this.modifiers[k] += value.value;
						continue;
					}
				}
				newDebuffs.push(value);
			}
			this.debuffs[key] = newDebuffs;
		}
	}
}

export type HeroType = "normal" | "fire" | "water" |
	"earth" | "air" | "shadow" | "light";
