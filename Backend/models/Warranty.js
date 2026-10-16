const mongoose = require('mongoose');

const warrantySchema = new mongoose.Schema({
  serialNumber: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  barcode: {
    type: String,
    index: true,
    trim: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  productName: {
    type: String,
    default: ''
  },
  modelNo: {
    type: String,
    default: ''
  },
  brand: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: ''
  },
  subCategory: {
    type: String,
    default: ''
  },
  currentStatus: {
    type: String,
    enum: ['IN_STOCK', 'DISPATCHED', 'IN_TRANSIT', 'STORE_RECEIVED', 'SOLD', 'RETURNED', 'REPLACED', 'SERVICE', 'SCRAPPED', 'REPLACEMENT_DISPATCHED', 'RESERVED_FOR_RMA', 'ACTIVE_WITH_CUSTOMER'],
    default: 'IN_STOCK'
  },
  currentLocation: {
    type: String,
    default: ''
  },
  inward: {
    date: { type: Date },
    invoiceNo: { type: String, default: '' },
    location: { type: String, default: '' }
  },
  supplierWarranty: {
    period: { type: Number, default: 24 },
    periodUnit: { type: String, enum: ['DAYS', 'MONTHS', 'YEARS'], default: 'MONTHS' },
    startDate: { type: Date },
    endDate: { type: Date }
  },
  dispatch: {
    date: { type: Date },
    dispatchNo: { type: String, default: '' },
    destinationStore: { type: String, default: '' },
    salesPerson: { type: String, default: '' }
  },
  storeInward: {
    date: { type: Date },
    storeName: { type: String, default: '' }
  },
  sale: {
    sold: { type: Boolean, default: false },
    date: { type: Date },
    invoiceNo: { type: String, default: '' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, default: '' },
    customerMobile: { type: String, default: '' },
    customerAddress: { type: String, default: '' },
    salePerson: { type: String, default: '' },
    price: { type: Number, default: 0 }
  },
  customerWarranty: {
    period: { type: Number, default: 24 },
    periodUnit: { type: String, enum: ['DAYS', 'MONTHS', 'YEARS'], default: 'MONTHS' },
    startDate: { type: Date },
    endDate: { type: Date }
  },
  // Legacy / convenience fields
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  invoiceNumber: {
    type: String
  },
  purchaseDate: {
    type: Date
  },
  warrantyPeriod: {
    type: Number,
    default: 24
  },
  warrantyUnit: {
    type: String,
    enum: ['DAYS', 'MONTHS', 'YEARS'],
    default: 'MONTHS'
  },
  inwardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory'
  },
  currentWarehouseId: {
    type: String
  },
  stockStatus: {
    type: String,
    enum: ['IN_STOCK', 'DISPATCHED', 'IN_TRANSIT', 'STORE_RECEIVED', 'SOLD', 'RETURNED', 'REPLACED', 'SERVICE', 'SCRAPPED', 'TRANSFERRED', 'REPLACEMENT_DISPATCHED', 'RESERVED_FOR_RMA', 'ISSUED_FOR_REPLACEMENT'],
    default: 'IN_STOCK'
  },
  warrantyStartDate: {
    type: Date
  },
  warrantyEndDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['NOT_STARTED', 'IN_WARRANTY', 'ACTIVE', 'EXPIRED', 'VOID', 'PENDING', 'REPLACED'],
    default: 'NOT_STARTED'
  },
  notes: {
    type: String,
    default: ''
  },
  replacement: {
    isReplacement: { type: Boolean, default: false },
    isOriginalReplaced: { type: Boolean, default: false },
    rmaId: { type: mongoose.Schema.Types.ObjectId, ref: 'RMA' },
    rmaNumber: { type: String, default: '' },
    replacesSerialNumber: { type: String, default: '' },
    replacedBySerialNumber: { type: String, default: '' },
    defectiveModel: { type: String, default: '' },
    replacementModel: { type: String, default: '' },
    replacementSerial: { type: String, default: '' },
    customerName: { type: String, default: '' },
    customerMobile: { type: String, default: '' },
    customerAddress: { type: String, default: '' },
    storeName: { type: String, default: '' },
    replacementDate: { type: Date },
    replacementSource: { type: String, default: '2% Warranty Spares Inventory' },
    qcStatus: { type: String, default: 'PASSED' },
    dispatchStatus: { type: String, default: 'DISPATCHED' },
    dispatchedAt: { type: Date },
    inheritedWarrantyStartDate: { type: Date },
    inheritedWarrantyEndDate: { type: Date }
  }
}, { timestamps: true });

const Warranty = mongoose.model('Warranty', warrantySchema);

module.exports = Warranty;

