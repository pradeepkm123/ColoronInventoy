// const Inventory = require('../models/Inventory');

// // ✅ Create new inventory record
// exports.createInventory = async (req, res) => {
//   try {
//     const {
//       modelNo,
//       location,
//       quantity,
//       shd,
//       scannedCodes,
//       brand,
//       dealerPrice,
//       mrp,
//       model,
//       subCategory,
//       category,
//       currentStock
//     } = req.body;

//     const inventory = new Inventory({
//       modelNo,
//       location,
//       quantity: Number(quantity),
//       shd,
//       scannedCodes,
//       brand,
//       dealerPrice: Number(dealerPrice),
//       mrp: Number(mrp),
//       model,
//       subCategory,
//       category,
//       currentStock: Number(currentStock),
//     });

//     await inventory.save();
//     res.status(201).send(inventory);
//   } catch (error) {
//     res.status(400).send({ message: error.message });
//   }
// };

// // ✅ Get all inventory records
// exports.getInventories = async (req, res) => {
//   try {
//     const inventories = await Inventory.find();
//     res.send(inventories);
//   } catch (error) {
//     res.status(500).send({ message: error.message });
//   }
// };

// // ✅ Update inventory record
// exports.updateInventory = async (req, res) => {
//   try {
//     const inventory = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!inventory) return res.status(404).send({ message: "Not found" });
//     res.send(inventory);
//   } catch (error) {
//     res.status(400).send({ message: error.message });
//   }
// };

// // ✅ Delete inventory record
// exports.deleteInventory = async (req, res) => {
//   try {
//     const inventory = await Inventory.findByIdAndDelete(req.params.id);
//     if (!inventory) return res.status(404).send({ message: "Not found" });
//     res.send(inventory);
//   } catch (error) {
//     res.status(500).send({ message: error.message });
//   }
// };

const Inventory = require('../models/Inventory');
const Warranty = require('../models/Warranty');
const Product = require('../models/Product'); // To lookup productId if needed
const ModelSequence = require('../models/ModelSequence');
const Accessory = require('../models/Accessory');

// ✅ Create new inventory record
exports.createInventory = async (req, res) => {
  try {
    const {
      modelNo,
      location,
      quantity,
      shd,
      scannedCodes,
      brand,
      dealerPrice,
      mrp,
      model,
      subCategory,
      category,
      currentStock,
      warrantyPeriod,
      warrantyUnit,
      isSpare,
      isAccessory,
    } = req.body;

    const inventory = new Inventory({
      modelNo,
      location,
      quantity: Number(quantity),
      shd,
      scannedCodes,
      brand,
      dealerPrice: Number(dealerPrice),
      mrp: Number(mrp),
      model,
      subCategory,
      category,
      currentStock: Number(currentStock),
      isSpare: !!isSpare,
      isAccessory: !!isAccessory,
    });

    await inventory.save();

    // 🔌 Auto-sync with Accessory collection if marked as Accessory
    try {
      if (isAccessory || (category && category.toLowerCase().includes('accessor')) || (subCategory && subCategory.toLowerCase().includes('accessor'))) {
        const accName = modelNo || model || 'Accessory';
        const regexName = new RegExp(`^${accName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        const existingAcc = await Accessory.findOne({ name: regexName });
        const addQty = Number(quantity) || 0;
        const itemPrice = Number(dealerPrice || mrp || pricePerUnit || 0);

        if (existingAcc) {
          existingAcc.stock = (Number(existingAcc.stock) || 0) + addQty;
          if (itemPrice > 0) existingAcc.price = itemPrice;
          if (brand) existingAcc.brand = brand;
          existingAcc.status = true;
          await existingAcc.save();
        } else {
          await Accessory.create({
            name: accName,
            sku: shd || (scannedCodes && scannedCodes.split(',')[0]) || '',
            category: category || 'Accessories',
            brand: brand || '',
            price: itemPrice,
            stock: addQty,
            description: `${accName} inwarded to ${location || 'Inventory'}`,
            status: true
          });
        }
      }
    } catch (accErr) {
      console.warn('Accessory sync warning:', accErr.message);
    }

    // Create individual serial item records in Warranty collection
    if (scannedCodes && typeof scannedCodes === 'string' && scannedCodes.trim() !== '') {
      const codes = scannedCodes.split(',').map(c => c.trim()).filter(Boolean);
      
      // Look up productId for these items
      const product = await Product.findOne({ model: modelNo });
      
      const warrantyRecords = codes.map(code => ({
        barcode: code,
        serialNumber: code,
        productId: product ? product._id : undefined,
        productName: model,
        modelNo: modelNo,
        inwardId: inventory._id,
        currentWarehouseId: location,
        stockStatus: 'IN_STOCK',
        warrantyPeriod: Number(warrantyPeriod) || 0,
        warrantyUnit: warrantyUnit || 'YEARS',
        status: 'NOT_STARTED',
        warrantyStartDate: null,
        warrantyEndDate: null
      }));
      
      if (warrantyRecords.length > 0) {
        await Warranty.insertMany(warrantyRecords);
      }
    }

    // 🔔 Stock Level Notification Check
    try {
      const { notifyAdminOnStockLevel } = require('../services/inventoryNotificationService');
      const curStock = Number(inventory.currentStock !== undefined ? inventory.currentStock : inventory.quantity);
      if (curStock <= 5) {
        await notifyAdminOnStockLevel({
          modelNo: inventory.modelNo || inventory.model || 'Product',
          storeName: inventory.location || 'Central Warehouse',
          currentQuantity: curStock,
          minStock: 5,
        });
      }
    } catch (notifErr) {
      console.warn('Inventory stock notification warning:', notifErr.message);
    }

    res.status(201).send(inventory);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

// ✅ Get all inventory records
exports.getInventories = async (req, res) => {
  try {
    const inventories = await Inventory.find().lean();
    res.send(inventories);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// ✅ Update inventory record
exports.updateInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!inventory) return res.status(404).send({ message: "Not found" });

    // 🔔 Stock Level Notification Check
    try {
      const { notifyAdminOnStockLevel } = require('../services/inventoryNotificationService');
      const curStock = Number(inventory.currentStock !== undefined ? inventory.currentStock : inventory.quantity);
      if (curStock <= 5) {
        await notifyAdminOnStockLevel({
          modelNo: inventory.modelNo || inventory.model || 'Product',
          storeName: inventory.location || 'Central Warehouse',
          currentQuantity: curStock,
          minStock: 5,
        });
      }
    } catch (notifErr) {
      console.warn('Inventory stock notification warning:', notifErr.message);
    }

    res.send(inventory);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

// ✅ Delete inventory record
exports.deleteInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id);
    if (!inventory) return res.status(404).send({ message: "Not found" });
    res.send(inventory);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// ✅ Check barcode array for duplicate records
exports.checkBarcodes = async (req, res) => {
  try {
    const { barcodes } = req.body;
    if (!barcodes || !Array.isArray(barcodes) || barcodes.length === 0) {
      return res.status(400).json({ message: "Invalid or empty barcode list provided" });
    }

    // Check Warranty collection
    const existingWarranties = await Warranty.find({ barcode: { $in: barcodes } }).select('barcode');
    const warrantyCodes = existingWarranties.map(w => w.barcode);

    // Check ModelSequence collection
    const existingModelSeqs = await ModelSequence.find({ barcodes: { $in: barcodes } }).select('barcodes');
    const modelSeqCodes = [];
    existingModelSeqs.forEach(ms => {
      if (Array.isArray(ms.barcodes)) {
        ms.barcodes.forEach(bc => {
          if (barcodes.includes(bc) && !modelSeqCodes.includes(bc)) {
            modelSeqCodes.push(bc);
          }
        });
      }
    });

    // Also check Inventory scannedCodes (contains comma-separated barcodes)
    const existingInventories = await Inventory.find({}).select('scannedCodes');
    const inventoryCodes = [];
    existingInventories.forEach(inv => {
      if (inv.scannedCodes) {
        const codes = inv.scannedCodes.split(',').map(c => c.trim());
        codes.forEach(c => {
          if (barcodes.includes(c) && !inventoryCodes.includes(c)) {
            inventoryCodes.push(c);
          }
        });
      }
    });

    const duplicates = Array.from(new Set([...warrantyCodes, ...modelSeqCodes, ...inventoryCodes]));

    if (duplicates.length > 0) {
      return res.json({
        exists: true,
        existingBarcodes: duplicates,
        message: `Barcode range already exists (${duplicates.length} duplicate(s) found). Please enter the next available barcode.`
      });
    }

    res.json({ exists: false, existingBarcodes: [] });
  } catch (error) {
    console.error('Error checking barcodes:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Save batch sticker label generated barcodes & sequence count (WITHOUT creating Recent Inward / Inventory entry)
exports.saveBatchStickers = async (req, res) => {
  try {
    const {
      modelNo,
      productType,
      resolution,
      lens,
      dualLight,
      features,
      startCount,
      quantity: reqQuantity,
      barcodes
    } = req.body;

    if (!barcodes || !Array.isArray(barcodes) || barcodes.length === 0) {
      return res.status(400).json({ message: "No barcodes provided for sticker batch" });
    }

    const targetModel = (modelNo || 'CO-I-2BFDML(V)').trim();
    const quantity = Number(reqQuantity) || barcodes.length;
    const startCountNum = Number(startCount) || 1;

    // 1. Calculate max sequence number in this batch
    let maxSeqInBatch = 0;
    const escapedModel = targetModel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escapedModel}\\d{6}(\\d+)$`);
    barcodes.forEach(code => {
      const match = code.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeqInBatch) {
          maxSeqInBatch = num;
        }
      }
    });

    if (maxSeqInBatch === 0) {
      maxSeqInBatch = startCountNum + quantity - 1;
    }

    // 2. Update ModelSequence continuous counter and barcodes list (stores all generated serial barcodes)
    const updatedSeq = await ModelSequence.findOneAndUpdate(
      { modelNo: targetModel },
      {
        $max: { lastCount: maxSeqInBatch },
        $addToSet: { barcodes: { $each: barcodes } },
        $set: {
          startCount: startCountNum,
          lastStartCount: startCountNum,
          productType: productType || 'IP BULLET CAMERA',
          resolution: resolution || '2MP',
          lens: lens || '3.6mm',
          dualLight: Boolean(dualLight || features?.dualLight),
          features: features || {
            dualLight: Boolean(dualLight),
            fullColor: false,
            ir: false,
            audio: false,
            ai: false
          },
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    // 3. Lookup Product if existing
    const product = await Product.findOne({ model: targetModel });

    // 4. Save individual serial barcodes to Warranty (without creating Inventory / Recent Inward entry)
    const warrantyOps = barcodes.map(code => ({
      updateOne: {
        filter: { $or: [{ barcode: code }, { serialNumber: code }] },
        update: {
          $setOnInsert: {
            barcode: code,
            serialNumber: code,
            productId: product ? product._id : undefined,
            productName: `${productType || 'IP BULLET CAMERA'} ${targetModel}`,
            modelNo: targetModel,
            brand: 'COLOR ON',
            category: product?.category || 'Cameras',
            subCategory: product?.subCategory || 'IP Cameras',
            stockStatus: 'IN_STOCK',
            currentStatus: 'IN_STOCK',
            status: 'NOT_STARTED',
            createdAt: new Date()
          }
        },
        upsert: true
      }
    }));

    if (warrantyOps.length > 0) {
      await Warranty.bulkWrite(warrantyOps);
    }

    // 5. Clean up any accidental previous test records in Inventory created with location: 'Barcode Print Station'
    try {
      await Inventory.deleteMany({ location: 'Barcode Print Station' });
    } catch (cleanErr) {
      console.warn('Inventory clean up notice:', cleanErr.message);
    }

    const nextCount = (updatedSeq?.lastCount || maxSeqInBatch) + 1;

    res.status(200).json({
      success: true,
      modelNo: targetModel,
      count: quantity,
      startCount: startCountNum,
      lastCount: updatedSeq?.lastCount || maxSeqInBatch,
      nextCount: nextCount,
      message: `Successfully saved ${quantity} serial barcodes and updated sequence counter to #${nextCount} for ${targetModel} (Recent Inward bypassed).`
    });
  } catch (error) {
    console.error('Error saving sticker batch:', error);
    res.status(400).json({ message: error.message });
  }
};

// ✅ Find next available sequence count for a given Model Number (Option A: continuous per-model counter)
exports.getNextSequence = async (req, res) => {
  try {
    const { modelNo, prefix } = req.body;
    const targetModel = (modelNo || (prefix ? prefix.replace(/\d{6}$/, '') : '')).trim();

    if (!targetModel) {
      return res.status(400).json({ message: "Model number or prefix is required" });
    }

    // Check ModelSequence document in database (primary authority for model counter)
    const modelSeqDoc = await ModelSequence.findOne({ modelNo: targetModel });
    let maxSeq = modelSeqDoc ? (modelSeqDoc.lastCount || 0) : 0;

    const nextSeq = maxSeq + 1;
    const nextSeqPadded = String(nextSeq).length < 3 ? String(nextSeq).padStart(3, '0') : String(nextSeq);

    res.json({
      modelNo: targetModel,
      lastCount: maxSeq,
      startCount: modelSeqDoc?.startCount || (maxSeq === 0 ? 1 : nextSeq),
      nextCount: nextSeq,
      nextSeq,
      nextSeqPadded,
      productType: modelSeqDoc ? modelSeqDoc.productType : null,
      resolution: modelSeqDoc ? modelSeqDoc.resolution : null,
      lens: modelSeqDoc ? modelSeqDoc.lens : null,
      features: modelSeqDoc ? modelSeqDoc.features : null
    });
  } catch (error) {
    console.error('Error fetching next sequence:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Reset sequence count for a given Model Number back to 0 (so next count is 1)
exports.resetSequence = async (req, res) => {
  try {
    const { modelNo } = req.body;
    if (!modelNo) {
      return res.status(400).json({ message: "Model number is required" });
    }
    const targetModel = modelNo.trim();
    await ModelSequence.findOneAndUpdate(
      { modelNo: targetModel },
      { $set: { lastCount: 0, startCount: 1, barcodes: [], updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    // Remove old test barcodes for this model so restarting at 1 is 100% duplicate-free
    const escapedModel = targetModel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await Warranty.deleteMany({ barcode: new RegExp(`^${escapedModel}`) });
    await Inventory.deleteMany({ scannedCodes: new RegExp(`^${escapedModel}`) });

    res.json({
      success: true,
      modelNo: targetModel,
      lastCount: 0,
      startCount: 1,
      nextCount: 1,
      nextSeqPadded: '001',
      message: `Sequence for ${targetModel} reset to start at 1.`
    });
  } catch (error) {
    console.error('Error resetting sequence:', error);
    res.status(500).json({ message: error.message });
  }
};


