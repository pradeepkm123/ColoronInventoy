// backend/services/inventoryNotificationService.js
const Notification = require('../models/Notification');
const Dispatch = require('../models/Dispatch');
const DispatchPendingReminder = require('../models/DispatchPendingReminder');
const { emitToStore, emitToSuperAdmin, emitToAll } = require('../socket');

// Helper to format duration in days, hours, minutes
function formatDuration(ms) {
  if (!ms || ms <= 0) return 'Few seconds';
  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days} Day${days > 1 ? 's' : ''} ${hours} Hour${hours !== 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `${hours} Hour${hours > 1 ? 's' : ''} ${mins} Min${mins !== 1 ? 's' : ''}`;
  }
  return `${mins} Minute${mins !== 1 ? 's' : ''}`;
}

// 1. Notify Store Automatically when Super Admin Dispatches Products
async function notifyStoreOnDispatch(dispatchDoc) {
  if (!dispatchDoc) return;
  try {
    const targetStore = dispatchDoc.storeName || dispatchDoc.customerName || 'Store';
    const snList = Array.isArray(dispatchDoc.barcodes) ? dispatchDoc.barcodes.filter(Boolean) : [];
    const invoiceNo = dispatchDoc.invoiceNumber || 'N/A';
    const model = dispatchDoc.modelNo || 'Product';
    const qty = dispatchDoc.quantity || 1;
    const now = new Date();

    // 1A. Create / Upsert DispatchPendingReminder tracking record
    let reminderRecord = await DispatchPendingReminder.findOne({ dispatchId: dispatchDoc._id });
    if (!reminderRecord) {
      reminderRecord = await DispatchPendingReminder.create({
        dispatchId: dispatchDoc._id,
        invoiceNumber: invoiceNo,
        storeId: targetStore,
        storeName: targetStore,
        modelNo: model,
        quantity: qty,
        barcodes: snList,
        type: 'STOCK_INWARD_PENDING',
        reminderCount: 0,
        firstReminderAt: now,
        lastReminderAt: now,
        nextReminderAt: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
        status: 'ACTION_REQUIRED',
      });
    }

    // 1B. Create Store Notification in Database
    const notif = await Notification.create({
      category: 'DISPATCH',
      type: 'dispatch_to_store',
      senderName: 'Central Warehouse / Super Admin',
      senderRole: 'SUPER_ADMIN',
      recipientName: targetStore,
      recipientRole: 'STORE',
      storeId: targetStore,
      userLocation: targetStore,
      modelNo: model,
      title: `📦 Stock Dispatched: ${model}`,
      actionText: 'Dispatched to your store:',
      targetText: `${qty} units of ${model} have been dispatched to your store.\nInvoice: ${invoiceNo}\nFrom: Central Warehouse\nQuantity: ${qty}\nSerial Numbers: ${snList.length}\nStock Inward is pending.`,
      read: false,
      isRead: false,
      metadata: {
        dispatchId: dispatchDoc._id,
        invoiceNumber: invoiceNo,
        modelNo: model,
        quantity: qty,
        barcodes: snList,
        hasAction: true,
        actionType: 'START_STOCK_INWARD',
        actionLabel: 'Start Stock Inward',
      },
    });

    // 1C. Real-time Live Socket.IO Broadcast to Store A
    emitToStore(targetStore, 'stock_dispatched', {
      notification: notif,
      dispatch: {
        id: dispatchDoc._id,
        invoiceNumber: invoiceNo,
        modelNo: model,
        quantity: qty,
        storeName: targetStore,
        barcodes: snList,
      },
      message: `📦 STOCK DISPATCHED: ${qty} units of ${model} (Invoice: ${invoiceNo}) dispatched to ${targetStore}.`,
    });

    console.log(`📦 [Notification] Dispatched ${qty} of ${model} to ${targetStore} (Invoice ${invoiceNo}). Alert sent.`);
    return notif;
  } catch (err) {
    console.warn('notifyStoreOnDispatch error:', err.message);
  }
}

// 2. Notify Super Admin on Store Inward with S/N Verification & Analysis
async function notifyAdminOnStoreInward({ storeName, dispatchDoc, inwardDoc, scannedBarcodes, completedBy }) {
  try {
    const effectiveStore = storeName || inwardDoc?.storeName || dispatchDoc?.storeName || 'Store';
    const model = inwardDoc?.modelNo || dispatchDoc?.modelNo || 'Product';
    const dispQty = dispatchDoc?.quantity || inwardDoc?.quantity || 1;
    const recQty = inwardDoc?.quantity || scannedBarcodes?.length || dispQty;
    const invoiceNo = inwardDoc?.invoiceNumber || dispatchDoc?.invoiceNumber || 'N/A';
    const userName = completedBy || inwardDoc?.userId || 'Store Staff';
    const now = new Date();

    // Dispatched S/Ns vs Scanned Inwarded S/Ns
    const dispatchedSNs = Array.isArray(dispatchDoc?.barcodes)
      ? dispatchDoc.barcodes.map((s) => String(s).trim()).filter(Boolean)
      : [];
    const inwardedSNs = Array.isArray(scannedBarcodes) && scannedBarcodes.length > 0
      ? scannedBarcodes.map((s) => String(s).trim()).filter(Boolean)
      : Array.isArray(inwardDoc?.scannedBarcode)
        ? inwardDoc.scannedBarcode.map((s) => String(s).trim()).filter(Boolean)
        : [];

    const dispMap = new Map();
    dispatchedSNs.forEach((s) => dispMap.set(s.toLowerCase(), s));

    const inwMap = new Map();
    inwardedSNs.forEach((s) => inwMap.set(s.toLowerCase(), s));

    const matchedSNs = inwardedSNs.filter((s) => dispMap.has(s.toLowerCase()));
    const missingSNs = dispatchedSNs.filter((s) => !inwMap.has(s.toLowerCase()));
    const unexpectedSNs = inwardedSNs.filter((s) => !dispMap.has(s.toLowerCase()));

    const hasDispatchedSNs = dispatchedSNs.length > 0;
    const allMatched = hasDispatchedSNs
      ? missingSNs.length === 0 && unexpectedSNs.length === 0 && matchedSNs.length === dispatchedSNs.length
      : true;

    // 2A. CASE 1: 100% Serial Numbers Match
    if (allMatched) {
      // Find and resolve the active DispatchPendingReminder
      let durationStr = 'Completed on time';
      if (dispatchDoc?._id || invoiceNo) {
        const reminder = await DispatchPendingReminder.findOne({
          $or: [{ dispatchId: dispatchDoc?._id }, { invoiceNumber: invoiceNo }],
        });

        if (reminder) {
          const diffMs = now.getTime() - new Date(reminder.firstReminderAt || reminder.createdAt).getTime();
          durationStr = formatDuration(diffMs);

          reminder.status = 'RESOLVED';
          reminder.resolvedAt = now;
          reminder.completedBy = `${userName} — ${effectiveStore}`;
          reminder.resolutionDuration = durationStr;
          if (inwardDoc?._id) reminder.inwardId = inwardDoc._id;
          await reminder.save();
          console.log(`✅ [Reminder Engine] Dispatch ${invoiceNo} resolved in ${durationStr}. Reminders stopped.`);
        }
      }

      // Create Confirmation for Super Admin
      const adminNotif = await Notification.create({
        category: 'INWARD',
        type: 'stock_inward_completed',
        senderName: `${userName} (${effectiveStore})`,
        senderRole: 'STORE',
        recipientName: 'Super Admin',
        recipientRole: 'SUPER_ADMIN',
        storeId: effectiveStore,
        userLocation: effectiveStore,
        modelNo: model,
        title: `✅ STOCK INWARD COMPLETED: ${effectiveStore}`,
        actionText: 'Stock Inward completed successfully:',
        targetText: `${effectiveStore} has successfully inwarded the dispatched products.\n\nInvoice: ${invoiceNo}\nProduct: ${model}\nDispatched: ${dispQty}\nReceived: ${recQty}\nS/N Match: ${matchedSNs.length} / ${dispatchedSNs.length || recQty}\nVerification: 100% MATCHED\n\nStock Inward completed successfully.\nCompleted By: ${userName} — ${effectiveStore}\nDuration: ${durationStr}`,
        read: false,
        isRead: false,
        metadata: {
          dispatchId: dispatchDoc?._id,
          inwardId: inwardDoc?._id,
          invoiceNumber: invoiceNo,
          modelNo: model,
          dispatchedQty: dispQty,
          receivedQty: recQty,
          matchedCount: matchedSNs.length,
          totalCount: dispatchedSNs.length,
          matchedSNs,
          completedBy: `${userName} — ${effectiveStore}`,
          duration: durationStr,
          hasAction: true,
          actionType: 'VIEW_VERIFICATION',
          actionLabel: 'View Verification',
        },
      });

      // Socket.IO confirmation to Super Admin
      emitToSuperAdmin('inward_completed', {
        notification: adminNotif,
        details: {
          invoiceNumber: invoiceNo,
          storeName: effectiveStore,
          modelNo: model,
          dispatchedQty: dispQty,
          receivedQty: recQty,
          matchedCount: matchedSNs.length,
          verification: '100% MATCHED',
          completedBy: `${userName} — ${effectiveStore}`,
          duration: durationStr,
        },
      });

      // Socket.IO confirmation to Store A
      emitToStore(effectiveStore, 'inward_completed', {
        message: `✅ Stock Inward for ${model} (${recQty} units, Invoice: ${invoiceNo}) confirmed and verified!`,
      });

      return { success: true, allMatched: true };
    }

    // 2B. CASE 2: Serial Numbers Mismatch (Discrepancy)
    // 1. Notify Super Admin of Discrepancy
    const adminMismatchNotif = await Notification.create({
      category: 'INWARD',
      type: 'stock_inward_mismatch',
      senderName: `${userName} (${effectiveStore})`,
      senderRole: 'STORE',
      recipientName: 'Super Admin',
      recipientRole: 'SUPER_ADMIN',
      storeId: effectiveStore,
      userLocation: effectiveStore,
      modelNo: model,
      title: `⚠️ STOCK INWARD S/N MISMATCH: ${effectiveStore}`,
      actionText: 'Discrepancy detected during Stock Inward:',
      targetText: `${effectiveStore} attempted Stock Inward.\n\nInvoice: ${invoiceNo}\nDispatched: ${dispQty}\nScanned: ${recQty}\nMatched: ${matchedSNs.length}\nMissing: ${missingSNs.length}\nUnexpected: ${unexpectedSNs.length}\n\nMissing S/N:\n${missingSNs.join(', ') || 'None'}\n\nUnexpected S/N:\n${unexpectedSNs.join(', ') || 'None'}\n\nStock Inward verification failed.`,
      read: false,
      isRead: false,
      metadata: {
        dispatchId: dispatchDoc?._id,
        invoiceNumber: invoiceNo,
        modelNo: model,
        dispatchedQty: dispQty,
        scannedQty: recQty,
        matchedCount: matchedSNs.length,
        missingCount: missingSNs.length,
        unexpectedCount: unexpectedSNs.length,
        missingSNs,
        unexpectedSNs,
        matchedSNs,
        hasAction: true,
        actionType: 'VIEW_DIFFERENCE',
        actionLabel: 'View Difference',
      },
    });

    // 2. Notify Store A of Mismatch
    const storeMismatchNotif = await Notification.create({
      category: 'INWARD',
      type: 'stock_inward_mismatch_store',
      senderName: 'System Monitor',
      senderRole: 'SYSTEM',
      recipientName: effectiveStore,
      recipientRole: 'STORE',
      storeId: effectiveStore,
      userLocation: effectiveStore,
      modelNo: model,
      title: `⚠️ SERIAL NUMBER MISMATCH: ${model}`,
      actionText: 'Verification failed:',
      targetText: `Stock Inward cannot be completed.\n\n${missingSNs.length} dispatched serial number is missing.\n${unexpectedSNs.length} unexpected serial number was scanned.\n\nPlease verify and rescan the correct products received.`,
      read: false,
      isRead: false,
      metadata: {
        dispatchId: dispatchDoc?._id,
        invoiceNumber: invoiceNo,
        modelNo: model,
        missingSNs,
        unexpectedSNs,
        hasAction: true,
        actionType: 'CORRECT_SERIAL_NUMBERS',
        actionLabel: 'Correct Serial Numbers',
      },
    });

    // Emit live socket discrepancy alert
    emitToSuperAdmin('sn_mismatch', {
      notification: adminMismatchNotif,
      mismatch: {
        invoiceNumber: invoiceNo,
        storeName: effectiveStore,
        modelNo: model,
        dispatchedQty: dispQty,
        scannedQty: recQty,
        matchedCount: matchedSNs.length,
        missingCount: missingSNs.length,
        unexpectedCount: unexpectedSNs.length,
        missingSNs,
        unexpectedSNs,
      },
    });

    emitToStore(effectiveStore, 'sn_mismatch', {
      notification: storeMismatchNotif,
      missingCount: missingSNs.length,
      unexpectedCount: unexpectedSNs.length,
      missingSNs,
      unexpectedSNs,
    });

    console.warn(`⚠️ [S/N Mismatch] Store: ${effectiveStore}, Invoice: ${invoiceNo}, Missing: ${missingSNs.length}, Unexpected: ${unexpectedSNs.length}`);
    return {
      success: false,
      allMatched: false,
      matchedSNs,
      missingSNs,
      unexpectedSNs,
    };
  } catch (err) {
    console.warn('notifyAdminOnStoreInward error:', err.message);
    return { success: false, error: err.message };
  }
}

// 3. Notify Super Admin on Low Stock / Out of Stock from ANY Store
async function notifyAdminOnStockLevel({ modelNo, storeName, currentQuantity, minStockLevel = 5, productName = '' }) {
  try {
    const qty = Number(currentQuantity) || 0;
    const loc = storeName || 'Main Store';
    const isZero = qty === 0;
    const isLow = !isZero && qty <= minStockLevel;

    if (!isZero && !isLow) return;

    const notifType = isZero ? 'out_of_stock' : 'low_stock';
    const title = isZero
      ? `🚨 OUT OF STOCK: ${loc}`
      : `⚠️ LOW STOCK ALERT: ${loc}`;

    const targetText = isZero
      ? `${loc}\n\nProduct: ${productName || modelNo}\nModel: ${modelNo}\nAvailable Stock: 0\n\nImmediate replenishment may be required.`
      : `${loc}\n\nProduct: ${productName || modelNo}\nModel: ${modelNo}\nAvailable Stock: ${qty}\nMinimum Level: ${minStockLevel}\n\n${loc} is running low on this product.`;

    // Debounce check: don't duplicate identical alert within 30 minutes
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recent = await Notification.findOne({
      type: notifType,
      storeId: loc,
      modelNo: modelNo,
      createdAt: { $gte: thirtyMinsAgo },
    });
    if (recent) return;

    const notif = await Notification.create({
      category: 'INVENTORY',
      type: notifType,
      senderName: loc,
      senderRole: 'Store',
      recipientName: 'Super Admin',
      recipientRole: 'SUPER_ADMIN',
      storeId: loc,
      userLocation: loc,
      modelNo: modelNo,
      title,
      actionText: isZero ? 'Out of Stock Alert:' : 'Low Stock Alert:',
      targetText,
      read: false,
      isRead: false,
      metadata: {
        modelNo,
        productName,
        storeName: loc,
        quantity: qty,
        minStockLevel,
        hasAction: true,
        actionType: isZero ? 'DISPATCH_STOCK' : 'CREATE_DISPATCH',
        actionLabel: isZero ? 'Dispatch Stock' : 'Create Dispatch',
      },
    });

    // Real-time live Socket.IO push to Super Admin
    emitToSuperAdmin(isZero ? 'out_of_stock_alert' : 'low_stock_alert', {
      notification: notif,
      storeName: loc,
      modelNo,
      quantity: qty,
      minStockLevel,
    });

    console.log(`🚨 [Stock Alert] ${isZero ? 'Out of stock' : 'Low stock'} alert for ${modelNo} at ${loc} (Qty: ${qty})`);
  } catch (err) {
    console.warn('notifyAdminOnStockLevel error:', err.message);
  }
}

// 4. Pending Inward Reminders (Every 1 Hour) & 4-Day Overdue Escalation to Super Admin
async function checkPendingDispatchesAndNotify() {
  try {
    const now = new Date();

    // Query active reminders that require action
    const activeReminders = await DispatchPendingReminder.find({
      status: { $in: ['ACTION_REQUIRED', 'ESCALATED'] },
    });

    for (const reminder of activeReminders) {
      // Double check if dispatch is already received in Dispatch collection
      const dispatchDoc = await Dispatch.findById(reminder.dispatchId);
      if (dispatchDoc && dispatchDoc.status === 'Received') {
        reminder.status = 'RESOLVED';
        reminder.resolvedAt = dispatchDoc.receivedDate || now;
        await reminder.save();
        console.log(`✅ [Reminder Engine] Inward already received for ${reminder.invoiceNumber}. Stopped.`);
        continue;
      }

      const firstDate = new Date(reminder.firstReminderAt || reminder.createdAt || now);
      const diffMs = now.getTime() - firstDate.getTime();
      const elapsedHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
      const elapsedDays = Math.floor(elapsedHours / 24);

      const targetStore = reminder.storeName || reminder.storeId || 'Store';
      const model = reminder.modelNo || 'Product';
      const qty = reminder.quantity || 1;
      const invoiceNo = reminder.invoiceNumber || 'N/A';

      // 4A: 1-Hour recurring reminder to Store A (stops when >= 96 hours or inward complete)
      const lastSent = new Date(reminder.lastReminderAt || 0);
      const msSinceLastReminder = now.getTime() - lastSent.getTime();

      if (elapsedHours >= 1 && elapsedHours < 96 && msSinceLastReminder >= 50 * 60 * 1000) {
        // Increment single tracking record
        reminder.reminderCount += 1;
        reminder.lastReminderAt = now;
        reminder.nextReminderAt = new Date(now.getTime() + 60 * 60 * 1000);
        await reminder.save();

        // Update or create active pending notification
        const notifTitle = `⏳ STOCK INWARD PENDING (Reminder #${reminder.reminderCount})`;
        const notifBody = `${qty} units from Invoice ${invoiceNo} are still waiting for Stock Inward.\n\nPlease scan the products and Serial Numbers and complete Stock Inward.\n\nPending: ${elapsedHours} Hour${elapsedHours > 1 ? 's' : ''}`;

        // Upsert store notification
        await Notification.findOneAndUpdate(
          {
            type: 'pending_inward_reminder',
            'metadata.dispatchId': reminder.dispatchId,
          },
          {
            category: 'INWARD',
            type: 'pending_inward_reminder',
            senderName: 'Super Admin',
            senderRole: 'SUPER_ADMIN',
            recipientName: targetStore,
            recipientRole: 'STORE',
            storeId: targetStore,
            userLocation: targetStore,
            modelNo: model,
            title: notifTitle,
            actionText: 'Action Required:',
            targetText: notifBody,
            read: false,
            isRead: false,
            createdAt: now,
            metadata: {
              dispatchId: reminder.dispatchId,
              invoiceNumber: invoiceNo,
              modelNo: model,
              quantity: qty,
              reminderCount: reminder.reminderCount,
              elapsedHours,
              hasAction: true,
              actionType: 'START_STOCK_INWARD',
              actionLabel: 'Complete Stock Inward',
            },
          },
          { upsert: true, new: true }
        );

        // Push real-time Socket.IO hourly toast to Store A
        emitToStore(targetStore, 'hourly_reminder', {
          invoiceNumber: invoiceNo,
          modelNo: model,
          quantity: qty,
          reminderCount: reminder.reminderCount,
          elapsedHours,
          message: `⏳ STOCK INWARD PENDING (Reminder #${reminder.reminderCount}): Invoice ${invoiceNo} pending for ${elapsedHours} hours.`,
        });

        console.log(`⏳ [Reminder #${reminder.reminderCount}] Sent to ${targetStore} for Invoice ${invoiceNo} (${elapsedHours}h pending)`);
      }

      // 4B: Fourth Day (>= 96 Hours) -> Super Admin Escalation + Store A Urgent Overdue Alert
      if (elapsedHours >= 96 && !reminder.escalatedToAdmin) {
        reminder.status = 'ESCALATED';
        reminder.escalatedToAdmin = true;
        reminder.escalatedAt = now;
        await reminder.save();

        const dispatchDateStr = firstDate.toLocaleDateString([], {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        // 1. Alert Super Admin
        const adminEscalationNotif = await Notification.create({
          category: 'DISPATCH',
          type: 'dispatch_overdue_alert',
          senderName: 'System Monitor',
          senderRole: 'SYSTEM',
          recipientName: 'Super Admin',
          recipientRole: 'SUPER_ADMIN',
          storeId: 'Main Store',
          userLocation: targetStore,
          modelNo: model,
          title: `🚨 4-DAY STOCK INWARD OVERDUE: ${targetStore}`,
          actionText: '4-Day Overdue Escalation:',
          targetText: `${targetStore} has NOT completed Stock Inward for a dispatch sent 4 days ago.\n\nInvoice: ${invoiceNo}\nProduct: ${model}\nQuantity: ${qty}\n\nDispatch Date: ${dispatchDateStr}\nCurrent Status: Stock Inward Pending\nStore reminders sent: ${reminder.reminderCount || 96}\n\nImmediate follow-up is required.`,
          read: false,
          isRead: false,
          metadata: {
            dispatchId: reminder.dispatchId,
            invoiceNumber: invoiceNo,
            modelNo: model,
            quantity: qty,
            storeName: targetStore,
            remindersSent: reminder.reminderCount || 96,
            elapsedDays,
            hasAction: true,
            actionType: 'VIEW_DISPATCH',
            actionLabel: 'View Dispatch',
          },
        });

        // 2. Alert Store A with Urgent Overdue Notice
        const storeOverdueNotif = await Notification.create({
          category: 'INWARD',
          type: 'dispatch_overdue_store_alert',
          senderName: 'Super Admin',
          senderRole: 'SUPER_ADMIN',
          recipientName: targetStore,
          recipientRole: 'STORE',
          storeId: targetStore,
          userLocation: targetStore,
          modelNo: model,
          title: `🚨 URGENT — STOCK INWARD OVERDUE: ${model}`,
          actionText: 'Escalated to Super Admin:',
          targetText: `Invoice ${invoiceNo} has remained pending for 4 days.\n\nThis delay has now been escalated to Super Admin.\n\nPlease complete Stock Inward immediately.`,
          read: false,
          isRead: false,
          metadata: {
            dispatchId: reminder.dispatchId,
            invoiceNumber: invoiceNo,
            modelNo: model,
            quantity: qty,
            hasAction: true,
            actionType: 'START_STOCK_INWARD',
            actionLabel: 'Start Stock Inward',
          },
        });

        // Live Socket.IO Escalations
        emitToSuperAdmin('dispatch_overdue_alert', {
          notification: adminEscalationNotif,
          storeName: targetStore,
          invoiceNumber: invoiceNo,
          modelNo: model,
          quantity: qty,
          remindersSent: reminder.reminderCount,
          elapsedDays,
        });

        emitToStore(targetStore, 'dispatch_overdue_store_alert', {
          notification: storeOverdueNotif,
          invoiceNumber: invoiceNo,
          modelNo: model,
        });

        console.log(`🚨 [4-Day Escalation] Dispatched ${invoiceNo} for ${targetStore} escalated to Super Admin!`);
      }
    }
  } catch (err) {
    console.warn('checkPendingDispatchesAndNotify error:', err.message);
  }
}

// 5. Periodic Scheduler
function startDispatchScheduler() {
  // Check pending dispatches every 5 minutes
  setInterval(() => {
    checkPendingDispatchesAndNotify();
  }, 5 * 60 * 1000);

  // Initial check on boot after 10 seconds
  setTimeout(() => {
    checkPendingDispatchesAndNotify();
  }, 10000);
}

module.exports = {
  notifyStoreOnDispatch,
  notifyAdminOnStoreInward,
  notifyAdminOnStockLevel,
  checkPendingDispatchesAndNotify,
  startDispatchScheduler,
};
