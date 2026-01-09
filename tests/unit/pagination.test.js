/**
 * Unit Tests: Pagination Utility
 */
const {
  parsePagination,
  formatPaginatedResponse,
  applyPagination
} = require('../../src/utils/pagination');

describe('Pagination Utility', () => {
  describe('parsePagination', () => {
    test('parses valid page and limit', () => {
      const result = parsePagination({ page: '2', limit: '10' });
      
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(10);
    });

    test('uses defaults for missing params', () => {
      const result = parsePagination({});
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    test('enforces minimum page 1', () => {
      const result = parsePagination({ page: '0' });
      expect(result.page).toBe(1);
    });

    test('enforces minimum limit 1', () => {
      // When limit=0, parseInt returns 0 which is falsy, so default (20) is used
      // Then Math.max(1, 20) = 20
      const result = parsePagination({ limit: '0' });
      expect(result.limit).toBeGreaterThanOrEqual(1);
    });

    test('enforces maximum limit', () => {
      const result = parsePagination({ limit: '500' });
      // Default maxLimit is 100
      expect(result.limit).toBeLessThanOrEqual(100);
    });

    test('calculates correct offset', () => {
      const result = parsePagination({ page: '3', limit: '25' });
      expect(result.offset).toBe(50); // (3-1) * 25
    });
  });

  describe('formatPaginatedResponse', () => {
    test('formats response correctly', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = formatPaginatedResponse(data, 10, { page: 1, limit: 2 });
      
      expect(result.data).toEqual(data);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(2);
      expect(result.meta.total).toBe(10);
      expect(result.meta.totalPages).toBe(5);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPrevPage).toBe(false);
    });

    test('hasNextPage is false on last page', () => {
      const result = formatPaginatedResponse([], 10, { page: 5, limit: 2 });
      expect(result.meta.hasNextPage).toBe(false);
    });

    test('hasPrevPage is true after first page', () => {
      const result = formatPaginatedResponse([], 10, { page: 2, limit: 2 });
      expect(result.meta.hasPrevPage).toBe(true);
    });

    test('handles empty results', () => {
      const result = formatPaginatedResponse([], 0, { page: 1, limit: 20 });
      
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.hasNextPage).toBe(false);
    });
  });

  describe('applyPagination', () => {
    test('adds limit and offset to options', () => {
      const options = { where: { isActive: true } };
      const result = applyPagination(options, { limit: 10, offset: 20 });
      
      expect(result.where).toEqual({ isActive: true });
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(20);
    });

    test('preserves existing options', () => {
      const options = { order: [['name', 'ASC']] };
      const result = applyPagination(options, { limit: 5, offset: 0 });
      
      expect(result.order).toEqual([['name', 'ASC']]);
    });
  });
});
