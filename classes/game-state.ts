import { Actor } from "./actor.js";
import { BattleActor } from "./battle/actor.js";
import { Battle } from "./battle/battle.js";
import { MapData } from "./game.js";
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
	public money: number = 5000;
	public population: number = 10;
	public currentBattle?: Battle;

	public tempBattleData?: MapData;

	// TODO: controlled by specific building
	public team: BattleActor[] = [];
	public allHeroes: BattleActor[] = [];

	sortPedestrians() {
		this.pedestrians.sort((a, b) => {
			return a.diagonal - b.diagonal;
		});
	}
}
