const mongoose = require('mongoose');

const SparePartSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true, // e.g. "Camera", "NVR / DVR", "PTZ"
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    unit: {
      type: String,
      default: 'PCS',
    },
    trackingType: {
      type: String,
      enum: ['SERIALIZED', 'QUANTITY'],
      default: 'SERIALIZED',
      index: true,
    },
    serialPrefix: {
      type: String,
      trim: true,
    },
    minimumStock: {
      type: Number,
      default: 5,
    },
    reorderLevel: {
      type: Number,
      default: 10,
    },
    purchaseCost: {
      type: Number,
      default: 0,
    },
    sellingPrice: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
    compatibleProductModels: [
      {
        type: String,
        trim: true,
      },
    ],
    compatibleProductIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    stockLocations: [
      {
        location: { type: String, default: 'Main Warehouse' },
        quantity: { type: Number, default: 0 },
      },
    ],
    totalStock: {
      type: Number,
      default: 0,
    },
    usedStock: {
      type: Number,
      default: 0,
    },
    availableStock: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Pre-save hook to calculate available and total stock
SparePartSchema.pre('save', function (next) {
  if (this.trackingType !== 'SERIALIZED') {
    if (Array.isArray(this.stockLocations) && this.stockLocations.length > 0) {
      this.totalStock = this.stockLocations.reduce((sum, loc) => sum + (Number(loc.quantity) || 0), 0);
    }
  }
  this.availableStock = Math.max(0, (this.totalStock || 0) - (this.usedStock || 0));
  next();
});

module.exports = mongoose.model('SparePart', SparePartSchema);
