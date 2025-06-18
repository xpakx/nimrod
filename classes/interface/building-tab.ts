import { BuildingSprite } from "../building/buildings.js";
import { Position, Size } from "../map-layer.js";
import { Action } from "./actions.js";
import { NavButton } from "./adventurers-guild.js";
import { Button, ButtonPane } from "./button.js";

export class BuildingTab implements ButtonPane {
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

	// TODO: should probably extract more generic tab
	constructor(name: string, buildings: BuildingButton[], icon: HTMLImageElement, tab: HTMLImageElement) {
		this.name = name;
		this.buttons = buildings;
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
}

export class BuildingButton implements Button {
	image: OffscreenCanvas;
	context: OffscreenCanvasRenderingContext2D;

	hoverImage: OffscreenCanvas;
	hoverContext: OffscreenCanvasRenderingContext2D;

	_image: BuildingSprite;
	hover: boolean = false;
	position: Position = {x: 0, y: 0};
	size: Size = {width: 0, height: 0};
	name: string;
	defaultButtonSize = 125;
	buttonSize = this.defaultButtonSize;
	menuWidth = 420;

	constructor(image: BuildingSprite, name: string) {
		this.name = name;
		this._image = image;
		this.image = new OffscreenCanvas(this.defaultButtonSize, this.defaultButtonSize);
		this.context = this.image.getContext("2d")!; // TODO
		this.hoverImage = new OffscreenCanvas(this.defaultButtonSize, this.defaultButtonSize);
		this.hoverContext = this.hoverImage.getContext("2d")!; // TODO
		this.drawImage();
	}

	inButton(position: Position): boolean {
		if(position.x < this.position.x || position.x > this.position.x + this.buttonSize) {
			return false;
		}
		if(position.y < this.position.y || position.y > this.position.y + this.buttonSize) {
			return false;
		}
		return true;
	}

	drawImage(): void {
		if (!this.context) return;
		const menuPadding = 20;
		const menuWidth = this.menuWidth;
		this.buttonSize = this.defaultButtonSize < menuWidth - menuPadding ? this.defaultButtonSize : menuWidth - menuPadding;
		const buttonPadding = 20;
		const buildingSize = this.buttonSize - 2 * buttonPadding;
		let buildingWidth = this._image.size.width;
		let buildingHeight = this._image.size.height;

		if(buildingWidth > buildingHeight) {
			buildingHeight = buildingHeight*(buildingSize/buildingWidth);
			buildingWidth = buildingSize;
		} else {
			buildingWidth = buildingWidth*(buildingSize/buildingHeight);
			buildingHeight = buildingSize;
		}
		const paddingWidth = (this.buttonSize - buildingWidth) / 2;
		const paddingHeight = (this.buttonSize - buildingHeight) / 2;


		this.context.fillStyle = '#1a1a1a';
		this.context.fillRect(0, 0, this.buttonSize, this.buttonSize);
		this.context.save();
		this.context.filter = "grayscale(40%)";
		this.context.drawImage(this._image.image, paddingWidth, paddingHeight, buildingWidth, buildingHeight);
		this.context.restore();

		this.hoverContext.fillStyle = '#3a3a3a';
		this.hoverContext.fillRect(0, 0, this.buttonSize, this.buttonSize);
		this.hoverContext.drawImage(this._image.image, paddingWidth, paddingHeight, buildingWidth, buildingHeight);
	}

	getClickAction(): Action | undefined {
		return {action: "build", argument: this.name}
	}

	draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, hovered: boolean): void {
		const image = hovered ? this.hoverImage : this.image;
		context.drawImage(image, this.position.x, this.position.y);
	}
}
