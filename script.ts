import { BattleMapData, Game } from "./classes/game.js";
import { ConsoleTransport, Logger } from "./classes/logger.js";

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
	const logger = new Logger("Script", {
		level: 'debug',
		format: 'plain',
		transports: [
			new ConsoleTransport(),
		],
	});

	logger.debug('Started app');
	const canvas = document.getElementById('gameCanvas') as (HTMLCanvasElement | null);
	if (!canvas) {
		logger.error('No canvas elem');
		return;
	}
	const context = canvas.getContext('2d');
	if (!context) {
		logger.error("No context");
		return;
	}
	canvas.width = game.state.canvasWidth;
	canvas.height = game.state.canvasHeight;
	logger.debug('Preparing assets');
	await game.prepareAssets();

	logger.debug('Loading map');
	game.loadMap("test.json", true);

	const battle = await fetch("maps/battle001.json"); 
	const battleJson = await battle.json() as BattleMapData;
	game.state.tempBattleData = battleJson;

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
