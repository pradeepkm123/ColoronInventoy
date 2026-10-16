// const PackagingItem = require('../models/PackagingItem');

// // Get all items
// exports.getAllItems = async (req, res) => {
//   try {
//     const items = await PackagingItem.find();
//     res.status(200).json(items);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Add a new item
// exports.addItem = async (req, res) => {
//   try {
//     const { name, units, image } = req.body;
//     const newItem = new PackagingItem({ name, units, image });
//     await newItem.save();
//     res.status(201).json(newItem);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Update an item
// exports.updateItem = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, units, image } = req.body;
//     const updatedItem = await PackagingItem.findByIdAndUpdate(
//       id,
//       { name, units, image },
//       { new: true }
//     );
//     res.status(200).json(updatedItem);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Delete an item
// exports.deleteItem = async (req, res) => {
//   try {
//     const { id } = req.params;
//     await PackagingItem.findByIdAndDelete(id);
//     res.status(200).json({ message: 'Item deleted successfully' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };




const PackagingItem = require('../models/PackagingItem');

// Get all items
exports.getAllItems = async (req, res) => {
  try {
    const items = await PackagingItem.find();
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new item
exports.addItem = async (req, res) => {
  try {
    const { name, units, image } = req.body;
    const newItem = new PackagingItem({ name, units, image });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update an item
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, units, image } = req.body;
    const updatedItem = await PackagingItem.findByIdAndUpdate(
      id,
      { name, units, image },
      { new: true }
    );
    res.status(200).json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete an item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    await PackagingItem.findByIdAndDelete(id);
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
