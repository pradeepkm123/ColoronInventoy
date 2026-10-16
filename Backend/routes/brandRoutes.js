// /routes/brandRoutes.js
const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');

// Get all brands
router.get('/', brandController.getAllBrands);

// Create a new brand
router.post('/', brandController.createBrand);

// Update a brand
router.put('/:id', brandController.updateBrand);

// Delete a brand
router.delete('/:id', brandController.deleteBrand);

module.exports = router;
