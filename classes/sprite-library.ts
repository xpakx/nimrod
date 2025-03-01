import { ActorSprite } from "./actor.js";
import { AdventurersGuildInterface } from "./building/adventurers-guild.js";
import { StorageInterface } from "./building/storage.js";
import { BuildingInterface, BuildingPrototype, BuildingSprite, TilingSprite } from "./buildings.js";
import { Size } from "./map-layer.js";

export class SpriteLibrary {
	buildings: {[key: string]: BuildingPrototype} = {};
	avatars: {[key: string]: HTMLImageElement} = {};
	icons: {[key: string]: HTMLImageElement} = {};
	actors: {[key: string]: ActorSprite} = {};
	road?: TilingSprite;
	arrow?: TilingSprite;

	async prepareBuildingSprites(tileSize: Size): Promise<boolean> {
		const ziggurat = new BuildingSprite(await loadImage("./img/ziggurat.svg"), 4, tileSize);
		const home = new BuildingSprite(await loadImage("./img/house.svg"), 2, tileSize);
		const tower = new BuildingSprite(await loadImage("./img/tower.svg"), 2, tileSize);
		const well = new BuildingSprite(await loadImage("./img/well.svg"), 2, tileSize);
		const inspector = new BuildingSprite(await loadImage("./img/inspector.svg"), 2, tileSize);
		const farm = new BuildingSprite(await loadImage("./img/farm.svg"), 4, tileSize); // TODO
		const bakery = new BuildingSprite(await loadImage("./img/bakery.svg"), 2, tileSize);
		const storage = new BuildingSprite(await loadImage("./img/granary.svg"), 4, tileSize);


		this.buildings["ziggurat"] = {
			sprite: ziggurat, 
			interface: new AdventurersGuildInterface(), 
			name: "ziggurat", 
			visibleName: "Temple", 
			cost: 120
		};
		this.buildings["home"] = {
			sprite: home,
			interface: new BuildingInterface(),
			name: "home",
			visibleName: "House", 
			cost: 12,
			houseOptions: {
				levels: [
					{
						maxPopulation: 8, 
						needs: [
							{resource: "water", consumptionPerPerson: 0.25},
							{resource: "food", consumptionPerPerson: 0.5}
						]
					}
				]
			}
		};
		this.buildings["tower"] = {
			sprite: tower,
			interface: new BuildingInterface(),
			name: "tower",
			visibleName: "Tower", 
			cost: 24
		};
		this.buildings["well"] = {
			sprite: well,
			interface: new BuildingInterface(),
			name: "well",
			visibleName: "Well", 
			cost: 10,
			workerOptions: {
				sprite: this.actors['test'],
				resource: "water"
			},
			productionOptions: [
				{
					output: {resource: "water", amount: 100},
					ingredients: [],
					time: 1,
				}	
			]
		};
		this.buildings["inspector"] = {
			sprite: inspector,
			interface: new BuildingInterface(),
			name: "inspector",
			visibleName: "Inspector Tower", 
			cost: 15,
			workerOptions: {
				sprite: this.actors['test'],
				repairing: true
			}
		};

		this.buildings["farm"] = {
			sprite: farm, 
			interface: new BuildingInterface(), 
			name: "farm", 
			visibleName: "Wheat Farm", 
			cost: 80,
			productionOptions: [
				{
					output: {resource: "flour", amount: 50},
					ingredients: [],
					time: 12,
				}	
			]
		};
		this.buildings["bakery"] = {
			sprite: bakery, 
			interface: new BuildingInterface(), 
			name: "bakery", 
			visibleName: "Bakery", 
			cost: 240,
			productionOptions: [
				{
					output: {resource: "bread", amount: 5},
					ingredients: [{resource: "flour", amount: 10}],
					time: 5,
				}	
			]
		};
		this.buildings["storage"] = {
			sprite: storage, 
			interface: new StorageInterface(), 
			name: "storage", 
			visibleName: "Granary", 
			cost: 120,
			workerOptions: {sprite: this.actors['delivery']},
			storageOptions: {
				capacity: 50,
				resources: ['flour', 'bread'],
			},
		};

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
		this.actors['delivery'] = new ActorSprite(await loadImage("./img/house.svg"), 2, tileSize);
		this.actors['delivery'].fillStyle = "blue";
		return true;
	}

	getRoad(): TilingSprite {
		return this.road!;
	}

	getArrow(): TilingSprite {
		return this.arrow!;
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

	async prepareArrowSprites(tileSize: Size): Promise<boolean> {
		const arrows = [
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow0101.svg"), 
			await loadImage("./img/arrow0110.svg"), 
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow1001.svg"), 
			await loadImage("./img/arrow1010.svg"), 
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow1100.svg"), 
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow0011.svg"), 
			await loadImage("./img/arrow0011.svg"), 
		];

		this.arrow = new TilingSprite(arrows, tileSize);
		return true;
	}

	rescaleSprites(tileSize: Size) {
		for (const key in this.buildings) {
			this.buildings[key].sprite.refreshSize(tileSize);
		}
		this.getRoad().refreshSize(tileSize);
		this.getArrow().refreshSize(tileSize);
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

