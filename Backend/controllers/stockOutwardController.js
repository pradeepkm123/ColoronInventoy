// const StockOutward = require("../models/StockOutward");
// const Dispatch = require("../models/Dispatch");
// const Product = require("../models/Product");

// // Helper: Update Product stock level and status
// const updateProductStock = async (modelNo, quantity, session = null) => {
//   const product = await Product.findOne({ model: { $regex: new RegExp(`^${modelNo}$`, "i") } }).session(session);
//   if (product) {
//     const newStockLevel = Math.max(0, (product.reorderLevel || 0) - quantity);
//     product.reorderLevel = newStockLevel;
//     product.stockStatus =
//       newStockLevel === 0 ? "Out of Stock" :
//         newStockLevel <= 5 ? "Low Stock" : "In Stock";
//     await product.save({ session });
//   }
// };

// // Helper: Update Dispatch quantity and barcodes
// const updateDispatch = async (modelNo, storeName, quantity, scannedList, session = null) => {
//   const dispatchItem = await Dispatch.findOne({
//     modelNo: { $regex: new RegExp(`^${modelNo}$`, "i") },
//     storeName: { $regex: new RegExp(`^${storeName}$`, "i") },
//   }).session(session);
//   if (dispatchItem) {
//     dispatchItem.quantity = Math.max(0, dispatchItem.quantity - quantity);
//     if (scannedList && scannedList.length > 0) {
//       if (Array.isArray(dispatchItem.barcodes)) {
//         dispatchItem.barcodes = dispatchItem.barcodes.filter(barcode => !scannedList.includes(barcode));
//       } else if (typeof dispatchItem.barcodes === 'string') {
//         const barcodes = dispatchItem.barcodes.split(',').map(b => b.trim());
//         dispatchItem.barcodes = barcodes.filter(barcode => !scannedList.includes(barcode)).join(', ');
//       }
//     }
//     await dispatchItem.save({ session });
//   }
// };

// // Helper: Rollback Product stock level and status
// const rollbackProductStock = async (modelNo, quantity, session = null) => {
//   const product = await Product.findOne({ model: { $regex: new RegExp(`^${modelNo}$`, "i") } }).session(session);
//   if (product) {
//     const newStockLevel = (product.reorderLevel || 0) + quantity;
//     product.reorderLevel = newStockLevel;
//     product.stockStatus =
//       newStockLevel === 0 ? "Out of Stock" :
//         newStockLevel <= 5 ? "Low Stock" :
//           newStockLevel <= 15 ? "Medium Stock" : "In Stock";
//     await product.save({ session });
//   }
// };

// // Helper: Rollback Dispatch quantity and barcodes
// const rollbackDispatch = async (modelNo, storeName, quantity, scannedList, session = null) => {
//   const dispatchItem = await Dispatch.findOne({
//     modelNo: { $regex: new RegExp(`^${modelNo}$`, "i") },
//     storeName: { $regex: new RegExp(`^${storeName}$`, "i") },
//   }).session(session);
//   if (dispatchItem) {
//     dispatchItem.quantity += quantity;
//     if (scannedList && scannedList.length > 0) {
//       if (Array.isArray(dispatchItem.barcodes)) {
//         dispatchItem.barcodes = [...dispatchItem.barcodes, ...scannedList];
//       } else if (typeof dispatchItem.barcodes === 'string') {
//         const barcodes = dispatchItem.barcodes.split(',').map(b => b.trim());
//         dispatchItem.barcodes = [...barcodes, ...scannedList].join(', ');
//       }
//     }
//     await dispatchItem.save({ session });
//   }
// };

// // Single Stock Outward
// exports.createStockOutward = async (req, res) => {
//   const session = await StockOutward.startSession();
//   session.startTransaction();
//   try {
//     const {
//       modelNo,
//       quantity,
//       reason,
//       userId,
//       storeName,
//       customerName,
//       customerMobile,
//       customerAddress,
//       scannedCodes,
//       scannedList,
//       price,
//       salePerson,
//       category,
//       subCategory,
//     } = req.body;

//     console.log("--- New Stock Outward Request ---");
//     console.log("Request Body:", JSON.stringify(req.body, null, 2));
//     console.log("---------------------------------");

//     // Validation
//     if (!modelNo || !quantity || !reason || !storeName || !customerName) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         error: "Required fields: modelNo, quantity, reason, storeName, customerName",
//       });
//     }
//     if (quantity <= 0) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         error: "Quantity must be greater than 0",
//       });
//     }

//     // Check inventory
//     const dispatchItem = await Dispatch.findOne({
//       modelNo: { $regex: new RegExp(`^${modelNo}$`, "i") },
//       storeName: { $regex: new RegExp(`^${storeName}$`, "i") },
//     }).session(session);

//     if (!dispatchItem) {
//       await session.abortTransaction();
//       return res.status(404).json({
//         success: false,
//         error: "Item not found in inventory for the given store.",
//       });
//     }
//     if (dispatchItem.quantity < quantity) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         error: `Insufficient stock. Only ${dispatchItem.quantity} units left.`,
//       });
//     }

//     // Update Product stock
//     await updateProductStock(modelNo, quantity, session);
//     // Update Dispatch
//     await updateDispatch(modelNo, storeName, quantity, scannedList, session);
//     // Create StockOutward record
//     const outward = new StockOutward({
//       modelNo: modelNo.toUpperCase(),
//       quantity,
//       reason,
//       userId: userId || "unknown-user",
//       storeName: storeName.toUpperCase(),
//       customerName,
//       customerMobile: customerMobile || "",
//       customerAddress: customerAddress || "",
//       scannedCodes: scannedCodes || "",
//       scannedList: scannedList || [],
//       price: price || 0,
//       salePerson: salePerson || "",
//       category: category || "",
//       subCategory: subCategory || "",
//     });
//     console.log("Outward object before save:", outward);
//     await outward.save({ session });

//     await session.commitTransaction();
//     res.status(201).json({
//       success: true,
//       message: "Stock outward recorded successfully",
//       data: outward,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     console.error("Error in createStockOutward:", error);
//     res.status(500).json({
//       success: false,
//       error: error.message || "Server error. Please try again later.",
//     });
//   } finally {
//     session.endSession();
//   }
// };

// // PATCH Update Stock Outward
// exports.updateStockOutward = async (req, res) => {
//   const session = await StockOutward.startSession();
//   session.startTransaction();
//   try {
//     const { id } = req.params;
//     const updates = req.body;

//     // Find the existing record
//     const existing = await StockOutward.findById(id).session(session);
//     if (!existing) {
//       await session.abortTransaction();
//       return res.status(404).json({
//         success: false,
//         error: "Stock outward record not found",
//       });
//     }

//     // If quantity is being updated, rollback old quantity and apply new quantity
//     if (updates.quantity && updates.quantity !== existing.quantity) {
//       const delta = updates.quantity - existing.quantity;
//       if (delta > 0) {
//         // Check if there's enough stock for the increase
//         const dispatchItem = await Dispatch.findOne({
//           modelNo: { $regex: new RegExp(`^${existing.modelNo}$`, "i") },
//           storeName: { $regex: new RegExp(`^${existing.storeName}$`, "i") },
//         }).session(session);
//         if (!dispatchItem || dispatchItem.quantity < delta) {
//           await session.abortTransaction();
//           return res.status(400).json({
//             success: false,
//             error: `Insufficient stock for increase. Only ${dispatchItem ? dispatchItem.quantity : 0} units left.`,
//           });
//         }
//         await updateProductStock(existing.modelNo, delta, session);
//         await updateDispatch(existing.modelNo, existing.storeName, delta, updates.scannedList, session);
//       } else {
//         // Rollback the difference
//         await rollbackProductStock(existing.modelNo, -delta, session);
//         await rollbackDispatch(existing.modelNo, existing.storeName, -delta, updates.scannedList, session);
//       }
//     }

//     // Apply updates
//     const updated = await StockOutward.findByIdAndUpdate(id, updates, { new: true, session });
//     await session.commitTransaction();
//     res.status(200).json({
//       success: true,
//       message: "Stock outward updated successfully",
//       data: updated,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     console.error("Error in updateStockOutward:", error);
//     res.status(500).json({
//       success: false,
//       error: error.message || "Server error. Please try again later.",
//     });
//   } finally {
//     session.endSession();
//   }
// };

// // DELETE Stock Outward
// exports.deleteStockOutward = async (req, res) => {
//   const session = await StockOutward.startSession();
//   session.startTransaction();
//   try {
//     const { id } = req.params;
//     const existing = await StockOutward.findById(id).session(session);
//     if (!existing) {
//       await session.abortTransaction();
//       return res.status(404).json({
//         success: false,
//         error: "Stock outward record not found",
//       });
//     }

//     // Rollback Product stock
//     await rollbackProductStock(existing.modelNo, existing.quantity, session);
//     // Rollback Dispatch
//     await rollbackDispatch(existing.modelNo, existing.storeName, existing.quantity, existing.scannedList, session);
//     // Delete StockOutward record
//     await StockOutward.findByIdAndDelete(id).session(session);

//     await session.commitTransaction();
//     res.status(200).json({
//       success: true,
//       message: "Stock outward deleted and stock rolled back successfully",
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     console.error("Error in deleteStockOutward:", error);
//     res.status(500).json({
//       success: false,
//       error: error.message || "Server error. Please try again later.",
//     });
//   } finally {
//     session.endSession();
//   }
// };

// // Get all Stock Outward records
// exports.getStockOutwards = async (req, res) => {
//   try {
//     const { userId, storeName, customerName, modelNo, startDate, endDate, page = 1, limit = 10 } = req.query;
//     const query = {};
//     if (userId) query.userId = userId;
//     if (storeName) query.storeName = { $regex: new RegExp(`^${storeName}$`, "i") };
//     if (customerName) query.customerName = { $regex: new RegExp(`^${customerName}$`, "i") };
//     if (modelNo) query.modelNo = { $regex: new RegExp(`^${modelNo}$`, "i") };
//     if (startDate || endDate) {
//       query.createdAt = {};
//       if (startDate) query.createdAt.$gte = new Date(startDate);
//       if (endDate) {
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);
//         query.createdAt.$lte = end;
//       }
//     }
//     const outwards = await StockOutward.find(query)
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);
//     const total = await StockOutward.countDocuments(query);
//     res.status(200).json({
//       success: true,
//       data: outwards,
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(total / limit),
//         totalItems: total,
//         itemsPerPage: limit,
//       },
//     });
//   } catch (error) {
//     console.error("Error in getStockOutwards:", error);
//     res.status(500).json({
//       success: false,
//       error: error.message || "Server error. Please try again later.",
//     });
//   }
// };





const StockOutward = require("../models/StockOutward");
const Dispatch = require("../models/Dispatch");
const Product = require("../models/Product");
const Warranty = require("../models/Warranty");

// Helper: Update Product stock level and status
const updateProductStock = async (modelNo, quantity, session = null) => {
  const product = await Product.findOne({ model: { $regex: new RegExp(`^${modelNo}$`, "i") } }).session(session);
  if (product) {
    const newStockLevel = Math.max(0, (product.reorderLevel || 0) - quantity);
    product.reorderLevel = newStockLevel;
    product.stockStatus =
      newStockLevel === 0 ? "Out of Stock" :
        newStockLevel <= 5 ? "Low Stock" : "In Stock";
    await product.save({ session });
  }
};

// Helper: Update Dispatch quantity and barcodes
const updateDispatch = async (modelNo, storeName, quantity, scannedList, session = null) => {
  const dispatchItem = await Dispatch.findOne({
    modelNo: { $regex: new RegExp(`^${modelNo}$`, "i") },
    storeName: { $regex: new RegExp(`^${storeName}$`, "i") },
  }).session(session);
  if (dispatchItem) {
    dispatchItem.quantity = Math.max(0, dispatchItem.quantity - quantity);
    if (scannedList && scannedList.length > 0) {
      if (Array.isArray(dispatchItem.barcodes)) {
        dispatchItem.barcodes = dispatchItem.barcodes.filter(barcode => !scannedList.includes(barcode));
      } else if (typeof dispatchItem.barcodes === 'string') {
        const barcodes = dispatchItem.barcodes.split(',').map(b => b.trim());
        dispatchItem.barcodes = barcodes.filter(barcode => !scannedList.includes(barcode)).join(', ');
      }
    }
    await dispatchItem.save({ session });
  }
};

// Helper: Rollback Product stock level and status
const rollbackProductStock = async (modelNo, quantity, session = null) => {
  const product = await Product.findOne({ model: { $regex: new RegExp(`^${modelNo}$`, "i") } }).session(session);
  if (product) {
    const newStockLevel = (product.reorderLevel || 0) + quantity;
    product.reorderLevel = newStockLevel;
    product.stockStatus =
      newStockLevel === 0 ? "Out of Stock" :
        newStockLevel <= 5 ? "Low Stock" :
          newStockLevel <= 15 ? "Medium Stock" : "In Stock";
    await product.save({ session });
  }
};

// Helper: Rollback Dispatch quantity and barcodes
const rollbackDispatch = async (modelNo, storeName, quantity, scannedList, session = null) => {
  const dispatchItem = await Dispatch.findOne({
    modelNo: { $regex: new RegExp(`^${modelNo}$`, "i") },
    storeName: { $regex: new RegExp(`^${storeName}$`, "i") },
  }).session(session);
  if (dispatchItem) {
    dispatchItem.quantity += quantity;
    if (scannedList && scannedList.length > 0) {
      if (Array.isArray(dispatchItem.barcodes)) {
        dispatchItem.barcodes = [...dispatchItem.barcodes, ...scannedList];
      } else if (typeof dispatchItem.barcodes === 'string') {
        const barcodes = dispatchItem.barcodes.split(',').map(b => b.trim());
        dispatchItem.barcodes = [...barcodes, ...scannedList].join(', ');
      }
    }
    await dispatchItem.save({ session });
  }
};

// Single Stock Outward
exports.createStockOutward = async (req, res) => {
  const session = await StockOutward.startSession();
  session.startTransaction();
  try {
    const {
      modelNo,
      quantity,
      reason,
      userId,
      storeName,
      customerName,
      customerMobile,
      customerAddress,
      scannedCodes,
      scannedList,
      price,
      salePerson,
      category,
      subCategory,
    } = req.body;

    console.log("--- New Stock Outward Request ---");
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
    console.log("---------------------------------");

    // Validation
    if (!modelNo || !quantity || !reason || !storeName || !customerName) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: "Required fields: modelNo, quantity, reason, storeName, customerName",
      });
    }
    if (quantity <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: "Quantity must be greater than 0",
      });
    }

    // Check inventory
    const dispatchItem = await Dispatch.findOne({
      modelNo: { $regex: new RegExp(`^${modelNo}$`, "i") },
      storeName: { $regex: new RegExp(`^${storeName}$`, "i") },
    }).session(session);

    if (!dispatchItem) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: "Item not found in inventory for the given store.",
      });
    }
    if (dispatchItem.quantity < quantity) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: `Insufficient stock. Only ${dispatchItem.quantity} units left.`,
      });
    }

    // Update Product stock
    await updateProductStock(modelNo, quantity, session);
    // Update Dispatch
    await updateDispatch(modelNo, storeName, quantity, scannedList, session);
    // Create StockOutward record
    const outward = new StockOutward({
      modelNo: modelNo.toUpperCase(),
      quantity,
      reason,
      userId: userId || "unknown-user",
      storeName: storeName.toUpperCase(),
      customerName,
      customerMobile: customerMobile || "",
      customerAddress: customerAddress || "",
      scannedCodes: scannedCodes || "",
      scannedList: scannedList || [],
      price: price || 0,
      salePerson: salePerson || "",
      category: category || "",
      subCategory: subCategory || "",
    });
    console.log("Outward object before save:", outward);
    await outward.save({ session });

    // Sync Warranty status for each scanned code
    const codes = Array.isArray(scannedList) && scannedList.length > 0
      ? scannedList
      : (scannedCodes ? scannedCodes.split(',').map(c => c.trim()).filter(Boolean) : []);

    if (codes.length > 0) {
      const isCustomerSale = (reason || '').toLowerCase().includes('sale') ||
                             (reason || '').toLowerCase().includes('customer') ||
                             (customerName && !storeName);

      const saleDate = new Date();

      for (const code of codes) {
        let warrantyItem = await Warranty.findOne({
          $or: [{ barcode: code }, { serialNumber: code }]
        }).session(session);

        if (!warrantyItem) {
          warrantyItem = new Warranty({
            serialNumber: code,
            barcode: code,
            modelNo: modelNo,
            productName: modelNo
          });
        }

        if (isCustomerSale) {
          const period = warrantyItem.customerWarranty?.period || warrantyItem.warrantyPeriod || 24;
          const unit = warrantyItem.customerWarranty?.periodUnit || warrantyItem.warrantyUnit || 'MONTHS';
          const endDate = new Date(saleDate);
          if (unit === 'DAYS') endDate.setDate(endDate.getDate() + period);
          else if (unit === 'YEARS') endDate.setFullYear(endDate.getFullYear() + period);
          else endDate.setMonth(endDate.getMonth() + period);
          endDate.setDate(endDate.getDate() - 1);
          endDate.setHours(23, 59, 59, 999);

          warrantyItem.currentStatus = 'SOLD';
          warrantyItem.stockStatus = 'SOLD';
          warrantyItem.status = 'IN_WARRANTY';
          warrantyItem.warrantyStartDate = saleDate;
          warrantyItem.warrantyEndDate = endDate;
          warrantyItem.sale = {
            sold: true,
            date: saleDate,
            customerName: customerName || '',
            customerMobile: customerMobile || '',
            customerAddress: customerAddress || '',
            salePerson: salePerson || '',
            price: price || 0
          };
          warrantyItem.customerWarranty = {
            period: period,
            periodUnit: unit,
            startDate: saleDate,
            endDate: endDate
          };
        } else {
          // Warehouse Transfer / Stock Outward to Store
          warrantyItem.currentStatus = 'DISPATCHED';
          warrantyItem.stockStatus = 'DISPATCHED';
          warrantyItem.status = 'NOT_STARTED';
          warrantyItem.warrantyStartDate = null;
          warrantyItem.warrantyEndDate = null;
          warrantyItem.sale = { sold: false };
          warrantyItem.customerWarranty = {
            period: warrantyItem.customerWarranty?.period || warrantyItem.warrantyPeriod || 24,
            periodUnit: warrantyItem.customerWarranty?.periodUnit || warrantyItem.warrantyUnit || 'MONTHS',
            startDate: null,
            endDate: null
          };
        }

        await warrantyItem.save({ session });
      }
    }

    await session.commitTransaction();

    // 🔔 Stock Level Notification to Super Admin
    try {
      const { notifyAdminOnStockLevel, notifyStoreOnDispatch } = require('../services/inventoryNotificationService');
      await notifyAdminOnStockLevel({
        modelNo: product.modelNo || product.model || modelNo,
        storeName: storeName || 'Main Warehouse',
        currentQuantity: newStockLevel
      });
      if (storeName && String(storeName).toLowerCase() !== 'main' && customerName) {
        await notifyStoreOnDispatch({
          storeName,
          invoiceNumber: reference || 'OUT-' + Date.now().toString().slice(-6),
          modelNo,
          quantity,
          barcodes: scannedList || [],
          dispatchDate: new Date()
        });
      }
    } catch (notifErr) {
      console.warn('Stock outward notification warning:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Stock outward recorded successfully",
      data: outward,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in createStockOutward:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error. Please try again later.",
    });
  } finally {
    session.endSession();
  }
};

// PATCH Update Stock Outward
exports.updateStockOutward = async (req, res) => {
  const session = await StockOutward.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find the existing record
    const existing = await StockOutward.findById(id).session(session);
    if (!existing) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: "Stock outward record not found",
      });
    }

    // If quantity is being updated, rollback old quantity and apply new quantity
    if (updates.quantity && updates.quantity !== existing.quantity) {
      const delta = updates.quantity - existing.quantity;
      if (delta > 0) {
        // Check if there's enough stock for the increase
        const dispatchItem = await Dispatch.findOne({
          modelNo: { $regex: new RegExp(`^${existing.modelNo}$`, "i") },
          storeName: { $regex: new RegExp(`^${existing.storeName}$`, "i") },
        }).session(session);
        if (!dispatchItem || dispatchItem.quantity < delta) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            error: `Insufficient stock for increase. Only ${dispatchItem ? dispatchItem.quantity : 0} units left.`,
          });
        }
        await updateProductStock(existing.modelNo, delta, session);
        await updateDispatch(existing.modelNo, existing.storeName, delta, updates.scannedList, session);
      } else {
        // Rollback the difference
        await rollbackProductStock(existing.modelNo, -delta, session);
        await rollbackDispatch(existing.modelNo, existing.storeName, -delta, updates.scannedList, session);
      }
    }

    // Apply updates
    const updated = await StockOutward.findByIdAndUpdate(id, updates, { new: true, session });
    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: "Stock outward updated successfully",
      data: updated,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in updateStockOutward:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error. Please try again later.",
    });
  } finally {
    session.endSession();
  }
};

// DELETE Stock Outward
exports.deleteStockOutward = async (req, res) => {
  const session = await StockOutward.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const existing = await StockOutward.findById(id).session(session);
    if (!existing) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: "Stock outward record not found",
      });
    }

    // Rollback Product stock
    await rollbackProductStock(existing.modelNo, existing.quantity, session);
    // Rollback Dispatch
    await rollbackDispatch(existing.modelNo, existing.storeName, existing.quantity, existing.scannedList, session);
    // Delete StockOutward record
    await StockOutward.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: "Stock outward deleted and stock rolled back successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in deleteStockOutward:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error. Please try again later.",
    });
  } finally {
    session.endSession();
  }
};

// Get all Stock Outward records
exports.getStockOutwards = async (req, res) => {
  try {
    const { userId, storeName, customerName, modelNo, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = {};
    if (userId) query.userId = userId;
    if (storeName) query.storeName = { $regex: new RegExp(storeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") };
    if (customerName) query.customerName = { $regex: new RegExp(`^${customerName}$`, "i") };
    if (modelNo) query.modelNo = { $regex: new RegExp(`^${modelNo}$`, "i") };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const outwards = await StockOutward.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum > 0 ? limitNum : (limitNum === 0 ? 0 : 50)) // Default to 50 if not specified, 0 for all
      .skip(limitNum > 0 ? (pageNum - 1) * limitNum : 0);
    const total = await StockOutward.countDocuments(query);
    res.status(200).json({
      success: true,
      data: outwards,
      pagination: {
        currentPage: pageNum,
        totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 1,
        totalItems: total,
        itemsPerPage: limitNum > 0 ? limitNum : total,
      },
    });
  } catch (error) {
    console.error("Error in getStockOutwards:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error. Please try again later.",
    });
  }
};

