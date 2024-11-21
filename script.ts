import { Actor } from "./classes/actor.js";
import { Game } from "./classes/game.js";

let game = new Game();

const dts: number[] = [];


function renderGame(context: CanvasRenderingContext2D, deltaTime: number) {
	context.clearRect(0, 0, game.state.canvasWidth, game.state.canvasHeight);
	game.map.renderMap(context, game.state.pedestrians, deltaTime);
	game.interf.renderInterface(context, deltaTime);
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
    ctx.fillText(`(${game.state.playerMouse.x}, ${game.state.playerMouse.y})`, 20, 100);
    ctx.fillText(`(${game.map.isoPlayerMouse.x}, ${game.map.isoPlayerMouse.y})`, 20, 125);
}

function registerMouseEvents(canvas: HTMLCanvasElement) {
	canvas.addEventListener('mousemove', function(event) {
		game.onMouseMove(event, canvas);
	});

	canvas.addEventListener('mousedown', (event) => {
		if(event.button == 1) {
			game.onMouseMiddleClick(event);
		}

		if(event.button == 0) {
			game.onMouseLeftClick(event);
		}
	});

	canvas.addEventListener('mouseup', (event) => {
		game.onMouseUp(event);
	});

	canvas.addEventListener('wheel', function(event) {
		game.onMouseWheel(event);
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
	canvas.width = game.state.canvasWidth;
	canvas.height = game.state.canvasHeight;
	await game.prepareAssets();
	game.loadMap("test.json");
	game.state.pedestrians.push(new Actor(game.sprites.actors['test'], {x: 1, y: 9}));

	registerMouseEvents(canvas);

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
				game.rescale(0.2);
			}
			break;
			case '-': {
				game.rescale(-0.2);
			}
			break;
			case '0': case 'Escape': game.map.switchToNormalMode(); break;
			case '9': game.map.switchToDeleteMode(); break;
			case 'Enter': game.interf.dialogueAction(); break;
		}

		if(moveUp) {
			game.map.positionOffset.y = game.map.positionOffset.y - 10;
			if(game.map.positionOffset.y < 0) {
				game.map.positionOffset.y = 0;
			}
			game.map.updateMousePosition(game.state.playerMouse);
		}
		if(moveDown) {
			game.map.positionOffset.y = game.map.positionOffset.y + 10;
			if(game.map.positionOffset.y > game.maxYOffset) {
				game.map.positionOffset.y = game.maxYOffset;
			}
			game.map.updateMousePosition(game.state.playerMouse);
		}
		if(moveLeft) {
			game.map.positionOffset.x = game.map.positionOffset.x - 10;
			if(game.map.positionOffset.x < game.minXOffset) {
				game.map.positionOffset.x = game.minXOffset;
			}
			game.map.updateMousePosition(game.state.playerMouse);
		}
		if(moveRight) {
			game.map.positionOffset.x = game.map.positionOffset.x + 10;
			if(game.map.positionOffset.x > game.maxXOffset) {
				game.map.positionOffset.x = game.maxXOffset;
			}
			game.map.updateMousePosition(game.state.playerMouse);
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
		for(let building of game.map.buildings) {
			const newPedestrian = building.tick(deltaTime);
			if(newPedestrian && building.workerSpawn) {
				game.state.pedestrians.push(new Actor(game.sprites.actors['test'], building.workerSpawn));
			}
		}
		const dTime = deltaTime > 0.5 ? 0.5 : deltaTime;
		let diagonalChanged = false;

		let randMap = [
			Math.floor(Math.random() * 2),
			Math.floor(Math.random() * 3),
			Math.floor(Math.random() * 4),
		]
		for(let pedestrian of game.state.pedestrians) {
			diagonalChanged ||= pedestrian.tick(dTime, game.map.roads, randMap);
		}
		game.state.pedestrians = game.state.pedestrians.filter((p) => !p.dead);
		if(diagonalChanged) {
			game.state.sortPedestrians(); // TODO: more efficient way?
		}
		renderGame(context, deltaTime);
		window.requestAnimationFrame(frame);
	};
	window.requestAnimationFrame((timestamp) => {
		prevTimestamp = timestamp;
		window.requestAnimationFrame(frame);
	});


	game.interf.setDialogue(context, {text: "Welcome to the game!", portrait: game.sprites.avatars['ratman']});
	setTimeout(() => {
		game.interf.closeDialogue();
	}, 3000);
}
