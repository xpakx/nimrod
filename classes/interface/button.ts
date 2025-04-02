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
