const { v4: uuidv4 } = require('uuid');
const { AsyncLocalStorage } = require('async_hooks');

/**
 * Async Local Storage for trace context propagation
 * Allows accessing trace ID anywhere in the request lifecycle
 */
const traceStorage = new AsyncLocalStorage();

/**
 * Get current trace ID from async local storage
 * @returns {string|null} Current trace ID or null if not in request context
 */
function getTraceId() {
  const store = traceStorage.getStore();
  return store ? store.traceId : null;
}

/**
 * Trace ID Middleware
 * Generates a unique trace ID for each request and makes it available throughout the request lifecycle
 */
function traceIdMiddleware(req, res, next) {
  // Use existing trace ID from header or generate new one
  const traceId = req.headers['x-trace-id'] || uuidv4();
  
  // Attach to request object
  req.traceId = traceId;
  
  // Set response header for client correlation
  res.setHeader('X-Trace-Id', traceId);
  
  // Run the rest of the request in async local storage context
  traceStorage.run({ traceId }, () => {
    next();
  });
}

module.exports = {
  traceIdMiddleware,
  getTraceId,
  traceStorage
};
