const SelfTransfer = require('../models/SelfTransfer');
const StoreInward = require('../models/StoreInward');
const Warranty = require('../models/Warranty');

exports.createSelfTransfer = async (req, res) => {
    try {
        const {
            modelNo,
            fromOwner,
            toOwner,
            quantity,
            transferMethod,
            description,
            category,
            subCategory,
            userId,
            storeName,
            inwardId, // The original inward record ID to subtract from
            productPrice,
            scannedBarcode
        } = req.body;

        // 1. Create the transfer record
        const transfer = new SelfTransfer({
            modelNo,
            fromOwner,
            toOwner,
            quantity,
            transferMethod,
            description,
            category,
            subCategory,
            userId,
            storeName,
            productPrice,
            scannedBarcode: scannedBarcode || []
        });

        await transfer.save();

        // 2. Update the source StoreInward record
        if (inwardId) {
            const sourceRecord = await StoreInward.findById(inwardId);
            if (sourceRecord) {
                const newQuantity = sourceRecord.quantity - Number(quantity);
                if (newQuantity <= 0) {
                    await StoreInward.findByIdAndDelete(inwardId);
                } else {
                    sourceRecord.quantity = newQuantity;

                    // Remove transferred barcodes from the source record
                    if (scannedBarcode && scannedBarcode.length > 0) {
                        const transferredSet = new Set(scannedBarcode.map(b => b.trim()));
                        let currentBarcodes = [];
                        if (sourceRecord.scannedBarcode) {
                            if (Array.isArray(sourceRecord.scannedBarcode)) {
                                currentBarcodes = sourceRecord.scannedBarcode.map(b => b.trim());
                            } else if (typeof sourceRecord.scannedBarcode === 'string') {
                                currentBarcodes = sourceRecord.scannedBarcode.split(',').map(b => b.trim()).filter(b => b);
                            }
                        }
                        sourceRecord.scannedBarcode = currentBarcodes.filter(b => !transferredSet.has(b));
                    }

                    await sourceRecord.save();
                }
            }
        }

        // 3. Update Warranty items location
        if (scannedBarcode && scannedBarcode.length > 0) {
            const barcodes = scannedBarcode.map(b => b.trim()).filter(Boolean);
            for (const code of barcodes) {
                const warrantyItem = await Warranty.findOne({ barcode: code });
                if (warrantyItem) {
                    warrantyItem.currentWarehouseId = toOwner; // The new location
                    // Intentionally NOT modifying warrantyStatus or dates here
                    await warrantyItem.save();
                }
            }
        }

        // Optional: You could also create a NEW StoreInward record for the 'toOwner' 
        // but the user didn't explicitly ask for that. They just said "store in New API Selftransfer"

        res.status(201).json({
            success: true,
            message: 'Self transfer recorded successfully',
            data: transfer
        });
    } catch (error) {
        console.error('Error in createSelfTransfer:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getAllSelfTransfers = async (req, res) => {
    try {
        const transfers = await SelfTransfer.find().sort({ createdAt: -1 });
        res.status(200).json(transfers);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateSelfTransfer = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await SelfTransfer.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Transfer record not found' });
        }
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteSelfTransfer = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await SelfTransfer.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Transfer record not found' });
        }
        res.status(200).json({ success: true, message: 'Transfer record deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.receiveSelfTransfer = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantityToReceive, scannedBarcode } = req.body;

        const transfer = await SelfTransfer.findById(id);
        if (!transfer) {
            return res.status(404).json({ success: false, message: 'Transfer record not found' });
        }

        const qty = Number(quantityToReceive);
        if (!qty || qty <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid quantity' });
        }

        if (qty > transfer.quantity) {
            return res.status(400).json({ success: false, message: 'Cannot receive more than transferred quantity' });
        }

        // Create StoreInward record
        const storeInward = new StoreInward({
            modelNo: transfer.modelNo,
            quantity: qty,
            storeName: req.body.storeName || transfer.toOwner,
            owner: req.body.owner || transfer.toOwner,
            category: transfer.category,
            subCategory: transfer.subCategory, // Transfer the sub category
            userId: transfer.userId,
            scanningCode: `SELF-IN-${Date.now()}`,
            description: `Received from Self Transfer (Ref: ${transfer._id})`,
            pricePerUnit: transfer.productPrice || 0,
            scannedBarcode: scannedBarcode || []
        });

        await storeInward.save();

        // Update Self Transfer record
        const newQty = transfer.quantity - qty;

        if (newQty <= 0) {
            await SelfTransfer.findByIdAndDelete(id);
            res.status(200).json({
                success: true,
                message: 'Full quantity received and transfer record removed',
                data: null
            });
        } else {
            transfer.quantity = newQty;
            // Remove received barcodes from the transfer record
            if (scannedBarcode && scannedBarcode.length > 0) {
                const receivedSet = new Set(scannedBarcode.map(b => b.trim()));
                const currentTransferBarcodes = (transfer.scannedBarcode || []).map(b => b.trim());
                transfer.scannedBarcode = currentTransferBarcodes.filter(b => !receivedSet.has(b));
            }
            await transfer.save();
            res.status(200).json({
                success: true,
                message: 'Partial quantity received',
                data: transfer
            });
        }

    } catch (error) {
        console.error('Error in receiveSelfTransfer:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
