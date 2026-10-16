import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  Typography,
  Alert,
  Divider,
  Grid,
  CircularProgress,
  Chip,
  Tooltip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import SecurityIcon from '@mui/icons-material/Security';
import InputAdornment from '@mui/material/InputAdornment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const ROLE_TEXT_FIELD_CONFIG = {
  Warehouse: {
    label: 'Warehouse Name',
    placeholder: 'Enter warehouse name (e.g. Jaipur Warehouse)',
  },
  'Service Person': {
    label: 'Service Center',
    placeholder: 'Enter service center (e.g. Avadi Service Center)',
  },
  Staff: {
    label: 'Staff Location',
    placeholder: 'Enter staff location (e.g. Jaipur Location)',
  },
  Customer: {
    label: 'Store Name',
    placeholder: 'Enter store name (e.g. CCTV Shoppee Avadi)',
  },
};

const ALL_ROLES = [
  'Super Admin',
  'Admin',
  'Manager',
  'Warehouse',
  'Service Person',
  'Staff',
  'Customer',
];

const API_BASE_PRIMARY =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5002/api'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5002/api');

// Permission valid duration: exactly 2 minutes (120,000 ms)
const PERMISSION_DURATION_MS = 2 * 60 * 1000;

const clearUserEditPermission = (userId, userName) => {
  const keys = [
    `app_edit_permission_${userName || ''}`,
    `app_edit_permission_${userName?.toLowerCase() || ''}`,
    `app_edit_permission_${userId || ''}`,
    `app_edit_permission_time_${userName || ''}`,
    `app_edit_permission_time_${userName?.toLowerCase() || ''}`,
    `app_edit_permission_time_${userId || ''}`,
  ];
  keys.forEach((k) => {
    if (k) {
      try {
        localStorage.removeItem(k);
      } catch {}
    }
  });
};

const formatCountdown = (seconds) => {
  if (seconds == null || isNaN(seconds) || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * EditAccountModal
 *
 * Rules:
 * 1. Exact Super Admin no one to change to Account Super Admin.
 * 2. Non-Super Admin users must request and receive permission from Super Admin before they can edit their account.
 */
export default function EditAccountModal({ open, onClose, user, onSaved }) {
  const isSuperAdmin = Boolean(
    (user?.role || '').toLowerCase().includes('admin') ||
    (user?.name || '').toLowerCase().includes('admin') ||
    (user?.name || '').toLowerCase().includes('lookman ho')
  );

  // Exact Super Admin protection: Non-super admin accounts can never see or select Super Admin
  const availableRoles = isSuperAdmin
    ? ALL_ROLES
    : ALL_ROLES.filter((r) => r.toLowerCase() !== 'super admin');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    newPassword: '',
    confirmPassword: '',
    locationTag: '',
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(isSuperAdmin ? 'approved' : 'none');
  const [timeLeft, setTimeLeft] = useState(null); // remaining time in seconds (max 120s = 2 minutes)
  const expiresAtRef = useRef(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Check permission status from backend, notifications, and localStorage cache with 2-minute validity
  const checkPermissionStatus = useCallback(async (silent = false) => {
    if (isSuperAdmin) {
      setPermissionStatus('approved');
      setTimeLeft(null);
      expiresAtRef.current = null;
      return;
    }
    const userId = user?._id || user?.id || user?.name;
    const userName = user?.name || '';
    if (!userId && !userName) return;

    // Helper: validate and set approved status with countdown timer
    const applyApprovedWindow = (grantTimestamp) => {
      const elapsed = Date.now() - Number(grantTimestamp);
      if (isNaN(elapsed) || elapsed >= PERMISSION_DURATION_MS) {
        clearUserEditPermission(userId, userName);
        setPermissionStatus('expired');
        setTimeLeft(0);
        expiresAtRef.current = null;
        return false;
      }
      const remSec = Math.max(0, Math.ceil((PERMISSION_DURATION_MS - elapsed) / 1000));
      expiresAtRef.current = Date.now() + remSec * 1000;
      setTimeLeft(remSec);
      setPermissionStatus('approved');
      return true;
    };

    // 1. Check direct localStorage keys (name, userId, location)
    const possibleKeys = [
      `app_edit_permission_${userName}`,
      `app_edit_permission_${userName.toLowerCase()}`,
      `app_edit_permission_${userId}`,
      `app_edit_permission_${user?.assignedLocation || ''}`,
      `app_edit_permission_${user?.customerStore || ''}`,
    ];

    for (const k of possibleKeys) {
      const v = localStorage.getItem(k);
      if (v === 'approved') {
        const timeKey = k.replace('app_edit_permission_', 'app_edit_permission_time_');
        const grantTime = localStorage.getItem(timeKey);
        if (grantTime) {
          if (applyApprovedWindow(grantTime)) {
            return;
          }
        }
      }
    }

    // 2. Check local notifications cache for any approval notification for this user
    try {
      const notifCache = JSON.parse(localStorage.getItem('app_notifications_cache') || '[]');
      const approvedNotif = notifCache.find(
        (n) =>
          (n.type === 'account_edit_approved' ||
           (n.title || '').includes('Edit Access Granted') ||
           (n.targetText || '').includes('approved account edit access')) &&
          ((n.userName || '').toLowerCase().includes(userName.toLowerCase()) ||
           (n.targetText || '').toLowerCase().includes(userName.toLowerCase()) ||
           (n.userId && String(n.userId) === String(userId)))
      );
      if (approvedNotif && approvedNotif.createdAt) {
        const notifTime = new Date(approvedNotif.createdAt).getTime();
        if (!isNaN(notifTime)) {
          if (applyApprovedWindow(notifTime)) {
            if (userName) localStorage.setItem(`app_edit_permission_time_${userName}`, String(notifTime));
            if (userId) localStorage.setItem(`app_edit_permission_time_${userId}`, String(notifTime));
            return;
          } else {
            // Notification is older than 2 minutes -> expired!
            clearUserEditPermission(userId, userName);
            setPermissionStatus('expired');
            setTimeLeft(0);
            expiresAtRef.current = null;
            return;
          }
        }
      }
    } catch {}

    if (!silent) setCheckingStatus(true);
    try {
      const res = await fetch(
        `${API_BASE_PRIMARY}/users/${userId}/edit-permission-status?email=${encodeURIComponent(user.email || '')}`
      );
      if (res.ok) {
        const data = await res.json();
        const status = data.editPermissionStatus || 'none';
        if (status === 'approved' && data.expiresInMs > 0) {
          const remSec = Math.max(0, Math.ceil(data.expiresInMs / 1000));
          expiresAtRef.current = Date.now() + remSec * 1000;
          setTimeLeft(remSec);
          setPermissionStatus('approved');
          const calcGrantTime = Date.now() - (PERMISSION_DURATION_MS - data.expiresInMs);
          if (userName) {
            localStorage.setItem(`app_edit_permission_${userName}`, 'approved');
            localStorage.setItem(`app_edit_permission_time_${userName}`, String(calcGrantTime));
          }
          if (userId) {
            localStorage.setItem(`app_edit_permission_${userId}`, 'approved');
            localStorage.setItem(`app_edit_permission_time_${userId}`, String(calcGrantTime));
          }
          if (!silent) {
            setMessage({ type: 'success', text: 'Super Admin granted you edit permission (Valid for 2 minutes)!' });
          }
        } else if (status === 'expired' || (status === 'approved' && (!data.expiresInMs || data.expiresInMs <= 0))) {
          clearUserEditPermission(userId, userName);
          setPermissionStatus('expired');
          setTimeLeft(0);
          expiresAtRef.current = null;
        } else {
          setPermissionStatus(status);
          if (status === 'none' || status === 'rejected') {
            clearUserEditPermission(userId, userName);
            expiresAtRef.current = null;
            setTimeLeft(null);
          }
        }
      }
    } catch {
      // Retain local state on connection failure
    } finally {
      if (!silent) setCheckingStatus(false);
    }
  }, [isSuperAdmin, user]);

  // Populate form and verify permission on modal open
  useEffect(() => {
    if (user && open) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        newPassword: '',
        confirmPassword: '',
        locationTag:
          user.assignedLocation ||
          user.warehouseName ||
          user.serviceCenter ||
          user.staffLocation ||
          user.customerStore ||
          '',
      });

      if (isSuperAdmin) {
        setPermissionStatus('approved');
        setTimeLeft(null);
      } else {
        checkPermissionStatus(true);
      }
    }
    setMessage({ type: '', text: '' });
  }, [user, open, isSuperAdmin, checkPermissionStatus]);

  // Listen for live broadcast when Super Admin grants permission in real time
  useEffect(() => {
    const handleSync = () => {
      if (!isSuperAdmin) {
        checkPermissionStatus(true);
      }
    };
    window.addEventListener('app_notifications_synced', handleSync);
    return () => window.removeEventListener('app_notifications_synced', handleSync);
  }, [isSuperAdmin, checkPermissionStatus]);

  // 1-second countdown ticker when permission is approved (valid for 2 minutes)
  useEffect(() => {
    if (isSuperAdmin || permissionStatus !== 'approved') return;

    const updateTimer = () => {
      if (!expiresAtRef.current) return;
      const remMs = expiresAtRef.current - Date.now();
      const remSec = Math.max(0, Math.ceil(remMs / 1000));
      setTimeLeft(remSec);

      if (remSec <= 0) {
        setPermissionStatus('expired');
        const userId = user?._id || user?.id || user?.name;
        clearUserEditPermission(userId, user?.name);
        expiresAtRef.current = null;
        setMessage({
          type: 'error',
          text: 'Edit permission expired after 2 minutes. Please request permission from Super Admin again.',
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isSuperAdmin, permissionStatus, user]);

  // Poll permission status every 2.5 seconds while modal is open and status is pending
  useEffect(() => {
    if (!open || isSuperAdmin || permissionStatus === 'approved') return;

    const interval = setInterval(() => {
      checkPermissionStatus(true);
    }, 2500);

    return () => clearInterval(interval);
  }, [open, isSuperAdmin, permissionStatus, checkPermissionStatus]);

  const showLocationField = Boolean(ROLE_TEXT_FIELD_CONFIG[formData.role]);

  // Valid only if Super Admin OR approved with active countdown (> 0 seconds remaining)
  const canEdit = isSuperAdmin || (permissionStatus === 'approved' && (timeLeft === null || timeLeft > 0));

  const handleChange = (e) => {
    if (!canEdit) return;
    const { name, value } = e.target;
    // Extra safety: Never allow non-super admin to set role to Super Admin
    if (name === 'role' && value === 'Super Admin' && !isSuperAdmin) {
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Request Edit Permission from Super Admin
  const handleRequestPermission = async () => {
    const userId = user?._id || user?.id || user?.name;
    const userName = user?.name || 'User';
    const userRole = user?.role || 'Staff';
    const userStore = user?.assignedLocation || user?.customerStore || user?.warehouseName || 'Branch';

    setRequestLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');

      // 1. Try server endpoint
      fetch(`${API_BASE_PRIMARY}/users/${userId}/request-edit-permission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email: user?.email }),
      }).catch(() => {});

      // 2. Broadcast notification so Super Admin immediately receives the request in timeline
      const notifItem = {
        id: `edit_perm_req_${Date.now()}_${userId}`,
        _id: `edit_perm_req_${Date.now()}_${userId}`,
        category: 'COMMUNICATION',
        type: 'account_edit_request',
        title: `🔐 Account Edit Request: ${userName}`,
        actionText: 'Requested permission to edit account details:',
        targetText: `${userName} (${userRole}) is requesting Super Admin approval to edit account profile details and credentials.`,
        storeId: userStore,
        userId: userId,
        userName: userName,
        userRole: userRole,
        userLocation: userStore,
        createdAt: new Date().toISOString(),
        read: false,
        isRead: false,
      };

      // Push to backend notifications API
      fetch(`${API_BASE_PRIMARY}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifItem),
      }).catch(() => {});

      // Sync into client-side cache and custom notes
      try {
        const customNotes = JSON.parse(localStorage.getItem('app_custom_notes') || '[]');
        customNotes.unshift(notifItem);
        localStorage.setItem('app_custom_notes', JSON.stringify(customNotes));

        const notifCache = JSON.parse(localStorage.getItem('app_notifications_cache') || '[]');
        notifCache.unshift(notifItem);
        localStorage.setItem('app_notifications_cache', JSON.stringify(notifCache));

        window.dispatchEvent(
          new CustomEvent('app_notifications_synced', {
            detail: { notifications: notifCache },
          })
        );
      } catch {}

      // Mark permission as pending and clear previous active timers
      localStorage.setItem(`app_edit_permission_${userName}`, 'pending');
      localStorage.setItem(`app_edit_permission_${userId}`, 'pending');
      localStorage.removeItem(`app_edit_permission_time_${userName}`);
      localStorage.removeItem(`app_edit_permission_time_${userId}`);
      expiresAtRef.current = null;
      setTimeLeft(null);
      setPermissionStatus('pending');

      setMessage({
        type: 'info',
        text: 'Request sent! Super Admin has been notified. As soon as access is granted, the fields below will unlock automatically.',
      });
    } catch {
      setMessage({ type: 'error', text: 'Failed to send permission request. Please try again.' });
    } finally {
      setRequestLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!canEdit) {
      setMessage({
        type: 'error',
        text:
          permissionStatus === 'expired'
            ? 'Permission Expired: Your 2-minute edit window has ended. Please request permission from Super Admin again.'
            : 'Permission Required: You must receive permission from Super Admin before editing this account.',
      });
      return;
    }

    // Client-side validation
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Full name is required.' });
      return;
    }
    if (!formData.email.trim()) {
      setMessage({ type: 'error', text: 'Email is required.' });
      return;
    }

    // Exact Super Admin protection check
    if (formData.role === 'Super Admin' && !isSuperAdmin) {
      setMessage({ type: 'error', text: 'Unauthorized: Only the exact Super Admin can hold the Super Admin role.' });
      return;
    }

    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'New passwords do not match.' });
        return;
      }
    }

    const userId = user?._id || user?.id;
    if (!userId) {
      setMessage({ type: 'error', text: 'Cannot update: user ID is missing.' });
      return;
    }

    setLoading(true);

    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      editPermissionStatus: isSuperAdmin ? 'approved' : permissionStatus,
      requesterRole: user.role,
      requesterName: user.name,
    };

    if (ROLE_TEXT_FIELD_CONFIG[formData.role]) {
      const loc = (formData.locationTag || '').trim();
      if (formData.role === 'Warehouse') payload.warehouseName = loc;
      else if (formData.role === 'Service Person') payload.serviceCenter = loc;
      else if (formData.role === 'Staff') payload.staffLocation = loc;
      else if (formData.role === 'Customer') payload.customerStore = loc;
      payload.assignedLocation = loc;
    }
    if (formData.newPassword) {
      payload.newPassword = formData.newPassword;
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const targets = [
      `http://localhost:5002/api/users/${userId}`,
      `http://127.0.0.1:5002/api/users/${userId}`,
      `/api/users/${userId}`,
      `${API_BASE_PRIMARY}/users/${userId}`,
    ];

    let dbUpdatedUser = null;
    let dbSuccess = false;
    let errorMsg = '';

    for (const target of targets) {
      try {
        const response = await fetch(target, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          dbUpdatedUser = data.user;
          dbSuccess = true;
          break;
        } else {
          const errData = await response.json().catch(() => ({}));
          errorMsg = errData.error || errorMsg;
        }
      } catch (e) {
        // Try next candidate
      }
    }

    setLoading(false);

    if (dbSuccess && dbUpdatedUser) {
      setMessage({ type: 'success', text: 'Account updated successfully in database!' });
      // Reset one-time permission for non-super admins
      if (!isSuperAdmin) {
        setPermissionStatus('none');
        setTimeLeft(null);
        expiresAtRef.current = null;
        clearUserEditPermission(userId, user?.name);
      }
      setTimeout(() => {
        if (onSaved) onSaved(dbUpdatedUser);
        onClose();
      }, 700);
    } else {
      setMessage({
        type: 'error',
        text: errorMsg || 'Failed to update account. Is the server running?',
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                backgroundColor: isSuperAdmin ? '#ede9fe' : '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isSuperAdmin ? (
                <AdminPanelSettingsIcon sx={{ color: '#7c3aed' }} />
              ) : (
                <PersonOutlineIcon sx={{ color: '#2563eb' }} />
              )}
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Edit Account
                </Typography>
                {isSuperAdmin ? (
                  <Chip
                    size="small"
                    icon={<AdminPanelSettingsIcon sx={{ fontSize: '13px !important' }} />}
                    label="Super Admin"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      bgcolor: '#ede9fe',
                      color: '#6d28d9',
                      border: '1px solid #ddd6fe',
                    }}
                  />
                ) : canEdit ? (
                  <Chip
                    size="small"
                    icon={<AccessTimeIcon sx={{ fontSize: '13px !important' }} />}
                    label={`Access Granted (${formatCountdown(timeLeft)})`}
                    sx={{
                      height: 22,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      bgcolor: (timeLeft || 0) <= 30 ? '#fff1f2' : '#ecfdf5',
                      color: (timeLeft || 0) <= 30 ? '#e11d48' : '#059669',
                      border: `1px solid ${(timeLeft || 0) <= 30 ? '#fecdd3' : '#a7f3d0'}`,
                    }}
                  />
                ) : permissionStatus === 'expired' ? (
                  <Chip
                    size="small"
                    icon={<HourglassEmptyIcon sx={{ fontSize: '12px !important' }} />}
                    label="Permission Expired"
                    sx={{
                      height: 22,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      bgcolor: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                    }}
                  />
                ) : (
                  <Chip
                    size="small"
                    icon={<SecurityIcon sx={{ fontSize: '12px !important' }} />}
                    label="Protected"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      bgcolor: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                    }}
                  />
                )}
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.82rem' }}>
                {isSuperAdmin
                  ? 'Super Admin full management access'
                  : 'Requires Super Admin permission to edit details & credentials (valid for 2 mins)'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: '#94a3b8' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          {/* Permission Guard Alert for Non-Super Admin */}
          {!isSuperAdmin && (
            <Box sx={{ mb: 2 }}>
              {canEdit ? (
                <Alert
                  severity="success"
                  icon={<CheckCircleOutlineIcon sx={{ fontSize: 22 }} />}
                  sx={{
                    borderRadius: 2,
                    fontSize: '0.84rem',
                    bgcolor: '#ecfdf5',
                    color: '#065f46',
                    border: '1px solid #a7f3d0',
                    '& .MuiAlert-message': { width: '100%' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <strong>✅ Permission Granted by Super Admin (Valid 2 Minutes)</strong>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.3, color: '#047857' }}>
                        You have permission to edit your account details. This permission is <strong>valid for 2 minutes only</strong>.
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.8,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '20px',
                        bgcolor: (timeLeft || 0) <= 30 ? '#ffe4e6' : '#d1fae5',
                        color: (timeLeft || 0) <= 30 ? '#b91c1c' : '#065f46',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        border: `1px solid ${(timeLeft || 0) <= 30 ? '#fda4af' : '#6ee7b7'}`,
                      }}
                    >
                      <AccessTimeIcon sx={{ fontSize: 16 }} />
                      <span>{formatCountdown(timeLeft)} remaining</span>
                    </Box>
                  </Box>
                  <Box sx={{ mt: 1.2, width: '100%', bgcolor: '#d1fae5', borderRadius: 1, height: 4, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        width: `${Math.max(0, Math.min(100, ((timeLeft || 0) / 120) * 100))}%`,
                        height: '100%',
                        bgcolor: (timeLeft || 0) <= 30 ? '#ef4444' : '#10b981',
                        transition: 'width 1s linear, background-color 0.5s ease',
                      }}
                    />
                  </Box>
                </Alert>
              ) : permissionStatus === 'expired' ? (
                <Alert
                  severity="error"
                  icon={<LockOutlinedIcon sx={{ fontSize: 22, color: '#dc2626' }} />}
                  action={
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleRequestPermission}
                      disabled={requestLoading}
                      startIcon={
                        requestLoading ? (
                          <CircularProgress size={13} color="inherit" />
                        ) : (
                          <VpnKeyIcon sx={{ fontSize: 14 }} />
                        )
                      }
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        bgcolor: '#dc2626',
                        '&:hover': { bgcolor: '#b91c1c' },
                        boxShadow: '0 2px 6px rgba(220,38,38,0.25)',
                      }}
                    >
                      {requestLoading ? 'Requesting...' : 'Request Permission Again'}
                    </Button>
                  }
                  sx={{
                    borderRadius: 2,
                    fontSize: '0.82rem',
                    bgcolor: '#fef2f2',
                    color: '#991b1b',
                    border: '1px solid #fecaca',
                    alignItems: 'center',
                  }}
                >
                  ⌛ <strong>Edit Permission Expired:</strong> Your 2-minute edit permission window has ended. To make changes, click to request access again.
                </Alert>
              ) : permissionStatus === 'pending' ? (
                <Alert
                  severity="warning"
                  icon={<HourglassEmptyIcon sx={{ fontSize: 20, animation: 'spin 3s infinite linear' }} />}
                  action={
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() => checkPermissionStatus(false)}
                      disabled={checkingStatus}
                      startIcon={checkingStatus ? <CircularProgress size={13} color="inherit" /> : <RefreshIcon sx={{ fontSize: 14 }} />}
                      sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.74rem' }}
                    >
                      Check Status
                    </Button>
                  }
                  sx={{
                    borderRadius: 2,
                    fontSize: '0.82rem',
                    bgcolor: '#fffbeb',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                  }}
                >
                  ⏳ <strong>Request Pending:</strong> Super Admin has been notified. As soon as Super Admin gives access, the fields will unlock for 2 minutes.
                </Alert>
              ) : (
                <Alert
                  severity="info"
                  icon={<LockOutlinedIcon sx={{ fontSize: 20, color: '#2563eb' }} />}
                  action={
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleRequestPermission}
                      disabled={requestLoading}
                      startIcon={
                        requestLoading ? (
                          <CircularProgress size={13} color="inherit" />
                        ) : (
                          <VpnKeyIcon sx={{ fontSize: 14 }} />
                        )
                      }
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        bgcolor: '#2563eb',
                        '&:hover': { bgcolor: '#1d4ed8' },
                        boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
                      }}
                    >
                      {requestLoading ? 'Requesting...' : 'Request Permission'}
                    </Button>
                  }
                  sx={{
                    borderRadius: 2,
                    fontSize: '0.82rem',
                    bgcolor: '#eff6ff',
                    color: '#1e40af',
                    border: '1px solid #bfdbfe',
                    alignItems: 'center',
                  }}
                >
                  🔒 <strong>Super Admin Permission Required:</strong> To edit your account, you need approval from Super Admin (valid for 2 minutes). Click to request access.
                </Alert>
              )}
            </Box>
          )}

          {message.text && (
            <Alert severity={message.type === 'success' ? 'success' : message.type === 'info' ? 'info' : 'error'} sx={{ mb: 2 }}>
              {message.text}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Full Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading || !canEdit}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Role */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={loading || !canEdit}>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  label="Role"
                  onChange={handleChange}
                  startAdornment={
                    <InputAdornment position="start" sx={{ pl: 1 }}>
                      <BadgeOutlinedIcon color="action" />
                    </InputAdornment>
                  }
                >
                  {availableRoles.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Optional Location text field */}
            {showLocationField && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={ROLE_TEXT_FIELD_CONFIG[formData.role]?.label}
                  placeholder={ROLE_TEXT_FIELD_CONFIG[formData.role]?.placeholder}
                  name="locationTag"
                  value={formData.locationTag}
                  onChange={handleChange}
                  disabled={loading || !canEdit}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOnOutlinedIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            )}

            {/* Email */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading || !canEdit}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Divider */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Security settings (Optional)
                </Typography>
              </Divider>
            </Grid>

            {/* New Password */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Leave blank to keep"
                disabled={loading || !canEdit}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Confirm New Password */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm if changed"
                disabled={loading || !canEdit}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1.5, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!isSuperAdmin && !canEdit && (
              <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LockOutlinedIcon sx={{ fontSize: 13 }} />
                {permissionStatus === 'expired'
                  ? 'Permission expired (2-minute limit reached). Request access again.'
                  : 'Super Admin permission required to save'}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={onClose}
              disabled={loading}
              color="inherit"
              startIcon={<CloseIcon />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Tooltip
              title={
                !canEdit
                  ? permissionStatus === 'expired'
                    ? 'Your 2-minute edit permission has expired. Please request permission again.'
                    : 'You must request and receive permission from Super Admin before editing'
                  : ''
              }
            >
              <span>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || !canEdit}
                  startIcon={
                    loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />
                  }
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 3,
                    bgcolor: canEdit ? '#2563eb' : '#94a3b8',
                    boxShadow: canEdit ? '0 4px 12px rgba(37,99,235,0.25)' : 'none',
                  }}
                >
                  {loading
                    ? 'Saving...'
                    : canEdit && timeLeft !== null
                    ? `Save Changes (${formatCountdown(timeLeft)})`
                    : canEdit
                    ? 'Save Changes'
                    : permissionStatus === 'expired'
                    ? 'Permission Expired'
                    : 'Permission Required'}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
}
