const mongoose = require('mongoose');

const SubCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  createdOn: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: Boolean,
    default: true,
  },
  image: {
    type: String,
  },
});

module.exports = mongoose.model('SubCategory', SubCategorySchema);
