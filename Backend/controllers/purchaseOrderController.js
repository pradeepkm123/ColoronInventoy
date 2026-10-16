const PurchaseOrder = require('../models/PurchaseOrder');
const CompanyIdealSequence = require('../models/CompanyIdealSequence');

// Helper to normalize company name key
const getCompanyKey = (name) => (name || '').trim().toLowerCase();

// ✅ Get all Purchase Orders / Ideal Records
exports.getPurchaseOrders = async (req, res) => {
  try {
    const { company, search } = req.query;
    let filter = {};

    if (company && company !== 'All') {
      filter.companyName = new RegExp(`^${company.trim()}$`, 'i');
    }
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { idealNo: searchRegex },
        { companyName: searchRegex },
        { location: searchRegex }
      ];
    }

    const orders = await PurchaseOrder.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Next Ideal No. for a given Company (e.g. V1, V2, V3...)
exports.getNextIdealNo = async (req, res) => {
  try {
    const { companyName } = req.body;
    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ message: "Company Name is required" });
    }

    const trimmedCompany = companyName.trim();
    const companyKey = getCompanyKey(trimmedCompany);

    // 1. Check sequence counter table
    const seqDoc = await CompanyIdealSequence.findOne({ companyNameKey: companyKey });
    let maxSeq = seqDoc ? seqDoc.lastIdealSeq : 0;

    // 2. Fallback check on existing purchase orders for this company
    if (maxSeq === 0) {
      const existingOrders = await PurchaseOrder.find({
        companyName: new RegExp(`^${trimmedCompany.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      }).select('idealSeq');
      existingOrders.forEach(o => {
        if (o.idealSeq && o.idealSeq > maxSeq) {
          maxSeq = o.idealSeq;
        }
      });
    }

    const nextIdealSeq = maxSeq + 1;
    const nextIdealNo = `V${nextIdealSeq}`;

    res.json({
      companyName: trimmedCompany,
      lastIdealSeq: maxSeq,
      lastIdealNo: maxSeq > 0 ? `V${maxSeq}` : 'None',
      nextIdealSeq,
      nextIdealNo
    });
  } catch (error) {
    console.error('Error fetching next ideal no:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Create a new Company Ideal record with manual or auto Ideal No and Location
exports.createPurchaseOrder = async (req, res) => {
  try {
    const {
      companyName,
      idealNo: customIdealNo,
      location,
      notes,
      createdBy
    } = req.body;

    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ message: "Company Name is required" });
    }

    const trimmedCompany = companyName.trim();
    const companyKey = getCompanyKey(trimmedCompany);

    // Atomically increment the sequence for this company
    const updatedSeq = await CompanyIdealSequence.findOneAndUpdate(
      { companyNameKey: companyKey },
      {
        $inc: { lastIdealSeq: 1 },
        $set: { displayCompanyName: trimmedCompany, updatedAt: new Date() }
      },
      { upsert: true, new: true }
    );

    const idealSeq = updatedSeq.lastIdealSeq;
    const finalIdealNo = (customIdealNo && customIdealNo.trim()) ? customIdealNo.trim() : `V${idealSeq}`;

    const newOrder = new PurchaseOrder({
      companyName: trimmedCompany,
      idealNo: finalIdealNo,
      idealSeq,
      location: (location || '').trim(),
      notes,
      createdBy
    });

    await newOrder.save();

    res.status(201).json({
      success: true,
      message: `Ideal No ${finalIdealNo} generated successfully for ${trimmedCompany}!`,
      order: newOrder
    });
  } catch (error) {
    console.error('Error creating company ideal order:', error);
    res.status(400).json({ message: error.message });
  }
};

// ✅ Update Purchase Order
exports.updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, idealNo, location, notes } = req.body;

    let updateData = {};
    if (companyName) updateData.companyName = companyName.trim();
    if (idealNo) updateData.idealNo = idealNo.trim();
    if (location !== undefined) updateData.location = location.trim();
    if (notes !== undefined) updateData.notes = notes;

    const updated = await PurchaseOrder.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json({
      success: true,
      message: "Updated successfully",
      order: updated
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(400).json({ message: error.message });
  }
};

// ✅ Delete Purchase Order
exports.deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PurchaseOrder.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get list of all known supplier companies with their current Ideal counts
exports.getCompanyList = async (req, res) => {
  try {
    const companies = await CompanyIdealSequence.find({}).sort({ displayCompanyName: 1 });
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: error.message });
  }
};
