/**
 * Unit Tests: ETL Transformers
 */
const {
  normalizePhone,
  cleanName,
  validateEmail,
  capitalizeWords,
  transformCustomer
} = require('../../scripts/etl/transformers');

describe('ETL Transformers', () => {
  describe('normalizePhone', () => {
    test('normalizes 11-digit phone with leading 0', () => {
      const result = normalizePhone('05321234567');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe('+905321234567');
    });

    test('normalizes 10-digit phone', () => {
      const result = normalizePhone('5321234567');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe('+905321234567');
    });

    test('normalizes phone with spaces', () => {
      const result = normalizePhone('532 123 45 67');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe('+905321234567');
    });

    test('normalizes phone with dashes', () => {
      const result = normalizePhone('0532-123-45-67');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe('+905321234567');
    });

    test('normalizes phone with +90 prefix', () => {
      const result = normalizePhone('+90 532 123 4567');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe('+905321234567');
    });

    test('returns null for empty phone', () => {
      const result = normalizePhone('');
      expect(result.isValid).toBe(true);
      expect(result.value).toBeNull();
    });

    test('returns error for invalid length', () => {
      const result = normalizePhone('123');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid phone length');
    });

    test('returns error for non-mobile prefix', () => {
      const result = normalizePhone('2121234567'); // Istanbul landline
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid mobile prefix');
    });
  });

  describe('cleanName', () => {
    test('removes double quotes', () => {
      const result = cleanName('"Mehmet"');
      expect(result.value).toBe('Mehmet');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('removes single quotes', () => {
      const result = cleanName("Ali'");
      expect(result.value).toBe('Ali');
    });

    test('trims whitespace', () => {
      const result = cleanName('  Zeynep  ');
      expect(result.value).toBe('Zeynep');
    });

    test('capitalizes names', () => {
      const result = cleanName('YILMAZ');
      // Note: JavaScript toLowerCase doesn't perfectly handle Turkish 'I' -> 'ı'
      expect(result.value).toBe('Yilmaz');
    });

    test('handles empty string', () => {
      const result = cleanName('');
      expect(result.value).toBe('');
      // Empty name is technically valid (will be caught by required field validation)
      expect(result.isValid).toBe(true);
    });

    test('handles null', () => {
      const result = cleanName(null);
      expect(result.value).toBe('');
    });
  });

  describe('capitalizeWords', () => {
    test('capitalizes single word', () => {
      expect(capitalizeWords('hello')).toBe('Hello');
    });

    test('capitalizes multiple words', () => {
      expect(capitalizeWords('fatma nur')).toBe('Fatma Nur');
    });

    test('handles empty string', () => {
      expect(capitalizeWords('')).toBe('');
    });
  });

  describe('validateEmail', () => {
    test('accepts valid email', () => {
      const result = validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe('test@example.com');
    });

    test('normalizes to lowercase', () => {
      const result = validateEmail('TEST@EXAMPLE.COM');
      expect(result.value).toBe('test@example.com');
    });

    test('returns null for empty', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(true);
      expect(result.value).toBeNull();
    });

    test('rejects double @', () => {
      const result = validateEmail('test@@example.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('multiple @');
    });

    test('rejects missing @', () => {
      const result = validateEmail('testexample.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('missing @');
    });

    test('rejects missing domain', () => {
      const result = validateEmail('test@example');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid email');
    });
  });

  describe('transformCustomer', () => {
    test('transforms valid customer', () => {
      const result = transformCustomer({
        firstName: 'John',
        lastName: 'Doe',
        phone: '05321234567',
        email: 'john@example.com',
        address: 'Istanbul'
      });

      expect(result.isValid).toBe(true);
      expect(result.data.firstName).toBe('John');
      expect(result.data.phone).toBe('+905321234567');
      expect(result.data.isActive).toBe(true);
    });

    test('reports errors for invalid data', () => {
      const result = transformCustomer({
        firstName: '',
        email: 'invalid@@email'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
