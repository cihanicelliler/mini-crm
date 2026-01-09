const express = require('express');
const router = express.Router();
const productService = require('../services/productService');
const { requireFields, validateId } = require('../middleware/validate');
const { parsePagination, formatPaginatedResponse } = require('../utils/pagination');
const logger = require('../lib/logger');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Ürün yönetimi API'leri
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Ürünleri listele
 *     tags: [Products]
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
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: inStockOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/', async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const includeInactive = req.query.includeInactive === 'true';
    const inStockOnly = req.query.inStockOnly === 'true';
    const result = await productService.listProducts({ pagination, includeInactive, inStockOnly });
    res.json(formatPaginatedResponse(result.rows, result.count, pagination));
  } catch (err) {
    logger.error('Error listing products', { error: err.message });
    next(err);
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Ürün detayı
 *     tags: [Products]
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
 *         description: Ürün bulunamadı
 */
router.get('/:id', validateId(), async (req, res, next) => {
  try {
    const product = await productService.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Not Found', message: 'Product not found', traceId: req.traceId });
    }
    res.json(product);
  } catch (err) {
    logger.error('Error getting product', { error: err.message });
    next(err);
  }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Yeni ürün oluştur
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ürün A
 *               sku:
 *                 type: string
 *                 example: SKU-001
 *               price:
 *                 type: number
 *                 example: 99.99
 *               stockQuantity:
 *                 type: integer
 *                 example: 100
 *               trackStock:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Ürün oluşturuldu
 *       400:
 *         description: Validation hatası
 */
router.post('/', requireFields(['name']), async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    logger.error('Error creating product', { error: err.message });
    if (err.message.includes('already exists')) {
      return res.status(400).json({ error: 'Validation Error', message: err.message, traceId: req.traceId });
    }
    next(err);
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Ürün güncelle
 *     tags: [Products]
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
 *               name:
 *                 type: string
 *               sku:
 *                 type: string
 *               price:
 *                 type: number
 *               stockQuantity:
 *                 type: integer
 *               trackStock:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Güncellendi
 *       404:
 *         description: Ürün bulunamadı
 */
router.put('/:id', validateId(), async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({ error: 'Not Found', message: 'Product not found', traceId: req.traceId });
    }
    res.json(product);
  } catch (err) {
    logger.error('Error updating product', { error: err.message });
    if (err.message.includes('already exists')) {
      return res.status(400).json({ error: 'Validation Error', message: err.message, traceId: req.traceId });
    }
    next(err);
  }
});

/**
 * @swagger
 * /api/products/{id}/stock:
 *   patch:
 *     summary: Stok ayarla (artır/azalt)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adjustment
 *             properties:
 *               adjustment:
 *                 type: integer
 *                 description: Pozitif = artır, negatif = azalt
 *                 example: -5
 *     responses:
 *       200:
 *         description: Stok güncellendi
 *       400:
 *         description: Stok negatif olamaz
 *       404:
 *         description: Ürün bulunamadı
 */
router.patch('/:id/stock', validateId(), async (req, res, next) => {
  try {
    const { adjustment } = req.body;
    if (typeof adjustment !== 'number') {
      return res.status(400).json({ error: 'Validation Error', message: 'adjustment must be a number', traceId: req.traceId });
    }
    const product = await productService.adjustStock(req.params.id, adjustment);
    if (!product) {
      return res.status(404).json({ error: 'Not Found', message: 'Product not found', traceId: req.traceId });
    }
    res.json(product);
  } catch (err) {
    logger.error('Error adjusting product stock', { error: err.message });
    if (err.message.includes('cannot be negative')) {
      return res.status(400).json({ error: 'Validation Error', message: err.message, traceId: req.traceId });
    }
    next(err);
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Ürünü sil (soft delete)
 *     tags: [Products]
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
 *         description: Ürün bulunamadı
 */
router.delete('/:id', validateId(), async (req, res, next) => {
  try {
    const deleted = await productService.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Not Found', message: 'Product not found', traceId: req.traceId });
    }
    res.status(204).send();
  } catch (err) {
    logger.error('Error deleting product', { error: err.message });
    next(err);
  }
});

module.exports = router;
