const express = require('express');
const router = express.Router();
const {
  getAllItems,
  addItem,
  updateItem,
  deleteItem,
} = require('../controllers/packagingController');

// Get all items
router.get('/', getAllItems);

// Add a new item
router.post('/', addItem);

// Update an item
router.put('/:id', updateItem);

// Delete an item
router.delete('/:id', deleteItem);

module.exports = router;
