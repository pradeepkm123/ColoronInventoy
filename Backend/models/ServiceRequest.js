const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema(
  {
    ticketNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    storeName: {
      type: String,
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerSnapshot: {
      name: { type: String, required: true },
      mobile: { type: String, required: true, index: true },
      whatsapp: { type: String },
      email: { type: String },
      address: { type: String },
      city: { type: String },
      pincode: { type: String },
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    modelNo: {
      type: String,
      required: true,
      index: true,
    },
    productType: {
      type: String,
    },
    category: {
      type: String,
    },
    subCategory: {
      type: String,
    },
    serialNumber: {
      type: String,
      required: true,
      index: true,
    },
    purchaseDate: {
      type: Date,
    },
    invoiceNo: {
      type: String,
    },
    dealerName: {
      type: String,
    },
    warranty: {
      status: {
        type: String,
        enum: ['IN_WARRANTY', 'OUT_OF_WARRANTY', 'EXTENDED_WARRANTY', 'EXPIRED', 'UNKNOWN', 'NOT_INWARDED'],
        default: 'IN_WARRANTY',
      },
      expiryDate: { type: Date },
      warrantyPeriodMonths: { type: Number, default: 24 },
    },
    accessories: {
      type: [String],
      default: [],
    },
    complaint: {
      category: { type: String, required: true },
      description: { type: String, required: true },
    },
    attachments: {
      type: [String],
      default: [],
    },
    currentStatus: {
      type: String,
      enum: [
        'SERVICE_REQUEST_CREATED',
        'WAITING_FOR_PRODUCT',
        'PRODUCT_RECEIVED',
        'IN_SERVICE',
        'READY_FOR_DISPATCH',
        'DISPATCHED',
        'DELIVERED',
        'CANCELLED',
        'CLOSED',
      ],
      default: 'SERVICE_REQUEST_CREATED',
      index: true,
    },
    rmaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RMA',
    },
    rmaNo: {
      type: String,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);
