// const mongoose = require('mongoose');

// const ServiceSchema = new mongoose.Schema(
//   {
//     serviceId: { type: String, required: true, unique: true },
//     serialNo: { type: String, required: true },
//     modelNo: { type: String, required: true },
//     warrantyStatus: {
//       type: String,
//       enum: ['Under Warranty', 'Out of Warranty', 'Extended Warranty'],
//       default: 'Under Warranty',
//     },
//     receivedDate: { type: Date, required: true },
//     customerName: { type: String, required: true },
//     customerPhone: { type: String, required: true },
//     customerAddress: { type: String, required: true },
//     problemDescription: { type: String, required: true },
//     productImage: { type: String, default: null },
//     status: { type: String, default: 'PENDING' },
//     storeName: { type: String }, // 🏪 Added
//     createdBy: { type: String }, // 👤 Added
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model('Service', ServiceSchema);



const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema(
  {
    serviceId: { type: String, required: true, unique: true },
    serialNo: { type: String, required: true },
    modelNo: { type: String, required: true },
    warrantyStatus: {
      type: String,
      enum: ['Under Warranty', 'Out of Warranty', 'Extended Warranty'],
      default: 'Under Warranty',
    },
    receivedDate: { type: Date, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String, required: true },
    problemDescription: { type: String, required: true },
    productImage: { type: String, default: null },
    status: { type: String, default: 'PENDING' },
    storeName: { type: String, required: true }, // 🏪 Updated: required
    createdBy: { type: String, required: true }, // 👤 Updated: required
    dispatchStatus: { type: String, default: "Not Dispatched" },
    paymentAmount: { type: String, default: 'Not Processed' },
    quantity: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', ServiceSchema);
