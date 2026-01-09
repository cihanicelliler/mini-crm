const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const { validateId, validateEnum } = require('../middleware/validate');
const { parsePagination, formatPaginatedResponse } = require('../utils/pagination');
const logger = require('../lib/logger');

/**
 * GET /api/orders
 * List all orders with pagination and filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const { status, customerId } = req.query;
    
    const result = await orderService.listOrders({ 
      pagination, 
      status, 
      customerId: customerId ? parseInt(customerId, 10) : undefined 
    });
    
    res.json(formatPaginatedResponse(result.rows, result.count, pagination));
  } catch (err) {
    logger.error('Error listing orders', { error: err.message });
    next(err);
  }
});

/**
 * GET /api/orders/:id
 * Get a single order with items
 */
router.get('/:id', validateId(), async (req, res, next) => {
  try {
    const order = await orderService.getById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found',
        traceId: req.traceId
      });
    }
    
    res.json(order);
  } catch (err) {
    logger.error('Error getting order', { error: err.message });
    next(err);
  }
});

/**
 * POST /api/orders
 * Create a new order
 * Supports guest customers via customerData field
 */
router.post('/', async (req, res, next) => {
  try {
    const { customerId, customerData, items } = req.body;
    
    // Validate: either customerId or customerData required
    if (!customerId && !customerData) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Either customerId or customerData is required',
        traceId: req.traceId
      });
    }

    // Validate: items required
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Order must have at least one item',
        traceId: req.traceId
      });
    }

    const order = await orderService.createOrder({ customerId, customerData, items });
    res.status(201).json(order);
  } catch (err) {
    logger.error('Error creating order', { error: err.message });
    
    // Handle known errors
    if (err.message.includes('not found') || err.message.includes('Insufficient stock')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: err.message,
        traceId: req.traceId
      });
    }
    
    next(err);
  }
});

/**
 * PUT /api/orders/:id
 * Update order status
 */
router.put('/:id',
  validateId(),
  validateEnum('status', Object.values(orderService.ORDER_STATUS)),
  async (req, res, next) => {
    try {
      const order = await orderService.updateOrder(req.params.id, req.body);
      
      if (!order) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Order not found',
          traceId: req.traceId
        });
      }
      
      res.json(order);
    } catch (err) {
      logger.error('Error updating order', { error: err.message });
      
      if (err.message.includes('Invalid status')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: err.message,
          traceId: req.traceId
        });
      }
      
      next(err);
    }
  }
);

/**
 * DELETE /api/orders/:id
 * Cancel an order (restores stock)
 */
router.delete('/:id', validateId(), async (req, res, next) => {
  try {
    const deleted = await orderService.deleteOrder(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found',
        traceId: req.traceId
      });
    }
    
    res.status(204).send();
  } catch (err) {
    logger.error('Error deleting order', { error: err.message });
    next(err);
  }
});

module.exports = router;
