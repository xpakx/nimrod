import { Position } from "../map-layer.js";
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

	static getLowestHP(actors: BattleActor[]) {
		return actors
			.reduce((lowest, curr) => !lowest || curr.hp < lowest.hp ? curr : lowest);
	}

	static getHighestHP(actors: BattleActor[]) {
		return actors
			.reduce((highest, curr) => !highest || curr.hp > highest.hp ? curr : highest);
	}

	static getLowestHPEnemy(actor: BattleActor, actors: BattleActor[]) {
		return this.getLowestHP(this.getEnemiesOf(actor, actors));
	}

	static getHighestHPEnemy(actor: BattleActor, actors: BattleActor[]) {
		return this.getHighestHP(this.getEnemiesOf(actor, actors));
	}

	static getLowestHPAlly(actor: BattleActor, actors: BattleActor[]) {
		return this.getLowestHP(this.getAlliesOf(actor, actors));
	}

	static getHighestHPAlly(actor: BattleActor, actors: BattleActor[]) {
		return this.getHighestHP(this.getAlliesOf(actor, actors));
	}

	static sortByHP(actors: BattleActor[], ascending = true) {
		return actors.slice().sort((a, b) => ascending ? a.hp - b.hp : b.hp - a.hp);
	}

	static getEnemiesInRange(actor: BattleActor, actors: BattleActor[], range: number) {
		return this.getEnemiesOf(actor, actors)
			.filter(enemy => !enemy.dead && this.getTaxicabDistanceFor(actor, enemy) <= range);
	}

	static getEnemiesInAttackRange(actor: BattleActor, actors: BattleActor[], range: number, position: Position | undefined = undefined) {
		const pos = position || actor.positionSquare;
		return this.getEnemiesOf(actor, actors)
			.filter(enemy => !enemy.dead && this.getTaxicabDistance(pos, enemy.positionSquare) <= range);
	}

	static getAlliesInRange(actor: BattleActor, actors: BattleActor[], range: number) {
		return this.getAlliesOf(actor, actors)
			.filter(ally => !ally.dead && this.getTaxicabDistanceFor(actor, ally) <= range);
	}

	// Distance helpers
	static getTaxicabDistance(pos1: Position, pos2: Position): number {
		return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y)
	}

	static getTaxicabDistanceFor(actor1: BattleActor, actor2: BattleActor): number {
		const pos1 = actor1.positionSquare;
		const pos2 = actor2.positionSquare;
		return this.getTaxicabDistance(pos1, pos2);
	}

	static areAdjacent(actor1: BattleActor, actor2: BattleActor): boolean {
		const pos1 = actor1.positionSquare;
		const pos2 = actor2.positionSquare;
		return this.getTaxicabDistance(pos1, pos2) == 1;
	}
}
