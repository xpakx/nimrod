import { GameState } from "./game-state.js";
import { Action, ActionButton, ButtonRow, InterfaceLayer } from "./interface.js";
import { MapLayer, Size } from "./map-layer.js";
import { SpriteLibrary } from "./sprite-library.js";

export class Game {
	state: GameState;
	map: MapLayer;
	interf: InterfaceLayer;
	sprites: SpriteLibrary;

	constructor() {
		this.state = new GameState();
		const size: Size = {
			width: this.state.canvasWidth, 
			height: this.state.canvasHeight
		}; 
		this.map = new MapLayer(size);
		this.interf = new InterfaceLayer(size);
		this.sprites = new SpriteLibrary();
	}

	async prepareAssets() {
		await this.sprites.prepareBuildingSprites(this.map.tileSize);
		await this.sprites.prepareActorSprites(this.map.tileSize);
		await this.sprites.prepareAvatars();
		await this.sprites.prepareIcons();
		await this.sprites.prepareRoadSprites(this.map.tileSize);
		this.interf.coinsIcon = this.sprites.icons['coins'];
		this.interf.populationIcon = this.sprites.icons['population'];
		this.interf.calculateIconsSize();

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
}
