const mongoose = require('mongoose');

const ModelSequenceSchema = new mongoose.Schema({
  modelNo: { type: String, required: true, unique: true, index: true },
  productType: { type: String },
  resolution: { type: String },
  lens: { type: String },
  dualLight: { type: Boolean, default: false },
  features: {
    dualLight: { type: Boolean, default: false },
    fullColor: { type: Boolean, default: false },
    ir: { type: Boolean, default: false },
    audio: { type: Boolean, default: false },
    ai: { type: Boolean, default: false }
  },
  barcodes: [{ type: String }],
  lastCount: { type: Number, default: 0 },
  startCount: { type: Number, default: 1 },
  lastStartCount: { type: Number, default: 1 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ModelSequence', ModelSequenceSchema);
