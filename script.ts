const tileWidth = 128;
const tileHeight = 64;
const canvasWidth = 800;
const canvasHeight = 600;

const map = [
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD']
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
    const screenX = (pos.x - pos.y) * (tileWidth / 2);
    const screenY = (pos.x + pos.y) * (tileHeight / 2);
    return { x: screenX, y: screenY };
}

function drawIsometricMap(ctx: CanvasRenderingContext2D) {
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            const color = map[y][x];
            const screenPos = isoToScreen({x: x, y: y});
            drawTile(ctx, screenPos.x, screenPos.y, color);
        }
    }
}

function drawTile(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2 - (tileHeight/2)*5);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + tileWidth / 2, y + tileHeight / 2);
    ctx.lineTo(x, y + tileHeight);
    ctx.lineTo(x - tileWidth / 2, y + tileHeight / 2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
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
	drawIsometricMap(context);

        context.save();
        context.translate(canvasWidth / 2, canvasHeight / 2 - (tileHeight/2)*5);
	putBuilding(context, {x: 1, y: 1}, sprites.ziggurat);
	putBuilding(context, {x: 3, y: 3}, sprites.house);
	putBuilding(context, {x: 3, y: 4}, sprites.house);
	putBuilding(context, {x: 4, y: 3}, sprites.house);
	putBuilding(context, {x: 4, y: 4}, sprites.house);
	putBuilding(context, {x: 4, y: 0}, sprites.tower);
	context.restore();
	renderFPS(context, deltaTime);
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
