const { Product } = require('../models');
const logger = require('../lib/logger');
const { applyPagination } = require('../utils/pagination');

/**
 * List products with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Promise<{ rows: Array, count: number }>}
 */
async function listProducts(options = {}) {
  const { pagination, includeInactive = false, inStockOnly = false } = options;
  
  const where = {};
  if (!includeInactive) {
    where.isActive = true;
  }
  if (inStockOnly) {
    where.stockQuantity = { [require('sequelize').Op.gt]: 0 };
  }

  const queryOptions = {
    where,
    order: [['name', 'ASC']]
  };

  if (pagination) {
    Object.assign(queryOptions, applyPagination({}, pagination));
  }

  return Product.findAndCountAll(queryOptions);
}

/**
 * Get product by ID
 * @param {number} id - Product ID
 * @returns {Promise<Product|null>}
 */
async function getById(id) {
  return Product.findByPk(id);
}

/**
 * Get product by SKU
 * @param {string} sku - Product SKU
 * @returns {Promise<Product|null>}
 */
async function getBySku(sku) {
  return Product.findOne({ where: { sku } });
}

/**
 * Create a new product
 * @param {Object} data - Product data
 * @returns {Promise<Product>}
 */
async function createProduct(data) {
  const { name, sku, description, price, stockQuantity, trackStock } = data;
  
  // Check for duplicate SKU
  if (sku) {
    const existing = await getBySku(sku);
    if (existing) {
      throw new Error(`Product with SKU "${sku}" already exists`);
    }
  }

  const product = await Product.create({
    name,
    sku: sku || null,
    description: description || null,
    price: price || 0,
    stockQuantity: stockQuantity || 0,
    trackStock: trackStock !== false, // default true
    isActive: true
  });

  logger.info('Created product', { id: product.id, name });
  return product;
}

/**
 * Update a product
 * @param {number} id - Product ID
 * @param {Object} data - Update data
 * @returns {Promise<Product|null>}
 */
async function updateProduct(id, data) {
  const product = await Product.findByPk(id);
  
  if (!product) {
    return null;
  }

  // Check for duplicate SKU if changing
  if (data.sku && data.sku !== product.sku) {
    const existing = await getBySku(data.sku);
    if (existing) {
      throw new Error(`Product with SKU "${data.sku}" already exists`);
    }
  }

  const allowedFields = ['name', 'sku', 'description', 'price', 'stockQuantity', 'trackStock', 'isActive'];
  const updateData = {};
  
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  });

  await product.update(updateData);
  logger.info('Updated product', { id });

  return product;
}

/**
 * Adjust product stock
 * @param {number} id - Product ID
 * @param {number} adjustment - Positive or negative adjustment
 * @returns {Promise<Product|null>}
 */
async function adjustStock(id, adjustment) {
  const product = await Product.findByPk(id);
  
  if (!product) {
    return null;
  }

  const newQuantity = product.stockQuantity + adjustment;
  
  if (newQuantity < 0) {
    throw new Error('Stock cannot be negative');
  }

  product.stockQuantity = newQuantity;
  await product.save();

  logger.info('Adjusted product stock', { id, adjustment, newQuantity });
  return product;
}

/**
 * Soft delete a product
 * @param {number} id - Product ID
 * @returns {Promise<boolean>}
 */
async function deleteProduct(id) {
  const product = await Product.findByPk(id);
  
  if (!product) {
    return false;
  }

  // Soft delete
  await product.update({ isActive: false });
  logger.info('Soft deleted product', { id });

  return true;
}

module.exports = {
  listProducts,
  getById,
  getBySku,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct
};
