const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Create a new category
router.post('/', categoryController.upload.single('image'), categoryController.createCategory);

// Get all categories
router.get('/', categoryController.getAllCategories);

// Get a single category
router.get('/:id', categoryController.getCategory);

// Update a category
router.put('/:id', categoryController.upload.single('image'), categoryController.updateCategory);

// Delete a category
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
