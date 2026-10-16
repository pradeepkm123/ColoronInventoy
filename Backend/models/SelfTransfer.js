const mongoose = require('mongoose');

const SelfTransferSchema = new mongoose.Schema({
    modelNo: { type: String, required: true },
    fromOwner: { type: String, required: true },
    toOwner: { type: String, required: true },
    quantity: { type: Number, required: true },
    transferMethod: { type: String, required: true }, // "In Hand", "Courier", "Others"
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    subCategory: { type: String, default: '' },
    userId: { type: String, required: true },
    storeName: { type: String, required: true },
    productPrice: { type: Number, default: 0 },
    scannedBarcode: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SelfTransfer', SelfTransferSchema);
