// // /controllers/brandController.js
// const Brand = require('../models/Brand');

// // Get all brands
// exports.getAllBrands = async (req, res) => {
//   try {
//     const brands = await Brand.find();
//     res.json(brands);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // Create a new brand
// exports.createBrand = async (req, res) => {
//   const brand = new Brand({
//     brand: req.body.brand,
//     createdOn: req.body.createdOn,
//     status: req.body.status,
//   });

//   try {
//     const newBrand = await brand.save();
//     res.status(201).json(newBrand);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// // Update a brand
// exports.updateBrand = async (req, res) => {
//   try {
//     const updatedBrand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     res.json(updatedBrand);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// // Delete a brand
// exports.deleteBrand = async (req, res) => {
//   try {
//     await Brand.findByIdAndDelete(req.params.id);
//     res.json({ message: 'Brand deleted' });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// /controllers/brandController.js
const Brand = require('../models/Brand');

// Get all brands
exports.getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find();
    res.json(brands);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new brand
exports.createBrand = async (req, res) => {
  const brand = new Brand({
    brand: req.body.brand,
    createdOn: req.body.createdOn,
    status: req.body.status,
  });

  try {
    const newBrand = await brand.save();
    res.status(201).json(newBrand);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update a brand
exports.updateBrand = async (req, res) => {
  try {
    const updatedBrand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedBrand);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a brand
exports.deleteBrand = async (req, res) => {
  try {
    await Brand.findByIdAndDelete(req.params.id);
    res.json({ message: 'Brand deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
