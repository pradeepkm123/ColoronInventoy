import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, TablePagination, Snackbar, Alert, Box, Typography, Avatar,
  Chip, Tooltip, InputAdornment, Stack, Grid, Divider, Card, CardContent
} from '@mui/material';
import {
  Users, UserPlus, Search, Phone, Mail, MapPin, Building, FileText,
  Trash2, X, UserCheck, ShieldCheck, RotateCcw, Edit3, PhoneCall
} from 'lucide-react';
import axios from 'axios';
import { useUser } from './UserContext';

const API_BASE = 'https://coloroninventoy.onrender.com';

const StoreCustomer = () => {
  const { user } = useUser();
  const [customers, setCustomers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState({
    storeName: user?.role || '',
    customerName: '',
    gst: '',
    address: '',
    mailId: '',
    phoneNo: '',
    storeHandler: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [handlerFilter, setHandlerFilter] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [user?.role]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/storecustomers`, {
        params: { storeName: user?.role }
      });
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      showSnackbar('Error fetching customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (customer = null) => {
    setCurrentCustomer(customer || {
      storeName: user?.role || '',
      customerName: '',
      gst: '',
      address: '',
      mailId: '',
      phoneNo: '',
      storeHandler: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSaveCustomer = async () => {
    if (!currentCustomer.storeName || !currentCustomer.customerName || !currentCustomer.phoneNo ||
      !currentCustomer.gst || !currentCustomer.address || !currentCustomer.mailId || !currentCustomer.storeHandler) {
      showSnackbar("All fields marked with * are required", "error");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(currentCustomer.phoneNo)) {
      showSnackbar("Please enter a valid 10-digit phone number", "error");
      return;
    }

    if (currentCustomer.mailId && !/\S+@\S+\.\S+/.test(currentCustomer.mailId)) {
      showSnackbar("Please enter a valid email address", "error");
      return;
    }

    try {
      if (currentCustomer._id) {
        await axios.put(`${API_BASE}/api/storecustomers/${currentCustomer._id}`, currentCustomer);
        showSnackbar('Customer updated successfully!', 'success');
      } else {
        await axios.post(`${API_BASE}/api/storecustomers`, currentCustomer);
        showSnackbar('Customer added successfully!', 'success');
      }
      fetchCustomers();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving customer:', error.response?.data || error.message);
      showSnackbar(error.response?.data?.error || 'Error saving customer', 'error');
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete customer "${name || 'this customer'}"?`)) return;
    try {
      await axios.delete(`${API_BASE}/api/storecustomers/${id}`);
      showSnackbar('Customer deleted successfully!', 'success');
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      showSnackbar(error.response?.data?.error || 'Error deleting customer', 'error');
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleInputChange = (field, value) => {
    setCurrentCustomer(prev => ({ ...prev, [field]: value }));
  };

  // Filter Customers by Search Query & Handler
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (c.customerName || '').toLowerCase().includes(q) ||
        (c.phoneNo || '').toLowerCase().includes(q) ||
        (c.gst || '').toLowerCase().includes(q) ||
        (c.mailId || '').toLowerCase().includes(q) ||
        (c.storeName || '').toLowerCase().includes(q) ||
        (c.storeHandler || '').toLowerCase().includes(q);

      const matchesHandler = !handlerFilter || (c.storeHandler || '').toLowerCase() === handlerFilter.toLowerCase();

      return matchesSearch && matchesHandler;
    });
  }, [customers, searchQuery, handlerFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = customers.length;
    const withGst = customers.filter(c => c.gst && c.gst.trim() !== '-').length;
    const withMail = customers.filter(c => c.mailId && c.mailId.trim() !== '-').length;
    const handlersCount = new Set(customers.map(c => c.storeHandler).filter(Boolean)).size;

    return { total, withGst, withMail, handlersCount };
  }, [customers]);

  const isSaveDisabled =
    !currentCustomer.storeName ||
    !currentCustomer.customerName ||
    !currentCustomer.phoneNo ||
    !currentCustomer.gst ||
    !currentCustomer.address ||
    !currentCustomer.mailId ||
    !currentCustomer.storeHandler;

  // Initial Avatar Colors
  const getAvatarBg = (name) => {
    const colors = ['#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706', '#0284c7'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash += name.charCodeAt(i);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Top Header Banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 3, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' }}>
            <Users size={26} color="#2563eb" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
              Store Customers
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Manage registered store clients, GST profiles, and customer contact directory
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<UserPlus size={18} />}
          onClick={() => handleOpenDialog()}
          sx={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            fontWeight: 700,
            borderRadius: 2.5,
            px: 3,
            py: 1.2,
            textTransform: 'none',
            fontSize: '14px',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
            '&:hover': { backgroundColor: '#1d4ed8' }
          }}
        >
          Add Customer
        </Button>
      </Box>

      {/* KPI Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 3, width: '100%' }}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', width: '100%' }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Customers
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5 }}>
                  {stats.total}
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', width: '100%' }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  GST Registered
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#059669', mt: 0.5 }}>
                  {stats.withGst}
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={22} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', width: '100%' }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email Contacts
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#7c3aed', mt: 0.5 }}>
                  {stats.withMail}
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={22} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', width: '100%' }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Active Handlers
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#0284c7', mt: 0.5 }}>
                  {stats.handlersCount}
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={22} />
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
            placeholder="Search by Name, Phone, GST, Email or Store..."
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

          {(searchQuery || handlerFilter) && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<RotateCcw size={14} />}
              onClick={() => {
                setSearchQuery('');
                setHandlerFilter('');
              }}
              sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b', borderColor: '#cbd5e1' }}
            >
              Reset Filters
            </Button>
          )}
        </Box>
      </Paper>

      {/* Customers Table Container */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Store Name
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Customer Name
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  GST Number
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Address
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Email ID
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Phone No
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Store Handler
                </TableCell>
                <TableCell align="right" sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8, pr: 3 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="#64748b">Loading customer directory...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Users size={36} color="#cbd5e1" />
                      <Typography variant="subtitle2" fontWeight={700} color="#334155">
                        No customers found
                      </Typography>
                      <Typography variant="caption" color="#64748b">
                        {searchQuery ? 'Try matching a different search term' : 'Add your first customer to get started'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((customer) => {
                    const initials = (customer.customerName || 'C')
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <TableRow
                        key={customer._id}
                        hover
                        sx={{
                          transition: 'background-color 0.15s ease',
                          '&:hover': { backgroundColor: '#f8fafc' }
                        }}
                      >
                        {/* Store Name */}
                        <TableCell sx={{ py: 1.8 }}>
                          <Chip
                            icon={<Building size={12} />}
                            label={customer.storeName || 'Store'}
                            size="small"
                            sx={{
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              border: '1px solid #bae6fd'
                            }}
                          />
                        </TableCell>

                        {/* Customer Name */}
                        <TableCell sx={{ py: 1.8 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 34,
                                height: 34,
                                fontSize: '13px',
                                fontWeight: 800,
                                backgroundColor: getAvatarBg(customer.customerName)
                              }}
                            >
                              {initials}
                            </Avatar>
                            <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                              {customer.customerName}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* GST Number */}
                        <TableCell sx={{ py: 1.8 }}>
                          {customer.gst && customer.gst.trim() !== '-' ? (
                            <Chip
                              label={customer.gst}
                              size="small"
                              sx={{
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                fontSize: '11px',
                                backgroundColor: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe'
                              }}
                            />
                          ) : (
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>—</Typography>
                          )}
                        </TableCell>

                        {/* Address */}
                        <TableCell sx={{ py: 1.8, maxWidth: 220 }}>
                          {customer.address && customer.address.trim() !== '-' ? (
                            <Tooltip title={customer.address} arrow placement="top">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <MapPin size={14} color="#64748b" style={{ flexShrink: 0 }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: '#334155',
                                    fontSize: '13px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  {customer.address}
                                </Typography>
                              </Box>
                            </Tooltip>
                          ) : (
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>—</Typography>
                          )}
                        </TableCell>

                        {/* Email ID */}
                        <TableCell sx={{ py: 1.8 }}>
                          {customer.mailId && customer.mailId.trim() !== '-' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <Mail size={14} color="#64748b" />
                              <Typography variant="body2" sx={{ color: '#2563eb', fontSize: '13px', textDecoration: 'none' }}>
                                {customer.mailId}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>—</Typography>
                          )}
                        </TableCell>

                        {/* Phone No */}
                        <TableCell sx={{ py: 1.8 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <PhoneCall size={14} color="#16a34a" />
                            <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', color: '#0f172a', fontSize: '13px' }}>
                              {customer.phoneNo}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Store Handler */}
                        <TableCell sx={{ py: 1.8 }}>
                          {customer.storeHandler && customer.storeHandler.trim() !== '-' ? (
                            <Chip
                              label={customer.storeHandler}
                              size="small"
                              sx={{
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: '#f1f5f9',
                                color: '#475569'
                              }}
                            />
                          ) : (
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>—</Typography>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" sx={{ py: 1.8, pr: 3 }}>
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Edit Customer">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(customer)}
                                sx={{ color: '#2563eb', '&:hover': { backgroundColor: '#eff6ff' } }}
                              >
                                <Edit3 size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Customer">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteCustomer(customer._id, customer.customerName)}
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
          count={filteredCustomers.length}
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

      {/* Add/Edit Customer Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
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
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' }}>
                <UserPlus size={24} color="#2563eb" />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', fontSize: '18px' }}>
                  {currentCustomer._id ? 'Edit Store Customer' : 'Add New Store Customer'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.2 }}>
                  {currentCustomer._id ? 'Update client details and store contact info' : 'Enter details to register a new customer in store records'}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={handleCloseDialog} sx={{ color: '#94a3b8', '&:hover': { backgroundColor: '#f1f5f9', color: '#0f172a' } }}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>

        <Divider sx={{ borderColor: '#f1f5f9' }} />

        <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Store Name *"
                fullWidth
                size="small"
                value={currentCustomer.storeName}
                onChange={(e) => handleInputChange('storeName', e.target.value)}
                disabled={!!user?.role}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Building size={18} color="#64748b" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, backgroundColor: !!user?.role ? '#f8fafc' : '#ffffff' }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Customer Name *"
                fullWidth
                size="small"
                placeholder="Enter customer / business name"
                value={currentCustomer.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <UserCheck size={18} color="#2563eb" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="GST Number *"
                fullWidth
                size="small"
                placeholder="e.g. 33ABNCS6942E1Z7"
                value={currentCustomer.gst}
                onChange={(e) => handleInputChange('gst', e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FileText size={18} color="#059669" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, fontFamily: 'monospace' }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number *"
                fullWidth
                size="small"
                placeholder="10-digit mobile number"
                value={currentCustomer.phoneNo}
                onChange={(e) => handleInputChange('phoneNo', e.target.value)}
                required
                inputProps={{ maxLength: 10 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone size={18} color="#16a34a" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, fontFamily: 'monospace' }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Email ID *"
                fullWidth
                size="small"
                type="email"
                placeholder="customer@email.com"
                value={currentCustomer.mailId}
                onChange={(e) => handleInputChange('mailId', e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={18} color="#7c3aed" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Store Handler *"
                fullWidth
                size="small"
                placeholder="Name of store representative"
                value={currentCustomer.storeHandler}
                onChange={(e) => handleInputChange('storeHandler', e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <UserCheck size={18} color="#0284c7" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Billing / Shipping Address *"
                fullWidth
                multiline
                rows={3}
                placeholder="Enter complete customer address..."
                value={currentCustomer.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                      <MapPin size={18} color="#64748b" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <Divider sx={{ borderColor: '#f1f5f9' }} />

        <DialogActions sx={{ p: 2.5, backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={handleCloseDialog}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: '#64748b', borderColor: '#cbd5e1' }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSaveCustomer}
            disabled={isSaveDisabled}
            sx={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: 800,
              borderRadius: 2.5,
              px: 3.5,
              py: 1,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              '&:hover': { backgroundColor: '#1d4ed8' },
              '&.Mui-disabled': { backgroundColor: '#cbd5e1', color: '#94a3b8', boxShadow: 'none' }
            }}
          >
            {currentCustomer._id ? 'Update Customer' : 'Save Customer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ borderRadius: 2.5, fontWeight: 600, boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StoreCustomer;
