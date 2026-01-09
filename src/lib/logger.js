const { createLogger, transports, format } = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { getTraceId } = require('../middleware/traceId');

// Ensure logs directory exists
const logsDir = path.dirname(config.log.file || 'logs/app.log');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom format to add trace ID to all log entries
 */
const traceIdFormat = format((info) => {
  const traceId = getTraceId();
  if (traceId) {
    info.traceId = traceId;
  }
  return info;
});

/**
 * Console format for development - human readable
 */
const devFormat = format.combine(
  traceIdFormat(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.printf(({ level, message, timestamp, traceId, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]`;
    if (traceId) {
      log += ` [${traceId.substring(0, 8)}]`;
    }
    log += ` ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

/**
 * JSON format for production - structured logging
 */
const prodFormat = format.combine(
  traceIdFormat(),
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
);

/**
 * Select format based on environment
 */
const logFormat = config.env === 'production' ? prodFormat : devFormat;

/**
 * Configure transports
 */
const logTransports = [
  new transports.Console({
    level: config.log.level
  })
];

// Add file transport if configured
if (config.log.file) {
  logTransports.push(
    new transports.File({
      filename: config.log.file,
      level: config.log.level,
      format: format.combine(
        traceIdFormat(),
        format.timestamp(),
        format.json()
      )
    })
  );
  
  // Separate error log file
  logTransports.push(
    new transports.File({
      filename: config.log.file.replace('.log', '.error.log'),
      level: 'error',
      format: format.combine(
        traceIdFormat(),
        format.timestamp(),
        format.json()
      )
    })
  );
}

/**
 * Main logger instance
 */
const logger = createLogger({
  level: config.log.level,
  format: logFormat,
  transports: logTransports,
  // Don't exit on unhandled exceptions
  exitOnError: false
});

// Add http level for request logging
logger.http = logger.http || function(message, meta) {
  logger.log('http', message, meta);
};

module.exports = logger;
