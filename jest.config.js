module.exports = {
  testEnvironment: 'node',
  // Transform uuid package which uses ESM syntax
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ],
  // Use babel-jest to transform ESM modules
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
};
