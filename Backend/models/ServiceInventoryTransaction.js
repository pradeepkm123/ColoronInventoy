const mongoose = require('mongoose');

const ServiceInventoryTransactionSchema = new mongoose.Schema(
  {
    transactionType: {
      type: String,
      enum: [
        'SERVICE_CHECK_IN',
        'SERVICE_CHECK_OUT',
        'SPARE_ISSUE',
        'SPARE_RETURN',
        'REPLACEMENT_ISSUE',
        'REPLACEMENT_DISPATCH',
        'PRODUCT_REPLACEMENT',
        'SCRAP_DISPOSAL',
      ],
      required: true,
      index: true,
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
    serviceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      index: true,
    },
    ticketNo: {
      type: String,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    modelNo: {
      type: String,
      required: true,
    },
    serialNumber: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    direction: {
      type: String,
      enum: ['IN', 'OUT'],
      required: true,
    },
    storeName: {
      type: String,
      default: 'Service Center',
      index: true,
    },
    performedBy: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model(
  'ServiceInventoryTransaction',
  ServiceInventoryTransactionSchema
);
