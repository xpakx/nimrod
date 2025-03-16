import { BuildingPrototype, BuildingSprite } from "../building/buildings.js";
import { BuildingButton, BuildingTab } from "./interface.js";

async function loadImage(url: string): Promise<any> {
    const image = new Image();
    image.src = url;
    return new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = reject;
    });
}

export interface BuildingTabSettings {
	icon: string;
	buildings: string[];
}

export interface SidebarConfig {
	icons: string[];
	tabs: BuildingTabSettings[];
}

const tabSettings: SidebarConfig = {
	icons: [],
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

export async function prepareTabs(sprites: { [key: string]: BuildingPrototype }, iconList: string[]): Promise<BuildingTab[]> {
	const icons = await loadIcons(iconList);
	let tabs: BuildingTab[] = [];
	for (let tab of tabSettings.tabs) {
		tabs.push(createTab(sprites, icons, tab))
	}
	return tabs;
}

async function loadIcons(iconList: string[]): Promise<any> {
	let sprites: { [key: string]: BuildingSprite } = {}; // TODO
	for (let icon of iconList) {
		const img = await loadImage(`./img/${icon}.svg`);
		sprites[icon] = img;
	}
	return sprites;
}

function createTab(sprites: any, icons: any, settings: BuildingTabSettings): BuildingTab {
	const icon = icons[settings.icon];
	const tabIcon = icons["tab"];
	let buttons: BuildingButton[] = [];
	for (let building of settings.buildings) {
		const buildingSprite = sprites[building].sprite;
		const button = new BuildingButton(buildingSprite, building);
		buttons.push(button);
	}
	return new BuildingTab(
		settings.icon,
		buttons,
		icon,
		tabIcon
	)
}
