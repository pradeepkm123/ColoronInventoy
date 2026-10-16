const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

router.get('/products', statsController.getTotalProductsValue);
router.get('/inventory/total-value', statsController.getTotalInventoryValue);
router.get('/inventory/today-inward', statsController.getTodaysInwardCount);
router.get('/dispatch/today-outward', statsController.getTodaysOutwardCount);

module.exports = router;
