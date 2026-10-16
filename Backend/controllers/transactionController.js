// controllers/transactionController.js
const Transaction = require('../models/Transaction');

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const round2 = (n) => Math.round(n * 100) / 100;

// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    let {
      storeId,
      customerId,
      storeName,
      customerName,
      modelNo,
      productName,
      quantity,
      unitPrice,
      value,
      type,
      reason,
      reference,
      location,
    } = req.body;

    // Basic required fields
    if (!storeName || !customerName || !modelNo) {
      return res.status(400).json({ message: 'storeName, customerName, and modelNo are required.' });
    }

    const q = toNumber(quantity);
    if (!Number.isFinite(q) || q < 1) {
      return res.status(400).json({ message: 'quantity must be a number >= 1.' });
    }

    // Normalize type
    const allowedTypes = new Set(['inward', 'outward', 'adjustment']);
    if (!type || !allowedTypes.has(type)) type = 'outward';

    // Determine unitPrice/value robustly
    let up = toNumber(unitPrice);
    let val = toNumber(value);

    if (!Number.isFinite(up) && Number.isFinite(val) && q > 0) {
      up = val / q;
    }
    if (!Number.isFinite(up)) up = 0;
    if (!Number.isFinite(val)) val = up * q;

    up = round2(up);
    val = round2(val);

    const tx = new Transaction({
      storeId,
      customerId,
      storeName: String(storeName).trim(),
      customerName: String(customerName).trim(),
      modelNo: String(modelNo).trim(),
      productName,
      quantity: q,
      unitPrice: up,
      value: val,
      type,
      reason,
      reference,
      location,
    });

    await tx.save();
    return res.status(201).json(tx);
  } catch (error) {
    console.error('createTransaction error:', error);
    return res.status(500).json({ message: error.message || 'Failed to create transaction' });
  }
};

// Fetch transactions (optionally by storeName/type/modelNo and date range)
exports.getTransactions = async (req, res) => {
  try {
    const {
      storeName,          // exact match
      type,               // inward | outward | adjustment
      modelNo,            // exact match
      from,               // ISO date or yyyy-mm-dd
      to,                 // ISO date or yyyy-mm-dd
      limit               // number
    } = req.query;

    const query = {};

    if (storeName) query.storeName = storeName;
    if (type) query.type = type;
    if (modelNo) query.modelNo = modelNo;

    // Date range on createdAt (inclusive)
    if (from || to) {
      query.createdAt = {};
      if (from) {
        const d = new Date(from);
        if (!isNaN(d)) query.createdAt.$gte = d;
      }
      if (to) {
        const d = new Date(to);
        if (!isNaN(d)) query.createdAt.$lte = d;
      }
    }

    const lim = Math.min(Math.max(parseInt(limit || '100', 10), 1), 500);

    const transactions = await Transaction
      .find(query)
      .sort({ createdAt: -1 })
      .limit(lim);

    return res.status(200).json(transactions);
  } catch (error) {
    console.error('getTransactions error:', error);
    return res.status(500).json({ message: error.message || 'Failed to fetch transactions' });
  }
};
