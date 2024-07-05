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

function putImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, position: Position, size: Size) {
	let pos = isoToScreen(position);
	ctx.drawImage(img, pos.x-size.width/2, pos.y-size.height+tileHeight, size.width, size.height);
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
	drawIsometricMap(context);

	const zigguratPos = {x: 1, y: 1};
	const ziggurat = await loadImage("./img/ziggurat.svg");
	const zigguratSize = getSize(ziggurat, 2);

	const homePos = {x: 3, y: 3};
	const home2Pos = {x: 4, y: 4};
	const home = await loadImage("./img/house.svg");
	const homeSize = getSize(home, 1);

	const towerPos = {x: 4, y: 0};
	const tower = await loadImage("./img/tower.svg");
	const towerSize = getSize(tower, 1);

        context.save();
        context.translate(canvasWidth / 2, canvasHeight / 2 - (tileHeight/2)*5);
	putImage(context, ziggurat, zigguratPos, zigguratSize);
	putImage(context, home, homePos, homeSize);
	putImage(context, home, home2Pos, homeSize);
	putImage(context, tower, towerPos, towerSize);
	context.restore();
}
