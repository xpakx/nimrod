import { BattleActor } from "../battle/actor.js";
import { BuildingInterface } from "../building/buildings.js";
import { GameState } from "../game-state.js";
import { Position, Size } from "../map-layer.js";
import { Action } from "./actions.js";
import { BattleTab } from "./battle-tab.js";
import { BuildingTab } from "./building-tab.js";
import { Button, ButtonContainer } from "./button.js";
import { DialogueManager } from "./dialogue-manager.js";
import { Dialogue, DialogueParsed } from "./dialogue.js";

export class InterfaceLayer {
	canvasSize: Size = {width: 0, height: 0};
	menuWidth: number;
	tabWidth = 65;
	topPanelHeight: number;
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

	battleTabs: BattleTab[] = [];
	battleMode: boolean = false;

	dialogueManager: DialogueManager = new DialogueManager();

	constructor(canvasSize: Size, menuWidth: number,  topPanelHeight: number) {
		this.canvasSize = canvasSize;
		this.menuWidth = menuWidth;
		this.topPanelHeight = topPanelHeight;
		this.dialogueManager.canvasSize = canvasSize;
		this.dialogueManager.menuWidth = menuWidth;
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

	renderCurrentTab(context: CanvasRenderingContext2D, _deltaTime: number) {
		if (this.tab == undefined) return;
		const tabs = this.battleMode ? this.battleTabs : this.tabs;
		if (this.tab >= tabs.length) return;
		tabs[this.tab].draw(context, this.mousePosition);
	}

	renderInterface(context: CanvasRenderingContext2D, deltaTime: number, state: GameState) {
		this.drawTopPanel(context, state);
		this.drawMenu(context);
		this.drawTabs(context);
		this.dialogueManager.renderDialogueBox(context, deltaTime);
		this.renderCurrentTab(context, deltaTime);
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

	resizeTabs() {
		this.buildingMenuHeight = 60 + Math.max(300, this.tabWidth * this.tabs.length);
		for (let tab of this.tabs) {
			this.resizeTab(tab);
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

	setDialogue(context: CanvasRenderingContext2D, dialogue: Dialogue) {
		const dialogueWidth = this.canvasSize.width - 20 - this.menuWidth;
		this.dialogueManager.setDialogue(context, dialogue, dialogueWidth);
	}

	closeDialogue() {
		this.dialogueManager.closeDialogue();
	}

	dialogueAction() {
		this.dialogueManager.dialogueAction();
	}

	hasDialogue(): boolean {
		return this.dialogueManager.hasDialogue();
	}

	drawTabs(context: CanvasRenderingContext2D) {
		const tabs = this.battleMode ? this.battleTabs : this.tabs;
		const start = 60;
		const tabSize = this.tabWidth;
		for(let i = 0; i<tabs.length; i++) {
			const hover = this.inTab(this.mousePosition, i);
			const currentTab = i == this.tab;
			const tab = tabs[i];
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
		const tabs = this.battleMode ? this.battleTabs : this.tabs;
		for(let i = 0; i<tabs.length; i++) {
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
			return undefined;
		}
		if(this.tab != undefined) {
			const tabs = this.battleMode ? this.battleTabs : this.tabs;
			const tab = tabs[this.tab];
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

	toBattleMode(heroes: BattleActor[], icons: any) {
		// TODO: populate main tab with heroes
		console.log("Battle mode activated")
		const icon = icons["kingdom"]; // TODO: add icon
		const tabIcon = icons["tab"];
		
		this.battleTabs[0] = new BattleTab("Heroes", icon, tabIcon);
		this.battleTabs[0].setHeroes(heroes);
		this.resizeTab(this.battleTabs[0]);
		this.battleMode = true;
		this.tab = 0;
	}

	toMapMode() {
		console.log("Map mode activated")
		this.battleMode = false;
		this.tab = 0;
	}

	resizeTab(tab: BattleTab | BuildingTab) {
		const menuPadding = 20;
		const menuWidth = this.menuWidth - this.tabWidth;
		tab.buttonSize = tab.defaultButtonSize < menuWidth - menuPadding ? tab.defaultButtonSize : menuWidth - menuPadding;

		tab.position.x = this.canvasSize.width - menuWidth + menuPadding;
		tab.position.y = 60;
		tab.size.width = menuWidth - 2*menuPadding;
		tab.size.height = this.buildingMenuHeight;
		tab.prepareButtons();
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

