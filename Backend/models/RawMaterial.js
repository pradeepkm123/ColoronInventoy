// const mongoose = require('mongoose');

// const RawMaterialSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   units: {
//     type: Number,
//     required: true,
//   },
//   addedDate: {
//     type: Date,
//     default: Date.now,
//   },
//   image: {
//     type: String,
//     default: null,
//   },
// });

// module.exports = mongoose.model('RawMaterial', RawMaterialSchema);


const mongoose = require('mongoose');

const RawMaterialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  units: {
    type: Number,
    required: [true, 'Units are required'],
    min: [0, 'Units cannot be negative'],
  },
  addedDate: {
    type: Date,
    default: Date.now,
  },
  image: {
    type: String,
    default: null,
  },
  userId: {
    type: String,
    required: [true, 'User ID is required'],
  },
  storeName: {
    type: String,
    required: [true, 'Store name is required'],
  },
});

module.exports = mongoose.model('RawMaterial', RawMaterialSchema);
