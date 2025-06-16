import { Size } from "../map-layer.js";
import { Dialogue, DialogueParsed } from "./dialogue.js";

export class DialogueManager {
	dialogue: DialogueParsed | undefined = undefined;
	canvasSize: Size = {width: 0, height: 0};
	menuWidth: number = 0;

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

	setDialogue(context: CanvasRenderingContext2D, dialogue: Dialogue, dialogueWidth: number) {
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
}
