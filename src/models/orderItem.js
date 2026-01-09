/**
 * OrderItem Model
 * Represents individual line items in an order
 */
module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Nullable for deleted products
      references: {
        model: 'products',
        key: 'id'
      }
    },
    productName: {
      type: DataTypes.STRING(255),
      allowNull: false // Stored for historical reference
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: { args: [1], msg: 'Quantity must be at least 1' }
      }
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Unit price cannot be negative' }
      }
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    tableName: 'order_items',
    underscored: true,
    hooks: {
      beforeValidate: (orderItem) => {
        // Auto-calculate total price
        if (orderItem.quantity && orderItem.unitPrice) {
          orderItem.totalPrice = orderItem.quantity * orderItem.unitPrice;
        }
      }
    }
  });

  return OrderItem;
};
