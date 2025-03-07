import { Actor, ActorSprite } from "../classes/actor";
import { Road, TilingSprite } from "../classes/building/buildings";
import { MapLayer, Position, Size } from "../classes/map-layer";

let OffscreenCanvasMock = jest.fn().mockImplementation((width: number, height: number) => {
	return {
		height,
		width,
		oncontextlost: jest.fn(),
		oncontextrestored: jest.fn(),
		getContext: jest.fn(() => undefined),
			convertToBlob: jest.fn(),
		transferToImageBitmap: jest.fn(),
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn()
	} as unknown as OffscreenCanvas;
});



describe('ActorSprite', () => {
	let imageMock: HTMLImageElement;

	beforeEach(() => {
		imageMock = { width: 100, height: 200 } as HTMLImageElement;
		OffscreenCanvas =  OffscreenCanvasMock
	});


	test('should initialize with correct properties', () => {
		const size = 2;
		const tileSize: Size = { width: 50, height: 50 };
		const actorSprite = new ActorSprite(imageMock, size, tileSize);

		expect(actorSprite.image).toBe(imageMock);
		expect(actorSprite.baseSize).toBe(size);
		expect(actorSprite.size.width).toBe(100);
		expect(actorSprite.size.height).toBe(200);
	});

	test('refreshSize should calculate size correctly', () => {
		const size = 2;
		const tileSize: Size = { width: 50, height: 50 };
		const actorSprite = new ActorSprite(imageMock, size, tileSize);

		tileSize.width = 60;
		actorSprite.refreshSize(tileSize);

		expect(actorSprite.size.width).toBe(120); // 60 * 2
		expect(actorSprite.size.height).toBe(240); // (200/100) * 120
	});
});

describe('Actor', () => {
	let spriteMock: ActorSprite;
	let position: Position;

	beforeEach(() => {
		spriteMock = new ActorSprite({ width: 100, height: 200 } as HTMLImageElement, 2, { width: 50, height: 50 });
		position = { x: 1, y: 1 };
		OffscreenCanvas =  OffscreenCanvasMock
	});

	test('Actor is correctly initialized', () => {
		const mockImage = {
			width: 100,
			height: 200,
		} as HTMLImageElement;

		const tileSize: Size = { width: 50, height: 50 };
		const actorSprite = new ActorSprite(mockImage, 1, tileSize);
		const position: Position = { x: 5, y: 10 };

		const actor = new Actor(actorSprite, position);

		expect(actor.sprite).toBe(actorSprite);
		expect(actor.positionSquare.x).toBe(Math.floor(position.x));
		expect(actor.positionSquare.y).toBe(Math.floor(position.y));
		expect(actor.position.x).toBe(position.x + 0.5);
		expect(actor.position.y).toBe(position.y + 0.5);
		expect(actor.diagonal).toBe(15);
		expect(actor.dead).toBe(false);
		expect(actor.directionMask).toBe(0b0000);
		expect(actor.direction).toEqual({ x: 0, y: 0 });
	});

	test('getNewDir should update direction correctly when on a road', () => {
		const actor = new Actor(spriteMock, position);
		const road = new Road(new TilingSprite([{ width: 200, height: 200 } as HTMLImageElement], {width: 20, height: 20}), { x: 1, y: 1 }, 0b0001);
		const roads = [[undefined, undefined], [undefined, road]];
		const randMap = [0, 1];

		const dirChanged = actor.getNewDir(roads, randMap, 1, 1);

		expect(dirChanged).toBe(true);
		expect(actor.directionMask).toBe(0b0100);
		expect(actor.direction.x).toBe(-1);
		expect(actor.direction.y).toBe(0);
	});

	test('getNewDir should not update direction when not on a road', () => {
		const actor = new Actor(spriteMock, position);
		const roads = [[undefined, undefined], [undefined, undefined]];
		const randMap = [0, 1];

		const dirChanged = actor.getNewDir(roads, randMap, 1, 1);

		expect(dirChanged).toBe(false);
		expect(actor.directionMask).toBe(0b0000);
		expect(actor.direction.x).toBe(0);
		expect(actor.direction.y).toBe(0);
	});

	test('enterSquare should update position correctly', () => {
		const actor = new Actor(spriteMock, position);

		actor.enterSquare(6, 7);

		expect(actor.positionSquare).toEqual({ x: 6, y: 7 });
		expect(actor.diagonal).toBe(13);
		expect(actor.traveledSquares).toBe(1);
	});

	test('tick should update position and direction correctly when moving along a road', () => {
		const actor = new Actor(spriteMock, position);
		const road = new Road(new TilingSprite([{ width: 200, height: 200 } as HTMLImageElement], {width: 20, height: 20}), { x: 1, y: 1 }, 0b0001);
		const map = new MapLayer({width: 2, height: 2});
		map.roads = [[undefined, undefined], [undefined, road]];
		const randMap = [0, 1];

		actor.directionMask = 0b0001;
		actor.direction = { x: 1, y: 0 };
		const result = actor.tick(0.5, map, randMap);

		expect(actor.position.x).toBeGreaterThan(1.5);
		expect(actor.position.y).toBeCloseTo(1.5);
		expect(result).toBe(true);
	});

	test('tick should handle the dead state correctly when off-road', () => {
		const actor = new Actor(spriteMock, position);
		const map = new MapLayer({width: 2, height: 2});
		map.roads = [[undefined, undefined], [undefined, undefined]];

		const result = actor.tick(1, map, []);

		expect(actor.dead).toBe(true);
		expect(actor.direction).toEqual({ x: 0, y: 0 });
		expect(result).toBe(false);
	});

	test('tick should call getNewDir when directionMask is 0', () => {
		const actor = new Actor(spriteMock, position);
		const road = new Road(new TilingSprite([{ width: 200, height: 200 } as HTMLImageElement], {width: 20, height: 20}), { x: 5, y: 5 }, 0b0001);
		const map = new MapLayer({width: 2, height: 2});
		map.roads = [[undefined, undefined], [undefined, road]];
		const randMap = [0, 1];

		actor.directionMask = 0b0000;
		actor.direction = { x: 0, y: 0 };

		const spyGetNewDir = jest.spyOn(actor, 'getNewDir');
		actor.tick(1, map, randMap);

		expect(spyGetNewDir).toHaveBeenCalled();
	});
});
