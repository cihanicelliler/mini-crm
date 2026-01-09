/**
 * Pagination Utility
 * Handles pagination parameters and response formatting
 */

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Express req.query
 * @param {Object} defaults - Default values
 * @returns {{ page: number, limit: number, offset: number }}
 */
function parsePagination(query, defaults = { page: 1, limit: 20, maxLimit: 100 }) {
  let page = parseInt(query.page, 10) || defaults.page;
  let limit = parseInt(query.limit, 10) || defaults.limit;

  // Ensure positive values
  page = Math.max(1, page);
  limit = Math.max(1, Math.min(limit, defaults.maxLimit));

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Format paginated response
 * @param {Array} data - Array of results
 * @param {number} total - Total count of all records
 * @param {Object} pagination - Pagination params { page, limit }
 * @returns {Object} Formatted response with data and meta
 */
function formatPaginatedResponse(data, total, pagination) {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}

/**
 * Apply pagination to Sequelize query options
 * @param {Object} options - Sequelize query options
 * @param {Object} pagination - { limit, offset }
 * @returns {Object} Options with pagination applied
 */
function applyPagination(options, pagination) {
  return {
    ...options,
    limit: pagination.limit,
    offset: pagination.offset
  };
}

module.exports = {
  parsePagination,
  formatPaginatedResponse,
  applyPagination
};
