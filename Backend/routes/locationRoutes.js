const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

// Create a new location
router.post('/', locationController.createLocation);

// Get all locations
router.get('/', locationController.getAllLocations);

// Update a location
router.put('/:id', locationController.updateLocation);

// Delete a location
router.delete('/:id', locationController.deleteLocation);

module.exports = router;
