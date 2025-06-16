import { BattleActor } from "../../battle/actor.js";
import { Game } from "../../game.js";
import { Position } from "../../map-layer.js";
import { MoveGenerator } from "./move.js";

export class TestMoveGenerator implements MoveGenerator {

    makeMove(game: Game, actors: BattleActor[]): void {
    }
}
