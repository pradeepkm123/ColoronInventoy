// const Category = require('../models/Category');
// const multer = require('multer');
// const path = require('path');

// // Set up multer for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage });

// // Create a new category
// exports.createCategory = async (req, res) => {
//   try {
//     const { name, createdOn, status } = req.body;
//     const image = req.file ? req.file.path : '';

//     const newCategory = new Category({
//       name,
//       createdOn,
//       status,
//       image,
//     });

//     await newCategory.save();
//     res.status(201).json(newCategory);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Get all categories
// exports.getAllCategories = async (req, res) => {
//   try {
//     const categories = await Category.find();
//     res.status(200).json(categories);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Get a single category
// exports.getCategory = async (req, res) => {
//   try {
//     const category = await Category.findById(req.params.id);
//     if (!category) {
//       return res.status(404).json({ message: 'Category not found' });
//     }
//     res.status(200).json(category);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Update a category
// exports.updateCategory = async (req, res) => {
//   try {
//     const { name, createdOn, status } = req.body;
//     const image = req.file ? req.file.path : req.body.image;

//     const updatedCategory = await Category.findByIdAndUpdate(
//       req.params.id,
//       { name, createdOn, status, image },
//       { new: true }
//     );

//     if (!updatedCategory) {
//       return res.status(404).json({ message: 'Category not found' });
//     }

//     res.status(200).json(updatedCategory);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Delete a category
// exports.deleteCategory = async (req, res) => {
//   try {
//     const deletedCategory = await Category.findByIdAndDelete(req.params.id);
//     if (!deletedCategory) {
//       return res.status(404).json({ message: 'Category not found' });
//     }
//     res.status(200).json({ message: 'Category deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.upload = upload;




const Category = require('../models/Category');
const multer = require('multer');
const path = require('path');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name, createdOn, status } = req.body;
    const image = req.file ? req.file.path : '';

    const newCategory = new Category({
      name,
      createdOn,
      status,
      image,
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single category
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const { name, createdOn, status } = req.body;
    const image = req.file ? req.file.path : req.body.image;

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name, createdOn, status, image },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.upload = upload;
