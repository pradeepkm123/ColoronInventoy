import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Button,
  FormHelperText,
  Typography,
  MenuItem,
  Box,
  Paper,
  Divider,
  Alert,
  Snackbar,
  Card,
  CardContent,
  IconButton,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  PackagePlus,
  Save,
  RotateCcw,
  UploadCloud,
  Layers,
  IndianRupee,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  X
} from 'lucide-react';
import axios from 'axios';

const BRANDS_API = 'http://localhost:5002/api/brands';
const CATEGORIES_API = 'http://localhost:5002/api/categories';
const SUBCATEGORIES_API = 'http://localhost:5002/api/subcategories';
const PRODUCTS_API = 'http://localhost:5002/api/products';

const defaultFormState = {
  brand: '',
  model: '',
  productDescriptions: '',
  mrp: '',
  dealerPrice: '',
  uom: 'PCS',
  warranty: '1 Year Standard',
  category: '',
  subCategory: '',
  stockStatus: 'In Stock',
  reorderLevel: 10,
  emailTo: '',
  productImage: null,
  isSpare: false,
  isAccessory: false,
};

const AddProduct = ({
  open,
  handleClose,
  handleSave,
  formData,
  setFormData,
  editMode = false,
  getImageUrl
}) => {
  const isDialogMode = typeof open === 'boolean';

  // Internal state when used as standalone page
  const [internalFormData, setInternalFormData] = useState(defaultFormState);
  const [errors, setErrors] = useState({});
  const [brandOptions, setBrandOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Use props if provided, otherwise fallback to internal state
  const currentFormData = formData || internalFormData;
  const currentSetFormData = setFormData || setInternalFormData;

  // Keep the latest getImageUrl in a stable ref
  const getImageUrlRef = useRef(getImageUrl);
  useEffect(() => {
    getImageUrlRef.current = getImageUrl;
  }, [getImageUrl]);

  // Track last created blob URL
  const lastBlobRef = useRef(null);

  // Build preview URL
  const previewSrc = useMemo(() => {
    const revokeLast = () => {
      if (lastBlobRef.current) {
        URL.revokeObjectURL(lastBlobRef.current);
        lastBlobRef.current = null;
      }
    };

    const img = currentFormData?.productImage;

    if (img instanceof File) {
      revokeLast();
      const url = URL.createObjectURL(img);
      lastBlobRef.current = url;
      return url;
    }

    if (typeof img === 'string' && img.trim()) {
      const helper = getImageUrlRef.current;
      if (typeof helper === 'function') {
        return helper(img);
      }
      if (/^https?:\/\//i.test(img) || img.startsWith('/uploads/')) return img;
      return `http://localhost:5002/uploads/${img}`;
    }

    return null;
  }, [currentFormData?.productImage]);

  useEffect(() => {
    return () => {
      if (lastBlobRef.current) {
        URL.revokeObjectURL(lastBlobRef.current);
        lastBlobRef.current = null;
      }
    };
  }, []);

  const getLabel = (obj, typeHint) => {
    if (!obj || typeof obj !== 'object') return '';
    return (
      obj.name ||
      obj.label ||
      obj.title ||
      obj[`${typeHint}Name`] ||
      obj[typeHint] ||
      ''
    );
  };
  const getKey = (obj, typeHint) => obj?._id || obj?.id || getLabel(obj, typeHint);

  // Fetch options on mount or when dialog opens
  useEffect(() => {
    if (isDialogMode && !open) return;
    (async () => {
      try {
        const [bRes, cRes, sRes] = await Promise.all([
          axios.get(BRANDS_API),
          axios.get(CATEGORIES_API),
          axios.get(SUBCATEGORIES_API),
        ]);
        setBrandOptions(Array.isArray(bRes.data) ? bRes.data : bRes.data?.data || []);
        setCategoryOptions(Array.isArray(cRes.data) ? cRes.data : cRes.data?.data || []);
        setSubCategoryOptions(Array.isArray(sRes.data) ? sRes.data : sRes.data?.data || []);
      } catch (err) {
        console.error('Failed loading options', err);
      }
    })();
  }, [isDialogMode, open]);

  const onChange = (e) => {
    const { name, value } = e.target;
    currentSetFormData((s) => ({ ...s, [name]: value }));
  };

  const onNumberChange = (e) => {
    const { name, value } = e.target;
    const cleaned = value === '' ? '' : Number(value);
    currentSetFormData((s) => ({ ...s, [name]: cleaned }));
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) currentSetFormData((s) => ({ ...s, productImage: file }));
  };

  const handleRemoveImage = () => {
    currentSetFormData((s) => ({ ...s, productImage: null }));
  };

  const validate = () => {
    const temp = {};
    if (!currentFormData.brand) temp.brand = 'Brand is required';
    if (!currentFormData.model) temp.model = 'Model is required';
    if (currentFormData.mrp === '' || isNaN(Number(currentFormData.mrp))) temp.mrp = 'Valid MRP required';
    if (currentFormData.dealerPrice === '' || isNaN(Number(currentFormData.dealerPrice))) temp.dealerPrice = 'Valid Dealer Price required';
    if (currentFormData.reorderLevel === '' || isNaN(Number(currentFormData.reorderLevel))) temp.reorderLevel = 'Valid Quantity required';
    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;

    if (isDialogMode && handleSave) {
      handleSave();
      return;
    }

    // Standalone submission
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(currentFormData).forEach((key) => {
        if (currentFormData[key] !== null && currentFormData[key] !== undefined) {
          data.append(key, currentFormData[key]);
        }
      });

      await axios.post(PRODUCTS_API, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // 🔔 Dispatch event so Notifications automatically syncs from database
      const reorderQty = Number(currentFormData.reorderLevel || 0);
      if (reorderQty === 0 || reorderQty <= 5) {
        window.dispatchEvent(new CustomEvent('app_stock_alert_updated'));
      }

      setToast({ open: true, message: 'Product created successfully!', severity: 'success' });
      currentSetFormData(defaultFormState);
      setErrors({});
    } catch (err) {
      console.error('Error creating product', err);
      setToast({ open: true, message: 'Failed to create product. Please try again.', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSubCats = useMemo(() => {
    if (!currentFormData.category) return subCategoryOptions;
    return subCategoryOptions.filter((sc) => {
      const scCat =
        sc?.categoryName ||
        sc?.category ||
        sc?.parent?.name ||
        sc?.parentName ||
        '';
      return !scCat || scCat === currentFormData.category;
    });
  }, [subCategoryOptions, currentFormData.category]);

  const formFieldsContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
      {/* Card 1: Basic Information */}
      <Card sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f172a', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Layers size={18} color="#0f2b48" /> Basic Product Details
          </Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Brand <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                select
                name="brand"
                value={currentFormData.brand || ''}
                onChange={onChange}
                error={!!errors.brand}
                helperText={errors.brand}
                fullWidth
                size="small"
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              >
                <MenuItem value="">-- Select Brand --</MenuItem>
                {brandOptions.map((b) => (
                  <MenuItem key={getKey(b, 'brand')} value={getLabel(b, 'brand')}>
                    {getLabel(b, 'brand')}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Model / Product Name <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                name="model"
                value={currentFormData.model || ''}
                onChange={onChange}
                error={!!errors.model}
                helperText={errors.model}
                placeholder="e.g. 2MP Dome IR 20M"
                fullWidth
                size="small"
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Category
              </Typography>
              <TextField
                select
                name="category"
                value={currentFormData.category || ''}
                onChange={(e) => {
                  const newVal = e.target.value;
                  currentSetFormData((s) => ({ ...s, category: newVal, subCategory: '' }));
                }}
                fullWidth
                size="small"
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              >
                <MenuItem value="">-- Select Category --</MenuItem>
                {categoryOptions.map((c) => (
                  <MenuItem key={getKey(c, 'category')} value={getLabel(c, 'category')}>
                    {getLabel(c, 'category')}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Sub Category
              </Typography>
              <TextField
                select
                name="subCategory"
                value={currentFormData.subCategory || ''}
                onChange={onChange}
                fullWidth
                size="small"
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              >
                <MenuItem value="">-- Select Sub Category --</MenuItem>
                {filteredSubCats.map((s) => (
                  <MenuItem key={getKey(s, 'subCategory')} value={getLabel(s, 'subCategory')}>
                    {getLabel(s, 'subCategory')}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!currentFormData.isSpare}
                    onChange={(e) => currentSetFormData(s => ({ ...s, isSpare: e.target.checked }))}
                  />
                }
                label="Spares Product"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!currentFormData.isAccessory}
                    onChange={(e) => currentSetFormData(s => ({ ...s, isAccessory: e.target.checked }))}
                  />
                }
                label="Accessories"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Card 2: Pricing & Inventory Control */}
      <Card sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f172a', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <IndianRupee size={18} color="#0f2b48" /> Pricing & Inventory Quantities
          </Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                MRP (₹) <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                name="mrp"
                value={currentFormData.mrp}
                onChange={onNumberChange}
                error={!!errors.mrp}
                helperText={errors.mrp}
                type="number"
                placeholder="0.00"
                fullWidth
                size="small"
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Dealer Price (₹) <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                name="dealerPrice"
                value={currentFormData.dealerPrice}
                onChange={onNumberChange}
                error={!!errors.dealerPrice}
                helperText={errors.dealerPrice}
                type="number"
                placeholder="0.00"
                fullWidth
                size="small"
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Quantity / Initial Stock <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                name="reorderLevel"
                value={currentFormData.reorderLevel}
                onChange={onNumberChange}
                error={!!errors.reorderLevel}
                helperText={errors.reorderLevel}
                type="number"
                placeholder="0"
                fullWidth
                size="small"
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Unit of Measurement (UOM)
              </Typography>
              <TextField
                name="uom"
                value={currentFormData.uom || ''}
                onChange={onChange}
                placeholder="e.g. PCS, BOX, MTR, NOS"
                fullWidth
                size="small"
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Card 3: Warranty, Email & Specs */}
      <Card sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f172a', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShieldCheck size={18} color="#0f2b48" /> Warranty, Alerts & Descriptions
          </Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Warranty Policy
              </Typography>
              <TextField
                name="warranty"
                value={currentFormData.warranty || ''}
                onChange={onChange}
                placeholder="e.g. 1 Year Standard, 2 Years Extended"
                fullWidth
                size="small"
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Stock Alert Notification Email
              </Typography>
              <TextField
                name="emailTo"
                value={currentFormData.emailTo || ''}
                onChange={onChange}
                type="email"
                placeholder="admin@lookman.in"
                fullWidth
                size="small"
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Stock Status
              </Typography>
              <TextField
                name="stockStatus"
                value={
                  Number(currentFormData.reorderLevel || 0) === 0
                    ? 'Out of Stock'
                    : Number(currentFormData.reorderLevel || 0) <= 5
                      ? 'Low Stock'
                      : 'In Stock'
                }
                disabled
                fullWidth
                size="small"
                helperText="Auto-computed from quantity"
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#f8fafc' } }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Product Descriptions & Features
              </Typography>
              <TextField
                name="productDescriptions"
                value={currentFormData.productDescriptions || ''}
                onChange={onChange}
                fullWidth
                multiline
                minRows={3}
                placeholder="Enter complete technical specifications, resolution, sensor details, connectivity options, and packaging list..."
                size="small"
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Card 4: Product Image Upload */}
      <Card sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f172a', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ImageIcon size={18} color="#0f2b48" /> Product Image & Media
          </Typography>

          <Box
            sx={{
              p: 3,
              border: '2px dashed #cbd5e1',
              borderRadius: 2.5,
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              gap: 3,
            }}
          >
            {previewSrc ? (
              <Box sx={{ position: 'relative', width: 120, height: 120, borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                <img
                  src={previewSrc}
                  alt="Product preview"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/no-image.png';
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <IconButton
                  size="small"
                  onClick={handleRemoveImage}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    p: 0.4,
                    '&:hover': { backgroundColor: 'rgba(220,38,38,0.9)' },
                  }}
                >
                  <X size={14} />
                </IconButton>
              </Box>
            ) : (
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: 2,
                  backgroundColor: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                }}
              >
                <ImageIcon size={36} />
              </Box>
            )}

            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600} sx={{ color: '#1e293b' }}>
                Upload high resolution product photo
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
                PNG, JPG, or WEBP up to 5MB. Recommended dimensions: 800x800 px.
              </Typography>

              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadCloud size={16} />}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  borderColor: '#cbd5e1',
                  color: '#334155',
                  px: 2.5,
                  fontWeight: 600,
                }}
              >
                {previewSrc ? 'Change Image' : 'Select Product Image'}
                <input hidden accept="image/*" type="file" onChange={onFileChange} />
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  // If used in Dialog modal mode (from Master.js)

  if (isDialogMode) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editMode ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent dividers>{formFieldsContent}</DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} sx={{ textTransform: 'none', color: '#64748b' }}>
            Cancel
          </Button>
          <Button onClick={onSubmit} variant="contained" sx={{ textTransform: 'none', borderRadius: 2, backgroundColor: '#0f2b48' }}>
            {editMode ? 'Update Product' : 'Save Product'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Standalone Full Screen Page Mode (rendered from Left Drawer "Create Product")
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2, width: '100%' }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
            Create New Product
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Add brand new products, specifications, pricing, and stock levels to your catalog.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RotateCcw size={16} />}
            onClick={() => {
              currentSetFormData(defaultFormState);
              setErrors({});
            }}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 2.5,
              borderColor: '#cbd5e1',
              color: '#64748b',
              fontWeight: 600,
            }}
          >
            Reset Form
          </Button>

          <Button
            variant="contained"
            startIcon={<Save size={18} />}
            disabled={submitting}
            onClick={onSubmit}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3.5,
              py: 1,
              fontWeight: 600,
              backgroundColor: '#0f2b48',
              '&:hover': { backgroundColor: '#1e3a8a' },
            }}
          >
            {submitting ? 'Saving...' : 'Save Product'}
          </Button>
        </Box>
      </Box>

      {/* Main Full-Width Form Paper */}
      <Paper
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          width: '100%',
          backgroundColor: '#ffffff',
        }}
      >
        {formFieldsContent}

        <Divider sx={{ my: 3 }} />

        {/* Bottom Actions Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              currentSetFormData(defaultFormState);
              setErrors({});
            }}
            sx={{ textTransform: 'none', borderRadius: 2, px: 3, borderColor: '#cbd5e1', color: '#64748b' }}
          >
            Reset
          </Button>

          <Button
            variant="contained"
            startIcon={<Save size={18} />}
            disabled={submitting}
            onClick={onSubmit}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 4,
              py: 1.2,
              fontWeight: 600,
              backgroundColor: '#0f2b48',
              '&:hover': { backgroundColor: '#1e3a8a' },
            }}
          >
            {submitting ? 'Saving...' : 'Create Product'}
          </Button>
        </Box>
      </Paper>

      {/* Notification Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })} sx={{ borderRadius: 2 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddProduct;
