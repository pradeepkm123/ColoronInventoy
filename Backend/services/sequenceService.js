const mongoose = require('mongoose');

const SequenceSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, unique: true },
    dateKey: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const ServiceSequence = mongoose.models.ServiceSequence || mongoose.model('ServiceSequence', SequenceSchema);

const generateSequence = async (prefix) => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateKey = `${yy}${mm}${dd}`;
  const typeKey = `${prefix}_${dateKey}`;

  const counter = await ServiceSequence.findOneAndUpdate(
    { type: typeKey },
    { $inc: { seq: 1 }, $setOnInsert: { dateKey } },
    { new: true, upsert: true }
  );

  const seqStr = String(counter.seq).padStart(4, '0');
  return `${prefix}${dateKey}${seqStr}`;
};

const getNextTicketNo = () => generateSequence('SR');
const getNextRMANo = () => generateSequence('RMA');

module.exports = {
  getNextTicketNo,
  getNextRMANo,
};
