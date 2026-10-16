// my-app/src/services/socketService.js
import { io } from 'socket.io-client';

let socket = null;
let isConnected = false;

const SOCKET_URL =
  typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5002'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5002').replace(/\/api$/, '');

/**
 * Initialize socket connection for current logged in user
 */
export const initSocketClient = (user, onNotificationReceived = null) => {
  if (socket && isConnected) {
    // Re-join rooms if user changed
    if (user) {
      socket.emit('join_room', {
        role: user.role || 'Staff',
        storeLocation:
          user.warehouseName ||
          user.serviceCenter ||
          user.staffLocation ||
          user.customerStore ||
          user.assignedLocation ||
          user.location ||
          '',
        userId: user._id || user.id,
        name: user.name || 'User',
      });
    }
    return socket;
  }

  try {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      isConnected = true;
      console.log(`🔌 [Socket.IO Client] Connected to server: ${socket.id}`);

      if (user) {
        socket.emit('join_room', {
          role: user.role || 'Staff',
          storeLocation:
            user.warehouseName ||
            user.serviceCenter ||
            user.staffLocation ||
            user.customerStore ||
            user.assignedLocation ||
            user.location ||
            '',
          userId: user._id || user.id,
          name: user.name || 'User',
        });
      }
    });

    socket.on('disconnect', () => {
      isConnected = false;
      console.log('🔌 [Socket.IO Client] Disconnected from server');
    });

    // Helper to dispatch global notification event
    const dispatchSync = (data, customEventName = 'app_notifications_synced') => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(customEventName, {
            detail: data,
          })
        );
        window.dispatchEvent(new CustomEvent('app_stock_alert_updated'));
      }
      if (typeof onNotificationReceived === 'function') {
        onNotificationReceived(data);
      }
    };

    // 1. Stock Dispatched (Store A receives live notification)
    socket.on('stock_dispatched', (data) => {
      console.log('📦 [Socket] Stock Dispatched event received:', data);
      dispatchSync({
        type: 'stock_dispatched',
        message: data.message || `New stock dispatched: ${data.dispatch?.modelNo}`,
        ...data,
      });
    });

    // 2. Stock Inward Completed (Super Admin confirmation)
    socket.on('inward_completed', (data) => {
      console.log('✅ [Socket] Stock Inward Completed event received:', data);
      dispatchSync({
        type: 'inward_completed',
        message: `✅ Stock Inward Completed for ${data.details?.storeName || 'Store'} (Invoice: ${data.details?.invoiceNumber})`,
        ...data,
      });
    });

    // 3. Serial Number Mismatch
    socket.on('sn_mismatch', (data) => {
      console.log('⚠️ [Socket] S/N Mismatch event received:', data);
      dispatchSync({
        type: 'sn_mismatch',
        message: `⚠️ S/N Mismatch detected for ${data.mismatch?.storeName || 'Store'} (Invoice: ${data.mismatch?.invoiceNumber})`,
        ...data,
      });
    });

    // 4. Hourly Reminder (Store A pending inward)
    socket.on('hourly_reminder', (data) => {
      console.log('⏳ [Socket] Hourly reminder event received:', data);
      dispatchSync({
        type: 'hourly_reminder',
        message: data.message || `Pending Stock Inward Reminder #${data.reminderCount}`,
        ...data,
      });
    });

    // 5. 4-Day Overdue Escalation (Super Admin)
    socket.on('dispatch_overdue_alert', (data) => {
      console.log('🚨 [Socket] 4-Day Overdue alert received:', data);
      dispatchSync({
        type: 'dispatch_overdue_alert',
        message: `🚨 4-Day Stock Inward Overdue for ${data.storeName} (Invoice: ${data.invoiceNumber})`,
        ...data,
      });
    });

    // 6. Low Stock & Out of Stock Alerts (Super Admin)
    socket.on('low_stock_alert', (data) => {
      console.log('⚠️ [Socket] Low Stock Alert received:', data);
      dispatchSync({
        type: 'low_stock',
        message: `⚠️ Low Stock Alert: ${data.modelNo} at ${data.storeName} (${data.quantity} units left)`,
        ...data,
      });
    });

    socket.on('out_of_stock_alert', (data) => {
      console.log('🚨 [Socket] Out of Stock Alert received:', data);
      dispatchSync({
        type: 'out_of_stock',
        message: `🚨 Out of Stock: ${data.modelNo} at ${data.storeName}!`,
        ...data,
      });
    });

    // 7. Service Person Login Alert
    socket.on('service_person_login', (data) => {
      console.log('👨‍🔧 [Socket] Service Person Login alert received:', data);
      dispatchSync({
        type: 'service_person_login',
        message: `👨‍🔧 Service Person ${data.name} logged in from ${data.storeLocation || 'Service Center'}`,
        ...data,
      });
    });

    // 8. Service Request Created
    socket.on('service_request_created', (data) => {
      console.log('🔧 [Socket] Service Request Created alert received:', data);
      dispatchSync({
        type: 'service_request_created',
        message: `🔧 Service Request ${data.ticketNo} created at ${data.storeName}`,
        ...data,
      });
    });

    // 9. Spare Part Issued
    socket.on('spare_issued', (data) => {
      console.log('🔩 [Socket] Spare Issued alert received:', data);
      dispatchSync({
        type: 'spare_issued',
        message: `🔩 Spare ${data.spareName} issued by ${data.tech}`,
        ...data,
      });
    });

    // 10. Service Completed
    socket.on('service_completed', (data) => {
      console.log('✅ [Socket] Service Completed alert received:', data);
      dispatchSync({
        type: 'service_completed',
        message: `✅ Service Completed for ${data.rmaNo}`,
        ...data,
      });
    });

    // 11. QC Failed Alert
    socket.on('qc_failed_alert', (data) => {
      console.log('🚨 [Socket] QC Failed alert received:', data);
      dispatchSync({
        type: 'qc_failed',
        message: `🚨 QC Failed for RMA #${data.rmaNo}!`,
        ...data,
      });
    });

    // 12. Service Assigned (Service Person receives real-time allocation)
    socket.on('service_assigned', (data) => {
      console.log('📋 [Socket] Service Assigned alert received:', data);
      dispatchSync({
        type: 'service_assigned',
        message: data.message || `📋 RMA #${data.rmaNo} allocated for service!`,
        ...data,
      });
    });

    // 13. Service Stage Updated (Store, Service Person & Super Admin instant stage updates)
    socket.on('service_stage_updated', (data) => {
      console.log('🔔 [Socket] Service Stage Updated alert received:', data);
      dispatchSync({
        type: 'service_stage_updated',
        message: data.message || `🔔 Service RMA #${data.rmaNo}: ${data.stage || 'Updated'}`,
        ...data,
      });
    });

    // 14. Targeted Notification Received
    socket.on('notification_received', (data) => {
      console.log('🔔 [Socket] Notification received:', data);
      dispatchSync({
        type: 'notification_received',
        message: data.message || data.notification?.title || 'New notification',
        ...data,
      });
    });

    // 15. Fallback broadcast listener
    socket.on('notification:new', (data) => {
      dispatchSync({
        type: 'notification_new',
        ...data,
      });
    });

    return socket;
  } catch (err) {
    console.warn('Socket client initialization error:', err);
    return null;
  }
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
  }
};
