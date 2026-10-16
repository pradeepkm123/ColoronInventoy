const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');

// 📌 Get all customers
router.get('/', getCustomers);

// 📌 Get single customer by ID
router.get('/:id', getCustomerById);

// 📌 Create new customer (profilePicture handled in controller)
router.post('/', createCustomer);

// 📌 Update existing customer
router.put('/:id', updateCustomer);

// 📌 Delete customer
router.delete('/:id', deleteCustomer);

module.exports = router;
