import { BattleActor, HeroStats, HeroType } from "../battle/actor.js";
import { getLogger, Logger } from "../logger.js";
import { MapLayer, Position } from "../map-layer.js";
import { Heroes } from "./actors.js";
import { Skill, SkillEffect, SkillEffectDamage, SpecialEffect } from "./skill/skill.js";

export type EffectEvent = SkillEvent | DamageEvent | TurnEvent | BuffEvent;

export interface SkillEvent {
	type: "onSkill";
	sourceSkill: Skill;
	source: BattleActor;
	target: BattleActor | Position;
	radius?: number;
	line?: number;
	effect: SkillEffect;
	duration?: number;

	blocks: { by: BattleActor; reason: string }[];
	mitigations: { by: BattleActor; chance: number }[];

	result?: "applied" | "blocked" | "mitigated";
	reactions: (() => void)[];
	criticalHit: boolean;
}

interface EventSpecialEffect {
	effect: SpecialEffect;
	blocks: { by: BattleActor; reason: string }[];
	mitigations: { by: BattleActor; chance: number }[];
	result?: "applied" | "blocked" | "mitigated";
	reactions: (() => void)[];
}

export interface DamageEvent {
	type: "onDamage" | "onKill" | "preDamage";
	sourceSkill: Skill;
	source: BattleActor;
	target: BattleActor;
	originalDamage: number;
	blocks: { by: BattleActor; reason: string }[];
	mitigations: { by: BattleActor; chance: number }[];
	calculatedDamage: number;
	originalDamageType: HeroType;
	calculatedDamageType: HeroType;
	effectiveness: "effective" | "normal" | "ineffective";
	buffs: DamageEventBuff[];
	healing: DamageEventHeal[];
	controlEffects: DamageEventControl[];
	additionalDamage: AdditionalDamage[],
}

interface AdditionalDamage {
	target: BattleActor;
	source: BattleActor;
	damage: SkillEffectDamage;
}

export interface DamageEventBuff {
	type: "buff" | "debuff";
	stat: keyof HeroStats;
	duration: number,
	value?: number;
	percentage?: number;
	blocks: { by: BattleActor; reason: string }[];
	mitigations: { by: BattleActor; chance: number }[];
}

export interface DamageEventControl {
	name: "sleep" | "stun";
	duration: number;
	blocks: { by: BattleActor; reason: string }[];
	mitigations: { by: BattleActor; chance: number }[];
}

export interface DamageEventHeal {
	tag: "normal" | "self" | "vampirism";
	value?: number;
	percentage?: number;
	blocks: { by: BattleActor; reason: string }[];
	mitigations: { by: BattleActor; chance: number }[];
}

export interface TurnEvent {
	type: "onTurnEnd" | "onTurnStart";
	subtype: "end" | "start";
	turnNum: number;
	enemyTurn: boolean;
}

export interface BuffEvent {
	type: "onBuff" | "preBuff";
	sourceSkill: Skill;
	source: BattleActor;
	target: BattleActor;

	buffType: "buff" | "debuff";
	stat: keyof HeroStats;
	duration: number,
	originalValue: number;
	calculatedValue: number;
	blocks: { by: BattleActor; reason: string }[];
	mitigations: { by: BattleActor; chance: number }[];
}

export interface TokenEvent {
	type: "onToken" | "preToken";
	sourceSkill: Skill;
	source: BattleActor;
	target: BattleActor;

	tokenName: string;
	duration: number,
	originalValue: number;
	calculatedValue: number;

	blocks: { by: BattleActor; reason: string }[];
	mitigations: { by: BattleActor; chance: number }[];
}

export interface HealEvent {
	type: "onHeal" | "preHeal";
	sourceSkill: Skill;
	source: BattleActor;
	target: BattleActor;

	tag: "normal" | "self" | "vampirism";
	originalValue: number;
	calculatedValue: number;

	blocks: { by: BattleActor; reason: string }[];
	mitigations: { by: BattleActor; chance: number }[];
}

export type EffectHook = 
	"onSkill" | "preDamage" | "onDamage" | "onKill" | "onStatusApplied" | "postSkill" | 
	"onTurnStart" | "onTurnEnd" | "onMove" | 
	"onBuff" | "preBuff" | "onToken" | "preToken" | "onHeal" | "preHeal";

export type EffectHandler = DamageHandler | TurnHandler | SkillHandler | BuffHandler;

export interface EventContext {
	actors: BattleActor[],
	map: MapLayer,
	specialEffects: EventSpecialEffect[];
}

export type SkillHandler = (owner: BattleActor, event: SkillEvent, context: EventContext) => void;
export type DamageHandler = (owner: BattleActor, event: DamageEvent, context: EventContext) => void;
export type TurnHandler = (owner: BattleActor, event: TurnEvent, context: EventContext) => void;
export type BuffHandler = (owner: BattleActor, event: BuffEvent, context: EventContext) => void;
export type TokenHandler = (owner: BattleActor, event: TokenEvent, context: EventContext) => void;
export type HealHandler = (owner: BattleActor, event: HealEvent, context: EventContext) => void;

export interface HookHandlerMap {
	onSkill: SkillHandler;
	postSkill: SkillHandler;
	onKill: DamageHandler;
	onStatusApplied: SkillHandler; // TODO: add new handler type
	preDamage: DamageHandler;
	onDamage: DamageHandler;
	onTurnStart: TurnHandler;
	onTurnEnd: TurnHandler;
	onMove: SkillHandler; // TODO: add new handler type
	preBuff: BuffHandler;
	onBuff: BuffHandler;
	onToken: TokenHandler;
	preToken: TokenHandler;
	preHeal: HealHandler;
	onHeal: HealHandler;
}

interface HookEventMap {
	onSkill: SkillEvent;
	postSkill: SkillEvent;
	onKill: DamageEvent;
	onStatusApplied: SkillEvent;
	preDamage: DamageEvent;
	onDamage: DamageEvent;
	onTurnStart: TurnEvent;
	onTurnEnd: TurnEvent;
	onMove: SkillEvent;

	preBuff: BuffEvent;
	onBuff: BuffEvent;
	onToken: TokenEvent;
	preToken: TokenEvent;
	preHeal: HealEvent;
	onHeal: HealEvent;
}


interface EffectHandlerDef<T extends EffectHook = EffectHook> {
	handle: (source: BattleActor, event: HookEventMap[T], context: EventContext) => void;
	source: BattleActor;
	hook: T;
	duration?: number;
}


export class EffectSystem {
	private handlers: {
		[K in EffectHook]?: EffectHandlerDef<K>[];
	} = {};
	logger: Logger = getLogger("EffectSystem");

	on<T extends EffectHook>(handler: HookHandlerMap[T], source: BattleActor, hook: T) {
		this.logger.debug(`Registering new handler of type ${hook} for an actor ${source.name}`, handler);
		let handlers = this.handlers[hook];
		if(!handlers) {
			handlers = [];
			this.handlers[hook] = handlers;
		}
		handlers.push({
			handle: handler as (source: BattleActor, event: HookEventMap[T], context: EventContext) => void,
			source: source,
			hook: hook,
		});
	}

	effectToSpecialEffects(effect: SkillEffect): EventSpecialEffect[] {
		let specialEffects: EventSpecialEffect[] = []
		if (effect.type == "damage" && effect.specialEffects) {
			for (let e of effect.specialEffects) {
				specialEffects.push({
					effect: e,
					blocks: [], 
					mitigations: [],
					reactions: []
				});
			}
		}
		return specialEffects;
	}

	emitSkill(source: BattleActor, target: BattleActor | Position, effect: SkillEffect,
	    sourceSkill: Skill, actors: BattleActor[], map: MapLayer) {
		this.logger.debug(`Processing an effect of skill ${sourceSkill.name}`, effect);
		const event: SkillEvent = {
			type: "onSkill",
			sourceSkill,
			source,
			target,
			effect,
			blocks: [],
			mitigations: [],
			reactions: [],
			criticalHit: false,
		};
		const context: EventContext = { 
			actors,
			map,
			specialEffects: this.effectToSpecialEffects(effect),
		};

		this.logger.debug("Running onSkill handlers");
		this.runHook("onSkill", event, context);
		// TODO: run context handlers
		this.resolve(event, context);
	}

	emitTurnEvent(turnNum: number, enemyTurn: boolean, actors: BattleActor[], map: MapLayer, onStart: boolean = true) {
		const context: EventContext = { actors, map, specialEffects: [] };
		const type = onStart ? "onTurnStart" : "onTurnEnd";
		const event: TurnEvent = {
			type,
			subtype: onStart ? "start" : "end",
			turnNum,
			enemyTurn,
		}

		this.runHook(type, event, context);
		this.calculateDuration();
	}

	private tickHandlers<K extends EffectHook>(_hook: K, handlers: EffectHandlerDef<K>[]): EffectHandlerDef<K>[] {
		return handlers
		.filter(handler => handler.duration !== 0)
		.map(handler => {
			if (handler.duration !== undefined) {
				handler.duration -= 1;
			}
			return handler;
		});
	}

	private calculateDuration() {
		this.logger.debug("Updating handler duration");
		for (const hook in this.handlers) {
			const key = hook as EffectHook;
			const handlers = this.handlers[key];
			if (!handlers) continue;
			this.handlers[key] = this.tickHandlers(key, handlers as EffectHandlerDef<typeof key>[]) as EffectHandlerDef<any>[]; // TODO: improve types
		}
	}

	private runHook<T extends EffectHook>(hook: T, event: HookEventMap[T], context: EventContext) {
		this.logger.debug(`Running ${hook} handlers`);
		const handlers = this.handlers[hook] as EffectHandlerDef<T>[] | undefined;
		if (!handlers) return;
		for (const handler of handlers) {
			handler.handle(handler.source, event, context);
		}
	}

	private resolve(e: SkillEvent, context: EventContext) {
		this.logger.debug("Resolving skill event", e);
		if (e.blocks.length === 0) {
			e.result = "applied";
		} else if (e.mitigations.length > 0) {
			e.result = "mitigated";
		} else {
			e.result = "blocked";
		}

		if (e.result === "applied") {
			this.applyEffect(e, context);
		} else if (e.result === "mitigated") {
		}

		for (const reaction of e.reactions) {
			this.logger.debug("Processing reactions");
			reaction();
		}
	}

	private applyEffect(event: SkillEvent, context: EventContext) {
		this.logger.debug("Applying event");
		const effect = event.effect;
		if (effect.type == 'damage') {
			this.applyDamageEvent(event, effect, context);
		}
	}

	private applyDamageEvent(event: SkillEvent, effect: SkillEffectDamage, context: EventContext) {
		this.logger.debug("Applying damage event");
		const target = event.target;

		let damageEvents = []

		if ('name' in target) {
			const dmg = this.calculateDamage(event.source, target, effect, event.sourceSkill);
			damageEvents.push(dmg);
		} else {
			damageEvents = this.calculateAoeDamage(event, target, effect, context.actors);
		}
		this.logger.debug("Calculated damage events", damageEvents);

		for (let dmgEvent of damageEvents) {
			this.runHook("preDamage", dmgEvent, context);
			let dmg = dmgEvent.calculatedDamage;
			if (dmgEvent.effectiveness == "effective") dmg *= 2;
			else if (dmgEvent.effectiveness == "ineffective") dmg /= 2;
			// TODO: blocked damage
			this.logger.debug(`Applying ${dmgEvent.calculatedDamage} damage event of type ${dmgEvent.calculatedDamageType}`);
			this.applyDamage(dmgEvent.source, dmgEvent.target, dmgEvent.calculatedDamage);
			this.runHook("onDamage", dmgEvent, context);
			if (dmgEvent.target.dead) {
				this.runHook("onKill", dmgEvent, context);
			}
		}
	}

	private calculateAoeDamage(event: SkillEvent, target: Position, effect: SkillEffectDamage, actors: BattleActor[]): DamageEvent[] {
		const radius = effect.effectRadius || effect.effectCone || effect.effectLine;
		if (!radius) return [];
		let targets: BattleActor[];

		if (effect.effectLine) {
			targets = Heroes.getEnemiesInLine(event.source, actors, radius, target);
		} else if (effect.effectCone) {
			targets = Heroes.getEnemiesInCone(event.source, actors, radius, target);
		} else {
			targets = Heroes.getEnemiesInRadius(event.source, actors, radius, target);
		}
		let damageEvents = [];

		for (let target of targets) {
			const dmg = this.calculateDamage(event.source, target, effect, event.sourceSkill);
			damageEvents.push(dmg);
		}
		return damageEvents;
	}

	private calculateDamage(source: BattleActor, target:  BattleActor, effect: SkillEffectDamage, skill: Skill): DamageEvent {
		let amount: number;
		if (typeof effect.damage == 'number') {
			amount = effect.damage;
		} else {
			amount = effect.damage(source, target, skill);
		}

		let effectiveness: "effective" | "normal" | "ineffective" = "normal"
		if (Heroes.isEffective(effect.damageType, target.type)) {
			effectiveness = "effective";
		} else if (Heroes.isIneffective(effect.damageType, target.type)) {
			effectiveness = "ineffective";
		}

		return {
			type: "onDamage",
			sourceSkill: skill,
			source,
			target,
			originalDamage: amount,
			calculatedDamage: amount,
			originalDamageType: effect.damageType,
			calculatedDamageType: effect.damageType,
			blocks: [],
			mitigations: [],
			effectiveness,
			buffs: [],
			healing: [],
			controlEffects: [],
			additionalDamage: [],
		}
	}

	private applyDamage(_source: BattleActor, target:  BattleActor, damage: number) {
		target.currentHp -= damage;
		if (target.currentHp <= 0) {
			target.dead = true;
		}
	}
}
