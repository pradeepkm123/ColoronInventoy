const SparePart = require('../models/SparePart');
const SparePartInventory = require('../models/SparePartInventory');
const SparePartTransaction = require('../models/SparePartTransaction');
const SparePartUsage = require('../models/SparePartUsage');
const Product = require('../models/Product');
const Category = require('../models/Category');
const SparePartCategory = require('../models/SparePartCategory');
const RMA = require('../models/RMA');

// Helper: Normalize category string for flexible matching
const normalizeCategory = (cat) => {
  if (!cat) return '';
  const c = cat.toLowerCase().trim();
  if (c.includes('camera') || c === 'cctv') return 'Camera';
  if (c.includes('nvr') || c.includes('dvr') || c.includes('xvr')) return 'NVR / DVR';
  if (c.includes('ptz')) return 'PTZ';
  return cat;
};

// Helper: Recalculate and persist real-time stock levels for a spare part
const recalculatePartStock = async (sparePartId) => {
  try {
    const part = await SparePart.findById(sparePartId);
    if (!part) return null;

    let updateFields = {};

    if (part.trackingType === 'SERIALIZED') {
      const allSerials = await SparePartInventory.find({ sparePartId });
      const total = allSerials.filter((s) => s.status !== 'SCRAPPED').length;
      const used = allSerials.filter((s) => s.status === 'INSTALLED').length;
      const available = allSerials.filter((s) => s.status === 'AVAILABLE').length;

      // Group by location
      const locMap = {};
      allSerials.forEach((s) => {
        if (s.status === 'AVAILABLE') {
          const loc = s.location || 'Main Warehouse';
          locMap[loc] = (locMap[loc] || 0) + 1;
        }
      });
      let stockLocations = Object.entries(locMap).map(([location, quantity]) => ({
        location,
        quantity,
      }));
      if (stockLocations.length === 0) {
        stockLocations = [{ location: 'Main Warehouse', quantity: 0 }];
      }

      updateFields = {
        totalStock: total,
        usedStock: used,
        availableStock: available,
        stockLocations,
      };
    } else {
      // Quantity based
      let total = part.totalStock || 0;
      if (Array.isArray(part.stockLocations) && part.stockLocations.length > 0) {
        total = part.stockLocations.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
      }
      const used = part.usedStock || 0;
      const available = Math.max(0, total - used);

      updateFields = {
        totalStock: total,
        usedStock: used,
        availableStock: available,
      };
    }

    const updated = await SparePart.findByIdAndUpdate(
      sparePartId,
      { $set: updateFields },
      { new: true }
    );
    return updated;
  } catch (err) {
    console.error('Recalculate Stock Error:', err);
    return null;
  }
};

// 1. Get All Spare Parts (with filters, tracking type & live stock status)
const getAllSpareParts = async (req, res) => {
  try {
    const { category, search, stockStatus, compatibleModel, trackingType } = req.query;
    const query = {};

    if (category && category !== 'ALL') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (trackingType && trackingType !== 'ALL') {
      query.trackingType = trackingType;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { code: { $regex: s, $options: 'i' } },
        { category: { $regex: s, $options: 'i' } },
        { compatibleProductModels: { $regex: s, $options: 'i' } },
      ];
    }

    if (compatibleModel && compatibleModel.trim()) {
      query.compatibleProductModels = { $regex: new RegExp(`^${compatibleModel.trim()}$`, 'i') };
    }

    const parts = await SparePart.find(query).sort({ category: 1, name: 1 }).lean();

    // Map each part with computed stock status and available serial numbers
    const mapped = await Promise.all(
      parts.map(async (p) => {
        const total = p.totalStock || 0;
        const used = p.usedStock || 0;
        const available = Math.max(0, total - used);
        const minStock = p.minimumStock || 5;
        const tracking = p.trackingType || 'SERIALIZED';

        let availableSerials = [];
        if (tracking === 'SERIALIZED') {
          const serialItems = await SparePartInventory.find({
            sparePartId: p._id,
            status: 'AVAILABLE',
          })
            .select('serialNumber location unitCost')
            .sort({ serialNumber: 1 })
            .lean();

          availableSerials = serialItems.map((s) => s.serialNumber);
        }

        let status = 'AVAILABLE';
        let statusLabel = 'Available';
        let statusColor = '#16a34a'; // Green

        const liveAvailable = tracking === 'SERIALIZED' ? availableSerials.length : available;

        if (liveAvailable === 0) {
          status = 'OUT_OF_STOCK';
          statusLabel = 'Out of Stock';
          statusColor = '#dc2626'; // Red
        } else if (liveAvailable <= minStock) {
          status = 'LOW_STOCK';
          statusLabel = 'Low Stock';
          statusColor = '#ea580c'; // Orange
        }

        return {
          ...p,
          trackingType: tracking,
          totalStock: total,
          usedStock: used,
          availableStock: liveAvailable,
          availableSerials,
          status,
          statusLabel,
          statusColor,
          compatibleCount: (p.compatibleProductModels || []).length,
        };
      })
    );

    let filtered = mapped;
    if (stockStatus && stockStatus !== 'ALL') {
      filtered = mapped.filter((p) => p.status === stockStatus);
    }

    res.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (err) {
    console.error('Get All Spare Parts Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Get Spare Part Categories with Summarized Counts & Stock
const getSparePartCategories = async (req, res) => {
  try {
    const dbCategories = await SparePartCategory.find({ isActive: { $ne: false } }).lean();
    const allParts = await SparePart.find({ isActive: { $ne: false } }).lean();

    const categoryMap = new Map();

    // 1. Add all saved categories from DB
    dbCategories.forEach((c) => {
      const cat = c.name;
      if (cat && !categoryMap.has(cat)) {
        categoryMap.set(cat, {
          category: cat,
          totalParts: 0,
          totalStock: 0,
          usedStock: 0,
          availableStock: 0,
          lowStockParts: 0,
          outOfStockParts: 0,
        });
      }
    });

    // 2. Count spare parts and include any categories assigned to existing parts
    allParts.forEach((p) => {
      const cat = p.category || 'General';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, {
          category: cat,
          totalParts: 0,
          totalStock: 0,
          usedStock: 0,
          availableStock: 0,
          lowStockParts: 0,
          outOfStockParts: 0,
        });
      }
      const cObj = categoryMap.get(cat);
      cObj.totalParts += 1;
      const total = p.totalStock || 0;
      const used = p.usedStock || 0;
      const available = Math.max(0, total - used);
      cObj.totalStock += total;
      cObj.usedStock += used;
      cObj.availableStock += available;

      if (available === 0) {
        cObj.outOfStockParts += 1;
      } else if (available <= (p.minimumStock || 5)) {
        cObj.lowStockParts += 1;
      }
    });

    // NOTE: Hardcoded ['Camera', 'NVR / DVR', 'PTZ'] are removed so that only 'ALL CATEGORIES' shows by default!
    const categories = Array.from(categoryMap.values()).sort((a, b) => b.totalParts - a.totalParts);

    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (err) {
    console.error('Get Spare Part Categories Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2b. Create New Spare Part Category (Properly persisted in DB)
const createSparePartCategory = async (req, res) => {
  try {
    const { name, category, description } = req.body;
    const catName = (name || category || '').trim();
    if (!catName) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    // Case-insensitive duplicate check
    const existing = await SparePartCategory.findOne({
      name: { $regex: new RegExp(`^${catName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
    });

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
        return res.status(200).json({
          success: true,
          message: `Category "${catName}" restored successfully!`,
          data: {
            category: existing.name,
            totalParts: 0,
            totalStock: 0,
            usedStock: 0,
            availableStock: 0,
            lowStockParts: 0,
            outOfStockParts: 0,
          },
        });
      }
      return res.status(400).json({ success: false, message: `Category "${catName}" already exists.` });
    }

    const newCat = new SparePartCategory({
      name: catName,
      description: (description || '').trim(),
      isActive: true,
    });
    await newCat.save();

    return res.status(201).json({
      success: true,
      message: `Category "${catName}" saved to database successfully!`,
      data: {
        category: newCat.name,
        totalParts: 0,
        totalStock: 0,
        usedStock: 0,
        availableStock: 0,
        lowStockParts: 0,
        outOfStockParts: 0,
      },
    });
  } catch (err) {
    console.error('Create spare part category error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2c. Delete Spare Part Category from DB (if no parts attached)
const deleteSparePartCategory = async (req, res) => {
  try {
    const { name } = req.params;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const catName = name.trim();
    const regex = new RegExp(`^${catName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i');

    const partCount = await SparePart.countDocuments({
      category: { $regex: regex },
      isActive: { $ne: false },
    });

    if (partCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${catName}" because it contains ${partCount} active spare parts. Please delete or reassign them first.`,
      });
    }

    await SparePartCategory.deleteMany({ name: { $regex: regex } });

    return res.json({
      success: true,
      message: `Category "${catName}" deleted successfully!`,
    });
  } catch (err) {
    console.error('Delete spare part category error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Get Compatible Spare Parts for a Specific Product Model / Category (Includes available S/N list for serialized parts)
const getCompatibleSparePartsForProduct = async (req, res) => {
  try {
    const { model, category, rmaNo } = req.query;

    let targetCategory = category || '';
    let targetModel = model || '';

    // If model provided, look up Product to find its category if not given
    if (targetModel && !targetCategory) {
      const prod = await Product.findOne({
        $or: [{ model: targetModel }, { modelNo: targetModel }]
      }).lean();

      if (prod) {
        targetCategory = normalizeCategory(prod.category || prod.subCategory);
      }
    }

    if (!targetCategory && targetModel) {
      const mUpper = targetModel.toUpperCase();
      if (mUpper.includes('PTZ') || mUpper.includes('SPEED')) targetCategory = 'PTZ';
      else if (mUpper.includes('NVR') || mUpper.includes('DVR') || mUpper.includes('XVR') || mUpper.startsWith('CO-N-')) targetCategory = 'NVR / DVR';
      else if (mUpper.includes('CAM') || mUpper.startsWith('CO-I-') || mUpper.startsWith('SHD-') || mUpper.startsWith('ST-VD')) targetCategory = 'Camera';
      else targetCategory = 'Camera';
    }

    const query = { isActive: { $ne: false } };

    if (targetCategory) {
      query.category = { $regex: new RegExp(`^${targetCategory}$`, 'i') };
    }

    const parts = await SparePart.find(query).sort({ name: 1 }).lean();

    // Attach available serial numbers for serialized spare parts
    const mapped = await Promise.all(
      parts.map(async (p) => {
        const total = p.totalStock || 0;
        const used = p.usedStock || 0;
        const available = Math.max(0, total - used);
        const tracking = p.trackingType || 'SERIALIZED';

        let availableSerials = [];
        if (tracking === 'SERIALIZED') {
          const serialItems = await SparePartInventory.find({
            sparePartId: p._id,
            status: 'AVAILABLE',
          })
            .select('serialNumber location unitCost')
            .sort({ serialNumber: 1 })
            .lean();

          availableSerials = serialItems.map((s) => s.serialNumber);
        }

        return {
          _id: p._id,
          code: p.code,
          name: p.name,
          category: p.category,
          unit: p.unit || 'PCS',
          trackingType: tracking,
          purchaseCost: p.purchaseCost || 0,
          sellingPrice: p.sellingPrice || p.purchaseCost || 0,
          availableStock: tracking === 'SERIALIZED' ? availableSerials.length : available,
          totalStock: total,
          usedStock: used,
          isAvailable: (tracking === 'SERIALIZED' ? availableSerials.length : available) > 0,
          availableSerials,
          compatibleModels: p.compatibleProductModels || [],
        };
      })
    );

    res.json({
      success: true,
      targetCategory,
      targetModel,
      count: mapped.length,
      data: mapped,
    });
  } catch (err) {
    console.error('Get Compatible Spare Parts Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Get Single Spare Part by ID (with 360° Stock, Serials & RMA History)
const getSparePartById = async (req, res) => {
  try {
    const { id } = req.params;
    let part;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      part = await SparePart.findById(id).lean();
    } else {
      part = await SparePart.findOne({ code: id.toUpperCase().trim() }).lean();
    }

    if (!part) {
      return res.status(404).json({ success: false, message: 'Spare part not found' });
    }

    // Fetch individual serial numbers
    const serials = await SparePartInventory.find({
      $or: [{ sparePartId: part._id }, { sparePartCode: part.code }],
    })
      .sort({ serialNumber: 1 })
      .lean();

    // Fetch compatible product details
    const compatibleProducts = await Product.find({
      $or: [
        { model: { $in: part.compatibleProductModels || [] } },
        { modelNo: { $in: part.compatibleProductModels || [] } },
        { _id: { $in: part.compatibleProductIds || [] } },
      ],
    })
      .select('model brand mrp dealerPrice category subCategory stockStatus')
      .lean();

    // Fetch RMA usage history
    const usageHistory = await SparePartUsage.find({
      $or: [{ sparePartId: part._id }, { sparePartCode: part.code }],
    })
      .sort({ date: -1 })
      .limit(50)
      .lean();

    const total = part.totalStock || 0;
    const used = part.usedStock || 0;
    const available = Math.max(0, total - used);
    const minStock = part.minimumStock || 5;

    let status = 'AVAILABLE';
    let statusLabel = 'Available';
    let statusColor = '#16a34a';

    if (available === 0) {
      status = 'OUT_OF_STOCK';
      statusLabel = 'Out of Stock';
      statusColor = '#dc2626';
    } else if (available <= minStock) {
      status = 'LOW_STOCK';
      statusLabel = 'Low Stock';
      statusColor = '#ea580c';
    }

    res.json({
      success: true,
      data: {
        ...part,
        trackingType: part.trackingType || 'SERIALIZED',
        totalStock: total,
        usedStock: used,
        availableStock: available,
        status,
        statusLabel,
        statusColor,
        serials,
        compatibleProducts,
        usageHistory,
      },
    });
  } catch (err) {
    console.error('Get Spare Part Details Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Get Individual Serial Numbers for a Spare Part (with status filter)
const getSparePartSerials = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, search } = req.query;

    const query = {
      $or: [{ sparePartId: id }, { sparePartCode: id.toUpperCase().trim() }],
    };

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { serialNumber: { $regex: s, $options: 'i' } },
        { installedInRmaNo: { $regex: s, $options: 'i' } },
        { installedByTechnician: { $regex: s, $options: 'i' } },
      ];
    }

    const serials = await SparePartInventory.find(query).sort({ serialNumber: 1 }).lean();

    res.json({
      success: true,
      count: serials.length,
      data: serials,
    });
  } catch (err) {
    console.error('Get Spare Part Serials Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 6. Create New Spare Part Master
const createSparePart = async (req, res) => {
  try {
    const {
      name,
      code,
      category,
      unit = 'PCS',
      trackingType = 'SERIALIZED',
      minimumStock = 5,
      reorderLevel = 10,
      purchaseCost = 0,
      sellingPrice = 0,
      description = '',
      compatibleProductModels = [],
      initialStock = 0,
      location = 'Main Warehouse',
      customSerials = [],
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Spare part name is required.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Product category is required.' });
    }

    const catTrimmed = category.trim();

    // Auto-upsert category into SparePartCategory DB collection so it persists
    await SparePartCategory.findOneAndUpdate(
      { name: { $regex: new RegExp(`^${catTrimmed.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } },
      { $setOnInsert: { name: catTrimmed, isActive: true } },
      { upsert: true, new: true }
    );

    // Auto-generate code if not provided (with collision avoidance)
    let finalCode = (code || '').trim().toUpperCase();
    if (!finalCode) {
      const catClean = catTrimmed.replace(/[^a-zA-Z0-9]/g, '');
      const catPrefix = (catClean.slice(0, 3) || 'GEN').toUpperCase();
      const nameClean = name.replace(/[^a-zA-Z0-9]/g, '');
      const namePrefix = (nameClean.slice(0, 3) || 'PRT').toUpperCase();
      let count = await SparePart.countDocuments({ category: { $regex: new RegExp(`^${catTrimmed}$`, 'i') } });
      do {
        count++;
        finalCode = `SP-${catPrefix}-${namePrefix}-${String(count).padStart(3, '0')}`;
      } while (await SparePart.findOne({ code: finalCode }));
    } else {
      const existing = await SparePart.findOne({ code: finalCode });
      if (existing) {
        return res.status(400).json({ success: false, message: `Spare part code ${finalCode} already exists.` });
      }
    }

    const qty = Math.max(0, Number(initialStock) || 0);
    const stockLocations = [
      { location: location || 'Main Warehouse', quantity: qty },
      { location: 'Chennai Service Center', quantity: 0 },
      { location: 'Technician Stock', quantity: 0 },
    ];

    const sparePart = new SparePart({
      name: name.trim(),
      code: finalCode,
      category: catTrimmed,
      unit: unit.trim().toUpperCase(),
      trackingType: trackingType || 'SERIALIZED',
      serialPrefix: finalCode,
      minimumStock: Number(minimumStock) || 0,
      reorderLevel: Number(reorderLevel) || 0,
      purchaseCost: Number(purchaseCost) || 0,
      sellingPrice: Number(sellingPrice) || Number(purchaseCost) || 0,
      description: (description || '').trim(),
      compatibleProductModels: Array.isArray(compatibleProductModels) ? compatibleProductModels : [],
      stockLocations,
      totalStock: qty,
      usedStock: 0,
      availableStock: qty,
      isActive: true,
    });

    await sparePart.save();

    // If SERIALIZED and initialStock > 0, generate individual physical S/N records
    if (trackingType === 'SERIALIZED' && qty > 0) {
      const serialDocs = [];
      for (let i = 1; i <= qty; i++) {
        let sn = customSerials && customSerials[i - 1] ? String(customSerials[i - 1]).trim().toUpperCase() : '';
        if (!sn) {
          let sIndex = i;
          do {
            sn = `${finalCode}-${String(sIndex).padStart(4, '0')}`;
            sIndex++;
          } while (await SparePartInventory.findOne({ serialNumber: sn }));
        }
        serialDocs.push({
          serialNumber: sn,
          sparePartId: sparePart._id,
          sparePartCode: sparePart.code,
          sparePartName: sparePart.name,
          category: sparePart.category,
          status: 'AVAILABLE',
          location: location || 'Main Warehouse',
          unitCost: Number(purchaseCost) || 0,
          notes: 'Initial stock creation',
        });
      }
      if (serialDocs.length > 0) {
        await SparePartInventory.insertMany(serialDocs);
      }

      await SparePartTransaction.create({
        sparePartId: sparePart._id,
        sparePartCode: sparePart.code,
        sparePartName: sparePart.name,
        category: sparePart.category,
        actionType: 'INWARD',
        quantity: qty,
        toStatus: 'AVAILABLE',
        performedBy: req.user?.name || 'Super Admin',
        location: location || 'Main Warehouse',
        notes: `Created ${qty} serialized pieces (${finalCode}-0001 to ${finalCode}-${String(qty).padStart(4, '0')})`,
      });

      await recalculatePartStock(sparePart._id);
    } else {
      await recalculatePartStock(sparePart._id);
    }

    const reloaded = await SparePart.findById(sparePart._id).lean();

    res.status(201).json({
      success: true,
      message: `Spare part ${sparePart.name} (${sparePart.code}) created successfully!`,
      data: reloaded || sparePart,
    });
  } catch (err) {
    console.error('Create Spare Part Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 7. Update Spare Part
const updateSparePart = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      category,
      unit,
      trackingType,
      minimumStock,
      reorderLevel,
      purchaseCost,
      sellingPrice,
      description,
      compatibleProductModels,
      totalStock,
      stock,
      initialStock,
      isActive,
    } = req.body;

    let sparePart;
    if (id && String(id).match(/^[0-9a-fA-F]{24}$/)) {
      sparePart = await SparePart.findById(id);
    } else if (id) {
      sparePart = await SparePart.findOne({ code: String(id).toUpperCase().trim() });
    }

    if (!sparePart) {
      return res.status(404).json({ success: false, message: 'Spare part not found' });
    }

    if (name && name.trim()) sparePart.name = name.trim();
    if (category && category.trim()) sparePart.category = category.trim();
    if (unit && unit.trim()) sparePart.unit = unit.trim().toUpperCase();
    if (trackingType) sparePart.trackingType = trackingType;
    if (minimumStock !== undefined && minimumStock !== '') sparePart.minimumStock = Number(minimumStock) || 0;
    if (reorderLevel !== undefined && reorderLevel !== '') sparePart.reorderLevel = Number(reorderLevel) || 0;
    if (purchaseCost !== undefined && purchaseCost !== '') sparePart.purchaseCost = Number(purchaseCost) || 0;
    if (sellingPrice !== undefined && sellingPrice !== '') sparePart.sellingPrice = Number(sellingPrice) || Number(purchaseCost) || 0;
    if (description !== undefined) sparePart.description = description.trim();
    if (Array.isArray(compatibleProductModels)) sparePart.compatibleProductModels = compatibleProductModels;
    if (isActive !== undefined) sparePart.isActive = Boolean(isActive);

    // If code is updated
    if (code && code.trim().toUpperCase() !== sparePart.code) {
      const newCode = code.trim().toUpperCase();
      const existing = await SparePart.findOne({ code: newCode, _id: { $ne: sparePart._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: `Spare part code ${newCode} already exists.` });
      }
      sparePart.code = newCode;
      sparePart.serialPrefix = newCode;
      await SparePartInventory.updateMany({ sparePartId: sparePart._id }, { $set: { sparePartCode: newCode } });
    }

    // Sync any name/category change with existing inventory records
    if (name || category) {
      await SparePartInventory.updateMany(
        { sparePartId: sparePart._id },
        { $set: { sparePartName: sparePart.name, category: sparePart.category } }
      );
    }

    // Handle Total Stock adjustment if provided
    const newStockRaw = totalStock !== undefined ? totalStock : (stock !== undefined ? stock : initialStock);
    if (newStockRaw !== undefined && newStockRaw !== '') {
      const targetTotalStock = Math.max(0, Number(newStockRaw) || 0);

      if (sparePart.trackingType === 'SERIALIZED') {
        const existingSerials = await SparePartInventory.find({ sparePartId: sparePart._id }).sort({ serialNumber: 1 });
        const currentTotal = existingSerials.filter((s) => s.status !== 'SCRAPPED').length;

        if (targetTotalStock > currentTotal) {
          // Add new sequential serial numbers
          let maxSeq = 0;
          existingSerials.forEach((s) => {
            const match = s.serialNumber.match(/-(\d+)$/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxSeq) maxSeq = num;
            }
          });

          const newDocs = [];
          for (let i = 1; i <= (targetTotalStock - currentTotal); i++) {
            const seq = maxSeq + i;
            const sn = `${sparePart.code}-${String(seq).padStart(4, '0')}`;
            newDocs.push({
              serialNumber: sn,
              sparePartId: sparePart._id,
              sparePartCode: sparePart.code,
              sparePartName: sparePart.name,
              category: sparePart.category,
              status: 'AVAILABLE',
              location: 'Main Warehouse',
              unitCost: sparePart.purchaseCost || 0,
              notes: 'Stock updated from Edit Spare Part modal',
            });
          }
          if (newDocs.length > 0) {
            await SparePartInventory.insertMany(newDocs);
          }
        } else if (targetTotalStock < currentTotal) {
          // Remove available serial numbers
          const availSerials = existingSerials.filter((s) => s.status === 'AVAILABLE');
          const toRemoveCount = Math.min(availSerials.length, currentTotal - targetTotalStock);
          const toRemoveIds = availSerials.slice(-toRemoveCount).map((s) => s._id);
          if (toRemoveIds.length > 0) {
            await SparePartInventory.deleteMany({ _id: { $in: toRemoveIds } });
          }
        }
      } else {
        // QUANTITY tracking
        sparePart.totalStock = targetTotalStock;
        sparePart.availableStock = Math.max(0, targetTotalStock - (sparePart.usedStock || 0));
        if (Array.isArray(sparePart.stockLocations) && sparePart.stockLocations.length > 0) {
          sparePart.stockLocations[0].quantity = targetTotalStock;
        } else {
          sparePart.stockLocations = [{ location: 'Main Warehouse', quantity: targetTotalStock }];
        }
      }
    }

    await sparePart.save();
    await recalculatePartStock(sparePart._id);

    const updated = await SparePart.findById(sparePart._id);

    res.json({
      success: true,
      message: `Spare part ${updated.name} updated successfully!`,
      data: updated,
    });
  } catch (err) {
    console.error('Update Spare Part Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 8. Add Stock Inward (Generates individual S/Ns for Serialized items)
const addStockInward = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, location = 'Main Warehouse', notes, performedBy, customSerials = [] } = req.body;

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid inward quantity is required.' });
    }

    const sparePart = await SparePart.findById(id);
    if (!sparePart) {
      return res.status(404).json({ success: false, message: 'Spare part not found' });
    }

    const locName = location || 'Main Warehouse';
    const tracking = sparePart.trackingType || 'SERIALIZED';

    if (tracking === 'SERIALIZED') {
      // Find highest existing S/N sequence number for this spare part
      const countExisting = await SparePartInventory.countDocuments({ sparePartId: sparePart._id });
      const serialDocs = [];

      for (let i = 1; i <= qty; i++) {
        const seq = countExisting + i;
        const sn = customSerials[i - 1] || `${sparePart.code}-${String(seq).padStart(4, '0')}`;
        serialDocs.push({
          serialNumber: sn,
          sparePartId: sparePart._id,
          sparePartCode: sparePart.code,
          sparePartName: sparePart.name,
          category: sparePart.category,
          status: 'AVAILABLE',
          location: locName,
          unitCost: sparePart.purchaseCost || 0,
          notes: notes || `Stock inward batch to ${locName}`,
        });
      }

      await SparePartInventory.insertMany(serialDocs);

      await SparePartTransaction.create({
        sparePartId: sparePart._id,
        sparePartCode: sparePart.code,
        sparePartName: sparePart.name,
        category: sparePart.category,
        actionType: 'INWARD',
        quantity: qty,
        toStatus: 'AVAILABLE',
        performedBy: performedBy || req.user?.name || 'Super Admin',
        location: locName,
        notes: notes || `Inward +${qty} serialized items to ${locName}`,
      });

      await recalculatePartStock(sparePart._id);
    } else {
      // Quantity tracking
      const locIndex = (sparePart.stockLocations || []).findIndex((l) => l.location === locName);
      if (locIndex >= 0) {
        sparePart.stockLocations[locIndex].quantity += qty;
      } else {
        sparePart.stockLocations.push({ location: locName, quantity: qty });
      }
      sparePart.totalStock = sparePart.stockLocations.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
      sparePart.availableStock = Math.max(0, sparePart.totalStock - (sparePart.usedStock || 0));
      await sparePart.save();

      await SparePartTransaction.create({
        sparePartId: sparePart._id,
        sparePartCode: sparePart.code,
        sparePartName: sparePart.name,
        category: sparePart.category,
        actionType: 'INWARD',
        quantity: qty,
        performedBy: performedBy || req.user?.name || 'Super Admin',
        location: locName,
        notes: notes || `Inward +${qty} ${sparePart.unit} to ${locName}`,
      });
    }

    const updated = await SparePart.findById(sparePart._id);

    res.json({
      success: true,
      message: `Successfully inwarded +${qty} ${sparePart.unit} for ${sparePart.name} in ${locName}!`,
      data: updated,
    });
  } catch (err) {
    console.error('Spare Part Inward Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 9. Issue Specific Serial Number to RMA
const issueSparePartSerial = async (req, res) => {
  try {
    const {
      serialNumber,
      rmaId,
      rmaNo,
      ticketNo,
      productModel,
      servicePerson,
      notes,
    } = req.body;

    if (!serialNumber) {
      return res.status(400).json({ success: false, message: 'Serial Number (S/N) is required.' });
    }

    const item = await SparePartInventory.findOne({
      serialNumber: serialNumber.toUpperCase().trim(),
    });

    if (!item) {
      return res.status(404).json({ success: false, message: `Serial Number ${serialNumber} not found in inventory.` });
    }

    if (item.status !== 'AVAILABLE') {
      return res.status(400).json({
        success: false,
        message: `Serial Number ${serialNumber} is currently ${item.status} (cannot be issued).`,
      });
    }

    const tech = servicePerson || req.user?.name || 'Service Person';

    // Mark as INSTALLED
    item.status = 'INSTALLED';
    item.installedInRmaId = rmaId || null;
    item.installedInRmaNo = rmaNo || '';
    item.installedInTicketNo = ticketNo || '';
    item.installedInProductModel = productModel || '';
    item.installedByTechnician = tech;
    item.installedDate = new Date();
    item.notes = notes || `Installed on RMA #${rmaNo || 'Direct'}`;
    await item.save();

    // Log transaction
    await SparePartTransaction.create({
      serialNumber: item.serialNumber,
      sparePartId: item.sparePartId,
      sparePartCode: item.sparePartCode,
      sparePartName: item.sparePartName,
      category: item.category,
      actionType: 'INSTALLED',
      quantity: 1,
      fromStatus: 'AVAILABLE',
      toStatus: 'INSTALLED',
      rmaId: rmaId || null,
      rmaNo: rmaNo || '',
      ticketNo: ticketNo || '',
      productModel: productModel || '',
      performedBy: tech,
      location: item.location || 'Service Center',
      notes: notes || `Installed in RMA #${rmaNo}`,
    });

    // Also record in SparePartUsage for unified timeline
    await SparePartUsage.create({
      sparePartId: item.sparePartId,
      sparePartCode: item.sparePartCode,
      sparePartName: item.sparePartName,
      category: item.category,
      rmaId: rmaId || null,
      rmaNo: rmaNo || '',
      ticketNo: ticketNo || '',
      productModel: productModel || '',
      servicePerson: tech,
      actionType: 'CONSUMED',
      quantity: 1,
      unitCost: item.unitCost || 0,
      location: item.location || 'Service Center',
      notes: `S/N: ${item.serialNumber} installed`,
    });

    // Recalculate stock
    await recalculatePartStock(item.sparePartId);

    res.json({
      success: true,
      message: `Issued S/N ${item.serialNumber} to RMA #${rmaNo || 'Work Order'}!`,
      data: item,
    });
  } catch (err) {
    console.error('Issue Serial Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 10. Consume Spare Part in RMA (Supports both Serialized S/N and Quantity)
const consumeSparePartInRMA = async (req, res) => {
  try {
    const {
      sparePartId,
      sparePartCode,
      serialNumber,
      rmaId,
      rmaNo,
      ticketNo,
      productModel,
      quantity = 1,
      servicePerson,
      servicePersonId,
      location = 'Service Center',
      notes,
    } = req.body;

    const tech = servicePerson || req.user?.name || 'Service Person';

    // If specific S/N provided, issue via S/N
    if (serialNumber) {
      const serialItem = await SparePartInventory.findOne({
        serialNumber: serialNumber.toUpperCase().trim(),
        status: 'AVAILABLE',
      });

      if (serialItem) {
        serialItem.status = 'INSTALLED';
        serialItem.installedInRmaId = rmaId || null;
        serialItem.installedInRmaNo = rmaNo || '';
        serialItem.installedInTicketNo = ticketNo || '';
        serialItem.installedInProductModel = productModel || '';
        serialItem.installedByTechnician = tech;
        serialItem.installedDate = new Date();
        await serialItem.save();

        await SparePartTransaction.create({
          serialNumber: serialItem.serialNumber,
          sparePartId: serialItem.sparePartId,
          sparePartCode: serialItem.sparePartCode,
          sparePartName: serialItem.sparePartName,
          category: serialItem.category,
          actionType: 'INSTALLED',
          quantity: 1,
          fromStatus: 'AVAILABLE',
          toStatus: 'INSTALLED',
          rmaId: rmaId || null,
          rmaNo: rmaNo || '',
          ticketNo: ticketNo || '',
          productModel: productModel || '',
          performedBy: tech,
          location,
          notes: notes || `Installed in RMA #${rmaNo}`,
        });

        await recalculatePartStock(serialItem.sparePartId);

        return res.json({
          success: true,
          message: `Issued S/N ${serialItem.serialNumber} to RMA #${rmaNo}`,
          data: serialItem,
        });
      }
    }

    // Otherwise fallback to sparePartId / Code lookup
    let part;
    if (sparePartId) {
      part = await SparePart.findById(sparePartId);
    } else if (sparePartCode) {
      part = await SparePart.findOne({ code: sparePartCode.toUpperCase().trim() });
    }

    if (!part) {
      return res.status(404).json({ success: false, message: 'Spare part not found.' });
    }

    const qty = Number(quantity) || 1;

    if (part.trackingType === 'SERIALIZED') {
      // Pick first N available S/Ns
      const availableSerials = await SparePartInventory.find({
        sparePartId: part._id,
        status: 'AVAILABLE',
      }).limit(qty);

      if (availableSerials.length < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient serialized stock for ${part.name}. Available: ${availableSerials.length}, Requested: ${qty}`,
        });
      }

      for (const s of availableSerials) {
        s.status = 'INSTALLED';
        s.installedInRmaId = rmaId || null;
        s.installedInRmaNo = rmaNo || '';
        s.installedInTicketNo = ticketNo || '';
        s.installedInProductModel = productModel || '';
        s.installedByTechnician = tech;
        s.installedDate = new Date();
        await s.save();

        await SparePartTransaction.create({
          serialNumber: s.serialNumber,
          sparePartId: s.sparePartId,
          sparePartCode: s.sparePartCode,
          sparePartName: s.sparePartName,
          category: s.category,
          actionType: 'INSTALLED',
          quantity: 1,
          fromStatus: 'AVAILABLE',
          toStatus: 'INSTALLED',
          rmaId: rmaId || null,
          rmaNo: rmaNo || '',
          ticketNo: ticketNo || '',
          productModel: productModel || '',
          performedBy: tech,
          location,
          notes: notes || `Installed in RMA #${rmaNo}`,
        });
      }

      await recalculatePartStock(part._id);
    } else {
      // Quantity deduction
      part.usedStock = (part.usedStock || 0) + qty;
      part.availableStock = Math.max(0, (part.totalStock || 0) - part.usedStock);
      await part.save();
    }

    await SparePartUsage.create({
      sparePartId: part._id,
      sparePartCode: part.code,
      sparePartName: part.name,
      category: part.category,
      rmaId: rmaId || null,
      rmaNo: rmaNo || '',
      ticketNo: ticketNo || '',
      productModel: productModel || '',
      servicePerson: tech,
      servicePersonId: servicePersonId || '',
      actionType: 'CONSUMED',
      quantity: qty,
      unitCost: part.purchaseCost || 0,
      location,
      notes: notes || `Consumed for RMA #${rmaNo}`,
    });

    res.json({
      success: true,
      message: `Consumed ${qty} ${part.name} for RMA #${rmaNo}`,
      data: part,
    });
  } catch (err) {
    console.error('Consume Spare Part Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 11. Delete Spare Part (Super Admin)
const deleteSparePart = async (req, res) => {
  try {
    const { id } = req.params;
    let deleted;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      deleted = await SparePart.findByIdAndDelete(id);
      await SparePartInventory.deleteMany({ sparePartId: id });
    } else {
      deleted = await SparePart.findOneAndDelete({ code: id.toUpperCase().trim() });
      if (deleted) {
        await SparePartInventory.deleteMany({ sparePartId: deleted._id });
      }
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Spare part not found' });
    }

    res.json({
      success: true,
      message: `Spare part ${deleted.name} (${deleted.code}) deleted successfully!`,
      data: deleted,
    });
  } catch (err) {
    console.error('Delete Spare Part Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 12. Auto-Seed Initial Catalog Templates (Clean 0 initial stock)
const seedInitialSpareParts = async () => {
  try {
    const count = await SparePart.countDocuments();
    if (count > 0) return;

    console.log('🌱 Seeding initial Category-Based Spare Parts templates...');

    const allProducts = await Product.find().select('model modelNo category subCategory').lean();
    const cameraModels = allProducts
      .filter((p) => {
        const c = (p.category || p.subCategory || '').toLowerCase();
        return c.includes('camera') || c === 'cctv' || (p.model || '').startsWith('CO-I-') || (p.model || '').startsWith('SHD-');
      })
      .map((p) => p.model || p.modelNo)
      .filter(Boolean);

    const nvrModels = allProducts
      .filter((p) => {
        const c = (p.category || p.subCategory || '').toLowerCase();
        return c.includes('nvr') || c.includes('dvr') || (p.model || '').startsWith('CO-N-');
      })
      .map((p) => p.model || p.modelNo)
      .filter(Boolean);

    const ptzModels = allProducts
      .filter((p) => {
        const c = (p.category || p.subCategory || '').toLowerCase();
        return c.includes('ptz') || (p.model || '').includes('PTZ');
      })
      .map((p) => p.model || p.modelNo)
      .filter(Boolean);

    const fallbackCamera = cameraModels.length > 0 ? cameraModels : ['CO-I-2BFDML(V)', 'CO-I-4DFDML(V)', 'CO-I-5MPDML', 'SHD-VB501LCM', 'ST-VD HD2002WLA-FE'];
    const fallbackNvr = nvrModels.length > 0 ? nvrModels : ['CO-N-041', 'CO-N-081', 'NVR-16CH', 'DVR-08CH'];
    const fallbackPtz = ptzModels.length > 0 ? ptzModels : ['PTZ-4MP-25X', 'PTZ-2MP-IP', 'CO-PTZ-500'];

    const initialCatalog = [
      // 1. Camera (6 Parts)
      { name: 'Power Diode', code: 'SP-CAM-PD-001', category: 'Camera', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 25, sellingPrice: 50, minimumStock: 5, reorderLevel: 10, description: 'Power diode for camera PCB', compatibleProductModels: fallbackCamera },
      { name: 'Power IC', code: 'SP-CAM-PIC-002', category: 'Camera', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 85, sellingPrice: 160, minimumStock: 5, reorderLevel: 10, description: 'DC-DC power management IC', compatibleProductModels: fallbackCamera.slice(0, 4) },
      { name: 'Lens', code: 'SP-CAM-LENS-003', category: 'Camera', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 180, sellingPrice: 320, minimumStock: 5, reorderLevel: 10, description: '3.6mm optical lens', compatibleProductModels: fallbackCamera },
      { name: 'Power Capacitor', code: 'SP-CAM-PC-004', category: 'Camera', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 15, sellingPrice: 35, minimumStock: 5, reorderLevel: 10, description: 'Filter capacitor', compatibleProductModels: fallbackCamera },
      { name: 'LAN IC', code: 'SP-CAM-LAN-005', category: 'Camera', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 120, sellingPrice: 220, minimumStock: 5, reorderLevel: 10, description: 'Ethernet transceiver IC', compatibleProductModels: fallbackCamera.slice(0, 5) },
      { name: 'Cable', code: 'SP-CAM-CBL-006', category: 'Camera', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 45, sellingPrice: 90, minimumStock: 5, reorderLevel: 10, description: 'DC + RJ45 pigtail cable', compatibleProductModels: fallbackCamera },

      // 2. NVR / DVR (7 Parts)
      { name: 'Main Board', code: 'SP-NVR-MB-001', category: 'NVR / DVR', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 1200, sellingPrice: 1950, minimumStock: 3, reorderLevel: 5, description: 'NVR main processing board', compatibleProductModels: fallbackNvr },
      { name: 'SATA Cable', code: 'SP-NVR-SATA-002', category: 'NVR / DVR', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 35, sellingPrice: 75, minimumStock: 5, reorderLevel: 10, description: 'HDD SATA data cable', compatibleProductModels: fallbackNvr },
      { name: 'Power Diode', code: 'SP-NVR-PD-003', category: 'NVR / DVR', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 30, sellingPrice: 65, minimumStock: 5, reorderLevel: 10, description: 'Rectifier diode', compatibleProductModels: fallbackNvr },
      { name: 'LAN Port', code: 'SP-NVR-LAN-004', category: 'NVR / DVR', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 65, sellingPrice: 120, minimumStock: 5, reorderLevel: 10, description: 'RJ45 modular jack', compatibleProductModels: fallbackNvr },
      { name: 'Capacitor (HD)', code: 'SP-NVR-CAP-005', category: 'NVR / DVR', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 20, sellingPrice: 45, minimumStock: 5, reorderLevel: 10, description: 'Heavy duty filter capacitor', compatibleProductModels: fallbackNvr },
      { name: 'Power Adapter', code: 'SP-NVR-PA-006', category: 'NVR / DVR', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 220, sellingPrice: 450, minimumStock: 5, reorderLevel: 10, description: '12V 2A SMPS adapter', compatibleProductModels: fallbackNvr },
      { name: 'USB Port', code: 'SP-NVR-USB-007', category: 'NVR / DVR', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 40, sellingPrice: 85, minimumStock: 5, reorderLevel: 10, description: 'Dual USB connector', compatibleProductModels: fallbackNvr },

      // 3. PTZ (7 Parts)
      { name: 'Power Board Diode', code: 'SP-PTZ-PBD-001', category: 'PTZ', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 40, sellingPrice: 85, minimumStock: 5, reorderLevel: 10, description: 'Schottky diode for PTZ', compatibleProductModels: fallbackPtz },
      { name: 'Power Board Capacitor', code: 'SP-PTZ-PBC-002', category: 'PTZ', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 35, sellingPrice: 75, minimumStock: 5, reorderLevel: 10, description: '35V filter capacitor', compatibleProductModels: fallbackPtz },
      { name: 'DATA PCB', code: 'SP-PTZ-DPCB-003', category: 'PTZ', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 650, sellingPrice: 1100, minimumStock: 3, reorderLevel: 5, description: 'RS485 data signal PCB', compatibleProductModels: fallbackPtz },
      { name: 'Motor PCB', code: 'SP-PTZ-MPCB-004', category: 'PTZ', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 480, sellingPrice: 850, minimumStock: 3, reorderLevel: 5, description: 'Stepper motor control PCB', compatibleProductModels: fallbackPtz },
      { name: 'Motor Belt', code: 'SP-PTZ-MBELT-005', category: 'PTZ', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 90, sellingPrice: 180, minimumStock: 5, reorderLevel: 10, description: 'Rubber timing gear belt', compatibleProductModels: fallbackPtz },
      { name: 'PTZ Cable', code: 'SP-PTZ-CBL-006', category: 'PTZ', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 150, sellingPrice: 280, minimumStock: 5, reorderLevel: 10, description: 'Slip-ring harness cable', compatibleProductModels: fallbackPtz },
      { name: 'Power Cable', code: 'SP-PTZ-PWR-007', category: 'PTZ', unit: 'PCS', trackingType: 'SERIALIZED', purchaseCost: 65, sellingPrice: 130, minimumStock: 5, reorderLevel: 10, description: 'AC24V waterproof power cable', compatibleProductModels: fallbackPtz },
    ];

    for (const item of initialCatalog) {
      const sp = new SparePart({
        ...item,
        totalStock: 0,
        usedStock: 0,
        availableStock: 0,
        stockLocations: [{ location: 'Main Warehouse', quantity: 0 }],
        isActive: true,
      });
      await sp.save();
    }

    console.log(`✅ Seeded ${initialCatalog.length} Category-Based Spare Parts templates with clean 0 initial stock.`);
  } catch (err) {
    console.error('Seed Spare Parts Error:', err.message);
  }
};

module.exports = {
  getAllSpareParts,
  getSparePartCategories,
  createSparePartCategory,
  deleteSparePartCategory,
  getCompatibleSparePartsForProduct,
  getSparePartById,
  getSparePartSerials,
  createSparePart,
  updateSparePart,
  deleteSparePart,
  addStockInward,
  issueSparePartSerial,
  consumeSparePartInRMA,
  seedInitialSpareParts,
};
