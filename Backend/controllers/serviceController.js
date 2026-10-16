// const Service = require('../models/Service');

// // ➕ Create new service
// exports.createService = async (req, res) => {
//   try {
//     const newService = new Service({
//       ...req.body,
//       productImage: req.file ? req.file.filename : null,
//     });

//     const savedService = await newService.save();
//     res.status(201).json(savedService);
//   } catch (error) {
//     console.error('Error creating service:', error);
//     res.status(500).json({ error: 'Failed to create service' });
//   }
// };

// // 📋 Get all services
// exports.getAllServices = async (req, res) => {
//   try {
//     const services = await Service.find().sort({ createdAt: -1 });
//     res.json(services);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch services' });
//   }
// };

// // 🔍 Get one
// exports.getServiceById = async (req, res) => {
//   try {
//     const service = await Service.findById(req.params.id);
//     if (!service) return res.status(404).json({ error: 'Service not found' });
//     res.json(service);
//   } catch {
//     res.status(500).json({ error: 'Failed to fetch service' });
//   }
// };

// // Update service (for payment/dispatch)
// exports.updateService = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = { ...req.body };

//     if (req.file) {
//       updateData.productImage = req.file.filename;
//     }

//     const updated = await Service.findByIdAndUpdate(id, updateData, {
//       new: true,
//     });

//     if (!updated)
//       return res.status(404).json({ error: "Service not found" });

//     res.json(updated);
//   } catch (error) {
//     console.error("Error updating service:", error);
//     res.status(500).json({ error: "Failed to update service" });
//   }
// };


// // ❌ Delete
// exports.deleteService = async (req, res) => {
//   try {
//     const deleted = await Service.findByIdAndDelete(req.params.id);
//     if (!deleted) return res.status(404).json({ error: 'Service not found' });
//     res.json({ success: true });
//   } catch {
//     res.status(500).json({ error: 'Failed to delete service' });
//   }
// };





const Service = require('../models/Service');

// ➕ Create new service
exports.createService = async (req, res) => {
  try {
    const newService = new Service({
      ...req.body,
      productImage: req.file ? req.file.filename : null,
    });

    const savedService = await newService.save();
    res.status(201).json(savedService);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
};

// 📋 Get all services
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

// 🔍 Get one
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch {
    res.status(500).json({ error: 'Failed to fetch service' });
  }
};

// Update service (for payment/dispatch)
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.file) {
      updateData.productImage = req.file.filename;
    }

    const updated = await Service.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updated)
      return res.status(404).json({ error: "Service not found" });

    res.json(updated);
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ error: "Failed to update service" });
  }
};


// ❌ Delete
exports.deleteService = async (req, res) => {
  try {
    const deleted = await Service.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Service not found' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete service' });
  }
};
