'use strict';

/**
 * Migration: Create order_items table
 * Junction table between orders and products with line item details
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // Nullable for deleted products or quick-add items
        references: {
          model: 'products',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      product_name: {
        type: Sequelize.STRING(255),
        allowNull: false // Stored for historical reference
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      total_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
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
    await queryInterface.addIndex('order_items', ['order_id'], {
      name: 'idx_order_items_order_id'
    });
    
    await queryInterface.addIndex('order_items', ['product_id'], {
      name: 'idx_order_items_product_id'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('order_items');
  }
};
