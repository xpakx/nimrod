import { BattleActor } from "../battle/actor.js";
import { BuildingInterface } from "../building/buildings.js";
import { Quest } from "../quest.js";

export interface BuildAction {
	action: "build" | "buildRoad" | "delete";
	argument: string | undefined;
}

export interface NavAction {
	action: "goTo";
	argument: "World" | "Kingdom" | "City" | "Battle";
}

export interface OpenBuilding {
	action: "open";
	interface: BuildingInterface;
}

export interface TeamAction {
	action: "removeHero" | "addHero";
	hero: BattleActor;
}

export interface PageAction {
	action: "page";
	argument: "next" | "prev";
}

export interface RegiestQuestAction {
	action: "registerQuest";
	map: "city" | "battle";
	quest: Quest;
}

export type Action = NavAction | BuildAction | OpenBuilding | TeamAction | PageAction
| RegiestQuestAction;
