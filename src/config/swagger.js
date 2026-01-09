const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mini-CRM API',
      version: '1.0.0',
      description: 'Müşteri ve sipariş yönetimi için REST API',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            firstName: { type: 'string', example: 'Ahmet' },
            lastName: { type: 'string', example: 'Yılmaz' },
            email: { type: 'string', example: 'ahmet@example.com' },
            phone: { type: 'string', example: '+905321234567' },
            address: { type: 'string', example: 'İstanbul' },
            isActive: { type: 'boolean', example: true }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Ürün A' },
            sku: { type: 'string', example: 'SKU-001' },
            price: { type: 'number', example: 99.99 },
            stockQuantity: { type: 'integer', example: 100 },
            trackStock: { type: 'boolean', example: true },
            isActive: { type: 'boolean', example: true }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            customerId: { type: 'integer', example: 1 },
            status: { 
              type: 'string', 
              enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
              example: 'pending' 
            },
            totalAmount: { type: 'number', example: 199.98 }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: {} },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                total: { type: 'integer', example: 100 },
                totalPages: { type: 'integer', example: 5 },
                hasNextPage: { type: 'boolean', example: true },
                hasPrevPage: { type: 'boolean', example: false }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Validation Error' },
            message: { type: 'string', example: 'firstName is required' },
            traceId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
