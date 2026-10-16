const StoreInward = require('../models/StoreInward');
const StockOutward = require('../models/StockOutward');
const Product = require('../models/Product');
const Dispatch = require('../models/Dispatch');
const Warranty = require('../models/Warranty');
const Accessory = require('../models/Accessory');

// Helper to update Warranty items when stock is received at Store
const syncStoreInwardWarranty = async (barcodes, modelNo, storeName) => {
  if (!barcodes) return;
  const codes = Array.isArray(barcodes) ? barcodes : String(barcodes).split(',').map(b => b.trim()).filter(Boolean);
  const now = new Date();

  for (const code of codes) {
    if (!code) continue;
    let warrantyItem = await Warranty.findOne({
      $or: [{ barcode: code }, { serialNumber: code }]
    });

    if (!warrantyItem) {
      warrantyItem = new Warranty({
        serialNumber: code,
        barcode: code,
        modelNo: modelNo,
        productName: modelNo
      });
    }

    warrantyItem.currentStatus = 'STORE_RECEIVED';
    warrantyItem.stockStatus = 'STORE_RECEIVED';
    warrantyItem.currentLocation = storeName || warrantyItem.currentLocation || 'Store';
    warrantyItem.storeInward = {
      date: now,
      storeName: storeName || ''
    };
    if (warrantyItem.status !== 'IN_WARRANTY' && warrantyItem.status !== 'EXPIRED') {
      warrantyItem.status = 'NOT_STARTED';
    }

    await warrantyItem.save();
  }
};

// ➕ Create Store Inward
exports.createStoreInward = async (req, res) => {
  try {
    const {
      dispatchId,
      invoiceNumber,
      modelNo,
      quantity,
      scanningCode,
      scannedBarcode,
      userId,
      storeName,
      brand,
      dealerPrice,
      mrp,
      model,
      subCategory,
      category,
      currentStock,
      pricePerUnit,
      salePerson,
      owner,
      isAccessory,
    } = req.body;

    const effectiveModelNo = modelNo || model;
    const effectiveStoreName = storeName || owner;

    if (!effectiveModelNo || !quantity || !effectiveStoreName) {
      return res.status(400).json({ success: false, error: 'modelNo, quantity, and storeName are required' });
    }

    const storeInward = new StoreInward({
      modelNo: effectiveModelNo,
      quantity,
      scanningCode,
      scannedBarcode: scannedBarcode || [],
      userId: userId || 'Store User',
      storeName: effectiveStoreName,
      brand: brand || '',
      dealerPrice: dealerPrice || 0,
      mrp: mrp || 0,
      model: model || effectiveModelNo,
      subCategory: subCategory || '',
      category: category || '',
      currentStock: currentStock || 0,
      pricePerUnit: pricePerUnit || 0,
      salePerson: salePerson || '',
      owner: owner || effectiveStoreName,
      isAccessory: !!isAccessory,
    });

    await storeInward.save();

    // 🔌 Auto-sync with Accessory collection if marked as Accessory
    try {
      if (isAccessory || (category && category.toLowerCase().includes('accessor')) || (subCategory && subCategory.toLowerCase().includes('accessor'))) {
        const accName = effectiveModelNo || 'Accessory';
        const regexName = new RegExp(`^${accName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        const existingAcc = await Accessory.findOne({ name: regexName });
        const addQty = Number(quantity) || 0;
        const itemPrice = Number(pricePerUnit || dealerPrice || mrp || 0);

        if (existingAcc) {
          existingAcc.stock = (Number(existingAcc.stock) || 0) + addQty;
          if (itemPrice > 0) existingAcc.price = itemPrice;
          if (brand) existingAcc.brand = brand;
          existingAcc.status = true;
          await existingAcc.save();
        } else {
          const skuCode = (Array.isArray(scannedBarcode) ? scannedBarcode[0] : (typeof scannedBarcode === 'string' ? scannedBarcode.split(',')[0] : '')) || '';
          await Accessory.create({
            name: accName,
            sku: skuCode || scanningCode || '',
            category: category || 'Accessories',
            brand: brand || '',
            price: itemPrice,
            stock: addQty,
            description: `${accName} inwarded to ${effectiveStoreName}`,
            status: true
          });
        }
      }
    } catch (accErr) {
      console.warn('Accessory sync warning:', accErr.message);
    }

    // If linked to a Dispatch, update Dispatch status to Received
    let dispatchDoc = null;
    if (dispatchId) {
      dispatchDoc = await Dispatch.findById(dispatchId);
    } else if (invoiceNumber) {
      dispatchDoc = await Dispatch.findOne({ invoiceNumber });
    } else {
      // Find matching dispatch by modelNo and storeName
      dispatchDoc = await Dispatch.findOne({
        modelNo: effectiveModelNo,
        status: { $ne: 'Received' }
      }).sort({ createdAt: -1 });
    }

    if (dispatchDoc) {
      dispatchDoc.status = 'Received';
      dispatchDoc.receivedDate = new Date();
      await dispatchDoc.save();
    }

    // Sync Warranty items to STORE_RECEIVED (WARRANTY NOT STARTED)
    await syncStoreInwardWarranty(scannedBarcode, effectiveModelNo, effectiveStoreName);

    // Update Product stock quantity
    const product = await Product.findOne({ modelNo: effectiveModelNo });
    let newQuantity = Number(quantity);
    if (product) {
      newQuantity = product.quantity + Number(quantity);
      await Product.findOneAndUpdate(
        { modelNo: effectiveModelNo },
        {
          quantity: newQuantity,
          stockStatus: newQuantity > 5 ? 'In Stock' : 'Low Stock',
        },
        { new: true }
      );
    }

    // 🔔 Notify Super Admin of Store Inward with S/N Verification & Low Stock Check
    try {
      const { notifyAdminOnStoreInward, notifyAdminOnStockLevel } = require('../services/inventoryNotificationService');
      await notifyAdminOnStoreInward({
        storeName: effectiveStoreName,
        dispatchDoc,
        inwardDoc: storeInward,
        scannedBarcodes: scannedBarcode || []
      });
      await notifyAdminOnStockLevel({
        modelNo: effectiveModelNo,
        storeName: effectiveStoreName,
        currentQuantity: newQuantity
      });
    } catch (notifErr) {
      console.warn('Store inward notification warning:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Store inward recorded successfully and status updated',
      data: storeInward,
      dispatch: dispatchDoc
    });
  } catch (error) {
    console.error('❌ Error in createStoreInward:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 📥 Receive Dispatched Product into Store Inward
exports.receiveDispatchInStore = async (req, res) => {
  try {
    const { dispatchId, invoiceNumber, storeName, owner, userId, scannedBarcode } = req.body;

    let dispatchDoc = null;
    if (dispatchId) {
      dispatchDoc = await Dispatch.findById(dispatchId);
    }
    if (!dispatchDoc && invoiceNumber) {
      dispatchDoc = await Dispatch.findOne({ invoiceNumber });
    }

    if (!dispatchDoc) {
      return res.status(404).json({ success: false, error: 'Dispatch record not found' });
    }

    const effectiveStoreName = storeName || dispatchDoc.storeName || owner || 'Store';
    const dispatchedBarcodes = Array.isArray(dispatchDoc.barcodes) ? dispatchDoc.barcodes : [];
    const effectiveBarcodes = (Array.isArray(scannedBarcode) && scannedBarcode.length > 0)
      ? scannedBarcode
      : dispatchedBarcodes;

    // Create StoreInward record
    const storeInward = new StoreInward({
      modelNo: dispatchDoc.modelNo,
      quantity: dispatchDoc.quantity,
      scannedBarcode: effectiveBarcodes,
      userId: userId || 'Store User',
      storeName: effectiveStoreName,
      owner: effectiveStoreName,
      category: dispatchDoc.category || '',
      subCategory: dispatchDoc.subCategory || '',
      pricePerUnit: dispatchDoc.price || 0,
      salePerson: dispatchDoc.salePerson || '',
    });

    await storeInward.save();

    // Mark Dispatch status as Received
    dispatchDoc.status = 'Received';
    dispatchDoc.receivedDate = new Date();
    await dispatchDoc.save();

    // Sync Warranty status for each barcode to STORE_RECEIVED (WARRANTY NOT STARTED)
    await syncStoreInwardWarranty(effectiveBarcodes, dispatchDoc.modelNo, effectiveStoreName);

    // Update Product stock quantity at store level
    const product = await Product.findOne({ modelNo: dispatchDoc.modelNo });
    let newQuantity = Number(dispatchDoc.quantity);
    if (product) {
      newQuantity = product.quantity + Number(dispatchDoc.quantity);
      await Product.findOneAndUpdate(
        { modelNo: dispatchDoc.modelNo },
        {
          quantity: newQuantity,
          stockStatus: newQuantity > 5 ? 'In Stock' : 'Low Stock',
        },
        { new: true }
      );
    }

    // 🔔 Notify Super Admin with S/N Verification Analysis & Low Stock Check
    try {
      const { notifyAdminOnStoreInward, notifyAdminOnStockLevel } = require('../services/inventoryNotificationService');
      await notifyAdminOnStoreInward({
        storeName: effectiveStoreName,
        dispatchDoc,
        inwardDoc: storeInward,
        scannedBarcodes: effectiveBarcodes
      });
      await notifyAdminOnStockLevel({
        modelNo: dispatchDoc.modelNo,
        storeName: effectiveStoreName,
        currentQuantity: newQuantity
      });
    } catch (notifErr) {
      console.warn('Receive dispatch notification warning:', notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Dispatched product received and added to Store Inward Details successfully',
      data: storeInward,
      dispatch: dispatchDoc
    });
  } catch (error) {
    console.error('❌ Error in receiveDispatchInStore:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 📦 Get All Store Inwards
exports.getAllStoreInwards = async (req, res) => {
  try {
    const { storeName } = req.query;
    const filter = storeName ? { storeName: new RegExp(storeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } : {};
    const storeInwards = await StoreInward.find(filter).sort({ createdAt: -1 });
    res.status(200).json(storeInwards);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ❌ Delete Store Inward
exports.deleteStoreInward = async (req, res) => {
  try {
    const { id } = req.params;

    const storeInward = await StoreInward.findById(id);
    if (!storeInward) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    const { modelNo, quantity } = storeInward;

    // Reduce stock
    const product = await Product.findOne({ modelNo });
    if (product) {
      const newQuantity = Math.max(0, product.quantity - Number(quantity));
      await Product.findOneAndUpdate(
        { modelNo },
        {
          quantity: newQuantity,
          stockStatus:
            newQuantity > 5 ? 'In Stock' : newQuantity > 0 ? 'Low Stock' : 'Out of Stock',
        },
        { new: true }
      );
    }

    await StoreInward.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Store inward deleted and stock updated successfully',
    });
  } catch (error) {
    console.error('❌ Error in deleteStoreInward:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 📤 Create Stock Outward
exports.createStockOutward = async (req, res) => {
  try {
    const {
      modelNo,
      quantity,
      reason,
      userId,
      storeName,
      customerName,
      customerMobile,
      customerAddress,
      scannedCodes,
      scannedList,
      price,
      salePerson,
      category,
    } = req.body;

    if (!modelNo || !quantity || !storeName) {
      return res.status(400).json({
        success: false,
        error: 'modelNo, quantity, and storeName are required',
      });
    }

    const stockOutward = new StockOutward({
      modelNo,
      quantity,
      reason,
      userId,
      storeName,
      customerName,
      customerMobile,
      customerAddress,
      scannedCodes,
      scannedList,
      price,
      salePerson,
      category: category || "",
    });

    await stockOutward.save();

    const product = await Product.findOne({ modelNo });
    if (product) {
      const newQuantity = Math.max(0, product.quantity - Number(quantity));
      await Product.findOneAndUpdate(
        { modelNo },
        {
          quantity: newQuantity,
          stockStatus:
            newQuantity > 5 ? 'In Stock' : newQuantity > 0 ? 'Low Stock' : 'Out of Stock',
        },
        { new: true }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Stock outward created successfully',
      data: stockOutward,
    });
  } catch (error) {
    console.error('❌ Error in createStockOutward:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Update Store Inward Record
exports.updateStoreInward = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, scannedBarcode, category, subCategory, owner } = req.body;
    // const { quantity, scannedBarcode } = req.body;

    const existing = await StoreInward.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Store Inward record not found" });
    }

    // Ensure quantity is not negative
    const newQuantity = Math.max(0, Number(quantity) || 0);

    // Update scannedBarcode (either string or array)
    let updatedScanned = [];
    if (Array.isArray(scannedBarcode)) {
      updatedScanned = scannedBarcode.filter(Boolean);
    } else if (typeof scannedBarcode === "string") {
      updatedScanned = scannedBarcode
        .split(",")
        .map(b => b.trim())
        .filter(Boolean);
    }

    const updated = await StoreInward.findByIdAndUpdate(
      id,
      {
        $set: {
          quantity: newQuantity,
          scannedBarcode: updatedScanned,
          category: category || existing.category,
          subCategory: subCategory !== undefined ? subCategory : existing.subCategory,
          owner: owner || existing.owner
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Store Inward record updated successfully",
      data: updated
    });
  } catch (error) {
    console.error("Error updating Store Inward:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update Store Inward record",
      error: error.message
    });
  }
};

// ❌ Delete Stock Outward (✅ Added)
exports.deleteStockOutward = async (req, res) => {
  try {
    const { id } = req.params;

    const stockOutward = await StockOutward.findById(id);
    if (!stockOutward) {
      return res.status(404).json({ success: false, message: 'Stock Outward record not found' });
    }

    await StockOutward.findByIdAndDelete(id);
    res.json({ success: true, message: 'Stock Outward record deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting Stock Outward:', error);
    res.status(500).json({ success: false, message: 'Failed to delete Stock Outward record', error: error.message });
  }
};
