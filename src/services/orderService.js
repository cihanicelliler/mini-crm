const { Order, OrderItem, Customer, Product, sequelize } = require('../models');
const logger = require('../lib/logger');
const { applyPagination } = require('../utils/pagination');

// Order status enum
const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

/**
 * List orders with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Promise<{ rows: Array, count: number }>}
 */
async function listOrders(options = {}) {
  const { pagination, status, customerId } = options;
  
  const where = {};
  if (status) {
    where.status = status;
  }
  if (customerId) {
    where.customerId = customerId;
  }

  const queryOptions = {
    where,
    include: [{
      model: Customer,
      as: 'customer',
      attributes: ['id', 'firstName', 'lastName', 'email']
    }],
    order: [['createdAt', 'DESC']]
  };

  if (pagination) {
    Object.assign(queryOptions, applyPagination({}, pagination));
  }

  return Order.findAndCountAll(queryOptions);
}

/**
 * Get order by ID with full details
 * @param {number} id - Order ID
 * @returns {Promise<Order|null>}
 */
async function getById(id) {
  return Order.findOne({
    where: { id },
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'address']
      },
      {
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku']
        }]
      }
    ]
  });
}

/**
 * Create a new order
 * Supports guest customers (creates temporary customer if needed)
 * @param {Object} data - Order data
 * @returns {Promise<Order>}
 */
async function createOrder(data) {
  const { customerId, customerData, items } = data;
  
  const transaction = await sequelize.transaction();
  
  try {
    let finalCustomerId = customerId;

    // Handle guest customer
    if (!customerId && customerData) {
      const guestCustomer = await Customer.create({
        firstName: customerData.firstName || 'Guest',
        lastName: customerData.lastName || null,
        phone: customerData.phone || null,
        email: customerData.email || null,
        address: customerData.address || null,
        isActive: true
      }, { transaction });
      
      finalCustomerId = guestCustomer.id;
      logger.info('Created guest customer for order', { customerId: finalCustomerId });
    }

    if (!finalCustomerId) {
      throw new Error('Customer ID or customer data is required');
    }

    // Calculate total from items
    let totalAmount = 0;
    const orderItems = [];

    if (items && items.length > 0) {
      for (const item of items) {
        const product = await Product.findByPk(item.productId, { transaction });
        
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        // Check stock if tracking is enabled
        if (product.trackStock && product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}`);
        }

        const unitPrice = item.unitPrice || parseFloat(product.price);
        const quantity = item.quantity || 1;
        const itemTotal = unitPrice * quantity;

        orderItems.push({
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice,
          totalPrice: itemTotal
        });

        totalAmount += itemTotal;

        // Decrease stock
        if (product.trackStock) {
          await product.decreaseStock(quantity);
        }
      }
    }

    // Create order
    const order = await Order.create({
      customerId: finalCustomerId,
      status: ORDER_STATUS.PENDING,
      totalAmount
    }, { transaction });

    // Create order items
    if (orderItems.length > 0) {
      await OrderItem.bulkCreate(
        orderItems.map(item => ({ ...item, orderId: order.id })),
        { transaction }
      );
    }

    await transaction.commit();
    logger.info('Created order', { orderId: order.id, customerId: finalCustomerId, totalAmount });

    // Return with full details
    return getById(order.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Update order status
 * @param {number} id - Order ID
 * @param {Object} data - Update data
 * @returns {Promise<Order|null>}
 */
async function updateOrder(id, data) {
  const order = await Order.findByPk(id);
  
  if (!order) {
    return null;
  }

  const { status } = data;
  
  if (status && !Object.values(ORDER_STATUS).includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  if (status) {
    order.status = status;
  }

  await order.save();
  logger.info('Updated order', { id, status });

  return getById(id);
}

/**
 * Cancel/delete an order
 * @param {number} id - Order ID
 * @returns {Promise<boolean>}
 */
async function deleteOrder(id) {
  const order = await Order.findByPk(id, {
    include: [{ model: OrderItem, as: 'items' }]
  });
  
  if (!order) {
    return false;
  }

  const transaction = await sequelize.transaction();
  
  try {
    // Restore stock for cancelled orders
    if (order.status !== ORDER_STATUS.CANCELLED) {
      for (const item of order.items) {
        if (item.productId) {
          const product = await Product.findByPk(item.productId, { transaction });
          if (product && product.trackStock) {
            await product.increaseStock(item.quantity);
          }
        }
      }
    }

    // Mark as cancelled instead of deleting
    order.status = ORDER_STATUS.CANCELLED;
    await order.save({ transaction });

    await transaction.commit();
    logger.info('Cancelled order', { id });

    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  ORDER_STATUS,
  listOrders,
  getById,
  createOrder,
  updateOrder,
  deleteOrder
};
