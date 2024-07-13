import { Size } from "./map-layer.js";

export class InterfaceLayer {
	canvasSize: Size = {width: 0, height: 0};
	menuWidth = 200;

	constructor(canvasSize: Size) {
		this.canvasSize.height = canvasSize.height;
		this.canvasSize.width = canvasSize.width;
	}

	renderInterface(context: CanvasRenderingContext2D, _deltaTime: number) {
		this.drawTopPanel(context);
		this.drawMenu(context);
		this.drawButtons(context);
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
}
