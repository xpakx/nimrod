import { Actor } from "./classes/actor.js";
import { TilingSprite } from "./classes/buildings.js";
import { MapLayer } from "./classes/map-layer.js";
import { prepareTabs } from "./classes/sidebar.js";
import { SpriteLibrary } from "./classes/sprite-library.js";
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

function loadMap(filename: string, map: MapLayer, sprites: SpriteLibrary, road: TilingSprite) {
	fetch(`maps/${filename}`)
	.then(response => {
		if (!response.ok) {
			throw new Error(`HTTP error while loading a map! status: ${response.status}`);
		}
		return response.json();
	})
	.then(data => {
		console.log(data);
		const height = data['size']['height']; 
		const width = data['size']['width']; 
		const newMap: string[][] = Array(height).fill(null).map(() => Array(width).fill('#97b106'));
		map.map = newMap;

		for (let pos of data['roads']) {
			map.putRoad({x: pos['x'], y: pos['y']}, road, true);
		}

		for (let building of data['buildings']) {
			map.putBuilding({x: building['x'], y: building['y']}, sprites.buildings[building['type']]);
		}
		map.getBuilding({x: 3, y: 11})!.setWorker(sprites.buildings["home"]);
	})
	.catch(error => {
		console.log(error);
		throw new Error(`Error loading the JSON file: ${error}`);
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

	game.interf.tabs = await prepareTabs(game.sprites.buildings);
	game.interf.tab = 0;
	game.interf.recalculateTabSize();
	game.interf.calculateTabIcons();


	loadMap("test.json", game.map, game.sprites, game.sprites.getRoad());

	game.state.pedestrians.push(new Actor(game.sprites.actors['test'], {x: 1, y: 9}));


	function correctOffset() {
		if(game.map.positionOffset.y < 0) {
			game.map.positionOffset.y = 0;
		}
		if(game.map.positionOffset.y > maxYOffset) {
			game.map.positionOffset.y = maxYOffset;
		}
		if(game.map.positionOffset.x < minXOffset) {
			game.map.positionOffset.x = minXOffset;
		}
		if(game.map.positionOffset.x > maxXOffset) {
			game.map.positionOffset.x = maxXOffset;
		}
	}

	canvas.addEventListener('mousemove', function(event) {
		const rect = canvas.getBoundingClientRect();

		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;
		game.state.playerMouse = {x: mouseX, y: mouseY};
		if(!game.interf.mouseInsideInterface(game.state.playerMouse)) {
			game.map.updateMousePosition(game.state.playerMouse);
		} 
		game.interf.onMouse(game.state.playerMouse);

		if (game.map.isDragging) {
			game.map.positionOffset.x = game.map.dragStart.x - event.clientX;
			game.map.positionOffset.y = game.map.dragStart.y - event.clientY;
			correctOffset();
		}
	});

	let maxYOffset = game.map.isoToScreen({x: game.map.map[0].length - 1, y: game.map.map.length - 1}).y + (game.map.tileSize.height/2);
	let minXOffset = game.map.isoToScreen({x: 0, y: game.map.map.length - 1}).x  - (game.map.tileSize.width/2);
	let maxXOffset = game.map.isoToScreen({x: game.map.map[0].length - 1, y: 0}).x  + (game.map.tileSize.width/2);

	function rescaleOffsets(oldScale: number) {
		game.map.positionOffset.x = game.map.scale*game.map.positionOffset.x/oldScale;
		game.map.positionOffset.y = game.map.scale*game.map.positionOffset.y/oldScale;
		maxYOffset = game.map.isoToScreen({x: game.map.map[0].length - 1, y: game.map.map.length - 1}).y + (game.map.tileSize.height/2) + game.map.positionOffset.y; // + offset to calculate from 0,0
		minXOffset = game.map.isoToScreen({x: 0, y: game.map.map.length - 1}).x  - (game.map.tileSize.width/2) + game.map.positionOffset.x;
		maxXOffset = game.map.isoToScreen({x: game.map.map[0].length - 1, y: 0}).x  + (game.map.tileSize.width/2) + game.map.positionOffset.x;
		correctOffset();
	}


	canvas.addEventListener('mousedown', (event) => {
		if(event.button == 1) {
			game.middleMouseClick(event);
		}

		if(event.button == 0) {
			game.rightMouseClick(event);
		}
	});

	function rescale(dScale: number) {
		let oldScale = game.map.scale;
		game.map.rescale(dScale);
		rescaleOffsets(oldScale);
		game.sprites.rescaleSprites(game.map.tileSize);
	}

	canvas.addEventListener('mouseup', (_event) => {
		game.map.isDragging = false;
	});
	canvas.addEventListener('wheel', function(event) {
		if(game.map.isDragging) {
			return;
		}
		if (event.deltaY < 0) {
			rescale(0.2);
		} else {
			rescale(-0.2);
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
				rescale(0.2);
			}
			break;
			case '-': {
				rescale(-0.2);
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
			if(game.map.positionOffset.y > maxYOffset) {
				game.map.positionOffset.y = maxYOffset;
			}
			game.map.updateMousePosition(game.state.playerMouse);
		}
		if(moveLeft) {
			game.map.positionOffset.x = game.map.positionOffset.x - 10;
			if(game.map.positionOffset.x < minXOffset) {
				game.map.positionOffset.x = minXOffset;
			}
			game.map.updateMousePosition(game.state.playerMouse);
		}
		if(moveRight) {
			game.map.positionOffset.x = game.map.positionOffset.x + 10;
			if(game.map.positionOffset.x > maxXOffset) {
				game.map.positionOffset.x = maxXOffset;
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
