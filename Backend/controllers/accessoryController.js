// /controllers/accessoryController.js
const Accessory = require('../models/Accessory');

// Get all accessories
exports.getAllAccessories = async (req, res) => {
  try {
    const accessories = await Accessory.find().sort({ createdOn: -1 });
    res.json(accessories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new accessory
exports.createAccessory = async (req, res) => {
  const accessory = new Accessory({
    name: req.body.name,
    sku: req.body.sku,
    category: req.body.category,
    brand: req.body.brand,
    price: req.body.price,
    stock: req.body.stock,
    description: req.body.description,
    createdOn: req.body.createdOn || new Date(),
    status: req.body.status !== undefined ? req.body.status : true,
  });

  try {
    const newAccessory = await accessory.save();
    res.status(201).json(newAccessory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update an accessory
exports.updateAccessory = async (req, res) => {
  try {
    const updated = await Accessory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete an accessory
exports.deleteAccessory = async (req, res) => {
  try {
    await Accessory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Accessory deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
