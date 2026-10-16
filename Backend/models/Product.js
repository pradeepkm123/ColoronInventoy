// models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: String,
  productDescriptions: String,
  mrp: { type: Number, required: true },
  dealerPrice: { type: Number, required: true },
  uom: String,
  warranty: Number,
  category: String,
  subCategory: String,
  reorderLevel: Number,
  emailTo: String,
  productImage: String,
  stockStatus: {
    type: String,
    required: true,
    enum: ['In Stock', 'Out of Stock', 'Low Stock', 'Disposed', 'Clearance'],
    default: 'In Stock'
  },
  isSpare: { type: Boolean, default: false },
  isAccessory: { type: Boolean, default: false },
  expiryDate: { type: Date },
  batchNumber: { type: String },
  stockQuantity: { type: Number },
  clearanceDiscount: { type: Number, default: 0 },
  isDisposed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
