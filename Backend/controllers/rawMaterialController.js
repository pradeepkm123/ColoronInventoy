const RawMaterial = require('../models/RawMaterial');

// Get all raw materials for the logged-in user
exports.getAllRawMaterials = async (req, res) => {
  try {
    const { userId, storeName, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (userId) query.userId = userId;
    if (storeName) query.storeName = storeName;

    const materials = await RawMaterial.find(query)
      .skip(skip)
      .limit(Number(limit));

    const total = await RawMaterial.countDocuments(query);

    res.status(200).json({
      success: true,
      data: materials,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Add a new raw material
exports.addRawMaterial = async (req, res) => {
  try {
    const { name, units, image, userId, storeName } = req.body;

    if (!userId || !storeName) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Store Name are required',
      });
    }

    if (units < 0) {
      return res.status(400).json({
        success: false,
        error: 'Units cannot be negative',
      });
    }

    const newMaterial = new RawMaterial({
      name,
      units,
      image,
      userId,
      storeName,
    });

    await newMaterial.save();
    res.status(201).json({ success: true, data: newMaterial });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update a raw material (only if user owns it)
exports.updateRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, units, image, userId } = req.body;

    const existingMaterial = await RawMaterial.findById(id);
    if (!existingMaterial) {
      return res.status(404).json({
        success: false,
        error: 'Material not found',
      });
    }

    if (existingMaterial.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const updatedMaterial = await RawMaterial.findByIdAndUpdate(
      id,
      { name, units, image },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedMaterial });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete a raw material (only if user owns it)
exports.deleteRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const existingMaterial = await RawMaterial.findById(id);
    if (!existingMaterial) {
      return res.status(404).json({
        success: false,
        error: 'Material not found',
      });
    }

    if (existingMaterial.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    await RawMaterial.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Material deleted successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
