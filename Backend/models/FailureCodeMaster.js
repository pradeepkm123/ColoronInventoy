const mongoose = require('mongoose');

const FailureCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      default: 'HARDWARE',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    suggestedRepair: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FailureCodeMaster', FailureCodeSchema);
