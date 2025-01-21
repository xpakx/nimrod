import { Actor } from "./actor.js";
import { BattleActor } from "./battle/actor.js";
import { Battle } from "./battle/battle.js";
import { BattleMapData } from "./game.js";
import { Position } from "./map-layer.js";

export type View = "City" | "World" | "Battle" | "Kingdom" | "Menu";

export class GameState {
	public canvasWidth = 1200;
	public canvasHeight = 800;
	public pedestrians: Actor[] = [];
	public playerMouse: Position = {x: 0, y: 0};
	public view: View = "City";

	public moveLeft = false; 
	public moveRight = false; 
	public moveUp = false; 
	public moveDown = false; 

	public debugMode = false;
	public prevTimestamp = 0;
	public dts: number[] = [];
	public money: number = 500;
	public population: number = 0;
	public maxPopulation: number = 0;
	public currentBattle?: Battle;

	public tempBattleData?: BattleMapData;

	// TODO: controlled by specific building
	public team: BattleActor[] = [];
	public allHeroes: BattleActor[] = [];

	sortPedestrians() {
		this.pedestrians.sort((a, b) => {
			return a.diagonal - b.diagonal;
		});
	}

	insertPedestrian(pedestrian: Actor) {
		let low = 0, high = this.pedestrians.length;
		while (low < high) {
			const mid = Math.floor((low + high) / 2)
			if (this.pedestrians[mid].diagonal < pedestrian.diagonal) {
				low = mid + 1;
			} else {
				high = mid;
			}
		}
		this.pedestrians.splice(low, 0, pedestrian);
	}
}
