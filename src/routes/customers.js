const express = require('express');
const router = express.Router();
const customerService = require('../services/customerService');
const { requireFields, validateId, validateEmail, validatePhone } = require('../middleware/validate');
const { parsePagination, formatPaginatedResponse } = require('../utils/pagination');
const logger = require('../lib/logger');

/**
 * GET /api/customers
 * List all customers with pagination
 */
router.get('/', async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const includeInactive = req.query.includeInactive === 'true';
    
    const result = await customerService.listCustomers({ pagination, includeInactive });
    
    res.json(formatPaginatedResponse(result.rows, result.count, pagination));
  } catch (err) {
    logger.error('Error listing customers', { error: err.message });
    next(err);
  }
});

/**
 * GET /api/customers/:id
 * Get a single customer by ID
 */
router.get('/:id', validateId(), async (req, res, next) => {
  try {
    const includeOrders = req.query.includeOrders === 'true';
    const customer = await customerService.getById(req.params.id, { includeOrders });
    
    if (!customer) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Customer not found',
        traceId: req.traceId
      });
    }
    
    res.json(customer);
  } catch (err) {
    logger.error('Error getting customer', { error: err.message });
    next(err);
  }
});

/**
 * POST /api/customers
 * Create a new customer
 */
router.post('/', 
  requireFields(['firstName']),
  validateEmail(),
  validatePhone(),
  async (req, res, next) => {
    try {
      const customer = await customerService.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (err) {
      logger.error('Error creating customer', { error: err.message });
      next(err);
    }
  }
);

/**
 * PUT /api/customers/:id
 * Update a customer
 */
router.put('/:id',
  validateId(),
  validateEmail(),
  validatePhone(),
  async (req, res, next) => {
    try {
      const customer = await customerService.updateCustomer(req.params.id, req.body);
      
      if (!customer) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Customer not found',
          traceId: req.traceId
        });
      }
      
      res.json(customer);
    } catch (err) {
      logger.error('Error updating customer', { error: err.message });
      next(err);
    }
  }
);

/**
 * DELETE /api/customers/:id
 * Delete a customer (soft delete if has orders)
 */
router.delete('/:id', validateId(), async (req, res, next) => {
  try {
    const deleted = await customerService.deleteCustomer(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Customer not found',
        traceId: req.traceId
      });
    }
    
    res.status(204).send();
  } catch (err) {
    logger.error('Error deleting customer', { error: err.message });
    next(err);
  }
});

module.exports = router;
