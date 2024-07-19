import { Building, BuildingSprite, Road, TilingSprite } from "./buildings.js";

export class MapLayer {
	defTileWidth: number = 64;
	defTileHeight: number = 32;
	scale: number = 1.0;
	tileWidth: number = this.defTileWidth*this.scale;
	tileHeight: number = this.defTileHeight*this.scale;

	positionOffset: Position = {x: 0, y: 0}
	canvasSize: Size = {width: 0, height: 0};

	isoPlayerMouse: Position = {x: -1, y: -1};
	isDragging: boolean = false;
	dragStart: Position = {x: 0, y: 0};
	mode: BuildingSprite | undefined = undefined;
	deleteMode: boolean = false;
	roadMode: TilingSprite | undefined = undefined;

	map = [ 
		['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
		['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
		['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
		['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
		['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
		['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
		['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
		['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
		['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
		['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
		['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
		['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
		['#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106', '#97b106'],
	];

	constructor(canvasSize: Size) {
		this.canvasSize.height = canvasSize.height;
		this.canvasSize.width = canvasSize.width;
	}

	rescale(delta: number) {
		this.scale += delta;
		if(this.scale < 0.5) {
			this.scale = 0.5;
		}
		if(this.scale > 2.0) {
			this.scale = 2.0;
		}
		this.tileWidth = this.scale * this.defTileWidth;
		this.tileHeight = this.scale * this.defTileHeight;
	}

	renderMap(context: CanvasRenderingContext2D, _deltaTime: number) {
		this.drawIsometricMap(context);
		this.renderRoads(context);
		this.renderBuildings(context);
	}

	isoToScreen(pos: Position): Position {
		const screenX = (pos.x - pos.y) * (this.tileWidth / 2) - this.positionOffset.x;
		const screenY = (pos.x + pos.y) * (this.tileHeight / 2) - this.positionOffset.y;
		return { x: screenX, y: screenY };
	}

	screenToIso(pos: Position): Position {
		const x = pos.x - (this.canvasSize.width / 2) + this.positionOffset.x;
		const y = pos.y - (this.canvasSize.height / 2 - (this.tileHeight/2)) + this.positionOffset.y;
		const isoX = x/this.tileWidth + y/this.tileHeight;
		const isoY = y/this.tileHeight - x/this.tileWidth;
		return { x: Math.floor(isoX), y: Math.floor(isoY) };
	}

	drawIsometricMap(ctx: CanvasRenderingContext2D) {
		ctx.save();
		ctx.translate(this.canvasSize.width / 2, this.canvasSize.height / 2 - (this.tileHeight/2));
		for (let y = 0; y < this.map.length; y++) {
			for (let x = 0; x < this.map[y].length; x++) {
				let color = this.map[y][x];
				if(!this.mode && x == this.isoPlayerMouse.x && y == this.isoPlayerMouse.y) {
					color = this.deleteMode ? '#FF5733' : "black";
				}
				const screenPos = this.isoToScreen({x: x, y: y});
				this.drawTile(ctx, screenPos.x, screenPos.y, color);
			}
		}
		ctx.restore();
	}

	drawTile(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + this.tileWidth / 2, y + this.tileHeight / 2);
		ctx.lineTo(x, y + this.tileHeight);
		ctx.lineTo(x - this.tileWidth / 2, y + this.tileHeight / 2);
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.fill();
	}


	drawBuilding(ctx: CanvasRenderingContext2D, position: Position, building: BuildingSprite) {
		let pos = this.isoToScreen(position);
		ctx.drawImage(building.image, pos.x-building.size.width/2, pos.y-building.size.height+this.tileHeight, building.size.width, building.size.height);
	}


	buildingMap: (Building | undefined)[][] = this.map.map(row => row.map(() => undefined)); // for quicker lookup
	buildings: Building[] = [];
	blocked: boolean[][] = this.map.map(row => row.map(() => false));
	roads: (Road | undefined)[][] = this.map.map(row => row.map(() => undefined)); // for quicker lookup

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

	putBuilding(position: Position, sprite: BuildingSprite, accepted: boolean = true) {
		if(this.canBePlaced(position, sprite)) {
			const newBuilding = new Building(sprite, position, accepted);
			this.buildings.push(newBuilding);
			this.sortBuildings();
			for(let i = position.x; i > position.x-sprite.baseSize; i--) {
				for(let j = position.y; j > position.y-sprite.baseSize; j--) {
					this.blocked[j][i] = true;
					this.buildingMap[j][i] = newBuilding;
				}
			}
		}
	}

	putRoad(position: Position, sprite: TilingSprite, _accepted: boolean = true) {
		if(!this.roadCanBePlaced(position)) {
			return;
		}
		let direction = this.calculateRoadConnections(position, true);
		this.blocked[position.y][position.x] = true;
		this.updateRoadsDirection(position);
		this.roads[position.y][position.x] = new Road(sprite, position, direction);
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

	renderRoads(ctx: CanvasRenderingContext2D) {
		ctx.save();
		ctx.translate(this.canvasSize.width / 2, this.canvasSize.height / 2 - (this.tileHeight/2));
		for (let y = 0; y < this.roads.length; y++) {
			for (let x = 0; x < this.roads[y].length; x++) {
				const road = this.roads[y][x];
				if(road) {
					if(this.deleteMode && y == this.isoPlayerMouse.y && x == this.isoPlayerMouse.x) {
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
		ctx.drawImage(road.sprite, pos.x-road.sprites.size.width/2, pos.y-road.sprites.size.height+this.tileHeight, road.sprites.size.width, road.sprites.size.height);
	}


	finalizeBuildingPlacement(position: Position) {
		let created = this.buildingMap[position.y][position.x];
		if(created) {
			created.accepted = true;
		}
	}

	canBePlaced(position: Position, sprite: BuildingSprite): boolean {
		const x = position.x;
		const lowX = x - sprite.baseSize;
		const y = position.y;
		const lowY = y - sprite.baseSize;
		if(lowY+1 < 0 || lowX+1 < 0) {
			console.log("Cannot build");
			return false;
		}
		if(x >= this.blocked[0].length || y >= this.blocked.length) {
			console.log("Cannot build");
			return false;
		}
		for(let i = x; i > lowX; i--) {
			for(let j = y; j > lowY; j--) {
				if(this.blocked[j][i]) {
					console.log("Cannot build");
					return false;
				}
			}
		}
		return true;
	}

	roadCanBePlaced(position: Position): boolean {
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
		const top = screenPosition.y - building.sprite.size.height + this.tileHeight; 
		const bottomScreenEnd = this.canvasSize.height / 2 + (this.tileHeight/2);
		if(top >= bottomScreenEnd) {
			return false;
		}
		const bottom = screenPosition.y + this.tileHeight; 
		const topScreenEnd = -(this.canvasSize.height / 2) + (this.tileHeight/2) + 50 + this.tileHeight;
		if(bottom <= topScreenEnd) {
			return false;
		}
		return true;
	}

	renderBuildings(ctx: CanvasRenderingContext2D) {
		const ghostCanBePlaced = this.mode ? this.canBePlaced(this.isoPlayerMouse, this.mode) : false;
		ctx.save();
		ctx.translate(this.canvasSize.width / 2, this.canvasSize.height / 2 - (this.tileHeight/2));
		let ghostDrawn = false;
		const ghostDiagonal = this.getDiagonal(this.isoPlayerMouse, this.mode);
		for (const building of this.buildings) {
			const screenPosition = this.isoToScreen(building.position);
			const inView = this.isBuildingInView(building, screenPosition);
			if (!inView) {
				continue;
			};

			if(!ghostDrawn && ghostCanBePlaced && ghostDiagonal <= building.diagonal) {
				this.drawGhost(ctx);
				ghostDrawn = true;
			}
			if(this.mode == undefined && building.underCursor) {
				ctx.save();
				ctx.filter = this.deleteMode ? "url('./img//red-filter.svg#red')" : "grayscale(40%)";
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
		if(this.mode && !ghostDrawn) {
			this.drawGhost(ctx, !ghostCanBePlaced);
		}

		const roadGhostCanBePlaced = this.roadMode ? this.roadCanBePlaced(this.isoPlayerMouse) : false; 
		if(this.roadMode) {
			ctx.save();
			ctx.filter = roadGhostCanBePlaced ? "grayscale(90%)" : "url('./img//red-filter.svg#red') opacity(0.75)";
			ctx.globalAlpha = 0.75;
			const dir = this.calculateRoadConnections(this.isoPlayerMouse, roadGhostCanBePlaced);
			const ghost = new Road(this.roadMode, this.isoPlayerMouse, dir);
			this.drawRoad(ctx, this.isoPlayerMouse, ghost);
			ctx.restore();
		}
		ctx.restore();
	}

	drawGhost(ctx: CanvasRenderingContext2D, red: boolean = false) {
		if (!this.mode) {
			return;
		}
		ctx.save();
		ctx.filter = red ? "url('./img//red-filter.svg#red') opacity(0.75)" : "grayscale(90%)";
		ctx.globalAlpha = 0.75;
		let pos = this.isoToScreen(this.isoPlayerMouse);
		ctx.drawImage(this.mode.image, pos.x-this.mode.size.width/2, pos.y-this.mode.size.height+this.tileHeight, this.mode.size.width, this.mode.size.height);
		ctx.restore();
	}

	switchToDeleteMode() {
		this.deleteMode = true;
		this.roadMode = undefined;
		this.mode = undefined;
	}

	switchToNormalMode() {
		this.deleteMode = false;
		this.roadMode = undefined;
		this.mode = undefined;
	}

	switchToRoadMode(sprite: TilingSprite) {
		this.deleteMode = false;
		this.roadMode = sprite;
		this.mode = undefined;
	}

	switchToBuildMode(sprite: BuildingSprite) {
		this.deleteMode = false;
		this.roadMode = undefined;
		this.mode = sprite;
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
}

export interface Size {
	width: number,
	height: number,
}

export interface Position {
	x: number,
	y: number,
}
