const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true },
    role:          { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:      { type: String, required: true, select: false },
    // Optional location tags per role
    warehouseName:    { type: String, default: '' },  // Warehouse role
    serviceCenter:    { type: String, default: '' },  // Service Person role
    staffLocation:    { type: String, default: '' },  // Staff role
    customerStore:    { type: String, default: '' },  // Customer role
    assignedLocation: { type: String, default: '' },
    locationTag:      { type: String, default: '' },
    // Super Admin edit permission fields
    editPermissionStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected', 'expired'],
      default: 'none',
    },
    editPermissionRequestedAt: { type: Date },
    editPermissionGrantedAt:   { type: Date },
    editPermissionGrantedBy:   { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
