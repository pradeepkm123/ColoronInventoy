import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import validator from 'validator';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Chip,
  Card,
  CardContent,
  Tooltip,
  Switch
} from '@mui/material';
import {
  Warehouse,
  Building2,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  X
} from 'lucide-react';
import { useSnackbar } from 'notistack';

const API = 'http://localhost:5002';

export default function Warehouses() {
  const { enqueueSnackbar } = useSnackbar();

  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    warehouse: '',
    contactPerson: '',
    email: '',
    phoneNo: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    status: true,
  });

  const [errors, setErrors] = useState({});
  const [filterText, setFilterText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await axios.get(`${API}/api/warehouses`);
      setWarehouses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      enqueueSnackbar('Error fetching warehouses!', { variant: 'error' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.warehouse.trim()) newErrors.warehouse = 'Warehouse Name is required';
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact Person is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validator.isEmail(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.phoneNo.trim()) {
      newErrors.phoneNo = 'Phone Number is required';
    }
    if (!formData.address.trim()) newErrors.address = 'Street Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      warehouse: '',
      contactPerson: '',
      email: '',
      phoneNo: '',
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      status: true,
    });
    setErrors({});
    setOpen(true);
  };

  const handleOpenEdit = (wh) => {
    setEditId(wh._id);
    setFormData({
      warehouse: wh.warehouse || '',
      contactPerson: wh.contactPerson || '',
      email: wh.email || '',
      phoneNo: wh.phoneNo || '',
      address: wh.address || '',
      city: wh.city || '',
      state: wh.state || '',
      country: wh.country || '',
      zipCode: wh.zipCode || '',
      status: wh.status ?? true,
    });
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditId(null);
    setErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editId) {
        await axios.patch(`${API}/api/warehouses/${editId}`, formData);
        enqueueSnackbar('Warehouse updated successfully!', { variant: 'success' });
      } else {
        await axios.post(`${API}/api/warehouses`, formData);
        enqueueSnackbar('Warehouse registered successfully!', { variant: 'success' });
      }
      fetchWarehouses();
      handleClose();
    } catch (error) {
      console.error('Error saving warehouse:', error);
      enqueueSnackbar('Error saving warehouse details!', { variant: 'error' });
    }
  };

  const handleDeleteConfirmOpen = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API}/api/warehouses/${deleteId}`);
      enqueueSnackbar('Warehouse deleted successfully!', { variant: 'success' });
      fetchWarehouses();
      setConfirmOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      enqueueSnackbar('Error deleting warehouse!', { variant: 'error' });
    }
  };

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((wh) => {
      const q = filterText.toLowerCase().trim();
      return (
        !q ||
        (wh.warehouse && wh.warehouse.toLowerCase().includes(q)) ||
        (wh.contactPerson && wh.contactPerson.toLowerCase().includes(q)) ||
        (wh.city && wh.city.toLowerCase().includes(q)) ||
        (wh.phoneNo && wh.phoneNo.toLowerCase().includes(q))
      );
    });
  }, [warehouses, filterText]);

  const activeCount = warehouses.filter((w) => w.status).length;
  const uniqueCities = Array.from(new Set(warehouses.map((w) => w.city).filter(Boolean)));

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
            Warehouse & Fulfillment Centers
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Central inventory hubs, distribution warehouses, managers, and contact details.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={fetchWarehouses}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: '#cbd5e1',
              color: '#334155',
              fontWeight: 600,
              px: 2,
              '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f1f5f9' },
            }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={handleOpenAdd}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              backgroundColor: '#0f2b48',
              fontWeight: 600,
              px: 2.5,
              py: 1,
              '&:hover': { backgroundColor: '#1e3a8a' },
            }}
          >
            Add Warehouse
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(3, 1fr)',
          },
          gap: 2.5,
          mb: 3,
          width: '100%',
        }}
      >
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Warehouses
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5 }}>
                {warehouses.length}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Warehouse size={22} color="#2563eb" />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Operational Hubs
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#16a34a', mt: 0.5 }}>
                {activeCount}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={22} color="#16a34a" />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Cities Covered
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#9333ea', mt: 0.5 }}>
                {uniqueCities.length}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={22} color="#9333ea" />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden', width: '100%' }}>
        <Box sx={{ p: 2.5, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff' }}>
          <TextField
            placeholder="Search warehouse, contact person, or city..."
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value);
              setPage(0);
            }}
            size="small"
            sx={{ width: { xs: '100%', sm: 380 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#94a3b8" />
                </InputAdornment>
              ),
              sx: { borderRadius: 2, fontSize: '14px' },
            }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', width: 60 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Warehouse Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Contact Person</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Phone Number</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>City & State</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', width: 120 }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredWarehouses
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((wh, idx) => (
                  <TableRow key={wh._id || idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>
                      {page * rowsPerPage + idx + 1}
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Warehouse size={18} color="#2563eb" />
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a' }}>
                            {wh.warehouse}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {wh.email || '—'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <User size={15} color="#64748b" />
                        <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>
                          {wh.contactPerson}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone size={15} color="#64748b" />
                        <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 500, fontFamily: 'monospace' }}>
                          {wh.phoneNo}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <MapPin size={15} color="#64748b" />
                        <Typography variant="body2" sx={{ color: '#334155' }}>
                          {wh.city ? `${wh.city}${wh.state ? `, ${wh.state}` : ''}` : '—'}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={wh.status ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          backgroundColor: wh.status ? '#dcfce7' : '#fee2e2',
                          color: wh.status ? '#15803d' : '#b91c1c',
                          fontWeight: 700,
                          borderRadius: 1.5,
                          fontSize: '12px',
                        }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Tooltip title="Edit Warehouse">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(wh)}
                            sx={{ color: '#0284c7', backgroundColor: '#e0f2fe', '&:hover': { backgroundColor: '#bae6fd' } }}
                          >
                            <Edit2 size={15} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Warehouse">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteConfirmOpen(wh._id)}
                            sx={{ color: '#ef4444', backgroundColor: '#fee2e2', '&:hover': { backgroundColor: '#fecaca' } }}
                          >
                            <Trash2 size={15} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}

              {filteredWarehouses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Warehouse size={40} color="#94a3b8" style={{ marginBottom: 8 }} />
                    <Typography variant="body1" fontWeight={600} sx={{ color: '#334155' }}>
                      No Warehouses Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Try adjusting your search criteria or click "Add Warehouse" to register a new center.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredWarehouses.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ px: 3, py: 2.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#0f172a', fontSize: '18px' }}>
              {editId ? 'Edit Warehouse' : 'Add New Warehouse'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {editId ? 'Update facility parameters and supervisor contact details' : 'Register a new storage depot or fulfillment branch'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: '#64748b', '&:hover': { backgroundColor: '#e2e8f0' } }}>
            <X size={18} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Warehouse / Center Name <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="warehouse"
                placeholder="e.g. Central Chennai Hub"
                value={formData.warehouse}
                onChange={handleFormChange}
                error={!!errors.warehouse}
                helperText={errors.warehouse}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Supervisor / Manager Name <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="contactPerson"
                placeholder="e.g. Suresh Patel"
                value={formData.contactPerson}
                onChange={handleFormChange}
                error={!!errors.contactPerson}
                helperText={errors.contactPerson}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Official Email Address <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="email"
                placeholder="warehouse@company.com"
                value={formData.email}
                onChange={handleFormChange}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Primary Phone Number <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="phoneNo"
                placeholder="e.g. 9876543210"
                value={formData.phoneNo}
                onChange={handleFormChange}
                error={!!errors.phoneNo}
                helperText={errors.phoneNo}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Complete Physical Address <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                name="address"
                placeholder="Plot no, Industrial Area, Highway road..."
                value={formData.address}
                onChange={handleFormChange}
                error={!!errors.address}
                helperText={errors.address}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                City <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="city"
                placeholder="e.g. Chennai"
                value={formData.city}
                onChange={handleFormChange}
                error={!!errors.city}
                helperText={errors.city}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                State / Province
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="state"
                placeholder="e.g. Tamil Nadu"
                value={formData.state}
                onChange={handleFormChange}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Country
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="country"
                placeholder="e.g. India"
                value={formData.country}
                onChange={handleFormChange}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Postal / Zip Code
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="zipCode"
                placeholder="e.g. 600001"
                value={formData.zipCode}
                onChange={handleFormChange}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            <Box
              sx={{
                gridColumn: '1 / -1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                border: '1px solid #e2e8f0',
                borderRadius: 2.5,
                backgroundColor: formData.status ? '#f0fdf4' : '#f8fafc',
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a' }}>
                  Warehouse Status: {formData.status ? 'Active & Operational' : 'Inactive / Maintenance'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Active warehouses can receive inward deliveries and dispatch outward orders.
                </Typography>
              </Box>
              <Switch
                checked={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                color="primary"
              />
            </Box>
          </Box>
        </DialogContent>

        <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Button onClick={handleClose} sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600, px: 2.5 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              backgroundColor: '#0f2b48',
              fontWeight: 600,
              px: 3.5,
              py: 1,
              '&:hover': { backgroundColor: '#1e3a8a' },
            }}
          >
            {editId ? 'Update Warehouse' : 'Save Warehouse'}
          </Button>
        </Box>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#0f172a' }}>
            Confirm Delete Warehouse
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
            Are you sure you want to remove this warehouse?
          </Typography>
        </Box>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              backgroundColor: '#ef4444',
              fontWeight: 600,
              px: 2.5,
              '&:hover': { backgroundColor: '#dc2626' },
            }}
          >
            Delete
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
