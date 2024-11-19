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
      rootMode: 'upward',
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' },
          modules: 'commonjs'
        }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ],
      plugins: [
        '@babel/plugin-transform-modules-commonjs'
      ]
    }]
  },

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/coverage/'
  ],

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // Setup files
  setupFilesAfterEnv: [
    '@testing-library/jest-dom',
    '<rootDir>/tests/setup.js'
  ],

  // Environment variables
  setupFiles: ['dotenv/config'],

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The maximum amount of workers used to run your tests
  maxWorkers: '50%',

  // Collect coverage from these directories
  collectCoverageFrom: [
    'src/**/*.js',
    'client/src/**/*.{js,jsx}',
    '!client/src/index.js',
    '!client/src/reportWebVitals.js',
    '!**/node_modules/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Module name mapper for static assets and CSS
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js'
  },

  // Handle ESM modules
  extensionsToTreatAsEsm: ['.jsx'],
  
  // Babel configuration for ESM
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};
