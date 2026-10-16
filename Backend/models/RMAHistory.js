const mongoose = require('mongoose');

const RMAHistorySchema = new mongoose.Schema(
  {
    rmaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RMA',
      required: true,
      index: true,
    },
    rmaNo: {
      type: String,
      required: true,
      index: true,
    },
    serviceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      index: true,
    },
    ticketNo: {
      type: String,
      index: true,
    },
    action: {
      type: String,
      required: true,
    },
    fromStatus: {
      type: String,
    },
    toStatus: {
      type: String,
    },
    userId: {
      type: String,
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      default: 'STORE_USER',
    },
    notes: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('RMAHistory', RMAHistorySchema);
