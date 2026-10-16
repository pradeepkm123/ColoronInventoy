const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');

// Create a new warehouse
router.post('/', warehouseController.createWarehouse);

// Get all warehouses
router.get('/', warehouseController.getAllWarehouses);

// Update a warehouse
router.patch('/:id', warehouseController.updateWarehouse);

// Delete a warehouse
router.delete('/:id', warehouseController.deleteWarehouse);

module.exports = router;
