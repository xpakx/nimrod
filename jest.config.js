/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleFileExtensions: ["js", "ts"],
moduleNameMapper: {
   "../buildings.js": "../buildings.ts",
   "../game-state.js": "../game-state.ts",
   "./buildings.js": "./buildings.ts", // TODO
   "./building-factory.js": "./building-factory.ts",
   "./actor.js": "./actor.ts",
   "./building/house.js": "./building/house.ts",
  },
};
