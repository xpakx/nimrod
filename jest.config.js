/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
	testEnvironment: "node",
	transform: {
		"^.+.tsx?$": ["ts-jest",{}],
	},
	testMatch: ['<rootDir>/tests/**/*.test.ts'],
	moduleFileExtensions: ["js", "ts"],
	resolver: "<rootDir>/utils/jest-resolver.js",
};
