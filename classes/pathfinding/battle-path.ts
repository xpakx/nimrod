import { MapLayer, Position } from "../map-layer.js";

type PathMap = (Position | undefined)[][];

export class BattlePathfinder {
	map: MapLayer;

	constructor(map: MapLayer) {
		this.map = map;
	}

	shortestPath(start: Position, end: Position): number {
		const height = this.map.map.length;
		const width = this.map.map[0].length;
		if(height == 1 && width == 1) {
			return 0
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
				// map.reconstructPath(cameFrom, end, start, arrow);
				return next.dist;
			}
			this.addNeighboursToQueue(queue, end, next, cameFrom);
		}
		return -1;
	}

	addNeighboursToQueue(queue: PriorityQueue, end: Position, next: Node, cameFrom: PathMap) {
		const height = this.map.map.length;
		const width = this.map.map[0].length;
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
