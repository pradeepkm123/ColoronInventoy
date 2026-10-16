/**
 * Backend/scripts/importDispatchesFromExcel.js
 * 
 * Usage:
 *   node Backend/scripts/importDispatchesFromExcel.js "path/to/your/dispatches.xlsx"
 */

const path = require('path');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore DNS setServers error
}
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Dispatch = require('../models/Dispatch');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Warranty = require('../models/Warranty');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inventorypos';

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

async function importExcel(filePath) {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected Successfully!\n');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    console.log(`Processing Worksheet: "${worksheet.name}" with ${worksheet.rowCount} rows\n`);

    // Map headers from row 1
    const headers = {};
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      const cleanKey = String(cell.value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
      if (cleanKey) {
        headers[cleanKey] = colNumber;
      }
    });

    const getVal = (row, ...names) => {
      for (const name of names) {
        const key = name.toLowerCase().replace(/[\s_-]+/g, '');
        const colIdx = headers[key];
        if (colIdx) {
          const val = row.getCell(colIdx).value;
          if (val === null || val === undefined) continue;
          if (typeof val === 'object') {
            if (val.text) return String(val.text).trim();
            if (val.result) return String(val.result).trim();
            if (val instanceof Date) return val;
          }
          return String(val).trim();
        }
      }
      return '';
    };

    let importedCount = 0;
    let skippedCount = 0;

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (!row.hasValues) continue;

      const invoiceNumber = getVal(row, 'invoicenumber', 'invoiceno', 'invoice');
      const modelNo = getVal(row, 'modelno', 'model', 'product');
      const quantity = Math.max(1, parseInt(getVal(row, 'quantity', 'qty') || '1', 10));
      const price = Math.max(0, parseFloat(getVal(row, 'price', 'priceperunit') || '0'));
      const salePerson = getVal(row, 'salesperson', 'saleperson', 'employee') || 'Excel Import';
      const rawBarcodes = getVal(row, 'barcodes', 'serialnumbers', 'barcode', 'serials');
      const customerType = getVal(row, 'customertype', 'type') || 'Store';
      const storeName = getVal(row, 'storename', 'store', 'destinationstore');
      const customerName = getVal(row, 'customername', 'customer') || storeName;
      const phoneNumber = getVal(row, 'phonenumber', 'mobile', 'phone');
      const customerAddress = getVal(row, 'customeraddress', 'address');
      const mailId = getVal(row, 'mailid', 'email', 'mail');
      const gstNo = getVal(row, 'gstno', 'gst');
      const category = getVal(row, 'category');
      const subCategory = getVal(row, 'subcategory');

      const rawDate = getVal(row, 'dispatchdate', 'date');
      let dispatchDate = new Date();
      if (rawDate) {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          dispatchDate = parsed;
        }
      }

      if (!invoiceNumber || !modelNo) {
        console.warn(`[Row ${rowNumber}] Skipped: Missing Invoice Number or Model No`);
        skippedCount++;
        continue;
      }

      // Parse Barcodes
      const barcodes = rawBarcodes
        ? String(rawBarcodes).split(/[,;\n\r]+/).map(b => b.trim()).filter(Boolean)
        : [];

      // 1. Create Dispatch Document
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

      // 2. Reduce Stock in Product
      const product = await Product.findOne({
        $or: [{ model: modelNo }, { modelNo: modelNo }]
      });
      if (product) {
        product.quantity = Math.max(0, (product.quantity || 0) - quantity);
        await product.save();
      }

      // Also reduce in Inventory
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

      // 3. Update Barcodes in Warranty
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

      importedCount++;
      console.log(`[Row ${rowNumber}] Imported Invoice: ${invoiceNumber} | Model: ${modelNo} | Qty: ${quantity} | Serials: ${barcodes.length}`);
    }

    console.log('\n===========================================');
    console.log(`Excel Dispatch Import Completed!`);
    console.log(`   - Successfully Imported: ${importedCount}`);
    console.log(`   - Skipped Rows:          ${skippedCount}`);
    console.log('===========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Import Failed:', error);
    process.exit(1);
  }
}

const targetFile = process.argv[2];
if (!targetFile) {
  console.log('Usage: node Backend/scripts/importDispatchesFromExcel.js "<path_to_excel_file.xlsx>"');
  process.exit(1);
}

importExcel(path.resolve(targetFile));
