import { Game } from "./classes/game.js";
import { LoggerFactory } from "./classes/logger.js";
import { avatarSettings, buildingSettings, campaignSettings, iconSettings, tabSettings } from "./classes/building-settings.js";
import { BattleMapData } from "./classes/save-manager.js";

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
	const loggerFactory = LoggerFactory.getInstance();
	loggerFactory.updateAllLevels("debug");
	loggerFactory.enable(["Game", "SaveManager"]);
	const logger = loggerFactory.getLogger("Script");

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
	canvas.width = game.state.canvasSize.width;
	canvas.height = game.state.canvasSize.height;
	logger.debug('Preparing assets');

	await game.prepareAssets(buildingSettings, avatarSettings, iconSettings, tabSettings);

	logger.debug('Loading map');
	const saveLoaded = game.saveManager.loadState(game, "quicksave");
	if (!saveLoaded) {
		game.saveManager.loadMapFromUrl(game, "test.json", true);
	}


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

	game.loadCampaign(campaignSettings);
}
