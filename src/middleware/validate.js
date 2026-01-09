/**
 * Validation Middleware
 * Simple validation helpers for request body/params
 */

/**
 * Validation error class
 */
class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.status = 400;
    this.errors = errors;
  }
}

/**
 * Validate required fields in request body
 * @param {Array<string>} fields - Required field names
 * @returns {Function} Express middleware
 */
function requireFields(fields) {
  return (req, res, next) => {
    const errors = [];
    
    fields.forEach(field => {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        errors.push({
          field,
          message: `${field} is required`
        });
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Required fields are missing',
        details: errors,
        traceId: req.traceId
      });
    }

    next();
  };
}

/**
 * Validate ID parameter is a positive integer
 * @param {string} paramName - Parameter name (default: 'id')
 * @returns {Function} Express middleware
 */
function validateId(paramName = 'id') {
  return (req, res, next) => {
    const id = parseInt(req.params[paramName], 10);
    
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid ${paramName}: must be a positive integer`,
        traceId: req.traceId
      });
    }

    req.params[paramName] = id;
    next();
  };
}

/**
 * Validate email format if provided
 * @returns {Function} Express middleware
 */
function validateEmail() {
  return (req, res, next) => {
    const { email } = req.body;
    
    if (email && typeof email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid email format',
          traceId: req.traceId
        });
      }
    }

    next();
  };
}

/**
 * Validate phone format if provided (Turkish format)
 * @returns {Function} Express middleware  
 */
function validatePhone() {
  return (req, res, next) => {
    const { phone } = req.body;
    
    if (phone && typeof phone === 'string') {
      // Remove all non-digits
      const digits = phone.replace(/\D/g, '');
      
      // Should be 10-12 digits (with or without country code)
      if (digits.length < 10 || digits.length > 12) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid phone format',
          traceId: req.traceId
        });
      }
    }

    next();
  };
}

/**
 * Validate enum value
 * @param {string} field - Field name
 * @param {Array<string>} values - Allowed values
 * @returns {Function} Express middleware
 */
function validateEnum(field, values) {
  return (req, res, next) => {
    const value = req.body[field];
    
    if (value && !values.includes(value)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid ${field}: must be one of ${values.join(', ')}`,
        traceId: req.traceId
      });
    }

    next();
  };
}

module.exports = {
  ValidationError,
  requireFields,
  validateId,
  validateEmail,
  validatePhone,
  validateEnum
};
