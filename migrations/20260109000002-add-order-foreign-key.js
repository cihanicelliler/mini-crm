'use strict';

/**
 * Migration: Add foreign key constraint to orders.customer_id
 * Ensures referential integrity between orders and customers
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, make sure status has correct constraints
    await queryInterface.changeColumn('orders', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'pending'
    });

    // Add foreign key constraint
    await queryInterface.addConstraint('orders', {
      fields: ['customer_id'],
      type: 'foreign key',
      name: 'fk_orders_customer_id',
      references: {
        table: 'customers',
        field: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('orders', 'fk_orders_customer_id');
  }
};
