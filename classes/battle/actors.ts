import { BattleActor } from "./actor.js";

export class Heroes {
	constructor() {
		throw new Error('Heroes is a static class and cannot be instantiated');
	}

	static isSameAllyType(a: BattleActor, b: BattleActor) {
		return a.enemy === b.enemy && a.name === b.name && a !== b;
	}

	static areEnemies(a: BattleActor, b: BattleActor) {
		return a.enemy !== b.enemy;
	}

	static areAllies(a: BattleActor, b: BattleActor) {
		return a.enemy === b.enemy;
	}

	static getAlliesOf(actor: BattleActor, actors: BattleActor[]) {
		return actors.filter(a => this.areAllies(actor, a));
	}

	static getEnemiesOf(actor: BattleActor, actors: BattleActor[]) {
		return actors.filter(a => this.areEnemies(actor, a));
	}

	// Targeting helpers
	static getLivingAlliesOf(actor: BattleActor, actors: BattleActor[]) {
		return this.getAlliesOf(actor, actors).filter(a => !a.dead);
	}

	static getLivingEnemiesOf(actor: BattleActor, actors: BattleActor[]) {
		return this.getEnemiesOf(actor, actors).filter(a => !a.dead);
	}

	static getRandomAllyOf(actor: BattleActor, actors: BattleActor[]) {
		const allies = this.getLivingAlliesOf(actor, actors);
		return allies[Math.floor(Math.random() * allies.length)];
	}

	static getRandomEnemyOf(actor: BattleActor, actors: BattleActor[]) {
		const enemies = this.getLivingEnemiesOf(actor, actors);
		return enemies[Math.floor(Math.random() * enemies.length)];
	}
	
}
