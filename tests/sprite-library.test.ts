import { ActorSprite } from "../classes/actor";
import { BuildingInterface } from "../classes/building/buildings";
import { getLogger } from "../classes/logger";
import { Size } from "../classes/map-layer";
import { BuildingConfig, SpriteLibrary } from "../classes/sprite-library";

class TestInterface extends BuildingInterface {}

global.Image = class {
	onload: ((result: any) => void) | null = null;
	onerror: ((error: Event) => void) | null = null;
	_src: string = "";
	set src(value: string) {
		this._src = value;
		setTimeout(() => {
			// TODO
			if (this.onload) {
				this.onload(new Blob());
			}
			if (this.onerror) {
				this.onerror(new Error('Failed to load image') as unknown as Event);
			}
		}, 10);
	}
} as unknown as typeof Image;


beforeEach(() => {
	console.log = () => {};
});

function getCanvasMock(): jest.Mock {
	let OffscreenCanvasMock = jest.fn().mockImplementation((width: number, height: number) => {
		return {
			height: height,
			width: width,
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
	return OffscreenCanvasMock;
}


describe('SpriteLibrary', () => {
	let spriteLibrary: SpriteLibrary;
	let loggerWarnMock: jest.Mock;

	beforeEach(() => {
		loggerWarnMock = jest.fn();
		const logger = getLogger('SpriteLibrary');
		logger.warn = loggerWarnMock;
		spriteLibrary = new SpriteLibrary();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('registerBuildingInterface', () => {

		it('should register a building interface', () => {
			spriteLibrary.registerBuildingInterface(TestInterface);
			expect(spriteLibrary['buildingInterfaces']['TestInterface']).toBe(TestInterface);
		});

		it('should log a warning if the interface is already registered', () => {
			spriteLibrary.registerBuildingInterface(TestInterface);
			spriteLibrary.registerBuildingInterface(TestInterface);
			expect(loggerWarnMock).toHaveBeenCalled();
		});

	});

	describe('prepareBuildingSprites', () => {
		let fetchMock: jest.Mock;

		beforeEach(() => {
			fetchMock = jest.fn();
			global.fetch = fetchMock;
			OffscreenCanvas = getCanvasMock();
		});

		function addDataToFetchMock(mockConfig: BuildingConfig[]) {
			fetchMock.mockImplementation((url: string) => {
				if (url.endsWith('.json')) {
					return Promise.resolve({
						ok: true,
						json: () => Promise.resolve(mockConfig),
					} as Response);
				}
				throw new Error(`Unexpected URL: ${url}`);
			});
		}

		it('should load building sprites from a JSON file and prepare them', async () => {
			const mockConfig: BuildingConfig[] = [
				{
					name: 'house',
					sprite: 'house_sprite',
					size: 2,
					cost: 100,
					visibleName: 'House',
				},
			];
			addDataToFetchMock(mockConfig);

			const mockTileSize: Size = { width: 64, height: 32 };

			const result = await spriteLibrary.prepareBuildingSprites('buildings.json', mockTileSize);

			expect(result).toBe(true);
			expect(spriteLibrary.buildings['house']).toBeDefined();
		});

		it('should load building sprites directly from an array of BuildingConfig', async () => {
			const mockConfig: BuildingConfig[] = [
				{
					name: 'farm',
					sprite: 'farm_sprite',
					size: 3,
					cost: 200,
					visibleName: 'Farm',
				},
			];

			const mockTileSize: Size = { width: 64, height: 32 };

			const result = await spriteLibrary.prepareBuildingSprites(mockConfig, mockTileSize);

			expect(result).toBe(true);
			expect(spriteLibrary.buildings['farm']).toBeDefined();
		});


		it('should handle missing interface and fallback to BuildingInterface', async () => {
			const mockConfig: BuildingConfig[] = [
				{
					name: 'market',
					sprite: 'market_sprite',
					size: 2,
					interface: 'NonExistentInterface',
					cost: 150,
					visibleName: 'Market',
				},
			];

			const mockTileSize: Size = { width: 64, height: 32 };

			const result = await spriteLibrary.prepareBuildingSprites(mockConfig, mockTileSize);

			expect(result).toBe(true);
			expect(spriteLibrary.buildings['market'].interface).toBeInstanceOf(BuildingInterface);
		});

		it('should handle custom interface instances', async () => {
			const mockConfig: BuildingConfig[] = [
				{
					name: 'factory',
					sprite: 'factory_sprite',
					size: 4,
					interface: new TestInterface(),
					cost: 300,
					visibleName: 'Factory',
				},
			];

			const mockTileSize: Size = { width: 64, height: 32 };

			const result = await spriteLibrary.prepareBuildingSprites(mockConfig, mockTileSize);

			expect(result).toBe(true);
			expect(spriteLibrary.buildings['factory'].interface).toBeInstanceOf(TestInterface);
		});

		it('should handle custom interface name', async () => {
			const mockConfig: BuildingConfig[] = [
				{
					name: 'factory',
					sprite: 'factory_sprite',
					size: 4,
					interface: "TestInterface",
					cost: 300,
					visibleName: 'Factory',
				},
			];

			const mockTileSize: Size = { width: 64, height: 32 };

			spriteLibrary.registerBuildingInterface(TestInterface);
			const result = await spriteLibrary.prepareBuildingSprites(mockConfig, mockTileSize);

			expect(result).toBe(true);
			expect(spriteLibrary.buildings['factory'].interface).toBeInstanceOf(TestInterface);
		});

		it('should handle worker options if provided', async () => {
			const mockConfig: BuildingConfig[] = [
				{
					name: 'barracks',
					sprite: 'barracks_sprite',
					size: 3,
					interface: 'BarracksInterface',
					cost: 250,
					visibleName: 'Barracks',
					workerOptions: {
						sprite: 'worker_sprite',
						repairing: true,
						resource: 'wood',
						inventory: 10,
						workerStartTime: 8,
					},
				},
			];

			const mockTileSize: Size = { width: 64, height: 32 };

			spriteLibrary.actors['worker_sprite'] = {} as ActorSprite;

			const result = await spriteLibrary.prepareBuildingSprites(mockConfig, mockTileSize);

			expect(result).toBe(true);
			expect(spriteLibrary.buildings['barracks'].workerOptions).toBeDefined();
			expect(spriteLibrary.buildings['barracks'].workerOptions?.sprite).toBeDefined();
		});


		it('should not define unprovided options', async () => {
			const mockConfig: BuildingConfig[] = [
				{
					name: 'farm',
					sprite: 'farm_sprite',
					size: 3,
					cost: 200,
					visibleName: 'Farm',
				},
			];

			const mockTileSize: Size = { width: 64, height: 32 };

			await spriteLibrary.prepareBuildingSprites(mockConfig, mockTileSize);

			expect(spriteLibrary.buildings['farm'].workerOptions).toBeUndefined();
			expect(spriteLibrary.buildings['farm'].houseOptions).toBeUndefined();
			expect(spriteLibrary.buildings['farm'].storageOptions).toBeUndefined();
			expect(spriteLibrary.buildings['farm'].productionOptions).toBeUndefined();
		});

	});
});
