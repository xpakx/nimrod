const defTileWidth = 64;
const defTileHeight = 32;
let scale = 1.0;
let tileWidth = defTileWidth*scale;
let tileHeight = defTileHeight*scale;
const canvasWidth = 800;
const canvasHeight = 600;

let positionOffset = {x: 0, y: 0}

const map = [
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#fccb66', '#fccb66', '#fccb66', '#fccb66', '#fccb66', '#fccb66', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#fccb66', '#97b106', '#97b106', '#97b106', '#97b106', '#fccb66', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#fccb66', '#97b106', '#97b106', '#97b106', '#97b106', '#fccb66', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#fccb66', '#97b106', '#97b106', '#97b106', '#97b106', '#fccb66', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#fccb66', '#97b106', '#97b106', '#97b106', '#97b106', '#fccb66', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#fccb66', '#fccb66', '#fccb66', '#fccb66', '#fccb66', '#fccb66', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
    ['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
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
	    if(x == isoPlayerMouse.x && y == isoPlayerMouse.y) {
		    color = "black";
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

function putBuilding(position: Position, sprite: BuildingSprite) {
	if(canBePlaced(position)) {
		const newBuilding = new Building(sprite, position);
		buildingMap[position.x][position.y] = newBuilding;
		buildings.push(newBuilding);
		sortBuildings();
		buildings.forEach((a) => console.log(a.position));
	}
}

function canBePlaced(position: Position): boolean {
	return true; // TODO
}

function sortBuildings() {
	buildings.sort((a, b) => {
		// sort by diagonal
		const sum = a.position.x + a.position.y - (b.position.x + b.position.y);
		if (sum !== 0) {
			return sum;
		}

		// on same diagonal
		const xDistance = b.position.x - a.position.x;
		if(Math.abs(xDistance) < Math.max(a.sprite.baseSize, b.sprite.baseSize)) {
			return b.sprite.baseSize - a.sprite.baseSize;

		}
		return xDistance;
	});
}

function renderBuildings(ctx: CanvasRenderingContext2D) {
	ctx.save();
	ctx.translate(canvasWidth / 2, canvasHeight / 2 - (tileHeight/2));
	for (const building of buildings) {
		drawBuilding(ctx, building.position, building.sprite);
	}
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

	constructor(sprite: BuildingSprite, position: Position) {
		this.sprite =  sprite;
		this.position = position;
	}
}

function renderGame(context: CanvasRenderingContext2D, deltaTime: number) {
	context.clearRect(0, 0, canvasWidth, canvasHeight);
	drawIsometricMap(context);

	renderBuildings(context);
	renderDebugInfo(context, deltaTime);
}

let playerMouse: Position = {x: 0, y: 0};
let isoPlayerMouse: Position = {x: 0, y: 0};

let isDragging = false;
let dragStart: Position = {x: 0, y: 0};

const dts: number[] = [];

let mode = 0;


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
	putBuilding({x: 3, y: 3}, ziggurat);
	// putBuilding({x: 7, y: 7}, home);
	// putBuilding({x: 7, y: 9}, home);
	// putBuilding({x: 9, y: 7}, home);
	// putBuilding({x: 9, y: 9}, home);
	// putBuilding({x: 9, y: 1}, tower);
	// putBuilding({x: 8, y: 12}, inspector);
	// putBuilding({x: 10, y: 12}, well);


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
			if(mode == 1) {
				putBuilding(isoPlayerMouse, home);
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
			for (const building of buildings) {
				building.sprite.refreshSize();
			}
		} else {
			let oldScale = scale;
			scale -= 0.2;
			if(scale < 0.5) {
				scale = 0.5;
			}
			tileWidth = scale*defTileWidth;
			tileHeight = scale*defTileHeight;
			rescaleOffsets(oldScale);
			for (const building of buildings) {
				building.sprite.refreshSize();
			}
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
				for (const building of buildings) {
					building.sprite.refreshSize();
				}
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
				for (const building of buildings) {
					building.sprite.refreshSize();
				}
			}
			break;
			case '0': mode = 0; break;
			case '1': mode = 1; break;
			case '2': mode = 2; break;
			case '3': mode = 3; break;
			case '4': mode = 4; break;
			case '5': mode = 5; break;
			case '6': mode = 6; break;
			case '7': mode = 7; break;
			case '8': mode = 8; break;
			case '9': mode = 9; break;
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
