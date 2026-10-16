const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Dispatch = require('../models/Dispatch');

// ✅ Get low stock product count (reorderLevel <= 5)
exports.getTotalProductsValue = async (req, res) => {
  try {
    const totalValue = await Product.countDocuments({ reorderLevel: { $lte: 5 } });
    res.json({ totalValue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get total inventory value
exports.getTotalInventoryValue = async (req, res) => {
  try {
    const inventories = await Inventory.find();
    const totalValue = inventories.reduce((sum, inventory) => sum + (Number(inventory.mrp || 0) * Number(inventory.quantity || 0)), 0);
    res.json({ totalValue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get today's inward count
exports.getTodaysInwardCount = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const inwardCount = await Inventory.countDocuments({
      createdAt: { $gte: startOfDay }
    });

    res.json({ count: inwardCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get today's outward count
exports.getTodaysOutwardCount = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const outwardCount = await Dispatch.countDocuments({
      createdAt: { $gte: startOfDay }
    });

    res.json({ count: outwardCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
