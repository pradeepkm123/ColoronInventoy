const Warehouse = require('../models/Warehouse');

// Create a new warehouse
exports.createWarehouse = async (req, res) => {
  try {
    const warehouse = new Warehouse(req.body);
    await warehouse.save();
    res.status(201).send(warehouse);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Get all warehouses
exports.getAllWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({});
    res.send(warehouses);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Update a warehouse
exports.updateWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!warehouse) {
      return res.status(404).send();
    }
    res.send(warehouse);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Delete a warehouse
exports.deleteWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);
    if (!warehouse) {
      return res.status(404).send();
    }
    res.send(warehouse);
  } catch (error) {
    res.status(500).send(error);
  }
};
