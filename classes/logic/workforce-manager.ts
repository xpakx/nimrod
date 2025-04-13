import { Game } from "../game.js";
import { getLogger, Logger } from "../logger.js";

export class WorkforceManager {
	logger: Logger = getLogger("CityLogicLayer");

	assignWorkers(game: Game) {
		// TODO: probably not all population should be available
		const workforce = game.state.population;
		const houses = game.getNormalWorkforce();
		const buildings = game.getBuildingsWithNormalWorkers();

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
		if (game.state.debugMode) {
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
		if (game.state.debugMode) {
			for (let house of houses) {
				this.logger.info(`${house.employed}/${house.population} employed in ${house.name} at (${house.position.x}, ${house.position.y})`);
			}
		}
	}
}
