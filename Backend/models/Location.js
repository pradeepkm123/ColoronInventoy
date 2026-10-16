const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  locationName: { type: String, required: true },
  createdOn: { type: Date, default: Date.now },
  status: { type: Boolean, default: true },
});

module.exports = mongoose.model('Location', LocationSchema);
