import { BuildingInterface } from "../building/buildings.js";
import { GameState } from "../game-state.js";
import { Position, Size } from "../map-layer.js";
import { Action } from "./actions.js";
import { BuildingTab } from "./building-tab.js";
import { Button, ButtonContainer, ButtonPane } from "./button.js";
import { Dialogue, DialogueParsed } from "./dialogue.js";

export class InterfaceLayer {
	canvasSize: Size = {width: 0, height: 0};
	menuWidth: number;
	tabWidth = 65;
	topPanelHeight: number;
	dialogue: DialogueParsed | undefined = undefined;
	tab: number | undefined = undefined;
	tabs: BuildingTab[] = [];
	populationIcon: HTMLImageElement | undefined = undefined;
	coinsIcon: HTMLImageElement | undefined = undefined;
	coinsIconSize: Size = {width: 0, height: 0};
	populationIconSize: Size = {width: 0, height: 0};
	mousePosition = {x: -1, y: -1};

	buildingMenuHeight = 300;

	buttons: ButtonContainer[] = [];

	buildingInterface: BuildingInterface | undefined = undefined;

	constructor(canvasSize: Size, menuWidth: number,  topPanelHeight: number) {
		this.canvasSize = canvasSize;
		this.menuWidth = menuWidth;
		this.topPanelHeight = topPanelHeight;
	}

	onMouse(position: Position) {
		this.mousePosition = position;
	}

	addButtonRow(row: ButtonRow) {
		this.buttons.push(row);
		row.calculateButtonRow(this.menuWidth, this.canvasSize.width);
	}

	calculateIconsSize() {
		const height = 20;
		if(this.coinsIcon) {
			this.coinsIconSize.height = height;
			this.coinsIconSize.width = this.coinsIcon.width*(height/this.coinsIcon.height);
		}
		if(this.populationIcon) {
			this.populationIconSize.height = height;
			this.populationIconSize.width = this.populationIcon.width*(height/this.populationIcon.height);
		}
	}

	renderInterface(context: CanvasRenderingContext2D, deltaTime: number, state: GameState) {
		this.drawTopPanel(context, state);
		this.drawMenu(context);
		this.drawTabs(context);
		this.renderDialogueBox(context, deltaTime);
		if (this.tab  != undefined) {
			this.tabs[this.tab].draw(context, this.mousePosition);
		}
		if (this.buildingInterface) {
			this.buildingInterface.drawInterface(context, deltaTime, state);
		}
		this.renderButtons(context);
	}

	renderButtons(context: CanvasRenderingContext2D) {
		for(let row of this.buttons) {
			row.draw(context, this.mousePosition);
		}
	}

	recalculateTabSize() {
		this.buildingMenuHeight = 60 + Math.max(300, this.tabWidth * this.tabs.length);
		if (this.tab  != undefined) {
			const tab = this.tabs[this.tab];
			tab.updateButtons(this.canvasSize, this.menuWidth - this.tabWidth, this.buildingMenuHeight);
		}
	}

	calculateTabIcons() {
		for (let tab of this.tabs) {
			const buildingTab = tab;
			buildingTab.prepareIcon(this.tabWidth);
		}
	}

	mouseInsideInterface(position: Position): boolean {
		if (position.y <= this.topPanelHeight || position.x >= this.canvasSize.width - this.menuWidth) {
			return true;
		}
		if (this.buildingInterface && this.buildingInterface.inInterface(position)) {
			return true;
		}
		return false;
	}

	drawTopPanel(context: CanvasRenderingContext2D, state: GameState) {
		context.fillStyle = '#1f1f1f';
		context.fillRect(0, 0, this.canvasSize.width - this.menuWidth, this.topPanelHeight);

		context.fillStyle = 'white';
		context.font = '16px Arial';
		if(this.coinsIcon) {
			context.drawImage(this.coinsIcon, 50, 30 - 15, this.coinsIconSize.width, this.coinsIconSize.height);
			context.fillText(`${state.money}`, 75, 30);
		} else {
			context.fillText(`Gold: ${state.money}`, 50, 30);
		}
		if(this.populationIcon) {
			context.drawImage(this.populationIcon, 200, 30 - 15, this.populationIconSize.width, this.populationIconSize.height);
			context.fillText(`${state.population}`, 225, 30);
		} else {
			context.fillText(`Population: ${state.population}`, 200, 30);
		}
	}

	drawMenu(context: CanvasRenderingContext2D) {
		context.fillStyle = '#1f1f1f';
		context.fillRect(this.canvasSize.width - this.menuWidth, 0, this.menuWidth, this.canvasSize.height);
	}

	renderDialogueBox(context: CanvasRenderingContext2D, deltaTime: number) {
		if(!this.dialogue) {
			return;
		}
		const dialogueWidth = this.canvasSize.width - 20 - this.menuWidth;
		const dialogueHeight = 100;
		const dialogueX = 10;
		const dialogueY = this.canvasSize.height - dialogueHeight - 10;

		context.fillStyle = '#444';
		context.fillRect(dialogueX, dialogueY, dialogueWidth, dialogueHeight);

		context.strokeStyle = '#fff';
		context.strokeRect(dialogueX, dialogueY, dialogueWidth, dialogueHeight);

		context.fillStyle = '#fff';
		context.font = '16px Arial';
		let y = dialogueY + 30;
		for (let line of this.dialogue.toPrint) {
			if (this.dialogue.portrait && y <= dialogueY + 50) {
				context.fillText(line, dialogueX + 110, y);
			} else {
				context.fillText(line, dialogueX + 10, y);
			}
			y += 20;
		}
		if(this.dialogue.portrait) {
			context.drawImage(this.dialogue.portrait, dialogueX, dialogueY-50, 100, 100);

			context.beginPath();
			context.arc(dialogueX + 50, dialogueY, 50, 0, 2 * Math.PI);
			context.stroke();
		}
		this.dialogue.updateTime(deltaTime);
	}

	wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number, lineHeight: number, portrait: boolean): string[] {
		const words = text.split(' ');
		let line = '';
		let testLine;
		let metrics;
		let testWidth;
		let lines = [];

		context.font = '16px Arial';
		let realWidth = portrait ? maxWidth - 100 : maxWidth;
		let y = 0;
		for (let n = 0; n < words.length; n++) {
			testLine = line + words[n] + ' ';
			metrics = context.measureText(testLine);
			testWidth = metrics.width;
			if (testWidth > realWidth && n > 0) {
				lines.push(line);
				line = words[n] + ' ';
				y += lineHeight;
				realWidth = portrait && y <= 20 ? maxWidth - 110 : maxWidth;
			} else {
				line = testLine;
			}
		}
		lines.push(line);
		return lines;
	}

	setDialogue(context: CanvasRenderingContext2D, dialogue: Dialogue) {
		const dialogueWidth = this.canvasSize.width - 20 - this.menuWidth;
		const text = this.wrapText(context, dialogue.text, dialogueWidth - 20, 20, dialogue.portrait != undefined);
		this.dialogue = new DialogueParsed(text, dialogue.portrait);
	}

	closeDialogue() {
		this.dialogue = undefined;
	}

	dialogueAction() {
		if(!this.dialogue) {
			return;
		}
		if(this.dialogue.printed) {
			this.closeDialogue();
		} else {
			this.dialogue.skipAnimation();
		}
	}

	hasDialogue(): boolean {
		return this.dialogue == undefined;
	}

	drawTabs(context: CanvasRenderingContext2D) {
		const start = 60;
		const tabSize = this.tabWidth;
		for(let i = 0; i<this.tabs.length; i++) {
			const hover = this.inTab(this.mousePosition, i);
			const currentTab = i == this.tab;
			const tab = this.tabs[i];
			let icon = tab.icon;

			if(hover && currentTab) {
				icon = tab.hoverIcon;
			} else if(hover && !currentTab) {
				icon = tab.inactiveHoverIcon;
			} else if(!currentTab) {
				icon = tab.inactiveIcon;
			} 
			context.drawImage(icon, this.canvasSize.width - this.menuWidth, start + i*tabSize);
		}
	}

	getTabUnderCursor(position: Position): number | undefined {
		for(let i = 0; i<this.tabs.length; i++) {
			if(this.inTab(position, i)) {
				return i;
			}
		}
		return undefined;
	}

	inTab(position: Position, tab: number): boolean {
		const start = 60;
		const x = this.canvasSize.width - this.menuWidth;
		const y = start + tab*this.tabWidth;
		const x2 = x + this.tabWidth;
		const y2 = y + this.tabWidth;
		if(position.x < x || position.x > x2) {
			return false;
		}
		if(position.y < y || position.y > y2) {
			return false;
		}
		return true;
	}

	click(position: Position): Action | undefined { // TODO
		if (this.buildingInterface) {
			if (this.buildingInterface.inInterface(position)) {
				return this.buildingInterface.click(position);
			} else {
				this.buildingInterface = undefined;
			}
		}
		const tab = this.getTabUnderCursor(position);
		if (tab != undefined) {
			this.tab = tab;
			this.recalculateTabSize();
			return undefined;
		}
		if(this.tab != undefined) {
			const tab = this.tabs[this.tab];
			let result = tab.buttonAt(position);
			if(result != undefined) {
				return result;
			}

			const action = tab.navButtonAt(position);
			if (action && action.action == "page") {
				if (action.argument == "next") {
					tab.toNextPage();
				} else {
					tab.toPrevPage();
				}
			} 
		}
		for(let row of this.buttons) {
			const action = row.buttonAt(position);
			if (action) {
				return action;
			}
		}

		return undefined;
	}
}

export class ActionButton implements Button {
	_image: HTMLImageElement;
	action: Action;
	hover: boolean = false;
	position: Position = {x: 0, y: 0};
	size: Size;

	image: OffscreenCanvas;
	context: OffscreenCanvasRenderingContext2D;
	hoverImage: OffscreenCanvas;
	hoverContext: OffscreenCanvasRenderingContext2D;

	constructor(image: HTMLImageElement, action: Action, size: Size) {
		this._image = image;
		this.action = action;
		this.size = size;
		this.image = new OffscreenCanvas(size.width, size.height);
		this.context = this.image.getContext("2d")!; // TODO
		this.hoverImage = new OffscreenCanvas(size.width, size.height);
		this.hoverContext = this.hoverImage.getContext("2d")!; // TODO
		this.drawImage();
		this.drawHoverImage();
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
		this.context.drawImage(this._image, 0, 0, this.size.width, this.size.height);
	}

	drawHoverImage(): void {
		this.hoverContext.filter = "brightness(140%)";
		this.hoverContext.drawImage(this._image, 0, 0, this.size.width, this.size.height);
	}

	getClickAction(): Action | undefined {
		return this.action;
	}
	
	draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, hovered: boolean): void {
		const image = hovered ? this.hoverImage : this.image;
		context.drawImage(image, this.position.x, this.position.y, this.size.width, this.size.height);
	}
}

export class ButtonRow implements ButtonContainer {
	buttons: Button[] = [];
	y: number = 0;

	constructor(y: number, buttons: Button[]) {
		this.y = y;
		this.buttons = buttons;
	}

	calculateButtonRow(menuWidth: number, canvasWidth: number) {
		const gap = 20;
		let size = 0;
		for(let button of this.buttons) {
			size += button.size.width;
		}
		size += (this.buttons.length - 1) * gap;
		const padding = Math.floor((menuWidth - size)/2)
		let x = padding + canvasWidth - menuWidth;
		for(let button of this.buttons) {
			button.position.x = x;
			button.position.y = this.y;
			x += button.size.width + gap;
		}
	}

	draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, mousePosition: Position) {
		for(let button of this.buttons) {
			const hover = button.inButton(mousePosition);
			button.draw(context, hover);
		}
	}

	buttonAt(position: Position): Action | undefined {
		for (let i=0; i<this.buttons.length; i++) {
			if (this.buttons[i].inButton(position)) {
				return this.buttons[i].getClickAction();
			}
		}
		return undefined;
	}
}

