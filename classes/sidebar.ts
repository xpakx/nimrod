import { BuildingSprite } from "./buildings.js";
import { BuildingButton, BuildingTab } from "./interface.js";

async function loadImage(url: string): Promise<any> {
    const image = new Image();
    image.src = url;
    return new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = reject;
    });
}

export async function prepareTabs(sprites: { [key: string]: BuildingSprite }): Promise<BuildingTab[]> {
	const icons = await loadIcons();
	return [
		housingTab(sprites, icons),
		religionTab(sprites, icons),
		militaryTab(sprites, icons),
		agricultureTab(sprites, icons),
		scienceTab(sprites, icons),
		industryTab(sprites, icons),
	];
}

async function loadIcons(): Promise<any> {
	const housing = await loadImage("./img/housing.svg");
	const religion = await loadImage("./img/religion.svg");
	const military = await loadImage("./img/military.svg");
	const agriculture = await loadImage("./img/agriculture.svg");
	const science = await loadImage("./img/science.svg");
	const industry = await loadImage("./img/industry.svg");
	const tab = await loadImage("./img/tab.svg");

	let sprites: { [key: string]: BuildingSprite } = {}; // TODO
	sprites["housing"] = housing;
	sprites["religion"] = religion;
	sprites["military"] = military;
	sprites["agriculture"] = agriculture;
	sprites["science"] = science;
	sprites["industry"] = industry;
	sprites["tab"] = tab;
	return sprites;
}

function housingTab(sprites: { [key: string]: BuildingSprite }, icons: any): BuildingTab {
	const home = sprites['home'];
	const well = sprites['well'];
	const inspector = sprites['inspector'];

	return new BuildingTab(
		"housing", [
			new BuildingButton(home, "home"),
			new BuildingButton(well, "well"),
			new BuildingButton(inspector, "inspector"),
			new BuildingButton(home, "home"),
			new BuildingButton(home, "home"),
			new BuildingButton(home, "home"),
			new BuildingButton(home, "home"),
			new BuildingButton(home, "home"),
			new BuildingButton(home, "home"),
			new BuildingButton(home, "home"),
			new BuildingButton(home, "home"),
			new BuildingButton(home, "home"),
		], 
		icons['housing'],
		icons['tab']
	)
}

function religionTab(sprites: { [key: string]: BuildingSprite }, icons: any): BuildingTab {
	const ziggurat = sprites['ziggurat'];

	return new BuildingTab(
		"religion", [
			new BuildingButton(ziggurat, "ziggurat"),
		], icons['religion'], icons['tab'])
}

function militaryTab(sprites: { [key: string]: BuildingSprite }, icons: any): BuildingTab {
	const tower = sprites['tower'];

	return new BuildingTab(
		"military", [
			new BuildingButton(tower, "tower"),
		], icons['military'], icons['tab'])
}

function agricultureTab(_sprites: { [key: string]: BuildingSprite }, icons: any): BuildingTab {
	return new BuildingTab("agriculture", [], icons['agriculture'], icons['tab'])
}

function scienceTab(_sprites: { [key: string]: BuildingSprite }, icons: any): BuildingTab {
	return new BuildingTab("science", [], icons['science'], icons['tab'])
}

function industryTab(_sprites: { [key: string]: BuildingSprite }, icons: any): BuildingTab {
	return new BuildingTab("industry", [], icons['industry'], icons['tab'])
}
