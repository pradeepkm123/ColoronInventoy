const ServiceRequest = require('../models/ServiceRequest');
const RMA = require('../models/RMA');
const RMAHistory = require('../models/RMAHistory');
const ServiceInventoryTransaction = require('../models/ServiceInventoryTransaction');
const Customer = require('../models/CustomerModel');
const StockOutward = require('../models/StockOutward');
const Warranty = require('../models/Warranty');
const StoreInward = require('../models/StoreInward');
const Dispatch = require('../models/Dispatch');
const { getNextTicketNo, getNextRMANo } = require('../services/sequenceService');
const { notifyServiceStatusChange } = require('../services/notificationService');
const { notifyServiceRequestCreated, notifyServiceStageProgress } = require('../services/serviceNotificationHelper');

const StoreCustomer = require('../models/StoreCustomer');

// Lookup Customer by Mobile or create new
const findOrCreateCustomer = async (customerData, storeName) => {
  if (!customerData?.mobile) return null;
  try {
    let customer = await StoreCustomer.findOne({ phoneNo: customerData.mobile });
    if (!customer) {
      customer = await StoreCustomer.create({
        customerName: customerData.name || 'Walk-in Customer',
        phoneNo: customerData.mobile,
        mailId: customerData.email || `${customerData.mobile}@customer.com`,
        address: customerData.address || 'N/A',
        storeName: storeName || 'Main Store',
        storeHandler: 'Service Counter',
        gst: 'N/A',
      });
    }
    return customer;
  } catch (err) {
    console.error('Customer lookup/create error:', err.message);
    return null;
  }
};

// Automatic Warranty Validator based on Serial Number / Sales & Inward history
const lookupSerialWarranty = async (serialNumber) => {
  if (!serialNumber) return { found: false, status: 'UNKNOWN' };
  const cleanSerial = String(serialNumber).trim();
  if (!cleanSerial) return { found: false, status: 'UNKNOWN' };

  try {
    const escaped = cleanSerial.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 0. Check RMA collection for already replaced defective units
    const rmaReplacedDefective = await RMA.findOne({
      serialNumber: { $regex: new RegExp(`^${escaped}$`, 'i') },
      'replacement.isReplaced': true
    }).lean();

    // 1. Check Warranty collection
    const warrantyDoc = await Warranty.findOne({
      $or: [
        { barcode: { $regex: new RegExp(`^${escaped}$`, 'i') } },
        { serialNumber: { $regex: new RegExp(`^${escaped}$`, 'i') } },
      ]
    });

    if (rmaReplacedDefective || warrantyDoc?.currentStatus === 'REPLACED' || warrantyDoc?.replacement?.isOriginalReplaced) {
      const repSN = rmaReplacedDefective?.replacement?.replacementSerial || rmaReplacedDefective?.replacement?.newSerialNumber || warrantyDoc?.replacement?.replacedBySerialNumber || 'N/A';
      const rmaNumber = rmaReplacedDefective?.rmaNo || warrantyDoc?.replacement?.rmaNumber || 'RMA';
      return {
        found: true,
        isReplaced: true,
        inwarded: true,
        status: 'REPLACED',
        replacedBySerialNumber: repSN,
        rmaNumber: rmaNumber,
        modelNo: rmaReplacedDefective?.modelNo || warrantyDoc?.modelNo || '',
        category: warrantyDoc?.category || 'HD CAMERA',
        message: `⛔ This defective unit (S/N: ${cleanSerial}) was already replaced under RMA #${rmaNumber}. Replacement S/N issued: ${repSN}. You cannot raise a service request on a replaced defective unit. Please use the replacement serial number instead.`
      };
    }

    // Check if this unit is an RMA replacement product
    const rmaReplacementUnit = await RMA.findOne({
      $or: [
        { 'replacement.replacementSerial': { $regex: new RegExp(`^${escaped}$`, 'i') } },
        { 'replacement.newSerialNumber': { $regex: new RegExp(`^${escaped}$`, 'i') } }
      ]
    }).lean();

    if (rmaReplacementUnit || warrantyDoc?.replacement?.isReplacement || warrantyDoc?.stockStatus === 'ISSUED_FOR_REPLACEMENT') {
      const origSN = rmaReplacementUnit?.serialNumber || warrantyDoc?.replacement?.replacesSerialNumber || 'N/A';
      const rmaNumber = rmaReplacementUnit?.rmaNo || warrantyDoc?.replacement?.rmaNumber || 'RMA';
      const purchaseDate = warrantyDoc?.customerWarranty?.startDate || rmaReplacementUnit?.createdAt || new Date();
      let expiryDate = warrantyDoc?.customerWarranty?.endDate || rmaReplacementUnit?.estimate?.warrantyExpiry;
      if (!expiryDate && purchaseDate) {
        const pDate = new Date(purchaseDate);
        pDate.setFullYear(pDate.getFullYear() + 2);
        expiryDate = pDate;
      }
      const isUnderWarranty = expiryDate ? new Date() <= new Date(expiryDate) : true;

      return {
        found: true,
        isReplacementUnit: true,
        inwarded: true,
        foundSale: true,
        modelNo: rmaReplacementUnit?.replacement?.replacementModel || warrantyDoc?.modelNo || 'CO-I-4DFDML(E)',
        category: warrantyDoc?.category || 'HD CAMERA',
        subCategory: warrantyDoc?.subCategory || '',
        purchaseDate,
        expiryDate,
        invoiceNo: `RMA-${rmaNumber}`,
        status: isUnderWarranty ? 'IN_WARRANTY' : 'EXPIRED',
        dealerName: rmaReplacementUnit?.storeName || 'COLORON Service',
        customerName: rmaReplacementUnit?.customerSnapshot?.name || warrantyDoc?.sale?.customerName || '',
        customerMobile: rmaReplacementUnit?.customerSnapshot?.mobile || warrantyDoc?.sale?.customerMobile || '',
        customerAddress: rmaReplacementUnit?.customerSnapshot?.address || '',
        warrantyInheritedFrom: origSN,
        rmaNumber: rmaNumber,
        message: `✓ Verified: RMA Replacement Unit (Inherited warranty from original S/N: ${origSN} under RMA #${rmaNumber}).`
      };
    }

    if (warrantyDoc) {
      const isSold = warrantyDoc.currentStatus === 'SOLD' || warrantyDoc.sale?.sold;
      let status = 'IN_WARRANTY';
      let purchaseDate = warrantyDoc.sale?.date || warrantyDoc.warrantyStartDate || warrantyDoc.createdAt;
      let expiryDate = warrantyDoc.warrantyEndDate;

      if (!expiryDate && purchaseDate) {
        const period = warrantyDoc.customerWarranty?.period || warrantyDoc.warrantyPeriod || 24;
        const pDate = new Date(purchaseDate);
        pDate.setMonth(pDate.getMonth() + period);
        expiryDate = pDate;
      }

      if (expiryDate && new Date() > new Date(expiryDate)) {
        status = 'EXPIRED';
      }

      return {
        found: true,
        foundSale: isSold,
        inwarded: true,
        modelNo: warrantyDoc.modelNo || warrantyDoc.productName || '',
        category: warrantyDoc.category || '',
        subCategory: warrantyDoc.subCategory || '',
        purchaseDate,
        expiryDate,
        invoiceNo: warrantyDoc.invoiceNo || '',
        status,
        dealerName: warrantyDoc.currentLocation || warrantyDoc.sale?.customerName || '',
      };
    }

    // 2. Check StockOutward sales records
    const sale = await StockOutward.findOne({
      $or: [
        { scannedCodes: { $regex: new RegExp(`\\b${escaped}\\b`, 'i') } },
        { scannedList: { $regex: new RegExp(`^${escaped}$`, 'i') } },
      ],
    }).sort({ createdAt: -1 });

    if (sale && sale.createdAt) {
      const purchaseDate = new Date(sale.createdAt);
      const expiryDate = new Date(purchaseDate);
      expiryDate.setMonth(expiryDate.getMonth() + 24); // 24 months standard warranty

      const isUnderWarranty = new Date() <= expiryDate;
      return {
        found: true,
        foundSale: true,
        inwarded: true,
        modelNo: sale.modelNo,
        category: sale.category,
        subCategory: sale.subCategory,
        purchaseDate,
        expiryDate,
        invoiceNo: sale._id ? `INV-${String(sale._id).slice(-6).toUpperCase()}` : '',
        status: isUnderWarranty ? 'IN_WARRANTY' : 'EXPIRED',
        dealerName: sale.storeName || 'COLORON Direct',
      };
    }

    // 3. Check StoreInward records
    const inwardDoc = await StoreInward.findOne({
      $or: [
        { scannedBarcode: { $regex: new RegExp(`\\b${escaped}\\b`, 'i') } },
        { scannedBarcode: { $regex: new RegExp(`^${escaped}$`, 'i') } },
      ]
    });

    if (inwardDoc) {
      return {
        found: true,
        foundSale: false,
        inwarded: true,
        modelNo: inwardDoc.modelNo,
        category: inwardDoc.category,
        subCategory: inwardDoc.subCategory,
        purchaseDate: inwardDoc.createdAt,
        expiryDate: null,
        invoiceNo: '',
        status: 'IN_WARRANTY',
        dealerName: inwardDoc.storeName || '',
      };
    }

    // 4. Check Dispatch records
    const dispatchDoc = await Dispatch.findOne({
      $or: [
        { barcodes: { $regex: new RegExp(`\\b${escaped}\\b`, 'i') } },
        { barcodes: { $regex: new RegExp(`^${escaped}$`, 'i') } },
      ]
    });

    if (dispatchDoc) {
      return {
        found: true,
        foundSale: false,
        inwarded: true,
        modelNo: dispatchDoc.modelNo,
        category: dispatchDoc.category,
        subCategory: dispatchDoc.subCategory,
        purchaseDate: dispatchDoc.dispatchDate || dispatchDoc.createdAt,
        expiryDate: null,
        invoiceNo: dispatchDoc.invoiceNumber || '',
        status: 'IN_WARRANTY',
        dealerName: dispatchDoc.storeName || '',
      };
    }
  } catch (err) {
    console.error('Serial warranty lookup error:', err);
  }

  // If not found in ANY system records, it was NOT inwarded in software!
  return {
    found: false,
    foundSale: false,
    inwarded: false,
    status: 'NOT_INWARDED',
    message: `Serial Number "${serialNumber}" is NOT inwarded in software (Out of Warranty / Chargeable).`,
  };
};

// 1. Create Service Request (Raise Service)
const createServiceRequest = async (req, res) => {
  try {
    const {
      customerName,
      mobile,
      whatsapp,
      email,
      address,
      city,
      pincode,
      modelNo,
      productType,
      category,
      subCategory,
      serialNumber,
      purchaseDate,
      invoiceNo,
      dealerName,
      warrantyStatus,
      accessories,
      complaintCategory,
      complaintDescription,
      attachments,
      storeName,
      createdBy,
      userRole,
    } = req.body;

    const requesterRole = String(userRole || req.body.role || req.body.createdByRole || '').toLowerCase().trim();
    if (
      requesterRole === 'service person' ||
      requesterRole === 'service engineer' ||
      requesterRole === 'technician' ||
      requesterRole === 'engineer' ||
      (requesterRole.includes('service') && !requesterRole.includes('center') && !requesterRole.includes('shoppee') && !requesterRole.includes('shop') && !requesterRole.includes('store') && !requesterRole.includes('customer') && !requesterRole.includes('admin'))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Permission Denied: Service Persons cannot raise service requests. Service requests must be created by Store, Customer, or Super Admin.',
      });
    }

    if (!customerName || !mobile || !modelNo || !serialNumber || !complaintCategory) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (Customer Name, Mobile, Model No, Serial No, Complaint Category)',
      });
    }

    // Prevent raising service requests on already replaced defective units
    const cleanEscaped = serialNumber.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rmaReplacedDefective = await RMA.findOne({
      serialNumber: { $regex: new RegExp(`^${cleanEscaped}$`, 'i') },
      'replacement.isReplaced': true
    });
    if (rmaReplacedDefective) {
      return res.status(400).json({
        success: false,
        message: `Cannot raise service request: This defective product was already replaced under RMA #${rmaReplacedDefective.rmaNo}. Replacement S/N: ${rmaReplacedDefective.replacement?.replacementSerial || 'N/A'}. Please raise service using the replacement serial number.`
      });
    }

    // Enforce Store Identity
    const store = storeName || req.user?.role || req.user?.assignedLocation || 'Main Store';
    const userIdentifier = createdBy || req.user?.name || req.user?.email || 'Store User';

    // 1. Customer deduplication
    const customer = await findOrCreateCustomer(
      {
        name: customerName,
        mobile,
        email,
        address,
        city,
        pincode,
      },
      store
    );

    // 2. Generate SR ticket number
    const ticketNo = await getNextTicketNo();

    // 3. Warranty lookup calculation
    const autoWarranty = await lookupSerialWarranty(serialNumber);
    const finalWarrantyStatus = warrantyStatus || autoWarranty.status || 'IN_WARRANTY';
    const finalExpiryDate = autoWarranty.expiryDate || null;
    const finalPurchaseDate = purchaseDate ? new Date(purchaseDate) : autoWarranty.purchaseDate || null;

    // 4. Create Service Request record
    const serviceRequest = await ServiceRequest.create({
      ticketNo,
      storeName: store,
      customerId: customer?._id,
      customerSnapshot: {
        name: customerName,
        mobile,
        whatsapp: whatsapp || mobile,
        email: email || '',
        address: address || '',
        city: city || '',
        pincode: pincode || '',
      },
      modelNo,
      productType: productType || category || 'CCTV',
      category: category || 'Hardware',
      subCategory: subCategory || '',
      serialNumber: serialNumber.trim(),
      purchaseDate: finalPurchaseDate,
      invoiceNo: invoiceNo || autoWarranty.invoiceNo || '',
      dealerName: dealerName || autoWarranty.dealerName || '',
      warranty: {
        status: finalWarrantyStatus,
        expiryDate: finalExpiryDate,
        warrantyPeriodMonths: 24,
      },
      accessories: Array.isArray(accessories) ? accessories : accessories ? [accessories] : [],
      complaint: {
        category: complaintCategory,
        description: complaintDescription || complaintCategory,
      },
      attachments: attachments || [],
      currentStatus: 'SERVICE_REQUEST_CREATED',
      createdBy: userIdentifier,
    });

    // 5. Trigger customer notification (SMS, WhatsApp, Email)
    await notifyServiceStatusChange({
      event: 'SERVICE_REQUEST_CREATED',
      serviceRequest,
      customer: serviceRequest.customerSnapshot,
    });

    // 6. Trigger Real-time In-App & Socket Notification for Store, Super Admin & Service Team
    await notifyServiceRequestCreated(serviceRequest, {
      name: userIdentifier,
      role: requesterRole || 'Store',
    });

    res.status(201).json({
      success: true,
      message: `Service Request ${ticketNo} registered successfully`,
      data: serviceRequest,
    });
  } catch (err) {
    console.error('Create Service Request Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Get All Service Requests (Scoped by Store & Allocation Privacy)
const getAllServiceRequests = async (req, res) => {
  try {
    const { storeName, status, search, userRole, userName, userId, page = 1, limit = 50 } = req.query;
    const query = {};

    // Store isolation
    const roleLower = (userRole || req.user?.role || '').toLowerCase().trim();
    const isSuperAdmin = ['admin', 'super admin', 'manager', 'warehouse', 'headoffice'].includes(roleLower) || roleLower.includes('admin');
    const isServicePerson = roleLower.includes('service') || roleLower === 'engineer' || roleLower === 'technician';
    const currentUserName = (userName || req.user?.name || '').trim();
    const currentUserId = (userId || req.user?._id || req.user?.id || '').toString().trim();

    if (!isSuperAdmin && !isServicePerson && storeName) {
      query.storeName = { $regex: new RegExp(`^${storeName}$`, 'i') };
    }

    if (status) {
      query.currentStatus = status;
    }

    if (search) {
      const matchingRMAs = await RMA.find({
        $or: [
          { rmaNo: { $regex: search, $options: 'i' } },
          { serialNumber: { $regex: search, $options: 'i' } },
          { ticketNo: { $regex: search, $options: 'i' } }
        ]
      }).select('_id serviceRequestId').lean();

      const matchedServiceRequestIds = matchingRMAs.map(r => r.serviceRequestId).filter(Boolean);
      const matchedRmaIds = matchingRMAs.map(r => r._id);

      query.$or = [
        { ticketNo: { $regex: search, $options: 'i' } },
        { modelNo: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.mobile': { $regex: search, $options: 'i' } },
        ...(matchedServiceRequestIds.length > 0 ? [{ _id: { $in: matchedServiceRequestIds } }] : []),
        ...(matchedRmaIds.length > 0 ? [{ rmaId: { $in: matchedRmaIds } }] : [])
      ];
    }

    // 1. Fetch raw service requests
    const rawRequests = await ServiceRequest.find(query).sort({ createdAt: -1 });

    // 2. Lookup matching RMAs for all requests with rmaId
    const rmaIds = rawRequests.map(r => r.rmaId).filter(Boolean);
    const rmaList = rmaIds.length > 0 ? await RMA.find({ _id: { $in: rmaIds } }).lean() : [];
    const rmaMap = new Map();
    rmaList.forEach(rma => {
      rmaMap.set(rma._id.toString(), rma);
    });

    // 3. Attach RMA details & Apply Allocation Privacy Rule for Service Persons:
    // If an RMA is allocated to a specific Service Person:
    // - ONLY that Service Person and Super Admin can see it.
    // - If it has NO RMA or the RMA is unassigned, ALL Service Persons can see it.
    let enrichedData = rawRequests.map(doc => {
      const obj = doc.toObject();
      if (obj.rmaId && rmaMap.has(obj.rmaId.toString())) {
        const matchingRMA = rmaMap.get(obj.rmaId.toString());
        obj.assignedEngineer = matchingRMA.assignedEngineer;
        obj.priority = matchingRMA.priority || 'NORMAL';
        obj.rmaCurrentStatus = matchingRMA.currentStatus;
      }
      return obj;
    });

    if (isServicePerson && !isSuperAdmin && currentUserName) {
      const userRegex = new RegExp(`^${currentUserName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      enrichedData = enrichedData.filter(r => {
        const engName = r.assignedEngineer?.name;
        const engId = r.assignedEngineer?.engineerId;
        const isMine = (engName && userRegex.test(engName)) || (currentUserId && engId === currentUserId);
        return Boolean(isMine);
      });
    }

    const total = enrichedData.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedData = enrichedData.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems: total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (err) {
    console.error('Get Service Requests Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Serial Barcode Lookup API (Auto-fills product and warranty on scan)
const validateSerialAndWarranty = async (req, res) => {
  try {
    const { serialNumber } = req.params;
    if (!serialNumber) {
      return res.status(400).json({ success: false, message: 'Serial number is required' });
    }

    const warrantyInfo = await lookupSerialWarranty(serialNumber.trim());
    res.json({
      success: true,
      serialNumber: serialNumber.trim(),
      ...warrantyInfo,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Product Check-In (Generates RMA and logs inventory ledger transaction)
const checkInProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { scannedSerial, inspectedBy, storeName } = req.body;

    const sr = await ServiceRequest.findById(id);
    if (!sr) {
      return res.status(404).json({ success: false, message: 'Service Request not found' });
    }

    if (sr.rmaId) {
      return res.status(400).json({
        success: false,
        message: `Product already checked in under RMA #${sr.rmaNo}`,
      });
    }

    // Barcode matching check
    const expected = (sr.serialNumber || '').trim().toLowerCase();
    const scanned = (scannedSerial || '').trim().toLowerCase();

    if (expected && scanned && expected !== scanned) {
      return res.status(400).json({
        success: false,
        message: `Scanned serial '${scannedSerial}' does not match expected serial '${sr.serialNumber}' for Ticket ${sr.ticketNo}`,
      });
    }

    // 1. Generate unique RMA Number
    const rmaNo = await getNextRMANo();

    // 2. Create RMA record
    const rma = await RMA.create({
      rmaNo,
      serviceRequestId: sr._id,
      ticketNo: sr.ticketNo,
      storeName: sr.storeName,
      customerId: sr.customerId,
      customerSnapshot: sr.customerSnapshot,
      productId: sr.productId,
      modelNo: sr.modelNo,
      category: sr.category,
      serialNumber: sr.serialNumber,
      warrantyStatus: sr.warranty?.status || 'IN_WARRANTY',
      currentStatus: 'PRODUCT_RECEIVED',
      repairType: sr.warranty?.status === 'IN_WARRANTY' ? 'WARRANTY_REPAIR' : 'CHARGEABLE_REPAIR',
      chargeable: sr.warranty?.status !== 'IN_WARRANTY',
      receivedAt: new Date(),
    });

    // 3. Create Service Inventory Ledger Transaction (+1 IN)
    await ServiceInventoryTransaction.create({
      transactionType: 'SERVICE_CHECK_IN',
      rmaId: rma._id,
      rmaNo: rma.rmaNo,
      serviceRequestId: sr._id,
      ticketNo: sr.ticketNo,
      modelNo: sr.modelNo,
      serialNumber: sr.serialNumber,
      quantity: 1,
      direction: 'IN',
      storeName: rma.storeName,
      performedBy: inspectedBy || 'Store User',
      notes: `Product checked in under RMA #${rmaNo} from Ticket #${sr.ticketNo}`,
    });

    // 4. Create immutable audit history
    await RMAHistory.create({
      rmaId: rma._id,
      rmaNo: rma.rmaNo,
      serviceRequestId: sr._id,
      ticketNo: sr.ticketNo,
      action: 'PRODUCT_CHECK_IN',
      fromStatus: 'SERVICE_REQUEST_CREATED',
      toStatus: 'PRODUCT_RECEIVED',
      userName: inspectedBy || 'Store User',
      userRole: 'STORE_USER',
      notes: `Physical product check-in completed. RMA #${rmaNo} generated and service inventory ledger incremented (+1).`,
    });

    // 5. Update Service Request state
    sr.rmaId = rma._id;
    sr.rmaNo = rma.rmaNo;
    sr.currentStatus = 'PRODUCT_RECEIVED';
    await sr.save();

    // 6. Send Product Check-In Notification
    await notifyServiceStatusChange({
      event: 'PRODUCT_RECEIVED',
      rma,
      serviceRequest: sr,
      customer: sr.customerSnapshot,
    });

    // 7. Trigger Real-time In-App & Socket Notification for Check-in / RMA Created
    await notifyServiceStageProgress({
      rma,
      stageKey: 'PRODUCT_RECEIVED',
      stageTitle: '📦 Product Checked-In & RMA Created',
      stageDetails: `Product arrived at ${rma.storeName}. RMA #${rmaNo} generated from Ticket #${sr.ticketNo}.`,
      performedBy: inspectedBy || 'Store User',
      userRole: 'STORE_USER',
    });

    res.json({
      success: true,
      message: `Product successfully checked in! RMA #${rmaNo} generated.`,
      data: {
        serviceRequest: sr,
        rma,
      },
    });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createServiceRequest,
  getAllServiceRequests,
  validateSerialAndWarranty,
  checkInProduct,
};
