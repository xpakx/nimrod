import { Building, TilingSprite } from "../building/buildings.js";
import { MapLayer, Position } from "../map-layer.js";

type PathMap = (Position | undefined)[][];

export class MigrantPathfinder {
	map: MapLayer;

	constructor(map: MapLayer) {
		this.map = map;
	}

	shortestPath(start: Position, building: Building): Position[] {
		const end = building.workerSpawn;
		if (!end) {
			return [];
		}
		const height = this.map.getHeight();
		const width = this.map.getWidth();
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
			if(this.map.isObstacle(next.pos)) {
				continue;
			}
			if(next.equals(end)) {
				return this.reconstructMigrantPath(cameFrom, end, start);
			}
			this.addNeighboursToQueueWithDiagonals(queue, end, next, cameFrom);
		}
		return [];
	}

	private getBitmapForPath(last: Position, current: Position): number[] {
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
		const height = this.map.getHeight();
		const width = this.map.getWidth();
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
		const cost = this.map.getCost(position)*Math.sqrt(2) + next.dist;
		if (!cameFrom[position.x][position.y]) {
			cameFrom[position.x][position.y] = next.pos;
		}
		queue.enqueue(new Node(position, end, cost));
	}

	addNeighbour(position: Position, queue: PriorityQueue, end: Position, next: Node, cameFrom: PathMap) {
		const cost = this.map.getCost(position) + next.dist;
		if (!cameFrom[position.x][position.y]) {
			cameFrom[position.x][position.y] = next.pos;
		}
		queue.enqueue(new Node(position, end, cost));
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
