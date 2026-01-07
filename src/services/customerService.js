const { Customer } = require('../models');
const logger = require('../lib/logger');

async function listCustomers() {
  return Customer.findAll({
    limit: 50 // TODO: pagination eksik
  });
}

async function createCustomer(payload) {
  // TODO: veri normalizasyonu yok (telefon formatı, email vs.)
  logger.info('Creating customer', { payload }); // fazla veri logluyor
  const customer = await Customer.create(payload);
  return customer;
}

// TODO: update & delete hiç yazılmamış

module.exports = {
  listCustomers,
  createCustomer
};
