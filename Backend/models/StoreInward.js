// models/StoreInward.js
const mongoose = require('mongoose');

const StoreInwardSchema = new mongoose.Schema({
  dispatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispatch' },
  invoiceNumber: { type: String, default: '' },
  modelNo: { type: String, required: true },
  quantity: { type: Number, required: true },
  scanningCode: { type: String, default: '' },
  scannedBarcode: {
    type: [String],
    default: [],
    required: true
  },
  userId: { type: String, required: true },
  storeName: { type: String, required: true },
  brand: { type: String, default: '' },
  dealerPrice: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  model: { type: String, default: '' },
  subCategory: { type: String, default: '' },
  category: { type: String, default: '' },
  currentStock: { type: Number, default: 0 },
  pricePerUnit: { type: Number, default: 0 },
  salePerson: { type: String, default: '' },
  owner: { type: String, default: '' },
  isAccessory: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Performance Indexes
StoreInwardSchema.index({ dispatchId: 1 });
StoreInwardSchema.index({ invoiceNumber: 1 });
StoreInwardSchema.index({ modelNo: 1 });
StoreInwardSchema.index({ storeName: 1 });
StoreInwardSchema.index({ scannedBarcode: 1 });
StoreInwardSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StoreInward', StoreInwardSchema);
