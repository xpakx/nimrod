import { BuildingSprite } from "./buildings.js";
import { Size } from "./map-layer.js";

export class InterfaceLayer {
	canvasSize: Size = {width: 0, height: 0};
	menuWidth = 400;
	dialogue: DialogueParsed | undefined = undefined;
	tab: number | undefined = undefined;
	tabs: BuildingTab[] = [];
	populationIcon: HTMLImageElement | undefined = undefined;
	coinsIcon: HTMLImageElement | undefined = undefined;

	constructor(canvasSize: Size) {
		this.canvasSize.height = canvasSize.height;
		this.canvasSize.width = canvasSize.width;
	}

	renderInterface(context: CanvasRenderingContext2D, _deltaTime: number) {
		this.drawTopPanel(context);
		this.drawMenu(context);
		this.drawTabButtons(context);
		this.renderDialogueBox(context);
		if (this.tab  != undefined) {
			this.tabs[this.tab].draw(context, this.canvasSize, this.menuWidth);
		}
	}

	drawTopPanel(context: CanvasRenderingContext2D) {
		context.fillStyle = '#1f1f1f';
		context.fillRect(0, 0, this.canvasSize.width - this.menuWidth, 50);

		context.fillStyle = 'white';
		context.font = '16px Arial';
		if(this.coinsIcon) {
			context.drawImage(this.coinsIcon, 50, 30 - 15, 20, 20);
			context.fillText('1000', 75, 30);
		} else {
			context.fillText('Gold: 1000', 50, 30);
		}
		if(this.populationIcon) {
			context.drawImage(this.populationIcon, 200, 30 - 15, 20, 20);
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
}

export interface Dialogue {
	text: string,
	portrait: HTMLImageElement | undefined,
}

export interface DialogueParsed {
	text: string[],
	portrait: HTMLImageElement | undefined,
}

export interface BuildingButton {
	image: BuildingSprite,
	name: string,
	hover: boolean,
}

export class BuildingTab {
	name: string;
	buildings: BuildingButton[];
	icon: HTMLImageElement;
	active: boolean = false;
	itemOffset: number = 0;

	constructor(name: string, buildings: BuildingButton[], icon: HTMLImageElement) {
		this.name = name;
		this.buildings = buildings;
		this.icon = icon;
	}

	draw(context: CanvasRenderingContext2D, canvasSize: Size, menuWidth: number) {
		const menuPadding = 20;
		const buttonSize = 150;
		const buttonPadding = 20;
		const buttonMargin = 10;
		const buildingSize = buttonSize - 2 * buttonPadding;
		const tabEnd = canvasSize.height

		let yStart = canvasSize.width - menuWidth + menuPadding;
		let yMax = canvasSize.width - menuPadding;
		let currentYOffet = 0;
		let currentXOffet = 0;

		for(let i = this.itemOffset; i<this.buildings.length; i++) {
			let currentY = yStart + currentYOffet * (buttonSize + buttonMargin);
			let currentX = 60 + currentXOffet * (buttonSize + buttonMargin);
			if(currentY + buttonSize >= yMax) {
				currentYOffet = 0;
				currentXOffet += 1;
				currentY = yStart + currentYOffet * (buttonSize + buttonMargin);
				currentX = 60 + currentXOffet * (buttonSize + buttonMargin);
			}

			context.fillStyle = '#1a1a1a';
			context.fillRect(currentY, currentX, buttonSize, buttonSize);

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
			
			context.save();
			context.filter = "grayscale(40%)";
			context.drawImage(this.buildings[i].image.image, currentY + paddingWidth + buttonPadding, buttonPadding + currentX + paddingHeight, buildingWidth, buildingHeight);
			context.restore();

			currentYOffet += 1;
			if (60 + (1 + currentXOffet) * (buttonSize + buttonMargin) >= tabEnd) {
				return;
			}
		}
	}
}
