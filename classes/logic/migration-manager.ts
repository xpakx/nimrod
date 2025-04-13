import { House, Migrant } from "../building/house.js";
import { Game } from "../game.js";
import { getLogger, Logger } from "../logger.js";

export class MigrationManager {
	logger: Logger = getLogger("MigrationManager");
	timeSinceLastHeroCheck: number = 0;
	heroSpawnFrequencyInSeconds: number = 5;

	spawnMigrants(game: Game) {
		if (game.state.view != "City") return;
		this.logger.debug("Spawning migrants");

		const happiness = game.getNormalWorkforce().reduce((sum, b) => sum + b.getHappiness(), 0);
		this.logger.debug(`Current happines: ${happiness}`);

		// TODO: vary spawned migrants based on happiness
		// TODO: spawn migrants for elite houses
		if (happiness < 0) {
			return;
		}
		const freePlaces = game.state.maxPopulation - game.state.population;
		const newMigrants = Math.min(20, freePlaces);
		const emptyHouses = game.map.getEmptyHouses();
		if (emptyHouses.length == 0) return;
		for (let i=0; i<newMigrants; i++) {
			const migrant = new Migrant(game.sprites.actors["test"], {x: 0, y: 0});
			const randomIndex = Math.floor(Math.random() * emptyHouses.length);
			const emptyHouse = emptyHouses[randomIndex];
			const path = game.map.shortestMigrantPath(migrant.positionSquare, emptyHouse);
			if (path.length > 0) {
				this.logger.debug("Path for migrant:", path);
				migrant.setHome(emptyHouse, path);
				game.state.insertPedestrian(migrant);
			}
		}
	}

	spawnHeroes(game: Game, deltaTime: number) {
		if (game.state.view != "City") return;
		this.timeSinceLastHeroCheck += deltaTime;
		if(this.timeSinceLastHeroCheck < this.heroSpawnFrequencyInSeconds) return;
		this.timeSinceLastHeroCheck = 0;
		this.logger.debug("Spawning heroes");

		const houses = game.map.getEmptyHeroHouses();
		for (let house of houses) {
			this.spawnHeroForHouse(game, house);
		}
	}

	spawnHeroForHouse(game: Game, house: House) {
		if (!house.hero) return;
		this.logger.debug(`Spawning ${house.hero.name}`);
		const migrant = new Migrant(house.hero.sprite, {x: 0, y: 0});
		const index = game.state.spawnedHeroes.indexOf(house.hero!);
		if (index != -1) return;
		const path = game.map.shortestMigrantPath(migrant.positionSquare, house);
		if (path.length > 0) {
			migrant.setHome(house, path);
			game.state.insertPedestrian(migrant);
			game.state.spawnedHeroes.push(house.hero!);
		}
	}

	settleMigrant(game: Game, migrant: Migrant) {
		const house = migrant.targetHome;
		const realBuilding = house ? game.map.getBuilding(house.position) : undefined;
		if (realBuilding && house == realBuilding) {
			if (house.workforce != "warrior") {
				game.state.population += 1;
				game.cityLogic.workforce.assignWorkers(game);
			}
			if (house.workforce == "warrior" && house.hero) {
				game.state.allHeroes.push(house.hero);
				const indexAll = game.state.spawnedHeroes.indexOf(house.hero);
				if (indexAll !== -1) game.state.spawnedHeroes.splice(indexAll, 1);
			}
		}
	}
}
