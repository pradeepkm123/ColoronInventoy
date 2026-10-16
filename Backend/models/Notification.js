const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: [
        'INVENTORY',
        'COMMUNICATION',
        'AUTH',
        'SYSTEM',
        'general',
        'INWARD',
        'DISPATCH',
        'RECEIPT',
        'STOCK',
        'LOW_STOCK',
        'OUT_OF_STOCK',
        'SERVICE',
        'RMA',
      ],
      default: 'COMMUNICATION',
      trim: true,
    },
    // Sender Information
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    senderName: {
      type: String,
      default: '',
      trim: true,
    },
    senderEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    senderRole: {
      type: String,
      default: '',
      trim: true,
    },
    // Recipient Information (Role + Store based targeting)
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    recipientName: {
      type: String,
      default: '',
      trim: true,
    },
    recipientRole: {
      type: String,
      default: 'SUPER_ADMIN',
      trim: true,
    },
    // Store Context
    storeId: {
      type: String,
      default: '',
      trim: true,
    },
    // Product / Stock Context
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    modelNo: {
      type: String,
      default: '',
      trim: true,
    },
    // Legacy / User Compatibility Fields
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userName: {
      type: String,
      default: '',
      trim: true,
    },
    userEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    userRole: {
      type: String,
      default: 'Staff',
      trim: true,
    },
    userLocation: {
      type: String,
      default: '',
      trim: true,
    },
    actionText: {
      type: String,
      default: '',
      trim: true,
    },
    targetText: {
      type: String,
      default: '',
      trim: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      default: 'MESSAGE',
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    avatarInitials: {
      type: String,
      default: '',
    },
    avatarColor: {
      type: String,
      default: '#1976d2',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

// Pre-save hook to ensure read and isRead stay in sync
notificationSchema.pre('save', function (next) {
  if (this.read !== undefined && this.isRead === undefined) {
    this.isRead = this.read;
  } else if (this.isRead !== undefined && this.read === undefined) {
    this.read = this.isRead;
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
