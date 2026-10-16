// const SalesPerson = require('../models/SalesPerson');

// // Create a new sales person
// exports.createSalesPerson = async (req, res) => {
//   try {
//     const { employeeName, employeeId, location, mobileNo } = req.body;
//     const salesPerson = new SalesPerson({ employeeName, employeeId, location, mobileNo });
//     await salesPerson.save();
//     res.status(201).json(salesPerson);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Get all sales persons
// exports.getAllSalesPersons = async (req, res) => {
//   try {
//     const salesPersons = await SalesPerson.find();
//     res.json(salesPersons);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Update a sales person
// exports.updateSalesPerson = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { employeeName, employeeId, location, mobileNo } = req.body;
//     const salesPerson = await SalesPerson.findByIdAndUpdate(
//       id,
//       { employeeName, employeeId, location, mobileNo },
//       { new: true }
//     );
//     res.json(salesPerson);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Delete a sales person
// exports.deleteSalesPerson = async (req, res) => {
//   try {
//     const { id } = req.params;
//     await SalesPerson.findByIdAndDelete(id);
//     res.json({ message: 'Sales person deleted successfully' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };




const SalesPerson = require('../models/SalesPerson');

// Create a new sales person
exports.createSalesPerson = async (req, res) => {
  try {
    const { employeeName, employeeId, location, mobileNo } = req.body;
    const salesPerson = new SalesPerson({ employeeName, employeeId, location, mobileNo });
    await salesPerson.save();
    res.status(201).json(salesPerson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all sales persons
exports.getAllSalesPersons = async (req, res) => {
  try {
    const salesPersons = await SalesPerson.find();
    res.json(salesPersons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a sales person
exports.updateSalesPerson = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeName, employeeId, location, mobileNo } = req.body;
    const salesPerson = await SalesPerson.findByIdAndUpdate(
      id,
      { employeeName, employeeId, location, mobileNo },
      { new: true }
    );
    res.json(salesPerson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a sales person
exports.deleteSalesPerson = async (req, res) => {
  try {
    const { id } = req.params;
    await SalesPerson.findByIdAndDelete(id);
    res.json({ message: 'Sales person deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
