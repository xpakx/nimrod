const defTileWidth = 64;
const defTileHeight = 32;
let scale = 1.0;
let tileWidth = defTileWidth*scale;
let tileHeight = defTileHeight*scale;
const canvasWidth = 800;
const canvasHeight = 600;

let positionOffset = {x: 0, y: 0}

const map = [
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
];

interface Size {
	width: number,
	height: number,
}

interface Position {
	x: number,
	y: number,
}

function isoToScreen(pos: Position): Position {
    const screenX = (pos.x - pos.y) * (tileWidth / 2) - positionOffset.x;
    const screenY = (pos.x + pos.y) * (tileHeight / 2) - positionOffset.y;
    return { x: screenX, y: screenY };
}

function screenToIso(pos: Position): Position {
    const x = pos.x - (canvasWidth / 2) + positionOffset.x;
    const y = pos.y - (canvasHeight / 2 - (tileHeight/2)) + positionOffset.y;
    const isoX = x/tileWidth + y/tileHeight;
    const isoY = y/tileHeight - x/tileWidth;
    return { x: Math.floor(isoX), y: Math.floor(isoY) };
}

function drawIsometricMap(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2 - (tileHeight/2));
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            let color = map[y][x];
	    if(!mode && x == isoPlayerMouse.x && y == isoPlayerMouse.y) {
		    color = deleteMode ? '#FF5733' : "black";
	    }
            const screenPos = isoToScreen({x: x, y: y});
            drawTile(ctx, screenPos.x, screenPos.y, color);
        }
    }
    ctx.restore();
}

function drawTile(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + tileWidth / 2, y + tileHeight / 2);
    ctx.lineTo(x, y + tileHeight);
    ctx.lineTo(x - tileWidth / 2, y + tileHeight / 2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

async function loadImage(url: string): Promise<any> {
    const image = new Image();
    image.src = url;
    return new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = reject;
    });
}

function getSize(img: HTMLImageElement, widthNorm: number): Size {
	const width = tileWidth*widthNorm;
	const height = img.height*(width/img.width);
	return { width: width, height: height };
}

function drawBuilding(ctx: CanvasRenderingContext2D, position: Position, building: BuildingSprite) {
	let pos = isoToScreen(position);
	ctx.drawImage(building.image, pos.x-building.size.width/2, pos.y-building.size.height+tileHeight, building.size.width, building.size.height);
}


let buildingMap: (Building | undefined)[][] = map.map(row => row.map(() => undefined)); // for quicker lookup
let buildings: Building[] = [];
let blocked: boolean[][] = map.map(row => row.map(() => false));
let roads: (Road | undefined)[][] = map.map(row => row.map(() => undefined)); // for quicker lookup

function onMap(position: Position): boolean {
	if(position.x < 0 || position.y < 0) {
		return false;
	}
	if(position.x >= map[0].length || position.y >= map.length) {
		return false;
	}
	return true;
}

function putBuilding(position: Position, sprite: BuildingSprite, accepted: boolean = true) {
	if(canBePlaced(position, sprite)) {
		const newBuilding = new Building(sprite, position, accepted);
		buildings.push(newBuilding);
		sortBuildings();
		buildings.forEach((a) => console.log(a.position));
		for(let i = position.x; i > position.x-sprite.baseSize; i--) {
			for(let j = position.y; j > position.y-sprite.baseSize; j--) {
				blocked[j][i] = true;
				buildingMap[j][i] = newBuilding;
			}
		}
	}
}

function putRoad(position: Position, sprite: TilingSprite, _accepted: boolean = true) {
	if(!roadCanBePlaced(position)) {
		return;
	}
	let direction = 0b0000;
	blocked[position.y][position.x] = true;
	if(position.y - 1 >=0 && roads[position.y-1][position.x]) {
		roads[position.y-1][position.x]!.xorDir(0b0010);
		direction ^= 0b1000;
	}
	if(position.y + 1 < roads.length && roads[position.y+1][position.x]) {
		roads[position.y+1][position.x]!.xorDir(0b1000);
		direction ^= 0b0010;
	}
	if(position.x - 1 >=0 && roads[position.y][position.x-1]) {
		roads[position.y][position.x-1]!.xorDir(0b0100);
		direction ^= 0b0001;
	}
	if(position.x + 1 < roads[0].length && roads[position.y][position.x+1]) {
		roads[position.y][position.x+1]!.xorDir(0b0001);
		direction ^= 0b0100;
	}
	console.log(direction);
	roads[position.y][position.x] = new Road(sprite, position, direction);
}

function calculateRoadConnections(position: Position, sprite: TilingSprite, canBePlaced: boolean): Road {
	let direction = 0b0000;
	if(!canBePlaced) {
		return new Road(sprite, position, direction);
	}
	if(position.y - 1 >=0 && roads[position.y-1][position.x]) {
		direction ^= 0b1000;
	}
	if(position.y + 1 < roads.length && roads[position.y+1][position.x]) {
		direction ^= 0b0010;
	}
	if(position.x - 1 >=0 && roads[position.y][position.x-1]) {
		direction ^= 0b0001;
	}
	if(position.x + 1 < roads[0].length && roads[position.y][position.x+1]) {
		direction ^= 0b0100;
	}
	return new Road(sprite, position, direction);
}

function renderRoads(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2 - (tileHeight/2));
    for (let y = 0; y < roads.length; y++) {
        for (let x = 0; x < roads[y].length; x++) {
	    const road = roads[y][x];
	    if(road) {
		    if(deleteMode && y == isoPlayerMouse.y && x == isoPlayerMouse.x) {
			ctx.save();
			ctx.filter = "url('./img//red-filter.svg#red')";
			drawRoad(ctx, {x: x, y: y}, road);
			ctx.restore();
		    } else {
			    drawRoad(ctx, {x: x, y: y}, road);
		    }
	    }
        }
    }
    ctx.restore();
}

function drawRoad(ctx: CanvasRenderingContext2D, position: Position, road: Road) {
	let pos = isoToScreen(position);
	ctx.drawImage(road.sprite, pos.x-road.sprites.size.width/2, pos.y-road.sprites.size.height+tileHeight, road.sprites.size.width, road.sprites.size.height);
}


function finalizeBuildingPlacement(position: Position) {
	let created = buildingMap[position.y][position.x];
	if(created) {
		created.accepted = true;
	}
}

function canBePlaced(position: Position, sprite: BuildingSprite): boolean {
	const x = position.x;
	const lowX = x - sprite.baseSize;
	const y = position.y;
	const lowY = y - sprite.baseSize;
	if(lowY+1 < 0 || lowX+1 < 0) {
		console.log("Cannot build");
		return false;
	}
	if(x >= blocked[0].length || y >= blocked.length) {
		console.log("Cannot build");
		return false;
	}
	for(let i = x; i > lowX; i--) {
		for(let j = y; j > lowY; j--) {
			if(blocked[j][i]) {
				console.log("Cannot build");
				return false;
			}
		}
	}
	return true;
}

function roadCanBePlaced(position: Position): boolean {
	const x = position.x;
	const y = position.y;
	if(x >= blocked[0].length || y >= blocked.length) {
		return false;
	}
	if(x < 0 || y < 0) {
		return false;
	}
	return !blocked[y][x];
}

function sortBuildings() {
	buildings.sort((a, b) => {
		// sort by diagonal of a center
		const centerA = [Math.floor((a.position.x + a.position.x - a.sprite.baseSize + 1)/2), Math.floor((a.position.y + a.position.y - a.sprite.baseSize + 1)/2)]
		const centerB = [Math.floor((b.position.x + b.position.x - b.sprite.baseSize + 1)/2), Math.floor((b.position.y + b.position.y - b.sprite.baseSize + 1)/2)]
		const sum =  (centerA[0] + centerA[1]) - (centerB[0] + centerB[1]);
		return sum;
	});
}

function ghostDiff(b: Building) {
	if (!mode) {
		return -1;
	}

	const centerA = [Math.floor((isoPlayerMouse.x + isoPlayerMouse.x - mode.baseSize + 1)/2), Math.floor((isoPlayerMouse.y + isoPlayerMouse.y - mode.baseSize + 1)/2)]
	const centerB = [Math.floor((b.position.x + b.position.x - b.sprite.baseSize + 1)/2), Math.floor((b.position.y + b.position.y - b.sprite.baseSize + 1)/2)]
	const sum =  (centerA[0] + centerA[1]) - (centerB[0] + centerB[1]);
	return sum;
}

function deleteBuilding(position: Position) {
	const building = buildingMap[position.y][position.x];
	if(!building) {
		return;
	}
	for(let i = building.position.x; i > building.position.x-building.sprite.baseSize; i--) {
		for(let j = building.position.y; j > building.position.y-building.sprite.baseSize; j--) {
			blocked[j][i] = false;
			buildingMap[j][i] = undefined;
		}
	}
	buildings = buildings.filter((b) => b.position.x != building.position.x || b.position.y != building.position.y);
}

function deleteRoad(position: Position) {
	const road = roads[position.y][position.x];
	if(!road) {
		return;
	}
	blocked[position.y][position.x] = false;
	roads[position.y][position.x] = undefined;
	if(position.y - 1 >=0 && roads[position.y-1][position.x]) {
		roads[position.y-1][position.x]!.xorDir(0b0010);
	}
	if(position.y + 1 < roads.length && roads[position.y+1][position.x]) {
		roads[position.y+1][position.x]!.xorDir(0b1000);
	}
	if(position.x - 1 >=0 && roads[position.y][position.x-1]) {
		roads[position.y][position.x-1]!.xorDir(0b0100);
	}
	if(position.x + 1 < roads[0].length && roads[position.y][position.x+1]) {
		roads[position.y][position.x+1]!.xorDir(0b0001);
	}
}


function renderBuildings(ctx: CanvasRenderingContext2D) {
	let buildingUnderCuror = undefined;
	if(onMap(isoPlayerMouse)) {
		buildingUnderCuror = buildingMap[isoPlayerMouse.y][isoPlayerMouse.x];
	}
	const ghostCanBePlaced = mode ? canBePlaced(isoPlayerMouse, mode) : false;
	ctx.save();
	ctx.translate(canvasWidth / 2, canvasHeight / 2 - (tileHeight/2));
	let ghostDrawn = false;
	for (const building of buildings) {
		if(ghostCanBePlaced && ghostDiff(building) <= 0) {
			drawGhost(ctx);
			ghostDrawn = true;
		}
		if(mode == undefined && buildingUnderCuror?.position.x == building.position.x && buildingUnderCuror.position.y == building.position.y) {
			ctx.save();
			ctx.filter = deleteMode ? "url('./img//red-filter.svg#red')" : "grayscale(40%)";
			drawBuilding(ctx, building.position, building.sprite);
			ctx.restore();
		} else if(building.accepted) {
			drawBuilding(ctx, building.position, building.sprite);
		} else {
			ctx.save();
			ctx.filter = "grayscale(80%)"; 
			drawBuilding(ctx, building.position, building.sprite);
			ctx.restore();
		}
	}
	if(mode && !ghostDrawn) {
		drawGhost(ctx, !ghostCanBePlaced);
	}
	
	const roadGhostCanBePlaced = roadMode ? roadCanBePlaced(isoPlayerMouse) : false; 
	if(roadMode) {
		ctx.save();
		ctx.filter = roadGhostCanBePlaced ? "grayscale(90%)" : "url('./img//red-filter.svg#red') opacity(0.75)";
		ctx.globalAlpha = 0.75;
		drawRoad(ctx, isoPlayerMouse, calculateRoadConnections(isoPlayerMouse, roadMode, roadGhostCanBePlaced));
		ctx.restore();
	}
	ctx.restore();
}

function drawGhost(ctx: CanvasRenderingContext2D, red: boolean = false) {
	if (!mode) {
		return;
	}
	ctx.save();
	ctx.filter = red ? "url('./img//red-filter.svg#red') opacity(0.75)" : "grayscale(90%)";
	ctx.globalAlpha = 0.75;
	let pos = isoToScreen(isoPlayerMouse);
	ctx.drawImage(mode.image, pos.x-mode.size.width/2, pos.y-mode.size.height+tileHeight, mode.size.width, mode.size.height);
	ctx.restore();
}


class BuildingSprite {
	size: Size;
	image: HTMLImageElement;
	baseSize: number;

	constructor(image: HTMLImageElement, size: number) {
		this.image = image;
		this.size = getSize(image, size)
		this.baseSize = size;
	}

	refreshSize() {
		this.size = getSize(this.image, this.baseSize);
	}

}

class Building {
	sprite: BuildingSprite;
	position: Position;
	accepted: boolean;

	constructor(sprite: BuildingSprite, position: Position, accepted: boolean = true) {
		this.sprite =  sprite;
		this.position = position;
		this.accepted = accepted;
	}
}

class Road {
	sprites: TilingSprite;
	sprite: HTMLImageElement;
	position: Position;
	accepted: boolean;
	direction: number;

	constructor(sprite: TilingSprite, position: Position, direction: number, accepted: boolean = true) {
		this.direction = direction;
		this.sprites = sprite;
		this.sprite =  sprite.sprites[this.direction];
		this.position = position;
		this.accepted = accepted;
	}
	
	xorDir(dir: number) {
		this.direction ^= dir;
		this.sprite = this.sprites.sprites[this.direction];
	}
}


class TilingSprite {
	size: Size;
	sprites: HTMLImageElement[];
	baseSize: number;

	constructor(sprites: HTMLImageElement[]) {
		this.sprites = sprites;
		this.size = getSize(this.sprites[0], 1)
		this.baseSize = 1;
	}

	refreshSize() {
		this.size = getSize(this.sprites[0], this.baseSize);
	}

}

function renderGame(context: CanvasRenderingContext2D, deltaTime: number) {
	context.clearRect(0, 0, canvasWidth, canvasHeight);
	drawIsometricMap(context);
	renderRoads(context);
	renderBuildings(context);
	renderDebugInfo(context, deltaTime);
}

let playerMouse: Position = {x: 0, y: 0};
let isoPlayerMouse: Position = {x: -1, y: -1};

let isDragging = false;
let dragStart: Position = {x: 0, y: 0};

const dts: number[] = [];

let mode: BuildingSprite | undefined = undefined;


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
    ctx.fillText(`(${isoPlayerMouse.x}, ${isoPlayerMouse.y})`, 20, 100);
}

let deleteMode = false;
let roadMode: TilingSprite | undefined = undefined;

function switchToDeleteMode() {
	deleteMode = true;
	roadMode = undefined;
	mode = undefined;
}

function switchToNormalMode() {
	deleteMode = false;
	roadMode = undefined;
	mode = undefined;
}

function switchToRoadMode(sprite: TilingSprite) {
	deleteMode = false;
	roadMode = sprite;
	mode = undefined;
}

function switchToBuildMode(sprite: BuildingSprite) {
	deleteMode = false;
	roadMode = undefined;
	mode = sprite;
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

	function rescaleSprites() {
		for (const key in sprites) {
			sprites[key].refreshSize();
		}
	}
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

	putBuilding({x: 3, y: 3}, sprites["ziggurat"]);
	// putBuilding({x: 7, y: 7}, home);
	// putBuilding({x: 7, y: 9}, home);
	// putBuilding({x: 9, y: 7}, home);
	// putBuilding({x: 9, y: 9}, home);
	// putBuilding({x: 9, y: 1}, tower);
	// putBuilding({x: 8, y: 12}, inspector);
	// putBuilding({x: 10, y: 12}, well);
	putRoad({x: 5, y: 5}, road, true);
	putRoad({x: 5, y: 6}, road, true);
	putRoad({x: 6, y: 5}, road, true);


	function correctOffset() {
		if(positionOffset.y < 0) {
			positionOffset.y = 0;
		}
		if(positionOffset.y > maxYOffset) {
			positionOffset.y = maxYOffset;
		}
		if(positionOffset.x < minXOffset) {
			positionOffset.x = minXOffset;
		}
		if(positionOffset.x > maxXOffset) {
			positionOffset.x = maxXOffset;
		}
	}

	canvas.addEventListener('mousemove', function(event) {
		const rect = canvas.getBoundingClientRect();

		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;
		playerMouse = {x: mouseX, y: mouseY};
		isoPlayerMouse = screenToIso(playerMouse);

		if (isDragging) {
			positionOffset.x = dragStart.x - event.clientX;
			positionOffset.y = dragStart.y - event.clientY;
			correctOffset();
		}
	});

	let maxYOffset = isoToScreen({x: map[0].length - 1, y: map.length - 1}).y + (tileHeight/2);
	let minXOffset = isoToScreen({x: 0, y: map.length - 1}).x  - (tileWidth/2);
	let maxXOffset = isoToScreen({x: map[0].length - 1, y: 0}).x  + (tileWidth/2);

	function rescaleOffsets(oldScale: number) {
		positionOffset.x = scale*positionOffset.x/oldScale;
		positionOffset.y = scale*positionOffset.y/oldScale;
		maxYOffset = isoToScreen({x: map[0].length - 1, y: map.length - 1}).y + (tileHeight/2) + positionOffset.y; // + offset to calculate from 0,0
		minXOffset = isoToScreen({x: 0, y: map.length - 1}).x  - (tileWidth/2) + positionOffset.x;
		maxXOffset = isoToScreen({x: map[0].length - 1, y: 0}).x  + (tileWidth/2) + positionOffset.x;
		correctOffset();
	}


	canvas.addEventListener('mousedown', (event) => {
		if(event.button == 1) {
			isDragging = true;
			dragStart.x = event.clientX + positionOffset.x;
			dragStart.y = event.clientY + positionOffset.y;
		}

		console.log(event.button)
		if(event.button == 0) {
			if(mode) {
				putBuilding(isoPlayerMouse, mode, false);
				finalizeBuildingPlacement(isoPlayerMouse);
			} else if(deleteMode) {
				deleteBuilding(isoPlayerMouse);
				deleteRoad(isoPlayerMouse);
			} else if(roadMode) {
				putRoad(isoPlayerMouse, road);
			}
		}
	});

	canvas.addEventListener('mouseup', (_event) => {
		isDragging = false;
	});
	canvas.addEventListener('wheel', function(event) {
		if(isDragging) {
			return;
		}
		if (event.deltaY < 0) {
			let oldScale = scale;
			scale += 0.2;
			if(scale > 2.0) {
				scale = 2.0;
			}
			tileWidth = scale*defTileWidth;
			tileHeight = scale*defTileHeight;
			rescaleOffsets(oldScale);
			rescaleSprites();
		} else {
			let oldScale = scale;
			scale -= 0.2;
			if(scale < 0.5) {
				scale = 0.5;
			}
			tileWidth = scale*defTileWidth;
			tileHeight = scale*defTileHeight;
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
				let oldScale = scale;
				scale += 0.2;
			        if(scale > 2.0) {
					scale = 2.0;
				}
				tileWidth = scale*defTileWidth;
				tileHeight = scale*defTileHeight;
				rescaleOffsets(oldScale);
				rescaleSprites();
			}
			break;
			case '-': {
				let oldScale = scale;
				scale -= 0.2;
			        if(scale < 0.5) {
					scale = 0.5;
				}
				tileWidth = scale*defTileWidth;
				tileHeight = scale*defTileHeight;
				rescaleOffsets(oldScale);
				rescaleSprites();
			}
			break;
			case '0': switchToNormalMode(); break;
			case '1': switchToBuildMode(home); break;
			case '2': switchToBuildMode(ziggurat); break;
			case '3': switchToBuildMode(tower); break;
			case '4': switchToBuildMode(well); break;
			case '5': switchToBuildMode(inspector); break;
			case '6': switchToRoadMode(road); break;
			case '9': switchToDeleteMode(); break;
		}

		if(moveUp) {
			positionOffset.y = positionOffset.y - 10;
			if(positionOffset.y < 0) {
				positionOffset.y = 0;
			}
			isoPlayerMouse = screenToIso(playerMouse);
		}
		if(moveDown) {
			positionOffset.y = positionOffset.y + 10;
			if(positionOffset.y > maxYOffset) {
				positionOffset.y = maxYOffset;
			}
			isoPlayerMouse = screenToIso(playerMouse);
		}
		if(moveLeft) {
			positionOffset.x = positionOffset.x - 10;
			if(positionOffset.x < minXOffset) {
				positionOffset.x = minXOffset;
			}
			isoPlayerMouse = screenToIso(playerMouse);
		}
		if(moveRight) {
			positionOffset.x = positionOffset.x + 10;
			if(positionOffset.x > maxXOffset) {
				positionOffset.x = maxXOffset;
			}
			isoPlayerMouse = screenToIso(playerMouse);
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
