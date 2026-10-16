import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  MenuItem,
  Paper,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import Pagination from '@mui/material/Pagination';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  Layers,
  Grid as GridIcon,
  GitFork,
  PackageX,
  Sparkles,
  Mail,
  Box as BoxIcon,
  Tag
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import AddProduct from './AddProduct';
import CategoryManagement from './CategoryManagement';
import SubCategoryManagement from './SubCategoryManagement';
import axios from 'axios';
import Productlist from '../Components/Productlsit';
import NoProduct from '../assets/img/No-Product.png';

const API_URL = 'http://localhost:5002/api';
const FILE_HOST = 'http://localhost:5002';

// --- safer URL builder
const getImageUrl = (img) => {
  if (!img) return '/no-image.png';
  const file = String(img)
    .replace(/\\/g, '/')
    .replace(/^\/?uploads\/?/i, '')
    .split('/')
    .pop();
  return `${FILE_HOST}/uploads/${encodeURIComponent(file)}`;
};

// --- remembers if an image failed and locks to the fallback
const ProductImage = ({ src, alt, style }) => {
  const [failed, setFailed] = useState(false);
  const finalSrc = failed ? '/no-image.png' : src;
  return (
    <img
      src={finalSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      style={style}
      draggable={false}
    />
  );
};

const Master = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    model: '',
    subCategory: '',
    search: '',
  });
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    productDescriptions: '',
    mrp: '',
    dealerPrice: '',
    uom: '',
    warranty: '',
    category: '',
    subCategory: '',
    stockStatus: '',
    reorderLevel: '',
    emailTo: '',
    productImage: null,
    isSpare: false,
    isAccessory: false,
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(9);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.warn('Error fetching categories:', error);
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      enqueueSnackbar('Error fetching products!', { variant: 'error' });
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();

    const handleCatUpdate = () => fetchCategories();
    window.addEventListener('app_categories_updated', handleCatUpdate);
    return () => window.removeEventListener('app_categories_updated', handleCatUpdate);
  }, [fetchCategories]);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setFormData({
      brand: '',
      model: '',
      productDescriptions: '',
      mrp: '',
      dealerPrice: '',
      uom: '',
      warranty: '',
      category: '',
      subCategory: '',
      reorderLevel: '',
      emailTo: '',
      stockStatus: '',
      productImage: null,
      isSpare: false,
      isAccessory: false,
    });
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const updatedFormData = { ...formData };
      const reorderQty = Number(updatedFormData.reorderLevel || 0);
      if (reorderQty === 0) {
        updatedFormData.stockStatus = 'Out of Stock';
      } else if (reorderQty > 0 && reorderQty <= 5) {
        updatedFormData.stockStatus = 'Low Stock';
      } else {
        updatedFormData.stockStatus = 'In Stock';
      }
      const payload = new FormData();
      Object.entries(updatedFormData).forEach(([key, value]) => {
        payload.append(key, value == null ? '' : value);
      });
      if (editMode) {
        if (formData.productImage && typeof formData.productImage !== 'string') {
          await axios.put(`${API_URL}/products/${editId}`, payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          const jsonPayload = { ...formData, stockStatus: updatedFormData.stockStatus };
          await axios.put(`${API_URL}/products/${editId}`, jsonPayload);
        }
        enqueueSnackbar('Product updated successfully!', { variant: 'success' });
      } else {
        await axios.post(`${API_URL}/products`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        enqueueSnackbar('Product added successfully!', { variant: 'success' });
      }

      // 🔔 Dispatch event so Notifications automatically syncs from database
      if (reorderQty === 0 || reorderQty <= 5) {
        window.dispatchEvent(new CustomEvent('app_stock_alert_updated'));
      }

      fetchProducts();
      handleClose();
    } catch (error) {
      console.error('Error saving product:', error.response ? error.response.data : error.message);
      enqueueSnackbar(`Error saving product: ${error.message}!`, { variant: 'error' });
    }
  };

  const handleEdit = (product) => {
    setEditMode(true);
    setEditId(product._id);
    setFormData({
      brand: product.brand || '',
      model: product.model || '',
      productDescriptions: product.productDescriptions || '',
      mrp: product.mrp ?? '',
      dealerPrice: product.dealerPrice ?? '',
      uom: product.uom || '',
      warranty: product.warranty || '',
      category: product.category || '',
      subCategory: product.subCategory || '',
      reorderLevel: product.reorderLevel ?? '',
      emailTo: product.emailTo || '',
      stockStatus: product.stockStatus || '',
      productImage: product.productImage || null,
      isSpare: product.isSpare || false,
      isAccessory: product.isAccessory || false,
    });
    setOpen(true);
  };

  const handleDelete = (productId) => {
    setSelected([productId]);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await Promise.all(selected.map((id) => axios.delete(`${API_URL}/products/${id}`)));
      enqueueSnackbar('Product deleted successfully!', { variant: 'success' });
      setSelected([]);
      setOpenDeleteDialog(false);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting products:', error);
      enqueueSnackbar('Error deleting products!', { variant: 'error' });
    }
  };

  const handleCancelDelete = () => setOpenDeleteDialog(false);

  const getStatusChipProps = (status) => {
    if (status === 'In Stock') {
      return { label: 'In Stock', backgroundColor: '#dcfce7', color: '#15803d' };
    } else if (status === 'Out of Stock') {
      return { label: 'Out of Stock', backgroundColor: '#fee2e2', color: '#b91c1c' };
    } else if (status === 'Low Stock') {
      return { label: 'Low Stock', backgroundColor: '#fef3c7', color: '#b45309' };
    }
    return { label: status || 'Unknown', backgroundColor: '#f1f5f9', color: '#475569' };
  };

  const filteredData = products.filter((product) => {
    const matchesCategory = selectedCategory
      ? (product.category || '').toLowerCase() === selectedCategory.toLowerCase()
      : true;
    const searchLow = (filters.search || '').toLowerCase();
    const matchesSearch =
      !searchLow ||
      (product.brand || '').toLowerCase().includes(searchLow) ||
      (product.model || '').toLowerCase().includes(searchLow) ||
      (product.category || '').toLowerCase().includes(searchLow) ||
      (product.subCategory || '').toLowerCase().includes(searchLow);

    return (
      matchesCategory &&
      matchesSearch &&
      (product.category || '').toLowerCase().includes(filters.category.toLowerCase()) &&
      (product.brand || '').toLowerCase().includes(filters.brand.toLowerCase()) &&
      (product.model || '').toLowerCase().includes(filters.model.toLowerCase()) &&
      (product.subCategory || '').toLowerCase().includes(filters.subCategory.toLowerCase())
    );
  });

  const pageCount = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = Math.min(filteredData.length, startIndex + rowsPerPage);
  const currentData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  useEffect(() => {
    setPage(1);
  }, [filters, products, rowsPerPage, selectedCategory]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2, width: '100%' }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
            Products Catalog & Master Directory
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Manage master products, categories, sub-categories, pricing, and stock indicators.
          </Typography>
        </Box>
      </Box>

      {/* Navigation Tabs */}
      <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', p: 0.8, mb: 3, backgroundColor: '#ffffff', display: 'inline-flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          onClick={() => setActiveTab(0)}
          startIcon={<BoxIcon size={16} />}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            px: 2.5,
            py: 0.8,
            fontWeight: 600,
            fontSize: '14px',
            backgroundColor: activeTab === 0 ? '#0f2b48' : 'transparent',
            color: activeTab === 0 ? '#ffffff' : '#64748b',
            '&:hover': { backgroundColor: activeTab === 0 ? '#1e3a8a' : '#f1f5f9' },
          }}
        >
          Products Catalog ({products.length})
        </Button>
        <Button
          onClick={() => setActiveTab(1)}
          startIcon={<Layers size={16} />}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            px: 2.5,
            py: 0.8,
            fontWeight: 600,
            fontSize: '14px',
            backgroundColor: activeTab === 1 ? '#0f2b48' : 'transparent',
            color: activeTab === 1 ? '#ffffff' : '#64748b',
            '&:hover': { backgroundColor: activeTab === 1 ? '#1e3a8a' : '#f1f5f9' },
          }}
        >
          Category Management
        </Button>
        <Button
          onClick={() => setActiveTab(2)}
          startIcon={<GitFork size={16} />}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            px: 2.5,
            py: 0.8,
            fontWeight: 600,
            fontSize: '14px',
            backgroundColor: activeTab === 2 ? '#0f2b48' : 'transparent',
            color: activeTab === 2 ? '#ffffff' : '#64748b',
            '&:hover': { backgroundColor: activeTab === 2 ? '#1e3a8a' : '#f1f5f9' },
          }}
        >
          Sub-Category Management
        </Button>
      </Paper>

      {/* Tab 0: Master Products Catalog */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
          {/* Category Quick Stat Carousel */}
          <Productlist
            categories={categories}
            setSelectedCategory={setSelectedCategory}
            products={products}
            onRefreshCategories={fetchCategories}
          />

          {/* Filter & Toolbar */}
          <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', p: 2.5, backgroundColor: '#ffffff', width: '100%' }}>
            <Box sx={{ display: 'flex', width: '100%', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
              <TextField
                fullWidth
                size="medium"
                name="search"
                placeholder="Search products by brand, model, category, or sub-category..."
                value={filters.search}
                onChange={handleFilterChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} color="#64748b" />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2.5,
                    fontSize: '15px',
                    backgroundColor: '#f8fafc',
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                    '&.Mui-focused fieldset': { borderColor: '#0f2b48' }
                  },
                }}
                sx={{ flex: 1 }}
              />

              <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0, width: { xs: '100%', md: 'auto' } }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshCw size={16} />}
                  onClick={fetchProducts}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2.5,
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    fontWeight: 600,
                    px: 3,
                    flex: { xs: 1, md: 'none' }
                  }}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Plus size={18} />}
                  onClick={handleClickOpen}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2.5,
                    backgroundColor: '#0f2b48',
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    '&:hover': { backgroundColor: '#1e3a8a' },
                    flex: { xs: 1, md: 'none' },
                    whiteSpace: 'nowrap'
                  }}
                >
                  Add Product
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Product Cards Grid */}
          {currentData.length === 0 ? (
            <Paper sx={{ p: 6, borderRadius: 3, border: '1px solid #e2e8f0', textAlign: 'center', backgroundColor: '#ffffff' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                <img src={NoProduct} alt="No products found" style={{ width: '120px', marginBottom: '8px', opacity: 0.8 }} />
                <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b' }}>
                  No Products Found
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Try adjusting your search criteria or select another category filter.
                </Typography>
              </Box>
            </Paper>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                },
                gap: 2.5,
                width: '100%',
              }}
            >
              {currentData.map((product) => {
                const statusStyle = getStatusChipProps(product.stockStatus);
                return (
                  <Card
                    key={product._id}
                    sx={{
                      borderRadius: 3,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      transition: 'all 0.25s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px -6px rgba(0, 0, 0, 0.08)',
                        borderColor: '#cbd5e1',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      {/* Top Header: Brand & Status Chip */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Chip
                          label={product.brand || 'No Brand'}
                          size="small"
                          icon={<Tag size={12} />}
                          sx={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 700, borderRadius: 1.5, fontSize: '12px' }}
                        />
                        <Chip
                          label={statusStyle.label}
                          size="small"
                          sx={{
                            backgroundColor: statusStyle.backgroundColor,
                            color: statusStyle.color,
                            fontWeight: 700,
                            borderRadius: 2,
                            fontSize: '11px',
                          }}
                        />
                      </Box>

                      {/* Main Product Info & Image Row */}
                      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f172a', lineHeight: 1.3, mb: 0.5 }}>
                            {product.model || 'No Model Name'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                            Sub-Category: <strong style={{ color: '#334155' }}>{product.subCategory || '—'}</strong>
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.3 }}>
                            Category: <strong style={{ color: '#334155' }}>{product.category || '—'}</strong>
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.3 }}>
                            Warranty: <strong style={{ color: '#334155' }}>{product.warranty || 'N/A'}</strong>
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: 2.5,
                            overflow: 'hidden',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#f8fafc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <ProductImage
                            src={getImageUrl(product.productImage)}
                            alt={product.model || 'Product'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Box>
                      </Box>

                      {/* Details Badge Row */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2, px: 1.5, borderRadius: 2, backgroundColor: '#f8fafc', mb: 2 }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '11px' }}>
                            Available Stock
                          </Typography>
                          <Typography variant="body2" fontWeight={800} sx={{ color: '#0f172a' }}>
                            {product.reorderLevel ?? 0} {product.uom || 'units'}
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '11px' }}>
                            Dealer Price
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
                            {Number(product.mrp || 0) > 0 && (
                              <Typography variant="caption" sx={{ color: '#94a3b8', textDecoration: 'line-through' }}>
                                ₹{Number(product.mrp).toLocaleString('en-IN')}
                              </Typography>
                            )}
                            <Typography variant="body2" fontWeight={800} sx={{ color: '#16a34a', fontSize: '15px' }}>
                              ₹{Number(product.dealerPrice || 0).toLocaleString('en-IN')}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {product.emailTo && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748b', fontSize: '12px' }}>
                          <Mail size={13} color="#94a3b8" />
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Alert: {product.emailTo}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>

                    {/* Card Actions Footer */}
                    <Box sx={{ px: 2.5, pb: 2.5, pt: 0, display: 'flex', gap: 1.5 }}>
                      <Button
                        fullWidth
                        size="small"
                        startIcon={<Edit2 size={14} />}
                        onClick={() => handleEdit(product)}
                        sx={{
                          textTransform: 'none',
                          borderRadius: 2,
                          backgroundColor: '#e0f2fe',
                          color: '#0284c7',
                          fontWeight: 600,
                          '&:hover': { backgroundColor: '#bae6fd' },
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        fullWidth
                        size="small"
                        startIcon={<Trash2 size={14} />}
                        onClick={() => handleDelete(product._id)}
                        sx={{
                          textTransform: 'none',
                          borderRadius: 2,
                          backgroundColor: '#fee2e2',
                          color: '#ef4444',
                          fontWeight: 600,
                          '&:hover': { backgroundColor: '#fecaca' },
                        }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Card>
                );
              })}
            </Box>
          )}

          {/* Pagination Footer */}
          {filteredData.length > 0 && (
            <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, backgroundColor: '#ffffff' }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Showing <strong>{filteredData.length ? startIndex + 1 : 0}</strong>–<strong>{endIndex}</strong> of <strong>{filteredData.length}</strong> products
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  select
                  size="small"
                  label="Per page"
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  sx={{ width: 110 }}
                  InputProps={{ sx: { borderRadius: 2, fontSize: '13px' } }}
                >
                  {[6, 9, 12, 15, 18, 24].map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
                <Pagination
                  count={pageCount}
                  page={page}
                  onChange={(_, p) => setPage(p)}
                  color="primary"
                  shape="rounded"
                />
              </Box>
            </Paper>
          )}

          {/* Add / Edit Product Modal */}
          <AddProduct
            open={open}
            handleClose={handleClose}
            handleSave={handleSave}
            formData={formData}
            setFormData={setFormData}
            editMode={editMode}
            fileHost={FILE_HOST}
            getImageUrl={getImageUrl}
          />

          {/* Delete Confirmation Dialog */}
          <Dialog open={openDeleteDialog} onClose={handleCancelDelete} PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete Product</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                Are you sure you want to delete the selected product? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={handleCancelDelete} sx={{ textTransform: 'none', color: '#64748b' }}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                variant="contained"
                sx={{ textTransform: 'none', borderRadius: 2, backgroundColor: '#ef4444', '&:hover': { backgroundColor: '#dc2626' } }}
              >
                Delete Product
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {/* Tab 1: Category Management */}
      {activeTab === 1 && <CategoryManagement />}

      {/* Tab 2: Sub-Category Management */}
      {activeTab === 2 && <SubCategoryManagement />}
    </Box>
  );
};

export default Master;
