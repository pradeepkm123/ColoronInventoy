const express = require('express');
const router = express.Router();
const storeCustomerController = require('../controllers/storeCustomerController');

router.get('/', storeCustomerController.getAllCustomers);
router.post('/', storeCustomerController.addCustomer);
router.put('/:id', storeCustomerController.updateCustomer);
router.delete('/:id', storeCustomerController.deleteCustomer);




module.exports = router;
