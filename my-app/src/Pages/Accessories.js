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
  Card,
  CardContent,
  Tooltip,
  Switch,
} from '@mui/material';
import {
  Cpu,
  CheckCircle2,
  PackageX,
  IndianRupee,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  X,
  Tag,
  Package,
  Layers,
} from 'lucide-react';
import { useSnackbar } from 'notistack';

const API_BASE = 'http://localhost:5002/api';

const Accessories = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Accessories',
    brand: '',
    price: '',
    stock: '',
    description: '',
    status: true,
  });

  const [editId, setEditId] = useState(null);

  const fetchAccessories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/accessories`);
      const list = Array.isArray(res.data) ? res.data : [];

      // Map strictly real accessory documents from DB
      const accItems = list.map((a) => ({
        _id: a._id,
        name: a.name || a.sku || 'Accessory',
        sku: a.sku || '—',
        category: a.category || 'Accessories',
        brand: a.brand || '—',
        price: Number(a.price) || Number(a.dealerPrice) || 0,
        dealerPrice: Number(a.dealerPrice) || Number(a.price) || 0,
        stock: Number(a.stock) || 0,
        description: a.description || '',
        status: a.status !== undefined ? a.status : true,
      }));

      setAccessories(accItems);
    } catch (error) {
      console.error('Error fetching accessories from DB:', error);
      enqueueSnackbar('Error fetching accessories from database!', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchAccessories();
  }, [fetchAccessories]);

  const handleOpen = () => {
    setOpen(true);
    setEditId(null);
    setFormData({
      name: '',
      sku: '',
      category: 'Accessories',
      brand: '',
      price: '',
      stock: '',
      description: '',
      status: true,
    });
  };

  const handleClose = () => {
    setOpen(false);
    setEditId(null);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      enqueueSnackbar('Accessory name is required!', { variant: 'warning' });
      return;
    }

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock, 10) || 0,
      };

      if (editId) {
        await axios.put(`${API_BASE}/accessories/${editId}`, payload);
        enqueueSnackbar('Accessory updated successfully!', { variant: 'success' });
      } else {
        await axios.post(`${API_BASE}/accessories`, payload);
        enqueueSnackbar('Accessory added successfully!', { variant: 'success' });
      }

      await fetchAccessories();
      handleClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Error saving accessory!', { variant: 'error' });
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item?.name || '',
      sku: item?.sku === '—' ? '' : item?.sku || '',
      category: item?.category || 'Accessories',
      brand: item?.brand === '—' ? '' : item?.brand || '',
      price: item?.price ?? '',
      stock: item?.stock ?? '',
      description: item?.description || '',
      status: item?.status !== undefined ? item.status : true,
    });
    setEditId(item?._id || null);
    setOpen(true);
  };

  const handleDeleteConfirmOpen = (id) => {
    setItemToDelete(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirmClose = () => {
    setConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`${API_BASE}/accessories/${itemToDelete}`);
      enqueueSnackbar('Accessory deleted successfully!', { variant: 'success' });
      await fetchAccessories();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Error deleting accessory!', { variant: 'error' });
    } finally {
      handleDeleteConfirmClose();
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      if (item.isProduct) {
        await axios.put(`${API_BASE}/products/${item._id}`, {
          stockStatus: !item.status ? 'In Stock' : 'Out of Stock'
        });
      } else {
        await axios.put(`${API_BASE}/accessories/${item._id}`, {
          ...item,
          status: !item.status,
        });
      }
      enqueueSnackbar(`Status updated to ${!item.status ? 'Active' : 'Inactive'}`, { variant: 'success' });
      await fetchAccessories();
    } catch (error) {
      enqueueSnackbar('Failed to update status', { variant: 'error' });
    }
  };

  const activeCount = accessories.filter((a) => a.status).length;
  const totalCount = accessories.length;
  const totalStock = accessories.reduce((sum, a) => sum + (Number(a.stock) || 0), 0);
  const totalValue = accessories.reduce((sum, a) => sum + ((Number(a.price) || 0) * (Number(a.stock) || 1)), 0);

  const filtered = accessories.filter((a) =>
    (a?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a?.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a?.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a?.brand || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      {/* Header with Title & Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe', flexShrink: 0 }}>
            <Cpu size={22} color="#2563eb" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
              Accessories
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.2 }}>
              Manage accessory items, inward stock levels, pricing, and catalog availability.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={fetchAccessories}
            startIcon={<RefreshCw size={16} className={loading ? 'spin' : ''} />}
            sx={{ borderRadius: 2, textTransform: 'none', borderColor: '#cbd5e1', color: '#475569', '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f1f5f9' } }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            onClick={handleOpen}
            startIcon={<Plus size={16} />}
            sx={{
              backgroundColor: '#2563eb',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              px: 2,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              '&:hover': { backgroundColor: '#1d4ed8' },
            }}
          >
            + Add Accessory
          </Button>
        </Box>
      </Box>

      {/* KPI Cards — 4 Columns */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2.5,
          mb: 3,
          width: '100%',
        }}
      >
        {/* Total Accessories */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Accessories
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5 }}>
                {totalCount}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={22} color="#2563eb" />
            </Box>
          </CardContent>
        </Card>

        {/* Active Items */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Active Items
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

        {/* Total Stock */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Stock
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#0891b2', mt: 0.5 }}>
                {totalStock}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={22} color="#0891b2" />
            </Box>
          </CardContent>
        </Card>

        {/* Total Accessories Value */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Value
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#7c3aed', mt: 0.5 }}>
                ₹{totalValue.toLocaleString('en-IN')}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={22} color="#7c3aed" />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Table Card */}
      <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden', width: '100%' }}>
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff' }}>
          <TextField
            placeholder="Search by name, category or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ width: { xs: '100%', sm: 360 } }}
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
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', width: 50 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Accessory</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Brand</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Price / Unit</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Stock</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', width: 100 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, idx) => (
                <TableRow key={item._id || idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>{page * rowsPerPage + idx + 1}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Cpu size={18} color="#2563eb" />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a' }}>
                          {item.name}
                        </Typography>
                        {item.description && (
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            {item.description.length > 45 ? item.description.slice(0, 45) + '…' : item.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {item.category ? (
                      <Chip
                        label={item.category}
                        size="small"
                        icon={<Layers size={12} />}
                        sx={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: '12px' }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ color: '#cbd5e1' }}>—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                      {item.brand || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                      ₹{Number(item.price || item.dealerPrice || 0).toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${item.stock ?? 0} units`}
                      size="small"
                      sx={{
                        backgroundColor: Number(item.stock) > 0 ? '#dcfce7' : '#fee2e2',
                        color: Number(item.stock) > 0 ? '#15803d' : '#b91c1c',
                        fontWeight: 600,
                        fontSize: '12px',
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Click to toggle status">
                      <Chip
                        label={item.status ? 'Active' : 'Inactive'}
                        size="small"
                        onClick={() => handleToggleStatus(item)}
                        sx={{
                          backgroundColor: item.status ? '#dcfce7' : '#fee2e2',
                          color: item.status ? '#15803d' : '#b91c1c',
                          fontWeight: 600,
                          borderRadius: 2,
                          cursor: 'pointer',
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="Edit Accessory">
                        <IconButton size="small" onClick={() => handleEdit(item)} sx={{ color: '#0284c7', '&:hover': { backgroundColor: '#e0f2fe' } }}>
                          <Edit2 size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Accessory">
                        <IconButton size="small" onClick={() => handleDeleteConfirmOpen(item._id)} sx={{ color: '#ef4444', '&:hover': { backgroundColor: '#fee2e2' } }}>
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                      <PackageX size={36} color="#cbd5e1" />
                      <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                        No accessories found
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
                        {searchQuery ? 'Try a different search term' : 'Record stock in Stock Inward / Store Inward or click "Add Accessory"'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Add / Edit Dialog */}
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
              {editId ? 'Edit Accessory' : 'Add New Accessory'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {editId ? 'Update accessory details, pricing and stock' : 'Register a new accessory item to the catalog'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: '#64748b', '&:hover': { backgroundColor: '#e2e8f0' } }}>
            <X size={18} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Accessory Name */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Accessory Name <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                name="name"
                fullWidth
                size="small"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="e.g. HDMI Cable, Power Adapter, BNC Connector, Mounting Bracket"
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* SKU & Category Row */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                  SKU / Barcode
                </Typography>
                <TextField
                  name="sku"
                  fullWidth
                  size="small"
                  value={formData.sku}
                  onChange={handleFormChange}
                  placeholder="e.g. ACC-001"
                  InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                  Category
                </Typography>
                <TextField
                  name="category"
                  fullWidth
                  size="small"
                  value={formData.category}
                  onChange={handleFormChange}
                  placeholder="e.g. Accessories, Cables, Adapters"
                  InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
                />
              </Box>
            </Box>

            {/* Brand & Price Row */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                  Brand
                </Typography>
                <TextField
                  name="brand"
                  fullWidth
                  size="small"
                  value={formData.brand}
                  onChange={handleFormChange}
                  placeholder="e.g. COLORON, Lookman, Generic"
                  InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                  Price (₹)
                </Typography>
                <TextField
                  name="price"
                  fullWidth
                  size="small"
                  type="number"
                  value={formData.price}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
                />
              </Box>
            </Box>

            {/* Stock */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Stock Quantity
              </Typography>
              <TextField
                name="stock"
                fullWidth
                size="small"
                type="number"
                value={formData.stock}
                onChange={handleFormChange}
                placeholder="0"
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Description */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Description
              </Typography>
              <TextField
                name="description"
                fullWidth
                size="small"
                multiline
                rows={2}
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Brief description of the accessory..."
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Status Switch */}
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
                  Status: {formData.status ? 'Active in Catalog' : 'Inactive / Hidden'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Active accessories are visible and available for selection.
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
            {editId ? 'Update Accessory' : 'Save Accessory'}
          </Button>
        </Box>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={confirmOpen} onClose={handleDeleteConfirmClose} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete Accessory</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            Are you sure you want to delete this accessory? This action cannot be undone.
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

export default Accessories;
