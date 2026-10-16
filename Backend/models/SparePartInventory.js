const mongoose = require('mongoose');

const SparePartInventorySchema = new mongoose.Schema(
  {
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
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
    status: {
      type: String,
      enum: ['AVAILABLE', 'RESERVED', 'INSTALLED', 'DEFECTIVE', 'RETURNED', 'SCRAPPED'],
      default: 'AVAILABLE',
      index: true,
    },
    location: {
      type: String,
      default: 'Main Warehouse',
    },
    installedInRmaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RMA',
      index: true,
    },
    installedInRmaNo: {
      type: String,
      index: true,
    },
    installedInTicketNo: {
      type: String,
    },
    installedInProductModel: {
      type: String,
    },
    installedByTechnician: {
      type: String,
    },
    installedDate: {
      type: Date,
    },
    inwardBatchNo: {
      type: String,
    },
    inwardDate: {
      type: Date,
      default: Date.now,
    },
    unitCost: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SparePartInventory', SparePartInventorySchema);
