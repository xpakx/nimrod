import { BattleActor } from "../battle/actor.js";
import { Position, Size } from "../map-layer.js";
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
	buttonGap: number = 10;

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
}
