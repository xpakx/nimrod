import { BuildingSprite, TilingSprite } from "./classes/buildings.js";
import { MapLayer, Position, Size } from "./classes/map-layer.js";

const canvasWidth = 800;
const canvasHeight = 600;


let map = new MapLayer({width: canvasWidth, height: canvasHeight});

async function loadImage(url: string): Promise<any> {
    const image = new Image();
    image.src = url;
    return new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = reject;
    });
}


export function getSize(img: HTMLImageElement, widthNorm: number): Size {
	const width = map.tileWidth * widthNorm;
	const height = img.height*(width/img.width);
	return { width: width, height: height };
}


function renderGame(context: CanvasRenderingContext2D, deltaTime: number) {
	context.clearRect(0, 0, canvasWidth, canvasHeight);
	map.renderMap(context, deltaTime);
	renderDebugInfo(context, deltaTime);
}

let playerMouse: Position = {x: 0, y: 0};

const dts: number[] = [];

function renderDebugInfo(ctx: CanvasRenderingContext2D, deltaTime: number) {
    ctx.font = "26px normal"
    ctx.fillStyle = "white"

    dts.push(deltaTime);
    if (dts.length > 60) {
        dts.shift();
    }

    const dtAvg = dts.reduce((a, b) => a + b, 0)/dts.length;

    ctx.fillText(`${Math.floor(1/dtAvg)} FPS`, 20, 50);
    ctx.fillText(`(${playerMouse.x}, ${playerMouse.y})`, 20, 75);
    ctx.fillText(`(${map.isoPlayerMouse.x}, ${map.isoPlayerMouse.y})`, 20, 100);
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

	const ziggurat = new BuildingSprite(await loadImage("./img/ziggurat.svg"), 4);
	const home = new BuildingSprite(await loadImage("./img/house.svg"), 2);
	const tower = new BuildingSprite(await loadImage("./img/tower.svg"), 2);
	const well = new BuildingSprite(await loadImage("./img/well.svg"), 2);
	const inspector = new BuildingSprite(await loadImage("./img/inspector.svg"), 2);
	let sprites: any = {}; // TODO
	sprites["ziggurat"] = ziggurat;
	sprites["home"] = home;
	sprites["tower"] = tower;
	sprites["well"] = well;
	sprites["inspector"] = inspector;

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
	const road = new TilingSprite(roads);
	function rescaleSprites() {
		for (const key in sprites) {
			sprites[key].refreshSize();
		}
		road.refreshSize();
	}

	map.putBuilding({x: 3, y: 3}, sprites["ziggurat"]);
	map.putBuilding({x: 7, y: 7}, sprites["home"]);
	map.putBuilding({x: 7, y: 9}, sprites["home"]);
	map.putBuilding({x: 9, y: 7}, sprites["home"]);
	map.putBuilding({x: 9, y: 9}, sprites["home"]);
	map.putBuilding({x: 9, y: 1}, sprites["tower"]);
	map.putBuilding({x: 8, y: 12}, sprites["inspector"]);
	map.putBuilding({x: 10, y: 12}, sprites["well"]);
	map.putRoad({x: 5, y: 5}, road, true);
	map.putRoad({x: 5, y: 6}, road, true);
	map.putRoad({x: 6, y: 5}, road, true);


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
		map.isoPlayerMouse = map.screenToIso(playerMouse);

		if (map.isDragging) {
			map.positionOffset.x = map.dragStart.x - event.clientX;
			map.positionOffset.y = map.dragStart.y - event.clientY;
			correctOffset();
		}
	});

	let maxYOffset = map.isoToScreen({x: map.map[0].length - 1, y: map.map.length - 1}).y + (map.tileHeight/2);
	let minXOffset = map.isoToScreen({x: 0, y: map.map.length - 1}).x  - (map.tileWidth/2);
	let maxXOffset = map.isoToScreen({x: map.map[0].length - 1, y: 0}).x  + (map.tileWidth/2);

	function rescaleOffsets(oldScale: number) {
		map.positionOffset.x = map.scale*map.positionOffset.x/oldScale;
		map.positionOffset.y = map.scale*map.positionOffset.y/oldScale;
		maxYOffset = map.isoToScreen({x: map.map[0].length - 1, y: map.map.length - 1}).y + (map.tileHeight/2) + map.positionOffset.y; // + offset to calculate from 0,0
		minXOffset = map.isoToScreen({x: 0, y: map.map.length - 1}).x  - (map.tileWidth/2) + map.positionOffset.x;
		maxXOffset = map.isoToScreen({x: map.map[0].length - 1, y: 0}).x  + (map.tileWidth/2) + map.positionOffset.x;
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

	canvas.addEventListener('mouseup', (_event) => {
		map.isDragging = false;
	});
	canvas.addEventListener('wheel', function(event) {
		if(map.isDragging) {
			return;
		}
		if (event.deltaY < 0) {
			let oldScale = map.scale;
			map.scale += 0.2;
			if(map.scale > 2.0) {
				map.scale = 2.0;
			}
			map.tileWidth = map.scale*map.defTileWidth;
			map.tileHeight = map.scale*map.defTileHeight;
			rescaleOffsets(oldScale);
			rescaleSprites();
		} else {
			let oldScale = map.scale;
			map.scale -= 0.2;
			if(map.scale < 0.5) {
				map.scale = 0.5;
			}
			map.tileWidth = map.scale*map.defTileWidth;
			map.tileHeight = map.scale*map.defTileHeight;
			rescaleOffsets(oldScale);
			rescaleSprites();
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
				let oldScale = map.scale;
				map.scale += 0.2;
			        if(map.scale > 2.0) {
					map.scale = 2.0;
				}
				map.tileWidth = map.scale*map.defTileWidth;
				map.tileHeight = map.scale*map.defTileHeight;
				rescaleOffsets(oldScale);
				rescaleSprites();
			}
			break;
			case '-': {
				let oldScale = map.scale;
				map.scale -= 0.2;
			        if(map.scale < 0.5) {
					map.scale = 0.5;
				}
				map.tileWidth = map.scale*map.defTileWidth;
				map.tileHeight = map.scale*map.defTileHeight;
				rescaleOffsets(oldScale);
				rescaleSprites();
			}
			break;
			case '0': map.switchToNormalMode(); break;
			case '1': map.switchToBuildMode(home); break;
			case '2': map.switchToBuildMode(ziggurat); break;
			case '3': map.switchToBuildMode(tower); break;
			case '4': map.switchToBuildMode(well); break;
			case '5': map.switchToBuildMode(inspector); break;
			case '6': map.switchToRoadMode(road); break;
			case '9': map.switchToDeleteMode(); break;
		}

		if(moveUp) {
			map.positionOffset.y = map.positionOffset.y - 10;
			if(map.positionOffset.y < 0) {
				map.positionOffset.y = 0;
			}
			map.isoPlayerMouse = map.screenToIso(playerMouse);
		}
		if(moveDown) {
			map.positionOffset.y = map.positionOffset.y + 10;
			if(map.positionOffset.y > maxYOffset) {
				map.positionOffset.y = maxYOffset;
			}
			map.isoPlayerMouse = map.screenToIso(playerMouse);
		}
		if(moveLeft) {
			map.positionOffset.x = map.positionOffset.x - 10;
			if(map.positionOffset.x < minXOffset) {
				map.positionOffset.x = minXOffset;
			}
			map.isoPlayerMouse = map.screenToIso(playerMouse);
		}
		if(moveRight) {
			map.positionOffset.x = map.positionOffset.x + 10;
			if(map.positionOffset.x > maxXOffset) {
				map.positionOffset.x = maxXOffset;
			}
			map.isoPlayerMouse = map.screenToIso(playerMouse);
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
		renderGame(context, deltaTime);
		window.requestAnimationFrame(frame);
	};
	window.requestAnimationFrame((timestamp) => {
		prevTimestamp = timestamp;
		window.requestAnimationFrame(frame);
	});
}
