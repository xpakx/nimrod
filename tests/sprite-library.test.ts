import { BuildingInterface } from "../classes/buildings";
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

	});
});
