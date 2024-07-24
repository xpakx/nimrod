import { Actor } from "./classes/actor.js";
import { BuildingSprite, TilingSprite } from "./classes/buildings.js";
import { ActionButton, BuildingButton, BuildingTab, ButtonRow, InterfaceLayer } from "./classes/interface.js";
import { MapLayer, Position, Size } from "./classes/map-layer.js";

const canvasWidth = 1200;
const canvasHeight = 800;

let map = new MapLayer({width: canvasWidth, height: canvasHeight});
let interf = new InterfaceLayer({width: canvasWidth, height: canvasHeight});

let pedestrians: Actor[] = [];
let playerMouse: Position = {x: 0, y: 0};
const dts: number[] = [];

async function loadImage(url: string): Promise<any> {
    const image = new Image();
    image.src = url;
    return new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = reject;
    });
}

function renderGame(context: CanvasRenderingContext2D, deltaTime: number) {
	context.clearRect(0, 0, canvasWidth, canvasHeight);
	map.renderMap(context, pedestrians, deltaTime);
	interf.renderInterface(context, deltaTime);
	renderDebugInfo(context, deltaTime);
}

function sortPedestrians(pedestrians: Actor[]) {
	pedestrians.sort((a, b) => {
		return a.diagonal - b.diagonal;
	});
}

function renderDebugInfo(ctx: CanvasRenderingContext2D, deltaTime: number) {
    ctx.font = "26px normal"
    ctx.fillStyle = "white"

    dts.push(deltaTime);
    if (dts.length > 60) {
        dts.shift();
    }

    const dtAvg = dts.reduce((a, b) => a + b, 0)/dts.length;

    ctx.fillText(`${Math.floor(1/dtAvg)} FPS`, 20, 75);
    ctx.fillText(`(${playerMouse.x}, ${playerMouse.y})`, 20, 100);
    ctx.fillText(`(${map.isoPlayerMouse.x}, ${map.isoPlayerMouse.y})`, 20, 125);
}

window.onload = async () => {
	const canvas = document.getElementById('gameCanvas') as (HTMLCanvasElement | null);
	if (!canvas) {
		console.log("No canvas elem");
		return;
	}
	const context = canvas.getContext('2d');
	if (!context) {
		console.log("No context");
		return;
	}
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;

	const ziggurat = new BuildingSprite(await loadImage("./img/ziggurat.svg"), 4, map.tileSize);
	const home = new BuildingSprite(await loadImage("./img/house.svg"), 2, map.tileSize);
	const tower = new BuildingSprite(await loadImage("./img/tower.svg"), 2, map.tileSize);
	const well = new BuildingSprite(await loadImage("./img/well.svg"), 2, map.tileSize);
	const inspector = new BuildingSprite(await loadImage("./img/inspector.svg"), 2, map.tileSize);
	let sprites: { [key: string]: BuildingSprite } = {}; // TODO
	sprites["ziggurat"] = ziggurat;
	sprites["home"] = home;
	sprites["tower"] = tower;
	sprites["well"] = well;
	sprites["inspector"] = inspector;

	const housing = await loadImage("./img/housing.svg");
	const religion = await loadImage("./img/religion.svg");
	const military = await loadImage("./img/military.svg");
	const agriculture = await loadImage("./img/agriculture.svg");
	const science = await loadImage("./img/science.svg");
	const industry = await loadImage("./img/industry.svg");

	interf.tabs = [
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
			], 
			housing),
		new BuildingTab(
			"religion", [
				new BuildingButton(ziggurat, "ziggurat"),
			], 
			religion),
		new BuildingTab(
			"military", [
				new BuildingButton(tower, "tower"),
			], 
			military),
		new BuildingTab("agriculture", [], agriculture),
		new BuildingTab("science", [], science),
		new BuildingTab("industry", [], industry),
	];
	interf.tab = 0;
	interf.recalculateTabSize();
	
	const coinsIcon = await loadImage("./img/coins.svg");
	const populationIcon = await loadImage("./img/people.svg");
	const tab = await loadImage("./img/tab.svg");
	interf.coinsIcon = coinsIcon;
	interf.populationIcon = populationIcon;
	interf.calculateIconsSize();
	interf.tabImg = tab;

	const roadButton = await loadImage("./img/road-button.svg");
	const deleteButton = await loadImage("./img/delete-button.svg");
	const menuRow: ButtonRow = {
		y: interf.buildingMenuHeight + 50,	
		buttons: [
			new ActionButton(roadButton, {action: "buildRoad", argument: undefined}, {width: 40, height: 40}),
			new ActionButton(deleteButton, {action: "delete", argument: undefined}, {width: 40, height: 40}),
		]
	};
	interf.addButtonRow(menuRow);

	const world = await loadImage("./img/world.svg");
	const city = await loadImage("./img/city.svg");
	const kingdom = await loadImage("./img/kingdom.svg");
	const mapRow: ButtonRow = {
		y: canvas.height - 80,	
		buttons: [
			new ActionButton(city, {action: "goTo", argument: "city"}, {width: 50, height: 50}),
			new ActionButton(kingdom,{action: "goTo", argument: "kingdom"}, {width: 50, height: 50}),
			new ActionButton(world,{action: "goTo", argument: "map"}, {width: 50, height: 50}),
		]
	};
	interf.addButtonRow(mapRow);


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
	const road = new TilingSprite(roads, map.tileSize);
	function rescaleSprites() {
		for (const key in sprites) {
			sprites[key].refreshSize(map.tileSize);
		}
		road.refreshSize(map.tileSize);
	}

	map.putBuilding({x: 1, y: 8}, sprites["home"]);
	map.putBuilding({x: 3, y: 8}, sprites["home"]);
	map.putBuilding({x: 1, y: 11}, sprites["home"]);
	map.putBuilding({x: 3, y: 11}, sprites["home"]);
	map.getBuilding({x: 3, y: 11})!.setWorker(home);;
	map.putRoad({x: 0, y: 9}, road, true);
	map.putRoad({x: 1, y: 9}, road, true);
	map.putRoad({x: 2, y: 9}, road, true);
	map.putRoad({x: 3, y: 9}, road, true);
	map.putRoad({x: 4, y: 9}, road, true);

	pedestrians.push(new Actor(home, {x: 1, y: 9}));


	function correctOffset() {
		if(map.positionOffset.y < 0) {
			map.positionOffset.y = 0;
		}
		if(map.positionOffset.y > maxYOffset) {
			map.positionOffset.y = maxYOffset;
		}
		if(map.positionOffset.x < minXOffset) {
			map.positionOffset.x = minXOffset;
		}
		if(map.positionOffset.x > maxXOffset) {
			map.positionOffset.x = maxXOffset;
		}
	}

	canvas.addEventListener('mousemove', function(event) {
		const rect = canvas.getBoundingClientRect();

		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;
		playerMouse = {x: mouseX, y: mouseY};
		if(!interf.mouseInsideInterface(playerMouse)) {
			map.updateMousePosition(playerMouse);
		} 
		interf.onMouse(playerMouse);

		if (map.isDragging) {
			map.positionOffset.x = map.dragStart.x - event.clientX;
			map.positionOffset.y = map.dragStart.y - event.clientY;
			correctOffset();
		}
	});

	let maxYOffset = map.isoToScreen({x: map.map[0].length - 1, y: map.map.length - 1}).y + (map.tileSize.height/2);
	let minXOffset = map.isoToScreen({x: 0, y: map.map.length - 1}).x  - (map.tileSize.width/2);
	let maxXOffset = map.isoToScreen({x: map.map[0].length - 1, y: 0}).x  + (map.tileSize.width/2);

	function rescaleOffsets(oldScale: number) {
		map.positionOffset.x = map.scale*map.positionOffset.x/oldScale;
		map.positionOffset.y = map.scale*map.positionOffset.y/oldScale;
		maxYOffset = map.isoToScreen({x: map.map[0].length - 1, y: map.map.length - 1}).y + (map.tileSize.height/2) + map.positionOffset.y; // + offset to calculate from 0,0
		minXOffset = map.isoToScreen({x: 0, y: map.map.length - 1}).x  - (map.tileSize.width/2) + map.positionOffset.x;
		maxXOffset = map.isoToScreen({x: map.map[0].length - 1, y: 0}).x  + (map.tileSize.width/2) + map.positionOffset.x;
		correctOffset();
	}


	canvas.addEventListener('mousedown', (event) => {
		if(event.button == 1) {
			map.isDragging = true;
			map.dragStart.x = event.clientX + map.positionOffset.x;
			map.dragStart.y = event.clientY + map.positionOffset.y;
		}

		console.log(event.button)
		if(event.button == 0) {
			if(interf.mouseInsideInterface(playerMouse)) {
				const clickResult = interf.click(playerMouse);
				if (clickResult != undefined) {
					if(clickResult.action == "build" && clickResult.argument != undefined) {
						const clickedBuilding = sprites[clickResult.argument];
						if (clickedBuilding) map.switchToBuildMode(clickedBuilding);
					} else if(clickResult.action == "buildRoad") {
						map.switchToRoadMode(road);
					} else if(clickResult.action == "delete") {
						map.switchToDeleteMode();
					}
				}
				return;
			}
			if(map.mode) {
				map.putBuilding(map.isoPlayerMouse, map.mode, false);
				map.finalizeBuildingPlacement(map.isoPlayerMouse);
			} else if(map.deleteMode) {
				map.deleteBuilding(map.isoPlayerMouse);
				map.deleteRoad(map.isoPlayerMouse);
			} else if(map.roadMode) {
				map.putRoad(map.isoPlayerMouse, road);
			}
		}
	});

	function rescale(dScale: number) {
		let oldScale = map.scale;
		map.rescale(dScale);
		rescaleOffsets(oldScale);
		rescaleSprites();
	}

	canvas.addEventListener('mouseup', (_event) => {
		map.isDragging = false;
	});
	canvas.addEventListener('wheel', function(event) {
		if(map.isDragging) {
			return;
		}
		if (event.deltaY < 0) {
			rescale(0.2);
		} else {
			rescale(-0.2);
		}
	});

	let [moveLeft, moveRight, moveUp, moveDown] = [false, false, false, false];

	document.addEventListener('keydown', function(event) {
		switch (event.key) {
			case 'ArrowUp': case 'k':
				moveUp = true;
			break;
			case 'ArrowDown': case 'j':
				moveDown = true;
			break;
			case 'ArrowLeft': case 'h':
				moveLeft = true;
			break;
			case 'ArrowRight': case 'l':
				moveRight = true;
			break;
			case '+': {
				rescale(0.2);
			}
			break;
			case '-': {
				rescale(-0.2);
			}
			break;
			case '0': case 'Escape': map.switchToNormalMode(); break;
			case '9': map.switchToDeleteMode(); break;
			case 'Enter': interf.dialogueAction(); break;
		}

		if(moveUp) {
			map.positionOffset.y = map.positionOffset.y - 10;
			if(map.positionOffset.y < 0) {
				map.positionOffset.y = 0;
			}
			map.updateMousePosition(playerMouse);
		}
		if(moveDown) {
			map.positionOffset.y = map.positionOffset.y + 10;
			if(map.positionOffset.y > maxYOffset) {
				map.positionOffset.y = maxYOffset;
			}
			map.updateMousePosition(playerMouse);
		}
		if(moveLeft) {
			map.positionOffset.x = map.positionOffset.x - 10;
			if(map.positionOffset.x < minXOffset) {
				map.positionOffset.x = minXOffset;
			}
			map.updateMousePosition(playerMouse);
		}
		if(moveRight) {
			map.positionOffset.x = map.positionOffset.x + 10;
			if(map.positionOffset.x > maxXOffset) {
				map.positionOffset.x = maxXOffset;
			}
			map.updateMousePosition(playerMouse);
		}

	});

	document.addEventListener('keyup', function(event) {
		switch (event.key) {
			case 'ArrowUp': case 'k':
				moveUp = false;
			break;
			case 'ArrowDown': case 'j':
				moveDown = false;
			break;
			case 'ArrowLeft': case 'h':
				moveLeft = false;
			break;
			case 'ArrowRight': case 'l':
				moveRight = false;
			break;
		}
	});

	let prevTimestamp = 0;

	const frame = (timestamp: number) => {
		const deltaTime = (timestamp - prevTimestamp) / 1000;
		prevTimestamp = timestamp;
		for(let building of map.buildings) {
			const newPedestrian = building.tick(deltaTime);
			if(newPedestrian && building.workerSpawn) {
				pedestrians.push(new Actor(home, building.workerSpawn));
			}
		}
		const dTime = deltaTime > 1 ? 1 : deltaTime;
		let diagonalChanged = false;
		for(let pedestrian of pedestrians) {
			diagonalChanged ||= pedestrian.tick(dTime, map.roads);
		}
		if(diagonalChanged) {
			sortPedestrians(pedestrians); // TODO: more efficient way?
		}
		renderGame(context, deltaTime);
		window.requestAnimationFrame(frame);
	};
	window.requestAnimationFrame((timestamp) => {
		prevTimestamp = timestamp;
		window.requestAnimationFrame(frame);
	});


	const av = await loadImage("./img/portraits/ratman.svg");
	interf.setDialogue(context, {text: "Welcome to the game!", portrait: av});
	setTimeout(() => {
		interf.closeDialogue();
	}, 3000);
}
