const express = require('express');
const router = express.Router();
const customerService = require('../services/customerService');
const { requireFields, validateId, validateEmail, validatePhone } = require('../middleware/validate');
const { parsePagination, formatPaginatedResponse } = require('../utils/pagination');
const logger = require('../lib/logger');

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Müşteri yönetimi API'leri
 */

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Tüm müşterileri listele
 *     tags: [Customers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Başarılı
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
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Müşteri detayı getir
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: includeOrders
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Başarılı
 *       404:
 *         description: Müşteri bulunamadı
 */
router.get('/:id', validateId(), async (req, res, next) => {
  try {
    const includeOrders = req.query.includeOrders === 'true';
    const customer = await customerService.getById(req.params.id, { includeOrders });
    if (!customer) {
      return res.status(404).json({ error: 'Not Found', message: 'Customer not found', traceId: req.traceId });
    }
    res.json(customer);
  } catch (err) {
    logger.error('Error getting customer', { error: err.message });
    next(err);
  }
});

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Yeni müşteri oluştur
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Ahmet
 *               lastName:
 *                 type: string
 *                 example: Yılmaz
 *               email:
 *                 type: string
 *                 example: ahmet@test.com
 *               phone:
 *                 type: string
 *                 example: +905321234567
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Müşteri oluşturuldu
 *       400:
 *         description: Validation hatası
 */
router.post('/', requireFields(['firstName']), validateEmail(), validatePhone(), async (req, res, next) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json(customer);
  } catch (err) {
    logger.error('Error creating customer', { error: err.message });
    next(err);
  }
});

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Müşteri güncelle
 *     tags: [Customers]
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Güncellendi
 *       404:
 *         description: Müşteri bulunamadı
 */
router.put('/:id', validateId(), validateEmail(), validatePhone(), async (req, res, next) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    if (!customer) {
      return res.status(404).json({ error: 'Not Found', message: 'Customer not found', traceId: req.traceId });
    }
    res.json(customer);
  } catch (err) {
    logger.error('Error updating customer', { error: err.message });
    next(err);
  }
});

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Müşteri sil (siparişi varsa soft delete)
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Silindi
 *       404:
 *         description: Müşteri bulunamadı
 */
router.delete('/:id', validateId(), async (req, res, next) => {
  try {
    const deleted = await customerService.deleteCustomer(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Not Found', message: 'Customer not found', traceId: req.traceId });
    }
    res.status(204).send();
  } catch (err) {
    logger.error('Error deleting customer', { error: err.message });
    next(err);
  }
});

module.exports = router;
