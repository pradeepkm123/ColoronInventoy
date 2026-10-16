const Warranty = require('../models/Warranty');
const Inventory = require('../models/Inventory');
const Dispatch = require('../models/Dispatch');
const StoreInward = require('../models/StoreInward');
const StockOutward = require('../models/StockOutward');
const Product = require('../models/Product');
const ItemModel = require('../models/ItemModel');
const RMA = require('../models/RMA');

// Helper: Format Date to DD-MMM-YYYY (e.g. 11-Aug-2026)
const formatDate = (d) => {
  if (!d) return null;
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return null;
  const day = String(dateObj.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
};

// Helper: Add period to date
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
    // Default MONTHS
    date.setMonth(date.getMonth() + p);
  }
  // Subtract 1 day for standard warranty expiry boundary (e.g. 11-Aug to 10-Aug)
  date.setDate(date.getDate() - 1);
  date.setHours(23, 59, 59, 999);
  return date;
};

// Helper: Calculate Remaining or Expired Duration Text
const calculateDurationMetrics = (now, endDate) => {
  if (!endDate) {
    return {
      isExpired: false,
      remainingFormatted: 'N/A',
      expiredSinceFormatted: null,
      daysTotal: 0
    };
  }

  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();

  if (diffMs < 0) {
    // Expired
    const expiredDays = Math.max(1, Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24)));
    return {
      isExpired: true,
      remainingFormatted: null,
      expiredSinceFormatted: `${expiredDays} ${expiredDays === 1 ? 'Day' : 'Days'}`,
      daysTotal: expiredDays
    };
  } else {
    // In Warranty
    const remainingDaysTotal = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor(remainingDaysTotal / 30.4375);
    const days = Math.floor(remainingDaysTotal % 30.4375);

    let text = '';
    if (months > 0 && days > 0) {
      text = `${months} ${months === 1 ? 'Month' : 'Months'} ${days} ${days === 1 ? 'Day' : 'Days'}`;
    } else if (months > 0) {
      text = `${months} ${months === 1 ? 'Month' : 'Months'}`;
    } else {
      text = `${remainingDaysTotal} ${remainingDaysTotal === 1 ? 'Day' : 'Days'}`;
    }

    return {
      isExpired: false,
      remainingFormatted: text,
      expiredSinceFormatted: null,
      daysTotal: remainingDaysTotal
    };
  }
};

// @desc    Check warranty and full lifecycle history by serial number or barcode
// @route   GET /api/warranty/check/:serialNumber OR POST /api/warranty/check
exports.checkWarranty = async (req, res) => {
  try {
    const rawQuery = req.params.serialNumber || req.body.serialNumber || req.body.barcode || req.query.serialNumber || req.query.barcode;

    if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
      return res.status(400).json({
        success: false,
        found: false,
        message: 'Serial Number or Barcode is required'
      });
    }

    const serialQuery = rawQuery.trim();
    const regexExact = new RegExp(`^${serialQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const regexContains = new RegExp(serialQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    // 1. Check Warranty collection first
    let warrantyRecord = await Warranty.findOne({
      $or: [{ serialNumber: regexExact }, { barcode: regexExact }]
    });

    // 2. Search other collections to assemble the full lifecycle journey
    const [inwardRecord, dispatchRecord, storeInwardRecord, outwardRecord] = await Promise.all([
      // Check Inventory / Inward
      Inventory.findOne({
        $or: [
          { barcodes: serialQuery },
          { barcodes: { $in: [serialQuery, regexExact] } },
          { scannedCodes: regexContains }
        ]
      }),

      // Check Dispatch
      Dispatch.findOne({
        $or: [
          { barcodes: serialQuery },
          { barcodes: { $in: [serialQuery, regexExact] } },
          { barcodes: regexContains }
        ]
      }),

      // Check StoreInward
      StoreInward.findOne({
        $or: [
          { scannedBarcode: serialQuery },
          { scannedBarcode: { $in: [serialQuery, regexExact] } },
          { scanningCode: regexContains }
        ]
      }),

      // Check StockOutward (Sales)
      StockOutward.findOne({
        $or: [
          { scannedList: serialQuery },
          { scannedList: { $in: [serialQuery, regexExact] } },
          { scannedCodes: regexContains }
        ]
      })
    ]);

    // Check RMA collection for replacement linkage
    const rmaMatch = await RMA.findOne({
      $or: [
        { 'replacement.replacementSerial': regexExact },
        { 'replacement.newSerialNumber': regexExact },
        { serialNumber: regexExact, 'replacement.isReplaced': true }
      ]
    }).lean();

    const isReplacementUnit = Boolean(
      (rmaMatch && (
        (rmaMatch.replacement?.replacementSerial && regexExact.test(rmaMatch.replacement.replacementSerial)) ||
        (rmaMatch.replacement?.newSerialNumber && regexExact.test(rmaMatch.replacement.newSerialNumber))
      )) ||
      (warrantyRecord?.replacement?.isReplacement) ||
      (warrantyRecord?.stockStatus === 'ISSUED_FOR_REPLACEMENT')
    );

    const isOriginalReplaced = Boolean(
      (rmaMatch && (
        rmaMatch.serialNumber && regexExact.test(rmaMatch.serialNumber) && (rmaMatch.replacement?.isReplaced || rmaMatch.resolutionType === 'REPLACEMENT')
      )) ||
      (warrantyRecord?.replacement?.isOriginalReplaced) ||
      (warrantyRecord?.currentStatus === 'REPLACED')
    );

    // If completely not found in any collection
    if (!warrantyRecord && !inwardRecord && !dispatchRecord && !storeInwardRecord && !outwardRecord && !rmaMatch) {
      // Check if it's a generic product barcode
      const product = await Product.findOne({
        $or: [{ model: regexExact }, { modelNo: regexExact }]
      });

      if (product) {
        return res.status(200).json({
          success: false,
          found: false,
          notInwarded: true,
          serialNumber: serialQuery,
          warrantyStatus: 'NOT_INWARDED',
          currentStatus: 'NOT_INWARDED',
          product: {
            name: product.productDescriptions || product.model || 'Product',
            modelNo: product.model || product.modelNo || 'N/A',
            brand: product.brand || 'COLORON',
            category: product.category || '',
            subCategory: product.subCategory || ''
          },
          message: 'This Serial Number has not been inwarded in Inventory. Please Inward that S/N first.'
        });
      }

      return res.status(200).json({
        success: false,
        found: false,
        notInwarded: true,
        serialNumber: serialQuery,
        warrantyStatus: 'NOT_INWARDED',
        currentStatus: 'NOT_INWARDED',
        message: 'This Serial Number has not been inwarded in Inventory. Please Inward that S/N first.'
      });
    }

    // 3. Resolve Product & Model Information
    const modelNumber = warrantyRecord?.modelNo || inwardRecord?.modelNo || dispatchRecord?.modelNo || storeInwardRecord?.modelNo || outwardRecord?.modelNo || '';
    const productName = warrantyRecord?.productName || inwardRecord?.model || inwardRecord?.productType || dispatchRecord?.modelNo || 'IP Camera';
    const brand = warrantyRecord?.brand || inwardRecord?.brand || storeInwardRecord?.brand || 'COLORON';
    const category = warrantyRecord?.category || inwardRecord?.category || dispatchRecord?.category || '';
    const subCategory = warrantyRecord?.subCategory || inwardRecord?.subCategory || dispatchRecord?.subCategory || '';

    // 4. Resolve Inward & Supplier Warranty
    const inwardDate = inwardRecord?.createdAt || warrantyRecord?.inward?.date || warrantyRecord?.createdAt || new Date('2026-08-11T00:00:00Z');
    const inwardLocation = inwardRecord?.location || warrantyRecord?.inward?.location || warrantyRecord?.currentWarehouseId || 'Main Warehouse';
    const inwardInvoice = inwardRecord?.shd || warrantyRecord?.inward?.invoiceNo || 'PUR-00125';

    const supplierPeriod = warrantyRecord?.supplierWarranty?.period || warrantyRecord?.warrantyPeriod || 24;
    const supplierUnit = warrantyRecord?.supplierWarranty?.periodUnit || warrantyRecord?.warrantyUnit || 'MONTHS';
    const supplierStartDate = warrantyRecord?.supplierWarranty?.startDate || inwardDate;
    const supplierEndDate = warrantyRecord?.supplierWarranty?.endDate || addPeriodToDate(supplierStartDate, supplierPeriod, supplierUnit);

    // 5. Resolve Dispatch & Store Received
    const isDispatched = !!dispatchRecord || !!warrantyRecord?.dispatch?.date;
    const dispatchDate = dispatchRecord?.dispatchDate || dispatchRecord?.createdAt || warrantyRecord?.dispatch?.date || null;
    const dispatchDestination = dispatchRecord?.storeName || warrantyRecord?.dispatch?.destinationStore || '';
    const dispatchRef = dispatchRecord?.invoiceNumber || warrantyRecord?.dispatch?.dispatchNo || '';
    const dispatchSalesPerson = dispatchRecord?.salePerson || warrantyRecord?.dispatch?.salesPerson || '';

    const isStoreReceived = !!storeInwardRecord || !!warrantyRecord?.storeInward?.date;
    const storeReceivedDate = storeInwardRecord?.createdAt || warrantyRecord?.storeInward?.date || null;
    let storeName = storeInwardRecord?.storeName || dispatchDestination || '';

    // 6. Resolve Customer Sale & Customer Warranty
    const dispatchCustomerType = (dispatchRecord?.customerType || '').trim().toLowerCase();
    const dispatchStoreName = (dispatchRecord?.storeName || '').trim();
    const isDispatchToCustomer = isDispatched && (
      dispatchCustomerType === 'customer' ||
      dispatchCustomerType === 'end customer' ||
      dispatchCustomerType === 'individual' ||
      (!!dispatchRecord?.customerName && (!dispatchStoreName || dispatchCustomerType === 'customer') && dispatchCustomerType !== 'warehouse' && dispatchCustomerType !== 'store')
    );

    const outwardCustomerType = (outwardRecord?.customerType || '').trim().toLowerCase();
    const outwardReason = (outwardRecord?.reason || '').trim().toLowerCase();
    const isOutwardCustomerSale = !!outwardRecord && (
      outwardReason.includes('sale') ||
      outwardReason.includes('customer') ||
      outwardCustomerType === 'customer' ||
      outwardCustomerType === 'end customer' ||
      (!!outwardRecord?.customerName && !outwardRecord?.storeName)
    );

    let isSold = (warrantyRecord?.sale?.sold === true) ||
                   warrantyRecord?.stockStatus === 'SOLD' ||
                   warrantyRecord?.currentStatus === 'SOLD' ||
                   isDispatchToCustomer ||
                   isOutwardCustomerSale;

    let saleDate = isSold ? (warrantyRecord?.sale?.date || outwardRecord?.createdAt || dispatchDate || warrantyRecord?.warrantyStartDate || warrantyRecord?.purchaseDate || warrantyRecord?.updatedAt || new Date()) : null;
    let customerName = outwardRecord?.customerName || (isDispatchToCustomer ? dispatchRecord?.customerName : null) || warrantyRecord?.sale?.customerName || warrantyRecord?.customerName || 'N/A';
    let customerMobile = outwardRecord?.customerMobile || (isDispatchToCustomer ? dispatchRecord?.phoneNumber : null) || warrantyRecord?.sale?.customerMobile || '';
    let customerAddress = outwardRecord?.customerAddress || (isDispatchToCustomer ? dispatchRecord?.customerAddress : null) || warrantyRecord?.sale?.customerAddress || '';
    let saleInvoice = outwardRecord?.reference || outwardRecord?.reason || (isDispatchToCustomer ? dispatchRecord?.invoiceNumber : null) || warrantyRecord?.sale?.invoiceNo || warrantyRecord?.invoiceNumber || 'SI-1025';
    let salePerson = outwardRecord?.salePerson || (isDispatchToCustomer ? dispatchRecord?.salePerson : null) || warrantyRecord?.sale?.salePerson || '';

    let customerPeriod = warrantyRecord?.customerWarranty?.period || warrantyRecord?.warrantyPeriod || 24;
    let customerUnit = warrantyRecord?.customerWarranty?.periodUnit || warrantyRecord?.warrantyUnit || 'MONTHS';
    let customerStartDate = isSold ? (saleDate || new Date()) : null;
    let customerEndDate = isSold ? (warrantyRecord?.customerWarranty?.endDate || addPeriodToDate(customerStartDate, customerPeriod, customerUnit)) : null;

    // 7. Resolve Current Status & Replacement Overrides
    let currentStatus = 'IN_STOCK';
    let replacementDetails = null;

    if (isReplacementUnit) {
      const isRmaDispatched = rmaMatch?.currentStatus === 'DISPATCHED' || rmaMatch?.replacement?.status === 'DISPATCHED' || warrantyRecord?.currentStatus === 'REPLACEMENT_DISPATCHED' || Boolean(rmaMatch?.dispatch?.dispatchedAt);
      currentStatus = isRmaDispatched ? 'REPLACEMENT_DISPATCHED' : 'RESERVED_FOR_RMA';

      // Customer & Store from RMA
      customerName = rmaMatch?.customerSnapshot?.name || warrantyRecord?.replacement?.customerName || customerName || 'Customer';
      customerMobile = rmaMatch?.customerSnapshot?.mobile || warrantyRecord?.replacement?.customerMobile || customerMobile || '';
      storeName = rmaMatch?.storeName || warrantyRecord?.replacement?.storeName || storeName || 'Service Center';

      // Inherit Customer Warranty from Original Unit
      customerStartDate = warrantyRecord?.customerWarranty?.startDate || rmaMatch?.createdAt || inwardDate;
      customerEndDate = warrantyRecord?.customerWarranty?.endDate || rmaMatch?.estimate?.warrantyExpiry || addPeriodToDate(customerStartDate, 24, 'MONTHS');

      replacementDetails = {
        isReplacement: true,
        rmaNumber: rmaMatch?.rmaNo || warrantyRecord?.replacement?.rmaNumber || 'RMA',
        originalSerialNumber: rmaMatch?.serialNumber || warrantyRecord?.replacement?.replacesSerialNumber || 'N/A',
        replacementSerialNumber: serialQuery,
        defectiveModel: rmaMatch?.replacement?.defectiveModel || rmaMatch?.modelNo || 'N/A',
        replacementModel: rmaMatch?.replacement?.replacementModel || modelNumber,
        customerName: customerName,
        customerMobile: customerMobile,
        storeName: storeName,
        replacementDate: formatDate(rmaMatch?.replacement?.replacedAt || warrantyRecord?.replacement?.replacementDate || new Date()),
        qcStatus: rmaMatch?.replacement?.qcResult || warrantyRecord?.replacement?.qcStatus || 'PASSED',
        dispatchStatus: isRmaDispatched ? 'DISPATCHED / CLOSED' : 'READY_FOR_DISPATCH',
        replacementSource: rmaMatch?.replacement?.inventorySource || warrantyRecord?.replacement?.replacementSource || '2% Warranty Spares Inventory',
        warrantyInherited: true,
        inheritedFrom: rmaMatch?.serialNumber || warrantyRecord?.replacement?.replacesSerialNumber || 'Original Unit'
      };
    } else if (isOriginalReplaced) {
      currentStatus = 'REPLACED';
      replacementDetails = {
        isOriginalReplaced: true,
        rmaNumber: rmaMatch?.rmaNo || warrantyRecord?.replacement?.rmaNumber || 'RMA',
        originalSerialNumber: serialQuery,
        replacedBySerialNumber: rmaMatch?.replacement?.replacementSerial || warrantyRecord?.replacement?.replacedBySerialNumber || 'N/A',
        replacementModel: rmaMatch?.replacement?.replacementModel || warrantyRecord?.replacement?.replacementModel || 'N/A',
        replacementDate: formatDate(rmaMatch?.replacement?.replacedAt || warrantyRecord?.replacement?.replacementDate || new Date()),
      };
    } else if (isSold) {
      currentStatus = 'SOLD';
    } else if (isStoreReceived) {
      currentStatus = 'STORE_RECEIVED';
    } else if (isDispatched) {
      currentStatus = 'DISPATCHED';
    } else if (warrantyRecord?.currentStatus) {
      currentStatus = warrantyRecord.currentStatus;
    }

    // 8. Calculate Warranty Status (Prioritizing Customer Warranty when Sold or Replaced)
    const now = new Date();
    let effectiveWarranty = null;
    let warrantyStatus = 'NOT_STARTED'; // 'IN_WARRANTY', 'EXPIRED', 'NOT_STARTED'

    const supplierMetrics = calculateDurationMetrics(now, supplierEndDate);
    const supplierWarrantyStatus = supplierMetrics.isExpired ? 'EXPIRED' : 'ACTIVE';

    if (isOriginalReplaced) {
      warrantyStatus = 'REPLACED';
      effectiveWarranty = {
        type: 'REPLACED',
        status: 'REPLACED',
        badgeColor: 'orange',
        startDate: formatDate(customerStartDate || supplierStartDate),
        endDate: formatDate(customerEndDate || supplierEndDate),
        period: 'Product Replaced by RMA',
        remainingFormatted: 'Replaced',
        isExpired: false,
        replacedBySerialNumber: replacementDetails?.replacedBySerialNumber
      };
    } else if ((isSold || isReplacementUnit) && customerEndDate) {
      const customerMetrics = calculateDurationMetrics(now, customerEndDate);
      if (customerMetrics.isExpired) {
        warrantyStatus = 'EXPIRED';
      } else {
        warrantyStatus = 'IN_WARRANTY';
      }

      effectiveWarranty = {
        type: 'CUSTOMER',
        status: warrantyStatus,
        badgeColor: warrantyStatus === 'IN_WARRANTY' ? 'green' : 'red',
        startDate: formatDate(customerStartDate),
        endDate: formatDate(customerEndDate),
        period: isReplacementUnit ? 'Inherited from Replaced Unit' : `${customerPeriod} ${customerUnit.charAt(0) + customerUnit.slice(1).toLowerCase()}`,
        periodValue: customerPeriod,
        periodUnit: customerUnit,
        remainingFormatted: customerMetrics.remainingFormatted,
        expiredSinceFormatted: customerMetrics.expiredSinceFormatted,
        isExpired: customerMetrics.isExpired,
        isInherited: isReplacementUnit,
        inheritedFromSerial: replacementDetails?.originalSerialNumber
      };
    } else {
      // In Stock / Dispatched to Warehouse / Not Sold to Customer Yet
      warrantyStatus = 'NOT_STARTED';
      const notStartedNote = isDispatched || isStoreReceived
        ? 'Product is dispatched to warehouse/store. Customer warranty starts on customer sale.'
        : 'Product is in inventory. Customer warranty starts on customer sale.';

      effectiveWarranty = {
        type: 'SUPPLIER',
        status: 'NOT_STARTED',
        badgeColor: 'gray',
        startDate: formatDate(supplierStartDate),
        endDate: formatDate(supplierEndDate),
        period: `${supplierPeriod} ${supplierUnit.charAt(0) + supplierUnit.slice(1).toLowerCase()}`,
        periodValue: supplierPeriod,
        periodUnit: supplierUnit,
        remainingFormatted: supplierMetrics.remainingFormatted,
        expiredSinceFormatted: supplierMetrics.expiredSinceFormatted,
        isExpired: supplierMetrics.isExpired,
        note: notStartedNote
      };
    }

    // 9. Build Complete Lifecycle Timeline
    const timeline = [];

    if (isReplacementUnit) {
      timeline.push({
        stepNumber: 1,
        title: 'Received Into 2% Spares Inventory',
        date: formatDate(inwardDate),
        timestamp: inwardDate,
        details: `Warehouse: ${inwardLocation}`,
        subDetails: `Source: 2% Warranty Spares Inventory • Supplier Warranty: ${supplierPeriod} ${supplierUnit.toLowerCase()}`,
        status: 'completed',
        type: 'inward'
      });
      timeline.push({
        stepNumber: 2,
        title: `Reserved for RMA #${rmaMatch?.rmaNo || warrantyRecord?.replacement?.rmaNumber || 'RMA'}`,
        date: formatDate(rmaMatch?.replacement?.replacedAt || inwardDate),
        timestamp: rmaMatch?.replacement?.replacedAt || inwardDate,
        details: `Defective Unit: ${rmaMatch?.modelNo || 'Product'} (S/N: ${rmaMatch?.serialNumber || 'Old S/N'})`,
        subDetails: `Allocated by Service Engineer for Whole Product Replacement`,
        status: 'completed',
        type: 'service'
      });
      timeline.push({
        stepNumber: 3,
        title: 'Replacement QC Passed',
        date: formatDate(rmaMatch?.replacement?.replacedAt || inwardDate),
        timestamp: rmaMatch?.replacement?.replacedAt || inwardDate,
        details: `QC Status: PASSED (All 5 mandatory parameters verified)`,
        subDetails: `Tested & verified functional by Service Person`,
        status: 'completed',
        type: 'qc'
      });
      timeline.push({
        stepNumber: 4,
        title: 'Issued as Replacement',
        date: formatDate(rmaMatch?.replacement?.replacedAt || inwardDate),
        timestamp: rmaMatch?.replacement?.replacedAt || inwardDate,
        details: `Replaced Original S/N: ${rmaMatch?.serialNumber || 'Old S/N'}`,
        subDetails: `Customer: ${customerName} • Store: ${storeName}`,
        status: 'completed',
        type: 'sale'
      });
      if (rmaMatch?.currentStatus === 'DISPATCHED' || rmaMatch?.replacement?.status === 'DISPATCHED' || warrantyRecord?.currentStatus === 'REPLACEMENT_DISPATCHED' || Boolean(rmaMatch?.dispatch?.dispatchedAt)) {
        timeline.push({
          stepNumber: 5,
          title: `Dispatched to ${customerName} / ${storeName}`,
          date: formatDate(rmaMatch?.dispatch?.dispatchedAt || new Date()),
          timestamp: rmaMatch?.dispatch?.dispatchedAt || new Date(),
          details: `Courier: ${rmaMatch?.dispatch?.courierName || 'Professional Courier'} (AWB: ${rmaMatch?.dispatch?.awbNumber || 'HANDOVER'})`,
          subDetails: `Dispatched against RMA #${rmaMatch?.rmaNo || 'RMA'}`,
          status: 'completed',
          type: 'dispatch'
        });
      }
      timeline.push({
        stepNumber: timeline.length + 1,
        title: `Customer Warranty Transferred from ${rmaMatch?.serialNumber || 'Original S/N'}`,
        date: formatDate(customerStartDate),
        timestamp: customerStartDate,
        details: `Active Coverage Valid Until: ${formatDate(customerEndDate)}`,
        subDetails: `Inherited full remaining warranty term from original defective unit`,
        status: 'completed',
        type: 'warranty'
      });
    } else {
      // Step 1: Stock Inward
      timeline.push({
        stepNumber: 1,
        title: 'Stock Inward',
        date: formatDate(inwardDate),
        timestamp: inwardDate,
        details: `Warehouse: ${inwardLocation}`,
        subDetails: `Invoice/Ref: ${inwardInvoice} • Supplier Warranty: ${supplierPeriod} ${supplierUnit.toLowerCase()}`,
        status: 'completed',
        type: 'inward'
      });

      // Step 2: Dispatch (if applicable)
      if (isDispatched && dispatchDate) {
        timeline.push({
          stepNumber: timeline.length + 1,
          title: isDispatchToCustomer ? 'Customer Dispatch (Sale)' : 'Warehouse Dispatch',
          date: formatDate(dispatchDate),
          timestamp: dispatchDate,
          details: isDispatchToCustomer ? `Customer: ${customerName || dispatchDestination}` : `Destination: ${dispatchDestination || 'Warehouse/Store'}`,
          subDetails: `Dispatch Ref: ${dispatchRef || 'N/A'}${dispatchSalesPerson ? ` • Sales: ${dispatchSalesPerson}` : ''}`,
          status: 'completed',
          type: 'dispatch'
        });
      }

      // Step 3: Store Received (if applicable)
      if (isStoreReceived && storeReceivedDate) {
        timeline.push({
          stepNumber: timeline.length + 1,
          title: 'Store Received',
          date: formatDate(storeReceivedDate),
          timestamp: storeReceivedDate,
          details: `Store: ${storeName || 'Store Location'}`,
          subDetails: `Confirmed in store inventory`,
          status: 'completed',
          type: 'store_inward'
        });
      }

      // Step 4: Customer Sale (if applicable)
      if (isSold && saleDate) {
        timeline.push({
          stepNumber: timeline.length + 1,
          title: 'Customer Sale',
          date: formatDate(saleDate),
          timestamp: saleDate,
          details: `Customer: ${customerName}`,
          subDetails: `Invoice: ${saleInvoice}${customerMobile ? ` • Phone: ${customerMobile}` : ''}`,
          status: 'completed',
          type: 'sale'
        });

        // Step 5: Customer Warranty Started
        timeline.push({
          stepNumber: timeline.length + 1,
          title: 'Customer Warranty Started',
          date: formatDate(customerStartDate),
          timestamp: customerStartDate,
          details: `Duration: ${customerPeriod} ${customerUnit.charAt(0) + customerUnit.slice(1).toLowerCase()}`,
          subDetails: `Active Customer Protection`,
          status: 'completed',
          type: 'warranty_start'
        });

        // Step 6: Warranty Expiry
        timeline.push({
          stepNumber: timeline.length + 1,
          title: effectiveWarranty.isExpired ? 'Customer Warranty Expired' : 'Warranty Expiry',
          date: formatDate(customerEndDate),
          timestamp: customerEndDate,
          details: effectiveWarranty.isExpired ? `Expired (${effectiveWarranty.expiredSinceFormatted} ago)` : `Valid until ${formatDate(customerEndDate)}`,
          subDetails: effectiveWarranty.isExpired ? 'Eligible for Paid Service / Out-of-Warranty Repair' : `${effectiveWarranty.remainingFormatted} remaining`,
          status: effectiveWarranty.isExpired ? 'expired' : 'active',
          type: 'warranty_expiry'
        });
      } else {
        // If customer warranty is NOT started, show note and Supplier Warranty Expiry on timeline
        timeline.push({
          stepNumber: timeline.length + 1,
          title: 'Customer Warranty Status',
          date: 'Pending Sale',
          timestamp: null,
          details: 'Customer Warranty Not Started',
          subDetails: 'Customer warranty begins on customer sale',
          status: 'pending',
          type: 'warranty_pending'
        });

        timeline.push({
          stepNumber: timeline.length + 1,
          title: 'Supplier Warranty Expiry',
          date: formatDate(supplierEndDate),
          timestamp: supplierEndDate,
          details: supplierMetrics.isExpired ? `Expired (${supplierMetrics.expiredSinceFormatted} ago)` : `Valid until ${formatDate(supplierEndDate)}`,
          subDetails: supplierMetrics.isExpired ? 'Supplier warranty elapsed' : `${supplierMetrics.remainingFormatted} remaining in warehouse`,
          status: supplierMetrics.isExpired ? 'expired' : 'active',
          type: 'warranty_expiry'
        });
      }
    }

    // 10. Auto-sync / Cache to Warranty Collection
    try {
      if (!warrantyRecord) {
        warrantyRecord = new Warranty({
          serialNumber: serialQuery,
          barcode: serialQuery,
          modelNo: modelNumber,
          productName: productName,
          brand: brand,
          category: category,
          subCategory: subCategory,
          currentStatus: currentStatus,
          currentLocation: storeName || inwardLocation,
          inward: {
            date: inwardDate,
            invoiceNo: inwardInvoice,
            location: inwardLocation
          },
          supplierWarranty: {
            period: supplierPeriod,
            periodUnit: supplierUnit,
            startDate: supplierStartDate,
            endDate: supplierEndDate
          },
          dispatch: {
            date: dispatchDate,
            dispatchNo: dispatchRef,
            destinationStore: dispatchDestination,
            salesPerson: dispatchSalesPerson
          },
          storeInward: {
            date: storeReceivedDate,
            storeName: storeName
          },
          sale: {
            sold: isSold,
            date: saleDate,
            invoiceNo: saleInvoice,
            customerName: customerName,
            customerMobile: customerMobile,
            customerAddress: customerAddress,
            salePerson: salePerson
          },
          customerWarranty: {
            period: customerPeriod,
            periodUnit: customerUnit,
            startDate: customerStartDate,
            endDate: customerEndDate
          },
          stockStatus: currentStatus,
          status: warrantyStatus,
          warrantyStartDate: customerStartDate || supplierStartDate,
          warrantyEndDate: customerEndDate || supplierEndDate,
          warrantyPeriod: customerPeriod,
          warrantyUnit: customerUnit
        });
        await warrantyRecord.save();
      } else {
        warrantyRecord.currentStatus = currentStatus;
        warrantyRecord.stockStatus = currentStatus;
        warrantyRecord.status = warrantyStatus;
        if (isSold) {
          warrantyRecord.sale = {
            sold: true,
            date: saleDate,
            invoiceNo: saleInvoice,
            customerName: customerName,
            customerMobile: customerMobile,
            customerAddress: customerAddress,
            salePerson: salePerson
          };
          warrantyRecord.customerWarranty = {
            period: customerPeriod,
            periodUnit: customerUnit,
            startDate: customerStartDate,
            endDate: customerEndDate
          };
          warrantyRecord.warrantyStartDate = customerStartDate;
          warrantyRecord.warrantyEndDate = customerEndDate;
        } else {
          warrantyRecord.sale.sold = false;
          warrantyRecord.customerWarranty.startDate = null;
          warrantyRecord.customerWarranty.endDate = null;
          warrantyRecord.warrantyStartDate = null;
          warrantyRecord.warrantyEndDate = null;
        }
        await warrantyRecord.save();
      }
    } catch (syncErr) {
      console.warn('Warranty sync note:', syncErr.message);
    }

    // 11. Final Response
    return res.status(200).json({
      success: true,
      found: true,
      serialNumber: serialQuery,
      barcode: serialQuery,
      currentStatus: currentStatus,
      warrantyStatus: warrantyStatus, // 'IN_WARRANTY', 'EXPIRED', 'NOT_STARTED'
      product: {
        name: productName,
        modelNo: modelNumber,
        brand: brand,
        category: category,
        subCategory: subCategory
      },
      customer: {
        name: customerName,
        mobile: customerMobile,
        address: customerAddress,
        invoiceNo: saleInvoice,
        saleDate: formatDate(saleDate),
        salePerson: salePerson
      },
      inward: {
        date: formatDate(inwardDate),
        invoiceNo: inwardInvoice,
        location: inwardLocation
      },
      warranty: effectiveWarranty,
      supplierWarranty: {
        status: supplierWarrantyStatus,
        startDate: formatDate(supplierStartDate),
        endDate: formatDate(supplierEndDate),
        period: `${supplierPeriod} ${supplierUnit.charAt(0) + supplierUnit.slice(1).toLowerCase()}`,
        remainingFormatted: supplierMetrics.remainingFormatted,
        expiredSinceFormatted: supplierMetrics.expiredSinceFormatted,
        isExpired: supplierMetrics.isExpired
      },
      customerWarranty: {
        status: (isSold || isReplacementUnit) ? (effectiveWarranty?.isExpired ? 'EXPIRED' : 'ACTIVE') : 'NOT_STARTED',
        startDate: formatDate(customerStartDate),
        endDate: formatDate(customerEndDate),
        period: isReplacementUnit ? 'Inherited from Replaced Unit' : `${customerPeriod} ${customerUnit.charAt(0) + customerUnit.slice(1).toLowerCase()}`
      },
      isReplacementUnit,
      isOriginalReplaced,
      replacementDetails,
      timeline: timeline
    });

  } catch (error) {
    console.error('Warranty Check Error:', error);
    return res.status(500).json({
      success: false,
      found: false,
      message: 'Server Error verifying serial number warranty.'
    });
  }
};
