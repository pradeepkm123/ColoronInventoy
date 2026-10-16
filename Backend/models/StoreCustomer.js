const mongoose = require('mongoose');

const storeCustomerSchema = new mongoose.Schema({
  storeName: {
    type: String,
    required: [true, 'Store name is required']
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  gst: {
    type: String,
    trim: true,
    uppercase: true
  },
  address: {
    type: String,
    trim: true
  },
  mailId: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        if (!email) return true;
        return /^\S+@\S+\.\S+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  phoneNo: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(phone) {
        return /^[0-9]{10}$/.test(phone);
      },
      message: 'Phone number must be 10 digits'
    }
  },
  storeHandler: {
    type: String,
    trim: true
  },
}, {
  timestamps: true
});

// Compound index to prevent duplicate customers in the same store
storeCustomerSchema.index({ storeName: 1, customerName: 1 }, { unique: true });

module.exports = mongoose.model('StoreCustomer', storeCustomerSchema);
