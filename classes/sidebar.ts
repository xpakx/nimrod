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
	const housing = await loadImage("./img/housing.svg");
	const religion = await loadImage("./img/religion.svg");
	const military = await loadImage("./img/military.svg");
	const agriculture = await loadImage("./img/agriculture.svg");
	const science = await loadImage("./img/science.svg");
	const industry = await loadImage("./img/industry.svg");
	const home = sprites['home'];
	const well = sprites['well'];
	const inspector = sprites['inspector'];
	const ziggurat = sprites['ziggurat'];
	const tower = sprites['tower'];
	return [
		new BuildingTab(
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
			], housing),
		new BuildingTab(
			"religion", [
				new BuildingButton(ziggurat, "ziggurat"),
			], religion),
		new BuildingTab(
			"military", [
				new BuildingButton(tower, "tower"),
			], military),
		new BuildingTab("agriculture", [], agriculture),
		new BuildingTab("science", [], science),
		new BuildingTab("industry", [], industry),
	];
}
