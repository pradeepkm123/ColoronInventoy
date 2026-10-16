// /models/Accessory.js
const mongoose = require('mongoose');

const AccessorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, default: '' },
  category: { type: String, default: '' },
  brand: { type: String, default: '' },
  price: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  description: { type: String, default: '' },
  createdOn: { type: Date, default: Date.now },
  status: { type: Boolean, default: true },
});

module.exports = mongoose.model('Accessory', AccessorySchema);
