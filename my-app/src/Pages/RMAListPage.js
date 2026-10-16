import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Avatar
} from '@mui/material';
import {
  Wrench,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Truck,
  ShieldCheck,
  ShieldAlert,
  X,
  Check,
  Play,
  Pause,
  Send,
  Eye,
  FileText,
  User,
  UserCheck,
  UserX,
  Flame,
  Zap,
  Barcode,
  Layers,
  DollarSign,
  Activity,
  ArrowRight
} from 'lucide-react';

const API_BASE = 'http://localhost:5002/api';

export default function RMAListPage({ initialOpenRMAId }) {
  const { user } = useUser();
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
  const canManageRMA = isSuperAdmin || isServicePerson;

  const [rmas, setRmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // 360 Detail Modal State
  const [detailModal, setDetailModal] = useState(false);
  const [selectedRMA, setSelectedRMA] = useState(null);
  const [rmaDetails, setRmaDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Modern In-App Toast State
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const showToast = (message, severity = 'info') => {
    setToast({ open: true, message, severity });
  };

  // Action Dialogs
  const [actionDialog, setActionDialog] = useState(null); // 'INSPECT' | 'DIAGNOSE' | 'REPAIR' | 'QC' | 'DISPATCH' | 'ALLOCATE'
  const [actionLoading, setActionLoading] = useState(false);
  const [failureCodes, setFailureCodes] = useState([]);

  // Action Form States
  const [inspectForm, setInspectForm] = useState({
    physicalCondition: 'Good',
    waterDamage: false,
    sealBroken: false,
    powerTest: 'Pass',
    visibleBurn: false,
    complaintReproduced: true,
    result: 'FAULT_CONFIRMED',
    notes: ''
  });

  const [diagForm, setDiagForm] = useState({
    engineerName: '',
    observedFault: '',
    rootCause: '',
    failureCode: '',
    failureDesc: '',
    needSpare: false,
    physicalDamageFound: false,
    techNotes: ''
  });

  const [qcForm, setQcForm] = useState({
    passed: true,
    failureReason: '',
    requireBurnIn: false,
    notes: ''
  });

  const [dispatchForm, setDispatchForm] = useState({
    courierName: 'Professional Courier',
    awbNumber: '',
    trackingUrl: ''
  });

  const [replacementQcForm, setReplacementQcForm] = useState({
    powerTest: 'PASS',
    videoTest: 'PASS',
    functionTest: 'PASS',
    physicalCondition: 'PASS',
    snVerification: 'PASS',
    qcRemarks: ''
  });

  const [servicePersonsList, setServicePersonsList] = useState([]);
  const [allocateForm, setAllocateForm] = useState({
    engineerId: '',
    engineerName: '',
    engineerEmail: '',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    assignmentNotes: ''
  });

  const fetchServicePersons = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (res.ok) {
        const data = await res.json();
        const users = data.users || [];
        const filtered = users.filter((u) => {
          const r = (u.role || '').toLowerCase().trim();
          return r.includes('service') || r.includes('engineer') || r.includes('technician') || r === 'staff';
        });
        setServicePersonsList(filtered);
      }
    } catch (e) {
      console.warn('Failed to fetch service persons:', e);
    }
  }, []);

  const fetchRMAs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (!canManageRMA && activeStore) params.append('storeName', activeStore);
      if (user?.role) params.append('userRole', user.role);
      if (user?.name) params.append('userName', user.name);
      if (user?._id || user?.id) params.append('userId', user._id || user.id);

      const res = await fetch(`${API_BASE}/rma?${params.toString()}`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setRmas(result.data);
      }
    } catch (err) {
      console.error('Fetch RMAs error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeStore, canManageRMA, user]);

  const fetchFailureCodes = async () => {
    try {
      const res = await fetch(`${API_BASE}/rma-masters/failure-codes`);
      const result = await res.json();
      if (result.success) setFailureCodes(result.data || []);
    } catch (err) {
      console.error('Fetch failure codes error:', err);
    }
  };

  useEffect(() => {
    fetchRMAs();
    fetchFailureCodes();
    fetchServicePersons();
  }, [fetchRMAs, fetchServicePersons]);

  const handleAllocateSubmit = async () => {
    if (!selectedRMA) return;
    if (!allocateForm.engineerName) {
      showToast('Please select a Service Person', 'warning');
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/rma/${selectedRMA._id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...allocateForm,
          assignedBy: user?.name || 'Super Admin',
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Service successfully allocated to ${allocateForm.engineerName}!`, 'success');
        setActionDialog(null);
        fetchRMAs();
        handleOpenDetails(data.data);
      } else {
        showToast(data.message || 'Failed to allocate service', 'error');
      }
    } catch (err) {
      console.error('Allocate error:', err);
      showToast('Network error while allocating service', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (initialOpenRMAId && rmas.length > 0) {
      const match = rmas.find(r => r._id === initialOpenRMAId || r.rmaNo === initialOpenRMAId);
      if (match) {
        handleOpenDetails(match);
      }
    }
  }, [initialOpenRMAId, rmas]);

  const handleOpenDetails = async (rma) => {
    setSelectedRMA(rma);
    setActiveTab(0);
    setDetailModal(true);
    try {
      setLoadingDetails(true);
      const res = await fetch(`${API_BASE}/rma/${rma._id}`);
      const data = await res.json();
      if (data.success) {
        setRmaDetails(data.data);
      }
    } catch (err) {
      console.error('Fetch details error:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleInspectSubmit = async () => {
    if (!selectedRMA) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/rma/${selectedRMA._id}/inspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inspectForm,
          inspectedBy: user?.name || user?.role || 'Store Technician'
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionDialog(null);
        fetchRMAs();
        handleOpenDetails(data.data);
      }
    } catch (err) {
      console.error('Inspect error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDiagnoseSubmit = async () => {
    if (!selectedRMA) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/rma/${selectedRMA._id}/diagnosis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...diagForm,
          engineerName: diagForm.engineerName || user?.name || 'Engineer',
          performedBy: user?.name || 'Engineer'
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionDialog(null);
        fetchRMAs();
        handleOpenDetails(data.data);
      }
    } catch (err) {
      console.error('Diagnose error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRepairAction = async (action) => {
    if (!selectedRMA) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/rma/${selectedRMA._id}/repair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          performedBy: user?.name || 'Engineer'
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchRMAs();
        handleOpenDetails(data.data);
      }
    } catch (err) {
      console.error('Repair action error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleQCSubmit = async () => {
    if (!selectedRMA) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/rma/${selectedRMA._id}/qc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...qcForm,
          testedBy: user?.name || 'QC Inspector'
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionDialog(null);
        fetchRMAs();
        handleOpenDetails(data.data);
      }
    } catch (err) {
      console.error('QC error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplacementQCSubmit = async (isPassed) => {
    const currentRMA = rmaDetails?.rma || selectedRMA;
    if (!currentRMA) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/rma/${currentRMA._id}/qc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passed: isPassed,
          tests: {
            power: replacementQcForm.powerTest,
            video: replacementQcForm.videoTest,
            function: replacementQcForm.functionTest,
            physicalCondition: replacementQcForm.physicalCondition,
            snVerification: replacementQcForm.snVerification,
          },
          failureReason: isPassed ? '' : 'Replacement Unit Failed QC Verification Checklist',
          notes: replacementQcForm.qcRemarks || (isPassed ? 'Replacement unit QC verified and ready for dispatch.' : 'Replacement unit failed QC check.'),
          testedBy: user?.name || 'QC Inspector'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Replacement QC inspection saved successfully!', 'success');
        setActionDialog(null);
        await fetchRMAs();
        if (data.data) {
          handleOpenDetails(data.data);
        }
      } else {
        showToast(data.message || 'Error saving replacement QC', 'error');
      }
    } catch (e) {
      console.error('Replacement QC error:', e);
      showToast('Error saving replacement QC', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchSubmit = async () => {
    if (!selectedRMA) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/rma/${selectedRMA._id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dispatchForm,
          performedBy: user?.name || (isServicePerson ? 'Service Person' : 'Dispatch Officer'),
          userRole: user?.role || (isServicePerson ? 'Service Person' : 'Admin')
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Product dispatched successfully!', 'success');
        setActionDialog(null);
        fetchRMAs();
        handleOpenDetails(data.data);
      } else {
        showToast(data.message || 'Dispatch failed', 'error');
      }
    } catch (err) {
      console.error('Dispatch error:', err);
      showToast('Error dispatching product', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestDispatchApproval = async () => {
    if (!selectedRMA) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/rma/${selectedRMA._id}/request-dispatch-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedBy: user?.name || 'Service Person',
          notes: `Repair and QC completed by ${user?.name || 'Service Person'}. Requesting Super Admin approval to dispatch.`
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Dispatch approval request sent to Super Admin for RMA #${selectedRMA.rmaNo}!`, 'success');
        fetchRMAs();
        handleOpenDetails(data.data);
      } else {
        showToast(data.message || 'Failed to request dispatch approval', 'error');
      }
    } catch (err) {
      console.error('Request dispatch approval error:', err);
      showToast('Error requesting dispatch approval', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveDispatchPermission = async (approved) => {
    if (!selectedRMA) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/rma/${selectedRMA._id}/approve-dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved,
          approvedBy: user?.name || 'Super Admin',
          rejectionReason: approved ? '' : 'Dispatch rejected by Super Admin'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || (approved ? 'Dispatch approved successfully!' : 'Dispatch rejected.'), approved ? 'success' : 'info');
        fetchRMAs();
        handleOpenDetails(data.data);
      } else {
        showToast(data.message || 'Failed to update dispatch permission', 'error');
      }
    } catch (err) {
      console.error('Approve dispatch error:', err);
      showToast('Error updating dispatch permission', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Avatar & Color Helpers
  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarStyle = (name) => {
    if (!name) return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
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

  // Unique stores for filtering
  const uniqueStores = useMemo(() => {
    const stores = rmas.map(r => r.storeName).filter(Boolean);
    return [...new Set(stores)];
  }, [rmas]);

  // Filtered RMAs
  const filteredRMAs = useMemo(() => {
    return rmas.filter(r => {
      // 🔒 Privacy Allocation Rule for Service Person:
      // Only show RMAs specifically allocated to THIS logged-in Service Person by Super Admin
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
        (r.rmaNo || '').toLowerCase().includes(q) ||
        (r.ticketNo || '').toLowerCase().includes(q) ||
        (r.modelNo || '').toLowerCase().includes(q) ||
        (r.serialNumber || '').toLowerCase().includes(q) ||
        (r.customerSnapshot?.name || '').toLowerCase().includes(q) ||
        (r.customerSnapshot?.mobile || '').toLowerCase().includes(q) ||
        (r.assignedEngineer?.name || '').toLowerCase().includes(q);

      const matchesStatus = !statusFilter || r.currentStatus === statusFilter;
      const matchesStore = !storeFilter || r.storeName === storeFilter;
      return matchesSearch && matchesStatus && matchesStore;
    });
  }, [rmas, searchQuery, statusFilter, storeFilter, isServicePerson, isSuperAdmin, user]);

  // Status Chip Style Helper
  const getStatusChip = (status) => {
    switch (status) {
      case 'PRODUCT_RECEIVED':
        return <Chip label="Product Received" size="small" sx={{ fontWeight: 800, backgroundColor: '#e0f2fe', color: '#0369a1' }} />;
      case 'FAULT_CONFIRMED':
      case 'UNDER_INITIAL_INSPECTION':
        return <Chip label="Inspection Done" size="small" sx={{ fontWeight: 800, backgroundColor: '#fef3c7', color: '#b45309' }} />;
      case 'READY_FOR_REPAIR':
      case 'UNDER_DIAGNOSIS':
        return <Chip label="Diagnosed" size="small" sx={{ fontWeight: 800, backgroundColor: '#f3e8ff', color: '#7c3aed' }} />;
      case 'UNDER_REPAIR':
        return <Chip label="Under Repair" size="small" sx={{ fontWeight: 800, backgroundColor: '#ffedd5', color: '#c2410c' }} />;
      case 'REPAIR_COMPLETED':
      case 'QC_TESTING':
        return <Chip label="QC Testing" size="small" sx={{ fontWeight: 800, backgroundColor: '#e0e7ff', color: '#4338ca' }} />;
      case 'READY_FOR_DISPATCH':
        return <Chip label="Ready Dispatch" size="small" sx={{ fontWeight: 800, backgroundColor: '#dcfce7', color: '#15803d' }} />;
      case 'DISPATCHED':
      case 'DELIVERED':
      case 'CLOSED':
        return <Chip label="Dispatched / Closed" size="small" sx={{ fontWeight: 800, backgroundColor: '#f1f5f9', color: '#475569' }} />;
      default:
        return <Chip label={status} size="small" sx={{ fontWeight: 800 }} />;
    }
  };

  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Header Banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 3, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' }}>
            <Wrench size={26} color="#2563eb" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
              {canManageRMA ? 'RMA Service Lifecycle & Control Hub' : 'RMA Status & Tracking'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {canManageRMA
                ? 'Complete physical service tracking, diagnosis codes, engineer repairs, QC testing & dispatch'
                : `Check real-time RMA service status and diagnosis updates for ${activeStore}`}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Filter Toolbar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search RMA No, Ticket, Customer, Model No, Serial, or Engineer..."
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

          <FormControl size="small" sx={{ minWidth: 170 }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
              sx={{ borderRadius: 2, backgroundColor: '#f8fafc', fontSize: '14px' }}
            >
              <MenuItem value="">All RMA Stages</MenuItem>
              <MenuItem value="PRODUCT_RECEIVED">Product Received</MenuItem>
              <MenuItem value="FAULT_CONFIRMED">Fault Confirmed</MenuItem>
              <MenuItem value="READY_FOR_REPAIR">Ready for Repair</MenuItem>
              <MenuItem value="UNDER_REPAIR">Under Repair</MenuItem>
              <MenuItem value="REPAIR_COMPLETED">Repair Completed</MenuItem>
              <MenuItem value="READY_FOR_DISPATCH">Ready for Dispatch</MenuItem>
              <MenuItem value="DISPATCHED">Dispatched</MenuItem>
            </Select>
          </FormControl>

          {uniqueStores.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
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
          )}

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
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>Priority</TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>RMA & Ticket No</TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>Customer</TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>Product Model & Serial</TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>Assigned Technician</TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>Repair Type</TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>Current Status</TableCell>
                <TableCell align="right" sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8, pr: 3 }}>Operations</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="#64748b">Loading RMA cases...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredRMAs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Wrench size={36} color="#cbd5e1" />
                    <Typography variant="subtitle2" fontWeight={700} color="#334155" sx={{ mt: 1 }}>
                      No active RMA records found
                    </Typography>
                    <Typography variant="caption" color="#64748b">
                      Check-in products from Service Requests to generate RMA records
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRMAs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((r) => {
                  const priority = (r.priority || 'NORMAL').toUpperCase();
                  const isUrgent = priority === 'URGENT' || priority === 'HIGH';

                  return (
                    <TableRow key={r._id} hover sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                      {/* Priority */}
                      <TableCell sx={{ py: 1.8 }}>
                        <Chip
                          icon={isUrgent ? <Flame size={12} color="#dc2626" /> : undefined}
                          label={priority}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: '10.5px',
                            backgroundColor: priority === 'URGENT' ? '#fee2e2' : priority === 'HIGH' ? '#ffedd5' : '#eff6ff',
                            color: priority === 'URGENT' ? '#dc2626' : priority === 'HIGH' ? '#c2410c' : '#1d4ed8'
                          }}
                        />
                      </TableCell>

                      {/* RMA & Ticket */}
                      <TableCell sx={{ py: 1.8 }}>
                        <Chip
                          label={r.rmaNo}
                          size="small"
                          sx={{ fontWeight: 900, fontFamily: 'monospace', fontSize: '12px', backgroundColor: '#eff6ff', color: '#1d4ed8' }}
                        />
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.3 }}>
                          Ticket: <strong>{r.ticketNo}</strong>
                        </Typography>
                      </TableCell>

                      {/* Customer */}
                      <TableCell sx={{ py: 1.8 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                          {r.customerSnapshot?.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>
                          {r.customerSnapshot?.mobile}
                        </Typography>
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

                      {/* Assigned Service Person */}
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
                                  {r.dueDate ? (
                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '10.5px', mt: 0.2 }}>
                                      Due: {new Date(r.dueDate).toLocaleDateString('en-IN')}
                                    </Typography>
                                  ) : (
                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px', fontWeight: 500, display: 'block', mt: 0.2 }}>
                                      Service Engineer
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            );
                          })()
                        ) : (
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 1.5, backgroundColor: '#fef2f2', border: '1px dashed #fca5a5' }}>
                            <UserX size={12} color="#ef4444" />
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#dc2626', fontSize: '10.5px' }}>
                              Unassigned
                            </Typography>
                          </Box>
                        )}
                      </TableCell>

                      {/* Repair Type */}
                      <TableCell sx={{ py: 1.8 }}>
                        <Chip
                          label={r.chargeable ? 'Chargeable Repair' : 'Warranty (Free)'}
                          size="small"
                          sx={{
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: r.chargeable ? '#fffbeb' : '#ecfdf5',
                            color: r.chargeable ? '#b45309' : '#059669'
                          }}
                        />
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ py: 1.8 }}>
                        {getStatusChip(r.currentStatus)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right" sx={{ py: 1.8, pr: 3 }}>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Eye size={14} />}
                          onClick={() => handleOpenDetails(r)}
                          sx={{
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '11px',
                            textTransform: 'none',
                            borderRadius: 1.5,
                            px: 2,
                            py: 0.4,
                            '&:hover': { backgroundColor: '#1d4ed8' }
                          }}
                        >
                          RMA Details
                        </Button>
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
          count={filteredRMAs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* 360° RMA LIFECYCLE MODAL */}
      <Dialog
        open={detailModal}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setDetailModal(false);
          }
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3.5, p: 0.5, boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)', minHeight: '600px' }
        }}
      >
        <DialogTitle sx={{ p: 2.5, pb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <Wrench size={24} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" fontWeight={900} sx={{ color: '#0f172a', fontSize: '20px' }}>
                    {selectedRMA?.rmaNo}
                  </Typography>
                  {selectedRMA && getStatusChip(selectedRMA.currentStatus)}
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Ticket: <strong>{selectedRMA?.ticketNo}</strong> | Serial: <strong>{selectedRMA?.serialNumber}</strong> | From: <strong>{selectedRMA?.storeName}</strong>
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setDetailModal(false)}><X size={20} /></IconButton>
          </Box>

          <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} sx={{ mt: 2, minHeight: 40 }}>
            <Tab label={canManageRMA ? "Overview & Actions" : "Overview & Status"} sx={{ textTransform: 'none', fontWeight: 700, fontSize: '13px', minHeight: 40 }} />
            <Tab label="Audit Timeline" sx={{ textTransform: 'none', fontWeight: 700, fontSize: '13px', minHeight: 40 }} />
            <Tab label="Inventory Ledger" sx={{ textTransform: 'none', fontWeight: 700, fontSize: '13px', minHeight: 40 }} />
          </Tabs>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 3 }}>
          {loadingDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
          ) : rmaDetails && (
            <>
              {/* TAB 0: Overview & Lifecycle Progression Action Buttons */}
              {activeTab === 0 && (
                <Stack spacing={3}>
                  {/* Action Progression Bar for Super Admin / Service Person vs Read-Only Card for Store */}
                  {(() => {
                    const currentRMA = rmaDetails?.rma || selectedRMA;
                    const isReplacementWorkflow = Boolean(currentRMA?.replacement?.isReplaced) || currentRMA?.resolutionType === 'REPLACEMENT';
                    const isDispatched = ['DISPATCHED', 'DELIVERED', 'CLOSED', 'REPLACED'].includes(currentRMA?.currentStatus) || currentRMA?.replacement?.status === 'DISPATCHED' || Boolean(currentRMA?.dispatch?.dispatchedAt);
                    const myName = (user?.name || '').trim().toLowerCase();
                    const myId = user?._id || user?.id;
                    const assignedEngName = (currentRMA?.assignedEngineer?.name || '').trim().toLowerCase();
                    const assignedEngId = currentRMA?.assignedEngineer?.engineerId;
                    const hasAssignedEngineer = Boolean(assignedEngName);

                    const isAssignedToMe = isServicePerson && (
                      (assignedEngName && (assignedEngName === myName || myName.includes(assignedEngName) || assignedEngName.includes(myName))) ||
                      (myId && assignedEngId && String(assignedEngId) === String(myId)) ||
                      (!assignedEngName)
                    );

                    // Case 0: Dispatched / Delivered / Closed
                    if (isDispatched) {
                      return (
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', flexShrink: 0 }}>
                              <CheckCircle2 size={20} />
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={800} color="#15803d">
                                {isReplacementWorkflow ? '✓ Replacement Product Dispatched' : '✓ Product Dispatched'}
                              </Typography>
                              <Typography variant="caption" color="#475569">
                                {currentRMA?.dispatch?.courierName
                                  ? `Dispatched via ${currentRMA.dispatch.courierName} (AWB: ${currentRMA.dispatch.awbNumber || 'N/A'}) on ${new Date(currentRMA.dispatch.dispatchedAt || currentRMA.updatedAt).toLocaleDateString()}`
                                  : 'Service lifecycle completed. Unit has been dispatched.'}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      );
                    }

                    // Case 1: Store / Customer / Other login (or other non-assigned technician)
                    if (!isSuperAdmin && !isAssignedToMe) {
                      return (
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', flexShrink: 0 }}>
                              <ShieldCheck size={20} />
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={800} color="#15803d">
                                Service Tracking View
                              </Typography>
                              <Typography variant="caption" color="#475569">
                                Unit is currently in <strong>{selectedRMA?.currentStatus?.replace(/_/g, ' ')}</strong> stage. Assigned to: <strong>{assignedEngName || 'Service Desk'}</strong>.
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      );
                    }

                    // Case 2: Super Admin viewing an already ASSIGNED unit that is not ready for dispatch yet
                    // Super Admin cannot take repair actions once assigned to a technician!
                    if (isSuperAdmin && hasAssignedEngineer && !['READY_FOR_DISPATCH'].includes(selectedRMA?.currentStatus) && !(isReplacementWorkflow && currentRMA?.replacement?.qcResult === 'PASSED')) {
                      const isCompleted = ['REPAIR_COMPLETED', 'DISPATCHED', 'DELIVERED', 'CLOSED', 'REPLACED', 'CANCELLED'].includes(selectedRMA?.currentStatus) || Boolean(selectedRMA?.repair?.completedAt);
                      return (
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, backgroundColor: isCompleted ? '#f0fdf4' : '#eff6ff', border: isCompleted ? '1px solid #bbf7d0' : '1px solid #bfdbfe' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: isCompleted ? '#dcfce7' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isCompleted ? '#16a34a' : '#1d4ed8', flexShrink: 0 }}>
                              {isCompleted ? <CheckCircle2 size={20} /> : <User size={20} />}
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={800} color={isCompleted ? '#15803d' : '#1e40af'}>
                                {isCompleted ? 'Service Completed' : `Assigned to Service Person: ${selectedRMA?.assignedEngineer?.name}`}
                              </Typography>
                              <Typography variant="caption" color="#475569">
                                {isCompleted
                                  ? `Service completed and QC verified by ${selectedRMA?.assignedEngineer?.name || 'Service Person'}.`
                                  : `This unit is allocated to ${selectedRMA?.assignedEngineer?.name}. Only the assigned Service Person can start, diagnose, repair, and complete QC. Super Admin will dispatch once completed.`}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      );
                    }

                    // Case 3: Action Bar for Assigned Service Person (or Super Admin on unassigned / ready-for-dispatch units)
                    return (
                      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Lifecycle Actions Available:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1.5 }}>
                          {/* Step 0: Allocate Service Person (Super Admin Only, Unassigned items only) */}
                          {isSuperAdmin && !hasAssignedEngineer && !['REPAIR_COMPLETED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CLOSED', 'REPLACED', 'CANCELLED'].includes(selectedRMA?.currentStatus) && !selectedRMA?.repair?.completedAt && (
                            <Button
                              variant="contained"
                              startIcon={<UserCheck size={16} />}
                              onClick={() => {
                                setAllocateForm({
                                  engineerId: '',
                                  engineerName: '',
                                  engineerEmail: '',
                                  priority: selectedRMA?.priority || 'HIGH',
                                  dueDate: selectedRMA?.dueDate
                                    ? new Date(selectedRMA.dueDate).toISOString().split('T')[0]
                                    : new Date(Date.now() + 86400000).toISOString().split('T')[0],
                                  assignmentNotes: ''
                                });
                                setActionDialog('ALLOCATE');
                              }}
                              sx={{ backgroundColor: '#0284c7', fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                            >
                              Allocate Service Person
                            </Button>
                          )}

                          {/* Step 1: Initial Inspection (Assigned Service Person, or Super Admin if unassigned) */}
                          {['PRODUCT_RECEIVED', 'UNDER_INITIAL_INSPECTION'].includes(selectedRMA?.currentStatus) && (!hasAssignedEngineer ? (isSuperAdmin || isAssignedToMe) : isAssignedToMe) && (
                            <Button
                              variant="contained"
                              onClick={() => setActionDialog('INSPECT')}
                              sx={{ backgroundColor: '#2563eb', fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                            >
                              Record Initial Inspection
                            </Button>
                          )}

                          {/* Step 2: Diagnosis (Assigned Service Person ONLY) */}
                          {isAssignedToMe && ['FAULT_CONFIRMED', 'ALLOCATED', 'ENGINEER_ASSIGNED', 'ACCEPTED', 'UNDER_DIAGNOSIS'].includes(selectedRMA?.currentStatus) && (
                            <Button
                              variant="contained"
                              onClick={() => setActionDialog('DIAGNOSE')}
                              sx={{ backgroundColor: '#7c3aed', fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                            >
                              Engineer Diagnosis & Failure Code
                            </Button>
                          )}

                          {/* Step 3: Repair Actions / Replacement Actions */}
                          {isReplacementWorkflow ? (
                            <>
                              {currentRMA?.replacement?.qcResult !== 'PASSED' ? (
                                isAssignedToMe && (
                                  <Button
                                    variant="contained"
                                    startIcon={<ShieldCheck size={16} />}
                                    onClick={() => {
                                      setReplacementQcForm({
                                        powerTest: 'PASS',
                                        videoTest: 'PASS',
                                        functionTest: 'PASS',
                                        physicalCondition: 'PASS',
                                        snVerification: 'PASS',
                                        qcRemarks: ''
                                      });
                                      setActionDialog('REPLACEMENT_QC');
                                    }}
                                    sx={{ backgroundColor: '#16a34a', fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                                  >
                                    🧪 Perform Replacement QC
                                  </Button>
                                )
                              ) : (
                                <Chip
                                  label="✓ Replacement QC Passed & Ready for Dispatch"
                                  sx={{ fontWeight: 800, backgroundColor: '#dcfce7', color: '#15803d' }}
                                />
                              )}
                            </>
                          ) : (
                            isAssignedToMe && ['READY_FOR_REPAIR', 'UNDER_REPAIR', 'WAITING_SPARE'].includes(selectedRMA?.currentStatus) && (
                              <>
                                {selectedRMA?.currentStatus === 'READY_FOR_REPAIR' && (
                                  <Button
                                    variant="contained"
                                    startIcon={<Play size={16} />}
                                    onClick={() => handleRepairAction('START')}
                                    sx={{ backgroundColor: '#16a34a', fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                                  >
                                    Start Repair
                                  </Button>
                                )}
                                {selectedRMA?.currentStatus === 'WAITING_SPARE' && (
                                  <Box sx={{ width: '100%' }}>
                                    <Alert severity="warning" sx={{ borderRadius: 2, mb: 1.5 }}>
                                      <strong>⏳ Service Paused — Waiting for Spare Parts:</strong> Active repair duration is paused. Once the spare parts arrive, click <strong>"Resume Repair"</strong> to continue servicing this unit before completing the repair.
                                    </Alert>
                                    <Button
                                      variant="contained"
                                      startIcon={<Play size={16} />}
                                      onClick={() => handleRepairAction('RESUME')}
                                      disabled={actionLoading}
                                      sx={{
                                        backgroundColor: '#16a34a',
                                        fontWeight: 800,
                                        textTransform: 'none',
                                        borderRadius: 2,
                                        boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
                                        '&:hover': { backgroundColor: '#15803d' }
                                      }}
                                    >
                                      ▶ Resume Repair
                                    </Button>
                                  </Box>
                                )}
                                {selectedRMA?.currentStatus === 'UNDER_REPAIR' && (
                                  <>
                                    <Button
                                      variant="outlined"
                                      startIcon={<Pause size={16} />}
                                      onClick={() => handleRepairAction('PAUSE')}
                                      sx={{ color: '#d97706', borderColor: '#fde68a', fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
                                    >
                                      Pause (Waiting Spares)
                                    </Button>
                                    <Button
                                      variant="contained"
                                      startIcon={<CheckCircle2 size={16} />}
                                      onClick={() => handleRepairAction('COMPLETE')}
                                      sx={{ backgroundColor: '#059669', fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                                    >
                                      Complete Repair
                                    </Button>
                                  </>
                                )}
                              </>
                            )
                          )}

                          {/* Step 4: QC Testing (Assigned Service Person ONLY, Normal Repair ONLY) */}
                          {!isReplacementWorkflow && isAssignedToMe && ['REPAIR_COMPLETED', 'QC_TESTING'].includes(selectedRMA?.currentStatus) && (
                            <Button
                              variant="contained"
                              onClick={() => setActionDialog('QC')}
                              sx={{ backgroundColor: '#4338ca', fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                            >
                              Record QC Checklist Result
                            </Button>
                          )}

                          {/* Step 5: Dispatch & Super Admin Permission Workflow */}
                          {!isDispatched && (['READY_FOR_DISPATCH'].includes(currentRMA?.currentStatus) || (isReplacementWorkflow && currentRMA?.replacement?.qcResult === 'PASSED')) && (
                            <Box sx={{ width: '100%' }}>
                              {/* Super Admin View */}
                              {isSuperAdmin && (
                                <Stack spacing={1.5} sx={{ width: '100%' }}>
                                  {currentRMA?.dispatchApproval?.status === 'PENDING' && (
                                    <Alert
                                      severity="warning"
                                      sx={{ borderRadius: 2 }}
                                      action={
                                        <Stack direction="row" spacing={1}>
                                          <Button
                                            color="success"
                                            size="small"
                                            variant="contained"
                                            startIcon={<Check size={14} />}
                                            onClick={() => handleApproveDispatchPermission(true)}
                                            disabled={actionLoading}
                                            sx={{ fontWeight: 800, textTransform: 'none' }}
                                          >
                                            Grant Permission
                                          </Button>
                                          <Button
                                            color="error"
                                            size="small"
                                            variant="outlined"
                                            startIcon={<X size={14} />}
                                            onClick={() => handleApproveDispatchPermission(false)}
                                            disabled={actionLoading}
                                            sx={{ fontWeight: 800, textTransform: 'none' }}
                                          >
                                            Reject
                                          </Button>
                                        </Stack>
                                      }
                                    >
                                      <strong>{currentRMA?.dispatchApproval?.requestedBy || 'Service Person'}</strong> requested permission to dispatch this product after completing repair & QC testing.
                                    </Alert>
                                  )}

                                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <Button
                                      variant="contained"
                                      startIcon={<Truck size={16} />}
                                      onClick={() => setActionDialog('DISPATCH')}
                                      sx={{ backgroundColor: '#107c41', fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                                    >
                                      {isReplacementWorkflow ? '🚚 Dispatch Replacement Product (Stock -1)' : 'Direct Super Admin Dispatch (Stock -1)'}
                                    </Button>

                                    {currentRMA?.dispatchApproval?.status !== 'APPROVED' && (
                                      <Button
                                        variant="outlined"
                                        color="success"
                                        startIcon={<UserCheck size={16} />}
                                        onClick={() => handleApproveDispatchPermission(true)}
                                        disabled={actionLoading}
                                        sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                                      >
                                        Grant Dispatch Permission to {currentRMA?.assignedEngineer?.name || 'Service Person'}
                                      </Button>
                                    )}
                                  </Box>
                                </Stack>
                              )}

                              {/* Service Person View */}
                              {isAssignedToMe && (
                                <Box sx={{ width: '100%' }}>
                                  {(currentRMA?.dispatchApproval?.status === 'APPROVED' || isReplacementWorkflow) ? (
                                    <Stack spacing={1.5} sx={{ width: '100%' }}>
                                      <Button
                                        variant="contained"
                                        startIcon={<Truck size={16} />}
                                        onClick={() => setActionDialog('DISPATCH')}
                                        sx={{ backgroundColor: '#107c41', fontWeight: 800, textTransform: 'none', borderRadius: 2, alignSelf: 'flex-start' }}
                                      >
                                        🚚 Dispatch Replacement Product (Stock -1)
                                      </Button>
                                    </Stack>
                                  ) : currentRMA?.dispatchApproval?.status === 'PENDING' ? (
                                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                                      <strong>⏳ Dispatch Permission Requested:</strong> Awaiting Super Admin confirmation. Once Super Admin grants approval, you can dispatch this product.
                                    </Alert>
                                  ) : currentRMA?.dispatchApproval?.status === 'REJECTED' ? (
                                    <Stack spacing={1.5} sx={{ width: '100%' }}>
                                      <Alert severity="error" sx={{ borderRadius: 2 }}>
                                        <strong>❌ Dispatch Request Rejected:</strong> {currentRMA?.dispatchApproval?.rejectionReason || 'Super Admin rejected the dispatch request.'}
                                      </Alert>
                                      <Button
                                        variant="outlined"
                                        color="warning"
                                        startIcon={<Send size={16} />}
                                        onClick={handleRequestDispatchApproval}
                                        disabled={actionLoading}
                                        sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2, alignSelf: 'flex-start' }}
                                      >
                                        Request Dispatch Approval Again
                                      </Button>
                                    </Stack>
                                  ) : (
                                    <Stack spacing={1.5} sx={{ width: '100%' }}>
                                      <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                        <strong>🔒 Dispatch Approval Required:</strong> Service is complete and QC passed. Request Super Admin confirmation to dispatch this product.
                                      </Alert>
                                      <Button
                                        variant="contained"
                                        startIcon={<Send size={16} />}
                                        onClick={handleRequestDispatchApproval}
                                        disabled={actionLoading}
                                        sx={{ backgroundColor: '#0284c7', fontWeight: 800, textTransform: 'none', borderRadius: 2, alignSelf: 'flex-start' }}
                                      >
                                        📨 Request Dispatch Approval from Super Admin
                                      </Button>
                                    </Stack>
                                  )}
                                </Box>
                              )}
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    );
                  })()}

                  {/* Product Replacement (2% Spares Inventory) */}
                  {(rmaDetails.rma.replacement?.isReplaced || rmaDetails.rma.resolutionType === 'REPLACEMENT') && (
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                        <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          PRODUCT REPLACEMENT (2% SPARES INVENTORY)
                        </Typography>
                        <Chip label="✓ PRODUCT REPLACED" size="small" sx={{ fontWeight: 800, backgroundColor: '#dcfce7', color: '#15803d', fontSize: '10px' }} />
                      </Box>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, backgroundColor: '#f0fdf4', border: '1.5px solid #86efac' }}>
                        <Grid container spacing={2} alignItems="center">
                          {/* Defective Original Unit */}
                          <Grid item xs={12} sm={5}>
                            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#ffffff', border: '1px solid #fecaca' }}>
                              <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>
                                🔴 Defective Original Unit
                              </Typography>
                              <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ mt: 0.3 }}>
                                {rmaDetails.rma.replacement?.defectiveModel || rmaDetails.rma.modelNo}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#475569', fontFamily: 'monospace', fontWeight: 700, display: 'block' }}>
                                S/N: {rmaDetails.rma.replacement?.defectiveSerialNumber || rmaDetails.rma.replacement?.oldSerialNumber || rmaDetails.rma.serialNumber || '—'}
                              </Typography>
                            </Box>
                          </Grid>

                          {/* Transition indicator */}
                          <Grid item xs={12} sm={2} sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                              <ArrowRight size={22} color="#16a34a" />
                              <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 800, fontSize: '9px', letterSpacing: '0.05em' }}>
                                REPLACED WITH
                              </Typography>
                            </Box>
                          </Grid>

                          {/* Replacement Unit */}
                          <Grid item xs={12} sm={5}>
                            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#ffffff', border: '1.5px solid #86efac' }}>
                              <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>
                                🟢 Replacement Unit (Spares Stock)
                              </Typography>
                              <Typography variant="subtitle2" fontWeight={800} color="#15803d" sx={{ mt: 0.3 }}>
                                {rmaDetails.rma.replacement?.replacementModel || rmaDetails.rma.modelNo}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#166534', fontFamily: 'monospace', fontWeight: 800, display: 'block' }}>
                                S/N: {rmaDetails.rma.replacement?.replacementSerial || rmaDetails.rma.replacement?.newSerialNumber || '—'}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        <Divider sx={{ my: 1.5, borderColor: '#bbf7d0' }} />

                        <Grid container spacing={1.5}>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="#64748b">Source</Typography>
                            <Typography variant="body2" fontWeight={700} color="#0f172a">
                              {rmaDetails.rma.replacement?.inventorySource || '2% Warranty Spares'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="#64748b">Location</Typography>
                            <Typography variant="body2" fontWeight={700} color="#0f172a">
                              {rmaDetails.rma.replacement?.replacementLocation || 'Main Warehouse'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="#64748b">QC Verification</Typography>
                            <Typography variant="body2" fontWeight={800} color="#16a34a">
                              ✓ {rmaDetails.rma.replacement?.qcResult || 'PASSED'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="#64748b">Replaced By</Typography>
                            <Typography variant="body2" fontWeight={700} color="#0f172a">
                              {rmaDetails.rma.replacement?.replacedBy || rmaDetails.rma.assignedEngineer?.name || 'Service Engineer'}
                            </Typography>
                          </Grid>
                          {rmaDetails.rma.replacement?.reason && (
                            <Grid item xs={12}>
                              <Typography variant="caption" color="#64748b">Replacement Reason:</Typography>
                              <Typography variant="body2" color="#1e293b" fontWeight={600}>
                                {rmaDetails.rma.replacement.reason}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Paper>
                    </Box>
                  )}

                  {/* Summary Grid */}
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                      <Paper elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2.5 }}>
                        <Typography variant="caption" color="#64748b" fontWeight={700}>PRODUCT & WARRANTY</Typography>
                        <Typography variant="body1" fontWeight={800} color="#0f172a" sx={{ mt: 0.5 }}>{rmaDetails.rma.modelNo}</Typography>
                        <Typography variant="body2" color="#475569">Category: {rmaDetails.rma.category || 'N/A'}</Typography>
                        <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 700, display: 'block', mt: 0.5 }}>
                          Serial Number: {rmaDetails.rma.serialNumber}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Paper elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2.5 }}>
                        <Typography variant="caption" color="#64748b" fontWeight={700}>DIAGNOSIS & FAILURE</Typography>
                        <Typography variant="body1" fontWeight={800} color="#0f172a" sx={{ mt: 0.5 }}>
                          {rmaDetails.rma.diagnosis?.failureCode || 'Diagnosis Pending'} {rmaDetails.rma.diagnosis?.failureDesc ? `— ${rmaDetails.rma.diagnosis.failureDesc}` : ''}
                        </Typography>
                        <Typography variant="body2" color="#475569">
                          Root Cause: {rmaDetails.rma.diagnosis?.rootCause || 'N/A'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700, display: 'block', mt: 0.5 }}>
                          Assigned Engineer: {rmaDetails.rma.assignedEngineer?.name || 'Unassigned'}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Stack>
              )}

              {/* TAB 1: Audit History Timeline */}
              {activeTab === 1 && (
                <Stack spacing={2}>
                  {(rmaDetails.history || []).map((h, i) => (
                    <Box key={h._id || i} sx={{ display: 'flex', gap: 2, p: 1.5, borderLeft: '3px solid #2563eb', backgroundColor: '#f8fafc', borderRadius: 1.5 }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                            {h.action}
                          </Typography>
                          {h.toStatus && <Chip label={h.toStatus} size="small" sx={{ fontSize: '10px', height: 18 }} />}
                        </Box>
                        <Typography variant="body2" color="#475569" sx={{ mt: 0.3 }}>{h.notes}</Typography>
                        <Typography variant="caption" color="#94a3b8">
                          {new Date(h.createdAt).toLocaleString()} by <strong>{h.userName}</strong> ({h.userRole})
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}

              {/* TAB 2: Service Inventory Ledger */}
              {activeTab === 2 && (
                <Stack spacing={2}>
                  {(rmaDetails.transactions || []).map((tx, i) => (
                    <Box key={tx._id || i} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={800} color="#0f172a">{tx.transactionType}</Typography>
                        <Typography variant="body2" color="#64748b">{tx.notes}</Typography>
                        <Typography variant="caption" color="#94a3b8">{new Date(tx.createdAt).toLocaleString()} by {tx.performedBy}</Typography>
                      </Box>
                      <Chip
                        label={`${tx.direction === 'IN' ? '+1 IN' : '-1 OUT'}`}
                        sx={{ fontWeight: 900, backgroundColor: tx.direction === 'IN' ? '#dcfce7' : '#fee2e2', color: tx.direction === 'IN' ? '#15803d' : '#b91c1c' }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* INSPECTION ACTION MODAL */}
      <Dialog open={actionDialog === 'INSPECT'} onClose={() => setActionDialog(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Record Initial Inspection</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Inspection Finding Result</InputLabel>
              <Select
                value={inspectForm.result}
                label="Inspection Finding Result"
                onChange={(e) => setInspectForm(p => ({ ...p, result: e.target.value }))}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="FAULT_CONFIRMED">Fault Confirmed (Proceed to Engineer Diagnosis)</MenuItem>
                <MenuItem value="NO_FAULT_FOUND">No Fault Found (NFF - Ready for Dispatch)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="Inspection Notes"
              placeholder="Describe physical condition, power check notes..."
              multiline
              rows={2}
              value={inspectForm.notes}
              onChange={(e) => setInspectForm(p => ({ ...p, notes: e.target.value }))}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setActionDialog(null)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleInspectSubmit} disabled={actionLoading} sx={{ backgroundColor: '#2563eb', fontWeight: 800, borderRadius: 2 }}>
            Save Inspection
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIAGNOSIS ACTION MODAL */}
      <Dialog open={actionDialog === 'DIAGNOSE'} onClose={() => setActionDialog(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Engineer Diagnosis & Failure Code</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Failure Code Master *</InputLabel>
              <Select
                value={diagForm.failureCode}
                label="Failure Code Master *"
                onChange={(e) => {
                  const found = failureCodes.find(f => f.code === e.target.value);
                  setDiagForm(p => ({
                    ...p,
                    failureCode: e.target.value,
                    failureDesc: found ? found.title : '',
                    rootCause: found ? found.suggestedRepair : p.rootCause
                  }));
                }}
                sx={{ borderRadius: 2 }}
              >
                {failureCodes.map(fc => (
                  <MenuItem key={fc.code} value={fc.code}>
                    {fc.code} — {fc.title} ({fc.category})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="Observed Root Cause"
              placeholder="Component or PCB failure root cause..."
              value={diagForm.rootCause}
              onChange={(e) => setDiagForm(p => ({ ...p, rootCause: e.target.value }))}
              InputProps={{ sx: { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              size="small"
              label="Engineer Technical Notes"
              multiline
              rows={2}
              value={diagForm.techNotes}
              onChange={(e) => setDiagForm(p => ({ ...p, techNotes: e.target.value }))}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setActionDialog(null)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleDiagnoseSubmit} disabled={actionLoading} sx={{ backgroundColor: '#7c3aed', fontWeight: 800, borderRadius: 2 }}>
            Save Diagnosis
          </Button>
        </DialogActions>
      </Dialog>

      {/* QC ACTION MODAL */}
      <Dialog open={actionDialog === 'QC'} onClose={() => setActionDialog(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Record Quality Control Result</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>QC Test Result</InputLabel>
              <Select
                value={qcForm.passed ? 'PASS' : 'FAIL'}
                label="QC Test Result"
                onChange={(e) => setQcForm(p => ({ ...p, passed: e.target.value === 'PASS' }))}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="PASS">PASS (Ready for Dispatch / Burn-In)</MenuItem>
                <MenuItem value="FAIL">FAIL (Return to Engineer Under Repair)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="QC Inspector Notes"
              placeholder="Power, video, network parameters check..."
              multiline
              rows={2}
              value={qcForm.notes}
              onChange={(e) => setQcForm(p => ({ ...p, notes: e.target.value }))}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setActionDialog(null)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleQCSubmit} disabled={actionLoading} sx={{ backgroundColor: '#4338ca', fontWeight: 800, borderRadius: 2 }}>
            Save QC Result
          </Button>
        </DialogActions>
      </Dialog>

      {/* DISPATCH ACTION MODAL */}
      <Dialog open={actionDialog === 'DISPATCH'} onClose={() => setActionDialog(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Dispatch Serviced Product</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {(selectedRMA?.replacement?.isReplaced || selectedRMA?.resolutionType === 'REPLACEMENT') && (
              <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f0fdf4', border: '1.5px solid #86efac' }}>
                <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>
                  Product Being Dispatched (2% Spares Replacement)
                </Typography>
                <Typography variant="subtitle2" fontWeight={800} color="#15803d" sx={{ mt: 0.3 }}>
                  Replacement Model: <strong>{selectedRMA?.replacement?.replacementModel || selectedRMA?.modelNo}</strong>
                </Typography>
                <Typography variant="caption" sx={{ color: '#166534', fontFamily: 'monospace', fontWeight: 800, display: 'block' }}>
                  Replacement S/N: {selectedRMA?.replacement?.replacementSerial || selectedRMA?.replacement?.newSerialNumber || '—'}
                </Typography>
                <Typography variant="caption" color="#64748b" sx={{ display: 'block', mt: 0.5 }}>
                  Against RMA: <strong>{selectedRMA?.rmaNo}</strong> • Original Unit: <strong>{selectedRMA?.modelNo} ({selectedRMA?.serialNumber})</strong>
                </Typography>
              </Box>
            )}

            <TextField
              fullWidth
              size="small"
              label="Courier Name / Transport Mode *"
              value={dispatchForm.courierName}
              onChange={(e) => setDispatchForm(p => ({ ...p, courierName: e.target.value }))}
              InputProps={{ sx: { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              size="small"
              label="AWB Tracking Number *"
              placeholder="e.g. AWB987654321 / HANDOVER"
              value={dispatchForm.awbNumber}
              onChange={(e) => setDispatchForm(p => ({ ...p, awbNumber: e.target.value }))}
              InputProps={{ sx: { borderRadius: 2, fontFamily: 'monospace', fontWeight: 700 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setActionDialog(null)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleDispatchSubmit} disabled={actionLoading || !dispatchForm.awbNumber} sx={{ backgroundColor: '#107c41', fontWeight: 800, borderRadius: 2 }}>
            {(selectedRMA?.replacement?.isReplaced || selectedRMA?.resolutionType === 'REPLACEMENT') ? 'Confirm Dispatch of Replacement Product (-1)' : 'Confirm Dispatch & Decrease Stock (-1)'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* REPLACEMENT QC ACTION MODAL */}
      <Dialog open={actionDialog === 'REPLACEMENT_QC'} onClose={() => setActionDialog(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <ShieldCheck size={22} color="#16a34a" />
          Replacement Product Quality Check
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5}>
            {/* Unit Details Card */}
            <Box sx={{ p: 2, borderRadius: 2.5, backgroundColor: '#f0fdf4', border: '1.5px solid #86efac' }}>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="#64748b" fontWeight={700}>REPLACEMENT MODEL</Typography>
                  <Typography variant="subtitle2" fontWeight={800} color="#15803d">
                    {selectedRMA?.replacement?.replacementModel || selectedRMA?.modelNo}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="#64748b" fontWeight={700}>REPLACEMENT S/N</Typography>
                  <Typography variant="subtitle2" fontWeight={800} color="#166534" sx={{ fontFamily: 'monospace' }}>
                    {selectedRMA?.replacement?.replacementSerial || '—'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="#64748b">Source</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0f172a">
                    {selectedRMA?.replacement?.inventorySource || '2% Spares Inventory'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="#64748b">Location</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0f172a">
                    {selectedRMA?.replacement?.replacementLocation || 'Main Warehouse'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Checklist */}
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              MANDATORY QC PARAMETER CHECKS
            </Typography>

            <Stack spacing={1.5}>
              {[
                { key: 'powerTest', label: '1. Power-On Test' },
                { key: 'videoTest', label: '2. Video Output Test' },
                { key: 'functionTest', label: '3. Basic Functional Test' },
                { key: 'physicalCondition', label: '4. Physical Condition Check' },
                { key: 'snVerification', label: '5. Serial Number Verification' }
              ].map((item) => (
                <Box key={item.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Typography variant="body2" fontWeight={700} color="#1e293b">{item.label}</Typography>
                  <FormControl size="small" sx={{ minWidth: 110 }}>
                    <Select
                      value={replacementQcForm[item.key]}
                      onChange={(e) => setReplacementQcForm(p => ({ ...p, [item.key]: e.target.value }))}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 800,
                        backgroundColor: replacementQcForm[item.key] === 'PASS' ? '#dcfce7' : '#fee2e2',
                        color: replacementQcForm[item.key] === 'PASS' ? '#15803d' : '#dc2626'
                      }}
                    >
                      <MenuItem value="PASS" sx={{ fontWeight: 800, color: '#15803d' }}>✓ PASS</MenuItem>
                      <MenuItem value="FAIL" sx={{ fontWeight: 800, color: '#dc2626' }}>✗ FAIL</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              ))}
            </Stack>

            <TextField
              fullWidth
              size="small"
              label="QC Inspector Remarks"
              placeholder="Replacement unit tested and confirmed fully functional..."
              multiline
              rows={2}
              value={replacementQcForm.qcRemarks}
              onChange={(e) => setReplacementQcForm(p => ({ ...p, qcRemarks: e.target.value }))}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleReplacementQCSubmit(false)}
            disabled={actionLoading}
            sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none' }}
          >
            ❌ QC Failed – Select Another Unit
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setActionDialog(null)} color="inherit">Cancel</Button>
            <Button
              variant="contained"
              onClick={() => handleReplacementQCSubmit(true)}
              disabled={actionLoading || Object.values(replacementQcForm).some(val => val === 'FAIL')}
              sx={{ backgroundColor: '#16a34a', fontWeight: 800, borderRadius: 2, textTransform: 'none' }}
            >
              ✅ PASS QC & READY FOR DISPATCH
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* ALLOCATE SERVICE PERSON MODAL */}
      <Dialog open={actionDialog === 'ALLOCATE'} onClose={() => setActionDialog(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <UserCheck size={22} color="#2563eb" />
          Allocate Service Person & Priority
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Select Service Person</InputLabel>
              <Select
                value={allocateForm.engineerName}
                label="Select Service Person"
                onChange={(e) => {
                  const sel = e.target.value;
                  const matched = servicePersonsList.find(u => u.name === sel);
                  setAllocateForm(p => ({
                    ...p,
                    engineerName: sel,
                    engineerId: matched?._id || matched?.id || '',
                    engineerEmail: matched?.email || ''
                  }));
                }}
                sx={{ borderRadius: 2 }}
              >
                {servicePersonsList.length === 0 ? (
                  <MenuItem value="" disabled>No registered Service Persons</MenuItem>
                ) : (
                  servicePersonsList.map(u => (
                    <MenuItem key={u._id || u.email} value={u.name}>
                      {u.name} ({u.serviceCenter || u.assignedLocation || u.role})
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Priority Level</InputLabel>
              <Select
                value={allocateForm.priority}
                label="Priority Level"
                onChange={(e) => setAllocateForm(p => ({ ...p, priority: e.target.value }))}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="URGENT">🔴 URGENT (Critical / Same Day)</MenuItem>
                <MenuItem value="HIGH">🔴 HIGH (Priority Service)</MenuItem>
                <MenuItem value="NORMAL">🟠 NORMAL (Standard Turnaround)</MenuItem>
                <MenuItem value="LOW">🟢 LOW (Routine / General)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="Target Due Date"
              type="date"
              value={allocateForm.dueDate}
              onChange={(e) => setAllocateForm(p => ({ ...p, dueDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              size="small"
              multiline
              rows={2.5}
              label="Instructions / Special Notes for Service Person"
              placeholder="e.g. Inspect mainboard power rail immediately, customer reported sudden shutdown."
              value={allocateForm.assignmentNotes}
              onChange={(e) => setAllocateForm(p => ({ ...p, assignmentNotes: e.target.value }))}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setActionDialog(null)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAllocateSubmit}
            disabled={actionLoading || !allocateForm.engineerName}
            startIcon={<Send size={16} />}
            sx={{ backgroundColor: '#2563eb', fontWeight: 800, borderRadius: 2 }}
          >
            {actionLoading ? 'Allocating...' : 'Assign Service'}
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
