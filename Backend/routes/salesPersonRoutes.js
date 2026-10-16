const express = require('express');
const router = express.Router();
const salesPersonController = require('../controllers/salesPersonController');

router.post('/', salesPersonController.createSalesPerson);
router.get('/', salesPersonController.getAllSalesPersons);
router.put('/:id', salesPersonController.updateSalesPerson);
router.delete('/:id', salesPersonController.deleteSalesPerson);

module.exports = router;
