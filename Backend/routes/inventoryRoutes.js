const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.post('/', inventoryController.createInventory);
router.get('/', inventoryController.getInventories);
router.post('/check-barcodes', inventoryController.checkBarcodes);
router.post('/batch-stickers', inventoryController.saveBatchStickers);
router.post('/next-sequence', inventoryController.getNextSequence);
router.post('/reset-sequence', inventoryController.resetSequence);
router.put('/:id', inventoryController.updateInventory);
router.delete('/:id', inventoryController.deleteInventory);

// Carton Box endpoints
const cartonBoxController = require('../controllers/cartonBoxController');
router.get('/carton-models', cartonBoxController.getModels);
router.get('/carton-serials', cartonBoxController.getAvailableSerials);
router.get('/carton-boxes', cartonBoxController.getCartonBoxes);
router.post('/carton-create', cartonBoxController.createCartonBox);
router.delete('/carton-delete/:id', cartonBoxController.deleteCartonBox);

module.exports = router;
