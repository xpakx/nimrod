import { GameState } from "../game-state.js";
import { Game } from "../game.js";
import { Action } from "../interface/actions.js";
import { AdventurersGuildInterface } from "../interface/adventurers-guild.js";
import { getLogger, Logger } from "../logger.js";
import { MapLayer } from "../map-layer.js";

export class CityInterfaceLogic {
	logger: Logger = getLogger("CityInterfaceLogic");

	updateCost(map: MapLayer, state: GameState) {
		if(map.mode.action == "build") {
			map.tooCostly = state.money < map.mode.prototype.cost;
		} else if (map.mode.action == "buildRoad") {
			map.tooCostly = state.money < 2;
		}
	}

	leftMouseCityInterface(clickResult: Action, game: Game) {
		if(clickResult.action == "build" && clickResult.argument != undefined) {
			const clickedBuilding = game.sprites.buildings[clickResult.argument];
			if (clickedBuilding) game.map.switchToBuildMode(clickedBuilding);
			this.updateCost(game.map, game.state);
		} else if(clickResult.action == "buildRoad") {
			game.map.switchToRoadMode(game.sprites.getRoad());
			this.updateCost(game.map, game.state);
		} else if(clickResult.action == "delete") {
			game.map.switchToDeleteMode();
		} else if(clickResult.action == "removeHero") {
			this.logger.debug("Removing hero from team");
			const index = game.state.team.findIndex((hero) => hero === clickResult.hero);
			game.state.team.splice(index, 1);
			this.logger.debug("Team:", game.state.team);
			const guild = game.interf.buildingInterface as (AdventurersGuildInterface | undefined);
			if (guild) {
				guild.prepareTeamButtons();
				guild.renderInterface();
			}
		} else if(clickResult.action == "addHero") {
			this.logger.debug("Adding hero to team");
			const maxTeamSize = 6;
			if (game.state.team.length >= maxTeamSize) {
				return;
			}
			const hero = clickResult.hero;
			if (game.state.team.includes(hero)) {
				return;
			}
			game.state.team.push(hero);
			this.logger.debug("Team:", game.state.team);
			const guild = game.interf.buildingInterface as (AdventurersGuildInterface | undefined);
			if (guild) {
				guild.prepareTeamButtons();
				guild.renderInterface();
			}
		}
	}
}
