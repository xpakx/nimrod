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
			buildings: ["home", "well", "inspector"]
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
			buildings: ["farm", "bakery"]
		},
		{
			icon: "science",
			buildings: []
		},
		{
			icon: "industry",
			buildings: ["storage"]
		},
	]
}
