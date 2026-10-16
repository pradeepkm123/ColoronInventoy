const mongoose = require('mongoose');

const StockMovementSchema = new mongoose.Schema(
  {
    direction: { type: String, enum: ['inward', 'outward'], required: true },
    storeName: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    modelNo: { type: String, required: true, index: true },
    productName: String,
    quantity: { type: Number, required: true, min: 1 },
    value: { type: Number, required: true, min: 0 }, // qty * unit price
    reason: String,
    reference: String,
    inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockMovement', StockMovementSchema);
