import { BattleActor, HeroStats, HeroType } from "../battle/actor.js";
import { getLogger, Logger } from "../logger.js";
import { MapLayer, Position } from "../map-layer.js";
import { Heroes } from "./actors.js";
import { Skill, SkillEffect, SkillEffectBuff, SkillEffectDamage, SkillEffectHeal, SkillEffectToken, SpecialEffect } from "./skill/skill.js";

export type EffectEvent = SkillEvent | DamageEvent | TurnEvent;

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

export interface DamageEvent extends AdditionalEffects {
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
}

interface AdditionalEffects {
	sourceSkill: Skill;
	source: BattleActor;
	target: BattleActor;
	buffs: AdditionalEffect<SkillEffectBuff>[];
	healing: AdditionalEffect<SkillEffectHeal>[];
	controlEffects: AdditionalEffect<SkillEffectToken>[];
	additionalDamage: TargetableEffect<SkillEffectDamage>[],
}

export interface TargetableEffect<T> extends AdditionalEffect<T> {
	targetType: "square" | "hero";
	effectRadius?: number;
	effectLine?: number;
	effectCone?: number;
}

export interface AdditionalEffect<T> {
	sourceSkill: Skill;
	target: BattleActor;
	source: BattleActor;
	effect: T;
}

export interface TurnEvent {
	type: "onTurnEnd" | "onTurnStart";
	subtype: "end" | "start";
	turnNum: number;
	enemyTurn: boolean;
	buffs: AdditionalEffect<SkillEffectBuff>[];
	healing: AdditionalEffect<SkillEffectHeal>[];
	tokens: AdditionalEffect<SkillEffectToken>[];
	additionalDamage: TargetableEffect<SkillEffectDamage>[],
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
	overhealing?: number;

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
	handle: (source: BattleActor | undefined, event: HookEventMap[T], context: EventContext) => void;
	source: BattleActor | undefined;
	hook: T;
	duration?: number;
}

export interface DefaultHandler<T extends EffectHook = EffectHook> {
	handler: HookHandlerMap[T];
	hook: T;
}


export class EffectSystem {
	private handlers: {
		[K in EffectHook]?: EffectHandlerDef<K>[];
	} = {};
	logger: Logger = getLogger("EffectSystem");
	private defaultHandlers: DefaultHandler[] = [];

	on<T extends EffectHook>(handler: HookHandlerMap[T], source: BattleActor | undefined, hook: T) {
		this.logger.debug(`Registering new handler of type ${hook} ${source ? `for an actor ${source.name}` : ''}`, handler);
		let handlers = this.handlers[hook];
		if(!handlers) {
			handlers = [];
			this.handlers[hook] = handlers;
		}
		handlers.push({
			handle: handler as (source: BattleActor | undefined, event: HookEventMap[T], context: EventContext) => void,
			source: source,
			hook: hook,
		});
	}

	registerDefaultHandlers(handlers: DefaultHandler[]) {
		this.defaultHandlers = handlers;
	}

	resetHandlers() {
		this.handlers = {};
		for (let handler of this.defaultHandlers) {
			this.on(handler.handler, undefined, handler.hook);
		}
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
			buffs: [],
			healing: [],
			tokens: [],
			additionalDamage: [],
		}

		this.runHook(type, event, context);
		if (!onStart) this.calculateDuration();
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

	private runContextHook<T extends EffectHook>(hook: T, event: HookEventMap[T], context: EventContext) {
		this.logger.debug(`Running ${hook} handlers in context`);
		const handlers = context.specialEffects
			.filter((e) => e.effect.hook === hook)
			.map((e) => e.effect.handler);
		for (const handler of handlers) {
			const handlerFunc = handler as (source: BattleActor | undefined, event: HookEventMap[T], context: EventContext) => void;
			handlerFunc(undefined, event, context);
		}
	}

	private runHooks<T extends EffectHook>(hook: T, event: HookEventMap[T], context: EventContext) {
		this.runHook(hook, event, context);
		this.runContextHook(hook, event, context);
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
		} else if (effect.type == "buff") {
			this.applyBuffEvent(this.toBuffEvent(event, effect), context);
		} else if (effect.type == "passive") {
		} else if (effect.type == "token") {
			this.applyTokenEvent(this.toTokenEvent(event, effect), context);
		} else if (effect.type == "heal") {
			this.applyHealEvent(this.toHealEvent(event, effect), context);
		}
	}

	private toBuffEvent(event: SkillEvent | AdditionalEffect<SkillEffectBuff>, effect: SkillEffectBuff): BuffEvent {
		return {
			type: "onBuff",
			sourceSkill: event.sourceSkill,
			source: event.source,
			target: event.target as BattleActor, // TODO
			buffType: effect.buffType,
			stat: effect.stat,
			duration: effect.duration,
			originalValue: effect.value ?? 0,
			calculatedValue: effect.value ?? 0,
			blocks: [],
			mitigations: [],
		}
	}

	private toHealEvent(event: SkillEvent | AdditionalEffect<SkillEffectHeal>, effect: SkillEffectHeal): HealEvent {
		return {
			type: "onHeal",
			sourceSkill: event.sourceSkill,
			source: event.source,
			target: event.target as BattleActor, // TODO
			tag: "normal",
			originalValue: effect.value ?? 0,
			calculatedValue: effect.value ?? 0,
			blocks: [],
			mitigations: [],
		}
	}

	private toTokenEvent(event: SkillEvent | AdditionalEffect<SkillEffectToken>, effect: SkillEffectToken): TokenEvent {
		return {
			type: "onToken",
			sourceSkill: event.sourceSkill,
			source: event.source,
			target: event.target as BattleActor, // TODO
			tokenName: effect.tokenName,
			duration: effect.duration,
			originalValue: effect.value ?? 0,
			calculatedValue: effect.value ?? 0,
			blocks: [],
			mitigations: [],
		}
	}

	private applyDamageEvent(event: SkillEvent | TargetableEffect<SkillEffectDamage>, effect: SkillEffectDamage, context: EventContext) {
		this.logger.debug("Applying damage event");
		const target = event.target;

		let damageEvents = []

		if (Heroes.isTargetHero(target)) {
			const dmg = this.calculateDamage(event.source, target, effect, event.sourceSkill);
			damageEvents.push(dmg);
		} else {
			damageEvents = this.calculateAoeDamage(event, target, effect, context.actors);
		}
		this.logger.debug("Calculated damage events", damageEvents);

		for (let dmgEvent of damageEvents) {
			this.runHooks("preDamage", dmgEvent, context);

			let dmg = dmgEvent.calculatedDamage;
			if (dmgEvent.effectiveness == "effective") dmg *= 2;
			else if (dmgEvent.effectiveness == "ineffective") dmg /= 2;
			// TODO: blocked damage
			this.logger.debug(`Applying ${dmgEvent.calculatedDamage} damage event of type ${dmgEvent.calculatedDamageType}`);
			this.applyDamage(dmgEvent.source, dmgEvent.target, dmg);

			this.runHooks("onDamage", dmgEvent, context);

			if (dmgEvent.target.dead) {
				this.runHooks("onKill", dmgEvent, context);
			}
			this.applyAdditionalEffects(dmgEvent, context);
		}
	}

	private applyAdditionalEffects(event: AdditionalEffects, context: EventContext) {
		for (let buff of event.buffs) {
			this.applyBuffEvent(this.toBuffEvent(buff, buff.effect), context);
		}
		for (let heal of event.healing) {
			this.applyHealEvent(this.toHealEvent(heal, heal.effect), context);
		}
		for (let token of event.controlEffects) {
			this.applyTokenEvent(this.toTokenEvent(token, token.effect), context);
		}
		for (let dmg of event.additionalDamage) {
			this.applyDamageEvent(dmg, dmg.effect, context);
		}
	}

	private calculateAoeDamage(event: SkillEvent | TargetableEffect<SkillEffectDamage>, target: Position, effect: SkillEffectDamage, actors: BattleActor[]): DamageEvent[] {
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

	private applyBuffEvent(event: BuffEvent, context: EventContext) {
		this.logger.debug("Applying buff event");
		const target = event.target;

		this.runHook("preBuff", event, context);
		// TODO: blocked buffs
		this.logger.debug(`Applying ${event.calculatedValue} ${event.buffType} to ${target.name}'s ${event.stat}`);
		if (event.buffType == "buff") target.addBuff(event.stat, event.calculatedValue, event.duration);
		else if (event.buffType == "debuff") target.addDebuff(event.stat, event.calculatedValue, event.duration);
		this.runHook("onBuff", event, context);
	}

	private applyTokenEvent(event: TokenEvent, context: EventContext) {
		this.logger.debug("Applying token event");
		const target = event.target;

		this.runHook("preToken", event, context);
		// TODO: blocked tokens
		this.logger.debug(`Applying token ${event.tokenName} to ${target.name}`);
		target.addToken(event.tokenName, event.calculatedValue, event.duration);
		this.runHook("onToken", event, context);
	}

	private applyHealEvent(event: HealEvent, context: EventContext) {
		this.logger.debug("Applying token event");
		const target = event.target;

		this.runHook("preHeal", event, context);
		// TODO: blocked healing
		this.logger.debug(`Healing ${event.calculatedValue} of ${target.name}'s hp`);
		const maxHeal = target.currentHp + event.calculatedValue;
		target.currentHp = Math.min(target.getStat("hp"), target.currentHp + event.calculatedValue);
		const overhealing = maxHeal - target.currentHp;
		if (overhealing > 0) event.overhealing = overhealing;
		this.runHook("onHeal", event, context);
	}
}
