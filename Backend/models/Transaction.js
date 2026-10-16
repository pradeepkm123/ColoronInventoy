// models/Transaction.js
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    // Linking info (IDs optional if you only use names)
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: false },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: false },

    // Required identifiers
    storeName: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },

    // Product info
    modelNo: { type: String, required: true, trim: true },
    productName: { type: String, required: false, trim: true },

    // Quantities & money
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    value: { type: Number, required: true, min: 0 },

    // Classification & metadata
    type: {
      type: String,
      enum: ['inward', 'outward', 'adjustment'],
      default: 'outward',
      required: true
    },
    reason: { type: String, required: false, trim: true },
    reference: { type: String, required: false, trim: true },
    location: { type: String, required: false, trim: true },
  },
  { timestamps: true } // gives createdAt & updatedAt
);

// Helpful indexes for your dashboard queries
TransactionSchema.index({ storeName: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, createdAt: -1 });
TransactionSchema.index({ modelNo: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
