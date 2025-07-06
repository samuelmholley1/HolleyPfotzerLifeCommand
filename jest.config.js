module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: { '^.+\\.(ts|tsx)$': 'ts-jest' },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/?(*.)+(test).[tj]sx?'],          // only unit tests
  testPathIgnorePatterns: ['<rootDir>/tests/'],    // ignore Playwright
  passWithNoTests: true
};
