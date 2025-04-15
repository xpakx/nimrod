import { Game } from "./game.js";
import { Position, Size } from "./map-layer.js";
import { QuestInterface } from "./quest-layer";

export interface CampaignData {
	map: string;
	visibleName: string;
	questMarkers: QuestMarkerConfig[];
	quests: QuestConfig[];
}

export interface QuestConfig {
	id: string;
	visibleName: string;
	description: string;
	questType: QuestType;
	// activate, check
	onCompletion?: (game: Game) => null;
	onFailure?: (game: Game) => null;
}

export interface QuestMarkerConfig extends QuestConfig {
	position: Position;
	size: Size;
	icon: string;
	interface?: QuestInterface | string;
}

export interface QuestSkirmish {
	type: "skirmish";
	map: string;
}

export interface QuestEconomic {
	type: "economic";
}

export type QuestType = QuestSkirmish | QuestEconomic;

export interface Quest {
	name: string;
	description: string;
	battle?: BattleQuest;
}

export interface BattleQuest {
	map: string;
}

