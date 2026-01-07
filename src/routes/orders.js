const express = require('express');
const router = express.Router();
const { Order } = require('../models');
const logger = require('../lib/logger');

// TODO: servis katmanı düşünülmüş ama direkt model kullanılmış
router.get('/', async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      limit: 20
      // TODO: filtreleme (status, customer vs.) yok
    });
    res.json(orders);
  } catch (err) {
    logger.error('Error listing orders', { err });
    next(err);
  }
});

// TODO: POST /api/orders - sipariş oluşturma
// Müşteri yokken sipariş oluşturma senaryosu hiç ele alınmamış

module.exports = router;
