import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Wrench,
  Package,
  Layers,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit3,
  Camera,
  HardDrive,
  Target,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowDownToLine,
  Sliders,
  Check,
  X,
  FileText,
  Clock,
  User,
  Barcode,
  FolderPlus,
  Tag,
  Building,
  ChevronRight,
  TrendingDown,
  CircuitBoard,
  Trash2,
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useUser } from './UserContext';

const API_BASE = 'https://coloroninventoy.onrender.com/api';

export default function SparePartsManagement() {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useUser();

  const roleLower = (user?.role || '').toLowerCase().trim();
  const isSuperAdmin = ['admin', 'super admin', 'manager', 'headoffice'].includes(roleLower) || roleLower.includes('admin');
  const isServicePerson = roleLower.includes('service') || roleLower === 'engineer' || roleLower === 'technician';

  // Data states
  const [spareParts, setSpareParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // 360° Details Modal State
  const [selectedPartDetails, setSelectedPartDetails] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState(0);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Add / Edit Spare Part Modal State
  const [partModalOpen, setPartModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPartId, setEditingPartId] = useState(null);
  const [submittingPart, setSubmittingPart] = useState(false);
  const [partForm, setPartForm] = useState({
    name: '',
    code: '',
    category: '',
    unit: 'PCS',
    trackingType: 'SERIALIZED',
    minimumStock: 5,
    reorderLevel: 10,
    purchaseCost: 0,
    sellingPrice: 0,
    description: '',
    initialStock: 0,
    totalStock: 0,
    location: 'Main Warehouse',
  });

  // Add Custom Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Delete Category Modal State
  const [deleteCategoryModalOpen, setDeleteCategoryModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState('');
  const [submittingCategoryDelete, setSubmittingCategoryDelete] = useState(false);

  // Quick Inward Stock Modal State
  const [inwardModalOpen, setInwardModalOpen] = useState(false);
  const [inwardTargetPart, setInwardTargetPart] = useState(null);
  const [inwardQty, setInwardQty] = useState(10);
  const [inwardLocation, setInwardLocation] = useState('Main Warehouse');
  const [inwardNotes, setInwardNotes] = useState('');
  const [submittingInward, setSubmittingInward] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetPart, setDeleteTargetPart] = useState(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Fetch Categories & Analytics
  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/spare-parts/categories`);
      if (res.data && res.data.success) {
        setCategories(res.data.data || []);
      }
    } catch (err) {
      console.warn('Fetch categories error:', err);
    }
  }, []);

  // Fetch Spare Parts with active filters (supports silent background sync)
  const fetchSpareParts = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategoryTab !== 'ALL') params.append('category', selectedCategoryTab);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (stockStatusFilter !== 'ALL') params.append('stockStatus', stockStatusFilter);

      const res = await axios.get(`${API_BASE}/spare-parts?${params.toString()}`);
      if (res.data && res.data.success) {
        setSpareParts(res.data.data || []);
      }
    } catch (err) {
      if (!isBackground) {
        console.error('Fetch spare parts error:', err);
        enqueueSnackbar('Failed to load spare parts', { variant: 'error' });
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [selectedCategoryTab, searchQuery, stockStatusFilter, enqueueSnackbar]);

  // Fetch Products for Category Compatibility Mapping
  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/products`);
      const list = Array.isArray(res.data) ? res.data : res.data.products || [];
      setAllProducts(list);
    } catch (err) {
      console.warn('Fetch products error:', err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchSpareParts(false);
  }, [fetchCategories, fetchProducts, fetchSpareParts]);

  // ⚡ Real-Time Auto Sync (Poll every 3 seconds & on tab focus / visibility change)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCategories();
      fetchSpareParts(true);
    }, 3000);

    const handleFocus = () => {
      fetchCategories();
      fetchSpareParts(true);
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        fetchCategories();
        fetchSpareParts(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchCategories, fetchSpareParts]);

  // Get dynamic icon & styling for category cards
  const getCategoryMeta = (catName) => {
    const c = (catName || '').toLowerCase();
    if (c.includes('camera') || c === 'cctv') {
      return {
        icon: <Camera size={22} />,
        bgColor: '#eff6ff',
        textColor: '#1d4ed8',
        borderColor: '#bfdbfe',
        activeBg: '#2563eb',
      };
    }
    if (c.includes('nvr') || c.includes('dvr') || c.includes('xvr')) {
      return {
        icon: <HardDrive size={22} />,
        bgColor: '#faf5ff',
        textColor: '#7c3aed',
        borderColor: '#e9d5ff',
        activeBg: '#7c3aed',
      };
    }
    if (c.includes('ptz')) {
      return {
        icon: <Target size={22} />,
        bgColor: '#fff7ed',
        textColor: '#ea580c',
        borderColor: '#fed7aa',
        activeBg: '#ea580c',
      };
    }
    return {
      icon: <Layers size={22} />,
      bgColor: '#f1f5f9',
      textColor: '#334155',
      borderColor: '#cbd5e1',
      activeBg: '#0f172a',
    };
  };

  // Status Badge Helper
  const getStatusChip = (status) => {
    if (status === 'OUT_OF_STOCK') {
      return (
        <Chip
          icon={<XCircle size={13} color="#dc2626" />}
          label="Out of Stock"
          size="small"
          sx={{ fontWeight: 800, fontSize: '11px', backgroundColor: '#fee2e2', color: '#dc2626' }}
        />
      );
    }
    if (status === 'LOW_STOCK') {
      return (
        <Chip
          icon={<AlertTriangle size={13} color="#ea580c" />}
          label="Low Stock"
          size="small"
          sx={{ fontWeight: 800, fontSize: '11px', backgroundColor: '#ffedd5', color: '#ea580c' }}
        />
      );
    }
    return (
      <Chip
        icon={<CheckCircle2 size={13} color="#16a34a" />}
        label="Available"
        size="small"
        sx={{ fontWeight: 800, fontSize: '11px', backgroundColor: '#dcfce7', color: '#16a34a' }}
      />
    );
  };

  // Open 360° Details Modal
  const handleOpenDetails = async (partId) => {
    try {
      setDetailsLoading(true);
      setDetailsModalOpen(true);
      setDetailsTab(0);
      const res = await axios.get(`${API_BASE}/spare-parts/${partId}`);
      if (res.data && res.data.success) {
        setSelectedPartDetails(res.data.data);
      }
    } catch (err) {
      console.error('Fetch part details error:', err);
      enqueueSnackbar('Could not load spare part details', { variant: 'error' });
    } finally {
      setDetailsLoading(false);
    }
  };

  // Open Add Spare Part Modal
  const handleOpenAddModal = (defaultCategory = '') => {
    setIsEditing(false);
    setEditingPartId(null);
    let chosenCat = '';
    if (defaultCategory && defaultCategory !== 'ALL') {
      chosenCat = defaultCategory;
    } else if (categories.length > 0) {
      chosenCat = categories[0].category;
    }
    setPartForm({
      name: '',
      code: '',
      category: chosenCat,
      unit: 'PCS',
      trackingType: 'SERIALIZED',
      minimumStock: 5,
      reorderLevel: 10,
      purchaseCost: 0,
      sellingPrice: 0,
      description: '',
      initialStock: 0,
      totalStock: 0,
      location: 'Main Warehouse',
    });
    setPartModalOpen(true);
  };

  // Open Edit Spare Part Modal
  const handleOpenEditModal = (part) => {
    setIsEditing(true);
    setEditingPartId(part._id);
    setPartForm({
      name: part.name || '',
      code: part.code || '',
      category: part.category || '',
      unit: part.unit || 'PCS',
      trackingType: part.trackingType || 'SERIALIZED',
      minimumStock: part.minimumStock !== undefined ? part.minimumStock : 5,
      reorderLevel: part.reorderLevel !== undefined ? part.reorderLevel : 10,
      purchaseCost: part.purchaseCost !== undefined ? part.purchaseCost : 0,
      sellingPrice: part.sellingPrice !== undefined ? part.sellingPrice : 0,
      description: part.description || '',
      initialStock: part.totalStock !== undefined ? part.totalStock : 0,
      totalStock: part.totalStock !== undefined ? part.totalStock : 0,
      location: 'Main Warehouse',
    });
    setPartModalOpen(true);
  };

  // Category change inside Add/Edit Form
  const handleFormCategoryChange = (newCat) => {
    setPartForm({
      ...partForm,
      category: newCat,
    });
  };

  // Submit Add / Edit Spare Part
  const handleSavePartSubmit = async () => {
    if (!partForm.name.trim()) {
      enqueueSnackbar('Please enter spare part name', { variant: 'warning' });
      return;
    }
    if (!partForm.category || !partForm.category.trim()) {
      enqueueSnackbar('Please select or add a product category', { variant: 'warning' });
      return;
    }
    try {
      setSubmittingPart(true);
      const stockVal = isEditing
        ? Number(partForm.totalStock !== undefined ? partForm.totalStock : partForm.initialStock) || 0
        : Number(partForm.initialStock) || 0;

      const payload = {
        ...partForm,
        name: partForm.name.trim(),
        category: partForm.category.trim(),
        code: (partForm.code || '').trim().toUpperCase(),
        minimumStock: Number(partForm.minimumStock) || 0,
        reorderLevel: Number(partForm.reorderLevel) || 0,
        purchaseCost: Number(partForm.purchaseCost) || 0,
        sellingPrice: Number(partForm.sellingPrice) || Number(partForm.purchaseCost) || 0,
        totalStock: stockVal,
        stock: stockVal,
        initialStock: stockVal,
      };

      if (isEditing && editingPartId) {
        await axios.put(`${API_BASE}/spare-parts/${editingPartId}`, payload);
        enqueueSnackbar('Spare part updated successfully!', { variant: 'success' });
      } else {
        await axios.post(`${API_BASE}/spare-parts`, payload);
        enqueueSnackbar('Spare part created successfully!', { variant: 'success' });
      }
      setPartModalOpen(false);
      await fetchSpareParts(false);
      await fetchCategories();
      if (detailsModalOpen && selectedPartDetails) {
        handleOpenDetails(editingPartId || selectedPartDetails._id);
      }
    } catch (err) {
      console.error('Save spare part error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to save spare part', { variant: 'error' });
    } finally {
      setSubmittingPart(false);
    }
  };

  // Submit Inward Stock
  const handleInwardSubmit = async () => {
    if (!inwardQty || Number(inwardQty) <= 0) {
      enqueueSnackbar('Please enter a valid stock quantity', { variant: 'warning' });
      return;
    }
    try {
      setSubmittingInward(true);
      await axios.post(`${API_BASE}/spare-parts/${inwardTargetPart._id}/stock-inward`, {
        quantity: Number(inwardQty),
        location: inwardLocation,
        notes: inwardNotes,
        performedBy: user?.name || 'Super Admin',
      });
      enqueueSnackbar(`Stock added +${inwardQty} for ${inwardTargetPart.name}!`, { variant: 'success' });
      setInwardModalOpen(false);
      fetchSpareParts();
      fetchCategories();
      if (detailsModalOpen && selectedPartDetails?._id === inwardTargetPart._id) {
        handleOpenDetails(inwardTargetPart._id);
      }
    } catch (err) {
      console.error('Inward stock error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to inward stock', { variant: 'error' });
    } finally {
      setSubmittingInward(false);
    }
  };

  // Add Custom Category to DB
  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      enqueueSnackbar('Please enter a category name', { variant: 'warning' });
      return;
    }
    try {
      setSubmittingCategory(true);
      const res = await axios.post(`${API_BASE}/spare-parts/categories`, { name: trimmed });
      if (res.data && res.data.success) {
        enqueueSnackbar(res.data.message || `Category "${trimmed}" saved to DB!`, { variant: 'success' });
        await fetchCategories();
        setSelectedCategoryTab(trimmed);
        setPartForm((prev) => ({ ...prev, category: trimmed }));
        setNewCategoryName('');
        setCategoryModalOpen(false);
      }
    } catch (err) {
      console.error('Create category error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to save category to DB', { variant: 'error' });
    } finally {
      setSubmittingCategory(false);
    }
  };

  // Delete Category from DB
  const handleDeleteCategorySubmit = async () => {
    if (!categoryToDelete) return;
    try {
      setSubmittingCategoryDelete(true);
      const res = await axios.delete(`${API_BASE}/spare-parts/categories/${encodeURIComponent(categoryToDelete)}`);
      if (res.data && res.data.success) {
        enqueueSnackbar(res.data.message || `Category "${categoryToDelete}" deleted!`, { variant: 'success' });
        if (selectedCategoryTab.toLowerCase() === categoryToDelete.toLowerCase()) {
          setSelectedCategoryTab('ALL');
        }
        await fetchCategories();
        setDeleteCategoryModalOpen(false);
        setCategoryToDelete('');
      }
    } catch (err) {
      console.error('Delete category error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete category', { variant: 'error' });
    } finally {
      setSubmittingCategoryDelete(false);
    }
  };

  // Submit Delete Spare Part
  const handleDeleteSubmit = async () => {
    if (!deleteTargetPart) return;
    try {
      setSubmittingDelete(true);
      await axios.delete(`${API_BASE}/spare-parts/${deleteTargetPart._id}`);
      enqueueSnackbar(`Spare part "${deleteTargetPart.name}" deleted successfully!`, { variant: 'success' });
      setDeleteModalOpen(false);
      setDeleteTargetPart(null);
      fetchSpareParts(false);
      fetchCategories();
    } catch (err) {
      console.error('Delete spare part error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete spare part', { variant: 'error' });
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Filter products for the current selected category inside the modal
  const currentCategoryProducts = allProducts.filter((p) => {
    const c = (p.category || p.subCategory || '').toLowerCase();
    const target = (partForm.category || '').toLowerCase();
    if (target.includes('camera')) return c.includes('camera') || c === 'cctv';
    if (target.includes('nvr') || target.includes('dvr')) return c.includes('nvr') || c.includes('dvr');
    if (target.includes('ptz')) return c.includes('ptz');
    return c.includes(target) || !target;
  });

  return (
    <Box sx={{ p: { xs: 2, sm: 3.5 }, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* ========================================================================= */}
      {/* HEADER BAR */}
      {/* ========================================================================= */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 3, backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)' }}>
            <CircuitBoard size={26} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={900} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
              Spare Parts Management
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '12.5px' }}>
              Manage category-wise spare parts, compatible products, stock, and service usage.
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* Real-time sync indicator */}
          <Chip
            label="● Live Sync Active"
            size="small"
            sx={{
              backgroundColor: '#ecfdf5',
              color: '#059669',
              fontWeight: 800,
              fontSize: '11px',
              border: '1px solid #a7f3d0',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.65 },
              },
            }}
          />

          <Button
            variant="outlined"
            onClick={() => {
              fetchCategories();
              fetchSpareParts(false);
            }}
            startIcon={<RefreshCw size={15} />}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, color: '#475569', borderColor: '#cbd5e1' }}
          >
            Refresh
          </Button>

          {isSuperAdmin && (
            <>
              <Button
                variant="outlined"
                onClick={() => setCategoryModalOpen(true)}
                startIcon={<FolderPlus size={16} />}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, color: '#7c3aed', borderColor: '#e9d5ff', backgroundColor: '#faf5ff' }}
              >
                + Add Category
              </Button>

              <Button
                variant="contained"
                onClick={() => handleOpenAddModal(selectedCategoryTab !== 'ALL' ? selectedCategoryTab : (categories[0]?.category || ''))}
                startIcon={<Plus size={16} />}
                sx={{
                  backgroundColor: '#2563eb',
                  textTransform: 'none',
                  fontWeight: 800,
                  borderRadius: 2,
                  px: 2.2,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  '&:hover': { backgroundColor: '#1d4ed8' },
                }}
              >
                + Add Spare Part
              </Button>
            </>
          )}
        </Stack>
      </Box>

      {/* ========================================================================= */}
      {/* CATEGORY SELECTION CARDS GRID */}
      {/* ========================================================================= */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" fontWeight={800} color="#475569" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1.5 }}>
          Product Categories & Spare Part Breakdown
        </Typography>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2,
          width: '100%'
        }}>
          {/* ALL CATEGORIES CARD */}
          <Card
            elevation={0}
            onClick={() => setSelectedCategoryTab('ALL')}
            sx={{
              borderRadius: 3,
              border: selectedCategoryTab === 'ALL' ? '2.5px solid #2563eb' : '1px solid #e2e8f0',
              backgroundColor: selectedCategoryTab === 'ALL' ? '#eff6ff' : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' },
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#475569', fontWeight: 800, textTransform: 'uppercase', fontSize: '10.5px' }}>
                    ALL CATEGORIES
                  </Typography>
                  <Typography variant="h5" fontWeight={900} sx={{ color: '#0f172a', mt: 0.3 }}>
                    {spareParts.length} <Typography component="span" variant="caption" color="#64748b">Parts</Typography>
                  </Typography>
                  <Typography variant="caption" color="#64748b">
                    Total Catalog View
                  </Typography>
                </Box>
                <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: selectedCategoryTab === 'ALL' ? '#2563eb' : '#f1f5f9', color: selectedCategoryTab === 'ALL' ? '#ffffff' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={22} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* DYNAMIC CATEGORY CARDS */}
          {categories.map((c) => {
            const isSelected = selectedCategoryTab.toLowerCase() === c.category.toLowerCase();
            const meta = getCategoryMeta(c.category);

            return (
              <Card
                key={c.category}
                elevation={0}
                onClick={() => setSelectedCategoryTab(c.category)}
                sx={{
                  borderRadius: 3,
                  border: isSelected ? `2.5px solid ${meta.textColor}` : `1px solid ${meta.borderColor}`,
                  backgroundColor: isSelected ? meta.bgColor : '#ffffff',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' },
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ pr: 1, minWidth: 0, flex: 1 }}>
                      <Typography variant="caption" sx={{ color: meta.textColor, fontWeight: 900, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.category}
                      </Typography>
                      <Typography variant="h5" fontWeight={900} sx={{ color: '#0f172a', mt: 0.3 }}>
                        {c.totalParts} <Typography component="span" variant="caption" color="#64748b">Spare Parts</Typography>
                      </Typography>
                      <Typography variant="caption" sx={{ color: c.lowStockParts > 0 ? '#ea580c' : '#64748b', fontWeight: c.lowStockParts > 0 ? 800 : 500 }}>
                        {c.availableStock} Available {c.lowStockParts > 0 ? `• ⚠️ ${c.lowStockParts} Low Stock` : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      {isSuperAdmin && (
                        <Tooltip title={`Delete category "${c.category}"`}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoryToDelete(c.category);
                              setDeleteCategoryModalOpen(true);
                            }}
                            sx={{
                              p: 0.5,
                              color: '#94a3b8',
                              '&:hover': { color: '#dc2626', backgroundColor: '#fee2e2' },
                            }}
                          >
                            <Trash2 size={15} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Box sx={{ width: 42, height: 42, borderRadius: 2.5, backgroundColor: isSelected ? meta.textColor : meta.bgColor, color: isSelected ? '#ffffff' : meta.textColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {meta.icon}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>

      {/* ========================================================================= */}
      {/* FILTER & SEARCH BAR */}
      {/* ========================================================================= */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search spare part name, code, compatible model..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color="#94a3b8" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter Category</InputLabel>
              <Select
                value={selectedCategoryTab}
                label="Filter Category"
                onChange={(e) => {
                  setSelectedCategoryTab(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="ALL">All Product Categories</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.category} value={c.category}>
                    {c.category} ({c.totalParts} Parts)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Stock Status</InputLabel>
              <Select
                value={stockStatusFilter}
                label="Stock Status"
                onChange={(e) => {
                  setStockStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="ALL">All Stock Levels</MenuItem>
                <MenuItem value="AVAILABLE">🟢 In Stock / Available</MenuItem>
                <MenuItem value="LOW_STOCK">🟠 Low Stock (Below Minimum)</MenuItem>
                <MenuItem value="OUT_OF_STOCK">🔴 Out of Stock (0 Qty)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 1 }}>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              onClick={() => {
                setSelectedCategoryTab('ALL');
                setSearchQuery('');
                setStockStatusFilter('ALL');
                setPage(0);
              }}
              sx={{ textTransform: 'none', color: '#64748b', borderRadius: 2 }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ========================================================================= */}
      {/* SPARE PARTS TABLE */}
      {/* ========================================================================= */}
      <Paper elevation={0} sx={{ borderRadius: 3.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', overflow: 'hidden' }}>
        <Box sx={{ p: 2.2, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6" fontWeight={900} sx={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
              {selectedCategoryTab === 'ALL' ? 'All Spare Parts' : `${selectedCategoryTab.toUpperCase()} SPARE PARTS`}
              <Chip label={`${spareParts.length} Parts`} size="small" sx={{ fontWeight: 800, backgroundColor: '#f1f5f9' }} />
            </Typography>
            <Typography variant="caption" color="#64748b">
              Predefined & custom category spare parts mapped with compatible models and live stock availability.
            </Typography>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.5 }}>Spare Part Name</TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.5 }}>Category</TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.5 }}>Tracking</TableCell>
                <TableCell align="center" sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.5 }}>Total Stock</TableCell>
                <TableCell align="center" sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.5 }}>Used</TableCell>
                <TableCell align="center" sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.5 }}>Available</TableCell>
                <TableCell align="center" sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.5 }}>Status</TableCell>
                <TableCell align="right" sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.5, pr: 3 }}>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={26} />
                    <Typography variant="body2" color="#64748b" sx={{ mt: 1 }}>Loading spare parts catalog...</Typography>
                  </TableCell>
                </TableRow>
              ) : spareParts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Wrench size={38} color="#cbd5e1" />
                    <Typography variant="subtitle2" fontWeight={800} color="#334155" sx={{ mt: 1 }}>
                      No spare parts found
                    </Typography>
                    <Typography variant="caption" color="#64748b">
                      Try clearing your search filter or click '+ Add Spare Part' to create a new component.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                spareParts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p) => {
                  const meta = getCategoryMeta(p.category);

                  return (
                    <TableRow key={p._id} hover sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                      {/* Name & Code */}
                      <TableCell sx={{ py: 1.6 }}>
                        <Typography variant="body2" fontWeight={800} color="#0f172a">
                          {p.name}
                        </Typography>
                        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 0.3 }}>
                          <Chip
                            label={p.code}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '10px',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                            }}
                          />
                          <Typography variant="caption" color="#94a3b8">
                            • {p.unit || 'PCS'}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* Category Badge */}
                      <TableCell sx={{ py: 1.6 }}>
                        <Chip
                          label={p.category}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: '11px',
                            backgroundColor: meta.bgColor,
                            color: meta.textColor,
                            border: `1px solid ${meta.borderColor}`,
                          }}
                        />
                      </TableCell>

                      {/* Tracking Badge */}
                      <TableCell sx={{ py: 1.6 }}>
                        {p.trackingType === 'SERIALIZED' ? (
                          <Chip
                            icon={<Barcode size={12} />}
                            label="Serialized"
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: '10.5px',
                              backgroundColor: '#eef2ff',
                              color: '#4338ca',
                              border: '1px solid #c7d2fe',
                            }}
                          />
                        ) : (
                          <Chip
                            icon={<Layers size={12} />}
                            label="Quantity"
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: '10.5px',
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                              border: '1px solid #cbd5e1',
                            }}
                          />
                        )}
                      </TableCell>

                      {/* Total Stock */}
                      <TableCell align="center" sx={{ py: 1.6 }}>
                        <Typography variant="body2" fontWeight={700} color="#475569">
                          {p.totalStock || 0}
                        </Typography>
                      </TableCell>

                      {/* Used Stock */}
                      <TableCell align="center" sx={{ py: 1.6 }}>
                        <Typography variant="body2" fontWeight={700} color="#dc2626">
                          {p.usedStock || 0}
                        </Typography>
                      </TableCell>

                      {/* Available Stock */}
                      <TableCell align="center" sx={{ py: 1.6 }}>
                        <Typography variant="body2" fontWeight={900} sx={{ color: p.availableStock > 0 ? '#16a34a' : '#dc2626' }}>
                          {p.availableStock || 0}
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell align="center" sx={{ py: 1.6 }}>
                        {getStatusChip(p.status)}
                      </TableCell>

                      {/* Actions (Icon-Only Buttons: View, Edit, Delete) */}
                      <TableCell align="right" sx={{ py: 1.6, pr: 3 }}>
                        <Stack direction="row" spacing={0.8} justifyContent="flex-end" alignItems="center">
                          <Tooltip title="View 360° Details">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDetails(p._id)}
                              sx={{
                                color: '#2563eb',
                                backgroundColor: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: 2,
                                p: 0.7,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  backgroundColor: '#dbeafe',
                                  color: '#1d4ed8',
                                  transform: 'translateY(-1px)',
                                },
                              }}
                            >
                              <Eye size={15} />
                            </IconButton>
                          </Tooltip>

                          {isSuperAdmin && (
                            <>
                              <Tooltip title="Edit Spare Part">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenEditModal(p)}
                                  sx={{
                                    color: '#0284c7',
                                    backgroundColor: '#f0f9ff',
                                    border: '1px solid #bae6fd',
                                    borderRadius: 2,
                                    p: 0.7,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      backgroundColor: '#e0f2fe',
                                      color: '#0369a1',
                                      transform: 'translateY(-1px)',
                                    },
                                  }}
                                >
                                  <Edit3 size={15} />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Delete Spare Part">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setDeleteTargetPart(p);
                                    setDeleteModalOpen(true);
                                  }}
                                  sx={{
                                    color: '#dc2626',
                                    backgroundColor: '#fff5f5',
                                    border: '1px solid #fecaca',
                                    borderRadius: 2,
                                    p: 0.7,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      backgroundColor: '#fee2e2',
                                      color: '#b91c1c',
                                      transform: 'translateY(-1px)',
                                    },
                                  }}
                                >
                                  <Trash2 size={15} />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={spareParts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* ========================================================================= */}
      {/* 360° SPARE PART DETAILS MODAL */}
      {/* ========================================================================= */}
      <Dialog
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 0.5 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircuitBoard size={22} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={900} color="#0f172a">
                {selectedPartDetails?.name}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={selectedPartDetails?.code} size="small" sx={{ fontFamily: 'monospace', fontWeight: 800, height: 20, fontSize: '10.5px' }} />
                <Typography variant="caption" color="#64748b">
                  Category: <strong>{selectedPartDetails?.category}</strong> • Unit: {selectedPartDetails?.unit || 'PCS'}
                </Typography>
              </Stack>
            </Box>
          </Box>
          <IconButton onClick={() => setDetailsModalOpen(false)} sx={{ color: '#94a3b8' }}>
            <X size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5 }}>
          {detailsLoading ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CircularProgress size={28} />
              <Typography variant="body2" color="#64748b" sx={{ mt: 1 }}>Loading component details...</Typography>
            </Box>
          ) : selectedPartDetails ? (
            <Stack spacing={2.5}>
              <Tabs
                value={detailsTab}
                onChange={(_, v) => setDetailsTab(v)}
                sx={{
                  borderBottom: '1px solid #e2e8f0',
                  '& .MuiTab-root': { textTransform: 'none', fontWeight: 800, fontSize: '12px' },
                }}
              >
                <Tab label="Overview & Specs" />
                <Tab label={`Individual Inventory (${(selectedPartDetails.serials || []).length} S/N)`} />
                <Tab label="Stock Breakdown" />
                <Tab label={`RMA Usage History (${(selectedPartDetails.usageHistory || []).length})`} />
              </Tabs>

              {/* TAB 0: OVERVIEW */}
              {detailsTab === 0 && (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" color="#64748b" fontWeight={700} textTransform="uppercase">Stock Summary</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2" color="#475569">Total Stock:</Typography>
                        <Typography variant="body2" fontWeight={800}>{selectedPartDetails.totalStock || 0} {selectedPartDetails.unit}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="body2" color="#475569">Used in Services:</Typography>
                        <Typography variant="body2" fontWeight={800} color="#dc2626">{selectedPartDetails.usedStock || 0} {selectedPartDetails.unit}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="body2" color="#475569">Available Stock:</Typography>
                        <Typography variant="body2" fontWeight={900} color="#16a34a">{selectedPartDetails.availableStock || 0} {selectedPartDetails.unit}</Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="#475569">Live Status:</Typography>
                        {getStatusChip(selectedPartDetails.status)}
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" color="#64748b" fontWeight={700} textTransform="uppercase">Pricing & Thresholds</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2" color="#475569">Purchase Cost:</Typography>
                        <Typography variant="body2" fontWeight={800}>₹{selectedPartDetails.purchaseCost || 0}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="body2" color="#475569">Minimum Stock:</Typography>
                        <Typography variant="body2" fontWeight={800}>{selectedPartDetails.minimumStock || 5} {selectedPartDetails.unit}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="body2" color="#475569">Reorder Level:</Typography>
                        <Typography variant="body2" fontWeight={800}>{selectedPartDetails.reorderLevel || 10} {selectedPartDetails.unit}</Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={12}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" color="#64748b" fontWeight={700} textTransform="uppercase">Technical Description</Typography>
                      <Typography variant="body2" color="#334155" sx={{ mt: 0.5 }}>
                        {selectedPartDetails.description || 'No specific technical remarks recorded for this spare part.'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* TAB 1: INDIVIDUAL SERIALIZED INVENTORY */}
              {detailsTab === 1 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={900} color="#0f172a">
                        Individual Serial Number (S/N) Inventory
                      </Typography>
                      <Typography variant="caption" color="#64748b">
                        Every physical item is individually tracked from inward to installation.
                      </Typography>
                    </Box>
                    {isSuperAdmin && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Plus size={14} />}
                        onClick={() => {
                          setInwardTargetPart(selectedPartDetails);
                          setInwardQty(10);
                          setInwardLocation('Main Warehouse');
                          setInwardNotes('');
                          setInwardModalOpen(true);
                        }}
                        sx={{ backgroundColor: '#16a34a', textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
                      >
                        + Inward S/N
                      </Button>
                    )}
                  </Box>

                  <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2, maxHeight: 350 }}>
                    <Table size="small" stickyHeader>
                      <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: '11px' }}>Serial Number (S/N)</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontSize: '11px' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '11px' }}>Service Item / RMA #</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '11px' }}>Technician</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '11px' }}>Location</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '11px' }}>Installed Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(selectedPartDetails.serials || []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                              <Barcode size={32} color="#cbd5e1" />
                              <Typography variant="body2" color="#64748b" sx={{ mt: 1 }}>
                                No individual physical serial numbers registered yet.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedPartDetails.serials.map((s, idx) => {
                            let snColor = '#16a34a';
                            let snBg = '#ecfdf5';
                            let snBorder = '#a7f3d0';

                            if (s.status === 'INSTALLED') {
                              snColor = '#2563eb';
                              snBg = '#eff6ff';
                              snBorder = '#bfdbfe';
                            } else if (s.status === 'DEFECTIVE' || s.status === 'SCRAPPED') {
                              snColor = '#dc2626';
                              snBg = '#fef2f2';
                              snBorder = '#fecaca';
                            }

                            return (
                              <TableRow key={idx} hover>
                                <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                                  🏷️ {s.serialNumber}
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={s.status}
                                    size="small"
                                    sx={{
                                      fontWeight: 800,
                                      fontSize: '9.5px',
                                      height: 20,
                                      backgroundColor: snBg,
                                      color: snColor,
                                      border: `1px solid ${snBorder}`,
                                    }}
                                  />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, color: s.installedInRmaNo ? '#1d4ed8' : '#94a3b8', fontFamily: s.installedInRmaNo ? 'monospace' : 'inherit' }}>
                                  {s.installedInRmaNo ? `#${s.installedInRmaNo}` : '—'}
                                </TableCell>
                                <TableCell sx={{ color: s.installedByTechnician ? '#1e293b' : '#94a3b8', fontWeight: s.installedByTechnician ? 600 : 400 }}>
                                  {s.installedByTechnician || '—'}
                                </TableCell>
                                <TableCell sx={{ color: '#475569', fontSize: '11px' }}>
                                  {s.location || 'Main Warehouse'}
                                </TableCell>
                                <TableCell align="right" sx={{ color: '#64748b', fontSize: '11px' }}>
                                  {s.installedDate ? new Date(s.installedDate).toLocaleDateString('en-IN') : '—'}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* TAB 2: STOCK BREAKDOWN */}
              {detailsTab === 2 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                      Multi-Location Stock Distribution
                    </Typography>
                    {isSuperAdmin && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Plus size={14} />}
                        onClick={() => {
                          setInwardTargetPart(selectedPartDetails);
                          setInwardQty(10);
                          setInwardLocation('Main Warehouse');
                          setInwardNotes('');
                          setInwardModalOpen(true);
                        }}
                        sx={{ backgroundColor: '#16a34a', textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
                      >
                        + Inward Stock
                      </Button>
                    )}
                  </Box>

                  <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: '11px' }}>Location / Facility</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '11px' }}>Stock Quantity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(selectedPartDetails.stockLocations || []).map((loc, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ fontWeight: 700, color: '#334155' }}>
                              <Building size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                              {loc.location}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, color: '#16a34a' }}>
                              {loc.quantity} {selectedPartDetails.unit}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* TAB 3: RMA USAGE HISTORY */}
              {detailsTab === 3 && (
                <Box>
                  <Typography variant="caption" color="#64748b" sx={{ mb: 1.5, display: 'block' }}>
                    Track all RMA service repairs where this component was consumed:
                  </Typography>

                  <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: '11px' }}>RMA No</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '11px' }}>Service Person</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '11px' }}>Product Model</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontSize: '11px' }}>Qty</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '11px' }}>Action</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '11px' }}>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(selectedPartDetails.usageHistory || []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                              <Typography variant="body2" color="#64748b">No RMA consumption records yet for this spare part.</Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedPartDetails.usageHistory.map((u, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace', color: '#1d4ed8' }}>
                                {u.rmaNo || '—'}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>
                                <User size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                {u.servicePerson}
                              </TableCell>
                              <TableCell sx={{ color: '#475569' }}>{u.productModel || '—'}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, color: '#dc2626' }}>
                                -{u.quantity}
                              </TableCell>
                              <TableCell>
                                <Chip label={u.actionType} size="small" sx={{ fontSize: '9.5px', fontWeight: 800, height: 18 }} />
                              </TableCell>
                              <TableCell align="right" sx={{ color: '#64748b', fontSize: '11px' }}>
                                {new Date(u.date).toLocaleDateString('en-IN')}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Stack>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setDetailsModalOpen(false)} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 700 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* ADD / EDIT SPARE PART MODAL */}
      {/* ========================================================================= */}
      <Dialog
        open={partModalOpen}
        onClose={() => setPartModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 0.5 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" fontWeight={900} color="#0f172a">
            {isEditing ? `Edit Spare Part — ${partForm.name}` : 'Add New Spare Part'}
          </Typography>
          <IconButton onClick={() => setPartModalOpen(false)} sx={{ color: '#94a3b8' }}>
            <X size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            {/* Category Selection */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Product Category *</InputLabel>
                  <Select
                    value={partForm.category || ''}
                    label="Product Category *"
                    onChange={(e) => handleFormCategoryChange(e.target.value)}
                  >
                    {categories.length === 0 ? (
                      <MenuItem disabled value="">
                        <em>No categories yet — click + to add</em>
                      </MenuItem>
                    ) : (
                      categories.map((c) => (
                        <MenuItem key={c.category} value={c.category}>
                          {c.category}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                {isSuperAdmin && (
                  <Tooltip title="Add New Category">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setCategoryModalOpen(true)}
                      sx={{
                        minWidth: 40,
                        height: 40,
                        px: 1,
                        borderColor: '#cbd5e1',
                        color: '#7c3aed',
                        borderRadius: 1.5,
                      }}
                    >
                      <Plus size={18} />
                    </Button>
                  </Tooltip>
                )}
              </Box>
            </Grid>

            {/* Spare Part Name */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                required
                label="Spare Part Name *"
                placeholder="e.g. Power Diode, Lens, SATA Cable"
                value={partForm.name}
                onChange={(e) => setPartForm({ ...partForm, name: e.target.value })}
              />
            </Grid>

            {/* Tracking Type */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Tracking Type *</InputLabel>
                <Select
                  value={partForm.trackingType || 'SERIALIZED'}
                  label="Tracking Type *"
                  onChange={(e) => setPartForm({ ...partForm, trackingType: e.target.value })}
                >
                  <MenuItem value="SERIALIZED">🏷️ Serialized (Unique S/N per physical item)</MenuItem>
                  <MenuItem value="QUANTITY">📦 Quantity (Bulk consumable count)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Code */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Part Code (Auto if empty)"
                placeholder="e.g. SP-CAM-PD-001"
                value={partForm.code}
                onChange={(e) => setPartForm({ ...partForm, code: e.target.value })}
              />
            </Grid>

            {/* Unit */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Unit of Measure</InputLabel>
                <Select
                  value={partForm.unit}
                  label="Unit of Measure"
                  onChange={(e) => setPartForm({ ...partForm, unit: e.target.value })}
                >
                  <MenuItem value="PCS">PCS (Pieces)</MenuItem>
                  <MenuItem value="SET">SET</MenuItem>
                  <MenuItem value="MTR">MTR (Meters)</MenuItem>
                  <MenuItem value="NOS">NOS</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Thresholds & Stock */}
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Minimum Stock"
                type="number"
                value={partForm.minimumStock}
                onChange={(e) => setPartForm({ ...partForm, minimumStock: Number(e.target.value) })}
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Reorder Level"
                type="number"
                value={partForm.reorderLevel}
                onChange={(e) => setPartForm({ ...partForm, reorderLevel: Number(e.target.value) })}
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Purchase Cost (₹)"
                type="number"
                value={partForm.purchaseCost}
                onChange={(e) => setPartForm({ ...partForm, purchaseCost: Number(e.target.value) })}
              />
            </Grid>

            {/* Total / Initial Stock Qty */}
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label={isEditing ? 'Total Stock Qty *' : 'Initial Stock Qty'}
                type="number"
                value={isEditing ? (partForm.totalStock !== undefined ? partForm.totalStock : 0) : partForm.initialStock}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                  if (isEditing) {
                    setPartForm({ ...partForm, totalStock: val, initialStock: val });
                  } else {
                    setPartForm({ ...partForm, initialStock: val, totalStock: val });
                  }
                }}
              />
            </Grid>

            {/* Description */}
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Technical Description / Application Notes"
                placeholder="e.g. 12V step-down power diode for camera PCB circuit protection"
                value={partForm.description}
                onChange={(e) => setPartForm({ ...partForm, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPartModalOpen(false)} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSavePartSubmit}
            disabled={submittingPart}
            startIcon={submittingPart ? <CircularProgress size={16} color="inherit" /> : <Check size={16} />}
            sx={{ backgroundColor: '#2563eb', textTransform: 'none', fontWeight: 800, borderRadius: 2, px: 2.5 }}
          >
            {submittingPart ? 'Saving...' : isEditing ? 'Update Spare Part' : 'Save Spare Part'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* QUICK INWARD STOCK MODAL */}
      {/* ========================================================================= */}
      <Dialog
        open={inwardModalOpen}
        onClose={() => setInwardModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 0.5 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={900} color="#0f172a">
            + Inward Spare Stock
          </Typography>
          <Typography variant="caption" color="#64748b">
            Component: <strong>{inwardTargetPart?.name}</strong> ({inwardTargetPart?.code})
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              size="small"
              label="Quantity to Add *"
              type="number"
              value={inwardQty}
              onChange={(e) => setInwardQty(Number(e.target.value))}
            />

            <FormControl fullWidth size="small">
              <InputLabel>Destination Location</InputLabel>
              <Select
                value={inwardLocation}
                label="Destination Location"
                onChange={(e) => setInwardLocation(e.target.value)}
              >
                <MenuItem value="Main Warehouse">Main Warehouse</MenuItem>
                <MenuItem value="Chennai Service Center">Chennai Service Center</MenuItem>
                <MenuItem value="Technician Stock">Technician Stock</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="Inward Remarks / PO Ref"
              placeholder="e.g. PO#7718 spare parts procurement"
              value={inwardNotes}
              onChange={(e) => setInwardNotes(e.target.value)}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button onClick={() => setInwardModalOpen(false)} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleInwardSubmit}
            disabled={submittingInward}
            startIcon={submittingInward ? <CircularProgress size={16} color="inherit" /> : <ArrowDownToLine size={16} />}
            sx={{ backgroundColor: '#16a34a', textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
          >
            {submittingInward ? 'Inwarding...' : 'Add Stock'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* ADD CUSTOM CATEGORY MODAL */}
      {/* ========================================================================= */}
      <Dialog
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 0.5 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={900} color="#0f172a">
            Add Product Category
          </Typography>
          <Typography variant="caption" color="#64748b">
            Create a new category for organizing spare parts (e.g. XVR, Access Control, VDP).
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5 }}>
          <TextField
            fullWidth
            size="small"
            label="Category Name *"
            placeholder="e.g. XVR, VDP, Access Control"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            autoFocus
          />
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button onClick={() => setCategoryModalOpen(false)} disabled={submittingCategory} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateCategory}
            disabled={!newCategoryName.trim() || submittingCategory}
            startIcon={submittingCategory ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ backgroundColor: '#7c3aed', textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
          >
            {submittingCategory ? 'Saving to DB...' : 'Create Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* DELETE CATEGORY CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <Dialog
        open={deleteCategoryModalOpen}
        onClose={() => !submittingCategoryDelete && setDeleteCategoryModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 0.5 } }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: 2, backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={20} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={900} color="#0f172a">
              Delete Category
            </Typography>
            <Typography variant="caption" color="#64748b">
              Delete category from database
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5 }}>
          <Typography variant="body2" color="#334155" sx={{ mb: 1 }}>
            Are you sure you want to delete the category <strong>"{categoryToDelete}"</strong>?
          </Typography>
          <Typography variant="caption" color="#64748b" sx={{ display: 'block' }}>
            Note: You can only delete categories that currently have 0 active spare parts.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button
            onClick={() => setDeleteCategoryModalOpen(false)}
            disabled={submittingCategoryDelete}
            sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteCategorySubmit}
            disabled={submittingCategoryDelete}
            startIcon={submittingCategoryDelete ? <CircularProgress size={16} color="inherit" /> : <Trash2 size={16} />}
            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, backgroundColor: '#dc2626' }}
          >
            {submittingCategoryDelete ? 'Deleting...' : 'Delete Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => !submittingDelete && setDeleteModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 0.5 } }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: 2, backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={20} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={900} color="#0f172a">
              Delete Spare Part
            </Typography>
            <Typography variant="caption" color="#64748b">
              Permanent Deletion Warning
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5 }}>
          <Typography variant="body2" color="#334155" sx={{ mb: 1.5 }}>
            Are you sure you want to delete this spare part component?
          </Typography>

          {deleteTargetPart && (
            <Paper elevation={0} sx={{ p: 1.8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={800} color="#991b1b">
                {deleteTargetPart.name}
              </Typography>
              <Typography variant="caption" color="#b91c1c" sx={{ display: 'block', mt: 0.3 }}>
                Code: <strong>{deleteTargetPart.code}</strong> • Category: <strong>{deleteTargetPart.category}</strong>
              </Typography>
              <Typography variant="caption" color="#b91c1c" sx={{ display: 'block', mt: 0.2 }}>
                Current Stock: {deleteTargetPart.availableStock || 0} {deleteTargetPart.unit || 'PCS'}
              </Typography>
            </Paper>
          )}

          <Typography variant="caption" color="#64748b" sx={{ mt: 1.5, display: 'block' }}>
            This will permanently remove the spare part from the category list and product compatibility mappings.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button
            onClick={() => setDeleteModalOpen(false)}
            disabled={submittingDelete}
            sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteSubmit}
            disabled={submittingDelete}
            startIcon={submittingDelete ? <CircularProgress size={16} color="inherit" /> : <Trash2 size={16} />}
            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, backgroundColor: '#dc2626' }}
          >
            {submittingDelete ? 'Deleting...' : 'Delete Part'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
