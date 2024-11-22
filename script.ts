import { Actor } from "./classes/actor.js";
import { Game } from "./classes/game.js";

let game = new Game();

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

function registerKeyboardEvents() {
	document.addEventListener('keydown', function(event) {
		game.onKeyDown(event);
	});

	document.addEventListener('keyup', function(event) {
		game.onKeyUp(event);
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
	registerKeyboardEvents();

	const frame = (timestamp: number) => {
		game.nextFrame(context, timestamp);
		window.requestAnimationFrame(frame);
	};
	window.requestAnimationFrame((timestamp) => {
		game.state.prevTimestamp = timestamp;
		window.requestAnimationFrame(frame);
	});


	game.interf.setDialogue(context, {text: "Welcome to the game!", portrait: game.sprites.avatars['ratman']});
	setTimeout(() => {
		game.interf.closeDialogue();
	}, 3000);
}
