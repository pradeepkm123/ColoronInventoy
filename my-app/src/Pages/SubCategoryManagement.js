import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
  Avatar,
  InputAdornment,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  GitFork,
  CheckCircle2,
  Boxes,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  UploadCloud,
  Layers,
  X,
  AlertTriangle
} from 'lucide-react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const API_BASE = 'https://coloroninventoy.onrender.com';

const SubCategoryManagement = () => {
  const [subCategories, setSubCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [subCategoryToDelete, setSubCategoryToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    createdOn: new Date(),
    status: true,
    image: null,
  });

  const fetchSubCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/subcategories`);
      const data = await res.json();
      setSubCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchSubCategories();
  }, [fetchSubCategories]);

  const handleOpen = () => {
    setSelectedSubCategory(null);
    setFormData({
      name: '',
      createdOn: new Date(),
      status: true,
      image: null,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedSubCategory(null);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleDateChange = (date) => {
    setFormData((p) => ({ ...p, createdOn: date || new Date() }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData((p) => ({ ...p, image: file }));
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('status', String(formData.status));
    formDataToSend.append('createdOn', (formData.createdOn || new Date()).toISOString());

    if (formData.image instanceof File) {
      formDataToSend.append('image', formData.image);
    }

    try {
      if (selectedSubCategory?._id) {
        await fetch(`${API_BASE}/api/subcategories/${selectedSubCategory._id}`, {
          method: 'PUT',
          body: formDataToSend,
        });
      } else {
        await fetch(`${API_BASE}/api/subcategories`, {
          method: 'POST',
          body: formDataToSend,
        });
      }
      fetchSubCategories();
      handleClose();
    } catch (error) {
      console.error('Error saving subcategory:', error);
    }
  };

  const handleEdit = (subCat) => {
    setSelectedSubCategory(subCat);
    setFormData({
      name: subCat.name || '',
      createdOn: subCat.createdOn ? new Date(subCat.createdOn) : new Date(),
      status: !!subCat.status,
      image: subCat.image || null,
    });
    setOpen(true);
  };

  const handleOpenDeleteConfirm = (subCat) => {
    setSubCategoryToDelete(subCat);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setSubCategoryToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!subCategoryToDelete?._id) return;
    try {
      await fetch(`${API_BASE}/api/subcategories/${subCategoryToDelete._id}`, { method: 'DELETE' });
      fetchSubCategories();
      handleCloseDeleteConfirm();
    } catch (error) {
      console.error('Error deleting subcategory:', error);
    }
  };

  const handleToggleStatus = async (subCat) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', subCat.name);
      formDataToSend.append('status', (!subCat.status).toString());

      await fetch(`${API_BASE}/api/subcategories/${subCat._id}`, {
        method: 'PUT',
        body: formDataToSend,
      });
      fetchSubCategories();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const activeCount = subCategories.filter((s) => s.status).length;
  const totalCount = subCategories.length;

  const filteredSubCategories = subCategories.filter((s) =>
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2, width: '100%' }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
            Sub Category Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Define detailed subcategories under your main categories for granular product classifications.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={fetchSubCategories}
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
            Add Sub Category
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
                Total Sub Categories
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5 }}>
                {totalCount}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GitFork size={22} color="#2563eb" />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Active Sub Categories
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
                Inactive / Hidden
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#ea580c', mt: 0.5 }}>
                {totalCount - activeCount}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Boxes size={22} color="#ea580c" />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Main Table Card */}
      <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden', width: '100%', mt: 3 }}>
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff' }}>
          <TextField
            placeholder="Search subcategory by title..."
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
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Sub Category Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Created Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubCategories.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((subCat, idx) => (
                <TableRow key={subCat._id || idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>{page * rowsPerPage + idx + 1}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {subCat.image ? (
                        <Avatar
                          src={`${API_BASE}/${subCat.image}`}
                          sx={{ width: 36, height: 36, borderRadius: 2, border: '1px solid #e2e8f0' }}
                        />
                      ) : (
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <GitFork size={18} color="#2563eb" />
                        </Box>
                      )}
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a' }}>
                        {subCat.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      {subCat.createdOn ? new Date(subCat.createdOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Click to toggle status">
                      <Chip
                        label={subCat.status ? 'Active' : 'Inactive'}
                        size="small"
                        onClick={() => handleToggleStatus(subCat)}
                        sx={{
                          backgroundColor: subCat.status ? '#dcfce7' : '#fee2e2',
                          color: subCat.status ? '#15803d' : '#b91c1c',
                          fontWeight: 600,
                          borderRadius: 2,
                          cursor: 'pointer',
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Tooltip title="Edit Sub Category">
                        <IconButton size="small" onClick={() => handleEdit(subCat)} sx={{ color: '#0284c7', backgroundColor: '#e0f2fe' }}>
                          <Edit2 size={15} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Sub Category">
                        <IconButton size="small" onClick={() => handleOpenDeleteConfirm(subCat)} sx={{ color: '#ef4444', backgroundColor: '#fee2e2' }}>
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
          count={filteredSubCategories.length}
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
              {selectedSubCategory ? 'Edit Sub Category' : 'Add New Sub Category'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {selectedSubCategory ? 'Update subcategory specifications and image' : 'Define new granular subcategory for catalog classification'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: '#64748b', '&:hover': { backgroundColor: '#e2e8f0' } }}>
            <X size={18} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Field: Sub Category Name */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Sub Category Name <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                name="name"
                fullWidth
                size="small"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="e.g. IP Dome Cameras, 4K Bullet Cameras, PoE Switches"
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Field: Registration Date */}
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

            {/* Field: Sub Category Active Switch */}
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
                  Catalog Visibility: {formData.status ? 'Active' : 'Hidden'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Active subcategories appear in product creation and filters.
                </Typography>
              </Box>
              <Switch
                checked={formData.status}
                onChange={(e) => setFormData((p) => ({ ...p, status: e.target.checked }))}
                color="primary"
              />
            </Box>

            {/* Field: Upload Image */}
            <Box
              sx={{
                p: 2,
                border: '1.5px dashed #cbd5e1',
                borderRadius: 2.5,
                backgroundColor: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 42, height: 42, borderRadius: 2, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UploadCloud size={20} color="#2563eb" />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ color: '#1e293b' }}>
                    {formData.image instanceof File ? formData.image.name : formData.image ? 'Sub Category Image Uploaded' : 'Upload Sub Category Image'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    PNG, JPG or WEBP up to 5MB
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="outlined"
                component="label"
                size="small"
                sx={{ textTransform: 'none', borderRadius: 2, borderColor: '#cbd5e1', color: '#334155', fontWeight: 600, px: 2.5 }}
              >
                {formData.image ? 'Change File' : 'Browse File'}
                <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
              </Button>
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
            {selectedSubCategory ? 'Update Sub Category' : 'Save Sub Category'}
          </Button>
        </Box>
      </Dialog>

      {/* Delete Confirmation Permission Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        <Box sx={{ p: 2.5, textAlign: 'center' }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <AlertTriangle size={26} color="#ef4444" />
          </Box>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#0f172a', mb: 1 }}>
            Confirm Delete Sub Category
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
            Are you sure you want to delete sub category{' '}
            <strong style={{ color: '#0f172a' }}>"{subCategoryToDelete?.name}"</strong>?
          </Typography>
          <Typography variant="caption" sx={{ color: '#ef4444', display: 'block', fontWeight: 600 }}>
            This action cannot be undone.
          </Typography>
        </Box>
        <Box sx={{ px: 2.5, pb: 2, display: 'flex', gap: 1.5, justifyContent: 'center' }}>
          <Button
            onClick={handleCloseDeleteConfirm}
            variant="outlined"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: '#cbd5e1',
              color: '#475569',
              fontWeight: 600,
              flex: 1,
              '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            startIcon={<Trash2 size={16} />}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontWeight: 600,
              flex: 1,
              '&:hover': { backgroundColor: '#dc2626' },
            }}
          >
            Delete
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default SubCategoryManagement;
