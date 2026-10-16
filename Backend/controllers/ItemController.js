// // const PackagingItem = require('../models/ItemModel');

// // // ✅ GET ALL ITEMS
// // exports.getAllItems = async (req, res) => {
// //   try {
// //     const filter = req.user?.role ? { storeName: req.user.role } : {};
// //     const items = await PackagingItem.find(filter).sort({ createdAt: -1 });
// //     res.status(200).json(items);
// //   } catch (err) {
// //     console.error('❌ Error fetching items:', err);
// //     res.status(500).json({ error: 'Server error' });
// //   }
// // };

// // // ✅ ADD ITEM
// // exports.addItem = async (req, res) => {
// //   try {
// //     console.log('🟢 POST /api/items body:', req.body);
// //     console.log('🟢 Auth user:', req.user);

// //     const { name, units, image, storeName } = req.body;

// //     if (!name || !units || !storeName) {
// //       return res.status(400).json({ error: 'Missing required fields' });
// //     }

// //     const newItem = new PackagingItem({
// //       name,
// //       units,
// //       image,
// //       storeName,
// //       addedBy: req.user.userId || req.user._id || 'unknown',
// //       updatedBy: req.user.userId || req.user._id || 'unknown',
// //     });

// //     const saved = await newItem.save();
// //     console.log('✅ Item saved:', saved);
// //     res.status(201).json(saved);
// //   } catch (err) {
// //     console.error('❌ Error adding item:', err);
// //     res.status(500).json({ error: 'Server error while adding item' });
// //   }
// // };

// // // ✅ UPDATE ITEM
// // exports.updateItem = async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const updated = await PackagingItem.findByIdAndUpdate(
// //       id,
// //       { ...req.body, updatedBy: req.user.userId },
// //       { new: true }
// //     );
// //     if (!updated) return res.status(404).json({ error: 'Item not found' });
// //     res.status(200).json(updated);
// //   } catch (err) {
// //     console.error('❌ Error updating item:', err);
// //     res.status(500).json({ error: 'Server error while updating item' });
// //   }
// // };

// // // ✅ DELETE ITEM
// // exports.deleteItem = async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const deleted = await PackagingItem.findByIdAndDelete(id);
// //     if (!deleted) return res.status(404).json({ error: 'Item not found' });
// //     res.status(200).json({ message: 'Item deleted successfully' });
// //   } catch (err) {
// //     console.error('❌ Error deleting item:', err);
// //     res.status(500).json({ error: 'Server error while deleting item' });
// //   }
// // };

// const PackagingItem = require('../models/ItemModel');

// /**
//  * ✅ GET all items
//  * Admins see all, others see only their store’s items
//  */
// exports.getAllItems = async (req, res) => {
//   try {
//     const role = req.user?.role;
//     let filter = {};

//     // Only non-admins are filtered
//     if (role && role.toUpperCase() !== 'ADMIN') {
//       filter = { storeName: role };
//     }

//     const items = await PackagingItem.find(filter).sort({ createdAt: -1 });
//     res.status(200).json(items);
//   } catch (err) {
//     console.error('❌ Error fetching items:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// /**
//  * ✅ ADD item
//  * Automatically sets storeName = logged-in user's role
//  */
// exports.addItem = async (req, res) => {
//   try {
//     const { name, units, image } = req.body;
//     const role = req.user?.role;
//     const userId = req.user?.id;

//     if (!name || !units) {
//       return res.status(400).json({ error: 'Name and units are required' });
//     }

//     const newItem = new PackagingItem({
//       name,
//       units,
//       image,
//       storeName: role || 'UNKNOWN',
//       addedBy: userId,
//       updatedBy: userId,
//     });

//     const saved = await newItem.save();
//     res.status(201).json(saved);
//   } catch (err) {
//     console.error('❌ Error adding item:', err);
//     res.status(500).json({ error: 'Server error while adding item' });
//   }
// };

// /**
//  * ✅ UPDATE item
//  * Admin can edit all, store users only their store
//  */
// exports.updateItem = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const role = req.user?.role;

//     const item = await PackagingItem.findById(id);
//     if (!item) return res.status(404).json({ error: 'Item not found' });

//     if (role.toUpperCase() !== 'ADMIN' && item.storeName !== role) {
//       return res
//         .status(403)
//         .json({ error: 'You can only edit items for your store' });
//     }

//     const updated = await PackagingItem.findByIdAndUpdate(
//       id,
//       { ...req.body, updatedBy: req.user.id },
//       { new: true }
//     );

//     res.status(200).json(updated);
//   } catch (err) {
//     console.error('❌ Error updating item:', err);
//     res.status(500).json({ error: 'Server error while updating item' });
//   }
// };

// /**
//  * ✅ DELETE item
//  * Admin can delete all, store users only their own
//  */
// exports.deleteItem = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const role = req.user?.role;

//     const item = await PackagingItem.findById(id);
//     if (!item) return res.status(404).json({ error: 'Item not found' });

//     if (role.toUpperCase() !== 'ADMIN' && item.storeName !== role) {
//       return res
//         .status(403)
//         .json({ error: 'You can only delete items for your store' });
//     }

//     await PackagingItem.findByIdAndDelete(id);
//     res.status(200).json({ message: 'Item deleted successfully' });
//   } catch (err) {
//     console.error('❌ Error deleting item:', err);
//     res.status(500).json({ error: 'Server error while deleting item' });
//   }
// };
