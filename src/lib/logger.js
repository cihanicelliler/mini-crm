const { createLogger, transports, format } = require('winston');

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: format.combine(
    format.timestamp(),
    // TODO: prod için farklı format düşünülüyor
    format.printf(({ level, message, timestamp, stack }) => {
      if (stack) {
        return `${timestamp} [${level}] ${message} - ${stack}`;
      }
      return `${timestamp} [${level}] ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    // TODO: file transport eklenmişti sanırım, bakılacak
  ]
});

// Bazen direkt console.log da kullanılmış projede…
module.exports = logger;
