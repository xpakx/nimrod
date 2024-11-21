import { ActorSprite } from "./actor.js";
import { BuildingSprite, TilingSprite } from "./buildings.js";
import { Size } from "./map-layer.js";

export class SpriteLibrary {
	buildings: {[key: string]: BuildingSprite} = {};
	avatars: {[key: string]: HTMLImageElement} = {};
	icons: {[key: string]: HTMLImageElement} = {};
	actors: {[key: string]: ActorSprite} = {};
	road?: TilingSprite;

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

	async prepareAvatars(): Promise<boolean> {
		this.avatars['ratman'] = await loadImage("./img/portraits/ratman.svg");
		return true;
	}

	async prepareIcons(): Promise<boolean> {
		this.icons['coins'] = await loadImage("./img/coins.svg");
		this.icons['population'] = await loadImage("./img/people.svg");
		this.icons['road'] = await loadImage("./img/road-button.svg");
		this.icons['delete'] = await loadImage("./img/delete-button.svg");
		this.icons['world'] = await loadImage("./img/world.svg");
		this.icons['city'] = await loadImage("./img/city.svg");
		this.icons['kingdom'] = await loadImage("./img/kingdom.svg");
		return true;
	}

	async prepareActorSprites(tileSize: Size): Promise<boolean> {
		this.actors['test'] = new ActorSprite(await loadImage("./img/house.svg"), 2, tileSize);
		return true;
	}

	getRoad(): TilingSprite {
		return this.road!;
	}

	async prepareRoadSprites(tileSize: Size): Promise<boolean> {
		const roads = [
			await loadImage("./img/road0000.svg"), 
			await loadImage("./img/road0001.svg"), 
			await loadImage("./img/road0010.svg"), 
			await loadImage("./img/road0011.svg"), 
			await loadImage("./img/road0100.svg"), 
			await loadImage("./img/road0101.svg"), 
			await loadImage("./img/road0110.svg"), 
			await loadImage("./img/road0111.svg"), 
			await loadImage("./img/road1000.svg"), 
			await loadImage("./img/road1001.svg"), 
			await loadImage("./img/road1010.svg"), 
			await loadImage("./img/road1011.svg"), 
			await loadImage("./img/road1100.svg"), 
			await loadImage("./img/road1101.svg"), 
			await loadImage("./img/road1110.svg"), 
			await loadImage("./img/road1111.svg"), 
		];
		this.road = new TilingSprite(roads, tileSize);
		return true;
	}

	rescaleSprites(tileSize: Size) {
		for (const key in this.buildings) {
			this.buildings[key].refreshSize(tileSize);
		}
		this.getRoad().refreshSize(tileSize);
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

