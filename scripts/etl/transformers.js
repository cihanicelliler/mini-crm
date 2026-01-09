/**
 * ETL Transformers
 * Data transformation utilities for customer data normalization
 */

/**
 * Normalize Turkish phone number to +90 format
 * @param {string} phone - Raw phone number
 * @returns {{ value: string|null, isValid: boolean, error: string|null }}
 */
function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { value: null, isValid: true, error: null }; // Empty is allowed
  }

  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Remove leading + for processing
  const hasPlus = cleaned.startsWith('+');
  if (hasPlus) {
    cleaned = cleaned.substring(1);
  }

  // Remove leading 0 if present (Turkish format)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Remove country code if already present
  if (cleaned.startsWith('90') && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
  }

  // Validate: Turkish mobile numbers are 10 digits (5XX XXX XX XX)
  if (cleaned.length !== 10) {
    return {
      value: phone,
      isValid: false,
      error: `Invalid phone length: expected 10 digits, got ${cleaned.length}`
    };
  }

  // Validate: Must start with 5 for mobile
  if (!cleaned.startsWith('5')) {
    return {
      value: phone,
      isValid: false,
      error: 'Invalid mobile prefix: must start with 5'
    };
  }

  return {
    value: `+90${cleaned}`,
    isValid: true,
    error: null
  };
}

/**
 * Clean and normalize name
 * - Remove quotes
 * - Trim whitespace
 * - Capitalize properly
 * @param {string} name - Raw name
 * @returns {{ value: string, isValid: boolean, warnings: string[] }}
 */
function cleanName(name) {
  const warnings = [];
  
  if (!name || typeof name !== 'string') {
    return { value: '', isValid: true, warnings };
  }

  let cleaned = name;

  // Remove quotes
  if (/["']/.test(cleaned)) {
    warnings.push(`Removed quotes from name: "${name}"`);
    cleaned = cleaned.replace(/["']/g, '');
  }

  // Trim whitespace
  const trimmed = cleaned.trim();
  if (trimmed !== cleaned || trimmed.length !== name.trim().length) {
    warnings.push(`Trimmed whitespace from name`);
  }
  cleaned = trimmed;

  // Capitalize each word (Turkish-aware)
  cleaned = capitalizeWords(cleaned);

  return {
    value: cleaned,
    isValid: cleaned.length > 0,
    warnings
  };
}

/**
 * Capitalize words (Turkish locale aware)
 * @param {string} str - Input string
 * @returns {string} Capitalized string
 */
function capitalizeWords(str) {
  if (!str) return '';
  
  // Turkish-specific lowercase/uppercase mappings
  const turkishLower = { 'I': 'ı', 'İ': 'i' };
  const turkishUpper = { 'i': 'İ', 'ı': 'I' };
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (!word) return word;
      const firstChar = word.charAt(0);
      const upperFirst = turkishUpper[firstChar] || firstChar.toUpperCase();
      return upperFirst + word.slice(1);
    })
    .join(' ');
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {{ value: string|null, isValid: boolean, error: string|null }}
 */
function validateEmail(email) {
  // Empty email is allowed (nullable field)
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return { value: null, isValid: true, error: null };
  }

  const trimmed = email.trim().toLowerCase();

  // Check for double @
  if ((trimmed.match(/@/g) || []).length > 1) {
    return {
      value: email,
      isValid: false,
      error: 'Invalid email: contains multiple @ symbols'
    };
  }

  // Check for missing @
  if (!trimmed.includes('@')) {
    return {
      value: email,
      isValid: false,
      error: 'Invalid email: missing @ symbol'
    };
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return {
      value: email,
      isValid: false,
      error: 'Invalid email format'
    };
  }

  return {
    value: trimmed,
    isValid: true,
    error: null
  };
}

/**
 * Transform a single customer record
 * @param {Object} customer - Raw customer data
 * @returns {{ data: Object, isValid: boolean, errors: string[], warnings: string[] }}
 */
function transformCustomer(customer) {
  const errors = [];
  const warnings = [];

  // Transform firstName
  const firstName = cleanName(customer.firstName);
  if (!firstName.isValid) {
    errors.push('First name is required');
  }
  warnings.push(...firstName.warnings);

  // Transform lastName (nullable)
  const lastName = cleanName(customer.lastName);
  warnings.push(...lastName.warnings);

  // Transform phone
  const phone = normalizePhone(customer.phone);
  if (!phone.isValid) {
    errors.push(phone.error);
  }

  // Transform email
  const email = validateEmail(customer.email);
  if (!email.isValid) {
    errors.push(email.error);
  }

  return {
    data: {
      firstName: firstName.value,
      lastName: lastName.value || null,
      phone: phone.value,
      email: email.value,
      address: customer.address ? customer.address.trim() : null,
      isActive: true
    },
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

module.exports = {
  normalizePhone,
  cleanName,
  validateEmail,
  capitalizeWords,
  transformCustomer
};
