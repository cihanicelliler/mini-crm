const express = require('express');
const router = express.Router();
const productService = require('../services/productService');
const { requireFields, validateId } = require('../middleware/validate');
const { parsePagination, formatPaginatedResponse } = require('../utils/pagination');
const logger = require('../lib/logger');

/**
 * GET /api/products
 * List all products with pagination and filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const includeInactive = req.query.includeInactive === 'true';
    const inStockOnly = req.query.inStockOnly === 'true';
    
    const result = await productService.listProducts({ 
      pagination, 
      includeInactive,
      inStockOnly 
    });
    
    res.json(formatPaginatedResponse(result.rows, result.count, pagination));
  } catch (err) {
    logger.error('Error listing products', { error: err.message });
    next(err);
  }
});

/**
 * GET /api/products/:id
 * Get a single product
 */
router.get('/:id', validateId(), async (req, res, next) => {
  try {
    const product = await productService.getById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found',
        traceId: req.traceId
      });
    }
    
    res.json(product);
  } catch (err) {
    logger.error('Error getting product', { error: err.message });
    next(err);
  }
});

/**
 * POST /api/products
 * Create a new product
 */
router.post('/', 
  requireFields(['name']),
  async (req, res, next) => {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json(product);
    } catch (err) {
      logger.error('Error creating product', { error: err.message });
      
      if (err.message.includes('already exists')) {
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
 * PUT /api/products/:id
 * Update a product
 */
router.put('/:id', validateId(), async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    
    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found',
        traceId: req.traceId
      });
    }
    
    res.json(product);
  } catch (err) {
    logger.error('Error updating product', { error: err.message });
    
    if (err.message.includes('already exists')) {
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
 * PATCH /api/products/:id/stock
 * Adjust product stock
 */
router.patch('/:id/stock', validateId(), async (req, res, next) => {
  try {
    const { adjustment } = req.body;
    
    if (typeof adjustment !== 'number') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'adjustment must be a number',
        traceId: req.traceId
      });
    }
    
    const product = await productService.adjustStock(req.params.id, adjustment);
    
    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found',
        traceId: req.traceId
      });
    }
    
    res.json(product);
  } catch (err) {
    logger.error('Error adjusting product stock', { error: err.message });
    
    if (err.message.includes('cannot be negative')) {
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
 * DELETE /api/products/:id
 * Soft delete a product
 */
router.delete('/:id', validateId(), async (req, res, next) => {
  try {
    const deleted = await productService.deleteProduct(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found',
        traceId: req.traceId
      });
    }
    
    res.status(204).send();
  } catch (err) {
    logger.error('Error deleting product', { error: err.message });
    next(err);
  }
});

module.exports = router;
