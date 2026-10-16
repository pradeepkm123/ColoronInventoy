// // controllers/productController.js
// const Product = require('../models/Product');

// const updateStockStatus = (product) => {
//   if (product.reorderLevel <= 0) {
//     product.stockStatus = 'Out of Stock';
//   } else if (product.reorderLevel < 5) {
//     product.stockStatus = 'Low Stock';
//   } else {
//     product.stockStatus = 'In Stock';
//   }
//   return product;
// };

// exports.getAllProducts = async (req, res) => {
//   try {
//     const products = await Product.find();
//     res.json(products);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.createProduct = async (req, res) => {
//   try {
//     const productData = {
//       ...req.body,
//       mrp: Number(req.body.mrp),
//       dealerPrice: Number(req.body.dealerPrice),
//       warranty: Number(req.body.warranty),
//       reorderLevel: Number(req.body.reorderLevel),
//     };

//     if (req.file) {
//       productData.productImage = req.file.filename;
//     }

//     let product = new Product(productData);
//     product = updateStockStatus(product);
//     const savedProduct = await product.save();
//     res.status(201).json(savedProduct);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// exports.updateProduct = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) return res.status(404).json({ message: 'Product not found' });

//     const updates = {
//       ...req.body,
//       mrp: Number(req.body.mrp),
//       dealerPrice: Number(req.body.dealerPrice),
//       warranty: Number(req.body.warranty),
//       reorderLevel: Number(req.body.reorderLevel),
//     };

//     if (req.file) {
//       updates.productImage = req.file.filename;
//     }

//     Object.assign(product, updates);
//     updateStockStatus(product);
//     const updatedProduct = await product.save();
//     res.json(updatedProduct);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// exports.deleteProduct = async (req, res) => {
//   try {
//     await Product.findByIdAndDelete(req.params.id);
//     res.json({ message: 'Product deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };






// controllers/productController.js
const Product = require('../models/Product');
const { notifyAdminOnStockLevel } = require('../services/inventoryNotificationService');

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      productImage: req.file ? req.file.filename : null,
    };

    const product = new Product(productData);
    await product.save();

    // 🔔 Stock Level Notification Check
    try {
      if (
        product.stockStatus === 'Low Stock' ||
        product.stockStatus === 'Out of Stock' ||
        (product.reorderLevel !== undefined && product.reorderLevel <= 5)
      ) {
        await notifyAdminOnStockLevel({
          modelNo: product.model || product.modelNo || 'Product',
          storeName: 'Main Store',
          currentQuantity: product.reorderLevel !== undefined ? product.reorderLevel : (product.stockStatus === 'Out of Stock' ? 0 : 3),
          minStock: 5,
          stockStatus: product.stockStatus,
        });
      }
    } catch (notifErr) {
      console.warn('Product stock notification warning:', notifErr.message);
    }

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const updates = {
      ...req.body,
      productImage: req.file ? req.file.filename : product.productImage,
    };

    Object.assign(product, updates);
    await product.save();

    // 🔔 Stock Level Notification Check
    try {
      if (
        product.stockStatus === 'Low Stock' ||
        product.stockStatus === 'Out of Stock' ||
        (product.reorderLevel !== undefined && product.reorderLevel <= 5)
      ) {
        await notifyAdminOnStockLevel({
          modelNo: product.model || product.modelNo || 'Product',
          storeName: 'Main Store',
          currentQuantity: product.reorderLevel !== undefined ? product.reorderLevel : (product.stockStatus === 'Out of Stock' ? 0 : 3),
          minStock: 5,
          stockStatus: product.stockStatus,
        });
      }
    } catch (notifErr) {
      console.warn('Product stock notification warning:', notifErr.message);
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
