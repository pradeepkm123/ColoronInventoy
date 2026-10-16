const SubCategory = require('../models/SubCategory');

exports.getAllSubCategories = async (req, res) => {
  try {
    const subCategories = await SubCategory.find();
    res.json(subCategories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createSubCategory = async (req, res) => {
  const { name, status } = req.body;
  const image = req.file ? req.file.path : '';

  const newSubCategory = new SubCategory({
    name,
    status,
    image,
  });

  try {
    const subCategory = await newSubCategory.save();
    res.status(201).json(subCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateSubCategory = async (req, res) => {
  const { name, status } = req.body;
  const image = req.file ? req.file.path : req.body.image;

  try {
    const subCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      { name, status, image },
      { new: true }
    );
    res.json(subCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteSubCategory = async (req, res) => {
  try {
    await SubCategory.findByIdAndDelete(req.params.id);
    res.json({ message: 'SubCategory deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
