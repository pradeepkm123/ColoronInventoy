// models/CustomerModel.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: 'Lookman Distribution' },
    customerName: { type: String, required: true },
    mobileNumber: { type: String },
    phoneNo: { type: String },
    email: { type: String },
    mailId: { type: String },
    gstIdentificationNumber: { type: String },
    gstNo: { type: String },
    storeHandle: { type: String, default: 'General' },
    status: { type: Boolean, default: true }, // false = Inactive, true = Active
    profilePicture: { type: String }, // stored file path: "uploads/12345.png"
    address: { type: String },
    shippingSameAsBilling: { type: Boolean, default: true },
    billingAddress: {
      addressLine1: { type: String, default: '' },
      addressLine2: { type: String, default: '' },
      area: { type: String, default: '' },
      landmark: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pinCode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    shippingAddress: {
      addressLine1: { type: String, default: '' },
      addressLine2: { type: String, default: '' },
      area: { type: String, default: '' },
      landmark: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pinCode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
  },
  { timestamps: true }
);

// Virtual field to expose "Active"/"Inactive"
customerSchema.virtual('statusText').get(function () {
  return this.status ? 'Active' : 'Inactive';
});

// Ensure virtuals appear in JSON/Object outputs
customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Customer', customerSchema);
