import { BattleActor } from "../../battle/actor.js";
import { Game } from "../../game.js";
import { Position } from "../../map-layer.js";
import { MoveGenerator } from "./move.js";

export class TestMoveGenerator implements MoveGenerator {

    makeMove(game: Game, actors: BattleActor[]): void {
	    for (let actor of actors) {
		    this.makeRandomMove(game, actor);
	    }
    }

    getRandomDirs(): Direction[] {
	    const directions = [
		    { dx: 0, dy: -1 },
		    { dx: 0, dy: 1 },
		    { dx: -1, dy: 0 },
		    { dx: 1, dy: 0 }
	    ];

	    return [...directions].sort(() => Math.random() - 0.5);
    }

    makeRandomMove(game: Game, actor: BattleActor) {
	    const dirPriority = this.getRandomDirs();

	    for (const dir of dirPriority) {
		    const newX = actor.positionSquare.x + dir.dx;
		    const newY = actor.positionSquare.y + dir.dy;
		    const position = {x: newX, y: newY};
		    
		    if (game.map.onMap(position)) {
			    this.moveActor(game, actor, position);
			    return;
		    }
	    }
        
    }

    moveActor(game: Game, actor: BattleActor, position: Position) {
	    game.battleLogic.moveActor(actor, position, [actor.positionSquare, position]);
    }
}

interface Direction {
	dx: number;
	dy: number;
}
