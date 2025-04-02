import { BuildingSprite } from "../building/buildings.js";
import { Position, Size } from "../map-layer.js";
import { Action } from "./actions.js";
import { Button } from "./button.js";

export class BuildingTab {
	name: string;
	buildings: Button[];
	_icon: HTMLImageElement;
	active: boolean = false;
	itemOffset: number = 0;
	activeButtons: Button[] = [];
	defaultButtonSize = 125;
	buttonSize = this.defaultButtonSize;
	mousePosition: Position = {x: -1, y: -1};
	icon: OffscreenCanvas;
	inactiveIcon: OffscreenCanvas;
	hoverIcon: OffscreenCanvas;
	inactiveHoverIcon: OffscreenCanvas;
	tabImg: HTMLImageElement;

	constructor(name: string, buildings: BuildingButton[], icon: HTMLImageElement, tab: HTMLImageElement) {
		this.name = name;
		this.buildings = buildings;
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

	prepareButtons(canvasSize: Size, menuWidth: number, tabEnd: number) {
		this.activeButtons = [];
		const menuPadding = 20;
		this.buttonSize = this.defaultButtonSize < menuWidth - menuPadding ? this.defaultButtonSize : menuWidth - menuPadding;
		const buttonMargin = 10;

		let xStart = canvasSize.width - menuWidth + menuPadding;
		let xMax = canvasSize.width - menuPadding;
		let currentYOffset = 0;
		let currentXOffset = 0;

		for(let i = this.itemOffset; i<this.buildings.length; i++) {
			let currentX = xStart + currentXOffset * (this.buttonSize + buttonMargin);
			let currentY = 60 + currentYOffset * (this.buttonSize + buttonMargin);
			if(currentX + this.buttonSize >= xMax) {
				currentXOffset = 0;
				currentYOffset += 1;
				currentX = xStart;
				currentY = 60 + currentYOffset * (this.buttonSize + buttonMargin);
				if (currentY >= tabEnd) {
					return;
				}
			}

			this.buildings[i].position.x = currentX;
			this.buildings[i].position.y = currentY;
			
			this.activeButtons.push(this.buildings[i]);

			currentXOffset += 1;
		}
	}

	draw(context: CanvasRenderingContext2D) {
		for(let button of this.activeButtons) {
			let hover = this.inButton(this.mousePosition, button);
			button.draw(context, hover);
		}
	}

	onMouse(position: Position) {
		this.mousePosition = position;
	}

	inButton(position: Position, button: Button): boolean {
		if(position.x < button.position.x || position.x > button.position.x + this.buttonSize) {
			return false;
		}
		if(position.y < button.position.y || position.y > button.position.y + this.buttonSize) {
			return false;
		}
		return true;
	}

	click(position: Position): Action | undefined { // TODO
		for(let button of this.activeButtons) {
			if(this.inButton(position, button)) {
				return button.getClickAction();
			}
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

	inButton(_position: Position): boolean {
		return false;
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
