const tileWidth = 64;
const tileHeight = 32;
const canvasWidth = 800;
const canvasHeight = 600;

const map = [
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD'],
    ['#FF5733', '#FFBD33', '#75FF33', '#33FF57', '#33FFBD']
];

function isoToScreen(x: number, y: number) {
    const screenX = (x - y) * (tileWidth / 2);
    const screenY = (x + y) * (tileHeight / 2);
    return { x: screenX, y: screenY };
}

function drawIsometricMap(ctx: CanvasRenderingContext2D) {
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            const color = map[y][x];
            const screenPos = isoToScreen(x, y);
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

function getSize(img: HTMLImageElement, widthNorm: number): number[] {
	const width = tileWidth*widthNorm;
	const height = img.height*(width/img.width);
	return [width, height];
}

function putImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, position: number[], size: number[]) {
	let pos = isoToScreen(position[0], position[1]);
	ctx.drawImage(img, pos.x-size[0]/2, pos.y-size[1]+tileHeight, size[0], size[1]);
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

	const zigguratPos = [2, 2];
	const ziggurat = await loadImage("./img/ziggurat.svg");
	const zigguratSize = getSize(ziggurat, 3);

	const homePos = [3, 3];
	const home = await loadImage("./img/house.svg");
	const homeSize = getSize(home, 1);

	const towerPos = [4, 0];
	const tower = await loadImage("./img/tower.svg");
	const towerSize = getSize(tower, 1);

        context.save();
        context.translate(canvasWidth / 2, canvasHeight / 2 - (tileHeight/2)*5);
	putImage(context, ziggurat, zigguratPos, zigguratSize);
	putImage(context, home, homePos, homeSize);
	putImage(context, tower, towerPos, towerSize);
	context.restore();
}
