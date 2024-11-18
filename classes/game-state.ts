import { Actor } from "./actor";
import { Position } from "./map-layer";

export class GameState {
	public canvasWidth = 1200;
	public canvasHeight = 800;
	public pedestrians: Actor[] = [];
	public playerMouse: Position = {x: 0, y: 0};

	sortPedestrians() {
		this.pedestrians.sort((a, b) => {
			return a.diagonal - b.diagonal;
		});
	}
}
