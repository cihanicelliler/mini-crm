const request = require('supertest');
const app = require('../src/app');
const { sequelize, Customer } = require('../src/models');

describe('Customers API', () => {
  // Setup: Sync database before all tests
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  // Cleanup: Close connection after all tests
  afterAll(async () => {
    await sequelize.close();
  });

  // Reset customer table before each test
  beforeEach(async () => {
    await Customer.destroy({ where: {}, truncate: true, cascade: true });
  });

  describe('GET /api/customers', () => {
    test('returns empty data array when no customers exist', async () => {
      const res = await request(app).get('/api/customers');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
      expect(res.body.meta.total).toBe(0);
    });

    test('returns paginated customers', async () => {
      // Create test customers
      await Customer.bulkCreate([
        { firstName: 'John', lastName: 'Doe', isActive: true },
        { firstName: 'Jane', lastName: 'Smith', isActive: true }
      ]);

      const res = await request(app).get('/api/customers');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(2);
      expect(res.body.meta.page).toBe(1);
    });

    test('supports pagination parameters', async () => {
      // Create 5 test customers
      await Customer.bulkCreate(
        Array.from({ length: 5 }, (_, i) => ({
          firstName: `User${i}`,
          lastName: 'Test',
          isActive: true
        }))
      );

      const res = await request(app).get('/api/customers?page=2&limit=2');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.page).toBe(2);
      expect(res.body.meta.limit).toBe(2);
      expect(res.body.meta.total).toBe(5);
    });
  });

  describe('POST /api/customers', () => {
    test('creates a new customer with valid data', async () => {
      const customerData = {
        firstName: 'Test',
        lastName: 'Customer',
        email: 'test@example.com',
        phone: '+905321234567'
      };

      const res = await request(app)
        .post('/api/customers')
        .send(customerData);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.firstName).toBe('Test');
      expect(res.body.lastName).toBe('Customer');
    });

    test('returns 400 when firstName is missing', async () => {
      const res = await request(app)
        .post('/api/customers')
        .send({ lastName: 'User' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });

    test('validates email format', async () => {
      const res = await request(app)
        .post('/api/customers')
        .send({ firstName: 'Test', email: 'invalid-email' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('email');
    });
  });

  describe('GET /api/customers/:id', () => {
    test('returns customer by ID', async () => {
      const customer = await Customer.create({
        firstName: 'Find',
        lastName: 'Me',
        isActive: true
      });

      const res = await request(app).get(`/api/customers/${customer.id}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(customer.id);
      expect(res.body.firstName).toBe('Find');
    });

    test('returns 404 for non-existent customer', async () => {
      const res = await request(app).get('/api/customers/99999');
      
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });

    test('returns 400 for invalid ID', async () => {
      const res = await request(app).get('/api/customers/invalid');
      
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/customers/:id', () => {
    test('updates customer successfully', async () => {
      const customer = await Customer.create({
        firstName: 'Original',
        lastName: 'Name',
        isActive: true
      });

      const res = await request(app)
        .put(`/api/customers/${customer.id}`)
        .send({ firstName: 'Updated' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.firstName).toBe('Updated');
      expect(res.body.lastName).toBe('Name');
    });
  });

  describe('DELETE /api/customers/:id', () => {
    test('deletes customer without orders', async () => {
      const customer = await Customer.create({
        firstName: 'Delete',
        lastName: 'Me',
        isActive: true
      });

      const res = await request(app).delete(`/api/customers/${customer.id}`);
      
      expect(res.statusCode).toBe(204);
      
      // Verify deletion
      const found = await Customer.findByPk(customer.id);
      expect(found).toBeNull();
    });
  });
});
