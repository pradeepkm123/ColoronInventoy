const mongoose = require('mongoose');

const SparePartUsageSchema = new mongoose.Schema(
  {
    sparePartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SparePart',
      required: true,
      index: true,
    },
    sparePartCode: {
      type: String,
      required: true,
      index: true,
    },
    sparePartName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
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
    ticketNo: {
      type: String,
    },
    productModel: {
      type: String,
    },
    servicePerson: {
      type: String,
      required: true,
      index: true,
    },
    servicePersonId: {
      type: String,
    },
    actionType: {
      type: String,
      enum: ['REQUESTED', 'ISSUED', 'CONSUMED', 'RETURNED', 'STOCK_INWARD', 'STOCK_ADJUSTMENT'],
      default: 'CONSUMED',
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    unitCost: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      default: 'Service Center',
    },
    notes: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SparePartUsage', SparePartUsageSchema);
