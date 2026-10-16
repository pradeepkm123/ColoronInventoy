const mongoose = require('mongoose');

const DispatchPendingReminderSchema = new mongoose.Schema({
  dispatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispatch', required: true },
  invoiceNumber: { type: String, default: '' },
  storeId: { type: String, default: '' },
  storeName: { type: String, default: '' },
  modelNo: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  barcodes: { type: [String], default: [] },
  type: { type: String, default: 'STOCK_INWARD_PENDING' },
  reminderCount: { type: Number, default: 0 },
  firstReminderAt: { type: Date, default: Date.now },
  lastReminderAt: { type: Date, default: Date.now },
  nextReminderAt: { type: Date },
  status: {
    type: String,
    enum: ['ACTION_REQUIRED', 'ESCALATED', 'RESOLVED'],
    default: 'ACTION_REQUIRED'
  },
  resolvedAt: { type: Date },
  completedBy: { type: String },
  resolutionDuration: { type: String },
  inwardId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreInward' },
}, {
  timestamps: true
});

DispatchPendingReminderSchema.index({ dispatchId: 1 });
DispatchPendingReminderSchema.index({ invoiceNumber: 1 });
DispatchPendingReminderSchema.index({ status: 1 });
DispatchPendingReminderSchema.index({ storeName: 1 });

module.exports = mongoose.model('DispatchPendingReminder', DispatchPendingReminderSchema);
