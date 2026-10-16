const mongoose = require('mongoose');

const PackagingItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  units: {
    type: Number,
    required: true,
  },
  addedDate: {
    type: Date,
    default: Date.now,
  },
  image: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model('PackagingItem', PackagingItemSchema);
