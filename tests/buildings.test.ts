import { Building, BuildingInterface, BuildingPrototype, BuildingSprite, BuildingWorker, Road, TilingSprite, WorkerOptions } from "../classes/buildings";
import { ActorSprite } from "../classes/actor";
import { MapLayer, Position, Size } from "../classes/map-layer";

let OffscreenCanvasMock = jest.fn().mockImplementation((width: number, height: number) => {
	return {
		height,
		width,
		oncontextlost: jest.fn(),
		oncontextrestored: jest.fn(),
		getContext: jest.fn(() => ({
			clearRect: jest.fn(),
			drawImage: jest.fn(),
			beginPath: jest.fn(), 
			fill: jest.fn(), 
			ellipse: jest.fn(),
		})),
		convertToBlob: jest.fn(),
		transferToImageBitmap: jest.fn(),
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn()
	} as unknown as OffscreenCanvas;
});

beforeEach(() => {
	OffscreenCanvas = OffscreenCanvasMock;
	console.log = () => {};
});

describe('BuildingSprite', () => {
	let imageMock: HTMLImageElement;
	let tileSize: Size;

	beforeEach(() => {
		imageMock = { width: 100, height: 200 } as HTMLImageElement;
		tileSize = { width: 50, height: 50 };
	});
	test('refreshSize should update size and offscreen canvas', () => {
		const buildingSprite = new BuildingSprite(imageMock, 2, tileSize);
		const newTileSize = { width: 60, height: 60 };

		buildingSprite.refreshSize(newTileSize);

		expect(buildingSprite.size.width).toBe(120); // 60 * 2
		expect(buildingSprite.size.height).toBe(240); // (200/100) * 120
		expect(buildingSprite.offscreen.width).toBe(120);
		expect(buildingSprite.offscreen.height).toBe(240);
	});
});

describe('Building', () => {
	let buildingSpriteMock: BuildingSprite;
	let position: Position;
	let prototype: BuildingPrototype;

	beforeEach(() => {
		buildingSpriteMock = new BuildingSprite({ width: 100, height: 200 } as HTMLImageElement, 2, { width: 50, height: 50 });
		position = { x: 1, y: 1 };
		prototype = {
			sprite: buildingSpriteMock,
			interface: new BuildingInterface(),
			name: 'Test Building',
			cost: 100,
		};
	});

	test('should initialize with correct properties', () => {
		const building = new Building(prototype, position);

		expect(building.sprite).toBe(buildingSpriteMock);
		expect(building.position).toEqual(position);
		expect(building.name).toBe('Test Building');
		expect(building.health).toBe(100);
		expect(building.accepted).toBe(true);
	});

	test('applyWorkerOptions should set worker properties correctly', () => {
		const workerOptions: WorkerOptions = {
			sprite: new ActorSprite({ width: 100, height: 200 } as HTMLImageElement, 1, { width: 50, height: 50 }),
			repairing: true,
			resource: 'wood',
			inventory: 100,
			workerStartTime: 5,
		};
		prototype.workerOptions = workerOptions;

		const building = new Building(prototype, position);

		expect(building.worker).toBeDefined();
		expect(building.worker!.repairing).toBe(true);
		expect(building.worker!.resource).toBe('wood');
		expect(building.worker!.inventory).toBe(100);
		expect(building.worker!.workStartTime).toBe(5);
	});

	test('tick should update worker timeSinceLastReturn', () => {
		const building = new Building(prototype, position);
		building.setWorker(new ActorSprite({ width: 100, height: 200 } as HTMLImageElement, 1, { width: 50, height: 50 }));
		building.workerSpawn = { x: 1, y: 1 };

		building.tick(1);

		expect(building.worker!.timeSinceLastReturn).toBe(1);
	});

	test('canSpawnWorker should return true when ready to spawn', () => {
		const building = new Building(prototype, position);
		building.setWorker(new ActorSprite({ width: 100, height: 200 } as HTMLImageElement, 1, { width: 50, height: 50 }));
		building.workerSpawn = { x: 1, y: 1 };
		building.readyToSpawn = true;

		expect(building.canSpawnWorker()).toBe(true);
	});

	test('spawnWorker should return a worker and reset readyToSpawn', () => {
		const building = new Building(prototype, position);
		building.setWorker(new ActorSprite({ width: 100, height: 200 } as HTMLImageElement, 1, { width: 50, height: 50 }));
		building.workerSpawn = { x: 1, y: 1 };
		building.readyToSpawn = true;

		const worker = building.spawnWorker();

		expect(worker).toBeDefined();
		expect(building.readyToSpawn).toBe(false);
	});
});

describe('Building supply logic', () => {
	let worker: BuildingWorker;
	let position: Position;
	let building: Building;

	beforeEach(() => {
		position = { x: 0, y: 0 };
		worker = new BuildingWorker(new ActorSprite({ width: 100, height: 200 } as HTMLImageElement, 1, { width: 50, height: 50 }), position);
		worker.resource = 'wood';
		worker.inventory = 50;

		const buildingSpriteMock = new BuildingSprite({ width: 100, height: 200 } as HTMLImageElement, 2, { width: 50, height: 50 });
		const prototype: BuildingPrototype = {
			sprite: buildingSpriteMock,
			interface: new BuildingInterface(),
			name: 'Test Building',
			cost: 100,
		};
		building = new Building(prototype, position);
		building.accepts.add('wood');
		building.storage['wood'] = 0;
		building.capacity = 100;
	});

	test('should accept resources when storage is not full', () => {
		const suppliedAmount = building.supply(worker, 'wood', 20);

		expect(suppliedAmount).toBe(20);
		expect(building.storage['wood']).toBe(20);
	});

	test('should not accept resources when storage is full', () => {
		building.storage['wood'] = building.capacity;

		const suppliedAmount = building.supply(worker, 'wood', 20);

		expect(suppliedAmount).toBe(0);
		expect(building.storage['wood']).toBe(building.capacity);
	});

	test('should not accept resources the building does not accept', () => {
		const suppliedAmount = building.supply(worker, 'food', 20);

		expect(suppliedAmount).toBe(0);
		expect(building.storage['food']).toBeUndefined();
	});

	test('should not overflow capacity', () => {
		const suppliedAmount = building.supply(worker, 'wood', 120);

		expect(suppliedAmount).toBe(100);
		expect(building.storage['wood']).toBe(building.capacity);
	});
});

describe('Building repair logic', () => {
	let worker: BuildingWorker;
	let position: Position;
	let building: Building;

	beforeEach(() => {
		position = { x: 0, y: 0 };
		worker = new BuildingWorker(new ActorSprite({ width: 100, height: 200 } as HTMLImageElement, 1, { width: 50, height: 50 }), position);
		worker.repairing = true;

		const buildingSpriteMock = new BuildingSprite({ width: 100, height: 200 } as HTMLImageElement, 2, { width: 50, height: 50 });
		const prototype: BuildingPrototype = {
			sprite: buildingSpriteMock,
			interface: new BuildingInterface(),
			name: 'Test Building',
			cost: 100,
		};
		building = new Building(prototype, position);
	});

	test('should repair the building when health is below 100', () => {
		building.health = 80;

		building.repair(worker);

		expect(building.health).toBe(100);
	});

	test('should not repair the building when health is already 100', () => {
		building.health = 100;

		building.repair(worker);

		expect(building.health).toBe(100);
	});

	test('should not overflow health', () => {
		building.health = 99;

		building.repair(worker);

		expect(building.health).toBe(100);
	});
});
