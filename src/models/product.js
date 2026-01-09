/**
 * Product Model
 * Represents products available for sale with optional stock tracking
 */
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product name cannot be empty' }
      }
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: { args: [0], msg: 'Price cannot be negative' }
      }
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    trackStock: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'products',
    underscored: true
  });

  /**
   * Check if product is in stock
   * @param {number} quantity - Quantity to check
   * @returns {boolean} True if in stock or stock tracking disabled
   */
  Product.prototype.isInStock = function(quantity = 1) {
    if (!this.trackStock) {
      return true;
    }
    return this.stockQuantity >= quantity;
  };

  /**
   * Decrease stock quantity
   * @param {number} quantity - Quantity to decrease
   * @returns {Promise<Product>} Updated product
   */
  Product.prototype.decreaseStock = async function(quantity) {
    if (this.trackStock) {
      this.stockQuantity = Math.max(0, this.stockQuantity - quantity);
      await this.save();
    }
    return this;
  };

  /**
   * Increase stock quantity
   * @param {number} quantity - Quantity to increase
   * @returns {Promise<Product>} Updated product
   */
  Product.prototype.increaseStock = async function(quantity) {
    if (this.trackStock) {
      this.stockQuantity += quantity;
      await this.save();
    }
    return this;
  };

  return Product;
};
