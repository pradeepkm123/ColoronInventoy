// /models/Brand.js
const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  createdOn: { type: Date, default: Date.now },
  status: { type: Boolean, default: true },
});

module.exports = mongoose.model('Brand', BrandSchema);
