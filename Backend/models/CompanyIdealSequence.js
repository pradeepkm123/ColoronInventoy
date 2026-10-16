const mongoose = require('mongoose');

const CompanyIdealSequenceSchema = new mongoose.Schema({
  companyNameKey: { type: String, required: true, unique: true, index: true }, // Normalized lowercase trimmed
  displayCompanyName: { type: String, required: true },
  lastIdealSeq: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CompanyIdealSequence', CompanyIdealSequenceSchema);
