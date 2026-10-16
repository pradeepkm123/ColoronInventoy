// routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// POST /api/transactions
router.post('/', transactionController.createTransaction);

// GET /api/transactions
// Optional filters: ?storeName=...&type=outward&modelNo=ABC123&from=2025-08-01&to=2025-08-12&limit=50
router.get('/', transactionController.getTransactions);

module.exports = router;
