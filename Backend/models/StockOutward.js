// // const mongoose = require("mongoose");

// // const StockOutwardSchema = new mongoose.Schema(
// //   {
// //     modelNo: { type: String, required: true },
// //     quantity: { type: Number, required: true },
// //     userId: { type: String, required: true },
// //     storeName: { type: String, required: true },
// //     customerName: { type: String, required: true },
// //     customerMobile: { type: String, default: "" },
// //     customerAddress: { type: String, default: "" },
// //     scannedCodes: { type: String, default: "" },
// //     scannedList: [{ type: String }],
// //     price: { type: Number, default: 0 },
// //     salePerson: { type: String, default: "" },
// //   },
// //   { timestamps: true }
// // );

// // module.exports = mongoose.model("StockOutward", StockOutwardSchema);




// const mongoose = require("mongoose");

// const StockOutwardSchema = new mongoose.Schema(
//   {
//     modelNo: { type: String, required: true },
//     quantity: { type: Number, required: true },
//     userId: { type: String, required: true },
//     storeName: { type: String, required: true },
//     customerName: { type: String, required: true },
//     customerMobile: { type: String, default: "" },
//     customerAddress: { type: String, default: "" },
//     scannedCodes: { type: String, default: "" },
//     scannedList: [{ type: String }],
//     price: { type: Number, default: 0 },
//     salePerson: { type: String, default: "" },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("StockOutward", StockOutwardSchema);





// models/StockOutward.js
const mongoose = require('mongoose');

const StockOutwardSchema = new mongoose.Schema(
  {
    modelNo: { type: String, required: true },
    quantity: { type: Number, required: true },
    reason: { type: String, required: true },
    reference: { type: String, default: "N/A" },   // keep if you use reference
    userId: { type: String, required: true },
    storeName: { type: String, required: true },
    category: { type: String, default: "" },
    subCategory: { type: String, default: "" },

    // ✅ New fields
    customerName: { type: String, required: true },
    customerMobile: { type: String, default: "" },
    customerAddress: { type: String, default: "" },
    scannedCodes: { type: String, default: "" },
    scannedList: [{ type: String }],
    price: { type: Number, default: 0 },
    salePerson: { type: String, default: "" },
    owner: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockOutward', StockOutwardSchema);
