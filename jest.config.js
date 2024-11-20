module.exports = {
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',

  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/tests/**/*.test.js',
    '**/client/src/__tests__/**/*.test.js'
  ],

  // An array of regexp pattern strings that are matched against all test paths
  testPathIgnorePatterns: ['/node_modules/'],

  // An array of regexp pattern strings that are matched against all source file paths
  transformIgnorePatterns: [
    'node_modules/(?!(@mui|@material-ui|uuid|sequelize|@babel/runtime)/)'
  ],

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { 
      presets: ['@babel/preset-env', '@babel/preset-react']
    }]
  },

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.js',
    '@testing-library/jest-dom'
  ],

  // Environment variables
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },

  // Increase timeout for database operations
  testTimeout: 30000,

  // Clear mocks between tests
  clearMocks: true,

  // Collect coverage
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',
    '!**/node_modules/**'
  ]
};
