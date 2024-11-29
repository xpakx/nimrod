import { Position } from "../map-layer";
import { BattleActor } from "./actor";

export class Battle {
	public battleStarted = false;
	public selectedTile?: Position;
	public selectedActor?: BattleActor;
}
