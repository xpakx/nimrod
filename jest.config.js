/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleFileExtensions: ["js", "ts"],
moduleNameMapper: {
   "./buildings.js": "./buildings.ts", // TODO
   "./actor.js": "./actor.ts",
  },
};
