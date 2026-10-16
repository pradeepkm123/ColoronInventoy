// const Dispatch = require('../models/Dispatch');
// const Product = require('../models/Product');
// const { generateInvoiceNumber } = require('../utils/invoiceUtils');

// // Create a new dispatch
// exports.createDispatch = async (req, res) => {
//   try {
//     const {
//       modelNo,
//       quantity,
//       price,
//       salePerson,
//       barcodes,
//       dispatchDate,
//       customerName,
//       storeName,
//       customerAddress,
//       mailId,
//       phoneNumber,
//       category,
//       subCategory,
//       gstNo,
//       customerType
//     } = req.body;

//     const invoiceNumber = await generateInvoiceNumber(); // ✅ FIXED

//     const newDispatch = new Dispatch({
//       invoiceNumber,
//       modelNo,
//       quantity,
//       price,
//       salePerson,
//       barcodes,
//       storeName,
//       dispatchDate,
//       customerName,
//       customerAddress,
//       mailId,
//       phoneNumber,
//       category,
//       subCategory,
//       gstNo,
//       customerType
//     });

//     console.log('--- New Dispatch Request ---');
//     console.log('Body:', req.body);
//     console.log('---------------------------');
//     await newDispatch.save();

//     // Reduce stock
//     const product = await Product.findOne({ model: modelNo });
//     if (!product) {
//       return res.status(404).json({ message: 'Product not found for model: ' + modelNo });
//     }

//     if (product.quantity < quantity) {
//       return res.status(400).json({ message: 'Not enough stock for dispatch' });
//     }

//     product.quantity -= quantity;
//     await product.save();

//     res.status(201).json({
//       message: 'Dispatch created and product stock updated',
//       dispatch: newDispatch
//     });
//   } catch (error) {
//     console.error('Dispatch Error:', error.message);
//     res.status(500).json({ message: 'Failed to create dispatch', error: error.message });
//   }
// };

// // Get all dispatch records
// // In your dispatch controller
// exports.getDispatches = async (req, res) => {
//   try {
//     const { storeName } = req.query;
//     const filter = storeName ? { storeName } : {};
//     const data = await Dispatch.find(filter).sort({ createdAt: -1 });
//     res.json(data);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // Get a single dispatch by ID
// exports.getDispatchById = async (req, res) => {
//   try {
//     const dispatch = await Dispatch.findById(req.params.id);
//     if (!dispatch) {
//       return res.status(404).json({ message: 'Dispatch not found' });
//     }
//     res.json(dispatch);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Update a dispatch
// exports.updateDispatch = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     const updatedDispatch = await Dispatch.findByIdAndUpdate(id, updateData, { new: true });
//     if (!updatedDispatch) {
//       return res.status(404).json({ message: 'Dispatch not found' });
//     }
//     res.json(updatedDispatch);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Delete a dispatch
// exports.deleteDispatch = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deletedDispatch = await Dispatch.findByIdAndDelete(id);
//     if (!deletedDispatch) {
//       return res.status(404).json({ message: 'Dispatch not found' });
//     }
//     res.json({ message: 'Dispatch deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };





const Dispatch = require('../models/Dispatch');
const Product = require('../models/Product');
const Warranty = require('../models/Warranty');
const Inventory = require('../models/Inventory');
const CartonBox = require('../models/CartonBox');
const StockMovement = require('../models/StockMovement');
const { generateInvoiceNumber } = require('../utils/invoiceUtils');

const addPeriodToDate = (startDate, period, unit = 'MONTHS') => {
  if (!startDate) return null;
  const date = new Date(startDate);
  if (isNaN(date.getTime())) return null;
  const p = Number(period) || 0;
  const normalizedUnit = (unit || 'MONTHS').toUpperCase();
  if (normalizedUnit === 'DAYS') {
    date.setDate(date.getDate() + p);
  } else if (normalizedUnit === 'YEARS') {
    date.setFullYear(date.getFullYear() + p);
  } else {
    date.setMonth(date.getMonth() + p);
  }
  date.setDate(date.getDate() - 1);
  date.setHours(23, 59, 59, 999);
  return date;
};

// Create a new dispatch
exports.createDispatch = async (req, res) => {
  try {
    const {
      modelNo,
      quantity,
      price,
      salePerson,
      barcodes,
      dispatchDate,
      customerName,
      storeName,
      customerAddress,
      mailId,
      phoneNumber,
      category,
      subCategory,
      gstNo,
      customerType
    } = req.body;

    const invoiceNumber = await generateInvoiceNumber(); // ✅ FIXED

    const newDispatch = new Dispatch({
      invoiceNumber,
      modelNo,
      quantity,
      price,
      salePerson,
      barcodes,
      storeName,
      dispatchDate,
      customerName,
      customerAddress,
      mailId,
      phoneNumber,
      category,
      subCategory,
      gstNo,
      customerType
    });

    console.log('--- New Dispatch Request ---');
    console.log('Body:', req.body);
    console.log('---------------------------');

    await newDispatch.save();

    // Reduce stock
    const product = await Product.findOne({ model: modelNo });
    if (!product) {
      return res.status(404).json({ message: 'Product not found for model: ' + modelNo });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ message: 'Not enough stock for dispatch' });
    }

    product.quantity -= quantity;
    await product.save();

    // Sync Warranty status for each barcode
    if (barcodes && Array.isArray(barcodes) && barcodes.length > 0) {
      const typeStr = (customerType || '').trim().toLowerCase();
      const isWarehouseOrStore = typeStr === 'warehouse' || typeStr === 'store' || (storeName && String(storeName).trim().length > 0 && typeStr !== 'customer' && typeStr !== 'end customer');
      const isCustomer = !isWarehouseOrStore && (typeStr === 'customer' || typeStr === 'end customer' || typeStr === 'individual' || !!customerName);

      const dispatchDateObj = dispatchDate ? new Date(dispatchDate) : new Date();

      for (const code of barcodes) {
        const cleanCode = String(code).trim();
        if (!cleanCode) continue;

        let warrantyItem = await Warranty.findOne({
          $or: [{ barcode: cleanCode }, { serialNumber: cleanCode }]
        });

        if (!warrantyItem) {
          warrantyItem = new Warranty({
            serialNumber: cleanCode,
            barcode: cleanCode,
            modelNo: modelNo,
            productName: modelNo
          });
        }

        warrantyItem.dispatch = {
          date: dispatchDateObj,
          dispatchNo: invoiceNumber,
          destinationStore: storeName || customerName || '',
          salesPerson: salePerson || ''
        };

        if (isCustomer) {
          // Super Admin dispatch directly to Customer -> Customer Warranty Starts!
          const period = warrantyItem.warrantyPeriod || 24;
          const unit = warrantyItem.warrantyUnit || 'MONTHS';
          const endDate = addPeriodToDate(dispatchDateObj, period, unit);

          warrantyItem.currentStatus = 'SOLD';
          warrantyItem.stockStatus = 'SOLD';
          warrantyItem.status = 'IN_WARRANTY';
          warrantyItem.warrantyStartDate = dispatchDateObj;
          warrantyItem.warrantyEndDate = endDate;
          warrantyItem.sale = {
            sold: true,
            date: dispatchDateObj,
            invoiceNo: invoiceNumber,
            customerName: customerName || '',
            customerMobile: phoneNumber || '',
            customerAddress: customerAddress || '',
            salePerson: salePerson || '',
            price: price || 0
          };
          warrantyItem.customerWarranty = {
            period: period,
            periodUnit: unit,
            startDate: dispatchDateObj,
            endDate: endDate
          };
        } else {
          // Super Admin dispatch to Warehouse / Store -> Customer Warranty NOT STARTED!
          warrantyItem.currentStatus = 'DISPATCHED';
          warrantyItem.stockStatus = 'DISPATCHED';
          warrantyItem.status = 'NOT_STARTED';
          warrantyItem.warrantyStartDate = null;
          warrantyItem.warrantyEndDate = null;
          warrantyItem.sale = {
            sold: false
          };
          warrantyItem.customerWarranty = {
            period: warrantyItem.customerWarranty?.period || warrantyItem.warrantyPeriod || 24,
            periodUnit: warrantyItem.customerWarranty?.periodUnit || warrantyItem.warrantyUnit || 'MONTHS',
            startDate: null,
            endDate: null
          };
        }

        await warrantyItem.save();
      }
    }

    // 🔔 Notify Store of new dispatch automatically
    try {
      const { notifyStoreOnDispatch, notifyAdminOnStockLevel } = require('../services/inventoryNotificationService');
      await notifyStoreOnDispatch(newDispatch);
      await notifyAdminOnStockLevel({
        modelNo: product.modelNo || product.model || modelNo,
        storeName: 'Warehouse / Central Inventory',
        currentQuantity: product.quantity
      });
    } catch (notifErr) {
      console.warn('Dispatch notification warning:', notifErr.message);
    }

    res.status(201).json({
      message: 'Dispatch created and product stock updated',
      dispatch: newDispatch
    });
  } catch (error) {
    console.error('Dispatch Error:', error.message);
    res.status(500).json({ message: 'Failed to create dispatch', error: error.message });
  }
};

// Get all dispatch records
exports.getDispatches = async (req, res) => {
  try {
    const { storeName } = req.query;
    const filter = (storeName && storeName !== 'All') ? { storeName } : {};
    const data = await Dispatch.find(filter).sort({ createdAt: -1 }).lean();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single dispatch by ID
exports.getDispatchById = async (req, res) => {
  try {
    const dispatch = await Dispatch.findById(req.params.id);
    if (!dispatch) {
      return res.status(404).json({ message: 'Dispatch not found' });
    }
    res.json(dispatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a dispatch
exports.updateDispatch = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedDispatch = await Dispatch.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedDispatch) {
      return res.status(404).json({ message: 'Dispatch not found' });
    }
    res.json(updatedDispatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a dispatch
exports.deleteDispatch = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDispatch = await Dispatch.findByIdAndDelete(id);
    if (!deletedDispatch) {
      return res.status(404).json({ message: 'Dispatch not found' });
    }
    res.json({ message: 'Dispatch deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk import dispatches from Excel payload
exports.bulkImportDispatches = async (req, res) => {
  try {
    const { dispatches } = req.body;
    if (!Array.isArray(dispatches) || dispatches.length === 0) {
      return res.status(400).json({ message: 'No dispatch data provided in request' });
    }

    const results = {
      total: dispatches.length,
      importedCount: 0,
      skippedCount: 0,
      errors: [],
      importedDispatches: []
    };

    for (let i = 0; i < dispatches.length; i++) {
      const row = dispatches[i];
      const rowIdx = i + 1;

      // Extract values with flexible key naming (handles raw column names like 'Invoice Number' or camelCase 'invoiceNumber')
      const getField = (...keys) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
            return row[k];
          }
        }
        return '';
      };

      const invoiceNumber = String(getField('invoiceNumber', 'invoiceNo', 'Invoice Number', 'Invoice No', 'Invoice')).trim();
      const modelNo = String(getField('modelNo', 'model', 'Model No', 'Model', 'Product')).trim();
      const quantity = Math.max(1, parseInt(getField('quantity', 'Quantity', 'Qty') || '1', 10));
      const price = Math.max(0, parseFloat(getField('price', 'Price', 'Price Per Unit') || '0'));
      const salePerson = String(getField('salePerson', 'salesPerson', 'Sales Person', 'Salesperson') || 'Excel Import').trim();
      const customerType = String(getField('customerType', 'Customer Type', 'Type') || 'Store').trim();
      const storeName = String(getField('storeName', 'Store Name', 'Destination Store', 'Branch') || '').trim();
      const customerName = String(getField('customerName', 'Customer Name', 'Customer') || storeName).trim();
      const customerAddress = String(getField('customerAddress', 'Customer Address', 'Address') || '').trim();
      const phoneNumber = String(getField('phoneNumber', 'Phone Number', 'Mobile', 'Contact') || '').trim();
      const mailId = String(getField('mailId', 'Mail ID', 'Email', 'Mail') || '').trim();
      const gstNo = String(getField('gstNo', 'GST No', 'GST', 'Gst Number') || '').trim();
      const category = String(getField('category', 'Category') || '').trim();
      const subCategory = String(getField('subCategory', 'Sub Category', 'SubCategory') || '').trim();

      const rawDate = getField('dispatchDate', 'Dispatch Date', 'Date');
      let dispatchDate = new Date();
      if (rawDate) {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          dispatchDate = parsed;
        }
      }

      // Barcodes: can be an array, or comma / semicolon / newline separated string
      const rawBarcodes = getField('barcodes', 'Barcodes', 'Serial Numbers', 'serialNumbers', 'Barcode');
      let barcodes = [];
      if (Array.isArray(rawBarcodes)) {
        barcodes = rawBarcodes.map(b => String(b).trim()).filter(Boolean);
      } else if (rawBarcodes) {
        barcodes = String(rawBarcodes)
          .split(/[,;\n\r]+/)
          .map(b => b.trim())
          .filter(Boolean);
      }

      if (!invoiceNumber || !modelNo) {
        results.skippedCount++;
        results.errors.push({
          row: rowIdx,
          message: 'Missing Invoice Number or Model No'
        });
        continue;
      }

      // 1. Create and save Dispatch document
      const newDispatch = new Dispatch({
        invoiceNumber,
        modelNo,
        quantity,
        price,
        salePerson,
        barcodes,
        dispatchDate,
        customerName: customerName || storeName,
        storeName: storeName || (customerType.toLowerCase() === 'store' ? customerName : ''),
        customerAddress,
        mailId,
        phoneNumber,
        category,
        subCategory,
        gstNo,
        customerType,
        status: 'Dispatched'
      });

      await newDispatch.save();

      // 2. Reduce Stock in Product (if found)
      const product = await Product.findOne({
        $or: [{ model: modelNo }, { modelNo: modelNo }]
      });
      if (product) {
        product.quantity = Math.max(0, (product.quantity || 0) - quantity);
        await product.save();
      }

      // Also reduce in Inventory (if found)
      const inv = await Inventory.findOne({
        $or: [{ modelNo: modelNo }, { model: modelNo }]
      });
      if (inv) {
        inv.quantity = Math.max(0, (inv.quantity || 0) - quantity);
        if (inv.currentStock !== undefined) {
          inv.currentStock = Math.max(0, (inv.currentStock || 0) - quantity);
        }
        await inv.save();
      }

      // 3. Update Barcodes / Serials in Warranty
      if (barcodes.length > 0) {
        const typeStr = customerType.toLowerCase();
        const isCustomer = typeStr === 'customer' || typeStr === 'end customer' || typeStr === 'individual' || (!storeName && customerName);

        for (const code of barcodes) {
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

          warrantyItem.dispatch = {
            date: dispatchDate,
            dispatchNo: invoiceNumber,
            destinationStore: storeName || customerName || '',
            salesPerson: salePerson
          };

          if (isCustomer) {
            const period = warrantyItem.warrantyPeriod || 24;
            const unit = warrantyItem.warrantyUnit || 'MONTHS';
            const endDate = addPeriodToDate(dispatchDate, period, unit);

            warrantyItem.currentStatus = 'SOLD';
            warrantyItem.stockStatus = 'SOLD';
            warrantyItem.status = 'IN_WARRANTY';
            warrantyItem.warrantyStartDate = dispatchDate;
            warrantyItem.warrantyEndDate = endDate;
            warrantyItem.sale = {
              sold: true,
              date: dispatchDate,
              invoiceNo: invoiceNumber,
              customerName: customerName || '',
              customerMobile: phoneNumber || '',
              customerAddress: customerAddress || '',
              salePerson: salePerson,
              price: price || 0
            };
            warrantyItem.customerWarranty = {
              period: period,
              periodUnit: unit,
              startDate: dispatchDate,
              endDate: endDate
            };
          } else {
            warrantyItem.currentStatus = 'DISPATCHED';
            warrantyItem.stockStatus = 'DISPATCHED';
            warrantyItem.status = 'NOT_STARTED';
            warrantyItem.warrantyStartDate = null;
            warrantyItem.warrantyEndDate = null;
            warrantyItem.sale = { sold: false };
          }

          await warrantyItem.save();
        }
      }

      results.importedCount++;
      results.importedDispatches.push({
        _id: newDispatch._id,
        invoiceNumber,
        modelNo,
        quantity
      });
    }

    res.status(200).json({
      message: `Successfully imported ${results.importedCount} dispatch records.`,
      ...results
    });
  } catch (error) {
    console.error('Bulk Import Dispatches Error:', error);
    res.status(500).json({ message: 'Failed to bulk import dispatches', error: error.message });
  }
};

// Helper to extract a single clean string value from multiple possible property names
const getCleanField = (obj, ...keys) => {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') {
      return String(obj[k]).trim();
    }
  }
  return '';
};

// 1. STEP 1: VALIDATE EXCEL DISPATCH ROWS (Model No + S/N against inventory & status)
exports.validateExcelDispatch = async (req, res) => {
  try {
    const { rows, mode = 'strict' } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'No Excel rows provided for validation.' });
    }

    const seenSerialsInExcel = new Set();
    const validatedRows = [];
    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      const invoiceNumber = getCleanField(row, 'invoiceNumber', 'invoiceNo', 'Invoice Number', 'Invoice No', 'Invoice');
      const modelNo = getCleanField(row, 'modelNo', 'model', 'Model No', 'Model', 'Product');
      const rawSerial = getCleanField(row, 'serialNumber', 'serial', 'sn', 'Serial Number', 'S/N', 'SN', 'Barcodes', 'barcode', 'Barcode');
      const customerName = getCleanField(row, 'customerName', 'customer', 'Customer Name', 'Customer', 'Store Name', 'storeName');
      const storeName = getCleanField(row, 'storeName', 'Store Name', 'Branch');
      const customerType = getCleanField(row, 'customerType', 'Customer Type', 'Type') || (storeName ? 'Store' : 'Customer');
      const price = Number(getCleanField(row, 'price', 'Price', 'pricePerUnit') || 0);
      const salePerson = getCleanField(row, 'salePerson', 'salesPerson', 'Sales Person', 'Salesperson') || 'Excel Import';
      const rawDate = getCleanField(row, 'dispatchDate', 'Dispatch Date', 'Date');

      const cleanSerial = rawSerial.trim();

      let isValid = true;
      let reason = 'Matched ✓';
      let errorCategory = null;

      // Check 1: Required fields
      if (!modelNo || !cleanSerial) {
        isValid = false;
        errorCategory = 'MISSING';
        reason = !modelNo ? 'Missing Model No' : 'Missing Serial Number';
      }

      // Check 2: Duplicate S/N in this Excel file
      if (isValid) {
        const lowerSN = cleanSerial.toLowerCase();
        if (seenSerialsInExcel.has(lowerSN)) {
          isValid = false;
          errorCategory = 'DUPLICATE_EXCEL';
          reason = 'Duplicate Serial Number in uploaded Excel';
          duplicateCount++;
        } else {
          seenSerialsInExcel.add(lowerSN);
        }
      }

      // Check 3: Database validation (Model No + S/N against inventory / warranty)
      if (isValid) {
        const warrantyRecord = await Warranty.findOne({
          $or: [{ serialNumber: cleanSerial }, { barcode: cleanSerial }]
        });

        const boxRecord = !warrantyRecord ? await CartonBox.findOne({ serialNumbers: cleanSerial }) : null;
        const invRecord = !warrantyRecord ? await Inventory.findOne({ barcodes: cleanSerial }) : null;

        const foundRecord = warrantyRecord || boxRecord || invRecord;

        if (!foundRecord) {
          if (mode === 'strict') {
            isValid = false;
            errorCategory = 'NOT_FOUND';
            reason = 'Serial Number not found in inventory';
          } else {
            reason = 'Valid (Historical migration backfill)';
          }
        } else {
          // Check Model No combination
          const registeredModel = warrantyRecord?.modelNo || boxRecord?.modelNo || invRecord?.modelNo || invRecord?.model;
          if (registeredModel) {
            const cleanReqModel = modelNo.toLowerCase().replace(/[\s_-]+/g, '');
            const cleanRegModel = registeredModel.toLowerCase().replace(/[\s_-]+/g, '');
            if (!cleanReqModel.includes(cleanRegModel) && !cleanRegModel.includes(cleanReqModel)) {
              isValid = false;
              errorCategory = 'MODEL_MISMATCH';
              reason = `Model/S/N mismatch (S/N is registered to ${registeredModel})`;
            }
          }

          // Check Status: Already dispatched or sold?
          if (isValid && warrantyRecord) {
            const currentStatus = warrantyRecord.currentStatus || 'IN_STOCK';
            if (currentStatus === 'DISPATCHED' || currentStatus === 'SOLD') {
              isValid = false;
              errorCategory = 'ALREADY_DISPATCHED';
              const dispDateStr = warrantyRecord.dispatch?.date ? new Date(warrantyRecord.dispatch.date).toLocaleDateString() : 'earlier date';
              reason = `Serial Number already dispatched (${currentStatus} on ${dispDateStr})`;
            } else if (mode === 'strict' && currentStatus !== 'IN_STOCK') {
              isValid = false;
              errorCategory = 'NOT_AVAILABLE';
              reason = `S/N status is ${currentStatus} (Not available in stock)`;
            }
          }
        }
      }

      if (isValid) {
        validCount++;
      } else if (errorCategory !== 'DUPLICATE_EXCEL') {
        invalidCount++;
      }

      validatedRows.push({
        rowNumber: rowNum,
        invoiceNumber: invoiceNumber || `DISP-${rowNum}`,
        modelNo,
        serialNumber: cleanSerial,
        customerName: customerName || storeName || '—',
        storeName: storeName || (customerType.toLowerCase() === 'store' ? customerName : ''),
        customerType,
        price,
        salePerson,
        dispatchDate: rawDate || new Date().toISOString().split('T')[0],
        isValid,
        result: isValid ? '✓' : '❌',
        reason
      });
    }

    const isAllValid = (invalidCount === 0 && duplicateCount === 0);

    return res.status(200).json({
      isAllValid,
      totalRows: rows.length,
      validCount,
      invalidCount,
      duplicateCount,
      status: isAllValid ? 'READY_TO_IMPORT' : 'UPLOAD_BLOCKED',
      message: isAllValid
        ? `All ${rows.length} rows verified successfully! Ready to import.`
        : `Validation failed: ${invalidCount + duplicateCount} issue(s) detected. Upload blocked.`,
      rows: validatedRows
    });
  } catch (error) {
    console.error('Validation Error:', error);
    res.status(500).json({ message: 'Validation failed due to server error', error: error.message });
  }
};

// 2. STEP 2: CONFIRM & ATOMICALLY DISPATCH VALIDATED ROWS
exports.confirmExcelDispatch = async (req, res) => {
  try {
    const { rows, mode = 'strict', importedFileName = 'dispatch_import.xlsx' } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'No rows provided to import.' });
    }

    // STRICT ATOMIC RE-VALIDATION: Guarantee 0 records dispatched if even 1 row fails
    const seenSerials = new Set();
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const cleanSerial = String(r.serialNumber || '').trim();
      const modelNo = String(r.modelNo || '').trim();

      if (!cleanSerial || !modelNo) {
        errors.push({ row: i + 1, error: 'Missing Model or Serial Number' });
        continue;
      }

      if (seenSerials.has(cleanSerial.toLowerCase())) {
        errors.push({ row: i + 1, error: `Duplicate serial number: ${cleanSerial}` });
        continue;
      }
      seenSerials.add(cleanSerial.toLowerCase());

      const wItem = await Warranty.findOne({
        $or: [{ serialNumber: cleanSerial }, { barcode: cleanSerial }]
      });

      if (!wItem && mode === 'strict') {
        errors.push({ row: i + 1, error: `Serial number not found: ${cleanSerial}` });
      } else if (wItem) {
        if (wItem.currentStatus === 'DISPATCHED' || wItem.currentStatus === 'SOLD') {
          errors.push({ row: i + 1, error: `Serial number already dispatched: ${cleanSerial}` });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Upload Rejected: 0 records dispatched because one or more rows failed validation.',
        errors
      });
    }

    // COMMIT: 100% Valid -> Process dispatches, update serial status, deduct stock, create history
    let successCount = 0;
    const modelQuantityMap = {};

    for (const row of rows) {
      const invoiceNumber = String(row.invoiceNumber || `INV-${Date.now()}`).trim();
      const modelNo = String(row.modelNo).trim();
      const serialNumber = String(row.serialNumber).trim();
      const customerName = String(row.customerName || '').trim();
      const storeName = String(row.storeName || '').trim();
      const customerType = String(row.customerType || 'Customer').trim();
      const price = Number(row.price) || 0;
      const salePerson = String(row.salePerson || 'Excel Import').trim();
      const dispatchDate = row.dispatchDate ? new Date(row.dispatchDate) : new Date();

      modelQuantityMap[modelNo] = (modelQuantityMap[modelNo] || 0) + 1;

      // 1. Update or create Warranty item (AVAILABLE -> DISPATCHED / SOLD)
      let warrantyItem = await Warranty.findOne({
        $or: [{ serialNumber: serialNumber }, { barcode: serialNumber }]
      });

      if (!warrantyItem) {
        warrantyItem = new Warranty({
          serialNumber,
          barcode: serialNumber,
          modelNo,
          productName: modelNo
        });
      }

      const isCustomer = customerType.toLowerCase() === 'customer' || !storeName;

      warrantyItem.currentStatus = isCustomer ? 'SOLD' : 'DISPATCHED';
      warrantyItem.stockStatus = isCustomer ? 'SOLD' : 'DISPATCHED';
      warrantyItem.dispatch = {
        date: dispatchDate,
        dispatchNo: invoiceNumber,
        destinationStore: storeName || customerName,
        salesPerson: salePerson
      };

      if (isCustomer) {
        const period = warrantyItem.warrantyPeriod || 24;
        const endDate = addPeriodToDate(dispatchDate, period, 'MONTHS');
        warrantyItem.status = 'IN_WARRANTY';
        warrantyItem.warrantyStartDate = dispatchDate;
        warrantyItem.warrantyEndDate = endDate;
        warrantyItem.sale = {
          sold: true,
          date: dispatchDate,
          invoiceNo: invoiceNumber,
          customerName,
          salePerson,
          price
        };
        warrantyItem.customerWarranty = {
          period,
          periodUnit: 'MONTHS',
          startDate: dispatchDate,
          endDate
        };
      } else {
        warrantyItem.status = 'NOT_STARTED';
        warrantyItem.sale = { sold: false };
      }

      await warrantyItem.save();

      // 2. Create Dispatch Document
      const newDispatch = new Dispatch({
        invoiceNumber,
        modelNo,
        quantity: 1,
        price,
        salePerson,
        barcodes: [serialNumber],
        dispatchDate,
        customerName: customerName || storeName,
        storeName: storeName || (isCustomer ? '' : customerName),
        customerType,
        status: 'Dispatched'
      });
      await newDispatch.save();

      // 3. Update CartonBox if serial belongs to a packed box
      await CartonBox.updateMany(
        { serialNumbers: serialNumber },
        { $set: { status: 'DISPATCHED' } }
      );

      // 4. Create StockMovement entry
      try {
        await StockMovement.create({
          direction: 'outward',
          storeName: storeName || 'Central Inventory',
          customerName: customerName || storeName || 'Customer',
          modelNo,
          productName: modelNo,
          quantity: 1,
          value: price,
          reason: 'Excel Dispatch Import',
          reference: invoiceNumber
        });
      } catch (smErr) {
        // Log minor non-blocking error
      }

      successCount++;
    }

    // 5. Update Stock Quantity in Product and Inventory
    for (const [mNo, qty] of Object.entries(modelQuantityMap)) {
      const prod = await Product.findOne({ $or: [{ model: mNo }, { modelNo: mNo }] });
      if (prod) {
        prod.quantity = Math.max(0, (prod.quantity || 0) - qty);
        await prod.save();
      }

      const inv = await Inventory.findOne({ $or: [{ modelNo: mNo }, { model: mNo }] });
      if (inv) {
        inv.quantity = Math.max(0, (inv.quantity || 0) - qty);
        if (inv.currentStock !== undefined) {
          inv.currentStock = Math.max(0, (inv.currentStock || 0) - qty);
        }
        await inv.save();
      }
    }

    return res.status(200).json({
      message: `Atomic Dispatch Completed: ${successCount} serial numbers dispatched and stock updated successfully!`,
      totalDispatched: successCount
    });
  } catch (error) {
    console.error('Confirm Import Error:', error);
    res.status(500).json({ message: 'Failed to complete dispatch import', error: error.message });
  }
};

