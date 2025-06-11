import { BattleActor } from "../battle/actor";
import { Position } from "../map-layer";

type EffectType = "control" | "heal" | "damage" | "buff" | "debuff";

export interface Effect {
	type: EffectType;
	name: string;
}

export interface EffectApplyEvent {
	source: BattleActor;
	target: BattleActor | Position;
	radius?: number;
	line?: number;
	effect: Effect;
	duration?: number;

	blocks: { by: BattleActor; reason: string }[];
	mitigations: { by: BattleActor; chance: number }[];

	result?: "applied" | "blocked" | "mitigated";
	reactions: (() => void)[];
}

export type EffectHandler = (event: EffectApplyEvent) => void;

export class EffectSystem {
	private handlers: EffectHandler[] = [];

	on(handler: EffectHandler) {
		this.handlers.push(handler);
	}

	emit(source: BattleActor, target: BattleActor, effect: Effect) {
		const event: EffectApplyEvent = {
			source,
			target,
			effect,
			blocks: [],
			mitigations: [],
			reactions: [],
		};

		for (const handler of this.handlers) {
			handler(event);
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

		if (e.result === "applied" || e.result === "mitigated") {
			// apply effect
		}

		for (const reaction of e.reactions) {
			reaction();
		}
	}
}
