import { BattleActor } from "../battle/actor.js";
import { Skill } from "../battle/skill/skill.js";
import { BuildingInterface } from "../building/buildings.js";
import { Quest } from "../quest.js";
import { BattleMapData } from "../save-manager.js";

export interface BuildAction {
	action: "build" | "buildRoad" | "delete";
	argument: string | undefined;
}

export interface NavAction {
	action: "goTo";
	argument: "World" | "Kingdom" | "City";
	map?: BattleMapData;
}

export interface OpenBattleAction {
	action: "openBattle";
	map: BattleMapData;
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

export interface RegisterQuestAction {
	action: "registerQuest";
	map: "city" | "battle";
	quest: Quest;
}

export interface BattleHeroAction {
	action: "selectHero";
	hero: BattleActor;
}

export interface BattleSkillAction {
	action: "selectSkill";
	skill: Skill;
}

export type Action = NavAction | OpenBattleAction | BuildAction | OpenBuilding | TeamAction | PageAction
| RegisterQuestAction | BattleHeroAction | BattleSkillAction;
