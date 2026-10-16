import RawMaterial from "../models/RawMaterialModel.js";

// ➕ Create Raw Material
export const createRawMaterial = async (req, res) => {
  try {
    const { name, units, image } = req.body;

    const newRawMaterial = await RawMaterial.create({
      name,
      units,
      image,
      addedBy: req.user._id,
      storeName: req.user.storeName || req.user.role,
    });

    res.status(201).json({ success: true, data: newRawMaterial });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add Raw Material",
      error: error.message,
    });
  }
};

// 📦 Get All Raw Materials
export const getRawMaterials = async (req, res) => {
  try {
    const filter = {};

    // If user is not admin, filter by storeName or role
    if (req.user && req.user.role !== "Admin") {
      filter.storeName = req.user.storeName || req.user.role;
    }

    const rawMaterials = await RawMaterial.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: rawMaterials });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch Raw Materials" });
  }
};

// ✏️ Update Raw Material
export const updateRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRawMaterial = await RawMaterial.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedRawMaterial)
      return res.status(404).json({ success: false, message: "Raw Material not found" });

    res.json({ success: true, data: updatedRawMaterial });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update Raw Material" });
  }
};

// 🗑️ Delete Raw Material
export const deleteRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRawMaterial = await RawMaterial.findByIdAndDelete(id);

    if (!deletedRawMaterial)
      return res.status(404).json({ success: false, message: "Raw Material not found" });

    res.json({ success: true, message: "Raw Material deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete Raw Material" });
  }
};
