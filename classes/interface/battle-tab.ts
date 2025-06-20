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
		this.name = name;
		this.buttons = [];
		this._icon = icon;
		this.icon =  new OffscreenCanvas(100, 100);
		this.inactiveIcon =  new OffscreenCanvas(100, 100);
		this.hoverIcon =  new OffscreenCanvas(100, 100);
		this.inactiveHoverIcon =  new OffscreenCanvas(100, 100);
		this.tabImg = tab;
	}

	setHeroes(heroes: BattleActor[]) {
		this.buttons = [];
		for (let hero of heroes) {
			const button = new HeroButton(
				hero.portrait || hero.sprite.image,
				{width: this.buttonSize, height: this.buttonSize},
				{x: 0, y: 0},
				hero,
				"select"
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
