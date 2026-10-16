const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  modelNo: { type: String, required: true },
  productType: { type: String },
  resolution: { type: String },
  lens: { type: String },
  dualLight: { type: Boolean, default: false },
  features: {
    dualLight: { type: Boolean, default: false },
    fullColor: { type: Boolean, default: false },
    ir: { type: Boolean, default: false },
    audio: { type: Boolean, default: false },
    ai: { type: Boolean, default: false }
  },
  quantity: { type: Number, required: true },
  shd: { type: String },
  scannedCodes: { type: String, default: '' },
  barcodes: [{ type: String }],
  model: { type: String },
  currentStock: { type: Number, default: 0 },
  location: { type: String },
  brand: { type: String },
  dealerPrice: { type: Number },
  mrp: { type: Number },
  subCategory: { type: String },
  category: { type: String },
  isSpare: { type: Boolean, default: false },
  isAccessory: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  stockStatus: { type: String, default: 'IN_STOCK' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Inventory', InventorySchema);
