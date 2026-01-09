const { Customer, Order } = require('../models');
const logger = require('../lib/logger');
const { applyPagination } = require('../utils/pagination');

/**
 * List customers with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Promise<{ rows: Array, count: number }>}
 */
async function listCustomers(options = {}) {
  const { pagination, includeInactive = false } = options;
  
  const where = {};
  if (!includeInactive) {
    where.isActive = true;
  }

  const queryOptions = {
    where,
    order: [['createdAt', 'DESC']]
  };

  if (pagination) {
    Object.assign(queryOptions, applyPagination({}, pagination));
  }

  return Customer.findAndCountAll(queryOptions);
}

/**
 * Get customer by ID
 * @param {number} id - Customer ID
 * @param {Object} options - Query options
 * @returns {Promise<Customer|null>}
 */
async function getById(id, options = {}) {
  const { includeOrders = false } = options;
  
  const queryOptions = {
    where: { id }
  };

  if (includeOrders) {
    queryOptions.include = [{
      model: Order,
      as: 'orders'
    }];
  }

  return Customer.findOne(queryOptions);
}

/**
 * Create a new customer
 * @param {Object} data - Customer data
 * @returns {Promise<Customer>}
 */
async function createCustomer(data) {
  const { firstName, lastName, phone, email, address } = data;
  
  logger.info('Creating customer', { firstName, lastName });
  
  const customer = await Customer.create({
    firstName,
    lastName: lastName || null,
    phone: phone || null,
    email: email || null,
    address: address || null,
    isActive: true
  });

  return customer;
}

/**
 * Update a customer
 * @param {number} id - Customer ID
 * @param {Object} data - Update data
 * @returns {Promise<Customer|null>}
 */
async function updateCustomer(id, data) {
  const customer = await Customer.findByPk(id);
  
  if (!customer) {
    return null;
  }

  const allowedFields = ['firstName', 'lastName', 'phone', 'email', 'address', 'isActive'];
  const updateData = {};
  
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  });

  await customer.update(updateData);
  logger.info('Updated customer', { id });
  
  return customer;
}

/**
 * Soft delete a customer
 * @param {number} id - Customer ID
 * @returns {Promise<boolean>}
 */
async function deleteCustomer(id) {
  const customer = await Customer.findByPk(id);
  
  if (!customer) {
    return false;
  }

  // Check if customer has orders
  const orderCount = await Order.count({ where: { customerId: id } });
  if (orderCount > 0) {
    // Soft delete - just mark as inactive
    await customer.update({ isActive: false });
    logger.info('Soft deleted customer (has orders)', { id, orderCount });
  } else {
    // Hard delete if no orders
    await customer.destroy();
    logger.info('Hard deleted customer', { id });
  }

  return true;
}

module.exports = {
  listCustomers,
  getById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
