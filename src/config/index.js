require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

/**
 * Environment-specific configuration
 * Production requires all values to be explicitly set via environment variables
 */

// Validate required environment variables in production
function validateProductionConfig() {
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missing.join(', ')}`
    );
  }
}

// Environment-specific defaults
const envDefaults = {
  development: {
    db: {
      host: 'localhost',
      port: 5432,
      database: 'mini_crm',
      username: 'postgres',
      password: null,
      logging: true
    },
    log: {
      level: 'debug',
      file: 'logs/app.log'
    }
  },
  test: {
    db: {
      host: 'localhost',
      port: 5432,
      database: 'mini_crm_test',
      username: 'postgres',
      password: null,
      logging: false
    },
    log: {
      level: 'error',
      file: null
    }
  },
  production: {
    db: {
      host: null, // Must be set via env
      port: 5432,
      database: null,
      username: null,
      password: null,
      logging: false
    },
    log: {
      level: 'info',
      file: 'logs/app.log'
    }
  }
};

const defaults = envDefaults[env] || envDefaults.development;

// Validate production config
if (env === 'production') {
  validateProductionConfig();
}

module.exports = {
  env,
  
  app: {
    port: parseInt(process.env.APP_PORT, 10) || 3000
  },
  
  db: {
    host: process.env.DB_HOST || defaults.db.host,
    port: parseInt(process.env.DB_PORT, 10) || defaults.db.port,
    database: process.env.DB_NAME || defaults.db.database,
    username: process.env.DB_USER || defaults.db.username,
    password: process.env.DB_PASS || defaults.db.password,
    dialect: 'postgres',
    logging: defaults.db.logging
  },
  
  log: {
    level: process.env.LOG_LEVEL || defaults.log.level,
    file: process.env.LOG_FILE || defaults.log.file
  }
};
