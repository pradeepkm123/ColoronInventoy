const mongoose = require('mongoose');

const SparePartTransactionSchema = new mongoose.Schema(
  {
    serialNumber: {
      type: String,
      index: true,
    },
    sparePartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SparePart',
      required: true,
      index: true,
    },
    sparePartCode: {
      type: String,
      required: true,
    },
    sparePartName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    actionType: {
      type: String,
      enum: ['INWARD', 'RESERVED', 'INSTALLED', 'DEFECTIVE', 'RETURNED', 'SCRAPPED', 'QUANTITY_CONSUMED', 'STOCK_ADJUSTMENT'],
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    fromStatus: {
      type: String,
    },
    toStatus: {
      type: String,
    },
    rmaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RMA',
      index: true,
    },
    rmaNo: {
      type: String,
      index: true,
    },
    ticketNo: {
      type: String,
    },
    productModel: {
      type: String,
    },
    performedBy: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: 'Main Warehouse',
    },
    notes: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SparePartTransaction', SparePartTransactionSchema);
