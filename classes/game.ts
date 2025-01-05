import { GameState } from "./game-state.js";
import { Action, ActionButton, ButtonRow, InterfaceLayer } from "./interface.js";
import { MapLayer, Position, Size } from "./map-layer.js";
import { SpriteLibrary } from "./sprite-library.js";
import { prepareTabs } from "./sidebar.js";
import { Actor } from "./actor.js";
import { BattleActor, HeroType } from "./battle/actor.js";
import { Battle } from "./battle/battle.js";
import { BuildingWorker } from "./buildings.js";

export class Game {
	state: GameState;
	map: MapLayer;
	interf: InterfaceLayer;
	sprites: SpriteLibrary;
	maxYOffset: number;
	minXOffset: number;
	maxXOffset: number;

	constructor() {
		this.state = new GameState();
		const size: Size = {
			width: this.state.canvasWidth, 
			height: this.state.canvasHeight
		}; 
		this.map = new MapLayer(size);
		this.interf = new InterfaceLayer(size);
		this.sprites = new SpriteLibrary();

		this.maxYOffset = this.map.isoToScreen({x: this.map.map[0].length - 1, y: this.map.map.length - 1}).y + (this.map.tileSize.height/2);
		this.minXOffset = this.map.isoToScreen({x: 0, y: this.map.map.length - 1}).x  - (this.map.tileSize.width/2);
		this.maxXOffset = this.map.isoToScreen({x: this.map.map[0].length - 1, y: 0}).x  + (this.map.tileSize.width/2);
	}

	async prepareAssets() {
		await this.sprites.prepareBuildingSprites(this.map.tileSize);
		await this.sprites.prepareActorSprites(this.map.tileSize);
		await this.sprites.prepareAvatars();
		await this.sprites.prepareIcons();
		await this.sprites.prepareRoadSprites(this.map.tileSize);
		await this.sprites.prepareArrowSprites(this.map.tileSize);
		this.interf.coinsIcon = this.sprites.icons['coins'];
		this.interf.populationIcon = this.sprites.icons['population'];

		this.interf.tabs = await prepareTabs(this.sprites.buildings);
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
		this.leftMouseClickMain();
	}

	leftMouseClickMain() {
		switch (this.state.view) {
			case "City":
				this.leftMouseCity();
				break;
			case "Battle":
				this.leftMouseBattle();
				break;
		}
	}

	leftMouseCity() {
		if(this.map.mode) {
			this.map.putBuilding(this.map.isoPlayerMouse, this.map.mode, false);
			this.map.finalizeBuildingPlacement(this.map.isoPlayerMouse);
		} else if(this.map.deleteMode) {
			this.map.deleteBuilding(this.map.isoPlayerMouse);
			if (this.map.isRoad(this.map.isoPlayerMouse)) {
				this.map.deleteRoad(this.map.isoPlayerMouse);
				this.map.floydWarshall(); // TODO: optimize
			}
		} else if(this.map.roadMode) {
			this.map.putRoad(this.map.isoPlayerMouse, this.sprites.getRoad());
			this.map.floydWarshall(); // TODO: optimize
		} else {
			const building = this.map.getCurrentBuilding();
			if (building) {
				this.interf.buildingInterface = building.interface;
				building.interface.open(this.state);
			}
		}
	}

	leftMouseInterface() {
		const clickResult = this.interf.click(this.state.playerMouse);
		if (!clickResult) {
			return;
		}
		switch (this.state.view) {
			case "City":
				this.leftMouseCityInterface(clickResult, this.sprites, this.map);
		}
		this.leftMouseGeneric(clickResult);
	}

	leftMouseCityInterface(clickResult: Action, sprites: SpriteLibrary, map: MapLayer) {
		if(clickResult.action == "build" && clickResult.argument != undefined) {
			const clickedBuilding = sprites.buildings[clickResult.argument];
			if (clickedBuilding) map.switchToBuildMode(clickedBuilding);
		} else if(clickResult.action == "buildRoad") {
			map.switchToRoadMode(sprites.getRoad());
		} else if(clickResult.action == "delete") {
			map.switchToDeleteMode();
		} 
	}

	leftMouseGeneric(clickResult: Action) {
		if(clickResult.action == "goTo") {
			console.log("Go to: " + clickResult.argument);
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
		console.log(data);
		this.map.resetMap(data.size);

		for (let pos of data.roads) {
			this.map.putRoad({x: pos.x, y: pos.y}, this.sprites.getRoad(), true);
		}

		for (let building of data.buildings) {
			this.map.putBuilding({x: building.x, y: building.y}, this.sprites.buildings[building.type]);
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

	applyBattle(data: MapData) {
		if (!this.state.currentBattle) {
			return;
		}
		this.state.currentBattle.enemies  = [];
		this.state.currentBattle.heroes  = [];

		if (data.actors) {
			for (let actor of data.actors) {
				const sprite = this.sprites.actors[actor.image];
				let pedestrian = new BattleActor(sprite, {x: actor.x, y: actor.y}); 
				if (actor.enemy === false || actor.enemy === undefined) {
					pedestrian.enemy = false;
				}
				pedestrian.name = actor.name;
				pedestrian.movement = actor.movement;
				pedestrian.hp = actor.hp;
				if (actor.type) {
					pedestrian.type = actor.type;
				}
				this.state.pedestrians.push(pedestrian);
				if(pedestrian.enemy) {
					this.state.currentBattle.enemies.push(pedestrian);
				} else {
					this.state.currentBattle.heroes.push(pedestrian);
				}

			}
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
			console.log(error);
			throw new Error(`Error loading the JSON file: ${error}`);
		});
	}

	onMouseMove(event: MouseEvent, canvas: HTMLCanvasElement) {
		const rect = canvas.getBoundingClientRect();

		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;
		this.state.playerMouse = {x: mouseX, y: mouseY};
		if(!this.interf.mouseInsideInterface(this.state.playerMouse)) {
			const oldX = this.map.isoPlayerMouse.x;
			const oldY = this.map.isoPlayerMouse.y;
			this.map.updateMousePosition(this.state.playerMouse);
			const newX = this.map.isoPlayerMouse.x;
			const newY = this.map.isoPlayerMouse.y;
			const isoChange = (oldX != newX || oldY != newY);
			if (this.state.view == "Battle" || isoChange) {
				this.battleMouseOver();
			}
		} 
		this.interf.onMouse(this.state.playerMouse);

		if (this.map.isDragging && this.terrainView()) {
			this.map.positionOffset.x = this.map.dragStart.x - event.clientX;
			this.map.positionOffset.y = this.map.dragStart.y - event.clientY;
			this.correctOffset();
		}
	}

	onMouseUp(_event: MouseEvent) {
		this.map.isDragging = false;
	}

	onMouseWheel(event: WheelEvent) {
		if(this.map.isDragging) {
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
				break;
			case 'F8':
				this.toBattle();
				break;
			case 'F7':
				this.map.floydWarshall();
				console.log(this.map.pred);
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
		for(let building of this.map.buildings) {
			const newPedestrian = building.tick(deltaTime);
			if(newPedestrian && building.workerSpawn && building.worker) {
				building.worker.setPosition(building.workerSpawn);
				this.state.insertPedestrian(building.worker);
			}
		}
		const dTime = deltaTime > 0.5 ? 0.5 : deltaTime;

		let randMap = [
			Math.floor(Math.random() * 2),
			Math.floor(Math.random() * 3),
			Math.floor(Math.random() * 4),
		]
		let pedestrians = this.state.pedestrians;
		this.state.pedestrians = [];
		for(let pedestrian of pedestrians) {
			pedestrian.tick(dTime, this.map, randMap);
			if (!pedestrian.dead) {
				this.state.insertPedestrian(pedestrian);
			}
		}
	}

	renderGame(context: CanvasRenderingContext2D, deltaTime: number) {
		context.clearRect(0, 0, this.state.canvasWidth, this.state.canvasHeight);
		if (this.terrainView()) {
			this.map.renderMap(context, this.state.pedestrians, deltaTime);
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

		console.log(this.state.pedestrians);
	}

	addCityButtons() {
		this.interf.buttons = [];
		const menuRow: ButtonRow = {
			y: this.interf.buildingMenuHeight + 50,	
			buttons: [
				new ActionButton(this.sprites.icons['road'], {action: "buildRoad", argument: undefined}, {width: 40, height: 40}),
				new ActionButton(this.sprites.icons['delete'], {action: "delete", argument: undefined}, {width: 40, height: 40}),
			]
		};
		this.interf.addButtonRow(menuRow);

		const mapRow: ButtonRow = {
			y: this.state.canvasHeight - 80,	
			buttons: [
				new ActionButton(this.sprites.icons['kingdom'], {action: "goTo", argument: "Kingdom"}, {width: 50, height: 50}),
				new ActionButton(this.sprites.icons['world'], {action: "goTo", argument: "World"}, {width: 50, height: 50}),
			]
		};
		this.interf.addButtonRow(mapRow);
	}

	addKingdomButtons() {
		this.interf.buttons = [];
		const mapRow: ButtonRow = {
			y: this.state.canvasHeight - 80,	
			buttons: [
				new ActionButton(this.sprites.icons['city'], {action: "goTo", argument: "City"}, {width: 50, height: 50}),
				new ActionButton(this.sprites.icons['world'], {action: "goTo", argument: "World"}, {width: 50, height: 50}),
			]
		};
		this.interf.addButtonRow(mapRow);
	}

	addWorldButtons() {
		this.interf.buttons = [];
		const mapRow: ButtonRow = {
			y: this.state.canvasHeight - 80,	
			buttons: [
				new ActionButton(this.sprites.icons['city'], {action: "goTo", argument: "City"}, {width: 50, height: 50}),
				new ActionButton(this.sprites.icons['kingdom'], {action: "goTo", argument: "Kingdom"}, {width: 50, height: 50}),
			]
		};
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
		console.log(battle.selectedActor);
		console.log(battle.selectedTile);
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
}

export interface MapData {
	size: Size;
	roads: RoadData[];
	buildings: BuildingData[];
	terrain: TerrainData[];
	actors: ActorData[];
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

interface ActorData {
	x: number;
	y: number;
	enemy?: boolean;
	name: string;
	movement: number;
	type?: HeroType;
	hp: number;
	image: string;
}
