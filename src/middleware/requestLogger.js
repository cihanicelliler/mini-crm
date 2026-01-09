const logger = require('../lib/logger');

/**
 * Request/Response Logger Middleware
 * Logs incoming requests and outgoing responses with timing information
 */
function requestLoggerMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Log incoming request
  logger.http('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress
  });
  
  // Capture original end function
  const originalEnd = res.end;
  
  // Override end to log response
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.http('Outgoing response', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
}

module.exports = requestLoggerMiddleware;
