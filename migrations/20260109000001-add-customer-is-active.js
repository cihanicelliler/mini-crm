'use strict';

/**
 * Migration: Add is_active column to customers table
 * Syncs the model with database schema
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('customers', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    // Add index for faster queries on active customers
    await queryInterface.addIndex('customers', ['is_active'], {
      name: 'idx_customers_is_active'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('customers', 'idx_customers_is_active');
    await queryInterface.removeColumn('customers', 'is_active');
  }
};
