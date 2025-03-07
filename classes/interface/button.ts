import { Action } from "./interface.js";
import { Position, Size } from "../map-layer.js";

export interface Button {
	image: OffscreenCanvas;
	context: OffscreenCanvasRenderingContext2D;
	hover: boolean;
	position: Position;
	size: Size;

	inButton(position: Position): boolean;
	drawImage(): void;
	getClickAction(): Action | undefined;
}

export interface ButtonContainer {
	buttons: Button[];
	draw(context: OffscreenCanvasRenderingContext2D): void;
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
	navButtonAt(position: Position): number;
}
