import { BuildingSprite } from "./buildings.js";
import { Size } from "./map-layer.js";

export class SpriteLibrary {
	buildings: {[key: string]: BuildingSprite} = {};

	async prepareBuildingSprites(tileSize: Size): Promise<boolean> {
		const ziggurat = new BuildingSprite(await loadImage("./img/ziggurat.svg"), 4, tileSize);
		const home = new BuildingSprite(await loadImage("./img/house.svg"), 2, tileSize);
		const tower = new BuildingSprite(await loadImage("./img/tower.svg"), 2, tileSize);
		const well = new BuildingSprite(await loadImage("./img/well.svg"), 2, tileSize);
		const inspector = new BuildingSprite(await loadImage("./img/inspector.svg"), 2, tileSize);

		this.buildings["ziggurat"] = ziggurat;
		this.buildings["home"] = home;
		this.buildings["tower"] = tower;
		this.buildings["well"] = well;
		this.buildings["inspector"] = inspector;
		return true;
	}
}

async function loadImage(url: string): Promise<any> {
    const image = new Image();
    image.src = url;
    return new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = reject;
    });
}

