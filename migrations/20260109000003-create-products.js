'use strict';

/**
 * Migration: Create products table
 * Supports stock tracking with optional tracking flag
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      sku: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      stock_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      track_stock: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('products', ['sku'], {
      name: 'idx_products_sku',
      unique: true,
      where: { sku: { [Sequelize.Op.ne]: null } }
    });
    
    await queryInterface.addIndex('products', ['is_active'], {
      name: 'idx_products_is_active'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  }
};
