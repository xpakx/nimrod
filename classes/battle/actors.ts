import { BattleActor } from "./actor.js";

export class Heroes {
    constructor() {
        throw new Error('Heroes is a static class and cannot be instantiated');
    }

    static isSameAllyType(a: BattleActor, b: BattleActor) {
        return a.enemy === b.enemy && a.name === b.name && a !== b;
    }
}
