import { Actor } from "./actor.js";
import { Building, BuildingPrototype, BuildingSprite, Road, TilingSprite } from "./building/buildings.js";
import { House } from "./building/house.js";
import { Storage } from "./building/storage.js";
import { getLogger, Logger } from "./logger.js";

export class MapLayer {
	defTileWidth: number = 64;
	defTileHeight: number = 32;
	scale: number = 1.0;
	tileSize: Size = {width: this.defTileWidth*this.scale, height: this.defTileHeight*this.scale}

	positionOffset: Position = {x: 0, y: 0}
	canvasSize: Size = {width: 0, height: 0};

	isoPlayerMouse: Position = {x: -1, y: -1};
	isDragging: boolean = false
	dragStart: Position = {x: 0, y: 0};
	tooCostly: boolean = false;
	defaultColor: string = '#97b106';

	mode: Mode = { action: "none" };

	map: string[][] = Array(100).fill(null).map(() => Array(50).fill(this.defaultColor));

	buildingMap: (Building | undefined)[][] = this.map.map(row => row.map(() => undefined)); // for quicker lookup
	buildings: Building[] = [];
	blocked: boolean[][] = this.map.map(row => row.map(() => false));
	blockedMovement: boolean[][] = this.map.map(row => row.map(() => false));
	costs: number[][] = this.map.map(row => row.map(() => 1));
	roads: (Road | undefined)[][] = this.map.map(row => row.map(() => undefined)); // for quicker lookup

	logger: Logger = getLogger("MapLayer");

	constructor(canvasSize: Size) {
		this.canvasSize = canvasSize;
	}

	getCurrentBuilding(): Building | undefined {
		return this.getBuilding(this.isoPlayerMouse);
	}

	copyMousePosition(): Position {
		return {x: this.isoPlayerMouse.x, y: this.isoPlayerMouse.y};
	}

	getMousePosition(): Position {
		return this.isoPlayerMouse;
	}

	resetMap(size: Size) {
		this.buildings = [];
		this.positionOffset = {x: 0, y: 0};
		this.map = Array(size.height).fill(null).map(() => Array(size.width).fill(this.defaultColor));
		this.isDragging = false;
		this.mode = {action: "none"};
		this.roads = this.map.map(row => row.map(() => undefined))
		this.costs = this.map.map(row => row.map(() => 1))
		this.blocked = this.map.map(row => row.map(() => false));
		this.blockedMovement = this.map.map(row => row.map(() => false));
		this.buildingMap = this.map.map(row => row.map(() => undefined))
	}

	rescale(delta: number) {
		this.scale += delta;
		if(this.scale < 0.5) {
			this.scale = 0.5;
		}
		if(this.scale > 2.0) {
			this.scale = 2.0;
		}
		this.tileSize.width = this.scale * this.defTileWidth;
		this.tileSize.height = this.scale * this.defTileHeight;
	}

	renderMap(context: CanvasRenderingContext2D, pedestrians: Actor[], _deltaTime: number) {
		this.drawIsometricMap(context);
		this.renderRoads(context);
		if (this.path) {
			this.drawPath(context);
		}
		this.renderBuildings(context, pedestrians);
	}

	isoToScreen(pos: Position): Position {
		const screenX = (pos.x - pos.y) * (this.tileSize.width / 2) - this.positionOffset.x;
		const screenY = (pos.x + pos.y) * (this.tileSize.height / 2) - this.positionOffset.y;
		return { x: screenX, y: screenY };
	}

	screenToIso(pos: Position): Position {
		const x = pos.x - (this.canvasSize.width / 2) + this.positionOffset.x;
		const y = pos.y - (this.canvasSize.height / 2 - (this.tileSize.height/2)) + this.positionOffset.y;
		const isoX = x/this.tileSize.width + y/this.tileSize.height;
		const isoY = y/this.tileSize.height - x/this.tileSize.width;
		return { x: Math.floor(isoX), y: Math.floor(isoY) };
	}

	drawIsometricMap(ctx: CanvasRenderingContext2D) {
		ctx.save();
		ctx.translate(this.canvasSize.width / 2, this.canvasSize.height / 2 - (this.tileSize.height/2));
		for (let y = 0; y < this.map.length; y++) {
			for (let x = 0; x < this.map[y].length; x++) {
				const screenPos = this.isoToScreen({x: x, y: y});
				if(!this.isTileInView(screenPos)) {
					continue;
				}
				let color = this.map[y][x];
				if(this.mode.action != "build" && x == this.isoPlayerMouse.x && y == this.isoPlayerMouse.y) {
					color = this.mode.action == "delete" ? '#FF5733' : "black";
				}
				this.drawTile(ctx, screenPos.x, screenPos.y, color);
			}
		}
		ctx.restore();
	}

	drawTile(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + this.tileSize.width / 2, y + this.tileSize.height / 2);
		ctx.lineTo(x, y + this.tileSize.height);
		ctx.lineTo(x - this.tileSize.width / 2, y + this.tileSize.height / 2);
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.fill();
	}


	drawBuilding(ctx: CanvasRenderingContext2D, position: Position, building: BuildingSprite) {
		let pos = this.isoToScreen(position);
		ctx.drawImage(
			building.offscreen, 
			pos.x - building.size.width / 2, 
			pos.y - building.size.height + this.tileSize.height
		);
	}

	onMap(position: Position): boolean {
		if(position.x < 0 || position.y < 0) {
			return false;
		}
		if(position.x >= this.map[0].length || position.y >= this.map.length) {
			return false;
		}
		return true;
	}
	
	getBuilding(position: Position): Building | undefined {
		if(position.x < 0 || position.y < 0) {
			return undefined;
		}
		if(position.x >= this.buildingMap[0].length || position.y >= this.buildingMap.length) {
			return undefined;
		}
		return this.buildingMap[position.y][position.x];
	}


	putBuilding(position: Position, building: Building) {
		const sprite = building.sprite;
		this.buildings.push(building);
		this.sortBuildings();
		for(let i = position.x; i > position.x-sprite.baseSize; i--) {
			for(let j = position.y; j > position.y-sprite.baseSize; j--) {
				this.blocked[j][i] = true;
				this.blockedMovement[j][i] = true;
				this.buildingMap[j][i] = building;
			}
		}
		building.calculateSpawn(this.roads);
	}

	putRoad(position: Position, sprite: TilingSprite, _accepted: boolean = true) {
		if(!this.roadCanBePlaced(position)) {
			return;
		}
		let direction = this.calculateRoadConnections(position, true);
		this.blocked[position.y][position.x] = true;
		this.updateRoadsDirection(position);
		this.roads[position.y][position.x] = new Road(sprite, position, direction);
		this.calculateSpawn(position);
	}

	calculateRoadConnections(position: Position, canBePlaced: boolean): number {
		let direction = 0b0000;
		if(!canBePlaced) {
			return direction
		}
		if(position.y - 1 >=0 && this.roads[position.y-1][position.x]) {
			direction ^= 0b1000;
		}
		if(position.y + 1 < this.roads.length && this.roads[position.y+1][position.x]) {
			direction ^= 0b0010;
		}
		if(position.x - 1 >=0 && this.roads[position.y][position.x-1]) {
			direction ^= 0b0001;
		}
		if(position.x + 1 < this.roads[0].length && this.roads[position.y][position.x+1]) {
			direction ^= 0b0100;
		}
		return direction;
	}

	calculateSpawn(position: Position){
		if(position.y - 1 >=0 && this.buildingMap[position.y-1][position.x]) {
			this.buildingMap[position.y-1][position.x]?.calculateSpawn(this.roads);
		}
		if(position.y + 1 < this.buildingMap.length && this.buildingMap[position.y+1][position.x]) {
			this.buildingMap[position.y+1][position.x]?.calculateSpawn(this.roads);
		}
		if(position.x - 1 >=0 && this.buildingMap[position.y][position.x-1]) {
			this.buildingMap[position.y][position.x-1]?.calculateSpawn(this.roads);
		}
		if(position.x + 1 < this.buildingMap[0].length && this.buildingMap[position.y][position.x+1]) {
			this.buildingMap[position.y][position.x+1]?.calculateSpawn(this.roads);
		}
	}

	renderRoads(ctx: CanvasRenderingContext2D) {
		ctx.save();
		ctx.translate(this.canvasSize.width / 2, this.canvasSize.height / 2 - (this.tileSize.height/2));
		for (let y = 0; y < this.roads.length; y++) {
			for (let x = 0; x < this.roads[y].length; x++) {
				const screenPos = this.isoToScreen({x: x, y: y});
				if(!this.isTileInView(screenPos)) {
					continue;
				}
				const road = this.roads[y][x];
				if(road) {
					if(this.mode.action == "delete" && y == this.isoPlayerMouse.y && x == this.isoPlayerMouse.x) {
						ctx.save();
						ctx.filter = "url('./img//red-filter.svg#red')";
						this.drawRoad(ctx, {x: x, y: y}, road);
						ctx.restore();
					} else {
						this.drawRoad(ctx, {x: x, y: y}, road);
					}
				}
			}
		}
		ctx.restore();
	}

	drawRoad(ctx: CanvasRenderingContext2D, position: Position, road: Road) {
		let pos = this.isoToScreen(position);
		ctx.drawImage(road.sprite, pos.x-road.sprites.size.width/2, pos.y-road.sprites.size.height+this.tileSize.height, road.sprites.size.width, road.sprites.size.height);
	}


	finalizeBuildingPlacement(position: Position) {
		let created = this.buildingMap[position.y][position.x];
		if(created) {
			created.accepted = true;
		}
	}

	canBePlaced(position: Position, sprite: BuildingSprite): boolean {
		if (this.tooCostly) {
			return false;
		}
		const x = position.x;
		const lowX = x - sprite.baseSize;
		const y = position.y;
		const lowY = y - sprite.baseSize;
		if(lowY+1 < 0 || lowX+1 < 0) {
			return false;
		}
		if(x >= this.blocked[0].length || y >= this.blocked.length) {
			return false;
		}
		for(let i = x; i > lowX; i--) {
			for(let j = y; j > lowY; j--) {
				if(this.blocked[j][i]) {
					return false;
				}
			}
		}
		return true;
	}

	roadCanBePlaced(position: Position): boolean {
		if (this.tooCostly) {
			return false;
		}
		const x = position.x;
		const y = position.y;
		if(x >= this.blocked[0].length || y >= this.blocked.length) {
			return false;
		}
		if(x < 0 || y < 0) {
			return false;
		}
		return !this.blocked[y][x];
	}

	sortBuildings() {
		this.buildings.sort((a, b) => {
			// sort by diagonal of a center
			const centerA = [Math.floor((a.position.x + a.position.x - a.sprite.baseSize + 1)/2), Math.floor((a.position.y + a.position.y - a.sprite.baseSize + 1)/2)]
			const centerB = [Math.floor((b.position.x + b.position.x - b.sprite.baseSize + 1)/2), Math.floor((b.position.y + b.position.y - b.sprite.baseSize + 1)/2)]
			const sum =  (centerA[0] + centerA[1]) - (centerB[0] + centerB[1]);
			return sum;
		});
	}

	getDiagonal(position: Position, sprite?: BuildingSprite): number {
		if (!sprite) {
			return -1;
		}

		const centerA = [Math.floor((position.x + position.x - sprite.baseSize + 1)/2), Math.floor((position.y + position.y - sprite.baseSize + 1)/2)]
		return (centerA[0] + centerA[1]);
	}

	deleteBuilding(position: Position) {
		const building = this.buildingMap[position.y][position.x];
		if(!building) {
			return;
		}
		for(let i = building.position.x; i > building.position.x-building.sprite.baseSize; i--) {
			for(let j = building.position.y; j > building.position.y-building.sprite.baseSize; j--) {
				this.blocked[j][i] = false;
				this.blockedMovement[j][i] = false;
				this.buildingMap[j][i] = undefined;
			}
		}
		this.buildings = this.buildings.filter((b) => b.position.x != building.position.x || b.position.y != building.position.y);
	}

	deleteRoad(position: Position) {
		const road = this.roads[position.y][position.x];
		if(!road) {
			return;
		}
		this.blocked[position.y][position.x] = false;
		this.roads[position.y][position.x] = undefined;
		this.updateRoadsDirection(position);
		this.calculateSpawn(position);
	}

	updateRoadsDirection(position: Position) {
		if(position.y - 1 >=0 && this.roads[position.y-1][position.x]) {
			this.roads[position.y-1][position.x]!.xorDir(0b0010);
		}
		if(position.y + 1 < this.roads.length && this.roads[position.y+1][position.x]) {
			this.roads[position.y+1][position.x]!.xorDir(0b1000);
		}
		if(position.x - 1 >=0 && this.roads[position.y][position.x-1]) {
			this.roads[position.y][position.x-1]!.xorDir(0b0100);
		}
		if(position.x + 1 < this.roads[0].length && this.roads[position.y][position.x+1]) {
			this.roads[position.y][position.x+1]!.xorDir(0b0001);
		}
	}

	isBuildingInView(building: Building, screenPosition: Position): boolean {
		const left = screenPosition.x - building.sprite.size.width/2; 
		const rightScreenEnd = (this.canvasSize.width / 2);
		if(left >= rightScreenEnd) {
			return false;
		}
		const right = screenPosition.x + building.sprite.size.width/2; 
		const leftScreenEnd = -(this.canvasSize.width / 2);
		if(right <= leftScreenEnd) {
			return false
		}
		const top = screenPosition.y - building.sprite.size.height + this.tileSize.height; 
		const bottomScreenEnd = this.canvasSize.height / 2 + (this.tileSize.height/2);
		if(top >= bottomScreenEnd) {
			return false;
		}
		const bottom = screenPosition.y + this.tileSize.height; 
		const topScreenEnd = -(this.canvasSize.height / 2) + (this.tileSize.height/2);
		if(bottom <= topScreenEnd) {
			return false;
		}
		return true;
	}

	isTileInView(screenPosition: Position): boolean {
		const left = screenPosition.x - this.tileSize.width/2; 
		const rightScreenEnd = (this.canvasSize.width / 2);
		if(left >= rightScreenEnd) {
			return false;
		}
		const right = screenPosition.x + this.tileSize.width/2; 
		const leftScreenEnd = -(this.canvasSize.width / 2);
		if(right <= leftScreenEnd) {
			return false
		}
		const top = screenPosition.y - this.tileSize.height; 
		const bottomScreenEnd = this.canvasSize.height / 2 + (this.tileSize.height/2);
		if(top >= bottomScreenEnd) {
			return false;
		}
		const bottom = screenPosition.y; 
		const topScreenEnd = -(this.canvasSize.height / 2);
		if(bottom <= topScreenEnd) {
			return false;
		}
		return true;
	}

	isTileOnMap(isoPosition: Position): boolean {
		const height = this.map.length;
		if (isoPosition.x >= height ||  isoPosition.x < 0) {
			return false;
		}
		const width = this.map[0].length;
		if (isoPosition.y >= width || isoPosition.y < 0) {
			return false;
		}

		return true;
	}

	renderBuildings(ctx: CanvasRenderingContext2D, pedestrians: Actor[]) {
		const sprite = this.mode?.action == "build" ? this.mode.prototype.sprite : undefined;
		const ghostCanBePlaced = sprite ? this.canBePlaced(this.isoPlayerMouse, sprite) : false;
		ctx.save();
		ctx.translate(this.canvasSize.width / 2, this.canvasSize.height / 2 - (this.tileSize.height/2));
		let ghostDrawn = false;
		const ghostDiagonal = this.getDiagonal(this.isoPlayerMouse, sprite);
		let currentDiagonal = 0;
		let pedestrianIndex = 0;
		for (const building of this.buildings) {
			if(currentDiagonal != building.diagonal) {
				currentDiagonal = building.diagonal;
				for(let i = pedestrianIndex; i<pedestrians.length && pedestrians[i].diagonal < currentDiagonal; i++) {
					this.drawPedestrian(ctx, pedestrians[i]);
					pedestrianIndex++;
				}
			}
			const screenPosition = this.isoToScreen(building.position);
			const inView = this.isBuildingInView(building, screenPosition);
			if (!inView) {
				continue;
			};

			if(!ghostDrawn && ghostCanBePlaced && ghostDiagonal <= building.diagonal) {
				this.drawGhost(ctx);
				ghostDrawn = true;
			}
			if(this.mode.action != "build" && building.underCursor) {
				ctx.save();
				ctx.filter = this.mode.action == "delete" ? "url('./img//red-filter.svg#red')" : "grayscale(40%)";
				this.drawBuilding(ctx, building.position, building.sprite);
				ctx.restore();
			} else if(building.accepted) {
				this.drawBuilding(ctx, building.position, building.sprite);
			} else {
				ctx.save();
				ctx.filter = "grayscale(80%)"; 
				this.drawBuilding(ctx, building.position, building.sprite);
				ctx.restore();
			}
		}

		for(let i = pedestrianIndex; i<pedestrians.length; i++) {
			this.drawPedestrian(ctx, pedestrians[i]);
		}

		if(this.mode.action == "build" && !ghostDrawn) {
			this.drawGhost(ctx, !ghostCanBePlaced);
		}

		const roadGhostCanBePlaced = this.mode.action == "buildRoad" ? this.roadCanBePlaced(this.isoPlayerMouse) : false; 
		if(this.mode.action == "buildRoad") {
			ctx.save();
			ctx.filter = roadGhostCanBePlaced ? "grayscale(90%)" : "url('./img//red-filter.svg#red') opacity(0.75)";
			ctx.globalAlpha = 0.75;
			const dir = this.calculateRoadConnections(this.isoPlayerMouse, roadGhostCanBePlaced);
			const ghost = new Road(this.mode.sprite, this.isoPlayerMouse, dir);
			this.drawRoad(ctx, this.isoPlayerMouse, ghost);
			ctx.restore();
		}
		ctx.restore();
	}

	drawGhost(ctx: CanvasRenderingContext2D, red: boolean = false) {
		if (this.mode.action != "build") {
			return;
		}
		ctx.save();
		ctx.filter = red ? "url('./img//red-filter.svg#red') opacity(0.75)" : "grayscale(90%)";
		ctx.globalAlpha = 0.75;
		let pos = this.isoToScreen(this.isoPlayerMouse);
		const sprite = this.mode.prototype.sprite;
		ctx.drawImage(sprite.image, pos.x-sprite.size.width/2, pos.y-sprite.size.height+this.tileSize.height, sprite.size.width, sprite.size.height);
		ctx.restore();
	}

	switchToDeleteMode() {
		this.mode = {action: "delete"};
	}

	switchToNormalMode() {
		this.mode = {action: "none"};
	}

	switchToRoadMode(sprite: TilingSprite) {
		this.mode = {action: "buildRoad", sprite: sprite};
	}

	switchToBuildMode(sprite: BuildingPrototype) {
		this.mode = {action: "build", prototype: sprite};
	}

	updateMousePosition(position: Position) {
		let oldBuilding = this.getBuilding(this.isoPlayerMouse);
		if (oldBuilding) {
			oldBuilding.underCursor = false;
		}

		this.isoPlayerMouse = this.screenToIso(position);
		let newBuilding = this.getBuilding(this.isoPlayerMouse);
		if(newBuilding) {
			newBuilding.underCursor = true;
		}
	}

	drawPedestrian(context: CanvasRenderingContext2D, actor: Actor) {
		const position = this.isoToScreen(actor.position);
		context.drawImage(
			actor.sprite.offscreen, 
			position.x - 10,
			position.y - 15
		);
	}

	isBlocked(position: Position): boolean {
		return this.blocked[position.y][position.x];
	}

	isRoad(position: Position): boolean {
		return this.roads[position.y][position.x] !== undefined;
	}

	isBuilding(position: Position): boolean {
		return this.buildingMap[position.y][position.x] !== undefined;
	}

	isObstacle(position: Position): boolean {
		return this.blockedMovement[position.y][position.x];
	}

	getCost(position: Position): number {
		return this.costs[position.y][position.x];
	}

	path?: PathElem[] = undefined;
	pathCorrect: boolean = false;

	clearPath() {
		this.path = [];
		this.pathCorrect = false;
	}

	drawPath(ctx: CanvasRenderingContext2D) {
		if (!this.path) {
			return;
		}

		ctx.save();
		ctx.translate(this.canvasSize.width / 2, this.canvasSize.height / 2 - (this.tileSize.height/2));
		if (!this.pathCorrect) {
			ctx.filter = "grayscale(80%)"; 
		}
		for (let pos of this.path) {
			const screenPos = this.isoToScreen({x: pos.position.x, y: pos.position.y});
			ctx.drawImage(pos.sprite, screenPos.x-pos.sprites.size.width/2, screenPos.y-pos.sprites.size.height+this.tileSize.height, pos.sprites.size.width, pos.sprites.size.height);
		}
		ctx.restore();
	}

	getBitmapForPath(last: Position, current: Position): number[] {
		if (last.x == current.x) {
			if (last.y == current.y - 1) {
				return [0b1000, 0b0010]
			} else {
				return [0b0010, 0b1000]
			}
		} 
		if (last.x == current.x - 1) {
			return [0b0001,  0b0100];
		} else {
			return [0b0100, 0b0001];
		}
	}

	addNeighbour(position: Position, queue: PriorityQueue, end: Position, next: Node, cameFrom: PathMap) {
		const cost = this.getCost(position) + next.dist;
		if (!cameFrom[position.x][position.y]) {
			cameFrom[position.x][position.y] = next.pos;
		}
		queue.enqueue(new Node(position, end, cost));
	}


	dist: Map<number, number> = new Map();
	pred: Map<number, number | undefined> = new Map();

	getDistanceOrDefault(startIndex: number, targetIndex: number): number {
		if (startIndex == targetIndex) return 0;
		const key = this.getDistKey(startIndex, targetIndex);
		const distance = this.dist.get(key);
		if (distance != undefined) return distance;
		return Infinity;
	}
	
	setDistance(startIndex: number, targetIndex: number, value: number) {
		const key = this.getDistKey(startIndex, targetIndex);
		this.dist.set(key, value);
	}

	deleteDistance(startIndex: number, targetIndex: number) {
		const key = this.getDistKey(startIndex, targetIndex);
		this.dist.delete(key);
	}

	getDistKey(startIndex: number, targetIndex: number): number {
		return (startIndex << 16) | targetIndex; // indices < 65536
	}

	printDistMap() {
		const columns = this.roads[0].length;
		function fromIndex(index: number): Position {
			return { y: Math.floor(index / columns), x: index % columns };
		}
		function decodeKey(encodedKey: number) {
			const inNode = encodedKey >> 16;
			const outNode = encodedKey & 0xFFFF;
			return { in: inNode, out: outNode };
		}

		this.dist.forEach((value, encodedKey) => {
			const { in: inIndex, out: outIndex } = decodeKey(encodedKey);
			const inNode = fromIndex(inIndex);
			const outNode = fromIndex(outIndex);
			console.log(`(${inNode.x}, ${inNode.y}) -> (${outNode.x}, ${outNode.y}): ${value}`);
			const predIndex = this.getPredOrDefault(inIndex, outIndex);
			if (predIndex) {
				const pred = fromIndex(predIndex);
				console.log(`(${pred.x}, ${pred.y})`);
			}
		});
	}

	getPredOrDefault(startIndex: number, targetIndex: number): number | undefined {
		const key = this.getDistKey(startIndex, targetIndex);
		return this.pred.get(key);
	}
	
	setPred(startIndex: number, targetIndex: number, value: number | undefined) {
		if (value == undefined) {
			this.deletePred(startIndex, targetIndex);
			return;
		}
		const key = this.getDistKey(startIndex, targetIndex);
		this.pred.set(key, value);
	}

	deletePred(startIndex: number, targetIndex: number) {
		const key = this.getDistKey(startIndex, targetIndex);
		this.pred.delete(key);
	}

	canUseInt32(): boolean {
		const biggestX = this.roads.length - 1;
		const columns = this.roads[0].length;
		const biggestY = columns - 1;

		const biggestIndex = biggestX * columns + biggestY;
		return biggestIndex < 65536;
	}

	floydWarshall(): void {
		const rows = this.roads.length;
		const columns = this.roads[0].length;
		this.dist.clear();
		this.pred.clear();

		if (!this.canUseInt32()) this.logger.warn("Indices too long!");
		// TODO: use strings for keys otherwise (?)

		function toIndex(x: number, y: number) {
			return x * columns + y;
		}

		for (let x = 0; x < rows; x++) {
			for (let y = 0; y < columns; y++) {
				if (this.roads[x][y]) {
					const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
					for (const [dx, dy] of directions) {
						const nx = x + dx;
						const ny = y + dy;
						if (nx >= 0 && nx < rows && ny >= 0 && ny < columns && this.roads[nx][ny]) {
							const u = toIndex(x, y);
							const v = toIndex(nx, ny);
							this.setDistance(v, u, 1);
							this.setPred(v, u, u);
						}
					}
				}
			}
		}
		let roadsToCheck = [];
		for (let x = 0; x < rows; x++) {
			for (let y = 0; y < columns; y++) {
				if (this.roads[x][y]) {
					const u = toIndex(x, y);
					roadsToCheck.push(u);
				}
			}
		}

		for (let k of roadsToCheck) {
			for (let i of roadsToCheck) {
				for (let j of roadsToCheck) {
					this.updateDistanceThrough(j, i, k);
				}
			}
		}
	}

	updateDistanceThrough(from: number, to: number, through: number) {
		const toN = this.getDistanceOrDefault(from, through);
		const fromN = this.getDistanceOrDefault(through, to);
		const oldDistance = this.getDistanceOrDefault(from, to);
		const distanceThroughN = toN + fromN;

		if (distanceThroughN < oldDistance) {
			this.setDistance(from, to, distanceThroughN);
			this.setPred(from, to, this.getPredOrDefault(from, through))
		}
	}

	updateAfterDeletion(pos: Position) {
		const rows = this.roads.length;
		const columns = this.roads[0].length;
		function toIndex(x: number, y: number) {
			return x * columns + y;
		}
		const k = toIndex(pos.y, pos.x); // this is intended; TODO: fix problem with road tables being reversed

		let roadsToCheck = [];
		for (let x = 0; x < rows; x++) {
			for (let y = 0; y < columns; y++) {
				if (this.roads[x][y]) {
					const u = toIndex(x, y);
					roadsToCheck.push(u);
				}
			}
		}
		roadsToCheck.push(k);
		let roadsToUpdate = [];

		for (let u of roadsToCheck) {
			for (let v of roadsToCheck) {
				if (u === k || v === k) {
					this.deleteDistance(v, u); // no path through deleted node
					this.deletePred(v, u);
					this.logger.debug(`invalidated path (${u}, ${v})`);
					continue;
				} 

				const distFromVToK = this.getDistanceOrDefault(v, k);
				const distFromKToU = this.getDistanceOrDefault(k, u);
				const distanceThroughK = distFromVToK + distFromKToU;

				const distFromVToU = this.getDistanceOrDefault(v, u);
				if (distFromVToU === distanceThroughK) {
					roadsToUpdate.push([u,v]);
					this.deleteDistance(v, u);
					this.deletePred(v, u);
				}
			}
		}

		roadsToCheck.pop();
		for (let road of roadsToUpdate) {
			let [u, v] = road;
			this.logger.debug(`recomputing path (${u}, ${v})`); // debug
			for (let w of roadsToCheck) {
				this.updateDistanceThrough(v, u, w);
			}
		}
	}

	updateAfterAddition(pos: Position) {
		const rows = this.roads.length;
		const columns = this.roads[0].length;
		function toIndex(x: number, y: number) {
			return x * columns + y;
		}
		const k = toIndex(pos.y, pos.x); // this is intended; TODO: fix problem with road tables being reversed

		let roadsToCheck = [];
		for (let x = 0; x < rows; x++) {
			for (let y = 0; y < columns; y++) {
				if (this.roads[x][y]) {
					const u = toIndex(x, y);
					roadsToCheck.push(u);
				}
			}
		}

		const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
		for (const [dx, dy] of directions) {
			const nx = pos.y + dx;
			const ny = pos.x + dy;
			if (nx >= 0 && nx < rows && ny >= 0 && ny < columns && this.roads[nx][ny]) {
				const u = k;
				const v = toIndex(nx, ny);
				this.setDistance(v, u, 1);
				this.setPred(v, u, u);
				this.setDistance(u, v, 1);
				this.setPred(u, v, v);
			}
		}

		for (let u of roadsToCheck) {
			for (let v of roadsToCheck) {
				this.updateDistanceThrough(v, u, k);
				this.updateDistanceThrough(v, k, u);
				this.updateDistanceThrough(k, u, v);
			}
		}
	}


	getNextStep(start: Position, target: Position): Position | undefined {
		const columns = this.roads[0].length;
		function toIndex(x: number, y: number) {
			return y * columns + x;
		}
		function fromIndex(index: number): Position {
			return { y: Math.floor(index / columns), x: index % columns };
		}
		const startIndex = toIndex(start.x, start.y);
		const targetIndex = toIndex(target.x, target.y);
		const step = this.getPredOrDefault(startIndex, targetIndex); //this.pred[targetIndex][startIndex];
		if (!step) return undefined;
		return fromIndex(step);
	}

	getDistance(start: Position, target: Position): number {
		const columns = this.roads[0].length;
		function toIndex(x: number, y: number) {
			return y * columns + x;
		}
		const startIndex = toIndex(start.x, start.y);
		const targetIndex = toIndex(target.x, target.y);

		return this.getDistanceOrDefault(startIndex, targetIndex);
		// return this.dist[targetIndex][startIndex];
	}

	shortestMigrantPath(start: Position, building: Building): Position[] {
		const end = building.workerSpawn;
		if (!end) {
			return [];
		}
		const height = this.map.length;
		const width = this.map[0].length;
		if(height == 1 && width == 1) {
			return []
		}
		let visited: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));
		let cameFrom: PathMap = Array(height).fill(null).map(() => Array(width).fill(undefined));

		let queue = new PriorityQueue();
		queue.enqueue(new Node(start, end, 0));
		while(!queue.isEmpty()) {
			const next = queue.dequeue();
			if(!next) {
				break;
			}

			const alreadyVisited = visited[next.pos.y][next.pos.x];
			if(alreadyVisited) {
				continue;
			}
			visited[next.pos.y][next.pos.x] = true;
			if(this.isObstacle(next.pos)) {
				continue;
			}
			if(next.equals(end)) {
				return this.reconstructMigrantPath(cameFrom, end, start);
			}
			this.addNeighboursToQueueWithDiagonals(queue, end, next, cameFrom);
		}
		return [];
	}

	reconstructMigrantPath(cameFrom: PathMap, end: Position, start: Position): Position[] {
		let path = [];
		let current: Position | undefined = end;
		let last: Position | undefined = undefined;
		while (current) {
			path.push(current);
			let from = 0;
			let to = 0;
			if (last) {
				[from, to] = this.getBitmapForPath(last, current);
			}
			if (current.x == start.x && current.y == start.y)  {
				break;
			}
			last = current;
			current = cameFrom[current.x][current.y];
		}
		return path.reverse();
	}

	addNeighboursToQueueWithDiagonals(queue: PriorityQueue, end: Position, next: Node, cameFrom: PathMap) {
		const height = this.map.length;
		const width = this.map[0].length;
		if(next.pos.x-1 >= 0) {
			const position: Position = next.step(-1, 0);
			this.addNeighbour(position, queue, end, next, cameFrom);
		}
		if(next.pos.x+1 < width) {
			const position: Position = next.step(1, 0);
			this.addNeighbour(position, queue, end, next, cameFrom);
		}
		if(next.pos.y-1 >= 0) {
			const position: Position = next.step(0, -1);
			this.addNeighbour(position, queue, end, next, cameFrom);
		}
		if(next.pos.y+1 < height) {
			const position: Position = next.step(0, 1);
			this.addNeighbour(position, queue, end, next, cameFrom);
		}
		if (next.pos.x-1 >= 0 && next.pos.y-1 >= 0) {
			const position: Position = next.step(-1, -1);
			this.addNeighbourDiagonal(position, queue, end, next, cameFrom);
		}
		if (next.pos.x-1 >= 0 && next.pos.y+1 < height) {
			const position: Position = next.step(-1, 1);
			this.addNeighbourDiagonal(position, queue, end, next, cameFrom);
		}
		if (next.pos.x+1 < width && next.pos.y-1 >= 0) {
			const position: Position = next.step(1, -1);
			this.addNeighbourDiagonal(position, queue, end, next, cameFrom);
		}
		if (next.pos.x+1 < width && next.pos.y+1 < height) {
			const position: Position = next.step(1, 1);
			this.addNeighbourDiagonal(position, queue, end, next, cameFrom);
		}
	}

	addNeighbourDiagonal(position: Position, queue: PriorityQueue, end: Position, next: Node, cameFrom: PathMap) {
		const cost = this.getCost(position)*Math.sqrt(2) + next.dist;
		if (!cameFrom[position.x][position.y]) {
			cameFrom[position.x][position.y] = next.pos;
		}
		queue.enqueue(new Node(position, end, cost));
	}

	getEmptyHouses(): House[] {
		return this.buildings
		.filter(x => x instanceof House)
		.filter(x => x.workforce == "normal")
		.filter(x => x.population < x.maxPopulation);
	}

	getEmptyHeroHouses(): House[] {
		return this.buildings
		.filter(x => x instanceof House)
		.filter(x => x.workforce == "warrior")
		.filter(x => x.constructed)
		.filter(x => x.hero != undefined)
		.filter(x => x.population < x.maxPopulation);
	}
	
	getHousesOfType(type: string, minLevel: number = 0): House[] {
		return this.buildings
		.filter(x => x instanceof House)
		.filter(x => x.name == type)
		.filter(x => x.level >= minLevel);
	}

	getBuildingsOfType(type: string, minLevel: number = 0): Building[] {
		return this.buildings
		.filter(x => x.name == type)
		.filter(x => x.level >= minLevel);
	}

	getStorages(): Storage[] {
		return this.buildings
		.filter(x => x instanceof Storage);
	}

	getColor(position: Position): string {
		return this.map[position.y][position.x];
	}

	setColor(position: Position, color: string) {
		this.map[position.y][position.x] = color;
	}

	getTaxicabDistance(pos1: Position, pos2: Position): number {
		return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y)
	}
}

type PathMap = (Position | undefined)[][];

class PathElem {
	sprites: TilingSprite;
	sprite: HTMLImageElement;
	position: Position;
	direction: number;

	constructor(sprite: TilingSprite, position: Position) {
		this.direction = 0;
		this.sprites = sprite;
		this.sprite =  sprite.sprites[this.direction];
		this.position = position;
	}

	xorDir(dir: number) {
		this.direction ^= dir;
		this.sprite = this.sprites.sprites[this.direction];
	}
}

class Node {
	pos: Position;
	dist: number;
	expected: number;

	constructor(pos: Position, target: Position, dist: number) {
		this.dist = dist;
		this.pos = pos;
		this.expected = Math.abs(target.x - this.pos.x) + Math.abs(target.y - this.pos.y) + dist;
	}

	step(deltaX: number, deltaY: number): Position {
		return {
			x: this.pos.x + deltaX,
			y: this.pos.y + deltaY,
		}
	}

	equals(position: Position) {
		return this.pos.x == position.x && this.pos.y == position.y;
	}

}

// TODO: better implementation
class PriorityQueue {
	queue: Node[];

	constructor() {
		this.queue = [];
	}

	enqueue(element: Node) {
		this.queue.push(element);
		this.queue.sort((a, b) => a.expected - b.expected);
	}

	dequeue() {
		return this.queue.shift();
	}

	peek() {
		return this.queue[0];
	}

	isEmpty() {
		return this.queue.length === 0;
	}
}

export interface Size {
	width: number,
	height: number,
}

export interface Position {
	x: number,
	y: number,
}

export interface BuildMode {
	action: "build";
	prototype: BuildingPrototype;
}

export interface RoadMode {
	action: "buildRoad";
	sprite: TilingSprite;
}

export interface DeleteMode {
	action: "delete";
}

export interface NoneMode {
	action: "none";
}

export type Mode = BuildMode | RoadMode | DeleteMode | NoneMode;

export interface Pair {
	in: number,
	out: number,
}

