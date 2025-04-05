import { BuildingInterface } from "./building/buildings.js";
import { GameState } from "./game-state.js";
import { Game } from "./game.js";
import { Action } from "./interface/actions.js";
import { Button } from "./interface/button.js";
import { Position, Size } from "./map-layer.js";

export class QuestLayer {
	size: Size;
	pos: Position;
	playerMouse: Position = {x: 0, y: 0};
	
	markers: Button[] = [];
	isDragging: boolean = false;

	constructor(state: GameState) {
		this.size = {
			width: state.canvasSize.width - state.menuWidth,
			height: state.canvasSize.height - state.topPanelHeight,
		};
		this.pos = {
			x: 0,
			y: state.topPanelHeight,
		};
		this.markers.push(
			new QuestMarker(
				{x: 0, y: 0}, 
				{width: 20, height: 30},
				{name: "Quest 1", description: "", battle: { map: "battle.json" }},
			));
		this.markers.push(
			new QuestMarker(
				{x: 100, y: 100},
				{width: 20, height: 30},
				{name: "Quest 2", description: ""},
			));
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

	// TODO: move to logic layer
	onMouseLeftClick(game: Game) {
		for (let marker of this.markers) {
			if(marker.inButton(this.playerMouse)) {
				const action = marker.getClickAction();
				if (action && action.action == "open") {
					const quest = action.interface as QuestInterface;
					game.interf.buildingInterface = quest;
					quest.openQuest(game.state);
				}
				break;
			}
		}
	}
}

export class QuestMarker implements Button {
    position: Position;
    size: Size;
    locked: boolean;
    interf: QuestInterface;

    constructor(position: Position, size: Size, quest: Quest, locked: boolean = true) {
	    this.position = position;
	    this.size = size;
	    this.locked = locked;
	    this.interf = new QuestInterface(quest);
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
	    return { 
		   action: "open",
		   interface: this.interf,
	    };
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

export class QuestInterface extends BuildingInterface {
	quest: Quest;
	goButton: Button;

	constructor(quest: Quest) {
		super();
		this.quest = quest;
		let action: Action = { action: "goTo", argument: "City" }; // TODO
		if (quest.battle) {
			action = { action: "goTo", argument: "Battle" };  // TODO

		}
		this.goButton =  new GoButton({x: 100, y: 100}, action);
	}

	renderInterface() { 
		const width = this.size.width;
		const height = this.size.height;
		const x = 0;
		const y = 0;

		this.offscreen = new OffscreenCanvas(this.size.width, this.size.height);
		this.context = this.offscreen.getContext("2d")!;
		this.context.fillStyle = '#444';
		this.context.fillRect(x, y, width, height);

		this.context.strokeStyle = '#fff';
		this.context.strokeRect(x, y, width, height);

		const nameX = 20;
		const nameY = 40;

		this.context.fillStyle = '#fff';
		this.context.font = '24px Arial';
		this.context.fillText(this.quest.name, nameX, nameY);
	}

	// TODO: should probably make more general interface
	openQuest(state: GameState) {
		this.preRender(state);
		this.renderInterface();
	}

	preRender(state: GameState) {
		this.position.x = this.leftMargin;
		this.size.width = state.canvasSize.width - 2*this.leftMargin - state.menuWidth;
		this.size.height = 300;
		const middleOfMap = (state.canvasSize.height - state.topPanelHeight) / 2  + state.topPanelHeight;
		this.position.y = middleOfMap - this.size.height / 2;
		const goButtonMargin = 20;
		this.goButton.position.x = this.position.x + this.size.width - goButtonMargin - this.goButton.size.width;
		this.goButton.position.y = this.position.y + this.size.height - goButtonMargin - this.goButton.size.height;
	}

	drawInterface(context: CanvasRenderingContext2D, deltaTime: number, state: GameState) {
		super.drawInterface(context, deltaTime, state);
		this.goButton.draw(context, false);
	}

	click(position: Position): Action | undefined {
		if (this.goButton.inButton(position)) {
			return this.goButton.getClickAction();
		}

		return undefined;
	}
}


export interface Quest {
	name: string;
	description: string;
	battle?: BattleQuest;
}

export interface BattleQuest {
	map: string;
}

export class GoButton implements Button {
    image: OffscreenCanvas;
    context: OffscreenCanvasRenderingContext2D;
    hover: boolean;
    position: Position;
    size: Size;
    action: Action;

    constructor(position: Position, action: Action) {
	    this.size = {width: 20, height: 20};
	    this.image = new OffscreenCanvas(this.size.width, this.size.height);
	    this.context = this.image.getContext("2d")!; // TODO
	    this.position = position;
	    this.hover = false;
	    this.action = action;
	    this.drawImage();
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
	    this.context.fillStyle = '#dfd';
	    this.context.beginPath();
	    this.context.arc(this.size.width/2, this.size.width/2, this.size.width/2, 0, 2 * Math.PI);
	    this.context.fill();
    }

    getClickAction(): Action | undefined {
	    return this.action;
    }


    draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, _hovered: boolean): void {
		context.drawImage(this.image, this.position.x, this.position.y);
	}
}
