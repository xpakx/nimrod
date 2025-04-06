import { AdventurersGuildInterface } from "./interface/adventurers-guild.js";
import { SidebarConfig } from "./interface/sidebar.js";
import { StorageInterface } from "./interface/storage.js";
import { SpriteConfig, BuildingConfig } from "./sprite-library.js";

export const buildingSettings: BuildingConfig[] = [
	{
		sprite: "ziggurat", 
		size: 4,
		maxWorkers: 10,
		interface: new AdventurersGuildInterface(), 
		name: "ziggurat", 
		visibleName: "Temple", 
		cost: 120
	},
	{
		sprite: "house",
		size: 2,
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
	},
	{
		sprite: "tower",
		size: 2,
		maxWorkers: 4,
		name: "tower",
		visibleName: "Tower", 
		cost: 24
	},
	{
		sprite: "well",
		size: 2,
		maxWorkers: 2,
		name: "well",
		visibleName: "Well", 
		cost: 10,
		workerOptions: {
			sprite: "test",
			resource: "water"
		},
		productionOptions: [
			{
				output: {resource: "water", amount: 100},
				ingredients: [],
				time: 1,
			}	
		]
	},
	{
		sprite: "inspector",
		size: 2,
		maxWorkers: 2,
		name: "inspector",
		visibleName: "Inspector Tower", 
		cost: 15,
		workerOptions: {
			sprite: "test",
			repairing: true
		}
	},
	{
		sprite: "farm", 
		size: 4,
		maxWorkers: 6,
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
	},
	{
		sprite: "bakery", 
		size: 2,
		maxWorkers: 4,
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
	},
	{
		sprite: "granary", 
		size: 4,
		maxWorkers: 2,
		interface: new StorageInterface(), 
		name: "storage", 
		visibleName: "Granary", 
		cost: 120,
		workerOptions: {sprite: 'delivery'},
		storageOptions: {
			capacity: 50,
			resources: ['flour', 'bread'],
		},
	},
	{
		sprite: "bakery",  //TODO
		size: 2,
		maxWorkers: 10,
		name: "clay-pit", 
		visibleName: "Clay Pit", 
		cost: 60,
		productionOptions: [
			{
				output: {resource: "clay", amount: 20},
				ingredients: [],
				time: 5,
			}	
		]
	},
	{
		sprite: "bakery",  //TODO
		size: 2,
		maxWorkers: 4,
		name: "pottery-workshop", 
		visibleName: "Pottery Workshop", 
		cost: 200,
		productionOptions: [
			{
				output: {resource: "pot", amount: 5},
				ingredients: [{resource: "clay", amount: 10}],
				time: 5,
			}	
		]
	},
	{
		sprite: "bakery",  //TODO
		size: 4,
		maxWorkers: 6,
		name: "flax-farm", 
		visibleName: "Flax Farm", 
		cost: 70,
		productionOptions: [
			{
				output: {resource: "flax", amount: 50},
				ingredients: [],
				time: 12,
			}	
		]
	},
	{
		sprite: "bakery", // TODO
		size: 2,
		maxWorkers: 8,
		name: "weaver", 
		visibleName: "Weaver", 
		cost: 250,
		productionOptions: [
			{
				output: {resource: "cloth", amount: 1},
				ingredients: [{resource: "flax", amount: 5}],
				time: 5,
			}	
		]
	},
	{
		sprite: "bakery",  //TODO
		size: 4,
		maxWorkers: 6,
		name: "grove", 
		visibleName: "Olive Grove", 
		cost: 230,
		productionOptions: [
			{
				output: {resource: "olives", amount: 50},
				ingredients: [],
				time: 12,
			}	
		]
	},
	{
		sprite: "bakery", // TODO
		size: 2,
		maxWorkers: 10,
		name: "olive-press", 
		visibleName: "Olive Press", 
		cost: 300,
		productionOptions: [
			{
				output: {resource: "olive", amount: 5},
				ingredients: [{resource: "olives", amount: 20}],
				time: 5,
			}	
		]
	},
	{
		sprite: "granary",  // TODO
		size: 4,
		maxWorkers: 2,
		interface: new StorageInterface(), 
		name: "storage2",  // TODO
		visibleName: "Storage", 
		cost: 120,
		workerOptions: {sprite: 'delivery'},
		storageOptions: {
			capacity: 50,
			resources: ['cloth', 'flax', 'clay', 'pot', 'olive', 'olives'],
		},
	},
	{
		sprite: "well", // TODO
		size: 2,
		maxWorkers: 2,
		name: "food-shop",
		visibleName: "Food Shop", 
		interface: new StorageInterface(), // TODO
		cost: 15,
		workerOptions: {
			sprite: "test",
			resource: "food"
		},
		shopOptions: {
			accepts: ["bread"],
		}
	},
	{
		sprite: "well", // TODO
		size: 2,
		maxWorkers: 2,
		name: "ceramic-shop",
		visibleName: "Ceramics Shop", 
		interface: new StorageInterface(), // TODO
		cost: 15,
		workerOptions: {
			sprite: "test",
			resource: "ceramics"
		},
		shopOptions: {
			accepts: ["pot"],
		}
	},
	{
		sprite: "well", // TODO
		size: 2,
		maxWorkers: 2,
		name: "textile-shop",
		visibleName: "Textiles Shop", 
		interface: new StorageInterface(), // TODO
		cost: 15,
		workerOptions: {
			sprite: "test",
			resource: "textiles"
		},
		shopOptions: {
			accepts: ["cloth"],
		}
	},
	{
		sprite: "well", // TODO
		size: 2,
		maxWorkers: 2,
		name: "olive-shop",
		visibleName: "Olive Shop", 
		interface: new StorageInterface(), // TODO
		cost: 15,
		workerOptions: {
			sprite: "test",
			resource: "olive"
		},
		shopOptions: {
			accepts: ["olive"],
		}
	},
];


export const avatarSettings: SpriteConfig[] = [
	{
		name: "ratman",
		sprite: "ratman"
	},
];

export const iconSettings: SpriteConfig[] = [
	{
		name: 'coins',
		sprite: 'coins'
	},
	{
		name: 'population',
		sprite: 'people'
	},
	{
		name: 'road',
		sprite: 'road-button'
	},
	{
		name: 'delete',
		sprite: 'delete-button'
	},
	{
		name: 'world',
		sprite: 'world'
	},
	{
		name: 'city',
		sprite: 'city'
	},
	{
		name: 'kingdom',
		sprite: 'kingdom'
	},
];

export const tabSettings: SidebarConfig = {
	icons: ["housing", "religion", "military", "agriculture", "science", "industry", "tab"],
	tabs: [
		{
			icon: "housing",
			buildings: [
				"home",
				"well",
				"inspector",
				"food-shop",
				"olive-shop",
				"textile-shop",
				"ceramic-shop",
			]
		},
		{
			icon: "religion",
			buildings: ["ziggurat"]
		},
		{
			icon: "military",
			buildings: ["tower"]
		},
		{
			icon: "agriculture",
			buildings: [
				"farm",
				"bakery",
				"flax-farm",
				"grove",
			]
		},
		{
			icon: "science",
			buildings: []
		},
		{
			icon: "industry",
			buildings: [
				"storage",
				"storage2",
				"clay-pit",
				"pottery-workshop",
				"weaver",
				"olive-press",
			]
		},
	]
}
