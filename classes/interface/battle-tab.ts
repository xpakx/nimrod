import { BattleActor } from "../battle/actor.js";
import { Position, Size } from "../map-layer.js";
import { HeroIcon } from "../quest-layer.js";
import { Action } from "./actions.js";
import { HeroButton, NavButton } from "./adventurers-guild.js";
import { Button, ButtonPane } from "./button.js";

export class BattleTab implements ButtonPane {
	name: string;
	_icon: HTMLImageElement;
	active: boolean = false;
	itemOffset: number = 0;
	defaultButtonSize = 125;
	buttonSize = this.defaultButtonSize;
	mousePosition: Position = {x: -1, y: -1};
	icon: OffscreenCanvas;
	inactiveIcon: OffscreenCanvas;
	hoverIcon: OffscreenCanvas;
	inactiveHoverIcon: OffscreenCanvas;
	tabImg: HTMLImageElement;

	position: Position = {x: 0, y: 0};
	size: Size = {width: 0, height: 0};
	buttonGap: number = 10;

	buttons: Button[] = [];

	nextPageButton?: Button;
	prevPageButton?: Button;

	pageSize: number = 1;
	page: number = 0;
	pages: number = 0;

	constructor(name: string, icon: HTMLImageElement, tab: HTMLImageElement) {
		this.name = name;
		this.buttons = [];
		this._icon = icon;
		this.icon =  new OffscreenCanvas(100, 100);
		this.inactiveIcon =  new OffscreenCanvas(100, 100);
		this.hoverIcon =  new OffscreenCanvas(100, 100);
		this.inactiveHoverIcon =  new OffscreenCanvas(100, 100);
		this.tabImg = tab;
	}

	prepareIcon(tabSize: number) {
		this.icon.width = tabSize;
		this.icon.height = tabSize;

		const offscreenCtx = this.icon.getContext('2d');
		if (offscreenCtx) {
			this.drawIcon(offscreenCtx);
		}
		const inactiveCtx = this.inactiveIcon.getContext('2d');
		if (inactiveCtx) {
			this.drawIcon(inactiveCtx, false);
		}
		const hoverCtx = this.hoverIcon.getContext('2d');
		if (hoverCtx) {
			this.drawIcon(hoverCtx, true, true);
		}
		const inactiveHoverCtx = this.inactiveHoverIcon.getContext('2d');
		if (inactiveHoverCtx) {
			this.drawIcon(inactiveHoverCtx, false, true);
		}
	}

	drawIcon(ctx: OffscreenCanvasRenderingContext2D, active: boolean = true, hover: boolean = false) {
		ctx.clearRect(0, 0, this.icon.width, this.icon.height);
		ctx.drawImage(this.tabImg, 0, 0, this.icon.width, this.icon.height);
		if (!active) {
			ctx.strokeStyle = "#343434";
			ctx.beginPath();
			ctx.moveTo(this.icon.width, 0);
			ctx.lineTo(this.icon.width, this.icon.height);
			ctx.stroke();
			ctx.closePath();
		}
		if (!active) {
			ctx.filter = "grayscale(80%)";
		}
		if (hover) {
			ctx.filter = "brightness(140%)";
		}
		if (!active && hover) {
			ctx.filter = "grayscale(80%) brightness(140%)";
		}
		ctx.drawImage(this._icon, 5, 5, this.icon.width - 10, this.icon.height - 10);
	}

	prepareButtons() {
		let xMax = this.position.x + this.size.width;
		let yMax = this.position.y + this.size.height;

		this.nextPageButton = new NavButton({x: xMax - 50 - 10, y: yMax - 40}, "prev");
		this.prevPageButton = new NavButton({x: xMax - 20 - 10, y: yMax - 40}, "next");
		if (this.buttons.length == 0) {
			this.pages = 0;
			return;
		}

		const buttonsPerRow = Math.floor(this.size.width / (this.buttonSize + this.buttonGap));
		const rowsPerPage = Math.floor(this.size.height / (this.buttonSize + this.buttonGap));
		this.pageSize = buttonsPerRow * rowsPerPage;
		this.pages = Math.ceil(this.buttons.length / this.pageSize);
		
		for(let i = 0; i<this.buttons.length; i++) {
			const currentButton = this.buttons[i];
			currentButton.size.width = this.buttonSize;
			currentButton.size.height = this.buttonSize;
			const index = i % this.pageSize;
			const column = index % buttonsPerRow;
			const row = Math.floor(index / buttonsPerRow);
			currentButton.position.x = this.position.x + (this.buttonSize + this.buttonGap) * column;
			currentButton.position.y = this.position.y + (this.buttonSize + this.buttonGap) * row;
		}
	}

	draw(context: CanvasRenderingContext2D, mousePosition: Position) {
		const buttonEnd = Math.min(this.itemOffset + this.pageSize, this.buttons.length);
		for (let i = this.itemOffset; i < buttonEnd; i++) {
			const button = this.buttons[i];
			const hovered = button.inButton(mousePosition);
			button.draw(context, hovered);
		}

		if (this.pages <= 1) {
			return;
		}
		if (this.prevPageButton) {
			const hovered = this.prevPageButton.inButton(mousePosition);
			this.prevPageButton.draw(context, hovered);
		}
		if (this.nextPageButton) {
			const hovered = this.nextPageButton.inButton(mousePosition);
			this.nextPageButton.draw(context, hovered);
		}
	}

	buttonAt(position: Position): Action | undefined {
		const buttonEnd = Math.min(this.itemOffset + this.pageSize, this.buttons.length);
		for (let i = this.itemOffset; i < buttonEnd; i++) {
			const button = this.buttons[i];
			if(button.inButton(position)) {
				return button.getClickAction();
			}
		}
		return undefined;
	}

	hasPrevPage(): boolean {
		return this.page > 0;
	}

	hasNextPage(): boolean {
		return this.page < this.pages - 1;
	}

	toPrevPage() {
		if (!this.hasPrevPage()) return;
		this.page -= 1;
		this.itemOffset = this.pageSize * this.page;
	}

	toNextPage() {
		if (!this.hasNextPage()) return;
		this.page += 1;
		this.itemOffset = this.pageSize * this.page;
	}

	navButtonAt(position: Position): Action | undefined {
		if (this.pages <= 1) {
			return;
		}
		if (this.nextPageButton && this.nextPageButton.inButton(position)) {
			return this.nextPageButton.getClickAction();
		}
		if (this.prevPageButton && this.prevPageButton.inButton(position)) {
			return this.prevPageButton.getClickAction();
		}
		return undefined;
	}

	setHeroes(heroes: BattleActor[]) {
		this.buttons = [];
		for (let hero of heroes) {
			if (!hero.portrait) continue;
			const button = new HeroButton(
				hero.portrait,
				{width: this.buttonSize, height: this.buttonSize},
				{x: 0, y: 0},
				hero,
				"add"
			);
			this.buttons.push(button);
		}
		this.prepareButtons();
	}
}
