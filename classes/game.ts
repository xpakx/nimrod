import { GameState } from "./game-state.js";
import { ActionButton, ButtonRow, InterfaceLayer } from "./interface/interface.js";
import { Action } from "./interface/actions.js";
import { MapLayer, Position, Size } from "./map-layer.js";
import { SpriteConfig, BuildingConfig, SpriteLibrary } from "./sprite-library.js";
import { prepareTabs, SidebarConfig } from "./interface/sidebar.js";
import { Actor } from "./actor.js";
import { BattleActor, HeroType } from "./battle/actor.js";
import { Battle } from "./battle/battle.js";
import { getLogger, Logger, LoggerFactory } from "./logger.js";
import { House, Migrant } from "./building/house.js";
import { QuestLayer } from "./quest-layer.js";
import { CityLogicLayer } from "./logic/city-logic.js";
import { CityInterfaceLogic } from "./logic/city-interface-logic.js";
import { Building } from "./building/buildings.js";

export class Game {
	state: GameState;
	map: MapLayer;
	quest: QuestLayer;
	interf: InterfaceLayer;
	sprites: SpriteLibrary;
	maxYOffset: number;
	minXOffset: number;
	maxXOffset: number;
	minuteCounter: number;
	logger: Logger = getLogger("Game");
	cityLogic: CityLogicLayer;
	cityInterfaceLogic: CityInterfaceLogic;

	constructor() {
		this.state = new GameState();
		this.map = new MapLayer(this.state.canvasSize);
		this.quest = new QuestLayer(this.state);
		this.interf = new InterfaceLayer(this.state.canvasSize, this.state.menuWidth, this.state.topPanelHeight);
		this.sprites = new SpriteLibrary();
		this.cityLogic = new CityLogicLayer();
		this.cityInterfaceLogic = new CityInterfaceLogic();

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
		this.interf.recalculateTabSize();
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
				if (this.state.currentBattle?.battleStarted) {
					this.leftMouseBattle();
				} else {
					this.leftMouseBattlePrep();
				}
				break;
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
			switch (clickResult.argument) {
				case "World":
					this.toWorld(); break;
				case "Kingdom":
					this.toKingdom(); break;
				case "City":
					this.toCity(); break;
				case "Battle":
					this.toBattle(); break;
			}
		} else if(clickResult.action == "open") {
			this.interf.buildingInterface = clickResult.interface;
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

	applyMap(data: MapData, updateDistances: boolean = false) {
		this.logger.debug("Applying map", data);
		this.map.resetMap(data.size);
		this.state.orders.updateDimensions(data.size);

		for (let pos of data.roads) {
			this.map.putRoad({x: pos.x, y: pos.y}, this.sprites.getRoad(), true);
		}

		for (let building of data.buildings) {
			this.map.putBuilding({x: building.x, y: building.y}, this.sprites.buildings[building.type]);
			this.state.orders.onBuildingCreation(this.map.getBuilding({x: building.x, y: building.y}));
		}

		for (let terrain of data.terrain) {
			if (terrain.cost) {
				this.map.costs[terrain.x][terrain.y] = terrain.cost;
			}
			if (terrain.color) {
				this.map.map[terrain.x][terrain.y] = terrain.color;
			}
		}

		this.state.pedestrians = [];
		if (updateDistances) this.map.floydWarshall();
		for (let building of this.map.buildings) {
			if (building instanceof House) {
				this.state.population += building.population;
				this.state.maxPopulation += building.maxPopulation;
			}
		}
	}

	serializeMap(): MapData {
		const roads: RoadData[] = [];
		const buildings: BuildingData[] = [];
		const terrain: TerrainData[] = [];

		for (let x = 0; x < this.map.roads.length; x++) {
			for (let y = 0; y < this.map.roads[0].length; y++) {
				if (this.map.roads[x][y]) {
					roads.push({ y: x, x: y }); // TODO: fix indexing for roads
				}
			}
		}

		for (const building of this.map.buildings) {
			buildings.push({
				x: building.position.x,
				y: building.position.y,
				type: building.name,
			});
		}

		for (let x = 0; x < this.map.map.length; x++) {
			for (let y = 0; y < this.map.map[0].length; y++) {
				if (this.map.costs[x][y] || this.map.map[x][y]) {
					terrain.push({
						x,
						y,
						cost: this.map.costs[x][y],
						color: this.map.map[x][y],
					});
				}
			}
		}

		return {
			size: { width: this.map.map.length, height: this.map.map[0].length },
			roads,
			buildings,
			terrain,
			actors: [],
		};
	}

	isPlacedActor(obj: UnplacedActorData): obj is ActorData {
		return 'x' in obj && 'y' in obj;
	}

	applyBattle(data: BattleMapData) {
		if (!this.state.currentBattle) {
			return;
		}
		this.state.currentBattle.enemies  = [];
		this.state.currentBattle.heroes  = [];

		if (data.actors) {
			for (let actor of data.actors) {
				const sprite = this.sprites.actors[actor.image];
				let [x, y] = [0, 0];
				let toPlace = false;
				if (this.isPlacedActor(actor)) {
					[x, y] = [actor.x, actor.y];
					toPlace = true;
				} 
				let pedestrian = new BattleActor(sprite, {x: x, y: y}); 
				if (actor.enemy === false || actor.enemy === undefined) {
					pedestrian.enemy = false;
				} else {
					pedestrian.enemy = true;
				}
				pedestrian.name = actor.name;
				pedestrian.movement = actor.movement;
				pedestrian.hp = actor.hp;
				if (actor.type) {
					pedestrian.type = actor.type;
				}
				if(pedestrian.enemy) {
					this.state.pedestrians.push(pedestrian);
					this.state.currentBattle.enemies.push(pedestrian);
				} else {
					this.state.currentBattle.heroes.push(pedestrian);
					if (toPlace) {
						pedestrian.placed = true;
						this.state.pedestrians.push(pedestrian);
					}
				}

			}
		}

		this.state.currentBattle.playerSpawns = [];
		if (data.spawns) {
			this.state.currentBattle.playerSpawns = data.spawns;
		}
	}

	loadMap(filename: string, updateDistances: boolean = false) {
		fetch(`maps/${filename}`)
		.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error while loading a map! status: ${response.status}`);
			}
			return response.json();
		})
		.then((data: MapData) => this.applyMap(data, updateDistances))
		.catch(error => {
			this.logger.error(error);
			throw new Error(`Error loading the JSON file: ${error}`);
		});
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
			this.battleMouseOver();
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
			case 'F8':
				this.toBattle();
				break;
			case 'F7':
				this.map.floydWarshall();
				break;
			case 'F6':
				if (!this.state.debugMode) {
					break; 
				}
				if (this.map.isRoad(this.map.isoPlayerMouse)) {
					this.state.pedestrians.push(new Actor(this.sprites.actors['test'], this.map.isoPlayerMouse));
				} else if (this.map.isBuilding(this.map.isoPlayerMouse)) {
					let building = this.map.getBuilding(this.map.isoPlayerMouse)!;
					building.setWorker(this.sprites.actors['test']);
				}
				break;
			case '1':
				const mapData = this.serializeMap();
				localStorage.setItem('savedMap', JSON.stringify(mapData));
				break;
			case '2':
				const savedMapJson = localStorage.getItem('savedMap');
				if (savedMapJson) {
				  const savedMap = JSON.parse(savedMapJson);
				  this.applyMap(savedMap);
				}
				break;
			case '3':
				this.state.money += 500;
				this.cityLogic.updateCost(this.map, this.state);
				break;
			case 'c':
				if (!this.state.debugMode) {
					break; 
				}
				if (this.map.isBuilding(this.map.isoPlayerMouse)) {
					let building = this.map.getBuilding(this.map.isoPlayerMouse)!;
					for (let item in building.storage) {
						building.storage[item] = 0;
					}
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
		this.calcBuildingsState(deltaTime, minuteEnded);
		this.calcPedestriansState(deltaTime, minuteEnded);
		this.calcOrdersState(deltaTime, minuteEnded);
	}

	advanceMinuteCounter(deltaTime: number): boolean {
		this.minuteCounter += deltaTime;
		if(this.minuteCounter >= 60) {
			this.minuteCounter = 0;
			return true;
		}
		return false;
	}

	calcBuildingsState(deltaTime: number, minuteEnded: boolean) {
		for(let building of this.map.buildings) {
			building.tick(deltaTime);
			if(building.canSpawnWorker()) {
				const worker = building.spawnWorker();
				this.state.insertPedestrian(worker);
			}
			if(minuteEnded) building.onMinuteEnd(this.state);
		}
	}

	calcPedestriansState(deltaTime: number, minuteEnded: boolean) {
		const dTime = deltaTime > 0.5 ? 0.5 : deltaTime;
		let randMap = [
			Math.floor(Math.random() * 2),
			Math.floor(Math.random() * 3),
			Math.floor(Math.random() * 4),
		];

		let pedestrians = this.state.pedestrians;
		this.state.pedestrians = [];
		for(let pedestrian of pedestrians) {
			pedestrian.tick(dTime, this.map, randMap);
			if (!pedestrian.dead) {
				this.state.insertPedestrian(pedestrian);
			} else if ("settled" in pedestrian && pedestrian.settled) {
				this.state.population += 1;
				this.assignWorkers(); // TODO
			}
			if (pedestrian.dead) {
				this.state.orders.onWorkerDeath(pedestrian);
			}
		}

		if(minuteEnded) {
			this.spawnMigrants();
		}
	}

	calcOrdersState(deltaTime: number, minuteEnded: boolean) {
		if(minuteEnded) {
			this.state.orders.onMinuteEnd(this.map.buildings);
		}
		this.state.orders.tick(deltaTime, this.map.buildings, this.map);
	}
	
	spawnMigrants() {
		this.logger.debug("Spawning migrants");
		// TODO
		const freePlaces = this.state.maxPopulation - this.state.population;
		const newMigrants = Math.min(20, freePlaces);
		const emptyHouses = this.getEmptyHouses();
		if (emptyHouses.length == 0) return;
		for (let i=0; i<newMigrants; i++) {
			const migrant = new Migrant(this.sprites.actors["test"], {x: 0, y: 0});
			const randomIndex = Math.floor(Math.random() * emptyHouses.length);
			const emptyHouse = emptyHouses[randomIndex];
			const path = this.map.shortestMigrantPath(migrant.positionSquare, emptyHouse);
			if (path.length > 0) {
				this.logger.debug("Path for migrant:", path);
				migrant.setHome(emptyHouse, path);
				this.state.insertPedestrian(migrant);
			}
		}
	}

	getEmptyHouses(): House[] {
		return this.map.buildings
		.filter(x => x instanceof House)
		.filter(x => x.population < x.maxPopulation);
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

	toBattle() {
		const battle = new Battle();
		this.state.currentBattle = battle;
		this.state.view = "Battle";
		this.applyMap(this.state.tempBattleData!);
		this.applyBattle(this.state.tempBattleData!);
		for(let hero of this.state.team) {
			battle.addHero(hero);
		}

		this.logger.debug("Heroes", this.state.pedestrians);
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

	battleMouseOver() {
		if (!this.state.currentBattle) {
			return;
		}
		const battle = this.state.currentBattle;
		if (!battle.selectedTile) {
			return;
		}
		const start = battle.selectedTile;
		if (!this.map.isTileOnMap(this.map.isoPlayerMouse)) {
			return;
		}

		if (battle.selectedActor) {
			const dist = this.map.shortestPath(start, this.map.isoPlayerMouse, this.sprites.getArrow());
			this.map.pathCorrect =  dist <= battle.selectedActor.movement;
		}
	}

        isMouseOverPedestrian(): BattleActor | undefined {
		const mouse = this.map.isoPlayerMouse;
		for (let pedestrian of this.state.pedestrians) {
			const pos = pedestrian.positionSquare;
			if(pos.x == mouse.x && pos.y == mouse.y) {
				return pedestrian as BattleActor;
			}
		}
		return undefined;
	}

	leftMouseBattle() {
		if (!this.state.currentBattle) {
			return;
		}
		if (!this.map.isTileOnMap(this.map.isoPlayerMouse)) {
			return;
		}
		const battle = this.state.currentBattle;
		const x = this.map.isoPlayerMouse.x;
		const y = this.map.isoPlayerMouse.y;

		if (battle.selectedTile) {
			this.battleProcessAction(battle.selectedTile, {x: x, y: y}, battle.selectedActor);
			battle.selectedTile = undefined;
			battle.selectedActor = undefined;
			return;
		}

		battle.selectedTile = {x: x, y: y};
		battle.selectedActor = this.isMouseOverPedestrian();
		this.logger.debug("Selected actor", battle.selectedActor);
		this.logger.debug("Selected tile", battle.selectedTile);
	}

	battleProcessAction(from: Position, to: Position, actor: BattleActor | undefined) {
		if (!actor || actor.enemy) {
			// TODO
			this.map.clearPath();
			return;
		}
		const dist = this.map.shortestPath(from, to, this.sprites.getArrow());
		let path = this.map.path;
		this.map.clearPath();
		if (dist <= actor.movement && path) {
			actor.setPath(path.map((x) => x.position));
		}
	}

	tempBattleIndex: number = 0; // TODO
	leftMouseBattlePrep() {
		if (!this.state.currentBattle) {
			return;
		}
		if (!this.map.isTileOnMap(this.map.isoPlayerMouse)) {
			return;
		}
		if (this.map.isBlocked(this.map.isoPlayerMouse)) {
			return;
		}
		const battle = this.state.currentBattle;
		const x = this.map.isoPlayerMouse.x;
		const y = this.map.isoPlayerMouse.y;
		while(battle.heroes[this.tempBattleIndex].placed) {
			this.tempBattleIndex += 1;
		}
		const placed = battle.placeHero(this.tempBattleIndex, {x: x, y: y});
		if (!placed) {
			return;
		}
		this.state.pedestrians.push(battle.heroes[this.tempBattleIndex]);

		battle.finishPlacement();
		this.logger.debug(`current index: ${this.tempBattleIndex}, started: ${this.state.currentBattle.battleStarted}`);
	}


	getHouses(): House[] {
		return this.map.buildings
		.filter(x => x instanceof House)
		.filter(x => x.population > 0);
	}

	getBuildingsWithWorkers(): Building[] {
		return this.map.buildings
		.filter(x => x.maxWorkers > 0);
	}

	assignWorkers() {
		// TODO: probably not all population should be available
		const workforce = this.state.population;
		const houses = this.getHouses();
		const buildings = this.getBuildingsWithWorkers();

		const workersNeeded = buildings.reduce((sum, b) => sum + b.maxWorkers, 0);
		this.logger.info(`Needed workers: ${workersNeeded}`)

		let percentage = workforce / workersNeeded;
		this.logger.info(`Percentage of population: ${percentage}`)
		const fullWorkforce = workforce >= workersNeeded;
		let totalEmployment = 0;

		for (let building of buildings) {
			if (fullWorkforce) {
				building.workers = building.maxWorkers;
				totalEmployment += building.maxWorkers;
			} else {
				building.workers = Math.floor(percentage*building.maxWorkers);
				totalEmployment += building.workers;
			}
		}

		if (totalEmployment < workforce) {
			for (let building of buildings) {
				const newWorkers = building.maxWorkers - building.workers;
				totalEmployment += newWorkers;
				if (totalEmployment >= workforce) {
					building.workers = building.maxWorkers - (totalEmployment - workforce);
					totalEmployment = workforce;
					break;
				}
				building.workers = building.maxWorkers;
			}
		}

		this.logger.info(`Current employment: ${totalEmployment}`)
		if (this.state.debugMode) {
			for (let building of buildings) {
				this.logger.info(`${building.workers}/${building.maxWorkers} workers in ${building.name} at (${building.position.x}, ${building.position.y})`);
			}
		}

		const fullEmployment = workforce <= workersNeeded;
		percentage = workersNeeded / workforce;
		for (let house of houses) {
			if (fullEmployment) {
				house.employed = house.population;
				totalEmployment -= house.employed;
			} else {
				house.employed = Math.floor(percentage*house.population);
				totalEmployment -= house.employed;
			}
		}

		if (totalEmployment > 0) {
			for (let house of houses) {
				const newEmployees = house.population - house.employed;
				totalEmployment -= newEmployees;
				if (totalEmployment <= 0) {
					house.employed = house.population + totalEmployment;
					break;
				}
				house.employed = house.population;
			}
		}

		this.logger.info(`Control: ${totalEmployment}`)
		if (this.state.debugMode) {
			for (let house of houses) {
				this.logger.info(`${house.employed}/${house.population} employed in ${house.name} at (${house.position.x}, ${house.position.y})`);
			}
		}
	}
}

export type MapData = CityMapData | BattleMapData;

export interface CityMapData {
	size: Size;
	roads: RoadData[];
	buildings: BuildingData[];
	terrain: TerrainData[];
	actors: ActorData[];
}

export interface BattleMapData {
	size: Size;
	roads: RoadData[];
	buildings: BuildingData[];
	terrain: TerrainData[];
	actors: (ActorData | UnplacedActorData)[];
	spawns: Position[] | undefined;
}

interface RoadData {
	x: number;
	y: number;
}

interface BuildingData {
	x: number;
	y: number;
	type: string;
}

interface TerrainData {
	x: number;
	y: number;
	color?: string;
	cost?: number;
}

interface ActorData extends UnplacedActorData {
	x: number;
	y: number;
}


interface UnplacedActorData {
	enemy?: boolean;
	name: string;
	movement: number;
	type?: HeroType;
	hp: number;
	image: string;
}

interface HoverableLayer {
	isDragging: boolean;
	updateMousePosition(position: Position): void;
	copyMousePosition(): Position;
	getMousePosition(): Position;
}
