import { getLogger, Logger } from "../logger.js";
import { MapLayer, Position } from "../map-layer.js";

export class WorkforcePathfinder {
	map: MapLayer;
	logger: Logger = getLogger("WorkforcePathfinder");
	dist: Map<number, number> = new Map();
	pred: Map<number, number | undefined> = new Map();

	constructor(map: MapLayer) {
		this.map = map;
	}

	private getDistanceOrDefault(startIndex: number, targetIndex: number): number {
		if (startIndex == targetIndex) return 0;
		const key = this.getDistKey(startIndex, targetIndex);
		const distance = this.dist.get(key);
		if (distance != undefined) return distance;
		return Infinity;
	}
	
	private setDistance(startIndex: number, targetIndex: number, value: number) {
		const key = this.getDistKey(startIndex, targetIndex);
		this.dist.set(key, value);
	}

	private deleteDistance(startIndex: number, targetIndex: number) {
		const key = this.getDistKey(startIndex, targetIndex);
		this.dist.delete(key);
	}

	private getDistKey(startIndex: number, targetIndex: number): number {
		return (startIndex << 16) | targetIndex; // indices < 65536
	}

	printDistMap() {
		const columns = this.map.roads[0].length;
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

	private getPredOrDefault(startIndex: number, targetIndex: number): number | undefined {
		const key = this.getDistKey(startIndex, targetIndex);
		return this.pred.get(key);
	}
	
	private setPred(startIndex: number, targetIndex: number, value: number | undefined) {
		if (value == undefined) {
			this.deletePred(startIndex, targetIndex);
			return;
		}
		const key = this.getDistKey(startIndex, targetIndex);
		this.pred.set(key, value);
	}

	private deletePred(startIndex: number, targetIndex: number) {
		const key = this.getDistKey(startIndex, targetIndex);
		this.pred.delete(key);
	}

	private canUseInt32(): boolean {
		const biggestX = this.map.roads.length - 1;
		const columns = this.map.roads[0].length;
		const biggestY = columns - 1;

		const biggestIndex = biggestX * columns + biggestY;
		return biggestIndex < 65536;
	}

	floydWarshall(): void {
		const rows = this.map.roads.length;
		const columns = this.map.roads[0].length;
		this.dist.clear();
		this.pred.clear();

		if (!this.canUseInt32()) this.logger.warn("Indices too long!");
		// TODO: use strings for keys otherwise (?)

		function toIndex(x: number, y: number) {
			return x * columns + y;
		}

		for (let x = 0; x < rows; x++) {
			for (let y = 0; y < columns; y++) {
				if (this.map.roads[x][y]) {
					const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
					for (const [dx, dy] of directions) {
						const nx = x + dx;
						const ny = y + dy;
						if (nx >= 0 && nx < rows && ny >= 0 && ny < columns && this.map.roads[nx][ny]) {
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
				if (this.map.roads[x][y]) {
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
		const rows = this.map.roads.length;
		const columns = this.map.roads[0].length;
		function toIndex(x: number, y: number) {
			return x * columns + y;
		}
		const k = toIndex(pos.y, pos.x); // this is intended; TODO: fix problem with road tables being reversed

		let roadsToCheck = [];
		for (let x = 0; x < rows; x++) {
			for (let y = 0; y < columns; y++) {
				if (this.map.roads[x][y]) {
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
		const rows = this.map.roads.length;
		const columns = this.map.roads[0].length;
		function toIndex(x: number, y: number) {
			return x * columns + y;
		}
		const k = toIndex(pos.y, pos.x); // this is intended; TODO: fix problem with road tables being reversed

		let roadsToCheck = [];
		for (let x = 0; x < rows; x++) {
			for (let y = 0; y < columns; y++) {
				if (this.map.roads[x][y]) {
					const u = toIndex(x, y);
					roadsToCheck.push(u);
				}
			}
		}

		const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
		for (const [dx, dy] of directions) {
			const nx = pos.y + dx;
			const ny = pos.x + dy;
			if (nx >= 0 && nx < rows && ny >= 0 && ny < columns && this.map.roads[nx][ny]) {
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
		const columns = this.map.roads[0].length;
		function toIndex(x: number, y: number) {
			return y * columns + x;
		}
		function fromIndex(index: number): Position {
			return { y: Math.floor(index / columns), x: index % columns };
		}
		const startIndex = toIndex(start.x, start.y);
		const targetIndex = toIndex(target.x, target.y);
		const step = this.getPredOrDefault(startIndex, targetIndex);
		if (!step) return undefined;
		return fromIndex(step);
	}

	getDistance(start: Position, target: Position): number {
		const columns = this.map.roads[0].length;
		function toIndex(x: number, y: number) {
			return y * columns + x;
		}
		const startIndex = toIndex(start.x, start.y);
		const targetIndex = toIndex(target.x, target.y);

		return this.getDistanceOrDefault(startIndex, targetIndex);
	}
}
