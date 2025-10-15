const tsconfig = require("./tsconfig.json");

module.exports = {
  testEnvironment: "jsdom",
  preset: "ts-jest",
  roots: ["<rootDir>/src"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    // Specific mappers should come first to override base alias
    "^@/lib/server/faker/fix-data$": "<rootDir>/__mocks__/server-faker-fix-data.ts",
    "^@/lib/server/faker$": "<rootDir>/__mocks__/server-faker.ts",
    "^@faker-js/faker$": "<rootDir>/__mocks__/@faker-js/faker.ts",
    "^better-auth/next-js$": "<rootDir>/__mocks__/better-auth-next-js.ts",
    "^better-auth/client$": "<rootDir>/__mocks__/better-auth-client.ts",
    "^better-auth$": "<rootDir>/__mocks__/better-auth.ts",
    "^@tanstack/react-query$": "<rootDir>/__mocks__/@tanstack/react-query.ts",
    "^next/(.*)$": "<rootDir>/__mocks__/next/$1",
    axios: "<rootDir>/__mocks__/axios.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.(t|j)sx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          isolatedModules: true,
        },
      },
    ],
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@testing-library|lodash-es)/)",
  ],
  testMatch: [
    "**/?(*.)+(spec|test).[tj]s?(x)",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/**",
    "!src/components/ui/**",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    "src/lib/utils.ts": {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
