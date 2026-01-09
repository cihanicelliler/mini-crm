const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const { validateId, validateEnum } = require('../middleware/validate');
const { parsePagination, formatPaginatedResponse } = require('../utils/pagination');
const logger = require('../lib/logger');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Sipariş yönetimi API'leri
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Siparişleri listele
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/', async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const { status, customerId } = req.query;
    const result = await orderService.listOrders({ 
      pagination, status, 
      customerId: customerId ? parseInt(customerId, 10) : undefined 
    });
    res.json(formatPaginatedResponse(result.rows, result.count, pagination));
  } catch (err) {
    logger.error('Error listing orders', { error: err.message });
    next(err);
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Sipariş detayı (kalemlerle)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Başarılı
 *       404:
 *         description: Sipariş bulunamadı
 */
router.get('/:id', validateId(), async (req, res, next) => {
  try {
    const order = await orderService.getById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Not Found', message: 'Order not found', traceId: req.traceId });
    }
    res.json(order);
  } catch (err) {
    logger.error('Error getting order', { error: err.message });
    next(err);
  }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Yeni sipariş oluştur
 *     description: customerId veya customerData (guest müşteri) ile sipariş oluşturur
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: integer
 *                 description: Mevcut müşteri ID
 *               customerData:
 *                 type: object
 *                 description: Guest müşteri bilgileri
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   phone:
 *                     type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Sipariş oluşturuldu
 *       400:
 *         description: Validation hatası
 */
router.post('/', async (req, res, next) => {
  try {
    const { customerId, customerData, items } = req.body;
    if (!customerId && !customerData) {
      return res.status(400).json({ error: 'Validation Error', message: 'Either customerId or customerData is required', traceId: req.traceId });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Validation Error', message: 'Order must have at least one item', traceId: req.traceId });
    }
    const order = await orderService.createOrder({ customerId, customerData, items });
    res.status(201).json(order);
  } catch (err) {
    logger.error('Error creating order', { error: err.message });
    if (err.message.includes('not found') || err.message.includes('Insufficient stock')) {
      return res.status(400).json({ error: 'Validation Error', message: err.message, traceId: req.traceId });
    }
    next(err);
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Sipariş durumunu güncelle
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Güncellendi
 *       404:
 *         description: Sipariş bulunamadı
 */
router.put('/:id', validateId(), validateEnum('status', Object.values(orderService.ORDER_STATUS)), async (req, res, next) => {
  try {
    const order = await orderService.updateOrder(req.params.id, req.body);
    if (!order) {
      return res.status(404).json({ error: 'Not Found', message: 'Order not found', traceId: req.traceId });
    }
    res.json(order);
  } catch (err) {
    logger.error('Error updating order', { error: err.message });
    if (err.message.includes('Invalid status')) {
      return res.status(400).json({ error: 'Validation Error', message: err.message, traceId: req.traceId });
    }
    next(err);
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Siparişi iptal et (stok geri yüklenir)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: İptal edildi
 *       404:
 *         description: Sipariş bulunamadı
 */
router.delete('/:id', validateId(), async (req, res, next) => {
  try {
    const deleted = await orderService.deleteOrder(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Not Found', message: 'Order not found', traceId: req.traceId });
    }
    res.status(204).send();
  } catch (err) {
    logger.error('Error deleting order', { error: err.message });
    next(err);
  }
});

module.exports = router;
