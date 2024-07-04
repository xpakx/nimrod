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

window.onload = () => {
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
}
