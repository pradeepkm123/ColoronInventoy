// /routes/accessoryRoutes.js
const express = require('express');
const router = express.Router();
const accessoryController = require('../controllers/accessoryController');

// Get all accessories
router.get('/', accessoryController.getAllAccessories);

// Create a new accessory
router.post('/', accessoryController.createAccessory);

// Update an accessory
router.put('/:id', accessoryController.updateAccessory);

// Delete an accessory
router.delete('/:id', accessoryController.deleteAccessory);

module.exports = router;
