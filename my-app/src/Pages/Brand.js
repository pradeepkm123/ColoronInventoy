import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Grid,
  Card,
  CardContent,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Award,
  CheckCircle2,
  Tag,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  Sparkles,
  X
} from 'lucide-react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';

const API_BASE = 'https://coloroninventoy.onrender.com/api';

const Brand = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [brands, setBrands] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    brand: '',
    createdOn: new Date(),
    status: true,
  });

  const [editId, setEditId] = useState(null);

  const fetchBrands = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/brands`);
      setBrands(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Error fetching brands!', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleOpen = () => {
    setOpen(true);
    setEditId(null);
    setFormData({
      brand: '',
      createdOn: new Date(),
      status: true,
    });
  };

  const handleClose = () => {
    setOpen(false);
    setEditId(null);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      createdOn: date || new Date(),
    }));
  };

  const handleSave = async () => {
    if (!formData.brand.trim()) return;

    try {
      const payload = {
        ...formData,
        createdOn: formData.createdOn ? new Date(formData.createdOn) : new Date(),
      };

      if (editId) {
        await axios.put(`${API_BASE}/brands/${editId}`, payload);
        enqueueSnackbar('Brand updated successfully!', { variant: 'success' });
      } else {
        await axios.post(`${API_BASE}/brands`, payload);
        enqueueSnackbar('Brand added successfully!', { variant: 'success' });
      }

      await fetchBrands();
      handleClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Error saving brand!', { variant: 'error' });
    }
  };

  const handleEdit = (brand) => {
    setFormData({
      brand: brand?.brand || '',
      createdOn: brand?.createdOn ? new Date(brand.createdOn) : new Date(),
      status: !!brand?.status,
    });
    setEditId(brand?._id || null);
    setOpen(true);
  };

  const handleDeleteConfirmOpen = (id) => {
    setBrandToDelete(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirmClose = () => {
    setConfirmOpen(false);
    setBrandToDelete(null);
  };

  const handleDelete = async () => {
    if (!brandToDelete) return;

    try {
      await axios.delete(`${API_BASE}/brands/${brandToDelete}`);
      enqueueSnackbar('Brand deleted successfully!', { variant: 'success' });
      await fetchBrands();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Error deleting brand!', { variant: 'error' });
    } finally {
      handleDeleteConfirmClose();
    }
  };

  const handleToggleStatus = async (brand) => {
    try {
      await axios.put(`${API_BASE}/brands/${brand._id}`, {
        ...brand,
        status: !brand.status,
      });
      enqueueSnackbar(`Status updated to ${!brand.status ? 'Active' : 'Inactive'}`, { variant: 'success' });
      await fetchBrands();
    } catch (error) {
      enqueueSnackbar('Failed to update status', { variant: 'error' });
    }
  };

  const activeCount = brands.filter((b) => b.status).length;
  const totalCount = brands.length;

  const filteredBrands = brands.filter((b) =>
    (b?.brand || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2, width: '100%' }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
            Brands Directory
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Manage authorized manufacturer brands, OEM partners, and product brand identifiers.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={fetchBrands}
            sx={{ textTransform: 'none', borderRadius: 2, borderColor: '#cbd5e1', color: '#475569', fontWeight: 600 }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={handleOpen}
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
            Add Brand
          </Button>
        </Box>
      </Box>

      {/* KPI Cards (Full Screen Grid) */}
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
                Total Brands
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5 }}>
                {totalCount}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={22} color="#2563eb" />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Active Brands
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
                Inactive / Archived
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#ea580c', mt: 0.5 }}>
                {totalCount - activeCount}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={22} color="#ea580c" />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Main Table Card */}
      <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden', width: '100%', mt: 3 }}>
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff' }}>
          <TextField
            placeholder="Search brand name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ width: { xs: '100%', sm: 340 } }}
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
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Brand Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Created Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBrands.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((b, idx) => (
                <TableRow key={b._id || idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>{page * rowsPerPage + idx + 1}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Award size={18} color="#2563eb" />
                      </Box>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a' }}>
                        {b.brand}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      {b.createdOn ? new Date(b.createdOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Click to toggle status">
                      <Chip
                        label={b.status ? 'Active' : 'Inactive'}
                        size="small"
                        onClick={() => handleToggleStatus(b)}
                        sx={{
                          backgroundColor: b.status ? '#dcfce7' : '#fee2e2',
                          color: b.status ? '#15803d' : '#b91c1c',
                          fontWeight: 600,
                          borderRadius: 2,
                          cursor: 'pointer',
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Tooltip title="Edit Brand">
                        <IconButton size="small" onClick={() => handleEdit(b)} sx={{ color: '#0284c7', backgroundColor: '#e0f2fe' }}>
                          <Edit2 size={15} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Brand">
                        <IconButton size="small" onClick={() => handleDeleteConfirmOpen(b._id)} sx={{ color: '#ef4444', backgroundColor: '#fee2e2' }}>
                          <Trash2 size={15} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredBrands.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Add / Edit Dialog with Proper Top-Labeled Input Design */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
          },
        }}
      >
        {/* Modal Header */}
        <Box sx={{ px: 3, py: 2.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#0f172a', fontSize: '18px' }}>
              {editId ? 'Edit Brand Information' : 'Add New Brand'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {editId ? 'Update brand name and catalog status' : 'Register authorized manufacturer brand or partner'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: '#64748b', '&:hover': { backgroundColor: '#e2e8f0' } }}>
            <X size={18} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Field: Brand Name */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Brand Name <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                name="brand"
                fullWidth
                size="small"
                value={formData.brand}
                onChange={handleFormChange}
                placeholder="e.g. Hikvision, CP Plus, D-Link, Seagate, Dahua"
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Field: Registered Date */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Registration Date
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  value={formData.createdOn}
                  onChange={handleDateChange}
                  slotProps={{ textField: { fullWidth: true, size: 'small', InputProps: { sx: { borderRadius: 2, backgroundColor: '#fff' } } } }}
                />
              </LocalizationProvider>
            </Box>

            {/* Field: Brand Active Switch */}
            <Box
              sx={{
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
                  Brand Status: {formData.status ? 'Active in Catalog' : 'Inactive / Hidden'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Active brands are selectable during product creation and invoicing.
                </Typography>
              </Box>
              <Switch
                checked={formData.status}
                onChange={(e) => setFormData((p) => ({ ...p, status: e.target.checked }))}
                color="primary"
              />
            </Box>
          </Box>
        </DialogContent>

        {/* Modal Actions */}
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
            {editId ? 'Update Brand' : 'Save Brand'}
          </Button>
        </Box>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={confirmOpen} onClose={handleDeleteConfirmClose} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete Brand</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            Are you sure you want to delete this brand? Products linked to this brand may be affected.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleDeleteConfirmClose} sx={{ textTransform: 'none', color: '#64748b' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            sx={{ textTransform: 'none', borderRadius: 2, backgroundColor: '#ef4444', '&:hover': { backgroundColor: '#dc2626' } }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Brand;
