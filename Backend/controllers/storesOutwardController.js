const StockOutward = require('../models/StockOutward');
const Product = require('../models/Product');
const Warranty = require('../models/Warranty');
const StoreInward = require('../models/StoreInward');

// Helper to calculate warranty end date
const calculateWarrantyEnd = (startDate, period, unit) => {
    if (!period || period <= 0) return null;
    const date = new Date(startDate);
    if (unit === 'DAYS') {
        date.setDate(date.getDate() + period);
    } else if (unit === 'MONTHS') {
        date.setMonth(date.getMonth() + period);
    } else { // YEARS
        date.setFullYear(date.getFullYear() + period);
    }
    return date;
};

// Create new Stores Outward entry
exports.createStoresOutward = async (req, res) => {
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

        console.log("Incoming Stores Outward Request:", req.body);

        // 1. Validation
        if (!modelNo || !quantity || !storeName || !customerName) {
            return res.status(400).json({
                success: false,
                error: "Required fields: modelNo, quantity, storeName, customerName",
            });
        }

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                error: "Quantity must be greater than 0",
            });
        }

        // 2. Create StockOutward Record
        const stockOutward = new StockOutward({
            modelNo,
            quantity,
            reason: reason || "Store Sale",
            userId,
            storeName,
            customerName,
            customerMobile,
            customerAddress,
            scannedCodes,
            scannedList,
            price,
            salePerson,
            category: category || "",
            subCategory: subCategory || "",
        });

        await stockOutward.save();

        // 3. Update Product Stock (Reorder Level as Quantity)
        // Using 'model' field as per Product schema
        const product = await Product.findOne({ model: { $regex: new RegExp(`^${modelNo}$`, 'i') } });

        if (product) {
            const currentLevel = product.reorderLevel || 0;
            const newLevel = Math.max(0, currentLevel - quantity);

            product.reorderLevel = newLevel;

            // Update stock status based on new level
            if (newLevel === 0) {
                product.stockStatus = "Out of Stock";
            } else if (newLevel <= 5) {
                product.stockStatus = "Low Stock";
            } else {
                product.stockStatus = "In Stock";
            }

            await product.save();
            console.log(`Updated Product ${modelNo} stock to ${newLevel}`);
        } else {
            console.warn(`Product ${modelNo} not found in Products collection, skipping stock update.`);
        }

        // 4. Update Warranty / Individual Serial Status
        if (scannedCodes && typeof scannedCodes === 'string') {
            const codes = scannedCodes.split(',').map(c => c.trim()).filter(Boolean);
            const saleDate = new Date();
            
            for (const code of codes) {
                let warrantyItem = await Warranty.findOne({
                    $or: [{ barcode: code }, { serialNumber: code }]
                });
                if (!warrantyItem) {
                    warrantyItem = new Warranty({
                        serialNumber: code,
                        barcode: code,
                        modelNo: modelNo,
                        productName: modelNo
                    });
                }

                const period = warrantyItem.customerWarranty?.period || warrantyItem.warrantyPeriod || 24;
                const unit = warrantyItem.customerWarranty?.periodUnit || warrantyItem.warrantyUnit || 'MONTHS';
                const endDate = calculateWarrantyEnd(saleDate, period, unit);

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

                await warrantyItem.save();
            }
        }

        // 5. Update / Deduct StoreInward Records & Remove 0-Quantity Rows
        try {
            const codesToDeduct = (scannedList && scannedList.length > 0)
                ? scannedList
                : (scannedCodes ? String(scannedCodes).split(',').map(c => c.trim()).filter(Boolean) : []);

            const codesToRemoveSet = new Set(codesToDeduct.map(c => String(c).trim().toLowerCase()));
            let remainingQtyToDeduct = Number(quantity) || 0;

            const storeInwards = await StoreInward.find({
                modelNo: { $regex: new RegExp(`^${modelNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                storeName: { $regex: new RegExp(`^${storeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
            }).sort({ createdAt: 1 });

            for (const record of storeInwards) {
                if (remainingQtyToDeduct <= 0 && codesToRemoveSet.size === 0) break;

                const currentQty = Number(record.quantity) || 0;
                let currentBarcodes = Array.isArray(record.scannedBarcode)
                    ? [...record.scannedBarcode]
                    : (typeof record.scannedBarcode === 'string'
                        ? record.scannedBarcode.split(',').map(b => b.trim()).filter(Boolean)
                        : []);

                let updatedQty = currentQty;
                let updatedBarcodes = [...currentBarcodes];

                if (codesToRemoveSet.size > 0 && currentBarcodes.length > 0) {
                    const beforeCount = updatedBarcodes.length;
                    updatedBarcodes = updatedBarcodes.filter(b => !codesToRemoveSet.has(String(b).trim().toLowerCase()));
                    const removedCount = beforeCount - updatedBarcodes.length;

                    if (removedCount > 0) {
                        updatedQty = Math.max(0, updatedQty - removedCount);
                        remainingQtyToDeduct = Math.max(0, remainingQtyToDeduct - removedCount);
                    }
                }

                if (remainingQtyToDeduct > 0 && updatedQty > 0) {
                    const reduce = Math.min(remainingQtyToDeduct, updatedQty);
                    updatedQty -= reduce;
                    remainingQtyToDeduct -= reduce;
                }

                if (updatedQty <= 0) {
                    // 0 quantity remaining -> delete record completely
                    await StoreInward.findByIdAndDelete(record._id);
                } else {
                    record.quantity = updatedQty;
                    record.scannedBarcode = updatedBarcodes;
                    await record.save();
                }
            }
        } catch (invErr) {
            console.error("Warning updating StoreInward inventory on outward:", invErr.message);
        }

        res.status(201).json({
            success: true,
            message: "Stores Outward recorded successfully and store inventory updated",
            data: stockOutward,
        });

    } catch (error) {
        console.error("Error in createStoresOutward:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Server error"
        });
    }
};
