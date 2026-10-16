const mongoose = require('mongoose');

const CartonBoxSchema = new mongoose.Schema({
  cartonNo: { type: String, required: true, unique: true, index: true },
  modelNo: { type: String, required: true, index: true },
  productType: { type: String, default: 'DOME CAMERA' },
  resolution: { type: String, default: '4MP' },
  lens: { type: String, default: '2.8 mm' },
  brand: { type: String, default: 'COLOR ON' },
  badgeType: { type: String, default: 'SMART HYBRID' }, // 'SMART HYBRID' | 'DUAL LIGHT'
  quantity: { type: Number, default: 20 },
  netWeight: { type: String, default: '6.07 KG' },
  grossWeight: { type: String, default: '6.82 KG' },
  serialNumbers: [{ type: String }],
  qrData: { type: String },
  barcode: { type: String },
  companyName: { type: String, default: 'Lookman Distribution Private limited' },
  addressLine1: { type: String, default: 'No.9/15, II Street Extn, III Main Road,' },
  addressLine2: { type: String, default: 'CIT Nagar, Nandanam, Chennai - 600 035.' },
  country: { type: String, default: 'MADE IN INDIA' },
  status: { type: String, default: 'PACKED' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CartonBox', CartonBoxSchema);
