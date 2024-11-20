import { Actor } from "./actor";
import { Position } from "./map-layer";

export type View = "City" | "World" | "Battle" | "Kingdom" | "Menu";

export class GameState {
	public canvasWidth = 1200;
	public canvasHeight = 800;
	public pedestrians: Actor[] = [];
	public playerMouse: Position = {x: 0, y: 0};
	public view: View = "City";

	sortPedestrians() {
		this.pedestrians.sort((a, b) => {
			return a.diagonal - b.diagonal;
		});
	}
}
