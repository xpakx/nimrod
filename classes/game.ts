import { GameState } from "./game-state.js";
import { ActionButton, ButtonRow, InterfaceLayer } from "./interface/interface.js";
import { Action } from "./interface/actions.js";
import { MapLayer, Position } from "./map-layer.js";
import { SpriteConfig, BuildingConfig, SpriteLibrary } from "./sprite-library.js";
import { prepareTabs, SidebarConfig } from "./interface/sidebar.js";
import { BattleActor } from "./battle/actor.js";
import { Battle } from "./battle/battle.js";
import { getLogger, Logger, LoggerFactory } from "./logger.js";
import { House } from "./building/house.js";
import { QuestLayer } from "./quest-layer.js";
import { CityLogicLayer } from "./logic/city-logic.js";
import { CityInterfaceLogic } from "./logic/city-interface-logic.js";
import { Building } from "./building/buildings.js";
import { BattleMapData, SaveManager } from "./save-manager.js";
import { BattleLogicLayer } from "./logic/battle-logic.js";
import { CampaignData } from "./quest.js";
import { HeroLibrary } from "./battle/hero-library.js";

export class Game {
	state: GameState;
	map: MapLayer;
	quest: QuestLayer;
	interf: InterfaceLayer;
	sprites: SpriteLibrary;
	heroes: HeroLibrary;
	saveManager: SaveManager;
	maxYOffset: number;
	minXOffset: number;
	maxXOffset: number;
	minuteCounter: number;
	logger: Logger = getLogger("Game");

	cityLogic: CityLogicLayer;
	cityInterfaceLogic: CityInterfaceLogic;

	battleLogic: BattleLogicLayer;

	context?: CanvasRenderingContext2D;

	constructor() {
		this.state = new GameState();
		this.map = new MapLayer(this.state.canvasSize);
		this.quest = new QuestLayer(this.state);
		this.interf = new InterfaceLayer(this.state.canvasSize, this.state.menuWidth, this.state.topPanelHeight);
		this.sprites = new SpriteLibrary();
		this.heroes = new HeroLibrary();
		this.cityLogic = new CityLogicLayer();
		this.cityInterfaceLogic = new CityInterfaceLogic();
		this.battleLogic = new BattleLogicLayer();
		this.saveManager = new SaveManager();

		this.maxYOffset = this.map.isoToScreen({x: this.map.map[0].length - 1, y: this.map.map.length - 1}).y + (this.map.tileSize.height/2);
		this.minXOffset = this.map.isoToScreen({x: 0, y: this.map.map.length - 1}).x  - (this.map.tileSize.width/2);
		this.maxXOffset = this.map.isoToScreen({x: this.map.map[0].length - 1, y: 0}).x  + (this.map.tileSize.width/2);
		this.minuteCounter = 0;
	}

	async prepareAssets(buildings: string | BuildingConfig[], avatars: string | SpriteConfig[], icons: string | SpriteConfig[], tabSettings: SidebarConfig) {
		await this.sprites.prepareActorSprites(this.map.tileSize);
		await this.sprites.prepareBuildingSprites(buildings, this.map.tileSize);
		await this.sprites.prepareAvatars(avatars);
		await this.sprites.prepareIcons(icons);
		await this.sprites.prepareRoadSprites(this.map.tileSize);
		await this.sprites.prepareArrowSprites(this.map.tileSize);
		this.interf.coinsIcon = this.sprites.icons['coins'];
		this.interf.populationIcon = this.sprites.icons['population'];

		this.interf.tabs = await prepareTabs(this.sprites.buildings, tabSettings);
		this.interf.tab = 0;
		this.interf.calculateIconsSize();
		this.interf.resizeTabs();
		this.interf.calculateTabIcons();
		this.addCityButtons();
	}

	onMouseLeftClick(_event: MouseEvent) {
		if(this.interf.mouseInsideInterface(this.state.playerMouse)) {
			this.leftMouseInterface();
			return;
		}
		if (this.interf.buildingInterface) {
			this.interf.buildingInterface = undefined;
		}
		this.leftMouseClickMain();
	}

	leftMouseClickMain() {
		switch (this.state.view) {
			case "City":
				this.cityLogic.onMouseLeftClick(this);
				break;
			case "Battle":
				this.battleLogic.onMouseLeftClick(this);
				break;
			case "Kingdom":
				this.quest.onMouseLeftClick(this);
		}
	}

	leftMouseInterface() {
		const clickResult = this.interf.click(this.state.playerMouse);
		if (!clickResult) {
			return;
		}
		switch (this.state.view) {
			case "City":
				this.cityInterfaceLogic.leftMouseCityInterface(clickResult, this);
		}
		this.leftMouseGeneric(clickResult);
	}

	leftMouseGeneric(clickResult: Action) {
		if(clickResult.action == "goTo") {
			this.logger.debug("Go to: " + clickResult.argument);
			this.interf.buildingInterface = undefined;
			this.interf.toMapMode();
			switch (clickResult.argument) {
				case "World":
					this.toWorld(); break;
				case "Kingdom":
					this.toKingdom(); break;
				case "City":
					this.toCity(); break;
			}
		} else if(clickResult.action == "openBattle") {
			this.toBattle(clickResult.map); 
		} else if(clickResult.action == "open") {
			this.interf.buildingInterface = clickResult.interface;
		} else if(clickResult.action == "registerQuest") {
			this.interf.buildingInterface = undefined;
			if (clickResult.map == "city") {
				this.cityLogic.quests.registerQuest(clickResult.quest);
			}
		} else if(clickResult.action == "selectHero") {
			this.battleLogic.selectHero(clickResult.hero);
		}
	}

	onMouseMiddleClick(event: MouseEvent) {
		this.map.isDragging = true;
		this.map.dragStart.x = event.clientX + this.map.positionOffset.x;
		this.map.dragStart.y = event.clientY + this.map.positionOffset.y;
	}

	correctOffset() {
		if(this.map.positionOffset.y < 0) {
			this.map.positionOffset.y = 0;
		}
		if(this.map.positionOffset.y > this.maxYOffset) {
			this.map.positionOffset.y = this.maxYOffset;
		}
		if(this.map.positionOffset.x < this.minXOffset) {
			this.map.positionOffset.x = this.minXOffset;
		}
		if(this.map.positionOffset.x > this.maxXOffset) {
			this.map.positionOffset.x = this.maxXOffset;
		}
	}

	rescaleOffsets(oldScale: number) {
		this.map.positionOffset.x = this.map.scale*this.map.positionOffset.x/oldScale;
		this.map.positionOffset.y = this.map.scale*this.map.positionOffset.y/oldScale;
		this.maxYOffset = this.map.isoToScreen({x: this.map.map[0].length - 1, y: this.map.map.length - 1}).y + (this.map.tileSize.height/2) + this.map.positionOffset.y; // + offset to calculate from 0,0
		this.minXOffset = this.map.isoToScreen({x: 0, y: this.map.map.length - 1}).x  - (this.map.tileSize.width/2) + this.map.positionOffset.x;
		this.maxXOffset = this.map.isoToScreen({x: this.map.map[0].length - 1, y: 0}).x  + (this.map.tileSize.width/2) + this.map.positionOffset.x;
		this.correctOffset();
	}

	rescale(dScale: number) {
		let oldScale = this.map.scale;
		this.map.rescale(dScale);
		this.rescaleOffsets(oldScale);
		this.sprites.rescaleSprites(this.map.tileSize);
	}

	getCurrentHoverableLayer(): undefined | HoverableLayer {
		switch (this.state.view) {
			case "City":
			case "Battle":
				return this.map;
			case "Kingdom":
				return this.quest;
			case "World":
			case "Menu":
				return undefined;
		}
	}

	onMouseMove(event: MouseEvent, canvas: HTMLCanvasElement) {
		const rect = canvas.getBoundingClientRect();

		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;
		this.state.playerMouse = {x: mouseX, y: mouseY};
		if(!this.interf.mouseInsideInterface(this.state.playerMouse)) {
			const layer = this.getCurrentHoverableLayer();
			this.onMouseMoveLayer(layer);
		} 
		this.interf.onMouse(this.state.playerMouse);

		if (this.map.isDragging && this.terrainView()) {
			this.map.positionOffset.x = this.map.dragStart.x - event.clientX;
			this.map.positionOffset.y = this.map.dragStart.y - event.clientY;
			this.correctOffset();
		}
	}

	comparePositions(pos1: Position, pos2: Position) {
		return pos1.x == pos2.x && pos1.y == pos2.y;
	}

	onMouseMoveLayer(layer: undefined | HoverableLayer) {
		if (!layer) return;
		const old = layer.copyMousePosition();
		layer.updateMousePosition(this.state.playerMouse);

		if (this.state.view == "Battle" && !this.comparePositions(old, layer.getMousePosition())) {
			this.battleLogic.battleMouseOver(this);
		}
	}

	onMouseUp(_event: MouseEvent) {
		const layer = this.getCurrentHoverableLayer();
		if (layer) layer.isDragging = false;
	}

	onMouseWheel(event: WheelEvent) {
		const layer = this.getCurrentHoverableLayer();
		if (!layer) return;
		if(layer.isDragging) {
			return;
		}
		if (event.deltaY < 0) {
			this.rescale(0.2);
		} else {
			this.rescale(-0.2);
		}
	}

	onKeyDown(event: KeyboardEvent) {
		// TODO: view-dependend actions
		switch (event.key) {
			case 'ArrowUp': case 'k':
				this.state.moveUp = true;
				break;
			case 'ArrowDown': case 'j':
				this.state.moveDown = true;
				break;
			case 'ArrowLeft': case 'h':
				this.state.moveLeft = true;
				break;
			case 'ArrowRight': case 'l':
				this.state.moveRight = true;
				break;
			case '+': 
				this.rescale(0.2);
				break;
			case '-': 
				this.rescale(-0.2);
				break;
			case '0': 
				this.map.switchToNormalMode(); 
				break;
			case '9': 
				this.map.switchToDeleteMode();
				break;
			case 'Enter': 
				this.interf.dialogueAction();
				break;
			case 'F9': 
				this.state.debugMode = !this.state.debugMode;
				LoggerFactory.getInstance().updateAllLevels(this.state.debugMode ? "debug" : "error");
				break;
			case '1':
				this.saveManager.saveMapToStorage(this.map, "savedMap");
				break;
			case '2':
				this.saveManager.loadMapFromStorage(this, "savedMap")
				break;
			case '3':
				this.state.money += 500;
				this.cityLogic.updateCost(this.map, this.state);
				break;
			case '4':
				let hero = new BattleActor(
					this.sprites.actors['delivery'],
					{x: 0, y: 0}
				); 
				hero.portrait = this.sprites.avatars['ratman'];
				this.state.allHeroes.push(hero);
			case '5':
				if (!this.state.debugMode) {
					break; 
				}
				if (this.map.isBuilding(this.map.isoPlayerMouse)) {
					let building = this.map.getBuilding(this.map.isoPlayerMouse)!;
					building.storage['wood'] = 100;
					building.storage['weapons'] = 100;
					building.accepts.add('wood');
					building.accepts.add('weapons');
				}
				break;
			case 'c':
				if (!this.state.debugMode) {
					break; 
				}
				if (this.map.isBuilding(this.map.isoPlayerMouse)) {
					let building = this.map.getBuilding(this.map.isoPlayerMouse)!;
					console.log(building.constructed);
					console.log(building.constructionManager ? building.constructionManager.needs : building.storage);
					console.log(building.workforce);
				}
				break;
			case 'a':
				if (!this.state.debugMode) {
					break; 
				}
				this.minuteCounter = 60;
				break;
			case 'o':
				const bldng = this.map.getBuilding(this.map.isoPlayerMouse);
				if (!bldng) break;
				bldng.info();
				break;
			case "Escape":
				this.interf.buildingInterface = undefined;
				this.map.switchToNormalMode();
				break;
		}

		if (!this.terrainView()) {
			return;
		}

		if(this.state.moveUp) {
			this.map.positionOffset.y = this.map.positionOffset.y - 10;
			if(this.map.positionOffset.y < 0) {
				this.map.positionOffset.y = 0;
			}
			this.map.updateMousePosition(this.state.playerMouse);
		}
		if(this.state.moveDown) {
			this.map.positionOffset.y = this.map.positionOffset.y + 10;
			if(this.map.positionOffset.y > this.maxYOffset) {
				this.map.positionOffset.y = this.maxYOffset;
			}
			this.map.updateMousePosition(this.state.playerMouse);
		}
		if(this.state.moveLeft) {
			this.map.positionOffset.x = this.map.positionOffset.x - 10;
			if(this.map.positionOffset.x < this.minXOffset) {
				this.map.positionOffset.x = this.minXOffset;
			}
			this.map.updateMousePosition(this.state.playerMouse);
		}
		if(this.state.moveRight) {
			this.map.positionOffset.x = this.map.positionOffset.x + 10;
			if(this.map.positionOffset.x > this.maxXOffset) {
				this.map.positionOffset.x = this.maxXOffset;
			}
			this.map.updateMousePosition(this.state.playerMouse);
		}
	}

	onKeyUp(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowUp': case 'k':
				this.state.moveUp = false;
			break;
			case 'ArrowDown': case 'j':
				this.state.moveDown = false;
			break;
			case 'ArrowLeft': case 'h':
				this.state.moveLeft = false;
			break;
			case 'ArrowRight': case 'l':
				this.state.moveRight = false;
			break;
		}
	}

	calcState(deltaTime: number) {
		const minuteEnded = this.advanceMinuteCounter(deltaTime);
		if (this.state.view == "City") this.cityLogic.calcState(this, deltaTime, minuteEnded);
		else this.battleLogic.calcState(this, deltaTime, minuteEnded);
		if (minuteEnded) this.saveManager.saveState(this, "quicksave");
	}

	advanceMinuteCounter(deltaTime: number): boolean {
		this.minuteCounter += deltaTime;
		if(this.minuteCounter >= 60) {
			this.minuteCounter = 0;
			return true;
		}
		return false;
	}

	renderGame(context: CanvasRenderingContext2D, deltaTime: number) {
		context.clearRect(0, 0, this.state.canvasSize.width, this.state.canvasSize.height);
		if (this.terrainView()) {
			this.map.renderMap(context, this.state.pedestrians, deltaTime);
		} else if (this.state.view == "Kingdom") {
			this.quest.renderMap(context, deltaTime);
		}
		this.interf.renderInterface(context, deltaTime, this.state);
		if (this.state.debugMode) {
			this.renderDebugInfo(context, deltaTime);
		}
	}

	terrainView(): boolean {
		return this.state.view == "City" || this.state.view == "Battle";
	}

	renderDebugInfo(ctx: CanvasRenderingContext2D, deltaTime: number) {
		ctx.font = "26px normal"
		ctx.fillStyle = "white"

		this.state.dts.push(deltaTime);
		if (this.state.dts.length > 60) {
			this.state.dts.shift();
		}

		const dtAvg = this.state.dts.reduce((a, b) => a + b, 0)/this.state.dts.length;

		ctx.fillText(`${Math.floor(1/dtAvg)} FPS`, 20, 75);
		ctx.fillText(`(${this.state.playerMouse.x}, ${this.state.playerMouse.y})`, 20, 100);
		ctx.fillText(`(${this.map.isoPlayerMouse.x}, ${this.map.isoPlayerMouse.y})`, 20, 125);
	}

	nextFrame(context: CanvasRenderingContext2D, timestamp: number) {
		const deltaTime = (timestamp - this.state.prevTimestamp) / 1000;
		this.state.prevTimestamp = timestamp;
		this.calcState(deltaTime);
		this.renderGame(context, deltaTime);
	}

	toWorld() {
		this.map.clearPath();
		this.addWorldButtons();
		this.state.view = "World";
	}

	toKingdom() {
		this.map.clearPath();
		this.addKingdomButtons();
		this.state.view = "Kingdom";
	}

	toCity() {
		this.map.clearPath();
		this.map.floydWarshall();
		this.addCityButtons();
		this.state.view = "City";
	}

	toMenu() {
		this.map.clearPath();
		this.state.view = "Menu";
	}

	toBattle(map: BattleMapData) {
		this.logger.debug("Go to: battle");
		this.interf.buildingInterface = undefined;

		const battle = new Battle();
		this.state.currentBattle = battle;
		this.state.view = "Battle";
		this.saveManager.applyMap(this, map);
		this.saveManager.applyBattle(this, map);
		for(let hero of this.state.team) {
			battle.addHero(hero);
		}

		this.logger.debug("Heroes", this.state.pedestrians);
		this.interf.toBattleMode(this.state.currentBattle.heroes, this.sprites.icons)
		this.battleLogic.showSpawnArea(this);
	}

	addCityButtons() {
		this.interf.buttons = [];
		const menuRow: ButtonRow = new ButtonRow(
			this.interf.buildingMenuHeight + 50,	
			[
				new ActionButton(this.sprites.icons['road'], {action: "buildRoad", argument: undefined}, {width: 40, height: 40}),
				new ActionButton(this.sprites.icons['delete'], {action: "delete", argument: undefined}, {width: 40, height: 40}),
			]
		);
		this.interf.addButtonRow(menuRow);

		const mapRow: ButtonRow = new ButtonRow(
			this.state.canvasSize.height - 80,	
			[
				new ActionButton(this.sprites.icons['kingdom'], {action: "goTo", argument: "Kingdom"}, {width: 50, height: 50}),
				new ActionButton(this.sprites.icons['world'], {action: "goTo", argument: "World"}, {width: 50, height: 50}),
			]
		);
		this.interf.addButtonRow(mapRow);
	}

	addKingdomButtons() {
		this.interf.buttons = [];
		const mapRow: ButtonRow = new ButtonRow(
			this.state.canvasSize.height - 80,	
			[
				new ActionButton(this.sprites.icons['city'], {action: "goTo", argument: "City"}, {width: 50, height: 50}),
				new ActionButton(this.sprites.icons['world'], {action: "goTo", argument: "World"}, {width: 50, height: 50}),
			]
		);
		this.interf.addButtonRow(mapRow);
	}

	addWorldButtons() {
		this.interf.buttons = [];
		const mapRow = new ButtonRow(
			this.state.canvasSize.height - 80,	
			[
				new ActionButton(this.sprites.icons['city'], {action: "goTo", argument: "City"}, {width: 50, height: 50}),
				new ActionButton(this.sprites.icons['kingdom'], {action: "goTo", argument: "Kingdom"}, {width: 50, height: 50}),
			]
		);
		this.interf.addButtonRow(mapRow);
	}

	getNormalWorkforce(): House[] {
		return this.map.buildings
		.filter(x => x instanceof House)
		.filter(x => x.workforce == "normal")
		.filter(x => x.population > 0);
	}

	getBuildingsWithNormalWorkers(): Building[] {
		return this.map.buildings
		.filter(x => x.workforce == "normal")
		.filter(x => x.maxWorkers > 0);
	}


	async loadCampaign(campaign: CampaignData) {
		await this.quest.applyCampaign(campaign, this);
	}

	setContext(context: CanvasRenderingContext2D) {
		this.context = context;
	}
}

interface HoverableLayer {
	isDragging: boolean;
	updateMousePosition(position: Position): void;
	copyMousePosition(): Position;
	getMousePosition(): Position;
}
