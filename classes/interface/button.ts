import { Action } from "./actions.js";
import { Position, Size } from "../map-layer.js";

export interface Button {
	position: Position;
	size: Size;

	inButton(position: Position): boolean;
	drawImage(): void;
	getClickAction(): Action | undefined;

	draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, hovered: boolean): void;
}

export interface ButtonContainer {
	buttons: Button[];
	draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, mousePosition: Position): void;
	buttonAt(position: Position): Action | undefined;
}

export interface ButtonPane extends ButtonContainer {
	position: Position;
	size: Size;
	buttonGap: number;
	hasPrevPage(): boolean;
	hasNextPage(): boolean;
	toPrevPage(): void;
	toNextPage(): void;
	prepareButtons(): void;
	navButtonAt(position: Position): Action | undefined;
}

export function isPositionInArea(position: Position, areaPosition: Position, areaSize: Size): boolean {
	if(position.x < areaPosition.x || position.x > areaPosition.x + areaSize.width) {
		return false;
	}
	if(position.y < areaPosition.y || position.y > areaPosition.y + areaSize.height) {
		return false;
	}
	return true;
}


export interface CircularButton extends Button {
	imagePadding: number;

	getFillColor(): string;
	getBorderColor(): string;
}

export function drawCircularIcon(context: OffscreenCanvasRenderingContext2D, image: HTMLImageElement, button: CircularButton) {
	const size = button.size;
	const padding = button.imagePadding;

	context.fillStyle = button.getFillColor();
	context.beginPath();
	context.arc(size.width/2, size.width/2, size.width/2, 0, 2 * Math.PI);
	context.fill();

	context.drawImage(image, padding, padding, size.width - 2*padding, size.height - 2*padding);

	context.strokeStyle = button.getBorderColor();
	context.beginPath();
	context.arc(size.width/2, size.width/2, size.width/2, 0, 2 * Math.PI);
	context.stroke();
}
