/**
 * Integration Tests: Products API
 */
const request = require('supertest');
const app = require('../../src/app');
const { sequelize, Product } = require('../../src/models');

describe('Products API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Product.destroy({ where: {}, truncate: true, cascade: true });
  });

  describe('GET /api/products', () => {
    test('returns empty data array initially', async () => {
      const res = await request(app).get('/api/products');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
    });

    test('returns products with pagination', async () => {
      await Product.bulkCreate([
        { name: 'Product 1', sku: 'SKU-001', price: 10, isActive: true },
        { name: 'Product 2', sku: 'SKU-002', price: 20, isActive: true }
      ]);

      const res = await request(app).get('/api/products');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(2);
    });

    test('filters inactive products by default', async () => {
      await Product.bulkCreate([
        { name: 'Active', sku: 'A1', isActive: true },
        { name: 'Inactive', sku: 'I1', isActive: false }
      ]);

      const res = await request(app).get('/api/products');
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Active');
    });

    test('includes inactive with query param', async () => {
      await Product.bulkCreate([
        { name: 'Active', sku: 'A1', isActive: true },
        { name: 'Inactive', sku: 'I1', isActive: false }
      ]);

      const res = await request(app).get('/api/products?includeInactive=true');
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('POST /api/products', () => {
    test('creates product with valid data', async () => {
      const productData = {
        name: 'Test Product',
        sku: 'TEST-001',
        price: 99.99,
        stockQuantity: 100,
        trackStock: true
      };

      const res = await request(app)
        .post('/api/products')
        .send(productData);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Test Product');
      expect(res.body.sku).toBe('TEST-001');
    });

    test('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ sku: 'NO-NAME' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });

    test('returns 400 for duplicate SKU', async () => {
      await Product.create({ name: 'First', sku: 'DUP-001', isActive: true });

      const res = await request(app)
        .post('/api/products')
        .send({ name: 'Second', sku: 'DUP-001' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('GET /api/products/:id', () => {
    test('returns product by ID', async () => {
      const product = await Product.create({
        name: 'Find Me',
        sku: 'FIND-001',
        price: 50,
        isActive: true
      });

      const res = await request(app).get(`/api/products/${product.id}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(product.id);
      expect(res.body.name).toBe('Find Me');
    });

    test('returns 404 for non-existent product', async () => {
      const res = await request(app).get('/api/products/99999');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/products/:id', () => {
    test('updates product successfully', async () => {
      const product = await Product.create({
        name: 'Original',
        sku: 'UPD-001',
        price: 100,
        isActive: true
      });

      const res = await request(app)
        .put(`/api/products/${product.id}`)
        .send({ name: 'Updated', price: 150 });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Updated');
      expect(parseFloat(res.body.price)).toBe(150);
    });
  });

  describe('PATCH /api/products/:id/stock', () => {
    test('increases stock', async () => {
      const product = await Product.create({
        name: 'Stock Test',
        stockQuantity: 10,
        trackStock: true,
        isActive: true
      });

      const res = await request(app)
        .patch(`/api/products/${product.id}/stock`)
        .send({ adjustment: 5 });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.stockQuantity).toBe(15);
    });

    test('decreases stock', async () => {
      const product = await Product.create({
        name: 'Stock Test',
        stockQuantity: 10,
        trackStock: true,
        isActive: true
      });

      const res = await request(app)
        .patch(`/api/products/${product.id}/stock`)
        .send({ adjustment: -3 });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.stockQuantity).toBe(7);
    });

    test('returns 400 for negative result', async () => {
      const product = await Product.create({
        name: 'Stock Test',
        stockQuantity: 5,
        trackStock: true,
        isActive: true
      });

      const res = await request(app)
        .patch(`/api/products/${product.id}/stock`)
        .send({ adjustment: -10 });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('cannot be negative');
    });
  });

  describe('DELETE /api/products/:id', () => {
    test('soft deletes product', async () => {
      const product = await Product.create({
        name: 'Delete Me',
        sku: 'DEL-001',
        isActive: true
      });

      const res = await request(app).delete(`/api/products/${product.id}`);
      expect(res.statusCode).toBe(204);

      // Verify soft delete
      const updated = await Product.findByPk(product.id);
      expect(updated.isActive).toBe(false);
    });
  });
});
