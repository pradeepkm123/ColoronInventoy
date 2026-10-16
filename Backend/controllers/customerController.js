// // controllers/customerController.js
// const Customer = require('../models/CustomerModel');
// const multer = require('multer');
// const path = require('path');

// // ---------- Multer Configuration ----------
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, 'uploads/'),
//   filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
// });
// const upload = multer({ storage });

// // ---------- Helpers ----------
// /** Normalize incoming status to Boolean */
// function normalizeStatus(input) {
//   if (typeof input === 'boolean') return input;
//   if (typeof input === 'string') {
//     const v = input.trim().toLowerCase();
//     if (['active', 'true', '1', 'yes'].includes(v)) return true;
//     if (['inactive', 'false', '0', 'no'].includes(v)) return false;
//   }
//   return false; // default if omitted/unknown
// }

// /** Build DTO with statusText + profilePictureUrl */
// function toDTO(doc, req) {
//   const obj = doc.toObject ? doc.toObject() : doc;
//   return {
//     ...obj,
//     statusText: obj.status ? 'Active' : 'Inactive',
//     profilePictureUrl: obj.profilePicture
//       ? `${req.protocol}://${req.get('host')}/${obj.profilePicture.replace(/\\/g, '/')}`
//       : null,
//   };
// }

// // ---------- Controllers ----------

// // Get all customers
// // controllers/customerController.js
// exports.getCustomers = async (req, res) => {
//   try {
//     const customers = await Customer.find();
//     const result = customers.map(c => ({
//       ...c.toObject(),
//       status: c.status ? 'Active' : 'Inactive', // ✅ Convert boolean to text
//     }));
//     res.status(200).json(result);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch customers', error: error.message });
//   }
// };


// // Get one customer
// exports.getCustomerById = async (req, res) => {
//   try {
//     const customer = await Customer.findById(req.params.id);
//     if (!customer) return res.status(404).json({ message: 'Customer not found' });
//     res.status(200).json(toDTO(customer, req));
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch customer', error: error.message });
//   }
// };

// // Create new customer
// exports.createCustomer = [
//   upload.single('profilePicture'),
//   async (req, res) => {
//     try {
//       const customerData = { ...req.body };

//       // Normalize status if provided (accepts "Active"/"Inactive" or boolean-like)
//       if (customerData.status !== undefined) {
//         customerData.status = normalizeStatus(customerData.status);
//       }

//       // Attach file path if uploaded
//       if (req.file) {
//         customerData.profilePicture = `uploads/${req.file.filename}`;
//       }

//       const newCustomer = new Customer(customerData);
//       await newCustomer.save();

//       res.status(201).json(toDTO(newCustomer, req));
//     } catch (error) {
//       res.status(400).json({ message: 'Failed to create customer', error: error.message });
//     }
//   },
// ];

// // Update customer
// exports.updateCustomer = [
//   upload.single('profilePicture'),
//   async (req, res) => {
//     try {
//       const customerData = { ...req.body };

//       // Normalize status (if sent)
//       if (customerData.status !== undefined) {
//         customerData.status = normalizeStatus(customerData.status);
//       }

//       // New profile picture (if uploaded)
//       if (req.file) {
//         customerData.profilePicture = `uploads/${req.file.filename}`;
//       }

//       const updatedCustomer = await Customer.findByIdAndUpdate(
//         req.params.id,
//         customerData,
//         { new: true }
//       );

//       if (!updatedCustomer) {
//         return res.status(404).json({ message: 'Customer not found' });
//       }

//       res.status(200).json(toDTO(updatedCustomer, req));
//     } catch (error) {
//       res.status(400).json({ message: 'Failed to update customer', error: error.message });
//     }
//   },
// ];

// // Delete customer
// exports.deleteCustomer = async (req, res) => {
//   try {
//     const deleted = await Customer.findByIdAndDelete(req.params.id);
//     if (!deleted) {
//       return res.status(404).json({ message: 'Customer not found' });
//     }
//     res.status(200).json({ message: 'Customer deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to delete customer', error: error.message });
//   }
// };

// controllers/customerController.js
const Customer = require('../models/CustomerModel');
const multer = require('multer');
const path = require('path');

// ---------- Multer Configuration ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ---------- Helpers ----------
/** Normalize incoming status to Boolean */
function normalizeStatus(input) {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'string') {
    const v = input.trim().toLowerCase();
    if (['active', 'true', '1', 'yes'].includes(v)) return true;
    if (['inactive', 'false', '0', 'no'].includes(v)) return false;
  }
  return false; // default if omitted/unknown
}

/** Build DTO with statusText + profilePictureUrl */
function toDTO(doc, req) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    statusText: obj.status ? 'Active' : 'Inactive',
    profilePictureUrl: obj.profilePicture
      ? `${req.protocol}://${req.get('host')}/${obj.profilePicture.replace(/\\/g, '/')}`
      : null,
  };
}

// Parse address object if JSON string
function parseAddress(addr) {
  if (!addr) return {};
  if (typeof addr === 'object') return addr;
  try {
    return JSON.parse(addr);
  } catch (e) {
    return {};
  }
}

// Validate customer fields according to specification
function validateCustomerData(data, isUpdate = false) {
  const errors = {};

  // 1. Customer Name (Required on create, validate if present on update)
  if (!isUpdate || data.customerName !== undefined) {
    const name = (data.customerName || '').trim();
    if (!name) {
      errors.customerName = 'Customer Name is required.';
    } else {
      const hasLetter = /[a-zA-Z]/.test(name);
      const validChars = /^[a-zA-Z0-9\s.\-&']+$/.test(name);
      if (!hasLetter || !validChars) {
        errors.customerName = 'Enter a valid customer name.';
      }
    }
  }

  // 2. Mobile Number (Required on create, exactly 10 digits; validate if present on update)
  if (!isUpdate || data.mobileNumber !== undefined || data.phoneNo !== undefined) {
    const mobile = (data.mobileNumber || data.phoneNo || '').toString().trim();
    if (!mobile) {
      errors.mobileNumber = 'Mobile number is required.';
    } else if (!/^\d{10}$/.test(mobile)) {
      errors.mobileNumber = 'Mobile number must be exactly 10 digits.';
    }
  }

  // 3. Email (Optional, if present validate format)
  if (data.email !== undefined || data.mailId !== undefined) {
    const email = (data.email || data.mailId || '').trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Enter a valid email address.';
    }
  }

  // 4. GST Identification Number (Optional, if present must be exactly 15 chars & match regex)
  if (data.gstIdentificationNumber !== undefined || data.gstNo !== undefined) {
    const gst = (data.gstIdentificationNumber || data.gstNo || '').trim().toUpperCase();
    if (gst) {
      if (gst.length !== 15) {
        errors.gstIdentificationNumber = 'GST Identification Number must be exactly 15 characters.';
      } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst)) {
        errors.gstIdentificationNumber = 'Enter a valid GST Identification Number.';
      }
    }
  }

  // 5. Billing PIN Code (Optional, if present exactly 6 digits)
  if (data.billingAddress && data.billingAddress.pinCode) {
    const pin = data.billingAddress.pinCode.toString().trim();
    if (pin && !/^\d{6}$/.test(pin)) {
      errors.billingPinCode = 'Enter a valid 6-digit PIN code.';
    }
  }

  // 6. Shipping PIN Code (Optional, if present exactly 6 digits)
  if (data.shippingAddress && data.shippingAddress.pinCode) {
    const pin = data.shippingAddress.pinCode.toString().trim();
    if (pin && !/^\d{6}$/.test(pin)) {
      errors.shippingPinCode = 'Enter a valid 6-digit PIN code.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function processCustomerPayload(body, file) {
  const customerData = { ...body };

  // Parse billing and shipping addresses if sent as JSON string
  if (customerData.billingAddress) {
    customerData.billingAddress = parseAddress(customerData.billingAddress);
  }
  if (customerData.shippingAddress) {
    customerData.shippingAddress = parseAddress(customerData.shippingAddress);
  }

  // Normalize shippingSameAsBilling
  if (customerData.shippingSameAsBilling !== undefined) {
    customerData.shippingSameAsBilling =
      customerData.shippingSameAsBilling === true ||
      customerData.shippingSameAsBilling === 'true' ||
      customerData.shippingSameAsBilling === 1 ||
      customerData.shippingSameAsBilling === '1';
  } else {
    customerData.shippingSameAsBilling = true;
  }

  if (customerData.shippingSameAsBilling && customerData.billingAddress) {
    customerData.shippingAddress = { ...customerData.billingAddress };
  }

  // Normalize status if provided
  if (customerData.status !== undefined) {
    customerData.status = normalizeStatus(customerData.status);
  }

  // Clean and sync Customer Name
  if (customerData.customerName) {
    customerData.customerName = customerData.customerName.trim().replace(/\s+/g, ' ');
  }

  // Normalize phone / mobile
  const mobile = (customerData.mobileNumber || customerData.phoneNo || '').toString().trim();
  customerData.mobileNumber = mobile;
  customerData.phoneNo = mobile;

  // Normalize email / mailId
  const email = (customerData.email || customerData.mailId || '').trim();
  customerData.email = email;
  customerData.mailId = email;

  // Normalize GST
  const gst = (customerData.gstIdentificationNumber || customerData.gstNo || '').trim().toUpperCase();
  customerData.gstIdentificationNumber = gst;
  customerData.gstNo = gst;

  // Formatted address for backward compatibility
  const b = customerData.billingAddress;
  if (b && (b.addressLine1 || b.city)) {
    const parts = [
      b.addressLine1,
      b.addressLine2,
      b.area,
      b.landmark,
      b.city,
      b.state ? (b.pinCode ? `${b.state} - ${b.pinCode}` : b.state) : b.pinCode,
      b.country,
    ].filter(Boolean);
    if (parts.length > 0) {
      customerData.address = parts.join(', ');
    }
  }

  // Attach file path if uploaded
  if (file) {
    customerData.profilePicture = `uploads/${file.filename}`;
  }

  return customerData;
}

// ---------- Controllers ----------

// Get all customers
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    const result = customers.map((c) => ({
      ...c.toObject(),
      status: c.status ? 'Active' : 'Inactive',
    }));
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch customers', error: error.message });
  }
};

// Get one customer
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.status(200).json(toDTO(customer, req));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch customer', error: error.message });
  }
};

// Create new customer
exports.createCustomer = [
  upload.single('profilePicture'),
  async (req, res) => {
    try {
      const customerData = processCustomerPayload(req.body, req.file);

      const validation = validateCustomerData(customerData);
      if (!validation.isValid) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: validation.errors,
        });
      }

      const newCustomer = new Customer(customerData);
      await newCustomer.save();

      res.status(201).json(toDTO(newCustomer, req));
    } catch (error) {
      res.status(400).json({ message: 'Failed to create customer', error: error.message });
    }
  },
];

// Update customer
exports.updateCustomer = [
  upload.single('profilePicture'),
  async (req, res) => {
    try {
      const customerData = processCustomerPayload(req.body, req.file);

      const validation = validateCustomerData(customerData, true);
      if (!validation.isValid) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: validation.errors,
        });
      }

      const updatedCustomer = await Customer.findByIdAndUpdate(
        req.params.id,
        customerData,
        { new: true }
      );

      if (!updatedCustomer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      res.status(200).json(toDTO(updatedCustomer, req));
    } catch (error) {
      res.status(400).json({ message: 'Failed to update customer', error: error.message });
    }
  },
];

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete customer', error: error.message });
  }
};
