import { GameState } from "./game-state.js";
import { Action, ActionButton, ButtonRow, InterfaceLayer } from "./interface.js";
import { MapLayer, Size } from "./map-layer.js";
import { SpriteLibrary } from "./sprite-library.js";
import { prepareTabs } from "./sidebar.js";
import { TilingSprite } from "./buildings.js";

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
		this.interf.coinsIcon = this.sprites.icons['coins'];
		this.interf.populationIcon = this.sprites.icons['population'];

		this.interf.tabs = await prepareTabs(this.sprites.buildings);
		this.interf.tab = 0;
		this.interf.calculateIconsSize();
		this.interf.recalculateTabSize();
		this.interf.calculateTabIcons();

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
				new ActionButton(this.sprites.icons['city'], {action: "goTo", argument: "city"}, {width: 50, height: 50}),
				new ActionButton(this.sprites.icons['kingdom'], {action: "goTo", argument: "kingdom"}, {width: 50, height: 50}),
				new ActionButton(this.sprites.icons['world'], {action: "goTo", argument: "map"}, {width: 50, height: 50}),
			]
		};
		this.interf.addButtonRow(mapRow);
	}

	rightMouseClick(_event: MouseEvent) {
		if(this.interf.mouseInsideInterface(this.state.playerMouse)) {
			this.rightMouseInterface();
			return;
		}
		this.rightMouseClickMain();
	}

	rightMouseClickMain() {
		switch (this.state.view) {
			case "City":
				this.rightMouseCity();
		}
	}

	rightMouseCity() {
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

	rightMouseInterface() {
		const clickResult = this.interf.click(this.state.playerMouse);
		if (!clickResult) {
			return;
		}
		switch (this.state.view) {
			case "City":
				this.rightMouseCityInterface(clickResult, this.sprites, this.map);
		}
	}

	rightMouseCityInterface(clickResult: Action, sprites: SpriteLibrary, map: MapLayer) {
		if(clickResult.action == "build" && clickResult.argument != undefined) {
			const clickedBuilding = sprites.buildings[clickResult.argument];
			if (clickedBuilding) map.switchToBuildMode(clickedBuilding);
		} else if(clickResult.action == "buildRoad") {
			map.switchToRoadMode(sprites.getRoad());
		} else if(clickResult.action == "delete") {
			map.switchToDeleteMode();
		}
	}

	middleMouseClick(event: MouseEvent) {
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

	loadMap(filename: string) {
		fetch(`maps/${filename}`)
		.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error while loading a map! status: ${response.status}`);
			}
			return response.json();
		})
		.then(data => {
			console.log(data);
			const height = data['size']['height']; 
			const width = data['size']['width']; 
			const newMap: string[][] = Array(height).fill(null).map(() => Array(width).fill('#97b106'));
			this.map.map = newMap;

			for (let pos of data['roads']) {
				this.map.putRoad({x: pos['x'], y: pos['y']}, this.sprites.getRoad(), true);
			}

			for (let building of data['buildings']) {
				this.map.putBuilding({x: building['x'], y: building['y']}, this.sprites.buildings[building['type']]);
			}
			this.map.getBuilding({x: 3, y: 11})!.setWorker(this.sprites.buildings["home"]);
		})
		.catch(error => {
			console.log(error);
			throw new Error(`Error loading the JSON file: ${error}`);
		});
	}
}
