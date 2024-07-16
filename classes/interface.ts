import { BuildingSprite } from "./buildings.js";
import { Position, Size } from "./map-layer.js";

export class InterfaceLayer {
	canvasSize: Size = {width: 0, height: 0};
	menuWidth = 420;
	tabWidth = 65;
	topPanelHeight = 50;
	dialogue: DialogueParsed | undefined = undefined;
	tab: number | undefined = undefined;
	tabImg: HTMLImageElement | undefined = undefined;
	tabs: BuildingTab[] = [];
	populationIcon: HTMLImageElement | undefined = undefined;
	coinsIcon: HTMLImageElement | undefined = undefined;
	coinsIconSize: Size = {width: 0, height: 0};
	populationIconSize: Size = {width: 0, height: 0};

	constructor(canvasSize: Size) {
		this.canvasSize.height = canvasSize.height;
		this.canvasSize.width = canvasSize.width;
	}

	onMouse(position: Position) {
		if(this.tab != undefined) {
			this.tabs[this.tab].onMouse(position);
		}
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

	renderInterface(context: CanvasRenderingContext2D, _deltaTime: number) {
		this.drawTopPanel(context);
		this.drawMenu(context);
		this.drawTabButtons(context);
		this.drawTabs(context);
		this.renderDialogueBox(context);
		if (this.tab  != undefined) {
			this.tabs[this.tab].draw(context);
		}
	}

	recalculateTabSize() {
		if (this.tab  != undefined) {
			this.tabs[this.tab].prepareButtons(this.canvasSize, this.menuWidth - this.tabWidth);
		}
	}

	mouseInsideInterface(position: Position): boolean {
		if (position.y <= this.topPanelHeight || position.x >= this.canvasSize.width - this.menuWidth) {
			return true;
		}
		return false;
	}

	drawTopPanel(context: CanvasRenderingContext2D) {
		context.fillStyle = '#1f1f1f';
		context.fillRect(0, 0, this.canvasSize.width - this.menuWidth, this.topPanelHeight);

		context.fillStyle = 'white';
		context.font = '16px Arial';
		if(this.coinsIcon) {
			context.drawImage(this.coinsIcon, 50, 30 - 15, this.coinsIconSize.width, this.coinsIconSize.height);
			context.fillText('1000', 75, 30);
		} else {
			context.fillText('Gold: 1000', 50, 30);
		}
		if(this.populationIcon) {
			context.drawImage(this.populationIcon, 200, 30 - 15, this.populationIconSize.width, this.populationIconSize.height);
			context.fillText('1000', 225, 30);
		} else {
			context.fillText('Population: 1000', 200, 30);
		}
	}

	drawMenu(context: CanvasRenderingContext2D) {
		context.fillStyle = '#1f1f1f';
		context.fillRect(this.canvasSize.width - this.menuWidth, 0, this.menuWidth, this.canvasSize.height);
	}

	drawTabButtons(context: CanvasRenderingContext2D) {
		// TODO
	}

	renderDialogueBox(context: CanvasRenderingContext2D) {
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
		for (let line of this.dialogue.text) {
			context.fillText(line, dialogueX + 10, y);
			y += 20;
		}
	}

	wrapText(context: CanvasRenderingContext2D, text: string, y: number, maxWidth: number, lineHeight: number): string[] {
		const words = text.split(' ');
		let line = '';
		let testLine;
		let metrics;
		let testWidth;
		let lines = [];

		context.font = '16px Arial';
		for (let n = 0; n < words.length; n++) {
			testLine = line + words[n] + ' ';
			metrics = context.measureText(testLine);
			testWidth = metrics.width;
			if (testWidth > maxWidth && n > 0) {
				lines.push(line);
				line = words[n] + ' ';
				y += lineHeight;
			} else {
				line = testLine;
			}
		}
				lines.push(line);
				return lines;
	}

	setDialogue(context: CanvasRenderingContext2D, dialogue: Dialogue) {
		const dialogueWidth = this.canvasSize.width - 20 - this.menuWidth;
		const dialogueHeight = 100;
		const dialogueY = this.canvasSize.height - dialogueHeight - 10;
		const text = this.wrapText(context, dialogue.text, dialogueY + 30, dialogueWidth - 20, 20);
		this.dialogue = {text: text, portrait: dialogue.portrait};
	}

	closeDialogue() {
		this.dialogue = undefined;
	}

	hasDialogue(): boolean {
		return this.dialogue == undefined;
	}

	drawTabs(context: CanvasRenderingContext2D) {
		const start = 60;
		const tabSize = this.tabWidth;
		for(let i = 0; i<this.tabs.length; i++) {
			if(this.tabImg) {
				context.drawImage(this.tabImg, this.canvasSize.width - this.menuWidth, start + i*tabSize, tabSize, tabSize);
			}
			if(i != this.tab) {
				context.save()
				context.filter = "grayscale(80%)";
			}
			context.drawImage(this.tabs[i].icon, this.canvasSize.width - this.menuWidth + 5, start + i*tabSize + 5, tabSize - 10, tabSize - 10);
			if (i != this.tab) {
				context.restore();
				context.strokeStyle = "#343434";
				context.beginPath();
				context.moveTo(this.canvasSize.width - this.menuWidth + this.tabWidth, start + i*tabSize);
				context.lineTo(this.canvasSize.width - this.menuWidth + this.tabWidth, start + (i+1)*tabSize);
				context.stroke();
			}
		}
	}
}

export interface Dialogue {
	text: string,
	portrait: HTMLImageElement | undefined,
}

export interface DialogueParsed {
	text: string[],
	portrait: HTMLImageElement | undefined,
}

export class BuildingButton {
	image: BuildingSprite;
	name: string;
	hover: boolean = false;
	positon: Position = {x: 0, y: 0};
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
	icon: HTMLImageElement;
	active: boolean = false;
	itemOffset: number = 0;
	activeButtons: BuildingButton[] = [];
	defaultButtonSize = 125;
	buttonSize = this.defaultButtonSize;
	mousePosition: Position = {x: -1, y: -1};

	constructor(name: string, buildings: BuildingButton[], icon: HTMLImageElement) {
		this.name = name;
		this.buildings = buildings;
		this.icon = icon;
	}

	prepareButtons(canvasSize: Size, menuWidth: number) {
		this.activeButtons = [];
		const menuPadding = 20;
		this.buttonSize = this.defaultButtonSize < menuWidth - menuPadding ? this.defaultButtonSize : menuWidth - menuPadding;
		const buttonPadding = 20;
		const buttonMargin = 10;
		const buildingSize = this.buttonSize - 2 * buttonPadding;
		const tabEnd = canvasSize.height

		let yStart = canvasSize.width - menuWidth + menuPadding;
		let yMax = canvasSize.width - menuPadding;
		let currentYOffet = 0;
		let currentXOffet = 0;

		for(let i = this.itemOffset; i<this.buildings.length; i++) {
			let currentY = yStart + currentYOffet * (this.buttonSize + buttonMargin);
			let currentX = 60 + currentXOffet * (this.buttonSize + buttonMargin);
			if(currentY + this.buttonSize >= yMax) {
				currentYOffet = 0;
				currentXOffet += 1;
				currentY = yStart + currentYOffet * (this.buttonSize + buttonMargin);
				currentX = 60 + currentXOffet * (this.buttonSize + buttonMargin);
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
			this.buildings[i].positon.x = currentX;
			this.buildings[i].positon.y = currentY;
			this.buildings[i].imgPosition.x = currentX + buttonPadding + paddingHeight;
			this.buildings[i].imgPosition.y = currentY + paddingWidth + buttonPadding;
			this.buildings[i].imgSize.width = buildingWidth;
			this.buildings[i].imgSize.height = buildingHeight;
			
			this.activeButtons.push(this.buildings[i]);

			currentYOffet += 1;
			if (60 + (1 + currentXOffet) * (this.buttonSize + buttonMargin) >= tabEnd) {
				return;
			}
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
		if(positon.x < button.position.x || position.x > button.position.x + this.buttonSize) {
			return false;
		}
		if(position.y < button.position.y || position.y > button.position.y + this.buttonSize) {
			return false;
		}
		return true;
	}
}
