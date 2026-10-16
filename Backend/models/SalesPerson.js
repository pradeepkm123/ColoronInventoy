const mongoose = require('mongoose');

const SalesPersonSchema = new mongoose.Schema({
  employeeName: {
    type: String,
    required: true,
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
  },
  location: {
    type: String,
    required: true,
  },
  mobileNo: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('SalesPerson', SalesPersonSchema);
