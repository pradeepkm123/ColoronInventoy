const CartonBox = require('../models/CartonBox');
const ModelSequence = require('../models/ModelSequence');
const Warranty = require('../models/Warranty');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const { emitToSuperAdmin, emitToAll } = require('../socket');

// 1. Get list of all Models with generated serial barcode data
exports.getModels = async (req, res) => {
  try {
    const sequences = await ModelSequence.find({}).sort({ updatedAt: -1 });
    const packedBoxes = await CartonBox.find({});

    // Count packed serials per model
    const packedCountMap = {};
    packedBoxes.forEach(box => {
      if (box.modelNo) {
        packedCountMap[box.modelNo] = (packedCountMap[box.modelNo] || 0) + (box.serialNumbers?.length || 0);
      }
    });

    const modelList = sequences.map(seq => {
      const totalSerials = Array.isArray(seq.barcodes) ? seq.barcodes.length : 0;
      const packedSerials = packedCountMap[seq.modelNo] || 0;
      const availableSerials = Math.max(0, totalSerials - packedSerials);

      return {
        modelNo: seq.modelNo,
        productType: seq.productType || 'DOME CAMERA',
        resolution: seq.resolution || '4MP',
        lens: seq.lens || '2.8 mm',
        dualLight: Boolean(seq.dualLight || seq.features?.dualLight),
        features: seq.features,
        totalSerials,
        packedSerials,
        availableSerials,
        updatedAt: seq.updatedAt
      };
    });

    res.status(200).json({ success: true, models: modelList });
  } catch (err) {
    console.error('Error fetching carton models:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Get Available Serials and Specs for a chosen Model No
exports.getAvailableSerials = async (req, res) => {
  try {
    const { modelNo } = req.query;
    if (!modelNo) {
      return res.status(400).json({ success: false, message: 'modelNo query parameter is required' });
    }

    const cleanModel = modelNo.trim();

    // Fetch sequence and existing packed boxes
    const [seq, packedBoxes, product] = await Promise.all([
      ModelSequence.findOne({ modelNo: cleanModel }),
      CartonBox.find({ modelNo: cleanModel }).sort({ createdAt: -1 }),
      Product.findOne({ model: cleanModel })
    ]);

    // Gather all serials from ModelSequence or Warranty
    let allSerials = [];
    if (seq && Array.isArray(seq.barcodes) && seq.barcodes.length > 0) {
      allSerials = seq.barcodes;
    } else {
      const warranties = await Warranty.find({ modelNo: cleanModel }).select('barcode serialNumber');
      allSerials = warranties.map(w => w.barcode || w.serialNumber).filter(Boolean);
    }

    // Set of already packed serial numbers
    const packedSerialsSet = new Set();
    packedBoxes.forEach(box => {
      (box.serialNumbers || []).forEach(sn => packedSerialsSet.add(sn));
    });

    // Unpacked available serial numbers
    const availableSerials = allSerials.filter(sn => !packedSerialsSet.has(sn));

    // Next Carton Box Number
    const cleanPrefix = cleanModel.replace(/[^a-zA-Z0-9]/g, '');
    const nextBoxNum = String(packedBoxes.length + 1).padStart(3, '0');
    const nextCartonNo = `CB-${cleanPrefix}-${nextBoxNum}`;

    const specs = {
      modelNo: cleanModel,
      productType: seq?.productType || product?.subCategory || 'DOME CAMERA',
      resolution: seq?.resolution || '4MP',
      lens: seq?.lens || '2.8 mm',
      badgeType: 'SMART HYBRID',
      defaultNetWeight: '6.07 KG',
      defaultGrossWeight: '6.82 KG',
      defaultQuantity: 20
    };

    res.status(200).json({
      success: true,
      specs,
      nextCartonNo,
      availableSerials,
      allSerials,
      totalSerials: allSerials.length,
      packedCount: packedSerialsSet.size,
      availableCount: availableSerials.length,
      packedBoxes
    });
  } catch (err) {
    console.error('Error fetching available serials for carton:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Create & Save a new Carton Box
exports.createCartonBox = async (req, res) => {
  try {
    const {
      cartonNo,
      modelNo,
      productType,
      resolution,
      lens,
      badgeType,
      quantity,
      netWeight,
      grossWeight,
      serialNumbers,
      companyName,
      addressLine1,
      addressLine2,
      country
    } = req.body;

    if (!modelNo) {
      return res.status(400).json({ success: false, message: 'modelNo is required' });
    }

    if (!serialNumbers || !Array.isArray(serialNumbers) || serialNumbers.length === 0) {
      return res.status(400).json({ success: false, message: 'At least 1 serial number must be packed in the carton box' });
    }

    // Auto-generate cartonNo if not provided
    let finalCartonNo = cartonNo ? cartonNo.trim() : '';
    if (!finalCartonNo) {
      const count = await CartonBox.countDocuments({ modelNo: modelNo.trim() });
      const cleanPrefix = modelNo.trim().replace(/[^a-zA-Z0-9]/g, '');
      finalCartonNo = `CB-${cleanPrefix}-${String(count + 1).padStart(3, '0')}`;
    }

    // Check if cartonNo already exists
    const existing = await CartonBox.findOne({ cartonNo: finalCartonNo });
    if (existing) {
      return res.status(400).json({ success: false, message: `Carton Box "${finalCartonNo}" already exists.` });
    }

    // QR Data encodes the serial numbers separated by newline for fast hardware/camera scanning
    const qrData = serialNumbers.join('\n');

    const newBox = new CartonBox({
      cartonNo: finalCartonNo,
      modelNo: modelNo.trim(),
      productType: productType || 'DOME CAMERA',
      resolution: resolution || '4MP',
      lens: lens || '2.8 mm',
      badgeType: badgeType || 'SMART HYBRID',
      quantity: Number(quantity) || serialNumbers.length,
      netWeight: netWeight || '6.07 KG',
      grossWeight: grossWeight || '6.82 KG',
      serialNumbers,
      qrData,
      barcode: finalCartonNo,
      companyName: companyName || 'Lookman Distribution Private limited',
      addressLine1: addressLine1 || 'No.9/15, II Street Extn, III Main Road,',
      addressLine2: addressLine2 || 'CIT Nagar, Nandanam, Chennai - 600 035.',
      country: country || 'MADE IN INDIA',
      status: 'PACKED',
      createdAt: new Date()
    });

    await newBox.save();

    try {
      const cartonNotif = await Notification.create({
        category: 'INVENTORY',
        type: 'carton_packed',
        senderName: 'Lookman HO / Packing',
        senderRole: 'STORE',
        recipientName: 'Super Admin',
        recipientRole: 'SUPER_ADMIN',
        storeId: 'Main Store',
        userLocation: 'Main Store',
        modelNo: modelNo.trim(),
        title: `📦 Carton Box Packed: ${finalCartonNo}`,
        actionText: 'packed carton box:',
        targetText: `Carton Box ${finalCartonNo} packed with ${serialNumbers.length} S/N for model ${modelNo.trim()} (${quantity || serialNumbers.length} units).`,
        read: false,
        isRead: false,
        metadata: {
          cartonNo: finalCartonNo,
          modelNo: modelNo.trim(),
          quantity: serialNumbers.length,
          productType: productType || 'DOME CAMERA',
        },
      });

      emitToSuperAdmin('notification_received', {
        notification: cartonNotif,
        message: `📦 Carton Box ${finalCartonNo} packed with ${serialNumbers.length} serial numbers!`,
      });
      emitToAll('notification:new', {
        notification: cartonNotif,
      });
    } catch (notifErr) {
      console.warn('Failed to create carton notification:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: `Carton Box ${finalCartonNo} saved successfully with ${serialNumbers.length} serial numbers!`,
      cartonBox: newBox
    });
  } catch (err) {
    console.error('Error creating carton box:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Get History List of Carton Boxes
exports.getCartonBoxes = async (req, res) => {
  try {
    const { modelNo } = req.query;
    const filter = {};
    if (modelNo) {
      filter.modelNo = modelNo.trim();
    }

    const boxes = await CartonBox.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, cartonBoxes: boxes });
  } catch (err) {
    console.error('Error fetching carton boxes list:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Delete a Carton Box (Unpacks serials back to available pool)
exports.deleteCartonBox = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CartonBox.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Carton box not found' });
    }

    res.status(200).json({
      success: true,
      message: `Carton Box ${deleted.cartonNo} deleted. Its ${deleted.serialNumbers?.length || 0} serial numbers are now available again.`
    });
  } catch (err) {
    console.error('Error deleting carton box:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
