import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert,
  Snackbar,
  Card,
  CardContent,
  InputAdornment,
  Autocomplete
} from '@mui/material';
import {
  Plus,
  Trash2,
  Search,
  Building2,
  Sparkles,
  RefreshCw,
  MapPin,
  Tag,
  Layers
} from 'lucide-react';

const API_BASE = 'https://coloroninventoy.onrender.com/api';
const PO_API = `${API_BASE}/purchase-orders`;

export default function PurchaseOrders() {
  // Data States
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationsList, setLocationsList] = useState([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('All');

  // Modal: Add Company Order
  const [openModal, setOpenModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [idealNo, setIdealNo] = useState('V1');
  const [location, setLocation] = useState('');
  const [idealPreview, setIdealPreview] = useState({ nextIdealNo: 'V1', lastIdealNo: 'None', lastIdealSeq: 0 });
  const [isFetchingIdeal, setIsFetchingIdeal] = useState(false);

  // Toast
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  // Initial Fetch
  useEffect(() => {
    fetchOrders();
    fetchLocations();
  }, [companyFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `${PO_API}?`;
      if (companyFilter !== 'All') url += `company=${encodeURIComponent(companyFilter)}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

      const res = await axios.get(url);
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setToast({ open: true, message: 'Failed to load records', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await axios.get(`${API_BASE}/locations`);
      if (Array.isArray(res.data)) {
        const names = res.data.map(l => l.locationName || l.name).filter(Boolean);
        setLocationsList(names);
      }
    } catch (err) {
      // fallback
    }
  };

  // Real-time Next Ideal No. Calculation when Company Name changes
  useEffect(() => {
    if (!companyName || !companyName.trim()) {
      setIdealPreview({ nextIdealNo: 'V1', lastIdealNo: 'None', lastIdealSeq: 0 });
      setIdealNo('V1');
      return;
    }

    const timer = setTimeout(async () => {
      setIsFetchingIdeal(true);
      try {
        const res = await axios.post(`${PO_API}/next-ideal-no`, { companyName: companyName.trim() });
        if (res.data) {
          const next = res.data.nextIdealNo || 'V1';
          setIdealPreview({
            nextIdealNo: next,
            lastIdealNo: res.data.lastIdealNo || 'None',
            lastIdealSeq: res.data.lastIdealSeq || 0
          });
          setIdealNo(next);
        }
      } catch (err) {
        console.error('Error fetching next ideal no:', err);
      } finally {
        setIsFetchingIdeal(false);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [companyName]);

  const handleOpenModal = () => {
    setCompanyName('');
    setIdealNo('V1');
    setLocation('');
    setIdealPreview({ nextIdealNo: 'V1', lastIdealNo: 'None', lastIdealSeq: 0 });
    setOpenModal(true);
  };

  // Save / Generate Ideal No. for Company
  const handleCreateOrder = async () => {
    if (!companyName || !companyName.trim()) {
      setToast({ open: true, message: 'Please enter a Company Name', severity: 'warning' });
      return;
    }

    try {
      const res = await axios.post(PO_API, {
        companyName: companyName.trim(),
        idealNo: (idealNo && idealNo.trim()) ? idealNo.trim() : idealPreview.nextIdealNo,
        location: (location || '').trim()
      });
      const generatedIdealNo = res.data?.order?.idealNo || idealNo;
      setToast({
        open: true,
        message: `✅ Created: ${companyName.trim()} → Ideal No: ${generatedIdealNo}`,
        severity: 'success'
      });
      setOpenModal(false);
      setCompanyName('');
      setIdealNo('V1');
      setLocation('');
      fetchOrders();
    } catch (err) {
      console.error('Error creating order:', err);
      setToast({
        open: true,
        message: `Failed to create: ${err.response?.data?.message || err.message}`,
        severity: 'error'
      });
    }
  };

  // Delete Record
  const handleDeleteOrder = async (orderId, idNo, comp) => {
    if (!window.confirm(`Are you sure you want to delete ${comp} (${idNo})?`)) return;
    try {
      await axios.delete(`${PO_API}/${orderId}`);
      setToast({ open: true, message: `Deleted ${comp} (${idNo})`, severity: 'info' });
      fetchOrders();
    } catch (err) {
      console.error('Error deleting record:', err);
      setToast({ open: true, message: 'Failed to delete record', severity: 'error' });
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = searchQuery === '' ||
        (order.idealNo && order.idealNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.companyName && order.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.location && order.location.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCompany = companyFilter === 'All' || order.companyName === companyFilter;
      return matchesSearch && matchesCompany;
    });
  }, [orders, searchQuery, companyFilter]);

  // Unique Companies List for autocomplete & filter dropdown
  const uniqueCompanies = useMemo(() => {
    return Array.from(new Set(orders.map(o => o.companyName)));
  }, [orders]);

  // Unique Locations List for autocomplete
  const combinedLocations = useMemo(() => {
    const fromOrders = orders.map(o => o.location).filter(Boolean);
    return Array.from(new Set([...locationsList, ...fromOrders]));
  }, [orders, locationsList]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: '#0f2b48', display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Building2 size={28} color="#0284c7" /> Purchase Orders / Company Ideal No.
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Auto-generate <strong>Ideal No. (V1, V2, V3...)</strong> separately for each company upon order action.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={handleOpenModal}
          sx={{
            backgroundColor: '#0284c7',
            color: '#ffffff',
            fontWeight: 700,
            textTransform: 'none',
            px: 2.5,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
            '&:hover': { backgroundColor: '#0369a1' }
          }}
        >
          Add Company Order
        </Button>
      </Box>

      {/* Summary KPI Cards — 50/50 Full Width */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {/* Total Generated Orders */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card
            sx={{
              width: '100%',
              borderRadius: 2.5,
              background: '#f97316',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.25)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(249, 115, 22, 0.38)'
              }
            }}
          >
            <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ backgroundColor: 'rgba(255,255,255,0.22)', width: 48, height: 48, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Layers size={24} color="white" />
              </Box>
              <Box>
                <Typography variant="caption" fontWeight={800} sx={{ opacity: 0.95, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '11px', color: 'white', display: 'block' }}>
                  Total Generated Orders
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ mt: 0.2, lineHeight: 1.1, color: 'white' }}>
                  {orders.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Total Companies */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card
            sx={{
              width: '100%',
              borderRadius: 2.5,
              background: '#0869a6',
              boxShadow: '0 4px 14px rgba(8, 105, 166, 0.25)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(8, 105, 166, 0.38)'
              }
            }}
          >
            <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ backgroundColor: 'rgba(255,255,255,0.22)', width: 48, height: 48, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={24} color="white" />
              </Box>
              <Box>
                <Typography variant="caption" fontWeight={800} sx={{ opacity: 0.95, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '11px', color: 'white', display: 'block' }}>
                  Total Companies
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ mt: 0.2, lineHeight: 1.1, color: 'white' }}>
                  {uniqueCompanies.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Search & Filter Toolbar — Full Width Flex Alignment */}
      <Paper sx={{ p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0', mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
          {/* Search Input */}
          <Box sx={{ flex: 1.5, minWidth: { xs: '100%', sm: '220px' } }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search by Company Name, Ideal No (e.g. V1), or Location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} color="#64748b" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Filter by Company Dropdown */}
          <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: '200px' } }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Filter by Company</InputLabel>
              <Select
                value={companyFilter}
                label="Filter by Company"
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                <MenuItem value="All">All Companies</MenuItem>
                {uniqueCompanies.map(c => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Refresh Button */}
          <Tooltip title="Refresh">
            <IconButton onClick={fetchOrders} color="primary" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1, flexShrink: 0 }}>
              <RefreshCw size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Main Table: S.No, Company Name, Ideal No, Location, Action */}
      <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: '#0f2b48', fontSize: '14px', width: '80px' }}>S.No</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f2b48', fontSize: '14px' }}>Company Name</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f2b48', fontSize: '14px', width: '160px' }}>Ideal No.</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f2b48', fontSize: '14px', width: '220px' }}>Location</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#0f2b48', fontSize: '14px', width: '100px' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>Loading records...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Building2 size={40} color="#cbd5e1" style={{ marginBottom: 8 }} />
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#475569' }}>
                      No Records Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                      Click "Add Company Order" to generate your first Ideal No. (V1).
                    </Typography>
                    <Button variant="outlined" size="small" onClick={handleOpenModal} startIcon={<Plus size={16} />}>
                      Add Company Order Now
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order, idx) => (
                  <TableRow key={order._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    {/* S.No */}
                    <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '13px' }}>
                      {idx + 1}
                    </TableCell>

                    {/* Company Name */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Building2 size={18} color="#0284c7" />
                        <Typography variant="body1" fontWeight={800} sx={{ color: '#0f172a' }}>
                          {order.companyName}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Ideal No. — Circular Badge matching Sticker Label style */}
                    <TableCell>
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          border: '1.5px solid #000000',
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.10)'
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: 'Arial Black, sans-serif',
                            fontWeight: 900,
                            fontSize: order.idealNo?.length > 2 ? '7px' : '8px',
                            color: '#000000',
                            lineHeight: 1,
                            letterSpacing: 0
                          }}
                        >
                          {order.idealNo}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Location */}
                    <TableCell>
                      {order.location ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <MapPin size={16} color="#64748b" />
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#334155' }}>
                            {order.location}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                          —
                        </Typography>
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell align="right">
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteOrder(order._id, order.idealNo, order.companyName)}
                          sx={{ color: '#ef4444', backgroundColor: '#fef2f2', '&:hover': { backgroundColor: '#fee2e2' } }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ADD COMPANY ORDER MODAL */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f2b48', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Building2 size={22} color="#0284c7" />
          Add Company Order
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5 }}>
          <Grid container spacing={2.5}>
            {/* Company Name Input with Autocomplete */}
            <Grid item xs={12}>
              <Autocomplete
                freeSolo
                options={uniqueCompanies}
                value={companyName}
                onInputChange={(event, newInputValue) => {
                  setCompanyName(newInputValue || '');
                }}
                onChange={(event, newValue) => {
                  setCompanyName(newValue || '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Company Name *"
                    size="small"
                    fullWidth
                    autoFocus
                    placeholder="Type or select Company Name..."
                    helperText="Selecting or typing a company automatically calculates its next sequence (V1 → V2 → V3 → V4...)"
                  />
                )}
              />
            </Grid>

            {/* Ideal No Input (Editable & Auto-filled) */}
            <Grid item xs={12}>
              <TextField
                label="Ideal No. *"
                size="small"
                fullWidth
                required
                value={idealNo}
                onChange={(e) => setIdealNo(e.target.value)}
                placeholder="e.g. V1, V2, V3..."
                helperText="Auto-filled with next sequence, or enter custom Ideal No."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Tag size={16} color="#0284c7" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Location Input with Autocomplete */}
            <Grid item xs={12}>
              <Autocomplete
                freeSolo
                options={combinedLocations}
                value={location}
                onInputChange={(event, newInputValue) => {
                  setLocation(newInputValue || '');
                }}
                onChange={(event, newValue) => {
                  setLocation(newValue || '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Location"
                    size="small"
                    fullWidth
                    placeholder="e.g. Main Warehouse, Rack A..."
                    helperText="Warehouse / Storage location"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <MapPin size={16} color="#64748b" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setOpenModal(false)} sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleCreateOrder}
            startIcon={<Plus size={18} />}
            sx={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontWeight: 800,
              textTransform: 'none',
              px: 3,
              borderRadius: 2,
              '&:hover': { backgroundColor: '#0369a1' }
            }}
          >
            Create Order ({idealNo || idealPreview.nextIdealNo})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} sx={{ fontWeight: 700, borderRadius: 2 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
