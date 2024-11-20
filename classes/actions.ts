import { GameState } from "./game-state.js";
import { Action, InterfaceLayer } from "./interface.js";
import { MapLayer } from "./map-layer.js";
import { SpriteLibrary } from "./sprite-library.js";

export function rightMouseClick(_event: MouseEvent, sprites: SpriteLibrary, state: GameState, interf: InterfaceLayer, map: MapLayer) {
	if(interf.mouseInsideInterface(state.playerMouse)) {
		const clickResult = interf.click(state.playerMouse);
		if (clickResult != undefined) {
			rightMouseCityInterface(clickResult, sprites, map);
		}
		return;
	}
	if (state.view == "City") {
		rightMouseCity(sprites, map);
	}
}

function rightMouseCity(sprites: SpriteLibrary, map: MapLayer) {
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

function rightMouseCityInterface(clickResult: Action, sprites: SpriteLibrary, map: MapLayer) {
	if(clickResult.action == "build" && clickResult.argument != undefined) {
		const clickedBuilding = sprites.buildings[clickResult.argument];
		if (clickedBuilding) map.switchToBuildMode(clickedBuilding);
	} else if(clickResult.action == "buildRoad") {
		map.switchToRoadMode(sprites.getRoad());
	} else if(clickResult.action == "delete") {
		map.switchToDeleteMode();
	}
}

export function middleMouseClick(event: MouseEvent, map: MapLayer) {
	map.isDragging = true;
	map.dragStart.x = event.clientX + map.positionOffset.x;
	map.dragStart.y = event.clientY + map.positionOffset.y;
}
