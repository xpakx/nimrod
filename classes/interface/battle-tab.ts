import { BattleActor } from "../battle/actor.js";
import { Position, Size } from "../map-layer.js";
import { Action } from "./actions.js";
import { HeroButton } from "./adventurers-guild.js";
import { BuildingTab } from "./building-tab.js";
import { Button } from "./button.js";

export class BattleTab extends BuildingTab {
	active: boolean = false;
	itemOffset: number = 0;
	defaultButtonSize = 60;
	buttonSize = this.defaultButtonSize;
	mousePosition: Position = {x: -1, y: -1};

	position: Position = {x: 0, y: 0};
	size: Size = {width: 0, height: 0};
	buttonGap: number = 25;

	buttons: Button[] = [];

	pageSize: number = 1;
	page: number = 0;
	pages: number = 0;

	constructor(name: string, icon: HTMLImageElement, tab: HTMLImageElement) {
		super(name, [], icon, tab);
	}

	setHeroes(heroes: BattleActor[]) {
		this.buttons = [];
		for (let hero of heroes) {
			const button = new HeroButtonWithLabel(
				hero.portrait || hero.sprite.image,
				{width: this.buttonSize, height: this.buttonSize},
				{x: 0, y: 0},
				hero
			);
			this.buttons.push(button);
		}
	}

	prepareButtons() {
		let row = 0;
		for(let button of this.buttons) {
			button.size.width = this.buttonSize;
			button.size.height = this.buttonSize;
			button.position.x = this.position.x;
			button.position.y = this.position.y + (this.buttonSize + this.buttonGap) * row;
			row += 1;
		}
	}

	draw(context: CanvasRenderingContext2D, mousePosition: Position) {
		for(let button of this.buttons) {
			const hovered = button.inButton(mousePosition);
			button.draw(context, hovered);

		}
	}

	buttonAt(position: Position): Action | undefined {
		for(let button of this.buttons) {
			if(button.inButton(position)) {
				return button.getClickAction();
			}
		}
		return undefined;
	}
}

class HeroButtonWithLabel extends HeroButton {
	label: OffscreenCanvas;
	labelCtx: OffscreenCanvasRenderingContext2D;

	constructor(image: HTMLImageElement, size: Size, position: Position, hero: BattleActor) {
		super(image, size, position, hero, "select");
		this.label = new OffscreenCanvas(200, 100);
		this.labelCtx = this.label.getContext("2d")!;
		this.drawLabel();
	}

	drawLabel() {
		this.labelCtx.font = "13px normal"
		this.labelCtx.fillStyle = "white"
		this.labelCtx.fillText(this.hero.name, 10, 13);
	}

	draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, hovered: boolean) {
		super.draw(context, hovered);
		context.drawImage(this.label, this.position.x + this.size.width, this.position.y);
	}
}
