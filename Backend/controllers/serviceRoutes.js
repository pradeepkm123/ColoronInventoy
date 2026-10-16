const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// Create a new service
router.post('/', serviceController.createService);

// Get all services
router.get('/', serviceController.getAllServices);

// Get a single service by ID
router.get('/:id', serviceController.getServiceById);

// Update a service
router.put('/:id', serviceController.updateService);

// Delete a service
router.delete('/:id', serviceController.deleteService);

module.exports = router;
