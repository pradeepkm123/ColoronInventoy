const mongoose = require('mongoose');

const WarehouseSchema = new mongoose.Schema({
  warehouse: String,
  contactPerson: String,
  email: String,
  phoneNo: String,
  address: String,
  city: String,
  state: String,
  country: String,
  zipCode: String,
  status: Boolean,
  createdOn: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Warehouse', WarehouseSchema);
