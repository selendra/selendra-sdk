/**
 * Jest setup file for general tests
 */

// Import test utilities
import { testUtils } from '../src/test/setup';

// Make test utils available globally
(global).testUtils = testUtils;

// Setup global test configuration
beforeAll(() => {
  // Set timezone for consistent date tests
  process.env.TZ = 'UTC';
});

beforeEach(() => {
  // Reset all mocks before each test
  jest.resetAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  jest.clearAllTimers();
});