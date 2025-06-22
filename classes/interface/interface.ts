import { BattleActor } from "../battle/actor.js";
import { BuildingInterface } from "../building/buildings.js";
import { GameState } from "../game-state.js";
import { Position, Size } from "../map-layer.js";
import { Action } from "./actions.js";
import { BattleSidebar } from "./battle-sidebar.js";
import { Button, ButtonContainer } from "./button.js";
import { DialogueManager } from "./dialogue-manager.js";
import { Dialogue } from "./dialogue.js";
import { Sidebar } from "./sidebar.js";

export class InterfaceLayer {
	canvasSize: Size = {width: 0, height: 0};
	menuWidth: number;
	tabWidth = 65;
	topPanelHeight: number;
	populationIcon: HTMLImageElement | undefined = undefined;
	coinsIcon: HTMLImageElement | undefined = undefined;
	coinsIconSize: Size = {width: 0, height: 0};
	populationIconSize: Size = {width: 0, height: 0};
	mousePosition = {x: -1, y: -1};

	buildingMenuHeight = 300;

	buttons: ButtonContainer[] = [];

	buildingInterface: BuildingInterface | undefined = undefined;

	dialogueManager: DialogueManager = new DialogueManager();

	sidebar: Sidebar | undefined;
	sidebars: Map<string, Sidebar> = new Map();

	constructor(canvasSize: Size, menuWidth: number, topPanelHeight: number) {
		this.canvasSize = canvasSize;
		this.menuWidth = menuWidth;
		this.topPanelHeight = topPanelHeight;
		this.dialogueManager.canvasSize = canvasSize;
		this.dialogueManager.menuWidth = menuWidth;
	 }

	 updateSize() {
		 this.calculateIconsSize();
		 if (this.sidebar) {
			 this.sidebar.updateSize();
			 this.buildingMenuHeight = this.sidebar.size.height;
		 }
		 this.calculateTabIcons();
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
		this.sidebar?.draw(context, this.mousePosition, deltaTime);
		this.dialogueManager.renderDialogueBox(context, deltaTime);
		this.buildingInterface?.drawInterface(context, deltaTime, state);
		this.renderButtons(context);
	}

	renderButtons(context: CanvasRenderingContext2D) {
		for(let row of this.buttons) {
			row.draw(context, this.mousePosition);
		}
	}

	calculateTabIcons() {
		const sidebar = this.sidebars.get("city");
		if (!sidebar) return;
		for (let tab of sidebar.tabs) {
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

	click(position: Position): Action | undefined {
		if (this.buildingInterface) {
			if (this.buildingInterface.inInterface(position)) {
				return this.buildingInterface.click(position);
			} else {
				this.buildingInterface = undefined;
			}
		}
		const sidebarAction = this.sidebar?.click(position);
		if (sidebarAction) return sidebarAction;
		for(let row of this.buttons) {
			const action = row.buttonAt(position);
			if (action) {
				return action;
			}
		}

		return undefined;
	}

	toBattleMode(heroes: BattleActor[], icons: any) {
		console.log("Battle mode activated")
		const battleSidebar = this.sidebars.get("battle") as BattleSidebar | undefined;
		if (!battleSidebar) return;
		const tabImg = this.getTabIcon();
		battleSidebar.loadBattle(heroes, icons, tabImg);
		this.sidebar = battleSidebar;
	}

	// TODO: temporary workaround
	getTabIcon() {
		const sidebar = this.sidebars.get("city");
		if (!sidebar) return;
		return sidebar.tabs[0].tabImg;;
	}

	 registerSidebar(name: string, sidebar: Sidebar) {
		 this.sidebars.set(name, sidebar);
	 }

	 changeSidebar(name: string) {
		 const newSidebar = this.sidebars.get(name);
		 if (newSidebar) {
			 this.sidebar = newSidebar;
			 this.sidebar.tab = 0;
			 if (this.sidebar.tabs.length == 0) this.sidebar.tab = undefined;
		 }
	 }

	addButtonRowToSidebar(name: string, row: ButtonRow) {
		const sidebar = this.sidebars.get(name);
		if (!sidebar) return;
		sidebar.addButtonRow(row);
	}

	clearSidebarButtons(name: string) {
		const sidebar = this.sidebars.get(name);
		if (!sidebar) return;
		sidebar.clearButtons();
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
		this.context = this.image.getContext("2d")!;
		this.hoverImage = new OffscreenCanvas(size.width, size.height);
		this.hoverContext = this.hoverImage.getContext("2d")!;
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

