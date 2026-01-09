const { Sequelize } = require('sequelize');
const config = require('../config');
const logger = require('../lib/logger');

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: config.db.logging ? msg => logger.debug(msg) : false
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// =============================================================================
// Models
// =============================================================================

db.Customer = require('./customer')(sequelize, Sequelize.DataTypes);
db.Order = require('./order')(sequelize, Sequelize.DataTypes);
db.Product = require('./product')(sequelize, Sequelize.DataTypes);
db.OrderItem = require('./orderItem')(sequelize, Sequelize.DataTypes);

// =============================================================================
// Relationships
// =============================================================================

// Customer <-> Order (One-to-Many)
db.Customer.hasMany(db.Order, { 
  foreignKey: 'customerId',
  as: 'orders' 
});
db.Order.belongsTo(db.Customer, { 
  foreignKey: 'customerId',
  as: 'customer' 
});

// Order <-> OrderItem (One-to-Many)
db.Order.hasMany(db.OrderItem, { 
  foreignKey: 'orderId',
  as: 'items',
  onDelete: 'CASCADE'
});
db.OrderItem.belongsTo(db.Order, { 
  foreignKey: 'orderId',
  as: 'order' 
});

// Product <-> OrderItem (One-to-Many)
db.Product.hasMany(db.OrderItem, { 
  foreignKey: 'productId',
  as: 'orderItems' 
});
db.OrderItem.belongsTo(db.Product, { 
  foreignKey: 'productId',
  as: 'product' 
});

module.exports = db;
