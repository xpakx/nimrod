import { Building, BuildingInterface } from "../building/buildings.js";
import { GameState } from "../game-state.js";

export class StorageInterface extends BuildingInterface {

	open(state: GameState, building: Building) {
		this.preRender(state, building);
		this.renderInterface();
		this.renderResources();
	}

	renderResources() {
		if (!this.building) return;
		if (!this.context) return;
		const topPadding = 10;
		const imageSize = 80;
		const imagePadding = 20;
		const imageEnd = topPadding + 24 + 20;

		const leftPadding = 10;

		const lineHeight = 20;
		let i = 0;

		this.context.fillStyle = '#fff';
		this.context.font = '15px Arial';
		const resourcesX = leftPadding + imageSize + 2*imagePadding + 20;

		const resources = this.building.storage;
		for (let resource in resources) {
			const amount = this.building.getResourceAmount(resource);
			const resourceString = `${resource} (${amount}) `;
			console.log(`${resource}, ${amount}`);
			this.context.fillText(resourceString, resourcesX, imageEnd + i * lineHeight);
			i += 1;
		}
	}
}
