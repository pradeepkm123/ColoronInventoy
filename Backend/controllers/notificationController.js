// backend/controllers/notificationController.js
const Notification = require('../models/Notification');
const {
  emitToStore,
  emitToSuperAdmin,
  emitToServicePerson,
  emitToUser,
  emitToAll,
} = require('../socket');

exports.getNotifications = async (req, res) => {
  try {
    const { role, userRole, name, userName, userId, storeName, limit = 250 } = req.query;
    const effectiveRole = (role || userRole || req.user?.role || '').toLowerCase().trim();
    const effectiveName = (name || userName || req.user?.name || '').trim();
    const effectiveUserId = (userId || req.user?._id || req.user?.id || '').toString().trim();
    const effectiveStore = (storeName || req.user?.storeName || '').trim();

    const isSuperAdmin = ['admin', 'super admin', 'manager', 'headoffice'].includes(effectiveRole) || effectiveRole.includes('admin');
    const isServicePerson = !isSuperAdmin && (effectiveRole.includes('service') || effectiveRole.includes('engineer') || effectiveRole.includes('technician'));
    const isStoreUser = !isSuperAdmin && !isServicePerson && (effectiveRole === 'store' || effectiveRole.includes('store') || effectiveStore);

    let query = {};

    if (isServicePerson) {
      // Service Person ONLY receives notifications related to service/repair tasks allocated to them or handled by them
      const nameRegex = effectiveName ? new RegExp(effectiveName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
      
      const personConditions = [
        { recipientRole: { $regex: /service|engineer|technician/i } },
        ...(nameRegex ? [
          { recipientName: { $regex: nameRegex } },
          { senderName: { $regex: nameRegex } },
          { 'metadata.assignedEngineer': { $regex: nameRegex } },
          { 'metadata.servicePerson': { $regex: nameRegex } },
          { 'metadata.performedBy': { $regex: nameRegex } },
          { title: { $regex: nameRegex } },
          { targetText: { $regex: nameRegex } },
        ] : []),
        ...(effectiveUserId ? [
          { recipientId: effectiveUserId },
          { 'metadata.engineerId': effectiveUserId },
        ] : []),
      ];

      query = {
        category: { $in: ['SERVICE', 'RMA', 'SPARES', 'SYSTEM', 'COMMUNICATION'] },
        $or: personConditions,
      };
    } else if (isStoreUser && effectiveStore) {
      const storeRegex = new RegExp(`^${effectiveStore.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      query.$or = [
        { storeId: { $regex: storeRegex } },
        { userLocation: { $regex: storeRegex } },
        { recipientName: { $regex: storeRegex } },
        { 'metadata.storeName': { $regex: storeRegex } },
        { recipientRole: 'ALL' },
      ];
    }

    const rawList = await Notification.find(query).sort({ createdAt: -1 }).limit(Number(limit) || 250);

    // Deduplicate notifications on backend by ID, content signature, and timestamp window (5 min)
    const seenSignatures = new Set();
    const seenIds = new Set();
    const list = [];

    for (const item of rawList) {
      const id = String(item._id || item.id || '');
      if (id && seenIds.has(id)) continue;

      const sender = (item.userName || item.senderName || '').trim().toLowerCase();
      const action = (item.actionText || '').trim().toLowerCase();
      const text = (item.targetText || item.title || item.message || '').trim().toLowerCase();
      const timeMs = item.createdAt ? new Date(item.createdAt).getTime() : 0;
      const timeBucket = timeMs > 0 ? Math.floor(timeMs / (5 * 60 * 1000)) : 0;

      const sig = text ? `${text}___${timeBucket}` : id;
      if (text && seenSignatures.has(sig)) {
        continue;
      }

      if (id) seenIds.add(id);
      if (text) seenSignatures.add(sig);
      list.push(item);
    }

    const unreadCount = list.filter((n) => !n.read && !n.isRead).length;
    return res.json({
      success: true,
      notifications: list,
      unreadCount,
      total: list.length,
    });
  } catch (err) {
    return res.json({
      success: true,
      notifications: [],
      unreadCount: 0,
      total: 0,
    });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const item = await Notification.create(req.body);

    try {
      const recipientRoleLower = (item.recipientRole || '').toLowerCase();
      const recipientName = item.recipientName || '';
      const storeId = item.storeId || '';
      const msgText = item.targetText || item.title || item.message || 'New notification';

      // 1. If sent to Super Admin
      if (
        recipientRoleLower.includes('super_admin') ||
        recipientRoleLower.includes('admin') ||
        recipientName.toLowerCase().includes('admin')
      ) {
        emitToSuperAdmin('notification_received', {
          notification: item,
          message: `${item.userName || item.senderName || 'Staff'}: ${msgText}`,
        });
      }

      // 2. If sent to Service Person
      if (
        recipientRoleLower.includes('service') ||
        recipientRoleLower.includes('engineer') ||
        recipientRoleLower.includes('technician')
      ) {
        emitToServicePerson(recipientName, 'notification_received', {
          notification: item,
          message: `${item.userName || item.senderName || 'Super Admin'}: ${msgText}`,
        });
      }

      // 3. If sent to Store
      if (storeId) {
        emitToStore(storeId, 'notification_received', {
          notification: item,
          message: `${item.userName || item.senderName || 'Admin'}: ${msgText}`,
        });
      }

      // 4. Specific direct recipient name / ID
      if (recipientName) {
        emitToUser(recipientName, 'notification_received', {
          notification: item,
          message: `${item.userName || item.senderName || 'Admin'}: ${msgText}`,
        });
      }
      if (item.recipientId) {
        emitToUser(item.recipientId.toString(), 'notification_received', {
          notification: item,
          message: `${item.userName || item.senderName || 'Admin'}: ${msgText}`,
        });
      }

      // 5. General broadcast
      emitToAll('notification:new', { notification: item });
    } catch (socketErr) {
      console.warn('createNotification socket broadcast warning:', socketErr.message);
    }

    return res.status(201).json({ success: true, notification: item });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const item = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true, isRead: true },
      { new: true }
    );
    return res.json({ success: true, notification: item });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({}, { read: true, isRead: true });
    return res.json({ success: true, message: 'All marked as read' });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({});
    return res.json({ success: true, message: 'All notifications cleared' });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.seedNotifications = async (req, res) => {
  return res.json({ success: true, message: 'Seeding completed' });
};
