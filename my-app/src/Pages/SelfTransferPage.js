import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useUser } from './UserContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  Typography,
  MenuItem,
  Stack,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Paper,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Tooltip,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Divider
} from '@mui/material';
import {
  ArrowLeftRight,
  ArrowRight,
  Search,
  RotateCcw,
  Inbox,
  Edit3,
  Trash2,
  Barcode,
  Calendar,
  Package,
  Truck,
  Building,
  CheckCircle2,
  X,
  Plus
} from 'lucide-react';
import SaveIcon from '@mui/icons-material/Save';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';

const API_BASE = 'http://localhost:5002/api';

const AlertDialog = ({ open, onClose, title, message, actions }) => {
  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="#475569">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        {actions || (
          <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }} autoFocus>
            OK
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const SelfTransferPage = () => {
  const { user } = useUser();

  // Data
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Alert
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertActions, setAlertActions] = useState(null);

  // Edit Dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentTransfer, setCurrentTransfer] = useState(null);
  const [editFormData, setEditFormData] = useState({
    modelNo: '',
    fromOwner: '',
    toOwner: '',
    quantity: '',
    transferMethod: '',
    description: '',
    category: '',
  });

  // Receive Dialog
  const [receiveDialog, setReceiveDialog] = useState(false);
  const [receiveQty, setReceiveQty] = useState('');
  const [receivingTransfer, setReceivingTransfer] = useState(null);
  const [scannedList, setScannedList] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');

  // Scanner buffer
  const scannerBuffer = useRef('');
  const scannerTimer = useRef(null);
  const scanInputRef = useRef(null);

  const showAlert = useCallback((title, message, actions = null) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertActions(actions);
    setAlertOpen(true);
  }, []);

  const showConfirm = useCallback((title, message, onConfirm) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertActions(
      <>
        <Button onClick={() => setAlertOpen(false)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            setAlertOpen(false);
            onConfirm();
          }}
          color="error"
          variant="contained"
          sx={{ borderRadius: 2, textTransform: 'none' }}
          autoFocus
        >
          Delete
        </Button>
      </>
    );
    setAlertOpen(true);
  }, []);

  const fetchTransfers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/self-transfer`);
      if (!response.ok) throw new Error('Failed to fetch transfers');
      const data = await response.json();

      const activeStore = (
        user?.assignedLocation ||
        user?.warehouseName ||
        user?.serviceCenter ||
        user?.staffLocation ||
        user?.customerStore ||
        user?.role ||
        ''
      ).toLowerCase().trim();

      const isSuperAdmin = ['admin', 'super admin', 'manager'].includes(
        (user?.role || '').toLowerCase().trim()
      );

      if (user?.role && (!isSuperAdmin || (activeStore && !['admin', 'super admin', 'manager'].includes(activeStore)))) {
        setTransfers(
          (data || []).filter((t) => {
            const s = (t.storeName || '').toLowerCase().trim();
            return (
              s === activeStore ||
              s.includes(activeStore) ||
              activeStore.includes(s) ||
              s === (user?.role || '').toLowerCase().trim()
            );
          })
        );
      } else {
        setTransfers(data || []);
      }
    } catch (err) {
      console.error(err);
      showAlert('Error', err.message || 'Failed to load transfers');
    } finally {
      setLoading(false);
    }
  }, [user?.role, showAlert]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const handleEditOpen = (transfer) => {
    setCurrentTransfer(transfer);
    setEditFormData({
      modelNo: transfer.modelNo,
      fromOwner: transfer.fromOwner,
      toOwner: transfer.toOwner,
      quantity: transfer.quantity,
      transferMethod: transfer.transferMethod,
      description: transfer.description,
      category: transfer.category || '',
    });
    setShowEditDialog(true);
  };

  const handleEditClose = () => {
    setShowEditDialog(false);
    setCurrentTransfer(null);
  };

  const handleEditSubmit = async () => {
    if (!currentTransfer?._id) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/self-transfer/${currentTransfer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (!response.ok) throw new Error('Failed to update transfer');
      showAlert('Success', 'Transfer updated successfully');
      setShowEditDialog(false);
      fetchTransfers();
    } catch (err) {
      showAlert('Error', err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    showConfirm('Confirm Delete', 'Are you sure you want to delete this transfer record?', async () => {
      try {
        const response = await fetch(`${API_BASE}/self-transfer/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete transfer');
        showAlert('Success', 'Transfer record deleted');
        fetchTransfers();
      } catch (err) {
        showAlert('Error', err.message || 'Delete failed');
      }
    });
  };

  const handleReceiveStock = (transfer) => {
    setReceivingTransfer(transfer);
    setReceiveQty(String(transfer.quantity ?? ''));
    setScannedList([]);
    setBarcodeInput('');
    setReceiveDialog(true);

    setTimeout(() => scanInputRef.current?.focus(), 50);
  };

  const processBarcode = useCallback(
    (overrideRaw) => {
      const raw = String(overrideRaw || barcodeInput || '').trim();
      if (!raw) return;
      if (!receivingTransfer) return;

      if (scannedList.includes(raw)) {
        showAlert('Error', 'This barcode is already scanned');
        setBarcodeInput('');
        return;
      }

      const limit = Number(receiveQty);
      if (limit > 0 && scannedList.length >= limit) {
        showAlert('Info', `Quantity limit reached: ${limit}`);
        setBarcodeInput('');
        return;
      }

      if (Array.isArray(receivingTransfer.scannedBarcode) && receivingTransfer.scannedBarcode.length > 0) {
        const availableBarcodes = receivingTransfer.scannedBarcode.map((b) => String(b).trim());
        if (!availableBarcodes.includes(raw)) {
          showAlert('Error', 'Scanned barcode not found in this transfer record');
          setBarcodeInput('');
          return;
        }
      }

      setScannedList((prev) => [...prev, raw]);
      setBarcodeInput('');
    },
    [barcodeInput, receivingTransfer, scannedList, receiveQty, showAlert]
  );

  const handleScanKeyDown = (e) => {
    if (!scannerBuffer.current) scannerBuffer.current = '';

    if (e.key === 'Enter') {
      e.preventDefault();
      const code = scannerBuffer.current;
      if (code) processBarcode(code);
      scannerBuffer.current = '';
      return;
    }

    if (e.key.length === 1) {
      scannerBuffer.current += e.key;
    }

    clearTimeout(scannerTimer.current);
    scannerTimer.current = setTimeout(() => {
      const code = scannerBuffer.current;
      if (code) processBarcode(code);
      scannerBuffer.current = '';
    }, 200);
  };

  const handleReceiveSubmit = async () => {
    if (!receivingTransfer?._id) return;

    if (!receiveQty || Number(receiveQty) <= 0) {
      showAlert('Error', 'Please enter a valid quantity');
      return;
    }
    if (Number(receiveQty) > Number(receivingTransfer.quantity || 0)) {
      showAlert('Error', 'Quantity cannot exceed transferred amount');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/self-transfer/${receivingTransfer._id}/receive`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quantityToReceive: receiveQty,
            storeName: user?.role,
            owner: user?.role,
            scannedBarcode: scannedList,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to receive stock');
      }

      showAlert('Success', data.message || 'Stock received successfully into store inward!');
      setReceiveDialog(false);
      setReceivingTransfer(null);
      fetchTransfers();
    } catch (err) {
      showAlert('Error', err.message || 'Receive failed');
    } finally {
      setLoading(false);
    }
  };

  // Filter transfers
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (t.modelNo || '').toLowerCase().includes(q) ||
        (t.fromOwner || '').toLowerCase().includes(q) ||
        (t.toOwner || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q) ||
        (t.subCategory || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (Array.isArray(t.scannedBarcode) ? t.scannedBarcode.join(' ') : (t.scannedBarcode || '')).toLowerCase().includes(q);

      const matchesMethod = !methodFilter || (t.transferMethod || '').toLowerCase() === methodFilter.toLowerCase();

      return matchesSearch && matchesMethod;
    });
  }, [transfers, searchQuery, methodFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalRecords = transfers.length;
    const totalUnits = transfers.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);
    const inHandCount = transfers.filter((t) => (t.transferMethod || '').toLowerCase() === 'in hand').length;
    const courierCount = transfers.filter((t) => (t.transferMethod || '').toLowerCase() === 'courier').length;

    return { totalRecords, totalUnits, inHandCount, courierCount };
  }, [transfers]);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const inr = (n) => `₹ ${Number(n || 0).toLocaleString('en-IN')}`;

  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
      <AlertDialog
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        title={alertTitle}
        message={alertMessage}
        actions={alertActions}
      />

      {/* Header Banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 3, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' }}>
            <ArrowLeftRight size={26} color="#2563eb" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
              Stock Transfers
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Track self-transfers, store-to-store inventory movements, and inward receiving status
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* KPI Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 3, width: '100%' }}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', width: '100%' }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Transfers
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5 }}>
                  {stats.totalRecords}
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeftRight size={22} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', width: '100%' }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Transferred Units
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#059669', mt: 0.5 }}>
                  {stats.totalUnits}
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={22} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', width: '100%' }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  In Hand Transfers
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#7c3aed', mt: 0.5 }}>
                  {stats.inHandCount}
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Inbox size={22} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', width: '100%' }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Courier Shipments
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#0284c7', mt: 0.5 }}>
                  {stats.courierCount}
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={22} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Filter Toolbar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', width: '100%', boxSizing: 'border-box' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search Model No, Barcode, Stores, Category or Description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1, minWidth: 260 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#64748b" />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <X size={16} />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: { borderRadius: 2, backgroundColor: '#f8fafc', fontSize: '14px' }
            }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              displayEmpty
              sx={{ borderRadius: 2, backgroundColor: '#f8fafc', fontSize: '14px' }}
            >
              <MenuItem value="">All Transfer Methods</MenuItem>
              <MenuItem value="In Hand">In Hand</MenuItem>
              <MenuItem value="Courier">Courier</MenuItem>
              <MenuItem value="Others">Others</MenuItem>
            </Select>
          </FormControl>

          {(searchQuery || methodFilter) && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<RotateCcw size={14} />}
              onClick={() => {
                setSearchQuery('');
                setMethodFilter('');
              }}
              sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b', borderColor: '#cbd5e1' }}
            >
              Reset Filters
            </Button>
          )}
        </Box>
      </Paper>

      {/* Main Stock Transfers Data Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', overflow: 'hidden', width: '100%' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Date
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Model No
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  From / To Store
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Category
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Barcodes
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Unit Price
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Quantity
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Method
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Description
                </TableCell>
                <TableCell align="right" sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8, pr: 3 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="#64748b">Loading transfer records...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredTransfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <ArrowLeftRight size={36} color="#cbd5e1" />
                      <Typography variant="subtitle2" fontWeight={700} color="#334155">
                        No transfer records found
                      </Typography>
                      <Typography variant="caption" color="#64748b">
                        {searchQuery ? 'Try matching a different search term' : 'Self-transfers and store movements will appear here'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransfers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((t) => {
                    const barcodes = Array.isArray(t.scannedBarcode)
                      ? t.scannedBarcode
                      : (t.scannedBarcode || '').split(',').map((b) => b.trim()).filter(Boolean);

                    return (
                      <TableRow
                        key={t._id}
                        hover
                        sx={{
                          transition: 'background-color 0.15s ease',
                          '&:hover': { backgroundColor: '#f8fafc' }
                        }}
                      >
                        {/* Date */}
                        <TableCell sx={{ py: 1.8 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <Calendar size={14} color="#64748b" />
                            <Typography variant="body2" sx={{ color: '#334155', fontSize: '13px' }}>
                              {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Model No */}
                        <TableCell sx={{ py: 1.8 }}>
                          <Typography variant="body2" fontWeight={800} sx={{ color: '#0f172a', fontSize: '13px' }}>
                            {t.modelNo || 'N/A'}
                          </Typography>
                        </TableCell>

                        {/* From / To Store */}
                        <TableCell sx={{ py: 1.8 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'nowrap' }}>
                            <Chip
                              label={t.fromOwner || 'Owner'}
                              size="small"
                              sx={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#475569', height: 22 }}
                            />
                            <ArrowRight size={14} color="#94a3b8" />
                            <Chip
                              label={t.toOwner || 'Store'}
                              size="small"
                              sx={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', height: 22 }}
                            />
                          </Box>
                        </TableCell>

                        {/* Category */}
                        <TableCell sx={{ py: 1.8 }}>
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px' }}>
                            {t.category || 'N/A'}
                            {t.subCategory ? ` / ${t.subCategory}` : ''}
                          </Typography>
                        </TableCell>

                        {/* Barcodes */}
                        <TableCell sx={{ py: 1.8, maxWidth: 180 }}>
                          {barcodes.length > 0 ? (
                            <Tooltip title={barcodes.join(', ')} arrow placement="top">
                              <Chip
                                icon={<Barcode size={12} />}
                                label={`${barcodes.length} serial barcode${barcodes.length > 1 ? 's' : ''}`}
                                size="small"
                                sx={{
                                  fontFamily: 'monospace',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  backgroundColor: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe'
                                }}
                              />
                            </Tooltip>
                          ) : (
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>—</Typography>
                          )}
                        </TableCell>

                        {/* Price */}
                        <TableCell sx={{ py: 1.8 }}>
                          <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '13px' }}>
                            {inr(t.productPrice)}
                          </Typography>
                        </TableCell>

                        {/* Quantity */}
                        <TableCell sx={{ py: 1.8 }}>
                          <Chip
                            label={`${t.quantity ?? 0} units`}
                            size="small"
                            sx={{
                              fontSize: '11px',
                              fontWeight: 800,
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              border: '1px solid #86efac'
                            }}
                          />
                        </TableCell>

                        {/* Method */}
                        <TableCell sx={{ py: 1.8 }}>
                          <Chip
                            icon={t.transferMethod === 'Courier' ? <Truck size={12} /> : <Inbox size={12} />}
                            label={t.transferMethod || 'In Hand'}
                            size="small"
                            sx={{
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: t.transferMethod === 'Courier' ? '#f3e8ff' : '#f1f5f9',
                              color: t.transferMethod === 'Courier' ? '#7c3aed' : '#475569'
                            }}
                          />
                        </TableCell>

                        {/* Description */}
                        <TableCell sx={{ py: 1.8, maxWidth: 180 }}>
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.description || '—'}
                          </Typography>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" sx={{ py: 1.8, pr: 3 }}>
                          <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<MoveToInboxIcon sx={{ fontSize: '14px !important' }} />}
                              onClick={() => handleReceiveStock(t)}
                              sx={{
                                backgroundColor: '#16a34a',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '11px',
                                textTransform: 'none',
                                borderRadius: 1.5,
                                px: 1.5,
                                py: 0.4,
                                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.2)',
                                '&:hover': { backgroundColor: '#15803d' }
                              }}
                            >
                              Receive Inward
                            </Button>

                            <Tooltip title="Edit Record">
                              <IconButton
                                size="small"
                                onClick={() => handleEditOpen(t)}
                                sx={{ color: '#2563eb', '&:hover': { backgroundColor: '#eff6ff' } }}
                              >
                                <Edit3 size={16} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete Record">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(t._id)}
                                sx={{ color: '#ef4444', '&:hover': { backgroundColor: '#fef2f2' } }}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Table Footer Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredTransfers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid #e2e8f0',
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              fontSize: '13px',
              color: '#64748b'
            }
          }}
        />
      </Paper>

      {/* EDIT TRANSFER DIALOG */}
      <Dialog
        open={showEditDialog}
        onClose={handleEditClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            p: 0.5,
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ p: 2.5, pb: 2, backgroundColor: '#ffffff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', fontSize: '18px' }}>
              Edit Transfer Record
            </Typography>
            <IconButton size="small" onClick={handleEditClose} sx={{ color: '#94a3b8' }}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>

        <Divider sx={{ borderColor: '#f1f5f9' }} />

        <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
          <Stack spacing={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>To Owner / Destination Store</InputLabel>
              <Select
                value={editFormData.toOwner}
                label="To Owner / Destination Store"
                onChange={(e) => setEditFormData((p) => ({ ...p, toOwner: e.target.value }))}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="CCTV Shoppee Avadi.">CCTV Shoppee Avadi.</MenuItem>
                <MenuItem value="Lookman CCTV Avadi.">Lookman CCTV Avadi.</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Quantity"
              type="number"
              size="small"
              fullWidth
              value={editFormData.quantity}
              onChange={(e) => setEditFormData((p) => ({ ...p, quantity: e.target.value }))}
              InputProps={{ sx: { borderRadius: 2 } }}
            />

            <FormControl fullWidth size="small" required>
              <InputLabel>Transfer Method</InputLabel>
              <Select
                value={editFormData.transferMethod}
                label="Transfer Method"
                onChange={(e) => setEditFormData((p) => ({ ...p, transferMethod: e.target.value }))}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="In Hand">In Hand</MenuItem>
                <MenuItem value="Courier">Courier</MenuItem>
                <MenuItem value="Others">Others</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Description / Notes"
              fullWidth
              multiline
              rows={3}
              value={editFormData.description}
              onChange={(e) => setEditFormData((p) => ({ ...p, description: e.target.value }))}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
          </Stack>
        </DialogContent>

        <Divider sx={{ borderColor: '#f1f5f9' }} />

        <DialogActions sx={{ p: 2.5, backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={handleEditClose}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: '#64748b', borderColor: '#cbd5e1' }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleEditSubmit}
            sx={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: 800,
              borderRadius: 2.5,
              px: 3.5,
              py: 1,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              '&:hover': { backgroundColor: '#1d4ed8' }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* RECEIVE STOCK INWARD DIALOG */}
      <Dialog
        open={receiveDialog}
        onClose={() => setReceiveDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            p: 0.5,
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ p: 2.5, pb: 2, backgroundColor: '#ffffff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 42, height: 42, borderRadius: 2.5, backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bbf7d0' }}>
                <Inbox size={22} color="#16a34a" />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', fontSize: '18px' }}>
                  Receive Stock into Inward
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Verify units & serial barcodes before receiving into store inventory
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setReceiveDialog(false)} sx={{ color: '#94a3b8' }}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>

        <Divider sx={{ borderColor: '#f1f5f9' }} />

        <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
          <Stack spacing={2.5}>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Transfer Item Details
              </Typography>
              <Typography variant="body1" fontWeight={800} sx={{ color: '#0f172a', mt: 0.3 }}>
                {receivingTransfer?.modelNo}
              </Typography>
              <Typography variant="body2" sx={{ color: '#0369a1', mt: 0.2 }}>
                Destination Store: <strong>{receivingTransfer?.toOwner}</strong>
              </Typography>
              <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700, display: 'block', mt: 0.5 }}>
                Available in transfer: {receivingTransfer?.quantity ?? 0} units
              </Typography>
            </Paper>

            <TextField
              label="Quantity to Receive *"
              type="number"
              size="small"
              fullWidth
              value={receiveQty}
              onChange={(e) => setReceiveQty(e.target.value)}
              helperText={
                Number(receiveQty) === Number(receivingTransfer?.quantity)
                  ? 'Full quantity receive: Transfer record will be completed'
                  : 'Partial receive: Remaining balance will stay in transfer history'
              }
              InputProps={{ sx: { borderRadius: 2 } }}
            />

            <TextField
              size="small"
              label="Scan Serial Barcode"
              fullWidth
              placeholder="Scan barcode with scanner device..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleScanKeyDown}
              inputRef={scanInputRef}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Barcode size={18} color="#2563eb" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 }
              }}
            />

            <TextField
              label="Scanned Verified Barcodes"
              fullWidth
              multiline
              rows={2}
              value={scannedList.join(', ')}
              InputProps={{ readOnly: true, sx: { borderRadius: 2, fontFamily: 'monospace', fontSize: '13px' } }}
              helperText={`Verified Scans: ${scannedList.length} / ${receiveQty || 0}`}
            />
          </Stack>
        </DialogContent>

        <Divider sx={{ borderColor: '#f1f5f9' }} />

        <DialogActions sx={{ p: 2.5, backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => setReceiveDialog(false)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: '#64748b', borderColor: '#cbd5e1' }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleReceiveSubmit}
            sx={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              fontWeight: 800,
              borderRadius: 2.5,
              px: 3.5,
              py: 1,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
              '&:hover': { backgroundColor: '#15803d' }
            }}
          >
            Receive into Store Inward
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SelfTransferPage;
