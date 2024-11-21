import { GameState } from "./game-state.js";
import { Action, InterfaceLayer } from "./interface.js";
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

	async prepareGame() {
		await this.sprites.prepareBuildingSprites(this.map.tileSize);
		await this.sprites.prepareRoadSprites(this.map.tileSize);
	}

	rightMouseClick(_event: MouseEvent, sprites: SpriteLibrary, state: GameState, interf: InterfaceLayer, map: MapLayer) {
		if(interf.mouseInsideInterface(state.playerMouse)) {
			this.rightMouseInterface(interf, sprites, map, state);
			return;
		}
		this.rightMouseClickMain(sprites, map, state);
	}

	rightMouseClickMain(sprites: SpriteLibrary, map: MapLayer, state: GameState) {
		switch (state.view) {
			case "City":
				this.rightMouseCity(sprites, map);
		}
	}

	rightMouseCity(sprites: SpriteLibrary, map: MapLayer) {
		if(map.mode) {
			map.putBuilding(map.isoPlayerMouse, map.mode, false);
			map.finalizeBuildingPlacement(map.isoPlayerMouse);
		} else if(map.deleteMode) {
			map.deleteBuilding(map.isoPlayerMouse);
			map.deleteRoad(map.isoPlayerMouse);
		} else if(map.roadMode) {
			map.putRoad(map.isoPlayerMouse, sprites.getRoad());
		}
	}

	rightMouseInterface(interf: InterfaceLayer, sprites: SpriteLibrary, map: MapLayer, state: GameState) {
		const clickResult = interf.click(state.playerMouse);
		if (!clickResult) {
			return;
		}
		switch (state.view) {
			case "City":
				this.rightMouseCityInterface(clickResult, sprites, map);
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

	middleMouseClick(event: MouseEvent, map: MapLayer) {
		map.isDragging = true;
		map.dragStart.x = event.clientX + map.positionOffset.x;
		map.dragStart.y = event.clientY + map.positionOffset.y;
	}
}
