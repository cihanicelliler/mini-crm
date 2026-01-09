const express = require('express');
const { traceIdMiddleware } = require('./middleware/traceId');
const requestLoggerMiddleware = require('./middleware/requestLogger');
const logger = require('./lib/logger');

const customersRouter = require('./routes/customers');
const ordersRouter = require('./routes/orders');

const app = express();

// =============================================================================
// Middleware Stack (Order matters!)
// =============================================================================

// 1. Trace ID - Must be first to track all requests
app.use(traceIdMiddleware);

// 2. Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Request/Response logging
app.use(requestLoggerMiddleware);

// TODO: Add when ready
// app.use(cors());
// app.use(rateLimiter);

// =============================================================================
// Routes
// =============================================================================

app.use('/api/customers', customersRouter);
app.use('/api/orders', ordersRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    traceId: req.traceId 
  });
});

// =============================================================================
// Error Handling
// =============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    traceId: req.traceId
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { 
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  // Don't leak stack traces in production
  const response = {
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    traceId: req.traceId
  };
  
  res.status(err.status || 500).json(response);
});

module.exports = app;
