/**
 * Jest Test Setup
 * Runs before each test file
 */

// Increase timeout for database operations
jest.setTimeout(10000);

// Suppress console logs during tests (optional)
if (process.env.SUPPRESS_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  };
}

// Global test utilities
global.testUtils = {
  /**
   * Generate random string for unique test data
   */
  randomString: (length = 8) => {
    return Math.random().toString(36).substring(2, 2 + length);
  },

  /**
   * Generate test customer data
   */
  createTestCustomer: (overrides = {}) => ({
    firstName: `Test${global.testUtils.randomString()}`,
    lastName: 'User',
    email: `test${global.testUtils.randomString()}@example.com`,
    phone: '+905321234567',
    ...overrides
  }),

  /**
   * Generate test product data
   */
  createTestProduct: (overrides = {}) => ({
    name: `Product ${global.testUtils.randomString()}`,
    sku: `SKU-${global.testUtils.randomString()}`,
    price: 99.99,
    stockQuantity: 100,
    trackStock: true,
    ...overrides
  })
};
