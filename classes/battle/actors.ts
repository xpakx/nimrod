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
}
