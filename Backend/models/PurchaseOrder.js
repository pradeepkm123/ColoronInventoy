const mongoose = require('mongoose');

const PurchaseOrderSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  idealNo: { type: String, required: true, trim: true }, // e.g. "V1", "V2", "V3"
  idealSeq: { type: Number }, // 1, 2, 3...
  location: { type: String, trim: true },
  notes: { type: String },
  createdBy: { type: String }
}, {
  timestamps: true
});

// Index for fast company and ideal lookup
PurchaseOrderSchema.index({ companyName: 1, idealNo: 1 });

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
