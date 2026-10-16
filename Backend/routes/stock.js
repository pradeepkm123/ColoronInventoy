import { Router } from 'express';
import mongoose from 'mongoose';
import Inventory from '../models/Inventory.js';
import StockMovement from '../models/StockMovement.js';

const router = Router();

/**
 * POST /api/stock/outward
 * Body: { storeName, customerName, modelNo, quantity, value?, reason?, reference?, productName?, inventoryId? }
 * Returns: created movement
 */
router.post('/outward', async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      storeName,
      customerName,
      modelNo,
      quantity,
      value,          // optional; computed if missing
      reason,
      reference,
      productName,
      inventoryId
    } = req.body;

    if (!storeName || !customerName || !modelNo || !Number(quantity)) {
      throw new Error('storeName, customerName, modelNo, quantity are required');
    }

    // Locate inventory record (by id or by (storeName, modelNo))
    const inv = await Inventory.findOne(
      inventoryId ? { _id: inventoryId } : { storeName, modelNo }
    ).session(session);

    if (!inv) throw new Error('Inventory record not found');

    const currentQty = Number(inv.quantity ?? inv.stock ?? 0);
    const q = Number(quantity);
    if (q < 1) throw new Error('Quantity must be >= 1');
    if (q > currentQty) throw new Error(`Insufficient stock. Available: ${currentQty}`);

    // Compute unit price (fallback across common fields)
    const unitPrice =
      inv.unitPrice ??
      inv.value ??
      inv.price ??
      inv.mrp ??
      inv.dealerPrice ??
      0;

    const totalValue = Number.isFinite(Number(value)) ? Number(value) : q * Number(unitPrice);

    // Create movement
    const [movement] = await StockMovement.create([{
      direction: 'outward',
      storeName,
      customerName,
      modelNo,
      productName: productName ?? inv.productName ?? modelNo,
      quantity: q,
      value: totalValue,
      reason,
      reference,
      inventoryId: inv._id
    }], { session });

    // Decrement inventory atomically
    inv.quantity = Math.max(0, currentQty - q);
    inv.stock = Math.max(0, Number(inv.stock ?? inv.quantity) - q);
    await inv.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(movement);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
});

/**
 * Optional: GET /api/stock/movements?storeName=...&modelNo=...
 */
router.get('/movements', async (req, res, next) => {
  try {
    const { storeName, modelNo, direction } = req.query;
    const filter = {};
    if (storeName) filter.storeName = storeName;
    if (modelNo) filter.modelNo = modelNo;
    if (direction) filter.direction = direction;

    const rows = await StockMovement.find(filter).sort({ createdAt: -1 });
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
