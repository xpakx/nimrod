import { BuildingInterface } from "../classes/buildings";
import { getLogger } from "../classes/logger";
import { SpriteLibrary } from "../classes/sprite-library";

class TestInterface extends BuildingInterface {}

beforeEach(() => {
	console.log = () => {};
});


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
});
