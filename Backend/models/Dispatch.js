const mongoose = require('mongoose');

const DispatchSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true },
  modelNo: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  salePerson: { type: String, required: true },
  barcodes: { type: [String], required: true },
  dispatchDate: { type: Date, default: Date.now },
  customerName: { type: String },
  customerAddress: { type: String },
  mailId: { type: String },
  storeName: { type: String },
  phoneNumber: { type: String },
  category: { type: String },
  subCategory: { type: String },
  gstNo: { type: String },
  customerType: { type: String },
  status: { type: String, default: 'Dispatched' }, // 'Dispatched', 'Received'
  receivedDate: { type: Date }
}, {
  timestamps: true
});

// Performance Indexes
DispatchSchema.index({ invoiceNumber: 1 });
DispatchSchema.index({ modelNo: 1 });
DispatchSchema.index({ storeName: 1 });
DispatchSchema.index({ status: 1 });
DispatchSchema.index({ barcodes: 1 });
DispatchSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Dispatch', DispatchSchema);
