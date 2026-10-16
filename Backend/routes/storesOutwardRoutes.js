const express = require('express');
const router = express.Router();
const storesOutwardController = require('../controllers/storesOutwardController');

// POST /api/stores-outward
router.post('/', storesOutwardController.createStoresOutward);

module.exports = router;
