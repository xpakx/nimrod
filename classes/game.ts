import { GameState } from "./game-state.js";
import { Action, ActionButton, ButtonRow, InterfaceLayer } from "./interface.js";
import { MapLayer, Position, Size } from "./map-layer.js";
import { SpriteLibrary } from "./sprite-library.js";
import { prepareTabs } from "./sidebar.js";
import { Actor } from "./actor.js";
import { BattleActor } from "./battle/actor.js";
import { Battle } from "./battle/battle.js";

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
			this.map.deleteRoad(this.map.isoPlayerMouse);
		} else if(this.map.roadMode) {
			this.map.putRoad(this.map.isoPlayerMouse, this.sprites.getRoad());
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

	applyMap(data: MapData) {
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
		this.map.getBuilding({x: 3, y: 11})!.setWorker(this.sprites.buildings["home"]);
	}

	loadMap(filename: string) {
		fetch(`maps/${filename}`)
		.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error while loading a map! status: ${response.status}`);
			}
			return response.json();
		})
		.then((data: MapData) => this.applyMap(data))
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
			case '+': {
				this.rescale(0.2);
			}
			break;
			case '-': {
				this.rescale(-0.2);
			}
			break;
			case '0': case 'Escape': this.map.switchToNormalMode(); break;
			case '9': this.map.switchToDeleteMode(); break;
			case 'Enter': this.interf.dialogueAction(); break;
			case 'F9': this.state.debugMode = !this.state.debugMode; break;
			case 'F8': this.toBattle(); break;
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
			if(newPedestrian && building.workerSpawn) {
				this.state.pedestrians.push(new Actor(this.sprites.actors['test'], building.workerSpawn));
			}
		}
		const dTime = deltaTime > 0.5 ? 0.5 : deltaTime;
		let diagonalChanged = false;

		let randMap = [
			Math.floor(Math.random() * 2),
			Math.floor(Math.random() * 3),
			Math.floor(Math.random() * 4),
		]
		for(let pedestrian of this.state.pedestrians) {
			diagonalChanged ||= pedestrian.tick(dTime, this.map.roads, randMap);
		}
		this.state.pedestrians = this.state.pedestrians.filter((p) => !p.dead);
		if(diagonalChanged) {
			this.state.sortPedestrians(); // TODO: more efficient way?
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
		this.map.path = [];
		this.addWorldButtons();
		this.state.view = "World";
	}

	toKingdom() {
		this.map.path = [];
		this.addKingdomButtons();
		this.state.view = "Kingdom";
	}

	toCity() {
		this.map.path = [];
		this.addCityButtons();
		this.state.view = "City";
	}

	toMenu() {
		this.map.path = [];
		this.state.view = "Menu";
	}

	toBattle() {
		const battle = new Battle();
		this.state.currentBattle = battle;
		this.state.view = "Battle";
		const hero = new BattleActor(this.sprites.actors['test'], {x: 1, y: 9});
		hero.name = "Test Soldier";
		hero.hp = 100;
		const enemy = new BattleActor(this.sprites.actors['test'], {x: 9, y: 9});
		enemy.name = "Test Goblin";
		enemy.hp = 20;
		enemy.enemy = true;

		this.map.resetMap({width: 10, height: 10});
		this.state.pedestrians = [];
		this.state.pedestrians.push(hero);
		this.state.pedestrians.push(enemy);
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
			// if dist <= actor.movement
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
			this.map.path = [];
			return;
		}
		const dist = this.map.shortestPath(from, to, this.sprites.getArrow());
		this.map.path = [];
		if (dist <= actor.movement) {
			actor.position = to;
			actor.positionSquare = to;
		}
	}
}

export interface MapData {
	size: Size;
	roads: RoadData[];
	buildings: BuildingData[];
	terrain: TerrainData[];
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
