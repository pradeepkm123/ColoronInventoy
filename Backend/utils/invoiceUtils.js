const Dispatch = require('../models/Dispatch');

exports.generateInvoiceNumber = async () => {
  const last = await Dispatch.findOne().sort({ createdAt: -1 });
  let next = 1;

  if (last && last.invoiceNumber) {
    const match = last.invoiceNumber.match(/INV(\d+)/);
    if (match) {
      next = parseInt(match[1], 10) + 1;
    }
  }

  return `INV${String(next).padStart(3, '0')}`;
};
