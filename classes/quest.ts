import { Game } from "./game.js";
import { Position, Size } from "./map-layer.js";
import { QuestInterface } from "./quest-layer.js";

// Quest config
export interface CampaignData {
	map: string;
	visibleName: string;
	questMarkers: QuestMarkerConfig[];
	quests: QuestConfig[];
}

export interface QuestConfig {
	id: string;
	visibleName: string;
	questDefinition: Quest;
	// activate, check
	onCompletion?: (game: Game) => null;
	onFailure?: (game: Game) => null;
	rewards?: RewardConfig;
}

export interface QuestMarkerConfig extends QuestConfig {
	position: Position;
	size: Size;
	icon: string;
	interface?: QuestInterface | string;
}

// Quest 

export type Quest = BattleQuest | EconomicQuest;

export interface EconomicQuest {
	type: "economic";
	name: string;
	description: string;
	objectives: EconomicObjectives[];
}

export type EconomicObjectives = PopulationObjective | PopulationInHousesObjective 
| ProductionObjective | StoragesObjective | BuildingObjective | TradingPartnersObjective 
| TreasuryObjective | ProfitObjective | MilitaryPowerObjective | SpecialObjective;

// Population of X
export interface PopulationObjective {
	type: "population";
	amount: number;
}

// X people in Y house lvl or better
export interface PopulationInHousesObjective {
	type: "populationInHouses";
	amount: number;
	buildingType: string;
	level: number;
}

// Produce X of Y in one year
export interface ProductionObjective {
	type: "production";
	amount: number;
	resource: string;
	time: "year" | "month";
}

// X of Y in storages
// X of Y in storages set aside for Z
export interface StoragesObjective {
	type: "storages";
	amount: number;
	resource: string;
	for?: string;
}

// have X buildings Y
export interface BuildingObjective {
	type: "buildings";
	amount?: number;
	buildingType: string;
	level?: number;
}

// X trading partners
export interface TradingPartnersObjective {
	type: "tradingPartners";
	number: number;
}

// Treasury of X
export interface TreasuryObjective {
	type: "treasury";
	amount: number;
	for?: string;
}

// Yearly profit of X
export interface ProfitObjective {
	type: "profit";
	amount: number;
	time: "year" | "month";
}

// X warriors
export interface MilitaryPowerObjective {
	type: "militaryPower";
	amount: number;
	unitType?: string;
}

export type BattleQuest = SkirmishQuest | DungeonQuest | CityBattleQuest;

export interface BaseBattleQuest {
	type: "battle";
	name: string;
	description: string;
	objectives: BattleObjectives[];
}

export interface SkirmishQuest extends BaseBattleQuest {
	subtype: "skirmish";
	map: string;
}

export interface DungeonQuest extends BaseBattleQuest {
	subtype: "dungeon";
	maps: string[];
}

export interface CityBattleQuest extends BaseBattleQuest {
	subtype: "battle";
	map: string;
}

export type BattleObjectives = RoutObjective | SeizeObjective | BossObjective | DefendObjective 
| EscapeObjective | SpecialObjective;

export interface RoutObjective {
	type: "rout";
	turns?: number;
}

export interface SeizeObjective {
	type: "seize";
	building: string | Position;
	turns?: number;
}

export interface BossObjective {
	type: "boss";
	boss: string | Position;
	turns?: number;
}

export interface DefendObjective {
	type: "defend";
	turns: number;
}

export interface EscapeObjective {
	type: "escape";
	turns: number;
	safePositions: Position[];
}

export interface SpecialObjective {
	type: "special";
	turns?: number;
	testFunc: (game: Game) => boolean;
}

type GetType<T> = T extends { type: infer U } ? U : never;
type EconomicObjectiveTypes = GetType<EconomicObjectives>;
type BattleObjectiveTypes = GetType<BattleObjectives>;
export type ObjectiveType = EconomicObjectiveTypes | BattleObjectiveTypes;


// Quest rewards
type RewardConfig = {
	// Guaranteed and probabilistic rewards that can be stacked.
	// All drops in this section will be awarded to the player:
	// - Guaranteed rewards 
	// - Probabilistic rewards (resources with drop chances)
	drops?: DropEntry[];
	coins?: number;

	// Exclusive reward pools where only one item will be randomly selected.
	// The selection uses the following rules:
	// - If entries have chance values: Uses weighted probability
	// - If no chances specified: Uniform distribution across all entries
	// - If chance omitted: Entry is considered guaranteed (100% chance)
	dropPools?: DropPool[];
};

type DropPool = {
	drops: DropEntry[];
	chance?: number;
}

type DropEntry = {
  id: string;
  type: "resource" | "blueprint" | "crystal";
  count: number;
  chance?: number;
};

