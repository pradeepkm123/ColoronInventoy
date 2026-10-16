const StoreCustomer = require('../models/StoreCustomer');

// GET all customers (optionally filtered by storeName)
exports.getAllCustomers = async (req, res) => {
  try {
    const { storeName } = req.query;
    const query = storeName ? { storeName: new RegExp(storeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } : {};
    const customers = await StoreCustomer.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    console.error("Error fetching customers:", error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching customers'
    });
  }
};

// POST a new customer
exports.addCustomer = async (req, res) => {
  try {
    if (!req.body.storeName || !req.body.customerName || !req.body.phoneNo) {
      return res.status(400).json({
        success: false,
        error: "Store name, customer name, and phone number are required"
      });
    }

    const existingCustomer = await StoreCustomer.findOne({
      storeName: req.body.storeName,
      customerName: req.body.customerName
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        error: "Customer with this name already exists in the store"
      });
    }

    const customer = new StoreCustomer(req.body);
    await customer.save();

    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error("Error saving customer:", error.message);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Customer already exists in this store"
      });
    }
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// PUT (update) a customer
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await StoreCustomer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found"
      });
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error("Error updating customer:", error.message);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// DELETE a customer
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await StoreCustomer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found"
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    console.error("Error deleting customer:", error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting customer'
    });
  }
};
