// my-app/src/services/notificationService.js
// Centralized notification and internal message sync service

// Persistent Baseline Start Date Helper (Starts from today, persists tomorrow and future days)
export const getNotificationStartDate = () => {
  const STORAGE_KEY = 'app_notification_start_date';
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = new Date(stored);
      if (!isNaN(parsed.getTime()) && parsed <= thirtyDaysAgo) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading notification start date:', e);
  }

  try {
    localStorage.setItem(STORAGE_KEY, thirtyDaysAgo.toISOString());
  } catch (e) {
    console.warn('Error setting notification start date:', e);
  }
  return thirtyDaysAgo;
};

// Formatter for Relative & Exact Timestamp across Today, Yesterday, and Previous Days
export const formatNotificationTime = (dateInput) => {
  if (!dateInput) return 'Just Now';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Just Now';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
  const diffMins = Math.floor(diffSecs / 60);

  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    if (diffMins < 1) {
      return `Just Now • ${timeStr}`;
    } else if (diffMins < 60) {
      return `${diffMins}m ago • ${timeStr}`;
    }
    return `Today at ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  }

  const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  return `${dateStr} at ${timeStr}`;
};

const API_BASE = 'https://coloroninventoy.onrender.com/api';

/**
 * Strict role and account matcher.
 * Matches notification to the given user or account.
 */
export const matchesNotificationToUser = (n, user) => {
  if (!n || !user) return false;

  const roleLower = (user.role || '').toLowerCase().trim();
  const nameLower = (user.name || '').toLowerCase().trim();
  const locLower = (
    user.warehouseName ||
    user.assignedLocation ||
    user.location ||
    user.customerStore ||
    user.serviceCenter ||
    user.staffLocation ||
    ''
  ).toLowerCase().trim();
  const myUserId = user._id || user.id ? String(user._id || user.id) : '';

  const nStore = (n.storeId || n.userLocation || n.location || '').toLowerCase().trim();
  const nUser = (n.userName || n.user || '').toLowerCase().trim();
  const nSender = (n.senderName || '').toLowerCase().trim();
  const nRecipient = (n.recipientName || '').toLowerCase().trim();
  const nRecipientRole = (n.recipientRole || '').toLowerCase().trim();
  const nTarget = (n.targetText || '').toLowerCase().trim();
  const nTitle = (n.title || '').toLowerCase().trim();
  const nUserId = n.userId ? String(n.userId) : '';
  const nSenderId = n.senderId ? String(n.senderId) : '';
  const nRecipientId = n.recipientId ? String(n.recipientId) : '';

  // 1. Direct User ID or Sender / Recipient ID match
  if (myUserId && (nUserId === myUserId || nSenderId === myUserId || nRecipientId === myUserId)) {
    return true;
  }

  // Helper to detect if a notification specifically belongs to another known store/branch
  const isOtherBranch = (text) => {
    const s = (text || '').toLowerCase();
    return (
      s.includes('avadi') ||
      s.includes('cctv shoppee') ||
      s.includes('jaipur') ||
      s.includes('chennai') ||
      s.includes('walajapet') ||
      s.includes('fd') ||
      s.includes('porur')
    );
  };

  const isLookmanHo =
    nameLower.includes('lookman ho') ||
    roleLower.includes('admin') ||
    nameLower === 'super admin';

  // 2. Lookman HO (Super Admin • Main Store / Central HQ)
  if (isLookmanHo) {
    // 2A. Super Admin receives ALL Low Stock & Out of Stock alerts across ANY branch store / warehouse!
    if (
      n.type === 'low_stock' ||
      n.type === 'out_of_stock' ||
      nTitle.includes('out of stock') ||
      nTitle.includes('low stock alert') ||
      (n.category === 'INVENTORY' && (nTarget.includes('out of stock') || nTarget.includes('low stock')))
    ) {
      return true;
    }

    // 2B. Super Admin receives Store Inward S/N Verification & Discrepancy notifications from ANY store!
    if (
      n.type === 'inward_sn_verified' ||
      n.type === 'stock_inward_completed' ||
      n.type === 'stock_inward_mismatch' ||
      nTitle.includes('s/n verified') ||
      nTitle.includes('s/n discrepancy') ||
      nTitle.includes('stock inward s/n') ||
      nTitle.includes('stock inward completed') ||
      (n.actionText && n.actionText.toLowerCase().includes('verified stock inward with s/n'))
    ) {
      return true;
    }

    // 2C. Super Admin receives 4-Day Overdue Inward Alerts for ANY store!
    if (
      n.type === 'dispatch_overdue_alert' ||
      nTitle.includes('overdue inward') ||
      nTitle.includes('overdue dispatch') ||
      nTitle.includes('4+ days')
    ) {
      return true;
    }

    // Direct communication with Super Admin or Lookman HO
    if (
      nSender.includes('lookman ho') ||
      nRecipient.includes('lookman ho') ||
      nSender.includes('super admin') ||
      nRecipient.includes('super admin') ||
      nRecipientRole.includes('super_admin') ||
      nRecipientRole.includes('admin') ||
      nRecipientRole === 'all' ||
      nSenderId === 'admin' ||
      nRecipientId === 'admin' ||
      n.type === 'carton_packed' ||
      nTitle.includes('carton box')
    ) {
      return true;
    }

    // Must NOT show notifications that explicitly belong to other branch stores
    if (isOtherBranch(nStore) || isOtherBranch(nTarget) || isOtherBranch(nTitle)) {
      return false;
    }

    // Main Store / Central HQ / Lookman HO inventory, catalog products, central spares and accessories
    if (
      nStore.includes('main store') ||
      nStore.includes('lookman ho') ||
      nStore.includes('central') ||
      nStore.includes('head office') ||
      nStore.includes('ho') ||
      nUser.includes('lookman ho') ||
      nTarget.includes('main store') ||
      nTitle.includes('main store') ||
      n.category === 'ACCESSORIES' ||
      n.category === 'SPARES' ||
      nStore === '' ||
      nStore === 'store'
    ) {
      return true;
    }

    return false;
  }

  // 3. cctv shop (CCTV Shoppee Avadi / Lookman CCTV Avadi)
  const isAvadi =
    nameLower.includes('cctv shop') ||
    roleLower.includes('avadi') ||
    locLower.includes('avadi') ||
    nameLower.includes('avadi');

  if (isAvadi) {
    return (
      nStore.includes('avadi') ||
      nStore.includes('cctv shoppee') ||
      nUser.includes('avadi') ||
      nTarget.includes('avadi') ||
      nTitle.includes('avadi') ||
      nSender.includes('avadi') ||
      nRecipient.includes('avadi') ||
      nRecipient.includes('cctv shop')
    );
  }

  // 4. ATUL SHARMA (Warehouse • JAIPUR)
  const isJaipur =
    nameLower.includes('atul') ||
    locLower.includes('jaipur') ||
    roleLower.includes('jaipur');

  if (isJaipur) {
    return (
      nStore.includes('jaipur') ||
      nUser.includes('jaipur') ||
      nTarget.includes('jaipur') ||
      nTitle.includes('jaipur') ||
      nSender.includes('atul') ||
      nRecipient.includes('atul') ||
      nUser.includes('atul')
    );
  }

  // 5. pradeep (Staff • FD)
  const isFd =
    nameLower.includes('pradeep') ||
    locLower.includes('fd') ||
    roleLower.includes('fd');

  if (isFd) {
    return (
      nStore.includes('fd') ||
      nTarget.includes('fd') ||
      nTitle.includes('fd') ||
      nUser.includes('pradeep') ||
      nSender.includes('pradeep') ||
      nRecipient.includes('pradeep')
    );
  }

  // 6. Dinesh (Service Person • Chennai)
  const isDinesh =
    nameLower.includes('dinesh') ||
    (locLower.includes('chennai') && roleLower.includes('service'));

  if (isDinesh) {
    if (nUser.includes('dinesh') || nSender.includes('dinesh') || nRecipient.includes('dinesh')) return true;
    if (
      (n.category === 'SPARES' || n.category === 'SERVICE' || (n.type || '').includes('spare') || (n.type || '').includes('service')) &&
      (nStore.includes('chennai') || nTarget.includes('chennai') || nStore === '')
    ) {
      return true;
    }
    return false;
  }

  // 7. Ben (Service Person • Walajapet)
  const isBen =
    nameLower.includes('ben') ||
    (locLower.includes('walajapet') && roleLower.includes('service'));

  if (isBen) {
    if (nUser.includes('ben') || nSender.includes('ben') || nRecipient.includes('ben')) return true;
    if (
      (n.category === 'SPARES' || n.category === 'SERVICE' || (n.type || '').includes('spare') || (n.type || '').includes('service')) &&
      (nStore.includes('walajapet') || nTarget.includes('walajapet'))
    ) {
      return true;
    }
    return false;
  }

  // 8. General token-based fallback for other accounts
  const genericWords = new Set(['store', 'stores', 'warehouse', 'warehouses', 'staff', 'user', 'admin', 'super admin', 'manager']);
  const tokens = [];
  if (nameLower) tokens.push(nameLower);
  if (locLower) tokens.push(locLower);
  if (roleLower && !genericWords.has(roleLower)) tokens.push(roleLower);
  if (user.email) tokens.push(user.email.toLowerCase().trim());

  const uniqueTokens = Array.from(new Set(tokens.filter((t) => t && !genericWords.has(t))));

  for (const tok of uniqueTokens) {
    if (!tok) continue;
    if (nStore && (nStore === tok || nStore.includes(tok) || tok.includes(nStore))) return true;
    if (nUser && (nUser === tok || nUser.includes(tok) || tok.includes(nUser))) return true;
    if (nSender && (nSender === tok || nSender.includes(tok) || tok.includes(nSender))) return true;
    if (nRecipient && (nRecipient === tok || nRecipient.includes(tok) || tok.includes(nRecipient))) return true;
    if (nTarget && nTarget.includes(tok)) return true;
    if (nTitle && nTitle.includes(tok)) return true;
  }

  return false;
};

/**
 * Live fetch of all notifications from backend resources + local notes.
 * Updates localStorage cache and broadcasts synchronization event.
 */
export const fetchLiveNotifications = async () => {
  try {
    let token = null;
    try {
      token = localStorage.getItem('token') || localStorage.getItem('authToken');
    } catch {}

    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const [uRes, invRes, prodRes, spareRes, inwRes, dispRes, accRes, notifDbRes] = await Promise.allSettled([
      fetch(`${API_BASE}/users`, { headers }),
      fetch(`${API_BASE}/inventory`, { headers }),
      fetch(`${API_BASE}/products`, { headers }),
      fetch(`${API_BASE}/spare-parts`, { headers }),
      fetch(`${API_BASE}/store-inward`, { headers }),
      fetch(`${API_BASE}/dispatch`, { headers }),
      fetch(`${API_BASE}/accessories`, { headers }),
      fetch(`${API_BASE}/notifications`, { headers }),
    ]);

    const notifStartDate = getNotificationStartDate();
    const generatedNotifs = [];

    // 1. Inventory Stock Alerts (Store-wide: Super Admin & Branch Stores)
    if (invRes.status === 'fulfilled' && invRes.value.ok) {
      try {
        const invList = await invRes.value.json();
        if (Array.isArray(invList)) {
          invList.forEach((inv) => {
            const rawDate = inv.updatedAt || inv.createdAt;
            if (!rawDate) return;
            const itemDate = new Date(rawDate);
            if (isNaN(itemDate.getTime()) || itemDate < notifStartDate) return;

            const qty = Number(inv.quantity !== undefined ? inv.quantity : (inv.currentStock || 0));
            const minStock = Number(inv.minStockLevel || inv.minStock || 5);
            const model = inv.modelNo || inv.model || inv.productName || 'Product';
            const brand = inv.brand || 'Product';
            const loc = inv.location || inv.warehouse || 'Main Store';

            if (qty === 0) {
              generatedNotifs.push({
                _id: `out_stock_${inv._id || model}_${loc}`,
                id: `out_stock_${inv._id || model}_${loc}`,
                category: 'INVENTORY',
                type: 'out_of_stock',
                userName: loc,
                userRole: 'Store',
                userLocation: loc,
                storeId: loc,
                title: `🚨 [${loc}] Out of Stock: ${model}`,
                actionText: 'Stock Alert:',
                targetText: `${model} (${brand}) at ${loc} is completely Out of Stock (0 units remaining). Restock required.`,
                createdAt: itemDate.toISOString(),
                timestamp: formatNotificationTime(itemDate),
                read: false,
                isRead: false,
              });
            } else if (qty <= minStock) {
              generatedNotifs.push({
                _id: `low_stock_${inv._id || model}_${loc}`,
                id: `low_stock_${inv._id || model}_${loc}`,
                category: 'INVENTORY',
                type: 'low_stock',
                userName: loc,
                userRole: 'Store',
                userLocation: loc,
                storeId: loc,
                title: `⚠️ [${loc}] Low Stock Alert: ${model}`,
                actionText: 'Low Stock Alert:',
                targetText: `${model} (${brand}) at ${loc} has only ${qty} units remaining (Min Level: ${minStock}).`,
                createdAt: itemDate.toISOString(),
                timestamp: formatNotificationTime(itemDate),
                read: false,
                isRead: false,
              });
            }
          });
        }
      } catch (e) {
        console.warn('Error parsing inventory for notifications:', e);
      }
    }

    // 2. Products Catalog Alerts
    if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
      try {
        const prodList = await prodRes.value.json();
        if (Array.isArray(prodList)) {
          prodList.forEach((prod) => {
            const rawDate = prod.updatedAt || prod.createdAt;
            if (!rawDate) return;
            const itemDate = new Date(rawDate);
            if (isNaN(itemDate.getTime()) || itemDate < notifStartDate) return;

            const qty = Number(prod.reorderLevel !== undefined ? prod.reorderLevel : (prod.quantity !== undefined ? prod.quantity : 0));
            const model = prod.model || prod.modelNo || prod.productName || 'Product';
            const brand = prod.brand || 'Product';
            const loc = 'Main Store';
            const isZero = qty === 0 || prod.stockStatus === 'Out of Stock';
            const isLow = !isZero && (qty <= 5 || prod.stockStatus === 'Low Stock');

            if (isZero) {
              generatedNotifs.push({
                _id: `prod_out_stock_${prod._id}`,
                id: `prod_out_stock_${prod._id}`,
                category: 'INVENTORY',
                type: 'out_of_stock',
                userName: loc,
                userRole: 'Super Admin',
                userLocation: loc,
                storeId: loc,
                title: `🚨 Out of Stock: ${model}`,
                actionText: 'Stock Alert:',
                targetText: `${model} (${brand}) is completely Out of Stock (0 units remaining).`,
                createdAt: itemDate.toISOString(),
                timestamp: formatNotificationTime(itemDate),
                read: false,
                isRead: false,
              });
            } else if (isLow) {
              generatedNotifs.push({
                _id: `prod_low_stock_${prod._id}`,
                id: `prod_low_stock_${prod._id}`,
                category: 'INVENTORY',
                type: 'low_stock',
                userName: loc,
                userRole: 'Super Admin',
                userLocation: loc,
                storeId: loc,
                title: `⚠️ Low Stock Alert: ${model}`,
                actionText: 'Low Stock Alert:',
                targetText: `${model} (${brand}) has only ${qty} units remaining (Min Level: 5).`,
                createdAt: itemDate.toISOString(),
                timestamp: formatNotificationTime(itemDate),
                read: false,
                isRead: false,
              });
            }
          });
        }
      } catch (e) {
        console.warn('Error parsing products for notifications:', e);
      }
    }

    // 3. Spares Alerts
    if (spareRes.status === 'fulfilled' && spareRes.value.ok) {
      try {
        const spareResult = await spareRes.value.json();
        const spareList = Array.isArray(spareResult.data) ? spareResult.data : (Array.isArray(spareResult) ? spareResult : []);
        spareList.forEach((sp) => {
          const rawDate = sp.updatedAt || sp.createdAt || sp.createdDate;
          if (!rawDate) return;
          const itemDate = new Date(rawDate);
          if (isNaN(itemDate.getTime())) return;

          const avail = Number(sp.availableStock !== undefined ? sp.availableStock : (sp.available !== undefined ? sp.available : sp.totalStock || 0));
          const minStock = Number(sp.minimumStock || 5);
          const name = sp.name || 'Spare Part';
          const code = sp.code || sp.partNumber || '';
          const effectiveDate = itemDate < notifStartDate ? notifStartDate : itemDate;

          if (avail === 0) {
            generatedNotifs.push({
              _id: `spare_out_${sp._id}`,
              id: `spare_out_${sp._id}`,
              category: 'SPARES',
              type: 'spare_low_stock',
              userName: 'Lookman HO',
              userRole: 'Super Admin',
              userLocation: 'Main Store',
              storeId: 'Main Store',
              title: `🚨 Spare Part Out of Stock: ${name}`,
              actionText: 'Spare Out of Stock:',
              targetText: `Spare part "${name}" ${code ? `[${code}]` : ''} is completely Out of Stock (0 units remaining).`,
              createdAt: effectiveDate.toISOString(),
              timestamp: formatNotificationTime(effectiveDate),
              read: false,
              isRead: false,
            });
          } else if (avail <= minStock) {
            generatedNotifs.push({
              _id: `spare_low_${sp._id}`,
              id: `spare_low_${sp._id}`,
              category: 'SPARES',
              type: 'spare_low_stock',
              userName: 'Lookman HO',
              userRole: 'Super Admin',
              userLocation: 'Main Store',
              storeId: 'Main Store',
              title: `⚙️ Spare Part Low Stock: ${name}`,
              actionText: 'Low Spare Stock:',
              targetText: `Spare part "${name}" ${code ? `[${code}]` : ''} has only ${avail} units remaining (Min threshold: ${minStock}).`,
              createdAt: effectiveDate.toISOString(),
              timestamp: formatNotificationTime(effectiveDate),
              read: false,
              isRead: false,
            });
          }
        });
      } catch (e) {
        console.warn('Error parsing spares for notifications:', e);
      }
    }

    // 4. Accessories Alerts
    if (accRes && accRes.status === 'fulfilled' && accRes.value.ok) {
      try {
        const accList = await accRes.value.json();
        if (Array.isArray(accList)) {
          accList.forEach((acc) => {
            const rawDate = acc.updatedAt || acc.createdOn || acc.createdAt;
            if (!rawDate) return;
            const itemDate = new Date(rawDate);
            if (isNaN(itemDate.getTime())) return;

            const stock = Number(acc.stock !== undefined ? acc.stock : (acc.quantity || 0));
            const minStock = Number(acc.minStock || 5);
            const name = acc.name || 'Accessory';
            const sku = acc.sku || '';
            const category = acc.category || 'Accessories';
            const effectiveDate = itemDate < notifStartDate ? notifStartDate : itemDate;

            if (stock === 0) {
              generatedNotifs.push({
                _id: `acc_out_${acc._id}`,
                id: `acc_out_${acc._id}`,
                category: 'ACCESSORIES',
                type: 'accessory_out_of_stock',
                userName: 'Lookman HO',
                userRole: 'Super Admin',
                userLocation: 'Main Store',
                storeId: 'Main Store',
                title: `🚨 Accessory Out of Stock: ${name}`,
                actionText: 'Accessory Out of Stock:',
                targetText: `Accessory "${name}" ${sku ? `[${sku}]` : ''} (${category}) is completely Out of Stock (0 units remaining).`,
                createdAt: effectiveDate.toISOString(),
                timestamp: formatNotificationTime(effectiveDate),
                read: false,
                isRead: false,
              });
            } else if (stock <= minStock) {
              generatedNotifs.push({
                _id: `acc_low_${acc._id}`,
                id: `acc_low_${acc._id}`,
                category: 'ACCESSORIES',
                type: 'accessory_low_stock',
                userName: 'Lookman HO',
                userRole: 'Super Admin',
                userLocation: 'Main Store',
                storeId: 'Main Store',
                title: `🎧 Accessory Low Stock: ${name}`,
                actionText: 'Low Accessory Stock:',
                targetText: `Accessory "${name}" ${sku ? `[${sku}]` : ''} (${category}) has only ${stock} units remaining (Min Level: ${minStock}).`,
                createdAt: effectiveDate.toISOString(),
                timestamp: formatNotificationTime(effectiveDate),
                read: false,
                isRead: false,
              });
            }
          });
        }
      } catch (e) {
        console.warn('Error parsing accessories for notifications:', e);
      }
    }

    // 5. Live Dispatches & Store Inwards (Automated S/N Verification & Overdue Analysis)
    let inwList = [];
    let dispList = [];

    if (inwRes.status === 'fulfilled' && inwRes.value.ok) {
      try {
        const parsedInw = await inwRes.value.json();
        inwList = Array.isArray(parsedInw) ? parsedInw : (Array.isArray(parsedInw?.data) ? parsedInw.data : []);
      } catch (e) {
        console.warn('Error parsing store inward for notifications:', e);
      }
    }

    if (dispRes.status === 'fulfilled' && dispRes.value.ok) {
      try {
        const parsedDisp = await dispRes.value.json();
        dispList = Array.isArray(parsedDisp) ? parsedDisp : (Array.isArray(parsedDisp?.data) ? parsedDisp.data : []);
      } catch (e) {
        console.warn('Error parsing dispatches for notifications:', e);
      }
    }

    const now = new Date();

    // 5A. Process Dispatches (Automated Dispatch -> Store A with S/N, 1-Hr Reminders, 4-Day Escalations)
    dispList.forEach((disp) => {
      const rawDate = disp.dispatchDate || disp.createdAt || disp.updatedAt;
      if (!rawDate) return;
      const dispDate = new Date(rawDate);
      if (isNaN(dispDate.getTime()) || dispDate < notifStartDate) return;

      const model = disp.modelNo || 'Product';
      const dest = disp.storeName || disp.customerName || 'Store';
      const invoiceNo = disp.invoiceNumber || 'N/A';
      const qty = disp.quantity || 1;
      const dispSNs = Array.isArray(disp.barcodes) ? disp.barcodes.filter(Boolean) : [];
      const snSummary = dispSNs.length > 0 ? ` (S/N: ${dispSNs.join(', ')})` : '';

      // 1. Dispatch Notification to Destination Store
      generatedNotifs.push({
        _id: `dispatch_${disp._id}`,
        id: `dispatch_${disp._id}`,
        category: 'DISPATCH',
        type: 'dispatch',
        userName: 'Super Admin',
        userRole: 'Super Admin',
        userLocation: disp.warehouseName || 'Central Warehouse',
        storeId: dest,
        title: `📦 Stock Dispatched to ${dest}: ${model}`,
        actionText: 'Dispatched to store:',
        targetText: `Dispatched ${qty} units of ${model} (Invoice #${invoiceNo}) to ${dest}${snSummary}. Please verify S/N and complete Stock Inward upon arrival.`,
        createdAt: dispDate.toISOString(),
        timestamp: formatNotificationTime(dispDate),
        read: false,
        isRead: false,
      });

      // Check if this dispatch has been received / inwarded
      const isReceived =
        disp.status === 'Received' ||
        inwList.some(
          (inw) =>
            (inw.invoiceNumber && inw.invoiceNumber === invoiceNo) ||
            (inw.dispatchId && String(inw.dispatchId) === String(disp._id)) ||
            (inw.modelNo === model && inw.storeName === dest)
        );

      if (!isReceived) {
        const diffMs = now.getTime() - dispDate.getTime();
        const elapsedHours = Math.floor(diffMs / (1000 * 60 * 60));
        const elapsedDays = Math.floor(elapsedHours / 24);

        // 2. Intimation to Store A (hourly reminder while pending)
        if (elapsedHours >= 1) {
          generatedNotifs.push({
            _id: `pending_inw_rem_${disp._id}`,
            id: `pending_inw_rem_${disp._id}`,
            category: 'INWARD',
            type: 'pending_inward_reminder',
            userName: 'Super Admin',
            userRole: 'Super Admin',
            userLocation: 'Central Headquarters',
            storeId: dest,
            title: `⏳ Pending Stock Inward: ${model}`,
            actionText: 'Action Required:',
            targetText: `Reminder: ${qty} units of ${model} (Invoice #${invoiceNo}) dispatched to your store are waiting for Stock Inward. Please inward the stock with Serial Numbers.`,
            createdAt: new Date(dispDate.getTime() + Math.min(diffMs, 60 * 60 * 1000)).toISOString(),
            timestamp: formatNotificationTime(new Date(dispDate.getTime() + Math.min(diffMs, 60 * 60 * 1000))),
            read: false,
            isRead: false,
          });
        }

        // 3. 4-Day Overdue Escalation to Super Admin
        if (elapsedDays >= 4) {
          generatedNotifs.push({
            _id: `overdue_inw_alert_${disp._id}`,
            id: `overdue_inw_alert_${disp._id}`,
            category: 'DISPATCH',
            type: 'dispatch_overdue_alert',
            userName: 'System Monitor',
            userRole: 'System',
            userLocation: dest,
            storeId: 'Main Store',
            title: `🚨 Overdue Inward Alert: ${dest} (4+ Days)`,
            actionText: '4-Day Overdue Alert:',
            targetText: `URGENT: ${dest} has NOT Stock Inwarded ${qty} units of ${model} dispatched ${elapsedDays} days ago on ${dispDate.toLocaleDateString()} (Invoice #${invoiceNo}). Immediate follow-up required!`,
            createdAt: new Date(dispDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
            timestamp: formatNotificationTime(new Date(dispDate.getTime() + 4 * 24 * 60 * 60 * 1000)),
            read: false,
            isRead: false,
          });
        }
      }
    });

    // 5B. Process Store Inwards (S/N Verification Analysis & Confirmation to Super Admin)
    inwList.forEach((inw) => {
      const rawDate = inw.inwardDate || inw.createdAt || inw.updatedAt;
      if (!rawDate) return;
      const inwDate = new Date(rawDate);
      if (isNaN(inwDate.getTime()) || inwDate < notifStartDate) return;

      const model = inw.modelNo || inw.model || 'Product';
      const store = inw.storeName || inw.warehouseName || inw.location || 'Store';
      const invoiceNo = inw.invoiceNumber || inw.reference || 'N/A';
      const qty = inw.quantity || 1;

      // Find corresponding dispatch to analyze S/N match
      const matchingDisp = dispList.find(
        (d) =>
          (inw.invoiceNumber && d.invoiceNumber === inw.invoiceNumber) ||
          (inw.dispatchId && String(d._id) === String(inw.dispatchId)) ||
          (d.modelNo === model && d.storeName === store)
      );

      const dispSNs = Array.isArray(matchingDisp?.barcodes)
        ? matchingDisp.barcodes.map((s) => String(s).trim()).filter(Boolean)
        : [];
      const inwSNs = Array.isArray(inw.scannedBarcode)
        ? inw.scannedBarcode.map((s) => String(s).trim()).filter(Boolean)
        : [];

      const dispSet = new Set(dispSNs.map((s) => s.toLowerCase()));
      const inwSet = new Set(inwSNs.map((s) => s.toLowerCase()));

      const matchedSNs = inwSNs.filter((s) => dispSet.has(s.toLowerCase()));
      const missingSNs = dispSNs.filter((s) => !inwSet.has(s.toLowerCase()));
      const hasDispatchedSNs = dispSNs.length > 0;
      const allMatched = hasDispatchedSNs
        ? missingSNs.length === 0 && matchedSNs.length === dispSNs.length
        : true;

      // 1. Standard Store Inward notification (for Store A timeline)
      generatedNotifs.push({
        _id: `inward_${inw._id}`,
        id: `inward_${inw._id}`,
        category: 'INWARD',
        type: 'stock_inward',
        userName: store,
        userRole: 'Store',
        userLocation: store,
        storeId: store,
        title: `📥 Stock Inward: ${model}`,
        actionText: 'recently inwarded products:',
        targetText: `Inwarded ${qty} units of ${model} at ${store} (Invoice #${invoiceNo}).`,
        createdAt: inwDate.toISOString(),
        timestamp: formatNotificationTime(inwDate),
        read: false,
        isRead: false,
      });

      // 2. Verified S/N Notification specifically for Super Admin
      let snReport = '';
      if (hasDispatchedSNs) {
        snReport = allMatched
          ? `All ${matchedSNs.length} S/N properly matched: [${matchedSNs.join(', ')}].`
          : `${matchedSNs.length}/${dispSNs.length} S/N matched [${matchedSNs.join(', ')}], missing: [${missingSNs.join(', ')}].`;
      } else if (inwSNs.length > 0) {
        snReport = `Inwarded with S/N: [${inwSNs.join(', ')}].`;
      } else {
        snReport = `Inwarded successfully.`;
      }

      generatedNotifs.push({
        _id: `inward_verified_${inw._id}`,
        id: `inward_verified_${inw._id}`,
        category: 'INWARD',
        type: 'inward_sn_verified',
        userName: store,
        userRole: 'Store',
        userLocation: store,
        storeId: 'Main Store',
        title: allMatched
          ? `✅ Stock Inward S/N Verified: ${store}`
          : `⚠️ Stock Inward S/N Discrepancy: ${store}`,
        actionText: 'verified stock inward with S/N:',
        targetText: `${store} properly inwarded ${qty} units of ${model} (Invoice #${invoiceNo}). S/N Verification: ${snReport}`,
        createdAt: inwDate.toISOString(),
        timestamp: formatNotificationTime(inwDate),
        read: false,
        isRead: false,
      });
    });

    // 5C. Ingest Persistent Notifications from Backend MongoDB
    if (notifDbRes && notifDbRes.status === 'fulfilled' && notifDbRes.value.ok) {
      try {
        const notifDbData = await notifDbRes.value.json();
        const dbItems = Array.isArray(notifDbData.notifications) ? notifDbData.notifications : [];
        dbItems.forEach((dbItem) => {
          if (!dbItem || (!dbItem._id && !dbItem.id)) return;
          const rawDate = dbItem.createdAt || dbItem.timestamp;
          const itemDate = new Date(rawDate || 0);
          if (isNaN(itemDate.getTime())) return;
          const isItemUnread = !dbItem.read && !dbItem.isRead;
          if (!isItemUnread && itemDate < notifStartDate) return;

          generatedNotifs.push({
            ...dbItem,
            _id: String(dbItem._id || dbItem.id),
            id: String(dbItem.id || dbItem._id),
            timestamp: formatNotificationTime(itemDate),
            read: !!dbItem.read || !!dbItem.isRead,
            isRead: !!dbItem.read || !!dbItem.isRead,
          });
        });
      } catch (e) {
        console.warn('Error parsing db notifications:', e);
      }
    }

    // 7. Custom stored notes and messages (pruned if already in generatedNotifs)
    let localNotes = [];
    try {
      const rawNotes = JSON.parse(localStorage.getItem('app_custom_notes') || '[]');
      const existingTexts = new Set(
        generatedNotifs.map(
          (g) => `${(g.userName || g.senderName || '').trim().toLowerCase()}___${(g.targetText || g.message || '').trim().toLowerCase()}`
        )
      );

      localNotes = (Array.isArray(rawNotes) ? rawNotes : []).filter((note) => {
        const nDate = new Date(note.createdAt || 0);
        if (isNaN(nDate.getTime()) || nDate < notifStartDate) return false;
        const sig = `${(note.userName || note.senderName || '').trim().toLowerCase()}___${(note.targetText || note.message || '').trim().toLowerCase()}`;
        return !existingTexts.has(sig);
      });
      localStorage.setItem('app_custom_notes', JSON.stringify(localNotes));
    } catch {}

    // 8. Custom alert cache (only used if generatedNotifs is empty)
    let cachedAlerts = [];
    if (generatedNotifs.length === 0) {
      try {
        const rawCache = JSON.parse(localStorage.getItem('app_notifications_cache') || '[]');
        cachedAlerts = (Array.isArray(rawCache) ? rawCache : []).filter((item) => {
          if (!item) return false;
          const d = new Date(item.createdAt || 0);
          return !isNaN(d.getTime()) && d >= notifStartDate;
        });
      } catch {}
    }

    const combined = generatedNotifs.length > 0
      ? [...localNotes, ...generatedNotifs]
      : [...cachedAlerts, ...localNotes];

    let readIds = new Set();
    let deletedIds = new Set();
    let deletedEveryoneIds = new Set();
    try {
      readIds = new Set(JSON.parse(localStorage.getItem('app_read_notif_ids') || '[]'));
      deletedIds = new Set(JSON.parse(localStorage.getItem('app_deleted_notif_ids') || '[]'));
      deletedEveryoneIds = new Set(JSON.parse(localStorage.getItem('app_deleted_everyone_ids') || '[]'));
    } catch {}

    const seenIds = new Set();
    const seenSignatures = new Set();

    // Sort with MongoDB ObjectIds and newest first
    const sortedCandidates = [...combined].sort((a, b) => {
      const aIsMongo = a._id && /^[0-9a-fA-F]{24}$/.test(String(a._id));
      const bIsMongo = b._id && /^[0-9a-fA-F]{24}$/.test(String(b._id));
      if (aIsMongo && !bIsMongo) return -1;
      if (!aIsMongo && bIsMongo) return 1;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    const uniqueList = sortedCandidates.filter((item) => {
      const key = String(item.id || item._id || '');
      if (!key || seenIds.has(key) || deletedIds.has(key)) return false;

      const itemDate = new Date(item.createdAt || 0);
      if (isNaN(itemDate.getTime()) || itemDate < notifStartDate) {
        return false;
      }

      const text = (item.targetText || item.message || item.title || '').trim().toLowerCase();
      const timeMs = itemDate.getTime();
      const timeBucket = timeMs > 0 ? Math.floor(timeMs / (5 * 60 * 1000)) : 0;

      const signature = text ? `${text}___${timeBucket}` : key;

      if (text && seenSignatures.has(signature)) {
        return false;
      }

      seenIds.add(key);
      if (text) seenSignatures.add(signature);

      if (readIds.has(key)) {
        item.read = true;
        item.isRead = true;
      }
      if (deletedEveryoneIds.has(key)) {
        item.isDeletedForEveryone = true;
      }
      return true;
    });

    uniqueList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Update cache
    localStorage.setItem('app_notifications_cache', JSON.stringify(uniqueList));

    // Dispatch sync event so MiniDrawer and Notifications update simultaneously
    window.dispatchEvent(
      new CustomEvent('app_notifications_synced', {
        detail: { notifications: uniqueList },
      })
    );

    return uniqueList;
  } catch (err) {
    console.warn('fetchLiveNotifications failed:', err);
    try {
      return JSON.parse(localStorage.getItem('app_notifications_cache') || '[]');
    } catch {
      return [];
    }
  }
};

/**
 * Returns summary of notifications and messages for a specific logged-in user.
 * Provides uncapped, accurate unread counts for both:
 * 1. Notifications (system alerts, inwards, dispatches)
 * 2. Messages (quick internal communications, notes)
 */
export const getUserNotificationSummary = (user, explicitList = null) => {
  let list = explicitList;
  if (!list) {
    try {
      list = JSON.parse(localStorage.getItem('app_notifications_cache') || '[]');
    } catch {
      list = [];
    }
  }

  let readIds = new Set();
  let deletedIds = new Set();
  let deletedEveryoneIds = new Set();
  try {
    readIds = new Set(JSON.parse(localStorage.getItem('app_read_notif_ids') || '[]'));
    deletedIds = new Set(JSON.parse(localStorage.getItem('app_deleted_notif_ids') || '[]'));
    deletedEveryoneIds = new Set(JSON.parse(localStorage.getItem('app_deleted_everyone_ids') || '[]'));
  } catch {}

  const userMatchingItems = (Array.isArray(list) ? list : []).filter((item) => {
    if (!item) return false;
    const key = item.id || item._id;
    if (deletedIds.has(key) || deletedEveryoneIds.has(key)) return false;
    return matchesNotificationToUser(item, user);
  });

  // Separate Notifications (Alerts, Inward, Dispatch) vs Internal Messages / Notes
  const notifications = [];
  const messages = [];

  userMatchingItems.forEach((item) => {
    const key = item.id || item._id;
    const isUnread = !readIds.has(key) && !item.read && !item.isRead;
    const isMessage =
      item.category === 'COMMUNICATION' ||
      item.type === 'message' ||
      item.category === 'NOTE' ||
      (item.title && item.title.startsWith('💬 Message'));

    // Determine Store Name accurately
    let rawStore = (item.storeName || item.storeId || item.userLocation || item.location || item.warehouseName || '').trim();
    if (!rawStore || rawStore.toLowerCase() === 'store' || rawStore.toLowerCase() === 'undefined') {
      if (item.userName && (
        item.userName.toLowerCase().includes('ho') ||
        item.userName.toLowerCase().includes('store') ||
        item.userName.toLowerCase().includes('avadi') ||
        item.userName.toLowerCase().includes('jaipur') ||
        item.userName.toLowerCase().includes('chennai') ||
        item.userName.toLowerCase().includes('walajapet')
      )) {
        rawStore = item.userName;
      } else {
        rawStore = 'Main Store';
      }
    }
    const storeName = rawStore;

    // Determine Name
    const displayName = item.userName || item.senderName || item.name || item.storeName || 'Lookman HO';

    // Initials helper based on the Name
    const getNameInitials = (str = '') => {
      if (!str) return 'LH';
      const clean = str.replace(/[()\[\]]/g, '').trim();
      const parts = clean.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return clean.slice(0, 2).toUpperCase() || 'LH';
    };

    const avatarInitials = getNameInitials(displayName);

    // Dynamic brand color based on the Name
    const getNameColor = (str = '') => {
      const s = (str || '').toLowerCase();
      if (s.includes('lookman') || s.includes('admin')) return '#1e40af'; // Royal Blue
      if (s.includes('avadi') || s.includes('cctv')) return '#0d9488'; // Teal
      if (s.includes('jaipur') || s.includes('atul')) return '#7c3aed'; // Purple
      if (s.includes('fd') || s.includes('pradeep')) return '#059669'; // Emerald
      if (s.includes('chennai') || s.includes('dinesh')) return '#d97706'; // Amber
      if (s.includes('walajapet') || s.includes('ben')) return '#2563eb'; // Blue
      if (s.includes('main store')) return '#4338ca'; // Indigo

      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0284c7', '#4f46e5', '#0891b2'];
      return colors[Math.abs(hash) % colors.length];
    };

    const avatarColor = getNameColor(displayName);

    const formattedItem = {
      ...item,
      id: key,
      unread: isUnread,
      storeName,
      userLocation: item.userLocation || storeName,
      detail: item.detail || item.targetText || item.actionText || '',
      subtitle: `Store: ${storeName}`,
      avatarInitials: item.avatarInitials || avatarInitials,
      avatarColor: item.avatarColor || avatarColor,
      time: formatNotificationTime(item.createdAt) || item.timestamp || 'Just Now',
    };

    if (isMessage) {
      messages.push(formattedItem);
    } else {
      notifications.push(formattedItem);
    }
  });

  // Accurate unread counts (not capped at 15)
  const unreadNotifications = notifications.filter((n) => n.unread);
  const unreadMessages = messages.filter((m) => m.unread);
  const notifUnreadCount = unreadNotifications.length;
  const msgUnreadCount = unreadMessages.length;
  const totalUnreadCount = notifUnreadCount + msgUnreadCount;

  // Combine unread items across notifications and communication notes
  const allUnread = [...unreadNotifications, ...unreadMessages].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  const allCombined = [...notifications, ...messages].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  return {
    notifUnreadCount,
    msgUnreadCount,
    totalUnreadCount,
    notifications: notifications.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    messages: messages.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    topNotifications: allUnread.length > 0 ? allUnread.slice(0, 25) : allCombined.slice(0, 15),
    topMessages: messages.slice(0, 20),
  };
};

/**
 * Creates a new Quick Message / Note and syncs it.
 */
export const createCustomMessage = ({ currentUser, recipient, messageText }) => {
  if (!messageText || !messageText.trim()) return null;

  const roleLower = (currentUser?.role || '').toLowerCase();
  const isSuperAdmin = roleLower.includes('admin') || roleLower.includes('manager');

  const newId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const nowIso = new Date().toISOString();

  const recipientName = recipient?.name || (isSuperAdmin ? 'Store Staff' : 'Super Admin');
  const recipientRole = recipient?.role || (isSuperAdmin ? 'Store' : 'Super Admin');
  const recipientId = recipient?.userId || recipient?._id || recipient?.id || (isSuperAdmin ? 'all_stores' : 'admin');

  const newMsg = {
    _id: newId,
    id: newId,
    senderId: currentUser?._id || currentUser?.id || 'user',
    senderName: currentUser?.name || currentUser?.role || 'Staff',
    senderRole: currentUser?.role || 'Staff',
    senderLocation: currentUser?.warehouseName || currentUser?.assignedLocation || '',
    recipientId,
    recipientName,
    recipientRole,
    userName: currentUser?.name || currentUser?.role || 'Staff',
    userRole: currentUser?.role || 'Staff',
    userLocation: currentUser?.warehouseName || currentUser?.assignedLocation || '',
    storeId: recipientName,
    actionText: `sent a message to ${recipientName}:`,
    targetText: messageText.trim(),
    title: `💬 Note: ${messageText.trim().slice(0, 35)}${messageText.trim().length > 35 ? '...' : ''}`,
    category: 'COMMUNICATION',
    type: 'message',
    read: false,
    isRead: false,
    avatarInitials: (currentUser?.name || currentUser?.role || 'U').slice(0, 2).toUpperCase(),
    avatarColor: isSuperAdmin ? '#2563eb' : '#059669',
    timestamp: formatNotificationTime(nowIso),
    createdAt: nowIso,
  };

  try {
    const rawNotes = JSON.parse(localStorage.getItem('app_custom_notes') || '[]');
    rawNotes.push(newMsg);
    localStorage.setItem('app_custom_notes', JSON.stringify(rawNotes));
  } catch (e) {
    console.error('Error saving custom note:', e);
  }

  // Also append to app_notifications_cache
  try {
    const rawCache = JSON.parse(localStorage.getItem('app_notifications_cache') || '[]');
    localStorage.setItem('app_notifications_cache', JSON.stringify([newMsg, ...rawCache]));
  } catch {}

  window.dispatchEvent(
    new CustomEvent('app_notifications_synced', {
      detail: { newNotification: newMsg },
    })
  );

  return newMsg;
};

/**
 * Mark a single notification or message as read.
 */
export const markItemAsRead = (id) => {
  if (!id) return;
  try {
    const readIds = new Set(JSON.parse(localStorage.getItem('app_read_notif_ids') || '[]'));
    readIds.add(id);
    localStorage.setItem('app_read_notif_ids', JSON.stringify([...readIds]));

    window.dispatchEvent(
      new CustomEvent('app_notifications_synced', {
        detail: { readId: id },
      })
    );
  } catch (e) {
    console.error('markItemAsRead error:', e);
  }
};

/**
 * Mark multiple notifications or messages as read.
 */
export const markAllItemsAsRead = (ids) => {
  if (!ids || !ids.length) return;
  try {
    const readIds = new Set(JSON.parse(localStorage.getItem('app_read_notif_ids') || '[]'));
    ids.forEach((id) => {
      if (id) readIds.add(id);
    });
    localStorage.setItem('app_read_notif_ids', JSON.stringify([...readIds]));

    fetch(`${API_BASE}/notifications/mark-all-read`, { method: 'PATCH' }).catch(() => {});

    window.dispatchEvent(
      new CustomEvent('app_notifications_synced', {
        detail: { readIds: [...readIds] },
      })
    );
  } catch (e) {
    console.error('markAllItemsAsRead error:', e);
  }
};

/**
 * Delete a custom note/message.
 */
export const deleteCustomItem = (id) => {
  if (!id) return;
  try {
    const deletedIds = new Set(JSON.parse(localStorage.getItem('app_deleted_notif_ids') || '[]'));
    deletedIds.add(id);
    localStorage.setItem('app_deleted_notif_ids', JSON.stringify([...deletedIds]));

    const rawNotes = JSON.parse(localStorage.getItem('app_custom_notes') || '[]');
    const filteredNotes = rawNotes.filter((n) => (n.id || n._id) !== id);
    localStorage.setItem('app_custom_notes', JSON.stringify(filteredNotes));

    window.dispatchEvent(
      new CustomEvent('app_notifications_synced', {
        detail: { deletedId: id },
      })
    );
  } catch (e) {
    console.error('deleteCustomItem error:', e);
  }
};

/**
 * Format notification count:
 * If the notification count is above 1000 (>= 1000), display 1K (or 2K, etc.)
 */
export const formatNotificationCount = (count) => {
  if (count === null || count === undefined || count === '') return '0';
  const num = Number(count);
  if (isNaN(num)) return count;
  if (num >= 1000000) {
    return `${Math.floor(num / 1000000)}M`;
  }
  if (num >= 1000) {
    return `${Math.floor(num / 1000)}K`;
  }
  return String(num);
};
