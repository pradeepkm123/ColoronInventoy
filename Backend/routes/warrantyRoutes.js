const express = require('express');
const router = express.Router();
const { checkWarranty } = require('../controllers/warrantyController');

// Check warranty status using barcode or serial number
router.post('/check', checkWarranty);
router.get('/check/:serialNumber', checkWarranty);
router.get('/check', checkWarranty);

module.exports = router;
