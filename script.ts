import { Actor, ActorSprite } from "./classes/actor.js";
import { BuildingSprite, TilingSprite } from "./classes/buildings.js";
import { GameState } from "./classes/game-state.js";
import { ActionButton, ButtonRow, InterfaceLayer } from "./classes/interface.js";
import { MapLayer } from "./classes/map-layer.js";
import { prepareTabs } from "./classes/sidebar.js";
import { SpriteLibrary } from "./classes/sprite-library.js";

let state = new GameState();

let map = new MapLayer({width: state.canvasWidth, height: state.canvasHeight});
let interf = new InterfaceLayer({width: state.canvasWidth, height: state.canvasHeight});

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
	context.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
	map.renderMap(context, state.pedestrians, deltaTime);
	interf.renderInterface(context, deltaTime);
	renderDebugInfo(context, deltaTime);
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
    ctx.fillText(`(${state.playerMouse.x}, ${state.playerMouse.y})`, 20, 100);
    ctx.fillText(`(${map.isoPlayerMouse.x}, ${map.isoPlayerMouse.y})`, 20, 125);
}

function middleMouseClick(event: MouseEvent) {
	map.isDragging = true;
	map.dragStart.x = event.clientX + map.positionOffset.x;
	map.dragStart.y = event.clientY + map.positionOffset.y;
}

function rightMouseClick(_event: MouseEvent, sprites: {[key: string]: BuildingSprite}, road: TilingSprite) {
	if(interf.mouseInsideInterface(state.playerMouse)) {
		const clickResult = interf.click(state.playerMouse);
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

function loadMap(filename: string, map: MapLayer, sprites: SpriteLibrary, road: TilingSprite) {
	fetch(`maps/${filename}`)
	.then(response => {
		if (!response.ok) {
			throw new Error(`HTTP error while loading a map! status: ${response.status}`);
		}
		return response.json();
	})
	.then(data => {
		console.log(data);
		const height = data['size']['height']; 
		const width = data['size']['width']; 
		const newMap: string[][] = Array(height).fill(null).map(() => Array(width).fill('#97b106'));
		map.map = newMap;

		for (let pos of data['roads']) {
			map.putRoad({x: pos['x'], y: pos['y']}, road, true);
		}

		for (let building of data['buildings']) {
			map.putBuilding({x: building['x'], y: building['y']}, sprites.buildings[building['type']]);
		}
		map.getBuilding({x: 3, y: 11})!.setWorker(sprites.buildings["home"]);
	})
	.catch(error => {
		console.log(error);
		throw new Error(`Error loading the JSON file: ${error}`);
	});
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
	canvas.width = state.canvasWidth;
	canvas.height = state.canvasHeight;

	let sprites = new SpriteLibrary();
	await sprites.prepareBuildingSprites(map.tileSize);
	await sprites.prepareRoadSprites(map.tileSize);


	interf.tabs = await prepareTabs(sprites.buildings);
	interf.tab = 0;
	interf.recalculateTabSize();
	interf.calculateTabIcons();
	
	const coinsIcon = await loadImage("./img/coins.svg");
	const populationIcon = await loadImage("./img/people.svg");
	interf.coinsIcon = coinsIcon;
	interf.populationIcon = populationIcon;
	interf.calculateIconsSize();

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


	function rescaleSprites() {
		for (const key in sprites.buildings) {
			sprites.buildings[key].refreshSize(map.tileSize);
		}
		sprites.getRoad().refreshSize(map.tileSize);
	}

	loadMap("test.json", map, sprites, sprites.getRoad());

	const act = new ActorSprite(await loadImage("./img/house.svg"), 2, map.tileSize);
	state.pedestrians.push(new Actor(act, {x: 1, y: 9}));


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
		state.playerMouse = {x: mouseX, y: mouseY};
		if(!interf.mouseInsideInterface(state.playerMouse)) {
			map.updateMousePosition(state.playerMouse);
		} 
		interf.onMouse(state.playerMouse);

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
			middleMouseClick(event);
		}

		if(event.button == 0) {
			rightMouseClick(event, sprites.buildings, sprites.getRoad());
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
			map.updateMousePosition(state.playerMouse);
		}
		if(moveDown) {
			map.positionOffset.y = map.positionOffset.y + 10;
			if(map.positionOffset.y > maxYOffset) {
				map.positionOffset.y = maxYOffset;
			}
			map.updateMousePosition(state.playerMouse);
		}
		if(moveLeft) {
			map.positionOffset.x = map.positionOffset.x - 10;
			if(map.positionOffset.x < minXOffset) {
				map.positionOffset.x = minXOffset;
			}
			map.updateMousePosition(state.playerMouse);
		}
		if(moveRight) {
			map.positionOffset.x = map.positionOffset.x + 10;
			if(map.positionOffset.x > maxXOffset) {
				map.positionOffset.x = maxXOffset;
			}
			map.updateMousePosition(state.playerMouse);
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
				state.pedestrians.push(new Actor(act, building.workerSpawn));
			}
		}
		const dTime = deltaTime > 0.5 ? 0.5 : deltaTime;
		let diagonalChanged = false;

		let randMap = [
			Math.floor(Math.random() * 2),
			Math.floor(Math.random() * 3),
			Math.floor(Math.random() * 4),
		]
		for(let pedestrian of state.pedestrians) {
			diagonalChanged ||= pedestrian.tick(dTime, map.roads, randMap);
		}
		state.pedestrians = state.pedestrians.filter((p) => !p.dead);
		if(diagonalChanged) {
			state.sortPedestrians(); // TODO: more efficient way?
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
