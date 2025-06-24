import { BattleActor } from "../battle/actor";
import { MapLayer, Position } from "../map-layer";
import { SkillEffect, SkillEffectDamage } from "./skill/skill";

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

		this.resolve(event);
	}

	private resolve(e: EffectApplyEvent) {
		if (e.blocks.length === 0) {
			e.result = "applied";
		} else if (e.mitigations.length > 0) {
			e.result = "mitigated";
		} else {
			e.result = "blocked";
		}

		if (e.result === "applied") {
			this.applyEffect(e);
		} else if (e.result === "mitigated") {
		}

		for (const reaction of e.reactions) {
			reaction();
		}
	}

	private applyEffect(event: EffectApplyEvent) {
		const effect = event.effect;
		if (effect.type == 'damage') {
			this.applyDamage(event, effect);
		}
	}

	private applyDamage(event: EffectApplyEvent, effect: SkillEffectDamage) {
		const target = event.target as BattleActor; // TODO: AoE
		let damage: number;
		if (typeof effect.damage == 'number') {
			damage = effect.damage; // TODO: attack type effectivenes
		} else {
			damage = effect.damage(event.source, target);
		}

		target.hp -= damage;
		if (target.hp <= 0) {
			target.dead = true;
		}
	}
}
