// const express = require('express');
// const router = express.Router();
// const {
//   getAllRawMaterials,
//   addRawMaterial,
//   updateRawMaterial,
//   deleteRawMaterial,
// } = require('../controllers/rawMaterialController');

// // Get all raw materials
// router.get('/', getAllRawMaterials);

// // Add a new raw material
// router.post('/', addRawMaterial);

// // Update a raw material
// router.put('/:id', updateRawMaterial);

// // Delete a raw material
// router.delete('/:id', deleteRawMaterial);

// module.exports = router;


const express = require('express');
const router = express.Router();
const {
  getAllRawMaterials,
  addRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
} = require('../controllers/rawMaterialController');

// Get all raw materials
router.get('/', getAllRawMaterials);
// Add a new raw material
router.post('/', addRawMaterial);
// Update a raw material
router.put('/:id', updateRawMaterial);
// Delete a raw material
router.delete('/:id', deleteRawMaterial);

module.exports = router;
