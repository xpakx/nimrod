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
	buttonLabels: ImageData[] = [];

	pageSize: number = 1;
	page: number = 0;
	pages: number = 0;

	constructor(name: string, icon: HTMLImageElement, tab: HTMLImageElement) {
		super(name, [], icon, tab);
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
		this.buttonLabels = [];
		const offscreen =  new OffscreenCanvas(100, 100);
		const context = offscreen.getContext("2d")!;
		context.font = "13px normal"
		context.fillStyle = "white"
		

		let row = 0;
		for(let button of this.buttons) {
			button.size.width = this.buttonSize;
			button.size.height = this.buttonSize;
			button.position.x = this.position.x;
			button.position.y = this.position.y + (this.buttonSize + this.buttonGap) * row;
			const heroButton = button as HeroButton;

			context.fillText(heroButton.hero.name, 10, 0);
			const img = context.getImageData(0, 0, 100, 100);
			this.buttonLabels.push(img);

			row += 1;
		}
	}

	draw(context: CanvasRenderingContext2D, mousePosition: Position) {
		for(let i in this.buttons) {
			const button = this.buttons[i];
			const hovered = button.inButton(mousePosition);
			button.draw(context, hovered);
			const label = this.buttonLabels[i];
			context.putImageData(label, button.position.x + button.size.width, button.position.y);

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
