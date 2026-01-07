module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false
      // TODO: foreign key constraint migration tarafında eksik gibi
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending' // müşteri 'hazırlanıyor' demişti, sync değil
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true // nullable bırakılmış
    },
    // TODO: sipariş kalemleri için ayrı tablo düşünülmüş ama yapılmamış
  }, {
    tableName: 'orders',
    underscored: true
  });

  return Order;
};
