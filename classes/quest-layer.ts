import { GameState } from "./game-state";
import { Action } from "./interface/actions";
import { Button } from "./interface/button";
import { Position, Size } from "./map-layer";

export class QuestLayer {
	size: Size;
	pos: Position;

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
		this.markers.push(new QuestMarker({x: 10, y: 15}, {width: 10, height: 15}));
		this.markers.push(new QuestMarker({x: 100, y: 100}, {width: 10, height: 15}));
	}

	renderMap(context: CanvasRenderingContext2D, _deltaTime: number) {
	    context.save();
	    context.translate(this.pos.x, this.pos.y);
	    for (let marker of this.markers) {
		    marker.draw(context, false);
	    }
	    context.restore();
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

    draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, _hovered: boolean): void {
	    context.fillStyle = "white";
	    context.beginPath();
	    context.ellipse(this.position.x, this.position.y, this.size.width, this.size.height, 0, 0, 2 * Math.PI);
	    context.fill();
    }
}
