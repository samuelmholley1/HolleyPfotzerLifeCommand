module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: { '^.+\\.(ts|tsx)$': 'ts-jest' },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/tests/unit/**/*.test.[tj]s?(x)'],
  testPathIgnorePatterns: ['<rootDir>/e2e/'],
  passWithNoTests: true
};
