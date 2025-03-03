import { BuildingInterface, BuildingSprite } from "./buildings.js";
import { GameState } from "./game-state.js";
import { Position, Size } from "./map-layer.js";

export class InterfaceLayer {
	canvasSize: Size = {width: 0, height: 0};
	menuWidth = 420;
	tabWidth = 65;
	topPanelHeight = 50;
	dialogue: DialogueParsed | undefined = undefined;
	tab: number | undefined = undefined;
	tabs: BuildingTab[] = [];
	populationIcon: HTMLImageElement | undefined = undefined;
	coinsIcon: HTMLImageElement | undefined = undefined;
	coinsIconSize: Size = {width: 0, height: 0};
	populationIconSize: Size = {width: 0, height: 0};
	mousePosition = {x: -1, y: -1};

	buildingMenuHeight = 300;

	buttons: ButtonRow[] = [];

	buildingInterface: BuildingInterface | undefined = undefined;

	constructor(canvasSize: Size) {
		this.canvasSize = canvasSize;
	}

	onMouse(position: Position) {
		if(this.tab != undefined) {
			this.tabs[this.tab].onMouse(position);
		}
		this.mousePosition = position;
	}

	addButtonRow(row: ButtonRow) {
		this.buttons.push(row);
		this.calculateButtonRow(row);
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

	calculateButtonRow(row: ButtonRow) {
		const gap = 20;
		let size = 0;
		for(let button of row.buttons) {
			size += button.size.width;
		}
		size += (row.buttons.length - 1) * gap;
		const padding = Math.floor((this.menuWidth - size)/2)
		let x = padding + this.canvasSize.width - this.menuWidth;
		for(let button of row.buttons) {
			button.position.x = x;
			button.position.y = row.y;
			x += button.size.width + gap;
		}
	}

	renderInterface(context: CanvasRenderingContext2D, deltaTime: number, state: GameState) {
		this.drawTopPanel(context, state);
		this.drawMenu(context);
		this.drawTabs(context);
		this.renderDialogueBox(context, deltaTime);
		if (this.tab  != undefined) {
			this.tabs[this.tab].draw(context);
		}
		if (this.buildingInterface) {
			this.buildingInterface.drawInterface(context, deltaTime, state);
		}
		this.renderButtons(context);
	}

	renderButtons(context: CanvasRenderingContext2D) {
		for(let row of this.buttons) {
			for(let button of row.buttons) {
				const hover = this.inButton(this.mousePosition, button);
				if(hover) {
					context.save();
					context.filter = "brightness(140%)";
				} 
				context.drawImage(button.image, button.position.x, button.position.y, button.size.width, button.size.height);
				if(hover) {
					context.restore()
				}
			}
		}
	}

	inButton(position: Position, button: ActionButton): boolean {
		if(position.x < button.position.x || position.x > button.position.x + button.size.width) {
			return false;
		}
		if(position.y < button.position.y || position.y > button.position.y + button.size.height) {
			return false;
		}
		return true;
	}

	recalculateTabSize() {
		this.buildingMenuHeight = 60 + Math.max(300, this.tabWidth * this.tabs.length);
		if (this.tab  != undefined) {
			this.tabs[this.tab].prepareButtons(this.canvasSize, this.menuWidth - this.tabWidth, this.buildingMenuHeight);
		}
	}

	calculateTabIcons() {
		for (let tab of this.tabs) {
			tab.prepareIcon(this.tabWidth);
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
			let icon = this.tabs[i].icon;

			if(hover && currentTab) {
				icon = this.tabs[i].hoverIcon;
			} else if(hover && !currentTab) {
				icon = this.tabs[i].inactiveHoverIcon;
			} else if(!currentTab) {
				icon = this.tabs[i].inactiveIcon;
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
				return undefined;
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
			let result = this.tabs[this.tab].click(position);
			if(result != undefined) {
				return result;
			}
		}
		for(let row of this.buttons) {
			for(let button of row.buttons) {
				if(this.inButton(position, button)) {
					return button.action;
				}
			}
		}

		return undefined;
	}
}

export interface Dialogue {
	text: string,
	portrait: HTMLImageElement | undefined,
}

export class DialogueParsed {
	text: string[];
	portrait: HTMLImageElement | undefined;
	line: number = 0;
	letter: number = 0;
	counter: number = 0;
	printed: boolean = false;
	toPrint: string[] = [""];
	
	constructor(text: string[], portrait: HTMLImageElement | undefined) {
		this.text = text;
		this.portrait = portrait;
	}

	updateTime(deltaTime: number) {
		if(this.printed) {
			return;
		}

		this.counter += deltaTime;
		if (this.counter >= 0.05) {
			this.counter = 0;
			if(this.letter < this.text[this.line].length) {
				this.toPrint[this.line] += this.text[this.line][this.letter];
				this.letter += 1;
			} else {
				if(this.line + 1 < this.text.length) {
					this.letter = 0;
					this.line += 1;
					this.toPrint[this.line] += this.text[this.line][this.letter];
				} else {
					this.printed = true;
				}
			}
		}
	}

	skipAnimation() {
		this.toPrint = this.text;
		this.printed = true;
	}
}

export class BuildingButton {
	image: BuildingSprite;
	name: string;
	hover: boolean = false;
	position: Position = {x: 0, y: 0};
	imgPosition: Position = {x: 0, y: 0};
	imgSize: Size = {width: 0, height: 0};

	constructor(image: BuildingSprite, name: string) {
		this.image = image;
		this.name = name;
	}
}


export class BuildingTab {
	name: string;
	buildings: BuildingButton[];
	_icon: HTMLImageElement;
	active: boolean = false;
	itemOffset: number = 0;
	activeButtons: BuildingButton[] = [];
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
		const buttonPadding = 20;
		const buttonMargin = 10;
		const buildingSize = this.buttonSize - 2 * buttonPadding;

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

			let buildingWidth = this.buildings[i].image.size.width;
			let buildingHeight = this.buildings[i].image.size.height;
			if(buildingWidth > buildingHeight) {
				buildingHeight = buildingHeight*(buildingSize/buildingWidth);
				buildingWidth = buildingSize;
			} else {
				buildingWidth = buildingWidth*(buildingSize/buildingHeight);
				buildingHeight = buildingSize;
			}

			const paddingWidth = (buildingSize - buildingWidth) / 2
			const paddingHeight = (buildingSize - buildingHeight) / 2
			this.buildings[i].position.x = currentX;
			this.buildings[i].position.y = currentY;
			this.buildings[i].imgPosition.x = currentX + buttonPadding + paddingWidth;
			this.buildings[i].imgPosition.y = currentY + paddingHeight + buttonPadding;
			this.buildings[i].imgSize.width = buildingWidth;
			this.buildings[i].imgSize.height = buildingHeight;
			
			this.activeButtons.push(this.buildings[i]);

			currentXOffset += 1;
		}
	}

	draw(context: CanvasRenderingContext2D) {
		for(let button of this.activeButtons) {
			let hover = this.inButton(this.mousePosition, button);
			context.fillStyle = hover ? '#3a3a3a' : '#1a1a1a';
			context.fillRect(button.position.x, button.position.y, this.buttonSize, this.buttonSize);

			if(!hover) {
				context.save();
				context.filter = "grayscale(40%)";
			}
			context.drawImage(button.image.image, button.imgPosition.x, button.imgPosition.y, button.imgSize.width, button.imgSize.height);
			if(!hover) {
				context.restore();
			}
		}
	}

	onMouse(position: Position) {
		this.mousePosition = position;
	}

	inButton(position: Position, button: BuildingButton): boolean {
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
				return {action: "build", argument: button.name};
			}
		}
		return undefined;
	}
}

export class ActionButton {
	image: HTMLImageElement;
	action: Action;
	hover: boolean = false;
	position: Position = {x: 0, y: 0};
	size: Size;

	constructor(image: HTMLImageElement, action: Action, size: Size) {
		this.image = image;
		this.action = action;
		this.size = size;
	}
}

export interface ButtonRow {
	buttons: ActionButton[];
	y: number;
}


export interface BuildAction {
	action: "build" | "buildRoad" | "delete";
	argument: string | undefined;
}

export interface NavAction {
	action: "goTo";
	argument: "World" | "Kingdom" | "City" | "Battle";
}

export interface OpenBuilding {
	action: "open";
	interface: BuildingInterface;
}

export type Action = NavAction | BuildAction | OpenBuilding;
