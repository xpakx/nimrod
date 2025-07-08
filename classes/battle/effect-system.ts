import { BattleActor } from "../battle/actor";
import { MapLayer, Position } from "../map-layer";
import { DamageFunction, SkillEffect, SkillEffectDamage } from "./skill/skill";

export interface EffectApplyEvent {
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

export type EffectHandler = (event: EffectApplyEvent, actors: BattleActor[],
			     map: MapLayer) => void;

export class EffectSystem {
	private handlers: EffectHandler[] = [];

	on(handler: EffectHandler) {
		this.handlers.push(handler);
	}

	emit(source: BattleActor, target: BattleActor | Position, effect: SkillEffect,
	    actors: BattleActor[], map: MapLayer) {
		const event: EffectApplyEvent = {
			source,
			target,
			effect,
			blocks: [],
			mitigations: [],
			reactions: [],
			criticalHit: false,
		};

		for (const handler of this.handlers) {
			handler(event, actors, map);
		}

		this.resolve(event, actors);
	}

	private resolve(e: EffectApplyEvent, actors: BattleActor[]) {
		if (e.blocks.length === 0) {
			e.result = "applied";
		} else if (e.mitigations.length > 0) {
			e.result = "mitigated";
		} else {
			e.result = "blocked";
		}

		if (e.result === "applied") {
			this.applyEffect(e, actors);
		} else if (e.result === "mitigated") {
		}

		for (const reaction of e.reactions) {
			reaction();
		}
	}

	private applyEffect(event: EffectApplyEvent, actors: BattleActor[]) {
		const effect = event.effect;
		if (effect.type == 'damage') {
			this.applyDamageEvent(event, effect, actors);
		}
	}

	private applyDamageEvent(event: EffectApplyEvent, effect: SkillEffectDamage, actors: BattleActor[]) {
		const target = event.target;

		if ('name' in target) {
			this.applyDamage(event.source, target, effect.damage);
		} else {
			this.applyAoeDamage(event, target, effect, actors);
		}

	}

	private getTaxicabDistance(pos1: Position, pos2: Position): number {
		return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y)
	}

	private applyAoeDamage(event: EffectApplyEvent, target: Position, effect: SkillEffectDamage, actors: BattleActor[]) {
		const radius = effect.effectRadius || effect.effectCone || effect.effectLine;
		if (!radius) return;
		let targets = actors
			.filter(a => this.getTaxicabDistance(a.position, target) <= radius)
			.filter(a => event.source.enemy != a.enemy);

		// TODO: if (effect.effectCone) {
		if (effect.effectLine) {
			if (target.x == event.source.positionSquare.x) {
				targets = targets.filter(a => a.positionSquare.x == target.x);
			} else if (target.y == event.source.positionSquare.y) {
				targets = targets.filter(a => a.positionSquare.y == target.y);
			} else {
				return;
			}
		}

		for (let target of targets) {
			this.applyDamage(event.source, target, effect.damage);
		}
	}

	private applyDamage(source: BattleActor, target:  BattleActor, damage: number | DamageFunction) {
		let amount: number;
		if (typeof damage == 'number') {
			amount = damage; // TODO: attack type effectivenes
		} else {
			amount = damage(source, target);
		}

		target.hp -= amount;
		if (target.hp <= 0) {
			target.dead = true;
		}
	}
}
