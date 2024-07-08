const tileWidth = 128;
const tileHeight = 64;
const canvasWidth = 800;
const canvasHeight = 600;

let positionOffset = {x: 0, y: 0}

const map = [
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD', '#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD', '#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD', '#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD', '#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD', '#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD', '#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD', '#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD', '#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD', '#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD', '#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD', '#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD', '#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
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

function putBuilding(ctx: CanvasRenderingContext2D, position: Position, building: Building) {
	let pos = isoToScreen(position);
	ctx.drawImage(building.image, pos.x-building.size.width/2, pos.y-building.size.height+tileHeight, building.size.width, building.size.height);
}

class Building {
	size: Size;
	image: HTMLImageElement;

	constructor(image: HTMLImageElement, size: number) {
		this.image = image;
		this.size = getSize(image, size)
	}

}

function renderGame(context: CanvasRenderingContext2D, deltaTime: number, sprites: any) {
	context.clearRect(0, 0, canvasWidth, canvasHeight);
	drawIsometricMap(context);

        context.save();
        context.translate(canvasWidth / 2, canvasHeight / 2 - (tileHeight/2));
	putBuilding(context, {x: 1, y: 1}, sprites.ziggurat);
	putBuilding(context, {x: 3, y: 3}, sprites.house);
	putBuilding(context, {x: 3, y: 4}, sprites.house);
	putBuilding(context, {x: 4, y: 3}, sprites.house);
	putBuilding(context, {x: 4, y: 4}, sprites.house);
	putBuilding(context, {x: 4, y: 0}, sprites.tower);
	context.restore();
	renderDebugInfo(context, deltaTime);
}

let playerMouse: Position = {x: 0, y: 0};
let isoPlayerMouse: Position = {x: 0, y: 0};

let isDragging = false;
let dragStart: Position = {x: 0, y: 0};

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

	const ziggurat = new Building(await loadImage("./img/ziggurat.svg"), 2);
	const home = new Building(await loadImage("./img/house.svg"), 1);
	const tower = new Building(await loadImage("./img/tower.svg"), 1);
	const sprites = {
		ziggurat: ziggurat,
		house: home,
		tower: tower,
	};

	canvas.addEventListener('mousemove', function(event) {
		const rect = canvas.getBoundingClientRect();

		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;
		playerMouse = {x: mouseX, y: mouseY};
		isoPlayerMouse = screenToIso(playerMouse);

		if (isDragging) {
			positionOffset.x = dragStart.x - event.clientX;
			positionOffset.y = dragStart.y - event.clientY;
		}
	});

	canvas.addEventListener('mousedown', (event) => {
		if(event.button == 1) {
			isDragging = true;
			dragStart.x = event.clientX + positionOffset.x;
			dragStart.y = event.clientY + positionOffset.y;
		}
	});

	canvas.addEventListener('mouseup', (_event) => {
		isDragging = false;
	});

	document.addEventListener('keydown', function(event) {
            switch (event.key) {
                case 'ArrowUp': case 'k':
		    if(positionOffset.y <= 0) {
			break;
		    }
		    positionOffset = {x: positionOffset.x, y: positionOffset.y - 10};
		    isoPlayerMouse = screenToIso(playerMouse);
                    break;
                case 'ArrowDown': case 'j':
		    positionOffset = {x: positionOffset.x, y: positionOffset.y + 10};
		    isoPlayerMouse = screenToIso(playerMouse);
                    break;
                case 'ArrowLeft': case 'h':
		    positionOffset = {x: positionOffset.x - 10, y: positionOffset.y};
		    isoPlayerMouse = screenToIso(playerMouse);
                    break;
                case 'ArrowRight': case 'l':
		    positionOffset = {x: positionOffset.x + 10, y: positionOffset.y};
		    isoPlayerMouse = screenToIso(playerMouse);
                    break;
            }
        });

	let prevTimestamp = 0;

	const frame = (timestamp: number) => {
		const deltaTime = (timestamp - prevTimestamp) / 1000;
		prevTimestamp = timestamp;
		renderGame(context, deltaTime, sprites);
		window.requestAnimationFrame(frame);
	};
	window.requestAnimationFrame((timestamp) => {
		prevTimestamp = timestamp;
		window.requestAnimationFrame(frame);
	});
}
