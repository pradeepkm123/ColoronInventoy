import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  InputAdornment,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BlockIcon from '@mui/icons-material/Block';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BuildIcon from '@mui/icons-material/Build';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VerifiedIcon from '@mui/icons-material/Verified';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ClearIcon from '@mui/icons-material/Clear';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useUser } from './UserContext';

const API_BASE =
  typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5002/api'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5002/api');

// Role Color Configuration
const getRoleColor = (role = '') => {
  const r = (role || '').toLowerCase();
  if (r.includes('super admin') || r.includes('admin')) {
    return { bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe', lightText: '#7c3aed' };
  }
  if (r.includes('warehouse')) {
    return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd', lightText: '#0284c7' };
  }
  if (r.includes('cctv') || r.includes('store') || r.includes('shoppee')) {
    return { bg: '#ffedd5', color: '#c2410c', border: '#fed7aa', lightText: '#ea580c' };
  }
  if (r.includes('service') || r.includes('rma')) {
    return { bg: '#d1fae5', color: '#047857', border: '#a7f3d0', lightText: '#059669' };
  }
  if (r.includes('staff')) {
    return { bg: '#ccfbf1', color: '#0f766e', border: '#99f6e4', lightText: '#0d9488' };
  }
  return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', lightText: '#64748b' };
};

// Format count: If count is above 1000 (>= 1000), show 1K (or 2K, etc.)
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

// Notification Category / Type Configuration
const getTypeConfig = (type = '', actionText = '', title = '') => {
  const t = (type || '').toLowerCase();
  const act = (actionText || '').toLowerCase();
  const ttl = (title || '').toLowerCase();

  if (t === 'out_of_stock' || act.includes('out of stock') || ttl.includes('out of stock')) {
    return {
      label: '🚨 Out of Stock',
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
      icon: <ErrorOutlineIcon sx={{ fontSize: 14 }} />,
      isAlert: true,
      alertType: 'danger',
    };
  }
  if (t === 'low_stock' || (act.includes('low stock') && !act.includes('spare') && !act.includes('accessory')) || (ttl.includes('low stock') && !ttl.includes('spare') && !ttl.includes('accessory'))) {
    return {
      label: '⚠️ Product Low Stock',
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
      icon: <WarningAmberIcon sx={{ fontSize: 14 }} />,
      isAlert: true,
      alertType: 'warning',
    };
  }
  if (t === 'spare_low_stock' || act.includes('low spare') || ttl.includes('spare part low stock')) {
    return {
      label: '⚙️ Spare Low Stock',
      color: '#b45309',
      bg: '#fffbeb',
      border: '#fde68a',
      icon: <BuildIcon sx={{ fontSize: 14 }} />,
      isAlert: true,
      alertType: 'warning',
    };
  }
  if (t === 'spare_new' || act.includes('new spare') || ttl.includes('new spare')) {
    return {
      label: '⚙️ New Spare Product',
      color: '#7c3aed',
      bg: '#f5f3ff',
      border: '#ddd6fe',
      icon: <BuildIcon sx={{ fontSize: 14 }} />,
      isAlert: false,
      alertType: 'spare',
    };
  }
  if (t === 'account_edit_request' || ttl.includes('account edit request') || act.includes('requested permission to edit')) {
    return {
      label: '🔐 Account Edit Request',
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe',
      icon: <VpnKeyIcon sx={{ fontSize: 14 }} />,
      isAlert: true,
      alertType: 'permission',
    };
  }
  if (t === 'account_edit_approved' || ttl.includes('edit access granted') || act.includes('granted you permission')) {
    return {
      label: '✅ Edit Access Granted',
      color: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      icon: <VerifiedIcon sx={{ fontSize: 14 }} />,
      isAlert: false,
      alertType: 'success',
    };
  }
  if (t === 'accessory_out_of_stock' || act.includes('accessory out of stock') || ttl.includes('accessory out of stock')) {
    return {
      label: '🚨 Accessory Out of Stock',
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
      icon: <ErrorOutlineIcon sx={{ fontSize: 14 }} />,
      isAlert: true,
      alertType: 'danger',
    };
  }
  if (t === 'accessory_low_stock' || act.includes('low accessory') || ttl.includes('accessory low stock')) {
    return {
      label: '🎧 Accessory Low Stock',
      color: '#c2410c',
      bg: '#fff7ed',
      border: '#fed7aa',
      icon: <ShoppingCartIcon sx={{ fontSize: 14 }} />,
      isAlert: true,
      alertType: 'warning',
    };
  }
  if (t === 'accessory_new' || act.includes('new accessory') || ttl.includes('new accessory')) {
    return {
      label: '🎧 New Accessory',
      color: '#0284c7',
      bg: '#f0f9ff',
      border: '#bae6fd',
      icon: <ShoppingCartIcon sx={{ fontSize: 14 }} />,
      isAlert: false,
      alertType: 'accessory',
    };
  }
  if (t === 'stock_inward' || t === 'inward' || act.includes('inward')) {
    return {
      label: '📥 Stock Inward',
      color: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      icon: <WarehouseIcon sx={{ fontSize: 14 }} />,
      isAlert: false,
      alertType: 'inward',
    };
  }
  if (t === 'dispatch' || act.includes('dispatched') || ttl.includes('dispatched')) {
    return {
      label: '📦 Stock Dispatch',
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe',
      icon: <LocalShippingIcon sx={{ fontSize: 14 }} />,
      isAlert: false,
      alertType: 'dispatch',
    };
  }
  if (t === 'login' || act.includes('logged in') || act.includes('logged into') || ttl.includes('login')) {
    return {
      label: '🔐 Login Activity',
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      icon: <PersonIcon sx={{ fontSize: 14 }} />,
      isAlert: false,
      alertType: 'auth',
    };
  }
  if (t === 'in_stock' || act.includes('replenished') || ttl.includes('in stock')) {
    return {
      label: '✅ In Stock',
      color: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />,
      isAlert: false,
      alertType: 'success',
    };
  }
  if (t === 'message' || act.includes('sent a note') || act.includes('replied') || act.includes('message')) {
    return {
      label: '💬 Store Message',
      color: '#4338ca',
      bg: '#eef2ff',
      border: '#c7d2fe',
      icon: <ChatIcon sx={{ fontSize: 14 }} />,
      isAlert: false,
      alertType: 'message',
    };
  }
  if (t === 'service' || t === 'rma' || act.includes('rma') || act.includes('service')) {
    return {
      label: '🔧 Service & RMA',
      color: '#e11d48',
      bg: '#fff1f2',
      border: '#fecdd3',
      icon: <BuildIcon sx={{ fontSize: 14 }} />,
      isAlert: false,
    };
  }

  return {
    label: 'Activity',
    color: '#64748b',
    bg: '#f8fafc',
    border: '#e2e8f0',
    icon: <NotificationsActiveIcon sx={{ fontSize: 14 }} />,
    isAlert: false,
  };
};

// Initials Avatar Generator
const getInitials = (name = '') => {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  );
};

// Persistent Baseline Start Date Helper (Maintains 30-day history window)
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

  // Today
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

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  }

  // Previous days / Older days
  const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  return `${dateStr} at ${timeStr}`;
};

export default function Notifications({ initialTargetNotifId = null, targetPayload: initialPayload = null } = {}) {
  const { user: currentUser } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserKey, setSelectedUserKey] = useState('');
  const [highlightedId, setHighlightedId] = useState(initialTargetNotifId);
  const [pendingTarget, setPendingTarget] = useState(() => {
    if (initialPayload && initialPayload.id) return initialPayload;
    try {
      const raw = localStorage.getItem('app_target_notification');
      if (raw) return JSON.parse(raw);
    } catch { }
    if (initialTargetNotifId) return { id: initialTargetNotifId };
    return null;
  });
  const targetScrollActiveRef = useRef(false);
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  // WhatsApp Web style delete dialog target
  const [targetDeleteNotif, setTargetDeleteNotif] = useState(null);

  // Quick message input for active account
  const [quickInput, setQuickInput] = useState('');
  const [quickType, setQuickType] = useState('product');
  const [quickAction, setQuickAction] = useState('added a new product');

  // Dialog state for full "+ Add Activity"
  const [newNotification, setNewNotification] = useState({
    userId: '',
    userName: '',
    userRole: '',
    userLocation: '',
    userEmail: '',
    actionText: 'added a new product',
    targetText: '',
    type: 'product',
  });

  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // Reliable Auto-Scroll to Bottom: Smoothly scrolls down to reveal newest messages at bottom
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: behavior,
        });
      }
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: behavior, block: 'end' });
      }
    }, 60);
  }, []);

  // Track if user scrolled up inside the chat stream
  const handleChatScroll = useCallback((e) => {
    const el = e.currentTarget;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottomBtn(distanceToBottom > 140);
  }, []);

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
  };

  // Determine if logged-in user is Super Admin
  const isSuperAdmin = useMemo(() => {
    let u = currentUser;
    if (!u) {
      try {
        const stored = localStorage.getItem('userData');
        if (stored) u = JSON.parse(stored);
      } catch { }
    }
    if (!u) return true;
    const role = (u.role || '').toLowerCase();
    const name = (u.name || '').toLowerCase();
    return (
      role.includes('super admin') ||
      role.includes('superadmin') ||
      role.includes('admin') ||
      name.includes('super admin') ||
      name.includes('admin')
    );
  }, [currentUser]);

  // Current user's own store profile
  // Current user's own store/warehouse profile
  const myAccount = useMemo(() => {
    let u = currentUser;
    if (!u) {
      try {
        const stored = localStorage.getItem('userData');
        if (stored) u = JSON.parse(stored);
      } catch { }
    }
    if (!u) return null;
    const loc =
      u.warehouseName ||
      u.assignedLocation ||
      u.serviceCenter ||
      u.staffLocation ||
      u.customerStore ||
      (u.role && !['admin', 'super admin', 'manager', 'staff', 'user'].includes(u.role.toLowerCase()) ? u.role : '') ||
      '';
    return {
      key: u._id || u.id || u.name,
      userId: u._id || u.id,
      name: u.name,
      role: u.role || 'Store',
      email: u.email || '',
      location: loc,
      warehouseName: u.warehouseName || '',
      assignedLocation: u.assignedLocation || '',
      customerStore: u.customerStore || '',
      total: 0,
      unread: 0,
      lastActivity: null,
    };
  }, [currentUser]);

  // Fetch Users, Inventory, Spares, Accessories, Inwards, Dispatches (100% UI dynamic mode)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let token = null;
      try {
        token = localStorage.getItem('token') || localStorage.getItem('authToken');
      } catch { }

      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let notifQuery = '';
      if (currentUser) {
        const p = new URLSearchParams();
        if (currentUser.role) p.set('role', currentUser.role);
        if (currentUser.name) p.set('userName', currentUser.name);
        if (currentUser._id || currentUser.id) p.set('userId', currentUser._id || currentUser.id);
        const loc = currentUser.warehouseName || currentUser.serviceCenter || currentUser.customerStore || currentUser.assignedLocation || currentUser.location || '';
        if (loc) p.set('storeName', loc);
        notifQuery = `?${p.toString()}`;
      }

      // Fetch live data sources in parallel: Users, Inventory, Products Catalog, Spares, Inwards, Dispatches, Accessories, Notifications
      const [uRes, invRes, prodRes, spareRes, inwRes, dispRes, accRes, notifDbRes] = await Promise.allSettled([
        fetch(`${API_BASE}/users`, { headers }),
        fetch(`${API_BASE}/inventory`, { headers }),
        fetch(`${API_BASE}/products`, { headers }),
        fetch(`${API_BASE}/spare-parts`, { headers }),
        fetch(`${API_BASE}/store-inward`, { headers }),
        fetch(`${API_BASE}/dispatch`, { headers }),
        fetch(`${API_BASE}/accessories`, { headers }),
        fetch(`${API_BASE}/notifications${notifQuery}`, { headers }),
      ]);

      // Reference baseline timestamp: Starts from Today Onward, persists for Tomorrow and future days
      const notifStartDate = getNotificationStartDate();
      const nowIso = new Date().toISOString();

      // 1. Users
      let loadedUsers = [];
      if (uRes.status === 'fulfilled' && uRes.value.ok) {
        const uData = await uRes.value.json();
        loadedUsers = uData.users || uData || [];
        setUsers(loadedUsers);
      }

      const generatedNotifs = [];

      // 2a. Inventory (Low Stock & Out of Stock - Strictly for items updated/created since start date)
      if (invRes.status === 'fulfilled' && invRes.value.ok) {
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
                targetText: `${model} (${brand}) at ${loc} is completely Out of Stock (0 units remaining).`,
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
      }

      // 2b. Master Products Catalog (Out of Stock & Low Stock - Strictly for items updated/created since start date)
      if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
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
      }

      // 3. Spares Inventory (Low Stock & New Spares - Shown directly under Lookman HO / Main Store)
      if (spareRes.status === 'fulfilled' && spareRes.value.ok) {
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

          // New spare notification - strictly Start Date Onward
          const createdRaw = sp.createdAt || sp.createdDate;
          const createdDate = createdRaw ? new Date(createdRaw) : null;
          if (createdDate && !isNaN(createdDate.getTime()) && createdDate >= notifStartDate) {
            generatedNotifs.push({
              _id: `spare_new_${sp._id}`,
              id: `spare_new_${sp._id}`,
              category: 'SPARES',
              type: 'spare_new',
              userName: 'Lookman HO',
              userRole: 'Super Admin',
              userLocation: 'Main Store',
              storeId: 'Main Store',
              title: `⚙️ New Spare Product: ${name}`,
              actionText: 'New Spare Added:',
              targetText: `New spare "${name}" ${code ? `[${code}]` : ''} (${sp.category || 'General'}) with ${avail} units in stock.`,
              createdAt: createdDate.toISOString(),
              timestamp: formatNotificationTime(createdDate),
              read: false,
              isRead: false,
            });
          }
        });
      }

      // 4. Accessories Inventory (Low Stock, Out of Stock & New Accessories - Shown directly under Lookman HO / Main Store)
      if (accRes && accRes.status === 'fulfilled' && accRes.value.ok) {
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

            // New accessory notification - strictly Start Date Onward
            const createdRaw = acc.createdOn || acc.createdAt;
            const createdDate = createdRaw ? new Date(createdRaw) : null;
            if (createdDate && !isNaN(createdDate.getTime()) && createdDate >= notifStartDate) {
              generatedNotifs.push({
                _id: `acc_new_${acc._id}`,
                id: `acc_new_${acc._id}`,
                category: 'ACCESSORIES',
                type: 'accessory_new',
                userName: 'Lookman HO',
                userRole: 'Super Admin',
                userLocation: 'Main Store',
                storeId: 'Main Store',
                title: `🎧 New Accessory Added: ${name}`,
                actionText: 'New Accessory Added:',
                targetText: `New accessory "${name}" ${sku ? `[${sku}]` : ''} (${category}) with ${stock} units in stock.`,
                createdAt: createdDate.toISOString(),
                timestamp: formatNotificationTime(createdDate),
                read: false,
                isRead: false,
              });
            }
          });
        }
      }

      // 4. Live Dispatches & Store Inwards (Automated S/N Verification & Overdue Analysis)
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

      // 4A. Process Dispatches (Automated Dispatch -> Store A with S/N, 1-Hr Reminders, 4-Day Escalations)
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

      // 4B. Process Store Inwards (S/N Verification Analysis & Confirmation to Super Admin)
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

      // 4C. Ingest Persistent Notifications from Backend MongoDB
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
          console.warn('Error parsing db notifications in Notifications.js:', e);
        }
      }

      // 6. Custom stored notes / messages from localStorage - strictly Start Date Onward
      // If a local note is already in generatedNotifs (from MongoDB), prune it so it never duplicates
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
      } catch { }

      // 7. Cached alerts: only used if generatedNotifs is empty (e.g. offline fallback)
      let cachedAlerts = [];
      if (generatedNotifs.length === 0) {
        try {
          const rawCache = JSON.parse(localStorage.getItem('app_notifications_cache') || '[]');
          cachedAlerts = (Array.isArray(rawCache) ? rawCache : []).filter((item) => {
            if (!item) return false;
            const d = new Date(item.createdAt || 0);
            return !isNaN(d.getTime()) && d >= notifStartDate;
          });
        } catch { }
      }

      // Combine sources without double-loading cache
      const combined = generatedNotifs.length > 0
        ? [...localNotes, ...generatedNotifs]
        : [...cachedAlerts, ...localNotes];

      // Read status & deleted IDs from localStorage
      let readIds = new Set();
      let deletedIds = new Set();
      let deletedEveryoneIds = new Set();
      try {
        readIds = new Set(JSON.parse(localStorage.getItem('app_read_notif_ids') || '[]'));
        deletedIds = new Set(JSON.parse(localStorage.getItem('app_deleted_notif_ids') || '[]'));
        deletedEveryoneIds = new Set(JSON.parse(localStorage.getItem('app_deleted_everyone_ids') || '[]'));
      } catch { }

      const seenIds = new Set();
      const seenSignatures = new Set();

      // Sort with MongoDB ObjectIds and newest first so canonical DB records take precedence over temporary local notes
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

        // FILTER: Keep all notifications from baseline start date onward (today & previous days)
        const itemDate = new Date(item.createdAt || 0);
        if (isNaN(itemDate.getTime()) || itemDate < notifStartDate) {
          return false;
        }

        // Content signature deduplication (sender + action + message text + 5-minute time window)
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

      // Sort with newest / most recently updated first
      uniqueList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setNotifications(uniqueList);
      localStorage.setItem('app_notifications_cache', JSON.stringify(uniqueList));
      window.dispatchEvent(
        new CustomEvent('app_notifications_synced', {
          detail: { notifications: uniqueList },
        })
      );
    } catch (error) {
      console.error('Error loading notification data:', error);
      showToast('Error syncing live resources', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();

    // Polling every 4 seconds for real-time live stock/inward sync
    const pollInterval = setInterval(() => {
      loadData();
    }, 4000);

    // Immediate fetch on window focus or tab visibility change
    const handleFocus = () => loadData();
    const handleVisibility = () => {
      if (!document.hidden) loadData();
    };

    // Instant Stock Alert Event Listener (0ms immediate reception at bottom)
    const handleStockAlert = (e) => {
      const alertItem = e?.detail;
      if (alertItem && (alertItem.id || alertItem._id)) {
        setNotifications((prev) => {
          const filtered = prev.filter((p) => p.id !== alertItem.id && p._id !== alertItem._id);
          return [...filtered, alertItem];
        });
        showToast(`🚨 ${alertItem.title || 'Stock Alert Received'}`, 'warning');
        scrollToBottom('smooth');
      }
      loadData();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('app_stock_alert_updated', handleStockAlert);
    window.addEventListener('storage', handleStockAlert);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('app_stock_alert_updated', handleStockAlert);
      window.removeEventListener('storage', handleStockAlert);
    };
  }, [loadData]);

  // Account-to-Notification strict matcher (Strict account-wise isolation - Lookman HO only shows Main Store/HO notifications)
  const matchesNotificationToAccount = useCallback((n, account) => {
    if (!n || !account) return false;

    const accRole = (account.role || '').toLowerCase().trim();
    const accName = (account.name || '').toLowerCase().trim();
    const accLoc = (
      account.location ||
      account.assignedLocation ||
      account.warehouseName ||
      account.customerStore ||
      account.serviceCenter ||
      account.staffLocation ||
      ''
    ).toLowerCase().trim();
    const accId = account.userId ? String(account.userId) : (account.key ? String(account.key) : '');

    const nStore = (n.storeName || n.storeId || n.userLocation || n.location || n.metadata?.storeName || '').toLowerCase().trim();
    const nUser = (n.userName || n.user || '').toLowerCase().trim();
    const nSender = (n.senderName || '').toLowerCase().trim();
    const nRecipient = (n.recipientName || '').toLowerCase().trim();
    const nRecipientRole = (n.recipientRole || '').toLowerCase().trim();
    const nTarget = (n.targetText || '').toLowerCase().trim();
    const nTitle = (n.title || '').toLowerCase().trim();
    const nCategory = (n.category || '').toUpperCase().trim();
    const nType = (n.type || '').toLowerCase().trim();
    const nAssignedEng = (n.metadata?.assignedEngineer || n.metadata?.servicePerson || n.metadata?.performedBy || '').toLowerCase().trim();
    const nUserId = n.userId ? String(n.userId) : '';
    const nSenderId = n.senderId ? String(n.senderId) : '';
    const nRecipientId = n.recipientId ? String(n.recipientId) : '';
    const nEngineerId = n.metadata?.engineerId ? String(n.metadata.engineerId) : '';

    // 1. Direct User ID or Sender / Recipient ID match
    if (accId && (nUserId === accId || nSenderId === accId || nRecipientId === accId || nEngineerId === accId)) {
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
      accName.includes('lookman ho') ||
      accRole.includes('admin') ||
      accName === 'super admin';

    // 2. Lookman HO (Super Admin • Main Store / Central HQ)
    if (isLookmanHo) {
      // Super Admin automatically receives all store Low Stock & Out of Stock notifications,
      // Store Inward S/N verification reports, 4-day Overdue Dispatch Escalation alerts,
      // and all Service Request creations and stage completions across all stores
      const isStoreStockAlert =
        n.type === 'low_stock' ||
        n.type === 'out_of_stock' ||
        (nTitle && (nTitle.includes('out of stock') || nTitle.includes('low stock alert')));
      const isInwardVerificationAlert =
        n.type === 'inward_sn_verified' ||
        (nTitle && (nTitle.includes('s/n verified') || nTitle.includes('s/n discrepancy') || nTitle.includes('stock inward s/n')));
      const isOverdueAlert =
        n.type === 'dispatch_overdue_alert' ||
        (nTitle && (nTitle.includes('overdue inward') || nTitle.includes('4+ days')));
      const isPermissionRequest =
        n.type === 'account_edit_request' ||
        n.type === 'account_edit_approved' ||
        n.type === 'account_edit_rejected' ||
        (nTitle && (nTitle.includes('account edit') || nTitle.includes('permission request')));
      const isServiceAlert =
        nCategory === 'SERVICE' ||
        nCategory === 'RMA' ||
        nType.includes('service') ||
        nType.includes('rma');

      if (isStoreStockAlert || isInwardVerificationAlert || isOverdueAlert || isPermissionRequest || isServiceAlert) {
        return true;
      }

      // Must NOT show notifications that explicitly belong to other branch stores
      if (isOtherBranch(nStore) || isOtherBranch(nTarget) || isOtherBranch(nTitle)) {
        return false;
      }

      // Direct communication with Super Admin or Lookman HO
      if (
        nSender.includes('lookman ho') ||
        nRecipient.includes('lookman ho') ||
        nSender.includes('super admin') ||
        nRecipient.includes('super admin') ||
        nSenderId === 'admin' ||
        nRecipientId === 'admin'
      ) {
        return true;
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
      accName.includes('cctv shop') ||
      accRole.includes('avadi') ||
      accLoc.includes('avadi') ||
      accName.includes('avadi');

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
      accName.includes('atul') ||
      accLoc.includes('jaipur') ||
      accRole.includes('jaipur');

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
      accName.includes('pradeep') ||
      accLoc.includes('fd') ||
      accRole.includes('fd');

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

    // 6. Generic Service Person (Handles products from ANY store/warehouse: Store A, Store B, etc.)
    // In that Service Person login area ONLY receive notifications for their own service tasks & stages
    const isServicePerson =
      accRole.includes('service') ||
      accRole.includes('engineer') ||
      accRole.includes('technician') ||
      accName.includes('dinesh') ||
      accName.includes('ben') ||
      accName.includes('technician') ||
      accName.includes('service');

    if (isServicePerson) {
      // Strictly exclude unrelated store inventory, outwards, dispatches, inward stocks from Store A / Store B
      const isStoreInventoryAlert =
        nCategory === 'INVENTORY' ||
        nCategory === 'INWARD' ||
        nCategory === 'DISPATCH' ||
        nType === 'low_stock' ||
        nType === 'out_of_stock' ||
        nType === 'stock_inward' ||
        nType === 'dispatch' ||
        nType === 'dispatch_overdue_alert' ||
        nType === 'inward_sn_verified';

      if (isStoreInventoryAlert) {
        return false;
      }

      // Check if this notification is specifically for/by this Service Person
      const matchesTechName =
        Boolean(accName) &&
        (nUser.includes(accName) ||
          nSender.includes(accName) ||
          nRecipient.includes(accName) ||
          nAssignedEng.includes(accName) ||
          (accName && nAssignedEng && accName.includes(nAssignedEng)) ||
          nTarget.includes(accName) ||
          nTitle.includes(accName));

      const matchesTechId =
        Boolean(accId) &&
        (nUserId === accId || nSenderId === accId || nRecipientId === accId || nEngineerId === accId);

      const isGeneralServiceBroadcast =
        (nRecipientRole.includes('service') || nRecipientRole.includes('engineer') || nRecipientRole.includes('technician')) &&
        (!nRecipient || nRecipient.includes('service') || nRecipient.includes('technician') || nRecipient === 'all');

      if (matchesTechName || matchesTechId || isGeneralServiceBroadcast) {
        return true;
      }

      // If category is SERVICE/RMA/SPARES/COMMUNICATION and matches direct conversation/notes
      if (
        nCategory === 'SERVICE' ||
        nCategory === 'RMA' ||
        nCategory === 'SPARES' ||
        nCategory === 'COMMUNICATION' ||
        nType === 'message'
      ) {
        if (
          nTarget.includes(accName) ||
          nTitle.includes(accName) ||
          nUser.includes(accName) ||
          nSender.includes(accName) ||
          nRecipient.includes(accName)
        ) {
          return true;
        }
      }

      // Service persons ONLY see their service tasks - no leaks from other activities
      return false;
    }

    // 8. General token-based fallback for other accounts
    const genericWords = new Set(['store', 'stores', 'warehouse', 'warehouses', 'staff', 'user', 'admin', 'super admin', 'manager']);
    const tokens = [];
    if (accName) tokens.push(accName);
    if (accLoc) tokens.push(accLoc);
    if (accRole && !genericWords.has(accRole)) tokens.push(accRole);
    if (account.email) tokens.push(account.email.toLowerCase().trim());

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
  }, []);

  // Aggregate User Accounts (Only needed for Super Admin view)
  const userAccounts = useMemo(() => {
    // 1. Map registered DB users
    const list = users.map((u) => {
      const key = u._id || u.id || u.name;
      const isUserAdmin =
        (u.role || '').toLowerCase().includes('admin') ||
        (u.name || '').toLowerCase().includes('admin') ||
        (u.name || '').toLowerCase().includes('lookman ho');

      const loc =
        u.warehouseName ||
        u.assignedLocation ||
        u.serviceCenter ||
        u.staffLocation ||
        u.customerStore ||
        (isUserAdmin ? 'Main Store' : '');

      return {
        key,
        userId: u._id || u.id,
        name: u.name,
        role: u.role || (isUserAdmin ? 'Super Admin' : 'Staff'),
        email: u.email || '',
        location: loc,
        total: 0,
        unread: 0,
        lastActivity: null,
      };
    });

    // Ensure Super Admin / Lookman HO is at index 0 so Super Admin sees all system notifications by default
    list.sort((a, b) => {
      const aAdmin = (a.role || '').toLowerCase().includes('admin') || (a.name || '').toLowerCase().includes('admin') || (a.name || '').toLowerCase().includes('lookman');
      const bAdmin = (b.role || '').toLowerCase().includes('admin') || (b.name || '').toLowerCase().includes('admin') || (b.name || '').toLowerCase().includes('lookman');
      if (aAdmin && !bAdmin) return -1;
      if (!aAdmin && bAdmin) return 1;
      return 0;
    });

    const hasAdmin = list.some((a) => (a.role || '').toLowerCase().includes('admin') || (a.name || '').toLowerCase().includes('admin') || (a.name || '').toLowerCase().includes('lookman'));
    if (!hasAdmin) {
      list.unshift({
        key: 'lookman_ho_super_admin',
        userId: 'admin',
        name: 'Lookman HO (Super Admin)',
        role: 'Super Admin',
        email: 'admin@lookman.xyz',
        location: 'Central Headquarters / Main Store',
        total: 0,
        unread: 0,
        lastActivity: null,
      });
    }

    // Filter out any synthetic or legacy accounts for Accessories Store or Spare Parts Management
    const filteredList = list.filter((a) => {
      const name = (a.name || '').toLowerCase();
      const role = (a.role || '').toLowerCase();
      if (name.includes('accessories store') || role.includes('accessories store') || a.key === 'account_accessories') return false;
      if (name.includes('spare parts management') || role.includes('spare parts management') || a.key === 'account_spare_parts') return false;
      return true;
    });

    // 2. For each account in `filteredList`, calculate total, unread, and lastActivity using strict account-store matcher
    filteredList.forEach((acc) => {
      const accActivities = notifications.filter((n) => matchesNotificationToAccount(n, acc));
      acc.total = accActivities.length;
      acc.unread = accActivities.filter((n) => !n.read && !n.isRead).length;
      if (accActivities.length > 0) {
        acc.lastActivity = accActivities.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      }
    });

    return filteredList;
  }, [users, notifications, matchesNotificationToAccount]);

  // Auto-select first account if none selected or if previous invalid/removed account was selected (for Super Admin)
  useEffect(() => {
    if (
      isSuperAdmin &&
      (!selectedUserKey ||
        selectedUserKey === 'account_accessories' ||
        selectedUserKey === 'account_spare_parts' ||
        !userAccounts.some((u) => u.key === selectedUserKey)) &&
      userAccounts.length > 0
    ) {
      setSelectedUserKey(userAccounts[0].key);
    }
  }, [isSuperAdmin, userAccounts, selectedUserKey]);

  // Active Account
  const effectiveActiveAccount = useMemo(() => {
    if (isSuperAdmin) {
      return userAccounts.find((u) => u.key === selectedUserKey) || userAccounts[0] || null;
    }
    return myAccount || userAccounts[0] || null;
  }, [isSuperAdmin, userAccounts, selectedUserKey, myAccount]);

  // Counts for each category in current scope
  const counts = useMemo(() => {
    let all = 0;
    let service = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let inward = 0;
    let dispatch = 0;
    let spares = 0;
    let accessories = 0;
    let messages = 0;

    const targetAccount = isSuperAdmin ? effectiveActiveAccount : myAccount;
    const scopedList = targetAccount
      ? notifications.filter((n) => matchesNotificationToAccount(n, targetAccount))
      : (isSuperAdmin ? notifications : []);

    all = scopedList.length;

    scopedList.forEach((n) => {
      const t = (n.type || '').toLowerCase();
      const c = (n.category || '').toLowerCase();
      const act = (n.actionText || '').toLowerCase();
      const tgt = (n.targetText || '').toLowerCase();
      const ttl = (n.title || '').toLowerCase();

      if (c === 'service' || c === 'rma' || t.includes('service') || t.includes('rma') || act.includes('service') || ttl.includes('service') || ttl.includes('rma')) service++;
      if (t === 'low_stock' || (act.includes('low stock') && !act.includes('spare') && !act.includes('accessory')) || (ttl.includes('low stock') && !ttl.includes('spare') && !ttl.includes('accessory'))) lowStock++;
      if (t === 'out_of_stock' || act.includes('out of stock') || ttl.includes('out of stock')) outOfStock++;
      if (t === 'stock_inward' || t === 'inward' || t === 'inward_sn_verified' || c === 'inward' || act.includes('inward') || ttl.includes('inward')) inward++;
      if (t === 'dispatch' || t === 'dispatch_overdue_alert' || c === 'dispatch' || act.includes('dispatched') || ttl.includes('dispatched') || ttl.includes('overdue')) dispatch++;
      if (t.includes('spare') || c === 'spares' || act.includes('spare') || ttl.includes('spare')) spares++;
      if (t.includes('accessory') || c === 'accessories' || act.includes('accessory') || ttl.includes('accessory')) accessories++;
      if (t === 'message' || c === 'communication' || act.includes('note') || act.includes('replied')) messages++;
    });

    return { all, service, lowStock, outOfStock, inward, dispatch, spares, accessories, messages };
  }, [notifications, isSuperAdmin, effectiveActiveAccount, myAccount, matchesNotificationToAccount]);

  // Category matcher helper
  const matchesCategory = (item, catFilter) => {
    if (!catFilter || catFilter === 'all') return true;
    const t = (item.type || '').toLowerCase();
    const c = (item.category || '').toLowerCase();
    const act = (item.actionText || '').toLowerCase();
    const tgt = (item.targetText || '').toLowerCase();
    const ttl = (item.title || '').toLowerCase();

    if (catFilter === 'service' || catFilter === 'rma') {
      return (
        c === 'service' ||
        c === 'rma' ||
        t.includes('service') ||
        t.includes('rma') ||
        act.includes('service') ||
        tgt.includes('service') ||
        ttl.includes('service') ||
        ttl.includes('rma')
      );
    }
    if (catFilter === 'low_stock') {
      return (
        t === 'low_stock' ||
        (act.includes('low stock') && !act.includes('spare')) ||
        (ttl.includes('low stock') && !ttl.includes('spare'))
      );
    }
    if (catFilter === 'out_of_stock') {
      return (
        t === 'out_of_stock' ||
        act.includes('out of stock') ||
        tgt.includes('out of stock') ||
        ttl.includes('out of stock')
      );
    }
    if (catFilter === 'inward' || catFilter === 'stock_inward') {
      return (
        t === 'stock_inward' ||
        t === 'inward' ||
        t === 'inward_sn_verified' ||
        c === 'inward' ||
        act.includes('inward') ||
        tgt.includes('inward') ||
        ttl.includes('inward')
      );
    }
    if (catFilter === 'dispatch') {
      return (
        t === 'dispatch' ||
        t === 'dispatch_overdue_alert' ||
        c === 'dispatch' ||
        act.includes('dispatched') ||
        tgt.includes('dispatched') ||
        ttl.includes('dispatched') ||
        ttl.includes('overdue')
      );
    }
    if (catFilter === 'spares' || catFilter === 'spare_parts') {
      return (
        t.includes('spare') ||
        c === 'spares' ||
        act.includes('spare') ||
        tgt.includes('spare') ||
        ttl.includes('spare')
      );
    }
    if (catFilter === 'accessories') {
      return (
        t.includes('accessory') ||
        c === 'accessories' ||
        act.includes('accessory') ||
        tgt.includes('accessory') ||
        ttl.includes('accessory')
      );
    }
    if (catFilter === 'communication' || catFilter === 'messages' || catFilter === 'message') {
      return (
        t === 'message' ||
        t === 'stock_request' ||
        t === 'approval' ||
        t === 'rejection' ||
        c === 'communication' ||
        act.includes('note') ||
        act.includes('replied')
      );
    }
    if (catFilter === 'auth' || catFilter === 'login' || catFilter === 'logins') {
      return (
        t === 'login' ||
        c === 'auth' ||
        act.includes('logged in') ||
        act.includes('logged into') ||
        ttl.includes('login')
      );
    }

    return t.includes(catFilter.toLowerCase()) || c.includes(catFilter.toLowerCase());
  };

  // Filtered Activities Timeline (Strict isolation for Non-Admin stores & Main Store only for Lookman HO)
  const displayedActivities = useMemo(() => {
    const targetAccount = isSuperAdmin ? effectiveActiveAccount : myAccount;
    if (!targetAccount) return [];

    const filtered = notifications
      .filter((item) => {
        // 1. Account / Store / Warehouse isolation: ONLY show notifications belonging to this account
        if (!matchesNotificationToAccount(item, targetAccount)) {
          return false;
        }

        // 2. Category Filter
        if (!matchesCategory(item, categoryFilter)) {
          return false;
        }

        // 3. Search Query
        if (activitySearchQuery.trim()) {
          const q = activitySearchQuery.toLowerCase().trim();
          const searchStr = `${item.userName || ''} ${item.actionText || ''} ${item.targetText || ''} ${item.type || ''} ${item.title || ''}`.toLowerCase();
          if (!searchStr.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

    // Safeguard: Ensure displayed activities have ZERO duplicate messages
    const seenActIds = new Set();
    const seenActSigs = new Set();
    return filtered.filter((item) => {
      const key = String(item.id || item._id || '');
      if (key && seenActIds.has(key)) return false;

      const text = (item.targetText || item.message || item.title || '').trim().toLowerCase();
      const timeMs = item.createdAt ? new Date(item.createdAt).getTime() : 0;
      const timeBucket = timeMs > 0 ? Math.floor(timeMs / (5 * 60 * 1000)) : 0;
      const sig = text ? `${text}___${timeBucket}` : key;

      if (text && seenActSigs.has(sig)) return false;

      if (key) seenActIds.add(key);
      if (text) seenActSigs.add(sig);
      return true;
    });
  }, [isSuperAdmin, effectiveActiveAccount, myAccount, notifications, categoryFilter, activitySearchQuery, matchesNotificationToAccount]);

  // Unread count for displayed activities
  const unreadCount = useMemo(() => {
    return displayedActivities.filter((n) => !n.read && !n.isRead).length;
  }, [displayedActivities]);

  // Automatically scroll down when entering the Notification page or switching active store account
  useEffect(() => {
    if (targetScrollActiveRef.current || highlightedId) return;
    const t1 = setTimeout(() => scrollToBottom('auto'), 80);
    const t2 = setTimeout(() => scrollToBottom('smooth'), 320);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [selectedUserKey, effectiveActiveAccount?.key, scrollToBottom, highlightedId]);

  // Automatically scroll down whenever new activities or messages arrive
  useEffect(() => {
    if (targetScrollActiveRef.current || highlightedId) return;
    if (displayedActivities.length > 0) {
      scrollToBottom('smooth');
    }
  }, [displayedActivities.length, scrollToBottom, highlightedId]);

  // Filtered Accounts on the Left (Only for Super Admin)
  const filteredAccounts = useMemo(() => {
    if (!isSuperAdmin) return [];
    return userAccounts.filter((u) => {
      if (roleFilter !== 'all') {
        const roleLower = (u.role || '').toLowerCase();
        if (roleFilter === 'unread' && u.unread === 0) return false;
        if (roleFilter === 'low_stock') {
          const hasLowStock = notifications.some((n) => {
            const matchesUser =
              (n.userId && u.userId && String(n.userId) === String(u.userId)) ||
              (n.userName && n.userName.toLowerCase() === u.name.toLowerCase()) ||
              (n.userLocation && u.location && n.userLocation.toLowerCase() === u.location.toLowerCase());
            const t = (n.type || '').toLowerCase();
            const act = (n.actionText || '').toLowerCase();
            return matchesUser && (t.includes('low_stock') || t.includes('out_of_stock') || act.includes('low stock') || act.includes('out of stock'));
          });
          if (!hasLowStock && !u.name.toLowerCase().includes('admin') && !roleLower.includes('admin')) return false;
        } else if (roleFilter !== 'unread' && !roleLower.includes(roleFilter.toLowerCase())) {
          return false;
        }
      }
      if (accountSearchQuery.trim()) {
        const q = accountSearchQuery.toLowerCase().trim();
        const searchStr = `${u.name} ${u.role} ${u.location} ${u.email}`.toLowerCase();
        if (!searchStr.includes(q)) return false;
      }
      return true;
    });
  }, [isSuperAdmin, userAccounts, roleFilter, accountSearchQuery, notifications]);

  // Mark single activity as read (UI & localStorage & sync events)
  const handleMarkAsRead = (id) => {
    if (!id) return;
    try {
      const readIds = new Set(JSON.parse(localStorage.getItem('app_read_notif_ids') || '[]'));
      readIds.add(id);
      localStorage.setItem('app_read_notif_ids', JSON.stringify([...readIds]));

      let updatedList = [];
      setNotifications((prev) => {
        updatedList = prev.map((item) => ((item.id === id || item._id === id) ? { ...item, read: true, isRead: true } : item));
        localStorage.setItem('app_notifications_cache', JSON.stringify(updatedList));
        return updatedList;
      });

      window.dispatchEvent(
        new CustomEvent('app_notifications_synced', {
          detail: { readId: id, readIds: [...readIds], notifications: updatedList },
        })
      );

      fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(() => { });
    } catch (err) {
      console.error('Failed to save read state:', err);
    }
  };

  // Handle clicking an Account in "Accounts & Chats": opens chat and marks its unread notifications as read
  const handleSelectAccount = (accountKey) => {
    if (!accountKey) return;
    setSelectedUserKey(accountKey);

    const targetAcc = userAccounts.find((a) => a.key === accountKey);
    if (!targetAcc) return;

    // Find all unread notifications belonging to this account chat
    const unreadMatching = notifications.filter(
      (n) => (!n.read && !n.isRead) && matchesNotificationToAccount(n, targetAcc)
    );

    if (unreadMatching.length === 0) return;

    try {
      const readIds = new Set(JSON.parse(localStorage.getItem('app_read_notif_ids') || '[]'));
      const unreadIds = [];

      unreadMatching.forEach((item) => {
        const id = item.id || item._id;
        if (id) {
          readIds.add(id);
          unreadIds.push(id);
        }
      });

      localStorage.setItem('app_read_notif_ids', JSON.stringify([...readIds]));

      let updatedList = [];
      setNotifications((prev) => {
        updatedList = prev.map((item) => {
          const key = item.id || item._id;
          if (key && readIds.has(key)) {
            return { ...item, read: true, isRead: true };
          }
          return item;
        });
        localStorage.setItem('app_notifications_cache', JSON.stringify(updatedList));
        return updatedList;
      });

      window.dispatchEvent(
        new CustomEvent('app_notifications_synced', {
          detail: { notifications: updatedList, readIds: [...readIds] },
        })
      );

      // Async persist to backend if database-backed
      try {
        unreadIds.forEach((id) => {
          if (id && !id.startsWith('stock_') && !id.startsWith('dispatch_') && !id.startsWith('inward_') && !id.startsWith('note_')) {
            fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(() => { });
          }
        });
      } catch { }
    } catch (err) {
      console.error('Error marking account as read on select:', err);
    }
  };

  // Super Admin: Grant account edit access to a user (Valid for 2 minutes)
  const handleGrantEditPermission = async (targetUserId, targetUserName) => {
    try {
      const now = Date.now();
      // 1. Update local permission keys immediately with timestamp
      if (targetUserName) {
        localStorage.setItem(`app_edit_permission_${targetUserName}`, 'approved');
        localStorage.setItem(`app_edit_permission_time_${targetUserName}`, String(now));
      }
      if (targetUserId) {
        localStorage.setItem(`app_edit_permission_${targetUserId}`, 'approved');
        localStorage.setItem(`app_edit_permission_time_${targetUserId}`, String(now));
      }

      // 2. Dispatch approval notification (Valid 2 Mins)
      const approvalNotif = {
        id: `edit_perm_approved_${Date.now()}_${targetUserId}`,
        _id: `edit_perm_approved_${Date.now()}_${targetUserId}`,
        category: 'COMMUNICATION',
        type: 'account_edit_approved',
        title: '🎉 Account Edit Permission Granted (Valid 2 Mins)',
        actionText: 'Permission Granted by Super Admin (Valid 2 Minutes):',
        targetText: `Super Admin (${currentUser?.name || 'Super Admin'}) has approved account edit access for ${targetUserName || 'your account'}. Valid for 2 minutes.`,
        storeId: 'All',
        userId: targetUserId,
        userName: targetUserName,
        createdAt: new Date().toISOString(),
        read: false,
        isRead: false,
      };

      try {
        const notifCache = JSON.parse(localStorage.getItem('app_notifications_cache') || '[]');
        notifCache.unshift(approvalNotif);
        localStorage.setItem('app_notifications_cache', JSON.stringify(notifCache));
        window.dispatchEvent(new CustomEvent('app_notifications_synced', { detail: { notifications: notifCache } }));
      } catch { }

      // 3. Post to backend if available
      fetch(`${API_BASE}/users/${targetUserId}/grant-edit-permission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: currentUser?.name || 'Super Admin' }),
      }).catch(() => { });

      fetch(`${API_BASE}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalNotif),
      }).catch(() => { });

      showToast(`✅ Edit access granted to ${targetUserName || 'user'} (Valid for 2 minutes)`);
      loadData();
    } catch {
      showToast('Network error granting access', 'error');
    }
  };

  // Super Admin: Reject account edit request
  const handleRejectEditPermission = async (targetUserId, targetUserName) => {
    try {
      if (targetUserName) localStorage.setItem(`app_edit_permission_${targetUserName}`, 'rejected');
      if (targetUserId) localStorage.setItem(`app_edit_permission_${targetUserId}`, 'rejected');

      fetch(`${API_BASE}/users/${targetUserId}/reject-edit-permission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => { });

      showToast(`Edit request declined for ${targetUserName || 'user'}`);
      loadData();
    } catch {
      showToast('Network error declining request', 'error');
    }
  };

  // Window event listener for live notification selection
  useEffect(() => {
    const handleSelectNotif = (e) => {
      const detail = e?.detail;
      if (!detail || !detail.id) return;
      setPendingTarget(detail);
    };
    window.addEventListener('app_select_notification', handleSelectNotif);
    return () => window.removeEventListener('app_select_notification', handleSelectNotif);
  }, []);

  // Sync prop changes into pendingTarget
  useEffect(() => {
    if (initialPayload && initialPayload.id) {
      setPendingTarget(initialPayload);
    } else if (initialTargetNotifId) {
      setPendingTarget((prev) => (prev?.id === initialTargetNotifId ? prev : { id: initialTargetNotifId }));
    }
  }, [initialTargetNotifId, initialPayload]);

  // Target notification processing (waits until loading === false and all data is ready)
  useEffect(() => {
    if (!pendingTarget || !pendingTarget.id) return;
    if (loading) return; // Wait until loaded!

    const targetId = pendingTarget.id;
    const targetAccName = (pendingTarget.accountName || pendingTarget.storeName || '').toLowerCase().trim();

    // 1. Mark as read immediately
    handleMarkAsRead(targetId);
    setHighlightedId(targetId);

    // 2. Set category filter to 'all' and clear search so it's guaranteed to be rendered
    setCategoryFilter('all');
    setActivitySearchQuery('');

    // 3. Find the matching notification item in loaded data
    const foundNotif = notifications.find((n) => n.id === targetId || n._id === targetId);

    // 4. Find the matching account
    let matched = null;
    if (foundNotif) {
      matched = userAccounts.find((a) => matchesNotificationToAccount(foundNotif, a));
    }

    if (!matched && targetAccName) {
      matched = userAccounts.find((a) => {
        const aName = (a.name || '').toLowerCase();
        const aLoc = (a.location || '').toLowerCase();
        return (
          aName === targetAccName ||
          aName.includes(targetAccName) ||
          targetAccName.includes(aName) ||
          aLoc === targetAccName ||
          aLoc.includes(targetAccName) ||
          targetAccName.includes(aLoc)
        );
      });
    }

    if (!matched) {
      matched = userAccounts.find((a) => {
        const acts = notifications.filter((n) => matchesNotificationToAccount(n, a));
        return acts.some((n) => n.id === targetId || n._id === targetId);
      });
    }

    if (!matched && userAccounts.length > 0) {
      matched = userAccounts[0];
    }

    if (matched) {
      setSelectedUserKey(matched.key);
    }

    // 5. Activate scroll protection so auto-scroll down won't conflict
    targetScrollActiveRef.current = true;

    // 6. Smooth scroll directly to the notification bubble with retries until rendered
    let attempts = 0;
    const scrollInterval = setInterval(() => {
      attempts++;
      const el = document.getElementById(`notif-bubble-${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        clearInterval(scrollInterval);
        setTimeout(() => {
          targetScrollActiveRef.current = false;
        }, 2500);
      } else if (attempts > 30) {
        clearInterval(scrollInterval);
        targetScrollActiveRef.current = false;
      }
    }, 100);

    // Clear target from localStorage now that it's consumed
    try {
      localStorage.removeItem('app_target_notification');
    } catch { }

    const timer = setTimeout(() => {
      setHighlightedId(null);
    }, 6000);

    return () => {
      clearInterval(scrollInterval);
      clearTimeout(timer);
    };
  }, [pendingTarget, loading, notifications, userAccounts, matchesNotificationToAccount]);

  // Mark all activities for active account as read (UI & localStorage)
  const handleMarkActiveUserAllRead = () => {
    if (!effectiveActiveAccount) return;
    try {
      const readIds = new Set(JSON.parse(localStorage.getItem('app_read_notif_ids') || '[]'));
      const unreadIds = [];
      let updatedList = [];

      setNotifications((prev) => {
        updatedList = prev.map((item) => {
          const matches = matchesNotificationToAccount(item, effectiveActiveAccount);
          if (matches || !isSuperAdmin) {
            const id = item.id || item._id;
            if (id) {
              readIds.add(id);
              unreadIds.push(id);
            }
            return { ...item, read: true, isRead: true };
          }
          return item;
        });
        localStorage.setItem('app_notifications_cache', JSON.stringify(updatedList));
        return updatedList;
      });

      localStorage.setItem('app_read_notif_ids', JSON.stringify([...readIds]));

      window.dispatchEvent(
        new CustomEvent('app_notifications_synced', {
          detail: { readIds: [...readIds], notifications: updatedList },
        })
      );

      try {
        unreadIds.forEach((id) => {
          if (id && !id.startsWith('stock_') && !id.startsWith('dispatch_') && !id.startsWith('inward_') && !id.startsWith('note_')) {
            fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(() => { });
          }
        });
      } catch { }

      showToast(`Activities marked as read`);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  // WhatsApp Web: Delete for me (completely removes from current view)
  const confirmDeleteForMe = (id) => {
    if (!id) return;
    setNotifications((prev) => prev.filter((item) => (item.id || item._id) !== id));
    try {
      const deletedIds = new Set(JSON.parse(localStorage.getItem('app_deleted_notif_ids') || '[]'));
      deletedIds.add(id);
      localStorage.setItem('app_deleted_notif_ids', JSON.stringify([...deletedIds]));
      showToast('Message deleted for you');
      window.dispatchEvent(
        new CustomEvent('app_notifications_synced', {
          detail: { deletedId: id },
        })
      );
    } catch (err) {
      console.error('Failed to delete for me:', err);
    }
    setTargetDeleteNotif(null);
  };

  // WhatsApp Web: Delete for everyone (replaces content with tombstone "You deleted this message")
  const confirmDeleteForEveryone = (id) => {
    if (!id) return;
    setNotifications((prev) =>
      prev.map((item) => {
        if ((item.id || item._id) === id) {
          return { ...item, isDeletedForEveryone: true };
        }
        return item;
      })
    );
    try {
      const deletedEveryoneIds = new Set(JSON.parse(localStorage.getItem('app_deleted_everyone_ids') || '[]'));
      deletedEveryoneIds.add(id);
      localStorage.setItem('app_deleted_everyone_ids', JSON.stringify([...deletedEveryoneIds]));
      showToast('You deleted this message for everyone');
      window.dispatchEvent(
        new CustomEvent('app_notifications_synced', {
          detail: { deletedEveryoneId: id },
        })
      );
    } catch (err) {
      console.error('Failed to delete for everyone:', err);
    }
    setTargetDeleteNotif(null);
  };

  // Delete single activity (UI & localStorage)
  const handleDelete = (id) => {
    confirmDeleteForMe(id);
  };

  // Clear all activities for active account (UI & localStorage)
  const handleClearActiveUserActivities = () => {
    if (!effectiveActiveAccount) return;
    if (!window.confirm(`Clear activities for ${effectiveActiveAccount.name}?`)) return;

    try {
      const deletedIds = new Set(JSON.parse(localStorage.getItem('app_deleted_notif_ids') || '[]'));
      setNotifications((prev) =>
        prev.filter((item) => {
          const matches = matchesNotificationToAccount(item, effectiveActiveAccount);
          if (matches) {
            deletedIds.add(item.id || item._id);
            return false;
          }
          return true;
        })
      );
      localStorage.setItem('app_deleted_notif_ids', JSON.stringify([...deletedIds]));
      showToast(`Activities cleared for ${effectiveActiveAccount.name}`);
    } catch (err) {
      console.error('Failed to clear activities:', err);
    }
  };

  // Send Quick Note/Message from bottom bar (UI, DB persistence & Socket broadcast)
  const handleSendQuickActivity = async (e) => {
    if (e) e.preventDefault();
    if (!quickInput.trim() || !effectiveActiveAccount) return;

    const messageText = quickInput.trim();
    setQuickInput('');

    const isSenderSuperAdmin = isSuperAdmin;
    const targetStore =
      effectiveActiveAccount.location ||
      effectiveActiveAccount.warehouseName ||
      currentUser?.warehouseName ||
      currentUser?.serviceCenter ||
      currentUser?.location ||
      'Main Store';
    const newId = `note_${Date.now()}`;

    const senderName = isSenderSuperAdmin ? (currentUser?.name || 'Super Admin') : (currentUser?.name || effectiveActiveAccount.name);
    const senderRole = isSenderSuperAdmin ? 'Super Admin' : (currentUser?.role || effectiveActiveAccount.role || 'Service Person');
    const senderLocation = currentUser?.warehouseName || currentUser?.serviceCenter || currentUser?.location || effectiveActiveAccount.location || 'Central Headquarters';
    const senderEmail = currentUser?.email || effectiveActiveAccount.email || '';
    const senderId = currentUser?._id || currentUser?.id || null;

    const recipientName = isSenderSuperAdmin ? effectiveActiveAccount.name : 'Super Admin';
    const recipientRole = isSenderSuperAdmin ? (effectiveActiveAccount.role || 'STORE') : 'SUPER_ADMIN';
    const recipientId = isSenderSuperAdmin ? (effectiveActiveAccount.userId || null) : null;

    const notifPayload = {
      senderId,
      senderName,
      senderEmail,
      senderRole,
      recipientId,
      recipientName,
      recipientRole,
      storeId: targetStore,
      userLocation: senderLocation,
      userName: senderName,
      userRole: senderRole,
      userEmail: senderEmail,
      actionText: isSenderSuperAdmin ? 'replied:' : 'sent a note:',
      targetText: messageText,
      title: `💬 Message: ${messageText.slice(0, 30)}${messageText.length > 30 ? '...' : ''}`,
      category: 'COMMUNICATION',
      type: 'message',
      read: false,
      isRead: false,
      avatarInitials: getInitials(senderName),
      avatarColor: getRoleColor(senderRole).color,
      timestamp: formatNotificationTime(new Date().toISOString()),
      createdAt: new Date().toISOString(),
    };

    // Optimistically update in UI immediately
    const optimisticNote = {
      ...notifPayload,
      id: newId,
      _id: newId,
    };

    setNotifications((prev) => [...prev, optimisticNote]);
    scrollToBottom('smooth');

    // Also persist in localStorage custom notes
    try {
      const storedNotes = JSON.parse(localStorage.getItem('app_custom_notes') || '[]');
      storedNotes.push(optimisticNote);
      localStorage.setItem('app_custom_notes', JSON.stringify(storedNotes));
    } catch { }

    // Send HTTP POST to backend to create persistent notification and emit socket broadcast
    try {
      let token = null;
      try {
        token = localStorage.getItem('token') || localStorage.getItem('authToken');
      } catch { }
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/notifications`, {
        method: 'POST',
        headers,
        body: JSON.stringify(notifPayload),
      });

      if (res.ok) {
        const data = await res.json();
        const savedNotif = data.notification;
        if (savedNotif) {
          // Replace optimistic ID with MongoDB _id
          setNotifications((prev) =>
            prev.map((item) =>
              item.id === newId || item._id === newId ? { ...savedNotif, id: savedNotif._id } : item
            )
          );
          // Prune optimistic note from localStorage so it never creates a duplicate
          try {
            const storedNotes = JSON.parse(localStorage.getItem('app_custom_notes') || '[]');
            const filteredNotes = storedNotes.filter((n) => n.id !== newId && n._id !== newId);
            localStorage.setItem('app_custom_notes', JSON.stringify(filteredNotes));
          } catch { }
        }
        showToast(`Message sent to ${recipientName}`);
      } else {
        showToast('Message posted locally', 'info');
      }
    } catch (err) {
      console.warn('Failed to send notification to backend:', err);
      showToast('Message posted locally', 'info');
    }

    // Trigger local sync event so counters and other views update immediately
    window.dispatchEvent(new CustomEvent('app_notifications_synced'));
    scrollToBottom('smooth');
  };

  // Reset notifications (UI & localStorage)
  const handleResetNotifications = (restartFromToday = false) => {
    try {
      localStorage.removeItem('app_deleted_notif_ids');
      localStorage.removeItem('app_deleted_everyone_ids');
      localStorage.removeItem('app_read_notif_ids');
      if (restartFromToday) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        localStorage.setItem('app_notification_start_date', todayStart.toISOString());
        localStorage.removeItem('app_notifications_cache');
      }
      loadData();
      showToast(restartFromToday ? 'Notifications restarted from today' : 'Notifications synchronized');
    } catch (err) {
      console.error('Failed to reset:', err);
    }
  };

  // Add Full Activity Dialog Submission (UI & localStorage)
  const handleCreateNewNotification = () => {
    if (!newNotification.targetText.trim()) {
      showToast('Please enter target item or details', 'warning');
      return;
    }

    const newId = `custom_${Date.now()}`;
    const newActivity = {
      id: newId,
      _id: newId,
      userId: newNotification.userId || null,
      userName: newNotification.userName || 'Super Admin',
      userRole: newNotification.userRole || 'Super Admin',
      userLocation: newNotification.userLocation || '',
      userEmail: newNotification.userEmail || '',
      actionText: newNotification.actionText || 'added a new activity:',
      targetText: newNotification.targetText,
      title: `${newNotification.userName || 'Super Admin'} activity`,
      type: newNotification.type || 'general',
      category: 'ACTIVITY',
      read: false,
      isRead: false,
      avatarInitials: getInitials(newNotification.userName || 'Super Admin'),
      avatarColor: getRoleColor(newNotification.userRole || 'Super Admin').color,
      timestamp: formatNotificationTime(new Date().toISOString()),
      createdAt: new Date().toISOString(),
    };

    try {
      const storedNotes = JSON.parse(localStorage.getItem('app_custom_notes') || '[]');
      storedNotes.push(newActivity);
      localStorage.setItem('app_custom_notes', JSON.stringify(storedNotes));
    } catch { }

    setNotifications((prev) => [...prev, newActivity]);
    setOpenAddDialog(false);
    showToast('Activity added successfully');
  };

  const handleUserSelect = (e) => {
    const selectedId = e.target.value;
    const foundUser = users.find((u) => u._id === selectedId || u.id === selectedId || u.name === selectedId);
    if (foundUser) {
      const loc =
        foundUser.warehouseName ||
        foundUser.assignedLocation ||
        foundUser.serviceCenter ||
        foundUser.staffLocation ||
        foundUser.customerStore ||
        '';
      setNewNotification((prev) => ({
        ...prev,
        userId: foundUser._id || foundUser.id,
        userName: foundUser.name,
        userRole: foundUser.role || 'Staff',
        userLocation: loc,
        userEmail: foundUser.email || '',
      }));
    }
  };

  return (
    <Box
      sx={{
        marginTop: '20px',
        backgroundColor: '#f8fafc',
        height: 'calc(100vh - 65px)',
        maxHeight: 'calc(100vh - 65px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.2,
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Header Section (Fixed at top) */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.2, md: 1.6 },
          px: { xs: 1.5, md: 2.2 },
          borderRadius: '12px',
          bgcolor: '#ffffff',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          flexShrink: 0,
          gap: 1.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: '12px',
              bgcolor: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
            }}
          >
            <NotificationsActiveIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: '#0f172a',
                  fontSize: { xs: '1.15rem', md: '1.4rem' },
                  letterSpacing: '-0.02em',
                }}
              >
                {isSuperAdmin
                  ? 'Super Admin Notifications'
                  : `${effectiveActiveAccount?.name || currentUser?.name || 'Store'} Notifications`}
              </Typography>
              <Chip
                size="small"
                label={
                  isSuperAdmin
                    ? `${userAccounts.length} User Accounts`
                    : `${effectiveActiveAccount?.role || 'Store'}${effectiveActiveAccount?.location ? ` • ${effectiveActiveAccount.location}` : ''}`
                }
                sx={{
                  bgcolor: '#f1f5f9',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  border: '1px solid #e2e8f0',
                }}
              />
              <Chip
                size="small"
                label={
                  getNotificationStartDate().toDateString() === new Date().toDateString()
                    ? '🟢 Today Onward'
                    : `🟢 From ${getNotificationStartDate().toLocaleDateString([], { month: 'short', day: 'numeric' })} Onward`
                }
                sx={{
                  bgcolor: '#ecfdf5',
                  color: '#065f46',
                  fontWeight: 800,
                  fontSize: '0.74rem',
                  border: '1px solid #a7f3d0',
                }}
              />
              {unreadCount > 0 && (
                <Chip
                  size="small"
                  label={`${formatNotificationCount(unreadCount)} Unread`}
                  sx={{
                    bgcolor: '#fee2e2',
                    color: '#dc2626',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    border: '1px solid #fecaca',
                  }}
                />
              )}
            </Box>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.82rem', mt: 0.3 }}>
              {isSuperAdmin
                ? 'Real-time activity logs, stock alerts & WhatsApp-style store communications'
                : 'Incoming product dispatches, stock inward reminders & store activities'}
            </Typography>
          </Box>
        </Box>

        {/* Category Filter Pills in Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
          {(effectiveActiveAccount?.role?.toLowerCase().includes('service') || effectiveActiveAccount?.role?.toLowerCase().includes('engineer') || effectiveActiveAccount?.role?.toLowerCase().includes('technician')
            ? [
              { id: 'all', label: `All Activities (${formatNotificationCount(counts.all)})` },
              { id: 'service', label: `🔧 Services & RMA (${formatNotificationCount(counts.service)})` },
              { id: 'spares', label: `⚙️ Spares (${formatNotificationCount(counts.spares)})` },
              { id: 'communication', label: `💬 Messages (${formatNotificationCount(counts.messages)})` },
            ]
            : [
              { id: 'all', label: `All Activities (${formatNotificationCount(counts.all)})` },
              { id: 'service', label: `🔧 Services & RMA (${formatNotificationCount(counts.service)})` },
              { id: 'low_stock', label: `⚠️ Low Stock (${formatNotificationCount(counts.lowStock)})` },
              { id: 'out_of_stock', label: `🚨 Out of Stock (${formatNotificationCount(counts.outOfStock)})` },
              { id: 'inward', label: `📥 Stock Inward (${formatNotificationCount(counts.inward)})` },
              { id: 'dispatch', label: `📦 Stock Dispatch (${formatNotificationCount(counts.dispatch)})` },
              { id: 'spares', label: `⚙️ Spares (${formatNotificationCount(counts.spares)})` },
              { id: 'accessories', label: `🎧 Accessories (${formatNotificationCount(counts.accessories)})` },
              { id: 'communication', label: `💬 Messages (${formatNotificationCount(counts.messages)})` },
            ]
          ).map((cat) => (
            <Chip
              key={cat.id}
              size="small"
              label={cat.label}
              onClick={() => setCategoryFilter(cat.id)}
              sx={{
                height: 28,
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                bgcolor: categoryFilter === cat.id ? '#0f172a' : '#f1f5f9',
                color: categoryFilter === cat.id ? '#ffffff' : '#334155',
                border: categoryFilter === cat.id ? 'none' : '1px solid #e2e8f0',
                '&:hover': { bgcolor: categoryFilter === cat.id ? '#1e293b' : '#e2e8f0' },
              }}
            />
          ))}
        </Box>

        {/* Global Toolbar Controls (Refresh / Sync only) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Synchronize Data">
            <IconButton
              onClick={handleResetNotifications}
              size="small"
              sx={{
                bgcolor: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#475569',
                borderRadius: '10px',
                p: 0.9,
                '&:hover': { bgcolor: '#f1f5f9' },
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* 2. Top Summary Carousel (Account Cards - Rendered ONLY for Super Admin) */}
      {isSuperAdmin && (
        <Box sx={{ flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8, px: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: 0.6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <PersonIcon sx={{ fontSize: 15, color: '#2563eb' }} />
              User Accounts Summary ({userAccounts.length} Accounts) — Select to open WhatsApp timeline
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
              Scroll horizontal to view all accounts →
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 1.2,
              overflowX: 'auto',
              pb: 0.8,
              pt: 0.2,
              '&::-webkit-scrollbar': { height: 5 },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 4 },
            }}
          >
            {userAccounts.map((u) => {
              const isSelected = effectiveActiveAccount && effectiveActiveAccount.key === u.key;
              const roleStyle = getRoleColor(u.role);

              return (
                <Paper
                  key={u.key}
                  elevation={0}
                  onClick={() => handleSelectAccount(u.key)}
                  sx={{
                    minWidth: 190,
                    maxWidth: 210,
                    p: 1.2,
                    borderRadius: '12px',
                    bgcolor: isSelected ? '#eff6ff' : '#ffffff',
                    border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    boxShadow: isSelected ? '0 4px 14px rgba(37,99,235,0.12)' : '0 1px 3px rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.8,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      borderColor: isSelected ? '#2563eb' : '#cbd5e1',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: roleStyle.color,
                          color: '#ffffff',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                        }}
                      >
                        {getInitials(u.name)}
                      </Avatar>
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: -1,
                          right: -1,
                          width: 9,
                          height: 9,
                          bgcolor: '#22c55e',
                          borderRadius: '50%',
                          border: '2px solid #ffffff',
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        noWrap
                        sx={{
                          fontWeight: 800,
                          color: isSelected ? '#1e3a8a' : '#0f172a',
                          fontSize: '0.84rem',
                        }}
                      >
                        {u.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={u.role}
                        sx={{
                          height: 17,
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          bgcolor: roleStyle.bg,
                          color: roleStyle.color,
                          border: `1px solid ${roleStyle.border}`,
                          px: 0.2,
                        }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.4, borderTop: '1px dashed #f1f5f9' }}>
                    <Typography variant="caption" noWrap sx={{ color: '#64748b', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 0.3, maxWidth: 100 }}>
                      <LocationOnIcon sx={{ fontSize: 11, color: '#94a3b8' }} />
                      {u.location || 'Central'}
                    </Typography>
                    <Chip
                      size="small"
                      label={u.unread > 0 ? `${formatNotificationCount(u.unread)} unread` : `${formatNotificationCount(u.total)} logs`}
                      sx={{
                        height: 17,
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        bgcolor: u.unread > 0 ? '#fee2e2' : (isSelected ? '#dbeafe' : '#f1f5f9'),
                        color: u.unread > 0 ? '#dc2626' : (isSelected ? '#1d4ed8' : '#475569'),
                        border: u.unread > 0 ? '1px solid #fecaca' : 'none',
                      }}
                    />
                  </Box>
                </Paper>
              );
            })}
          </Box>
        </Box>
      )}

      {/* 3. Main Workspace: Dual-Panel for Super Admin / Full Width for Store Login */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          minHeight: 0,
          height: '100%',
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          display: 'flex',
          boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
          bgcolor: '#ffffff',
        }}
      >
        {/* ================= LEFT PANEL: User Accounts List (Rendered ONLY for Super Admin) ================= */}
        {isSuperAdmin && (
          <Box
            sx={{
              width: { xs: '100%', sm: 310, md: 340, lg: 360 },
              borderRight: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#ffffff',
              height: '100%',
              minHeight: 0,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {/* Left Panel Top Header */}
            <Box sx={{ p: 1.5, borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc', flexShrink: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                  Accounts & Chats ({filteredAccounts.length})
                </Typography>
                <Tooltip title="Reload accounts">
                  <IconButton size="small" onClick={loadData} sx={{ color: '#64748b', p: 0.5 }}>
                    <RefreshIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Search Input */}
              <TextField
                fullWidth
                size="small"
                placeholder="Search user, store, or location..."
                value={accountSearchQuery}
                onChange={(e) => setAccountSearchQuery(e.target.value)}
                sx={{
                  bgcolor: '#ffffff',
                  borderRadius: '10px',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8', fontSize: 19 }} />
                    </InputAdornment>
                  ),
                  endAdornment: accountSearchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setAccountSearchQuery('')}>
                        <ClearIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />

              {/* Quick Role / Alert Filter Chips */}
              <Box sx={{ display: 'flex', gap: 0.6, mt: 1.2, overflowX: 'auto', pb: 0.2, '&::-webkit-scrollbar': { display: 'none' } }}>
                {['all', 'low_stock', 'unread', 'warehouse', 'store', 'admin', 'service'].map((rf) => (
                  <Chip
                    key={rf}
                    size="small"
                    label={
                      rf === 'all'
                        ? 'All'
                        : rf === 'low_stock'
                          ? `⚠️ Low Stock (${formatNotificationCount(counts.lowStock)})`
                          : rf === 'unread'
                            ? `🔴 Unread`
                            : rf.toUpperCase()
                    }
                    onClick={() => {
                      setRoleFilter(rf);
                      if (rf === 'low_stock') setCategoryFilter('low_stock');
                      else setCategoryFilter('all');
                    }}
                    sx={{
                      height: 24,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      bgcolor: roleFilter === rf ? (rf === 'low_stock' ? '#d97706' : '#0f172a') : '#ffffff',
                      color: roleFilter === rf ? '#ffffff' : '#475569',
                      border: roleFilter === rf ? 'none' : '1px solid #e2e8f0',
                      '&:hover': { bgcolor: roleFilter === rf ? '#1e293b' : '#f1f5f9' },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Accounts Scrollable List */}
            <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: '#ffffff', minHeight: 0 }}>
              {filteredAccounts.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>
                  <PersonIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    No accounts found
                  </Typography>
                </Box>
              ) : (
                filteredAccounts.map((u) => {
                  const roleStyle = getRoleColor(u.role);
                  const isSelected = effectiveActiveAccount && effectiveActiveAccount.key === u.key;
                  const lastAct = u.lastActivity;

                  return (
                    <Box
                      key={u.key}
                      onClick={() => handleSelectAccount(u.key)}
                      sx={{
                        p: 1.6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        bgcolor: isSelected ? '#f0f7ff' : '#ffffff',
                        borderLeft: isSelected ? '4px solid #2563eb' : '4px solid transparent',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: isSelected ? '#e0f2fe' : '#f8fafc',
                        },
                      }}
                    >
                      {/* User Avatar */}
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          sx={{
                            width: 44,
                            height: 44,
                            bgcolor: roleStyle.color,
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          }}
                        >
                          {getInitials(u.name)}
                        </Avatar>
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 11,
                            height: 11,
                            bgcolor: '#22c55e',
                            borderRadius: '50%',
                            border: '2px solid #ffffff',
                          }}
                        />
                      </Box>

                      {/* Info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.3 }}>
                          <Typography
                            variant="subtitle2"
                            noWrap
                            sx={{
                              fontWeight: isSelected || u.unread > 0 ? 800 : 700,
                              color: isSelected ? '#1e3a8a' : '#0f172a',
                              fontSize: '0.88rem',
                            }}
                          >
                            {u.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 500, flexShrink: 0 }}>
                            {lastAct?.timestamp || 'Active'}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
                          <Chip
                            size="small"
                            label={u.role}
                            sx={{
                              height: 17,
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              bgcolor: roleStyle.bg,
                              color: roleStyle.color,
                              border: `1px solid ${roleStyle.border}`,
                              px: 0.2,
                            }}
                          />
                          {u.location && (
                            <Typography variant="caption" noWrap sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                              • {u.location}
                            </Typography>
                          )}
                        </Box>

                        {/* Last Message Snippet */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography
                            variant="caption"
                            noWrap
                            sx={{
                              color: u.unread > 0 ? '#0f172a' : '#64748b',
                              fontWeight: u.unread > 0 ? 700 : 400,
                              fontSize: '0.74rem',
                              maxWidth: 180,
                            }}
                          >
                            {lastAct ? `${lastAct.actionText}: ${lastAct.targetText}` : 'No recent activities'}
                          </Typography>

                          {u.unread > 0 && (
                            <Chip
                              size="small"
                              label={formatNotificationCount(u.unread)}
                              sx={{
                                height: 18,
                                minWidth: 18,
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                bgcolor: '#2563eb',
                                color: '#ffffff',
                                borderRadius: '9px',
                                px: 0.4,
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        )}

        {/* ================= RIGHT PANEL: WhatsApp Conversation Timeline ================= */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#efeae2',
            height: '100%',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {effectiveActiveAccount ? (
            <>
              {/* Right Panel Header (Fixed) */}
              <Box
                sx={{
                  p: 1.5,
                  px: 2.2,
                  bgcolor: '#ffffff',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  zIndex: 2,
                  flexShrink: 0,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      sx={{
                        width: 42,
                        height: 42,
                        bgcolor: getRoleColor(effectiveActiveAccount.role).color,
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                      }}
                    >
                      {getInitials(effectiveActiveAccount.name)}
                    </Avatar>
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 11,
                        height: 11,
                        bgcolor: '#22c55e',
                        borderRadius: '50%',
                        border: '2px solid #ffffff',
                      }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                        {effectiveActiveAccount.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={effectiveActiveAccount.role}
                        sx={{
                          height: 19,
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          bgcolor: getRoleColor(effectiveActiveAccount.role).bg,
                          color: getRoleColor(effectiveActiveAccount.role).color,
                          border: `1px solid ${getRoleColor(effectiveActiveAccount.role).border}`,
                        }}
                      />
                      {effectiveActiveAccount.location && (
                        <Chip
                          size="small"
                          icon={<LocationOnIcon style={{ fontSize: 11, color: '#64748b' }} />}
                          label={effectiveActiveAccount.location}
                          sx={{ height: 19, fontSize: '0.62rem', fontWeight: 600, bgcolor: '#f1f5f9', color: '#475569' }}
                        />
                      )}
                    </Box>

                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                      Online • {displayedActivities.length} Activities Logged {effectiveActiveAccount.email ? `• ${effectiveActiveAccount.email}` : ''}
                    </Typography>
                  </Box>
                </Box>

                {/* Right Header Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Filter chat..."
                    value={activitySearchQuery}
                    onChange={(e) => setActivitySearchQuery(e.target.value)}
                    sx={{
                      width: 140,
                      bgcolor: '#f8fafc',
                      borderRadius: '8px',
                      '& .MuiOutlinedInput-root': {
                        height: 30,
                        fontSize: '0.76rem',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#94a3b8', fontSize: 15 }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {isSuperAdmin && effectiveActiveAccount && !effectiveActiveAccount.role?.toLowerCase().includes('admin') && (
                    <Tooltip title={`Grant ${effectiveActiveAccount.name} permission to edit their account`}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VpnKeyIcon sx={{ fontSize: 13 }} />}
                        onClick={() => handleGrantEditPermission(effectiveActiveAccount.userId || effectiveActiveAccount.key, effectiveActiveAccount.name)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          height: 30,
                          borderColor: '#bfdbfe',
                          color: '#1d4ed8',
                          bgcolor: '#eff6ff',
                          '&:hover': { bgcolor: '#dbeafe', borderColor: '#93c5fd' },
                        }}
                      >
                        Grant Edit Access
                      </Button>
                    </Tooltip>
                  )}

                  <Tooltip title="Mark all as read">
                    <IconButton size="small" onClick={handleMarkActiveUserAllRead} sx={{ bgcolor: '#f0f9ff', color: '#0284c7', p: 0.6, borderRadius: '8px' }}>
                      <DoneAllIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>

                  {isSuperAdmin && displayedActivities.length > 0 && (
                    <Tooltip title="Clear this account's activities">
                      <IconButton size="small" onClick={handleClearActiveUserActivities} sx={{ bgcolor: '#fee2e2', color: '#ef4444', p: 0.6, borderRadius: '8px' }}>
                        <DeleteSweepIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>

              {/* Chat Canvas Stream (Only this scrolls inside the right panel) */}
              <Box
                ref={chatContainerRef}
                onScroll={handleChatScroll}
                sx={{
                  flex: 1,
                  minHeight: 0,
                  p: { xs: 1.2, sm: 2.2 },
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  scrollBehavior: 'smooth',
                  background: '#efeae2 url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.035\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/svg%3E")',
                }}
              >
                {/* Date Separator Pill */}
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.5 }}>
                  <Chip
                    size="small"
                    label={`${getNotificationStartDate().toDateString() === new Date().toDateString() ? '📅 Today Onward' : `📅 From ${getNotificationStartDate().toLocaleDateString([], { month: 'short', day: 'numeric' })} Onward`} • ${effectiveActiveAccount.name} (${formatNotificationCount(displayedActivities.length)} logs)`}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      color: '#0f172a',
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                </Box>

                {displayedActivities.length === 0 ? (
                  <Box
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      my: 'auto',
                      bgcolor: 'rgba(255, 255, 255, 0.92)',
                      borderRadius: '16px',
                      maxWidth: 400,
                      mx: 'auto',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        bgcolor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1.5,
                      }}
                    >
                      <NotificationsOffIcon sx={{ fontSize: 34, color: '#94a3b8' }} />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>
                      No notifications for {effectiveActiveAccount.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.6, lineHeight: 1.5 }}>
                      Showing notifications from {getNotificationStartDate().toDateString() === new Date().toDateString() ? 'Today' : getNotificationStartDate().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} onward. Previous and new logs will appear here.
                    </Typography>
                  </Box>
                ) : (
                  displayedActivities.map((act, idx) => {
                    const typeConfig = getTypeConfig(act.type, act.actionText, act.title);
                    const isRead = act.read || act.isRead;
                    const isOutOfStock = typeConfig.alertType === 'danger';
                    const isLowStock = typeConfig.alertType === 'warning';
                    const isStockIn = typeConfig.alertType === 'success';
                    const isTargeted = Boolean(highlightedId && (highlightedId === act.id || highlightedId === act._id));

                    const actDateKey = act.createdAt ? new Date(act.createdAt).toDateString() : '';
                    const prevActDateKey = idx > 0 && displayedActivities[idx - 1].createdAt ? new Date(displayedActivities[idx - 1].createdAt).toDateString() : '';
                    const showDateHeader = idx === 0 || actDateKey !== prevActDateKey;

                    const getDateSeparatorLabel = (dateInput) => {
                      if (!dateInput) return 'Today';
                      const d = new Date(dateInput);
                      if (isNaN(d.getTime())) return 'Today';
                      const now = new Date();
                      const isToday =
                        d.getDate() === now.getDate() &&
                        d.getMonth() === now.getMonth() &&
                        d.getFullYear() === now.getFullYear();
                      if (isToday) return `Today • ${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
                      const yesterday = new Date(now);
                      yesterday.setDate(yesterday.getDate() - 1);
                      const isYesterday =
                        d.getDate() === yesterday.getDate() &&
                        d.getMonth() === yesterday.getMonth() &&
                        d.getFullYear() === yesterday.getFullYear();
                      if (isYesterday) return `Yesterday • ${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
                      return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                    };

                    if (act.isDeletedForEveryone) {
                      return (
                        <React.Fragment key={act.id || act._id}>
                          {showDateHeader && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 1, width: '100%' }}>
                              <Chip
                                size="small"
                                label={`📅 ${getDateSeparatorLabel(act.createdAt)}`}
                                sx={{
                                  bgcolor: '#e2e8f0',
                                  color: '#334155',
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                  border: '1px solid #cbd5e1',
                                }}
                              />
                            </Box>
                          )}
                          <Box
                            id={`notif-bubble-${act.id || act._id}`}
                            sx={{
                              display: 'flex',
                              justifyContent: 'flex-start',
                              maxWidth: { xs: '95%', sm: '85%', md: '75%', lg: '650px' },
                              alignSelf: 'flex-start',
                              width: '100%',
                            }}
                          >
                            <Paper
                              elevation={0}
                              sx={{
                                px: 2,
                                py: 1.2,
                                borderRadius: '16px 16px 16px 4px',
                                bgcolor: 'rgba(241, 245, 249, 0.9)',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 1.5,
                                width: '100%',
                                backdropFilter: 'blur(4px)',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: '#ffffff',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                                  '& .tombstone-actions': { opacity: 1 },
                                },
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                <BlockIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#64748b', fontSize: '0.86rem' }}>
                                  You deleted this message
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 500 }}>
                                  {formatNotificationTime(act.createdAt) || 'Just Now'}
                                </Typography>
                                <Box className="tombstone-actions" sx={{ opacity: 0.6, transition: 'opacity 0.2s' }}>
                                  <Tooltip title="Delete for me">
                                    <IconButton
                                      size="small"
                                      onClick={() => setTargetDeleteNotif(act)}
                                      sx={{ p: 0.3, color: '#94a3b8', '&:hover': { color: '#ef4444' } }}
                                    >
                                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </Paper>
                          </Box>
                        </React.Fragment>
                      );
                    }

                    return (
                      <React.Fragment key={act.id || act._id}>
                        {showDateHeader && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', my: 1, width: '100%' }}>
                            <Chip
                              size="small"
                              label={`📅 ${getDateSeparatorLabel(act.createdAt)}`}
                              sx={{
                                bgcolor: '#e2e8f0',
                                color: '#334155',
                                fontWeight: 700,
                                fontSize: '0.72rem',
                                border: '1px solid #cbd5e1',
                              }}
                            />
                          </Box>
                        )}
                        <Box
                          id={`notif-bubble-${act.id || act._id}`}
                          sx={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            maxWidth: { xs: '95%', sm: '85%', md: '75%', lg: '700px' },
                            alignSelf: 'flex-start',
                            width: '100%',
                          }}
                        >
                          {/* WhatsApp Speech Bubble Card */}
                          <Paper
                            elevation={0}
                            onClick={(e) => {
                              if (e.target.closest('button')) return;
                              if (!isRead) {
                                handleMarkAsRead(act.id || act._id);
                              }
                            }}
                            sx={{
                              p: 2,
                              borderRadius: '16px 16px 16px 4px',
                              cursor: !isRead ? 'pointer' : 'default',
                              bgcolor: isOutOfStock ? '#fef2f2' : isLowStock ? '#fffdf0' : isStockIn ? '#ecfdf5' : '#ffffff',
                              boxShadow: isTargeted
                                ? '0 0 0 4px rgba(2, 132, 199, 0.4), 0 10px 28px rgba(2, 132, 199, 0.3)'
                                : '0 2px 8px rgba(0, 0, 0, 0.06)',
                              border: isTargeted
                                ? '3px solid #0284c7'
                                : isOutOfStock
                                  ? '1.5px solid #ef4444'
                                  : isLowStock
                                    ? '1.5px solid #f59e0b'
                                    : isStockIn
                                      ? '1.5px solid #10b981'
                                      : isRead
                                        ? '1px solid #e2e8f0'
                                        : '1.5px solid #3b82f6',
                              position: 'relative',
                              width: '100%',
                              transition: 'all 0.25s ease',
                              animation: isTargeted ? 'targetedNotifPulse 1.6s infinite ease-in-out' : 'none',
                              '@keyframes targetedNotifPulse': {
                                '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(2, 132, 199, 0.7)' },
                                '50%': { transform: 'scale(1.01)', boxShadow: '0 0 0 10px rgba(2, 132, 199, 0)' },
                                '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(2, 132, 199, 0)' },
                              },
                              '&:hover': {
                                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                                '& .bubble-actions': { opacity: 1 },
                              },
                            }}
                          >
                            {/* Bubble Top Line */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                  size="small"
                                  icon={typeConfig.icon}
                                  label={typeConfig.label}
                                  sx={{
                                    height: 22,
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    bgcolor: typeConfig.bg,
                                    color: typeConfig.color,
                                    border: `1px solid ${typeConfig.border}`,
                                    px: 0.4,
                                  }}
                                />
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>
                                  {act.userName || effectiveActiveAccount.name}
                                </Typography>
                                <Box
                                  sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.4,
                                    px: 0.8,
                                    py: 0.15,
                                    bgcolor: '#ecfdf5',
                                    border: '1px solid #a7f3d0',
                                    borderRadius: '4px',
                                  }}
                                >
                                  <StorefrontIcon sx={{ fontSize: 13, color: '#059669' }} />
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#047857', fontSize: '0.72rem' }}>
                                    Store: {act.storeName || act.userLocation || act.storeId || act.location || (effectiveActiveAccount.location || 'Main Store')}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Hover Actions */}
                              <Box className="bubble-actions" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.7, transition: 'opacity 0.2s' }}>
                                {!isRead && (
                                  <Tooltip title="Mark as read">
                                    <IconButton size="small" onClick={() => handleMarkAsRead(act.id || act._id)} sx={{ p: 0.3, color: '#0284c7' }}>
                                      <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Delete message">
                                  <IconButton
                                    size="small"
                                    onClick={() => setTargetDeleteNotif(act)}
                                    sx={{ p: 0.3, color: '#ef4444', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}
                                  >
                                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>

                            {/* Bubble Body */}
                            <Box sx={{ pl: 0.5 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#1e293b',
                                  fontSize: '0.9rem',
                                  lineHeight: 1.5,
                                }}
                              >
                                <span style={{ color: isOutOfStock ? '#991b1b' : isLowStock ? '#92400e' : '#475569', fontWeight: 600 }}>
                                  {act.actionText}
                                </span>{' '}
                                <strong style={{ color: '#0f172a' }}>{act.targetText}</strong>
                              </Typography>

                              {/* Interactive Actions for Super Admin on Account Edit Requests */}
                              {isSuperAdmin && (act.type === 'account_edit_request' || (act.title || '').toLowerCase().includes('account edit request')) && (
                                <Box sx={{ mt: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 16 }} />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleGrantEditPermission(act.userId || act.id, act.userName);
                                    }}
                                    sx={{
                                      bgcolor: '#059669',
                                      '&:hover': { bgcolor: '#047857' },
                                      textTransform: 'none',
                                      fontWeight: 700,
                                      fontSize: '0.76rem',
                                      borderRadius: '7px',
                                      px: 1.5,
                                      py: 0.4,
                                    }}
                                  >
                                    Grant Edit Access (2 Mins)
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRejectEditPermission(act.userId || act.id, act.userName);
                                    }}
                                    sx={{
                                      textTransform: 'none',
                                      fontWeight: 700,
                                      fontSize: '0.76rem',
                                      borderRadius: '7px',
                                      px: 1.5,
                                      py: 0.4,
                                    }}
                                  >
                                    Decline
                                  </Button>
                                </Box>
                              )}
                            </Box>

                            {/* Bubble Footer */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 1.2, pt: 0.8, borderTop: '1px dashed rgba(0,0,0,0.08)' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                <AccessTimeIcon sx={{ fontSize: 13, color: '#0284c7' }} />
                                <Typography variant="caption" sx={{ color: '#0369a1', fontSize: '0.72rem', fontWeight: 700 }}>
                                  Recently Updated: {formatNotificationTime(act.createdAt) || act.timestamp || 'Just Now'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 500 }}>
                                  {new Date(act.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                </Typography>
                                <DoneAllIcon
                                  sx={{
                                    fontSize: 16,
                                    color: isRead ? '#0284c7' : '#94a3b8',
                                  }}
                                />
                              </Box>
                            </Box>
                          </Paper>
                        </Box>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={chatEndRef} style={{ float: 'left', clear: 'both', height: '1px' }} />
              </Box>

              {/* Floating Jump to Latest Button */}
              {showScrollBottomBtn && (
                <Box
                  onClick={() => scrollToBottom('smooth')}
                  sx={{
                    position: 'absolute',
                    bottom: 72,
                    right: { xs: 20, md: 35 },
                    bgcolor: '#0f172a',
                    color: '#ffffff',
                    px: 1.6,
                    py: 0.65,
                    borderRadius: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.6,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    zIndex: 15,
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#1e293b', transform: 'translateY(-2px)' },
                  }}
                >
                  <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                  <span>Latest Notification</span>
                </Box>
              )}

              {/* Bottom Quick Composer Bar (Clean WhatsApp style) */}
              <Box
                component="form"
                onSubmit={handleSendQuickActivity}
                sx={{
                  p: 1.2,
                  px: 2,
                  bgcolor: '#ffffff',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2,
                  flexShrink: 0,
                  boxShadow: '0 -2px 10px rgba(0,0,0,0.02)',
                }}
              >
                {/* Full-Width Message / Note Input */}
                <TextField
                  fullWidth
                  size="small"
                  placeholder={
                    isSuperAdmin
                      ? `Write a message or note for ${effectiveActiveAccount?.name || 'User'}...`
                      : 'Write a message or note for Super Admin...'
                  }
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendQuickActivity(e);
                    }
                  }}
                  sx={{
                    bgcolor: '#f8fafc',
                    borderRadius: '12px',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      height: 42,
                      fontSize: '0.88rem',
                      '& fieldset': { borderColor: '#e2e8f0' },
                      '&:hover fieldset': { borderColor: '#cbd5e1' },
                    },
                  }}
                />

                {/* Send Button */}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!quickInput.trim()}
                  sx={{
                    bgcolor: '#2563eb',
                    color: '#ffffff',
                    minWidth: 46,
                    width: 46,
                    height: 42,
                    borderRadius: '12px',
                    p: 0,
                    boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                    '&:hover': { bgcolor: '#1d4ed8' },
                  }}
                >
                  <SendIcon sx={{ fontSize: 19 }} />
                </Button>
              </Box>
            </>
          ) : (
            <Box sx={{ m: 'auto', textAlign: 'center', p: 4 }}>
              <Typography variant="h6" sx={{ color: '#64748b' }}>
                No notifications found for this account
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Full "+ Add Activity" Dialog (For Super Admin) */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a' }}>
          Record New Activity / Notification
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '10px !important' }}>
          <FormControl fullWidth size="small">
            <InputLabel>Select Target User / Store Account</InputLabel>
            <Select
              label="Select Target User / Store Account"
              value={newNotification.userId || newNotification.userName}
              onChange={handleUserSelect}
            >
              {users.map((u) => (
                <MenuItem key={u._id || u.id || u.name} value={u._id || u.id || u.name}>
                  {u.name} ({u.role || 'Staff'}) — {u.warehouseName || u.assignedLocation || 'Main'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Activity Action Type</InputLabel>
            <Select
              label="Activity Action Type"
              value={newNotification.actionText}
              onChange={(e) => setNewNotification((prev) => ({ ...prev, actionText: e.target.value }))}
            >
              <MenuItem value="added a new product">Added a new product</MenuItem>
              <MenuItem value="dispatched products to">Dispatched products</MenuItem>
              <MenuItem value="verified stock inward for">Verified stock inward with S/N</MenuItem>
              <MenuItem value="⚠️ Low stock alert:">Low stock alert</MenuItem>
              <MenuItem value="🚨 Out of stock alert:">Out of stock alert</MenuItem>
              <MenuItem value="created invoice for">Created sales invoice</MenuItem>
              <MenuItem value="registered service request for">Registered Service / RMA</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Product Details / Message"
            multiline
            rows={3}
            placeholder="e.g. 4U RACK (Quantity: 10 units, S/N: SN1001, SN1002)"
            value={newNotification.targetText}
            onChange={(e) => setNewNotification((prev) => ({ ...prev, targetText: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOpenAddDialog(false)} sx={{ color: '#64748b', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateNewNotification}
            sx={{ bgcolor: '#0f172a', fontWeight: 700, borderRadius: '8px', px: 2.5, '&:hover': { bgcolor: '#1e293b' } }}
          >
            Post Activity
          </Button>
        </DialogActions>
      </Dialog>

      {/* WhatsApp Web Style Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(targetDeleteNotif)}
        onClose={() => setTargetDeleteNotif(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1.5,
            boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
            border: '1px solid rgba(0,0,0,0.06)',
            bgcolor: '#ffffff',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.15rem', color: '#111b21', pb: 1, pt: 1 }}>
          Delete message?
        </DialogTitle>
        <DialogContent sx={{ pb: 2, pt: '4px !important' }}>
          <Typography variant="body2" sx={{ color: '#54656f', fontSize: '0.9rem', lineHeight: 1.5 }}>
            {targetDeleteNotif?.isDeletedForEveryone
              ? 'Do you want to delete this message for yourself?'
              : 'You can delete messages for everyone or just for yourself.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5, pt: 0, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'stretch' }}>
          {!targetDeleteNotif?.isDeletedForEveryone && (
            <Button
              variant="contained"
              onClick={() => confirmDeleteForEveryone(targetDeleteNotif?.id || targetDeleteNotif?._id)}
              sx={{
                bgcolor: '#00a884',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.88rem',
                textTransform: 'none',
                py: 1.1,
                borderRadius: '24px',
                boxShadow: '0 2px 8px rgba(0, 168, 132, 0.25)',
                '&:hover': {
                  bgcolor: '#008f6f',
                },
              }}
            >
              Delete for everyone
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={() => confirmDeleteForMe(targetDeleteNotif?.id || targetDeleteNotif?._id)}
            sx={{
              borderColor: '#e2e8f0',
              color: '#111b21',
              fontWeight: 600,
              fontSize: '0.88rem',
              textTransform: 'none',
              py: 1.1,
              borderRadius: '24px',
              bgcolor: '#f8fafc',
              '&:hover': {
                borderColor: '#cbd5e1',
                bgcolor: '#f1f5f9',
              },
            }}
          >
            Delete for me
          </Button>
          <Button
            onClick={() => setTargetDeleteNotif(null)}
            sx={{
              color: '#54656f',
              fontWeight: 600,
              fontSize: '0.88rem',
              textTransform: 'none',
              py: 0.8,
              borderRadius: '24px',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.04)',
              },
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global Toast Snackbar */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3500}
        onClose={() => setToastMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToastMessage('')}
          severity={toastSeverity}
          sx={{ width: '100%', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
