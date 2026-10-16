// const Invoice = require('../models/Invoice');
// const { generateInvoiceNumber } = require('../utils/invoiceUtils');

// exports.createInvoice = async (req, res) => {
//   try {
//     const { invoiceDate, customer, gstNo, address, email, phoneNo } = req.body;
//     const invoiceNumber = await generateInvoiceNumber();

//     const newInvoice = new Invoice({
//       invoiceNumber,
//       invoiceDate,
//       customer,
//       gstNo,
//       address,
//       email,
//       phoneNo,
//     });

//     await newInvoice.save();
//     res.status(201).json(newInvoice);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// exports.getInvoices = async (req, res) => {
//   try {
//     const invoices = await Invoice.find().sort({ createdAt: -1 }).populate('customer');
//     res.status(200).json(invoices);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.getInvoiceById = async (req, res) => {
//   try {
//     const invoice = await Invoice.findById(req.params.id).populate('customer');
//     if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
//     res.status(200).json(invoice);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.updateInvoice = async (req, res) => {
//   try {
//     const updatedInvoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!updatedInvoice) return res.status(404).json({ message: 'Invoice not found' });
//     res.status(200).json(updatedInvoice);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// exports.deleteInvoice = async (req, res) => {
//   try {
//     const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
//     if (!deletedInvoice) return res.status(404).json({ message: 'Invoice not found' });
//     res.status(200).json({ message: 'Invoice deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

const Invoice = require('../models/Invoice');
const { generateInvoiceNumber } = require('../utils/invoiceUtils');

exports.createInvoice = async (req, res) => {
  try {
    const { invoiceDate, customer, gstNo, address, email, phoneNo } = req.body;
    const invoiceNumber = await generateInvoiceNumber();

    const newInvoice = new Invoice({
      invoiceNumber,
      invoiceDate,
      customer,
      gstNo,
      address,
      email,
      phoneNo,
    });

    await newInvoice.save();
    res.status(201).json(newInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 }).populate('customer');
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('customer');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedInvoice) return res.status(404).json({ message: 'Invoice not found' });
    res.status(200).json(updatedInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!deletedInvoice) return res.status(404).json({ message: 'Invoice not found' });
    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
