const express = require('express');
const router = express.Router();
const sparePartController = require('../controllers/sparePartController');

// 1. Categories & Analytics
router.get('/categories', sparePartController.getSparePartCategories);
router.post('/categories', sparePartController.createSparePartCategory);
router.delete('/categories/:name', sparePartController.deleteSparePartCategory);

// 2. Compatibility Lookup (For RMA Service & Product Mapping with available S/Ns)
router.get('/compatible-with-product', sparePartController.getCompatibleSparePartsForProduct);

// 3. List All Spare Parts (with category, search, stock filters)
router.get('/', sparePartController.getAllSpareParts);

// 4. Single Spare Part Details (with Stock Breakdown, Serials & RMA History)
router.get('/:id', sparePartController.getSparePartById);

// 5. Get Individual Serial Numbers for a Spare Part
router.get('/:id/serials', sparePartController.getSparePartSerials);

// 6. Create New Spare Part (Super Admin)
router.post('/', sparePartController.createSparePart);

// 7. Update Spare Part
router.put('/:id', sparePartController.updateSparePart);

// 8. Add Inward Stock (Generates S/Ns for Serialized items)
router.post('/:id/stock-inward', sparePartController.addStockInward);

// 9. Issue Specific S/N to RMA
router.post('/issue-serial', sparePartController.issueSparePartSerial);

// 10. Consume Spare Part in RMA (Serialized or Quantity)
router.post('/consume', sparePartController.consumeSparePartInRMA);

// 11. Delete Spare Part (Super Admin)
router.delete('/:id', sparePartController.deleteSparePart);

module.exports = router;
