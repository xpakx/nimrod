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

export async function prepareTabs(sprites: { [key: string]: BuildingPrototype }, iconList: string[]): Promise<BuildingTab[]> {
	const icons = await loadIcons(iconList);
	return [
		housingTab(sprites, icons),
		religionTab(sprites, icons),
		militaryTab(sprites, icons),
		agricultureTab(sprites, icons),
		scienceTab(sprites, icons),
		industryTab(sprites, icons),
	];
}

async function loadIcons(iconList: string[]): Promise<any> {
	let sprites: { [key: string]: BuildingSprite } = {}; // TODO
	for (let icon of iconList) {
		const img = await loadImage(`./img/${icon}.svg`);
		sprites[icon] = img;
	}
	return sprites;
}

function housingTab(sprites: { [key: string]: BuildingPrototype }, icons: any): BuildingTab {
	const home = sprites['home'].sprite;
	const well = sprites['well'].sprite;
	const inspector = sprites['inspector'].sprite;

	return new BuildingTab(
		"housing", [
			new BuildingButton(home, "home"),
			new BuildingButton(well, "well"),
			new BuildingButton(inspector, "inspector"),
		], 
		icons['housing'],
		icons['tab']
	)
}

function religionTab(sprites: { [key: string]: BuildingPrototype }, icons: any): BuildingTab {
	const ziggurat = sprites['ziggurat'].sprite;

	return new BuildingTab(
		"religion", [
			new BuildingButton(ziggurat, "ziggurat"),
		], icons['religion'], icons['tab'])
}

function militaryTab(sprites: { [key: string]: BuildingPrototype }, icons: any): BuildingTab {
	const tower = sprites['tower'].sprite;

	return new BuildingTab(
		"military", [
			new BuildingButton(tower, "tower"),
		], icons['military'], icons['tab'])
}

function agricultureTab(sprites: { [key: string]: BuildingPrototype }, icons: any): BuildingTab {
	const farm = sprites['farm'].sprite;
	const bakery = sprites['bakery'].sprite;

	return new BuildingTab("agriculture", [
		new BuildingButton(farm, "farm"),
		new BuildingButton(bakery, "bakery"),
	], icons['agriculture'], icons['tab'])
}

function scienceTab(_sprites: { [key: string]: BuildingPrototype }, icons: any): BuildingTab {
	return new BuildingTab("science", [], icons['science'], icons['tab'])
}

function industryTab(sprites: { [key: string]: BuildingPrototype }, icons: any): BuildingTab {
	const storage = sprites['storage'].sprite;

	return new BuildingTab("industry", [
		new BuildingButton(storage, "storage"),
	], icons['industry'], icons['tab'])
}
