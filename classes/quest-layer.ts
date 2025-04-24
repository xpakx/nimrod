import { HeroRank } from "./battle/actor.js";
import { Building, BuildingInterface } from "./building/buildings.js";
import { House } from "./building/house.js";
import { Storage } from "./building/storage.js";
import { GameState } from "./game-state.js";
import { Game } from "./game.js";
import { Action } from "./interface/actions.js";
import { HeroButtonRow } from "./interface/adventurers-guild.js";
import { Button, ButtonContainer, CircularButton, drawCircularIcon, isPositionInArea } from "./interface/button.js";
import { getLogger, Logger } from "./logger.js";
import { RewardCalculator } from "./logic/reward-calculator.js";
import { Position, Size } from "./map-layer.js";
import { BuildingObjective, CampaignData, EconomicObjectives, PopulationInHousesObjective, PopulationObjective, ProductionObjective, ProfitObjective, Quest, ObjectiveType, StoragesObjective, TreasuryObjective, Reward, RewardConfig, DropEntryConfig, DropEntry, DropPool } from "./quest.js";
import { BattleMapData, HeroPortraitData } from "./save-manager.js";
import { SpriteLibrary } from "./sprite-library.js";

export interface QuestSnapshot {
	houseMap: Map<string, Map<number, number>>;
	buildingMap: Map<string, Map<number, number>>;
	resourceMap: Map<string, number>;
	money: number,
	population: number,
}

export class QuestManager {
	logger: Logger = getLogger("QuestManager");
	registeredQuests: Quest[] = [];
	timeSinceLastCheck: number = 0;
	checkFrequencyInSeconds: number = 5;

	monthLengthInChecks: number = 4;
	checksInMonth: number = 0;
	month: number = 0;

	private handlers: Record<string, ObjectiveChecker> = {};

	rewardCalculator: RewardCalculator = new RewardCalculator();

	constructor() {
		this.registerChecker(new PopulationChecker());
		this.registerChecker(new PopulationInHousesChecker());
		this.registerChecker(new BuildingChecker());
		this.registerChecker(new TreasuryChecker());
		this.registerChecker(new StoragesChecker());
		this.registerChecker(new ProductionChecker());
		this.registerChecker(new ProfitChecker());
		// TODO: military power, trading partners
	}

	registerChecker(handler: ObjectiveChecker) {
		this.handlers[handler.type] = handler;
	}

	registerQuest(quest: Quest) {
		this.logger.debug(`Trying to register a quest`, quest);
		if (quest.questDefinition.objectives.length == 0) return;
		this.registeredQuests.push(quest);
		this.logger.debug(`New quest registered`, quest);
	}

	removeQuest(quest: Quest) {
		const index = this.registeredQuests.indexOf(quest);
		if (index !== -1) this.registeredQuests.splice(index, 1);
	}

	updateHouseMap(building: House, houseMap: Map<string, Map<number, number>>) {
		if (!houseMap.has(building.name)) {
				houseMap.set(building.name, new Map());
		}
		let houseData = houseMap.get(building.name)!;

		// TODO: see updateBuildingMap
		for (let i = building.level; i >=0; i--) {
			const amount = houseData.get(i) || 0;
			houseData.set(i, amount + building.population);
		}
	}

	updateBuildingMap(building: Building, houseMap: Map<string, Map<number, number>>) {
		if (!houseMap.has(building.name)) {
			houseMap.set(building.name, new Map());
		}
		let houseData = houseMap.get(building.name)!;

		// TODO: probably better to store only exact levels here,
		// and calculate cumulative levels only after all buildings
		// are processed
		for (let i = building.level; i >=0; i--) {
			const amount = houseData.get(i) || 0;
			houseData.set(i, amount + 1);
		}
	}

	updateResourceMap(building: Storage, resourceMap: Map<string, number>) {
		for (let resource in building.storage) {
			const amount = resourceMap.get(resource) || 0;
			resourceMap.set(resource, amount + building.storage[resource]);
		}
	}

	checkAll(game: Game, deltaTime: number) {
		this.timeSinceLastCheck += deltaTime;
		if(this.timeSinceLastCheck < this.checkFrequencyInSeconds) return;
		this.timeSinceLastCheck = 0;

		const snapshot: QuestSnapshot = {
			houseMap: new Map(),
			buildingMap: new Map(),
			resourceMap: new Map(),
			money: game.state.money,
			population: game.state.population,
		};

		for (const building of game.map.buildings) {
			this.updateBuildingMap(building, snapshot.buildingMap);
			if (building instanceof House) this.updateHouseMap(building, snapshot.houseMap);
			if (building instanceof Storage) this.updateResourceMap(building, snapshot.resourceMap);
		}

		for (let quest of this.registeredQuests) {
			const finished = this.checkQuest(game, quest, snapshot);
			if (finished) {
				this.removeQuest(quest);
				if (quest.rewards) this.applyRewards(game, quest.rewards);
				if (quest.onCompletion != undefined) {
					quest.onCompletion(game, quest);
				}
				// TODO: show info?
			}
		}

		this.checksInMonth += 1;
		if (this.checksInMonth < this.monthLengthInChecks) return;
		this.checksInMonth = 0;
		this.month += 1;
		game.state.lastMonthSnapshot = snapshot;

		if (this.month < 12) return;
		this.month = 0;
		game.state.lastYearSnapshot = snapshot;
	}

	checkQuest(game: Game, quest: Quest, snapshot: QuestSnapshot): boolean {
		this.logger.debug(`Checking quest ${quest.questDefinition.name}`, quest);
		for (let objective of quest.questDefinition.objectives) {
			this.logger.debug(`Checking objective of type ${objective.type}`, objective);

			if (objective.type == "special") {
				if (!objective.testFunc(game)) return false;
			}

			const handler = this.handlers[objective.type];
			if (!handler) {
				this.logger.error(`No handler for objective type: ${objective.type}`);
				return false;
			}
			if (!handler.check(game, snapshot, objective as EconomicObjectives)) return false;
		}
		this.logger.debug("Quest finished");
		return true;
	}

	applyRewards(game: Game, rewards: Reward) {
		if (rewards.coins) game.state.money += rewards.coins;
		let result: DropEntry[] = [];
		if (rewards.drops) {
			const drops = this.rewardCalculator.getRewardDrops(rewards.drops);
			result.push(...drops);
		}
		if (rewards.dropPools) {
			const drops = this.rewardCalculator.getRewardDropPools(rewards.dropPools);
			result.push(...drops);
		}

		if (result.length == 0) this.logger.debug("No rewards applied!");
		for (let entry of result) {
			// Current MVP implementation:
			// - All rewards are converted into coins.
			// - Item rewards (drops/dropPools) are logged but not transferred to the city.
			// 
			// Notes / future direction:
			// - In the full system, rewards should be physically transferred to the city.
			// - This introduces complexity: What if storage buildings are full?
			// - Ideally, this would involve a Transportation Portal building.
			//   - Rewards would be queued there and physically moved by workers.
			// - Until that system is in place, we're avoiding partial implementations and
			//   treating everything as coin value to keep the MVP clean and deterministic.
			// TODO: move rewards to city storage, possibly via a "Transportation Portal".
			this.logger.debug(`reward: ${entry.count} of ${entry.id}`);
		}
		// TODO: remove 
		const dropValue = result.reduce((sum, entry) => sum + (entry.count * 100), 0);
		game.state.money += dropValue;
	}

}

export class QuestLayer {
	size: Size;
	pos: Position;
	playerMouse: Position = {x: 0, y: 0};
	
	markers: Button[] = [];
	isDragging: boolean = false;

	constructor(state: GameState) {
		this.size = {
			width: state.canvasSize.width - state.menuWidth,
			height: state.canvasSize.height - state.topPanelHeight,
		};
		this.pos = {
			x: 0,
			y: state.topPanelHeight,
		};
	}

	renderMap(context: CanvasRenderingContext2D, _deltaTime: number) {
	    context.save();
	    context.translate(this.pos.x, this.pos.y);
	    for (let marker of this.markers) {
		    const hovered = marker.inButton(this.playerMouse);
		    marker.draw(context, hovered);
	    }
	    context.restore();
	}

	updateMousePosition(position: Position) {
		this.playerMouse.x = position.x - this.pos.x;
		this.playerMouse.y = position.y - this.pos.y;
	}

	copyMousePosition(): Position {
		return { x: this.playerMouse.x, y: this.playerMouse.y }
	}

	getMousePosition(): Position {
		return this.playerMouse;
	}

	// TODO: move to logic layer
	onMouseLeftClick(game: Game) {
		for (let marker of this.markers) {
			if(marker.inButton(this.playerMouse)) {
				const action = marker.getClickAction();
				if (action && action.action == "open") {
					const quest = action.interface as QuestInterface;
					game.interf.buildingInterface = quest;
					quest.openQuest(game.state);
				}
				break;
			}
		}
	}

	async applyCampaign(data: CampaignData, game: Game) {
		for (let marker of data.questMarkers) {
			let quest: Quest = {
				id: marker.id,
				visibleName: marker.visibleName,
				questDefinition: marker.questDefinition,
				onCompletion: marker.onCompletion,
				onFailure: marker.onFailure,
				rewards: this.applyRewards(marker.rewards, game.sprites),
			};

			let battleMap: BattleMapData | undefined = undefined;;
			if (marker.map) {
				const battle = await fetch(`maps/${marker.map}.json`);
				battleMap = await battle.json() as BattleMapData;
			} 
			const questMarker = new QuestMarker(
				marker.position, 
				marker.size,
				quest,
				true,
				battleMap
			);
			this.markers.push(questMarker);

			if (marker.map) this.prepareQuestMarkerPortraits(questMarker, game);

			// TODO: use drops from rewards
			if (marker.itemInfo) {
				for (let item in marker.itemInfo) {
					if (!(item in game.sprites.icons)) continue;
					questMarker.addIcon(game.sprites.icons[item]);
				}
			}
		}
	}

	prepareQuestMarkerPortraits(marker: QuestMarker, game: Game) {
		const actors = marker.battleMap?.actors;
		if (!actors) return;
		const portraitData = actors
			.map((actor) => game.saveManager.transformActorToPortraitData(game, actor))
			.filter((actor) => actor !== undefined)
			.filter((actor) => actor.image !== undefined)
			.sort((a, b) => b.strength - a.strength)
			.slice(0, 5);
		for (const portrait of portraitData) {
			marker.addPortrait(portrait);
		}
	}

	dropEntryConfigToDropEntry(config: DropEntryConfig, sprites: SpriteLibrary): DropEntry {
		const spriteName = config.sprite || config.id;
		const sprite = sprites.icons[spriteName];
		return {
			id: config.id,
			type: config.type,
			count: config.count,
			sprite: sprite,
		}
	}

	applyRewards(data: RewardConfig | undefined, sprites: SpriteLibrary): Reward | undefined {
		if (!data) return;
		let drops: DropEntry[] = [];
		if (data.drops) {
			for (let dropConfig of data.drops) {
				drops.push(this.dropEntryConfigToDropEntry(dropConfig, sprites));
			}
		}

		let pools: DropPool[] = [];
		if (data.dropPools) {
			for (let poolConfig of data.dropPools) {

				let poolDrops: DropEntry[] = [];
				if (data.drops) {
					for (let dropConfig of poolConfig.drops) {
						poolDrops.push(this.dropEntryConfigToDropEntry(dropConfig, sprites));
					}
				}
				pools.push({chance: poolConfig.chance, drops: poolDrops});
			}
		}

		return {
			coins: data.coins,
			drops: drops,
			dropPools: pools,
		}
	}
}

export class QuestMarker implements Button {
	position: Position;
	size: Size;
	locked: boolean;
	interf: QuestInterface;
	battleMap?: BattleMapData;

	constructor(position: Position, size: Size, quest: Quest, locked: boolean = true, battleMap?: BattleMapData) {
		this.position = position;
		this.size = size;
		this.locked = locked;
		this.battleMap = battleMap;
		this.interf = new QuestInterface(quest, battleMap);
	}

	addPortrait(portrait: HeroPortraitData) {
		this.interf.enemyIcons.push(portrait);
	}

	addIcon(portrait: HTMLImageElement) {
		this.interf.dropIcons.push(portrait);
	}

	inButton(position: Position): boolean {
		if(position.x < this.position.x || position.x > this.position.x + this.size.width) {
			return false;
		}
		if(position.y < this.position.y || position.y > this.position.y + this.size.height) {
			return false;
		}
		return true;
	}

	drawImage(): void {
		throw new Error("Method not implemented.");
	}

	getClickAction(): Action | undefined {
		return { 
			action: "open",
			interface: this.interf,
		};
	}

	draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, hovered: boolean): void {
		context.fillStyle = hovered ? "red" : "white";
		context.beginPath();
		context.ellipse(
			this.position.x + this.size.width/2,
			this.position.y + this.size.height/2,
			this.size.width/2,
			this.size.height/2,
			0,
			0,
			2 * Math.PI
		);
		context.fill();
	}
}

export class QuestInterface extends BuildingInterface {
	quest: Quest;
	goButton: Button;

	enemyIcons: HeroPortraitData[] = [];
	dropIcons: HTMLImageElement[] = [];

	heroPortraits: ButtonContainer = new HeroButtonRow();

	battleMap?: BattleMapData;

	constructor(quest: Quest, battleMap?: BattleMapData) {
		super();
		this.quest = quest; 
		this.battleMap = battleMap;
		// TODO: correctly apply actions
		let action: Action;
		if (quest.questDefinition.type == "battle" && battleMap) {
			action = { action: "openBattle", map: battleMap };

		} else {
			action = { 
				action: "registerQuest",
				map: "city",
				quest: this.quest,
			};
		}
		this.goButton =  new GoButton({x: 100, y: 100}, action);
	}

	renderInterface() { 
		const width = this.size.width;
		const height = this.size.height;
		const x = 0;
		const y = 0;

		this.offscreen = new OffscreenCanvas(this.size.width, this.size.height);
		this.context = this.offscreen.getContext("2d")!;
		this.context.fillStyle = '#444';
		this.context.fillRect(x, y, width, height);

		this.context.strokeStyle = '#fff';
		this.context.strokeRect(x, y, width, height);

		const nameX = 20;
		const nameY = 40;

		this.context.fillStyle = '#fff';
		this.context.font = '24px Arial';
		this.context.fillText(this.quest.visibleName, nameX, nameY);

		if (this.quest.questDefinition.type == "battle") {
			this.context.fillStyle = '#ff6b6b';
			this.context.font = '17px Arial';
			const enemiesTextWidth = this.context.measureText("Enemies").width;
			const enemiesX = (width - enemiesTextWidth) / 2;
			const enemiesY = 120;
			this.context.fillText("Enemies", enemiesX, enemiesY);

			const portraitSize = 60;

			this.context.fillStyle = '#a5d6a7';
			const lootTextWidth = this.context.measureText("Rewards").width;
			const lootX = (width - lootTextWidth) / 2;
			const lootY = enemiesY + portraitSize + 50;

			this.context.fillText("Rewards", lootX, lootY);
		}
	}

	// TODO: should probably make more general interface
	openQuest(state: GameState) {
		this.preRender(state);
		this.renderInterface();
		this.prepareEnemyIcons();
	}

	preRender(state: GameState) {
		this.position.x = this.leftMargin;
		this.size.width = state.canvasSize.width - 2*this.leftMargin - state.menuWidth;
		this.size.height = 300;
		const middleOfMap = (state.canvasSize.height - state.topPanelHeight) / 2  + state.topPanelHeight;
		this.position.y = middleOfMap - this.size.height / 2;
		const goButtonMargin = 20;
		this.goButton.position.x = this.position.x + this.size.width - goButtonMargin - this.goButton.size.width;
		this.goButton.position.y = this.position.y + this.size.height - goButtonMargin - this.goButton.size.height;
	}

	drawInterface(context: CanvasRenderingContext2D, deltaTime: number, state: GameState) {
		super.drawInterface(context, deltaTime, state);
		this.goButton.draw(context, false);
		this.heroPortraits.draw(context, state.playerMouse);
	}

	click(position: Position): Action | undefined {
		if (this.goButton.inButton(position)) {
			return this.goButton.getClickAction();
		}

		return undefined;
	}

	prepareEnemyIcons() {
		const portraitSize = 60;
		const width = this.size.width;
		const y =  this.position.y + 120 + 15;
		const heroWidth = this.enemyIcons.length*portraitSize + (this.enemyIcons.length - 1)*10
		let heroY = y;
		let heroX = this.position.x + width/2 - heroWidth/2;
		this.heroPortraits.buttons = [];
		for (let enemy of this.enemyIcons) {
			if (!enemy.image) continue; // TODO
			const heroButton = new HeroIcon(
				enemy.image,
				{width: portraitSize, height: portraitSize},
				{x: heroX, y: heroY},
				"common",
			);
			this.heroPortraits.buttons.push(heroButton);
			heroX += 10 + portraitSize;
		}
		
	}
}

export class GoButton implements Button {
	image: OffscreenCanvas;
	context: OffscreenCanvasRenderingContext2D;
	hover: boolean;
	position: Position;
	size: Size;
	action: Action;

	constructor(position: Position, action: Action) {
		this.size = {width: 20, height: 20};
		this.image = new OffscreenCanvas(this.size.width, this.size.height);
		this.context = this.image.getContext("2d")!; // TODO
		this.position = position;
		this.hover = false;
		this.action = action;
		this.drawImage();
	}

	inButton(position: Position): boolean {
		if(position.x < this.position.x || position.x > this.position.x + this.size.width) {
			return false;
		}
		if(position.y < this.position.y || position.y > this.position.y + this.size.height) {
			return false;
		}
		return true;
	}

	drawImage(): void {
		this.context.fillStyle = '#dfd';
		this.context.beginPath();
		this.context.arc(this.size.width/2, this.size.width/2, this.size.width/2, 0, 2 * Math.PI);
		this.context.fill();
	}

	getClickAction(): Action | undefined {
		return this.action;
	}


	draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, _hovered: boolean): void {
		context.drawImage(this.image, this.position.x, this.position.y);
	}
}

export interface ObjectiveChecker {
	type: ObjectiveType;
	check(game: Game, snapshot: QuestSnapshot, objective: EconomicObjectives): boolean;
}

class PopulationChecker implements ObjectiveChecker {
	type: ObjectiveType = "population";

	check(_game: Game, snapshot: QuestSnapshot, objective: PopulationObjective): boolean {
		return snapshot.population >= objective.amount;
	}
}

class PopulationInHousesChecker implements ObjectiveChecker {
	type: ObjectiveType = "populationInHouses";

	check(_game: Game, snapshot: QuestSnapshot, objective: PopulationInHousesObjective): boolean {
		const houseTypeMap = snapshot.houseMap.get(objective.buildingType);
		if (!houseTypeMap) return false;
		const population = houseTypeMap.get(objective.level) || 0;
		return population >= objective.amount;
	}
}

class BuildingChecker implements ObjectiveChecker {
	type: ObjectiveType = "buildings";

	check(_game: Game, snapshot: QuestSnapshot, objective: BuildingObjective): boolean {
		const level = objective.level || 0;
		const amount = objective.amount || 1;
		const buildingsMap = snapshot.buildingMap.get(objective.buildingType);
		if (!buildingsMap) return false;
		const buildings = buildingsMap.get(level) || 0;
		return buildings >= amount;
	}
}

class TreasuryChecker implements ObjectiveChecker {
	type: ObjectiveType = "treasury";

	check(_game: Game, snapshot: QuestSnapshot, objective: TreasuryObjective): boolean {
		return snapshot.money >= objective.amount;
	}
}

class StoragesChecker implements ObjectiveChecker {
	type: ObjectiveType = "storages";

	check(_game: Game, snapshot: QuestSnapshot, objective: StoragesObjective): boolean {
		const resources = snapshot.resourceMap.get(objective.resource) || 0;
		return resources >= objective.amount;
	}
}

class ProductionChecker implements ObjectiveChecker {
	type: ObjectiveType = "production";

	check(game: Game, snapshot: QuestSnapshot, objective: ProductionObjective): boolean {
		const oldSnapshot = game.state.getSnapshot(objective.time);
		if (!oldSnapshot) return false;
		const resources = snapshot.resourceMap.get(objective.resource) || 0;
		const oldResources = oldSnapshot.resourceMap.get(objective.resource) || 0;
		const production = resources - oldResources;
		return production >= objective.amount;
	}
}

class ProfitChecker implements ObjectiveChecker {
	type: ObjectiveType = "profit";

	check(game: Game, snapshot: QuestSnapshot, objective: ProfitObjective): boolean {
		const oldSnapshot = game.state.getSnapshot(objective.time);
		if (!oldSnapshot) return false;
		const profit = snapshot.money - oldSnapshot.money;
		return profit >= objective.amount;
	}
}

export class HeroIcon implements CircularButton {
	_image: HTMLImageElement;
	image: OffscreenCanvas;
	context: OffscreenCanvasRenderingContext2D;
	hoverImage: OffscreenCanvas;
	hoverContext: OffscreenCanvasRenderingContext2D;
	hover: boolean = false;
	position: Position;
	size: Size;
	rank: HeroRank;
	imagePadding: number = 5;

	constructor(image: HTMLImageElement, size: Size, position: Position, rank: HeroRank) {
		this._image = image;
		this.image = new OffscreenCanvas(size.width, size.height);
		this.context = this.image.getContext("2d")!; // TODO
		this.hoverImage = new OffscreenCanvas(size.width, size.height);
		this.hoverContext = this.hoverImage.getContext("2d")!; // TODO
		this.size = size;
		this.position = position;
		this.rank = rank;
		this.drawImage();
		this.drawHoverImage();
	}

	inButton(position: Position): boolean {
		return isPositionInArea(position, this.position, this.size);
	}

	getFillColor(): string { 
		if (this.rank == "common") return '#575757';
		else if (this.rank == "rare") return '#676755';
		return '#000';
	}

	getBorderColor(): string { 
		if (this.rank == "common") return '#fff';
		else if (this.rank == "rare") return '#dd1';
		return '#000';
	}

	drawImage() {
		drawCircularIcon(this.context, this._image, this);
	}

	drawHoverImage() {
		this.hoverContext.save();
		this.hoverContext.filter = "grayscale(80%)"; 
		drawCircularIcon(this.hoverContext, this._image, this);
		this.hoverContext.restore();
	}

	getClickAction(): Action | undefined {
		return undefined;
	}

	draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, hovered: boolean): void {
		const image = hovered ? this.hoverImage : this.image;
		context.drawImage(image, this.position.x, this.position.y);
	}
}
