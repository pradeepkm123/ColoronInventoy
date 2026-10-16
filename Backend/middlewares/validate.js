const { body, validationResult } = require('express-validator');

exports.validateDispatch = [
  body('invoiceId').notEmpty().withMessage('Invoice ID is required'),
  body('modelNo').notEmpty().withMessage('Model number is required'),
  body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive integer'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
  body('salePerson').notEmpty().withMessage('Sales person is required'),
  body('barcodes').isArray().withMessage('Barcodes must be an array'),
  body('customerName').notEmpty().withMessage('Customer name is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

exports.validateInventory = [
  body('modelNo').notEmpty().withMessage('Model number is required'),
  body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive integer'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
