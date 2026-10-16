// // const mongoose = require('mongoose');

// // const packagingItemSchema = new mongoose.Schema({
// //   name: { 
// //     type: String, 
// //     required: true,
// //     trim: true
// //   },
// //   units: { 
// //     type: Number, 
// //     required: true,
// //     min: 0
// //   },
// //   image: { 
// //     type: String 
// //   },
// //   storeName: { 
// //     type: String, 
// //     required: true 
// //   },
// //   addedBy: { 
// //     type: String, 
// //     required: true 
// //   },
// //   addedDate: { 
// //     type: Date, 
// //     default: Date.now 
// //   },
// //   updatedBy: { 
// //     type: String 
// //   }
// // }, {
// //   timestamps: true
// // });

// // // Prevent model overwrite error
// // module.exports = mongoose.models.PackagingItem || mongoose.model('PackagingItem', packagingItemSchema);







// const mongoose = require('mongoose');

// const packagingItemSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, trim: true },
//     units: { type: Number, required: true, min: 0 },
//     image: { type: String },
//     storeName: { type: String, required: true },
//     addedBy: { type: String, required: true },
//     addedDate: { type: Date, default: Date.now },
//     updatedBy: { type: String },
//   },
//   { timestamps: true }
// );

// module.exports =
//   mongoose.models.PackagingItem ||
//   mongoose.model('PackagingItem', packagingItemSchema);
