import { GameState } from "./game-state";
import { Action } from "./interface/actions";
import { Button } from "./interface/button";
import { Position, Size } from "./map-layer";

export class QuestLayer {
	size: Size;
	pos: Position;
	playerMouse: Position = {x: 0, y: 0};
	
	markers: Button[] = [];

	constructor(state: GameState) {
		this.size = {
			width: state.canvasSize.width - state.menuWidth,
			height: state.canvasSize.height - state.topPanelHeight,
		};
		this.pos = {
			x: 0,
			y: state.topPanelHeight,
		};
		this.markers.push(new QuestMarker({x: 0, y: 0}, {width: 20, height: 30}));
		this.markers.push(new QuestMarker({x: 100, y: 100}, {width: 20, height: 30}));
	}

	renderMap(context: CanvasRenderingContext2D, _deltaTime: number) {
	    context.save();
	    context.translate(this.pos.x, this.pos.y);
	    for (let marker of this.markers) {
		    const hovered = marker.inButton(this.playerMouse);
		    marker.draw(context, hovered);
	    }
	    context.restore();
	}

	updateMousePosition(position: Position) {
		this.playerMouse.x = position.x - this.pos.x;
		this.playerMouse.y = position.y - this.pos.y;
	}

	copyMousePosition(): Position {
		return { x: this.playerMouse.x, y: this.playerMouse.y }
	}

	getMousePosition(): Position {
		return this.playerMouse;
	}

}

export class QuestMarker implements Button {
    position: Position;
    size: Size;
    locked: boolean;

    constructor(position: Position, size: Size, locked: boolean = true) {
	    this.position = position;
	    this.size = size;
	    this.locked = locked;
    }

    inButton(position: Position): boolean {
	    if(position.x < this.position.x || position.x > this.position.x + this.size.width) {
		    return false;
	    }
	    if(position.y < this.position.y || position.y > this.position.y + this.size.height) {
		    return false;
	    }
	    return true;
    }

    drawImage(): void {
	    throw new Error("Method not implemented.");
    }

    getClickAction(): Action | undefined {
	    return undefined;
    }

    draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, hovered: boolean): void {
	    context.fillStyle = hovered ? "red" : "white";
	    context.beginPath();
	    context.ellipse(
		    this.position.x + this.size.width/2,
		    this.position.y + this.size.height/2,
		    this.size.width/2,
		    this.size.height/2,
		    0,
		    0,
		    2 * Math.PI
	    );
	    context.fill();
    }
}
