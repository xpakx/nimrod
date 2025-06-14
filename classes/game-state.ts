import { Actor } from "./actor.js";
import { BattleActor } from "./battle/actor.js";
import { Battle } from "./battle/battle.js";
import { Position, Size } from "./map-layer.js";
import { QuestSnapshot } from "./quest-layer.js";

export type View = "City" | "World" | "Battle" | "Kingdom" | "Menu";

export class GameState {
	public canvasSize: Size = {width: 1200, height: 800};
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

	public team: BattleActor[] = [];
	public allHeroes: BattleActor[] = [];
	public spawnedHeroes: BattleActor[] = [];

	menuWidth = 420; // ???
	topPanelHeight = 50; // ????

	lastMonthSnapshot?: QuestSnapshot;
	lastYearSnapshot?: QuestSnapshot;

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

	getSnapshot(period: "year" | "month"): undefined | QuestSnapshot {
		return period == "month" ? this.lastMonthSnapshot : this.lastYearSnapshot;
	}
}
