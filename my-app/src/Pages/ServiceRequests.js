import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useUser } from './UserContext';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Card,
  CardContent,
  Stack,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  Avatar
} from '@mui/material';
import {
  Search,
  RotateCcw,
  Barcode,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Phone,
  Calendar,
  Layers,
  Inbox,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  User,
  UserCheck,
  UserX,
  Clock,
  Flame,
  Zap,
  Check
} from 'lucide-react';

const API_BASE = 'https://coloroninventoy.onrender.com/api';

// Avatar & Color Helpers
const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarStyle = (name) => {
  if (!name) return { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
  const palette = [
    { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }, // blue
    { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' }, // purple
    { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' }, // emerald
    { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' }, // rose
    { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' }, // teal
    { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' }, // orange
    { bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe' }, // indigo
    { bg: '#fdf4ff', color: '#a21caf', border: '#f5d0fe' }, // fuchsia
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};

const getPriorityBadge = (priority) => {
  const p = (priority || 'NORMAL').toUpperCase();
  if (p === 'URGENT') {
    return (
      <Chip
        icon={<Flame size={12} color="#dc2626" />}
        label="URGENT"
        size="small"
        sx={{
          fontWeight: 800,
          fontSize: '10.5px',
          backgroundColor: '#fee2e2',
          color: '#b91c1c',
          border: '1px solid #fca5a5',
          height: 22,
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.75 },
          },
        }}
      />
    );
  }
  if (p === 'HIGH') {
    return (
      <Chip
        icon={<Zap size={12} color="#ea580c" />}
        label="HIGH"
        size="small"
        sx={{
          fontWeight: 800,
          fontSize: '10.5px',
          backgroundColor: '#ffedd5',
          color: '#c2410c',
          border: '1px solid #fdba74',
          height: 22
        }}
      />
    );
  }
  if (p === 'LOW') {
    return (
      <Chip
        label="LOW"
        size="small"
        sx={{
          fontWeight: 700,
          fontSize: '10.5px',
          backgroundColor: '#f1f5f9',
          color: '#64748b',
          border: '1px solid #e2e8f0',
          height: 22
        }}
      />
    );
  }
  return (
    <Chip
      label="NORMAL"
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: '10.5px',
        backgroundColor: '#e0f2fe',
        color: '#0369a1',
        border: '1px solid #bae6fd',
        height: 22
      }}
    />
  );
};

export default function ServiceRequests({ onOpenRaiseService, onOpenRMADetails, user: userProp }) {
  const { user: contextUser } = useUser();
  const user = userProp || contextUser || (() => {
    try {
      const stored = localStorage.getItem('user') || localStorage.getItem('userData');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const activeStore = (
    user?.assignedLocation ||
    user?.warehouseName ||
    user?.serviceCenter ||
    user?.staffLocation ||
    user?.customerStore ||
    user?.role ||
    ''
  );

  const roleLower = (user?.role || '').toLowerCase().trim();
  const isSuperAdmin = ['admin', 'super admin', 'manager', 'headoffice'].includes(roleLower) || roleLower.includes('admin');
  const isServicePerson = !isSuperAdmin && (
    roleLower === 'service person' ||
    roleLower === 'service engineer' ||
    roleLower === 'technician' ||
    roleLower === 'engineer' ||
    (roleLower.includes('service') && !roleLower.includes('center') && !roleLower.includes('shoppee') && !roleLower.includes('shop') && !roleLower.includes('store') && !roleLower.includes('customer'))
  );
  const canManageService = isSuperAdmin || isServicePerson;
  // Service Persons cannot raise tickets - only Stores, Customers, or Super Admins can raise tickets
  const canRaiseService = !isServicePerson;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Check-In Dialog State
  const [checkInDialog, setCheckInDialog] = useState(false);
  const [selectedSR, setSelectedSR] = useState(null);
  const [scannedSerial, setScannedSerial] = useState('');
  const [serialMatchStatus, setSerialMatchStatus] = useState(null); // 'MATCH', 'MISMATCH', null
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(null);

  // Modern In-App Notification / Toast State
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const showToast = (message, severity = 'info') => {
    setToast({ open: true, message, severity });
  };

  const checkInInputRef = useRef(null);

  const fetchServiceRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (!canManageService && activeStore) params.append('storeName', activeStore);
      if (user?.role) params.append('userRole', user.role);
      if (user?.name) params.append('userName', user.name);
      if (user?._id || user?.id) params.append('userId', user._id || user.id);

      const res = await fetch(`${API_BASE}/service/requests?${params.toString()}`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setRequests(result.data);
      }
    } catch (err) {
      console.error('Fetch service requests error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeStore, canManageService, user]);

  useEffect(() => {
    fetchServiceRequests();
  }, [fetchServiceRequests]);

  const handleOpenCheckIn = (sr) => {
    setSelectedSR(sr);
    setScannedSerial('');
    setSerialMatchStatus(null);
    setCheckInSuccess(null);
    setCheckInDialog(true);
    setTimeout(() => checkInInputRef.current?.focus(), 100);
  };

  const handleScanChange = (val) => {
    setScannedSerial(val);
    const expected = (selectedSR?.serialNumber || '').trim().toLowerCase();
    const input = val.trim().toLowerCase();

    if (!input) {
      setSerialMatchStatus(null);
    } else if (input === expected) {
      setSerialMatchStatus('MATCH');
    } else {
      setSerialMatchStatus('MISMATCH');
    }
  };

  const handleCheckInSubmit = async () => {
    if (!selectedSR || !scannedSerial) return;

    if (serialMatchStatus !== 'MATCH') {
      showToast(`Scanned serial does not match expected serial: ${selectedSR.serialNumber}`, 'warning');
      return;
    }

    try {
      setCheckingIn(true);
      const res = await fetch(`${API_BASE}/service/requests/${selectedSR._id}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scannedSerial: scannedSerial.trim(),
          inspectedBy: user?.name || user?.role || 'Store Employee',
          storeName: activeStore
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Check-in failed');
      }

      showToast(`Check-in complete! RMA #${data.data?.rmaNo || 'Generated'} created successfully.`, 'success');
      setCheckInSuccess(data.data);
      fetchServiceRequests();
    } catch (err) {
      console.error('Check-In error:', err);
      showToast('Error during check-in: ' + err.message, 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  // Filtered requests with Allocation Privacy Rule
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      // 🔒 Privacy Allocation Rule:
      // Privacy allocation filter for Service Person:
      // Only show requests specifically allocated to THIS logged-in Service Person by Super Admin
      if (isServicePerson && !isSuperAdmin) {
        const engName = (r.assignedEngineer?.name || '').trim().toLowerCase();
        const myName = (user?.name || '').trim().toLowerCase();
        const myId = user?._id || user?.id;
        const isMine = (engName && engName === myName) || (myId && r.assignedEngineer?.engineerId === myId);
        if (!isMine) return false;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (r.ticketNo || '').toLowerCase().includes(q) ||
        (r.modelNo || '').toLowerCase().includes(q) ||
        (r.serialNumber || '').toLowerCase().includes(q) ||
        (r.customerSnapshot?.name || '').toLowerCase().includes(q) ||
        (r.customerSnapshot?.mobile || '').toLowerCase().includes(q) ||
        (r.complaint?.category || '').toLowerCase().includes(q) ||
        (r.assignedEngineer?.name || '').toLowerCase().includes(q);

      const matchesStatus = !statusFilter || r.currentStatus === statusFilter;
      const matchesStore = !storeFilter || r.storeName === storeFilter;
      return matchesSearch && matchesStatus && matchesStore;
    });
  }, [requests, searchQuery, statusFilter, storeFilter, isServicePerson, isSuperAdmin, user]);

  // Unique stores for filtering
  const uniqueStores = useMemo(() => {
    const stores = requests.map(r => r.storeName).filter(Boolean);
    return [...new Set(stores)];
  }, [requests]);

  // Stats computed on accessible requests
  const stats = useMemo(() => {
    const total = filteredRequests.length;
    const waiting = filteredRequests.filter(r => r.currentStatus === 'SERVICE_REQUEST_CREATED' || !r.rmaId).length;
    const received = filteredRequests.filter(r => r.currentStatus === 'PRODUCT_RECEIVED').length;
    const inService = filteredRequests.filter(r => r.rmaId && r.currentStatus !== 'CLOSED').length;
    return { total, waiting, received, inService };
  }, [filteredRequests]);



  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 3, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' }}>
            <Layers size={26} color="#2563eb" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
              Service Requests (Tickets)
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Manage customer tickets, perform serial check-in, and inward service units for {activeStore}
            </Typography>
          </Box>
        </Box>

        {canRaiseService && (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={onOpenRaiseService}
            sx={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: 800,
              borderRadius: 2.5,
              px: 3,
              py: 1,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              '&:hover': { backgroundColor: '#1d4ed8' }
            }}
          >
            Raise Service Request
          </Button>
        )}
      </Box>

      {/* KPI Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 3, width: '100%' }}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Tickets</Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5 }}>{stats.total}</Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={22} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Waiting Product</Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#d97706', mt: 0.5 }}>{stats.waiting}</Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={22} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Checked In (RMA)</Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#059669', mt: 0.5 }}>{stats.received}</Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Inbox size={22} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Active In Service</Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#7c3aed', mt: 0.5 }}>{stats.inService}</Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={22} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Filter Toolbar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search Ticket No, Customer, Mobile, Model No, or Serial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1, minWidth: 260 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search size={18} color="#64748b" /></InputAdornment>,
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}><X size={16} /></IconButton>
                </InputAdornment>
              ) : null,
              sx: { borderRadius: 2, backgroundColor: '#f8fafc', fontSize: '14px' }
            }}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              displayEmpty
              sx={{ borderRadius: 2, backgroundColor: '#f8fafc', fontSize: '14px' }}
            >
              <MenuItem value="">All Stores</MenuItem>
              {uniqueStores.map(store => (
                <MenuItem key={store} value={store}>{store}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {(searchQuery || statusFilter || storeFilter) && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<RotateCcw size={14} />}
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
                setStoreFilter('');
              }}
              sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b' }}
            >
              Reset
            </Button>
          )}
        </Box>
      </Paper>

      {/* Main Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>Ticket No</TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>Customer Details</TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>Product Model & Serial</TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>Store</TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>Priority</TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>Assigned Technician</TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>Warranty</TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>Complaint</TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>Status</TableCell>
                <TableCell align="right" sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8, pr: 3 }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="#64748b">Loading service requests...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <Layers size={36} color="#cbd5e1" />
                    <Typography variant="subtitle2" fontWeight={700} color="#334155" sx={{ mt: 1 }}>
                      No service requests found
                    </Typography>
                    <Typography variant="caption" color="#64748b">
                      {canRaiseService
                        ? "Click 'Raise Service Request' above to create a new ticket"
                        : "No service requests currently pending check-in"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((r) => {
                  return (
                    <TableRow key={r._id} hover sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                      {/* Ticket No */}
                      <TableCell sx={{ py: 1.8 }}>
                        <Chip
                          label={r.ticketNo}
                          size="small"
                          sx={{ fontWeight: 900, fontFamily: 'monospace', fontSize: '12px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
                        />
                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.3, fontSize: '11px' }}>
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}
                        </Typography>
                      </TableCell>

                      {/* Customer */}
                      <TableCell sx={{ py: 1.8 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                          {r.customerSnapshot?.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                          <Phone size={12} color="#16a34a" />
                          <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>
                            {r.customerSnapshot?.mobile}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Product & Serial */}
                      <TableCell sx={{ py: 1.8 }}>
                        <Typography variant="body2" fontWeight={800} sx={{ color: '#0f172a' }}>
                          {r.modelNo}
                        </Typography>
                        <Chip
                          icon={<Barcode size={12} />}
                          label={r.serialNumber}
                          size="small"
                          sx={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, backgroundColor: '#f1f5f9', height: 20, mt: 0.3 }}
                        />
                      </TableCell>

                      {/* Store */}
                      <TableCell sx={{ py: 1.8 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#475569' }}>
                          {r.storeName}
                        </Typography>
                      </TableCell>

                      {/* Priority */}
                      <TableCell sx={{ py: 1.8 }}>
                        {getPriorityBadge(r.priority)}
                      </TableCell>

                      {/* Assigned Technician */}
                      <TableCell sx={{ py: 1.8 }}>
                        {r.assignedEngineer?.name ? (
                          (() => {
                            const avatarStyle = getAvatarStyle(r.assignedEngineer.name);
                            return (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    backgroundColor: avatarStyle.bg,
                                    color: avatarStyle.color,
                                    border: `1.5px solid ${avatarStyle.border}`,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                  }}
                                >
                                  {getInitials(r.assignedEngineer.name)}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '13px', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                                    {r.assignedEngineer.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px', fontWeight: 500, display: 'block', mt: 0.2 }}>
                                    Service Engineer
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          })()
                        ) : r.rmaNo ? (
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8, px: 1.2, py: 0.5, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                            <UserX size={13} color="#94a3b8" />
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '11px' }}>
                              Open Pool
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8, px: 1.2, py: 0.5, borderRadius: 2, backgroundColor: '#fffbeb', border: '1px solid #fef3c7' }}>
                            <Clock size={13} color="#d97706" />
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#b45309', fontSize: '11px' }}>
                              Awaiting Check-in
                            </Typography>
                          </Box>
                        )}
                      </TableCell>

                      {/* Warranty */}
                      <TableCell sx={{ py: 1.8 }}>
                        <Chip
                          icon={r.warranty?.status === 'IN_WARRANTY' ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                          label={r.warranty?.status === 'IN_WARRANTY' ? 'In Warranty' : 'Out of Warranty'}
                          size="small"
                          sx={{
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: r.warranty?.status === 'IN_WARRANTY' ? '#dcfce7' : '#fef3c7',
                            color: r.warranty?.status === 'IN_WARRANTY' ? '#15803d' : '#b45309'
                          }}
                        />
                      </TableCell>

                      {/* Complaint */}
                      <TableCell sx={{ py: 1.8, maxWidth: 200 }}>
                        <Typography variant="body2" fontWeight={600} sx={{ color: '#334155', fontSize: '13px' }}>
                          {r.complaint?.category}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.complaint?.description}
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ py: 1.8 }}>
                        {r.rmaNo ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                            <Chip
                              label="Product Received"
                              size="small"
                              sx={{ fontSize: '11px', fontWeight: 800, backgroundColor: '#dcfce7', color: '#15803d' }}
                            />
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                              RMA: {r.rmaNo}
                            </Typography>
                          </Box>
                        ) : (
                          <Chip
                            label="Waiting Product"
                            size="small"
                            sx={{ fontSize: '11px', fontWeight: 800, backgroundColor: '#fef3c7', color: '#b45309' }}
                          />
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right" sx={{ py: 1.8, pr: 3 }}>
                        {!r.rmaId ? (
                          canManageService ? (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<Inbox size={14} />}
                              onClick={() => handleOpenCheckIn(r)}
                              sx={{
                                backgroundColor: '#16a34a',
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: '11px',
                                textTransform: 'none',
                                borderRadius: 1.5,
                                px: 2,
                                py: 0.4,
                                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                                '&:hover': { backgroundColor: '#15803d' }
                              }}
                            >
                              Check-In Product
                            </Button>
                          ) : (
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                              Awaiting Inward Check-in
                            </Typography>
                          )
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            endIcon={<ArrowRight size={14} />}
                            onClick={() => onOpenRMADetails && onOpenRMADetails(r.rmaId)}
                            sx={{
                              color: '#2563eb',
                              borderColor: '#bfdbfe',
                              fontWeight: 800,
                              fontSize: '11px',
                              textTransform: 'none',
                              borderRadius: 1.5,
                              px: 2,
                              py: 0.4,
                              '&:hover': { backgroundColor: '#eff6ff', borderColor: '#2563eb' }
                            }}
                          >
                            View RMA Lifecycle
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredRequests.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* CHECK-IN PRODUCT DIALOG */}
      <Dialog
        open={checkInDialog}
        onClose={() => setCheckInDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3.5, p: 0.5, boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)' }
        }}
      >
        <DialogTitle sx={{ p: 2.5, pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2.5, backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <Inbox size={22} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', fontSize: '18px' }}>
                  Product Check-In & RMA Inward
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Scan serial number to verify against ticket & inward service stock (+1)
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setCheckInDialog(false)}><X size={20} /></IconButton>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 3 }}>
          {selectedSR && (
            <Stack spacing={2.5}>
              <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Service Ticket Details:
                </Typography>
                <Typography variant="body1" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5 }}>
                  {selectedSR.ticketNo} — {selectedSR.modelNo}
                </Typography>
                <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.3 }}>
                  Customer: <strong>{selectedSR.customerSnapshot?.name}</strong> ({selectedSR.customerSnapshot?.mobile})
                </Typography>
                <Typography variant="body2" sx={{ color: '#2563eb', fontWeight: 700, mt: 1, fontFamily: 'monospace' }}>
                  Expected Serial: {selectedSR.serialNumber}
                </Typography>
              </Paper>

              <TextField
                fullWidth
                size="small"
                label="Scan Received Product Serial *"
                placeholder="Scan barcode with scanner device..."
                value={scannedSerial}
                onChange={(e) => handleScanChange(e.target.value)}
                inputRef={checkInInputRef}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Barcode size={18} color="#2563eb" /></InputAdornment>,
                  sx: { borderRadius: 2, fontFamily: 'monospace', fontWeight: 700 }
                }}
              />

              {serialMatchStatus === 'MATCH' && (
                <Alert severity="success" icon={<CheckCircle2 size={18} />} sx={{ borderRadius: 2 }}>
                  <strong>Serial Matched!</strong> Ready to inward into service inventory and generate RMA.
                </Alert>
              )}

              {serialMatchStatus === 'MISMATCH' && (
                <Alert severity="error" icon={<AlertCircle size={18} />} sx={{ borderRadius: 2 }}>
                  <strong>Serial Mismatch!</strong> Scanned serial does not match Ticket expected serial ({selectedSR.serialNumber}).
                </Alert>
              )}

              {checkInSuccess && (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  <strong>Check-In Completed!</strong> Generated RMA: <strong>{checkInSuccess.rma?.rmaNo}</strong>. Service Stock +1 recorded.
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" onClick={() => setCheckInDialog(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={serialMatchStatus !== 'MATCH' || checkingIn || !!checkInSuccess}
            onClick={handleCheckInSubmit}
            sx={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              fontWeight: 800,
              borderRadius: 2.5,
              px: 3.5,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
              '&:hover': { backgroundColor: '#15803d' }
            }}
          >
            {checkingIn ? 'Generating RMA...' : 'Confirm Check-In & Generate RMA'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modern In-App Notification / Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: 999999 }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{
            width: '100%',
            minWidth: '340px',
            maxWidth: '680px',
            fontWeight: 700,
            fontSize: '0.92rem',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
