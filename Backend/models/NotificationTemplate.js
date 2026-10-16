const mongoose = require('mongoose');

const NotificationTemplateSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    smsTemplate: {
      type: String,
      default: '',
    },
    whatsappTemplate: {
      type: String,
      default: '',
    },
    emailSubject: {
      type: String,
      default: '',
    },
    emailBody: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NotificationTemplate', NotificationTemplateSchema);
