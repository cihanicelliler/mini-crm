const express = require('express');
const router = express.Router();
const customerService = require('../services/customerService');
const logger = require('../lib/logger');

// GET /api/customers
router.get('/', async (req, res, next) => {
  try {
    const customers = await customerService.listCustomers();
    res.json(customers);
  } catch (err) {
    logger.error('Error listing customers', { err });
    next(err);
  }
});

// POST /api/customers
router.post('/', async (req, res, next) => {
  try {
    // TODO: request body validation eksik
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json(customer);
  } catch (err) {
    logger.error('Error creating customer', { err });
    next(err);
  }
});

// TODO: GET /api/customers/:id
// TODO: PUT /api/customers/:id
// TODO: DELETE /api/customers/:id

module.exports = router;
