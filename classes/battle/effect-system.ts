import { BattleActor, HeroType } from "../battle/actor";
import { MapLayer, Position } from "../map-layer";
import { DamageFunction, Skill, SkillEffect, SkillEffectDamage } from "./skill/skill";

export type EffectEvent = EffectApplyEvent | DamageEvent;

export interface EffectApplyEvent {
	type: "onSkill"
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

export interface DamageEvent {
	type: "onDamage"
	sourceSkill: Skill;
	source: BattleActor;
	target: BattleActor;
	originalDamage: number;
	blocks: { by: BattleActor; reason: string }[];
	mitigations: { by: BattleActor; chance: number }[];
	calculatedDamage: number;
	originalDamageType: HeroType;
	calculatedDamageType: HeroType;
}

export type EffectHook = 
	"onSkill" | "preDamage" | "onDamage" | "onKill" | "onStatusApplied" | "postSkill" | 
	"onTurnStart" | "onTurnEnd" | "onMove";

// TODO: split into separate handlers for each effect hook
export type EffectHandler = (passiveOwner: BattleActor, event: EffectEvent, actors: BattleActor[],
			     map: MapLayer) => void;


export interface EffectHandlerDef {
	handle: EffectHandler,
	source: BattleActor,
	hook: EffectHook,
}

export class EffectSystem {
	private handlers: Map<EffectHook, EffectHandlerDef[]> = new Map();

	on(handler: EffectHandler, source: BattleActor, hook: EffectHook = "onSkill") {
		if (!this.handlers.has(hook)) this.handlers.set(hook, []);
		const handlers = this.handlers.get(hook);
		if (!handlers) return;
		handlers.push({
			handle: handler,
			source: source,
			hook: hook,
		});
	}

	emitSkill(source: BattleActor, target: BattleActor | Position, effect: SkillEffect,
	    sourceSkill: Skill, actors: BattleActor[], map: MapLayer) {
		const event: EffectApplyEvent = {
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

		this.runHook("onSkill", event, actors, map);
		this.resolve(event, actors, map);
	}

	private runHook(hook: EffectHook, event: EffectEvent, actors: BattleActor[], map: MapLayer) {
		const handlers = this.handlers.get(hook);
		if (!handlers) return;
		for (const handler of handlers) {
			handler.handle(handler.source, event, actors, map);
		}
	}

	private resolve(e: EffectApplyEvent, actors: BattleActor[], map: MapLayer) {
		if (e.blocks.length === 0) {
			e.result = "applied";
		} else if (e.mitigations.length > 0) {
			e.result = "mitigated";
		} else {
			e.result = "blocked";
		}

		if (e.result === "applied") {
			this.applyEffect(e, actors, map);
		} else if (e.result === "mitigated") {
		}

		for (const reaction of e.reactions) {
			reaction();
		}
	}

	private applyEffect(event: EffectApplyEvent, actors: BattleActor[], map: MapLayer) {
		const effect = event.effect;
		if (effect.type == 'damage') {
			this.applyDamageEvent(event, effect, actors, map);
		}
	}

	private applyDamageEvent(event: EffectApplyEvent, effect: SkillEffectDamage, actors: BattleActor[], map: MapLayer) {
		const target = event.target;

		let damageEvents = []
		if ('name' in target) {
			const dmg = this.calculateDamage(event.source, target, effect.damage, event.sourceSkill);
			damageEvents.push(dmg);
		} else {
			damageEvents = this.calculateAoeDamage(event, target, effect, actors);
		}

		for (let dmgEvent of damageEvents) {
			this.runHook("preDamage", dmgEvent, actors, map);
			this.applyDamage(dmgEvent.source, dmgEvent.target, dmgEvent.calculatedDamage);
			this.runHook("onDamage", dmgEvent, actors, map);
			if (dmgEvent.target.dead) {
				this.runHook("onKill", dmgEvent, actors, map);
			}
		}
	}

	private getTaxicabDistance(pos1: Position, pos2: Position): number {
		return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y)
	}

	private calculateAoeDamage(event: EffectApplyEvent, target: Position, effect: SkillEffectDamage, actors: BattleActor[]): DamageEvent[] {
		const radius = effect.effectRadius || effect.effectCone || effect.effectLine;
		if (!radius) return [];
		let targets = actors
			.filter(a => this.getTaxicabDistance(a.positionSquare, target) <= radius)
			.filter(a => event.source.enemy != a.enemy);

		// TODO: if (effect.effectCone) {
		if (effect.effectLine) {
			if (target.x == event.source.positionSquare.x) {
				targets = targets.filter(a => a.positionSquare.x == target.x);
			} else if (target.y == event.source.positionSquare.y) {
				targets = targets.filter(a => a.positionSquare.y == target.y);
			} else {
				return [];
			}
		}
		let damageEvents = [];

		for (let target of targets) {
			const dmg = this.calculateDamage(event.source, target, effect.damage, event.sourceSkill);
			damageEvents.push(dmg);
		}
		return damageEvents;
	}

	private calculateDamage(source: BattleActor, target:  BattleActor, damage: number | DamageFunction, skill: Skill): DamageEvent {
		let amount: number;
		if (typeof damage == 'number') {
			amount = damage; // TODO: attack type effectivenes
		} else {
			amount = damage(source, target, skill);
		}

		return {
			type: "onDamage",
			sourceSkill: skill,
			source,
			target,
			originalDamage: amount,
			calculatedDamage: amount,
			originalDamageType: "normal", // TODO
			calculatedDamageType: "normal", // TODO
			blocks: [],
			mitigations: [],
		}
	}

	private applyDamage(_source: BattleActor, target:  BattleActor, damage: number) {
		target.hp -= damage;
		if (target.hp <= 0) {
			target.dead = true;
		}
	}
}
