const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');

// GET /api/notifications
router.get('/', ctrl.getNotifications);

// POST /api/notifications
router.post('/', ctrl.createNotification);

// PATCH /api/notifications/mark-all-read
router.patch('/mark-all-read', ctrl.markAllAsRead);

// POST /api/notifications/seed (reset / sync with users)
router.post('/seed', ctrl.seedNotifications);

// DELETE /api/notifications/clear-all
router.delete('/clear-all', ctrl.clearAllNotifications);

// PATCH & PUT /api/notifications/:id/read
router.patch('/:id/read', ctrl.markAsRead);
router.put('/:id/read', ctrl.markAsRead);

// DELETE /api/notifications/:id
router.delete('/:id', ctrl.deleteNotification);

module.exports = router;
