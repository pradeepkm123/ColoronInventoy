const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');

router.get('/', purchaseOrderController.getPurchaseOrders);
router.post('/', purchaseOrderController.createPurchaseOrder);
router.post('/next-ideal-no', purchaseOrderController.getNextIdealNo);
router.get('/companies', purchaseOrderController.getCompanyList);
router.put('/:id', purchaseOrderController.updatePurchaseOrder);
router.delete('/:id', purchaseOrderController.deletePurchaseOrder);

module.exports = router;
