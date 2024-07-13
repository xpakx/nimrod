import { Size } from "./map-layer.js";

export class InterfaceLayer {
	canvasSize: Size = {width: 0, height: 0};
	menuWidth = 200;
	dialogue: DialogueParsed | undefined = undefined;

	constructor(canvasSize: Size) {
		this.canvasSize.height = canvasSize.height;
		this.canvasSize.width = canvasSize.width;
	}

	renderInterface(context: CanvasRenderingContext2D, _deltaTime: number) {
		this.drawTopPanel(context);
		this.drawMenu(context);
		this.drawButtons(context);
		this.renderDialogueBox(context);
	}

	drawTopPanel(context: CanvasRenderingContext2D) {
		context.fillStyle = '#1f1f1f';
		context.fillRect(0, 0, this.canvasSize.width - this.menuWidth, 50);

		context.fillStyle = 'white';
		context.font = '16px Arial';
		context.fillText('Gold: 1000', 50, 30);
		context.fillText('Population: 1000', 200, 30);
	}

	drawMenu(context: CanvasRenderingContext2D) {
		context.fillStyle = '#1f1f1f';
		context.fillRect(this.canvasSize.width - this.menuWidth, 0, this.menuWidth, this.canvasSize.height);
	}

	drawButtons(context: CanvasRenderingContext2D) {
		const buttonWidth = 150;
		const buttonHeight = 30;

		context.fillStyle = '#1a1a1a';
		context.fillRect(this.canvasSize.width - 180, 60, buttonWidth, buttonHeight);
		context.fillRect(this.canvasSize.width - 180, 100, buttonWidth, buttonHeight);

		context.fillStyle = 'white';
		context.font = '16px Arial';
		context.fillText('Button 1', this.canvasSize.width - 170, 80);
		context.fillText('Button 2', this.canvasSize.width - 170, 120);
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
}

export interface Dialogue {
	text: string,
	portrait: HTMLImageElement | undefined,
}

export interface DialogueParsed {
	text: string[],
	portrait: HTMLImageElement | undefined,
}
