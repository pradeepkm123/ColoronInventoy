import React, { useState, useEffect, useRef } from 'react';
import { useUser } from './UserContext';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Chip,
  Alert,
  Snackbar,
  Divider,
  InputAdornment,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  PlusCircle,
  User,
  Phone,
  Mail,
  MapPin,
  Barcode,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  FileText,
  Camera,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Send
} from 'lucide-react';

const API_BASE = 'http://localhost:5002/api';

export default function RaiseService({ onServiceCreated }) {
  const { user } = useUser();

  // Active Store Scoped Context
  const activeStore = (
    user?.assignedLocation ||
    user?.warehouseName ||
    user?.serviceCenter ||
    user?.staffLocation ||
    user?.customerStore ||
    user?.role ||
    'Main Store'
  );

  const roleLower = (user?.role || '').toLowerCase().trim();
  const isSuperAdmin = ['admin', 'super admin', 'manager', 'headoffice'].includes(roleLower) || roleLower.includes('admin');
  const isServicePerson = !isSuperAdmin && (
    roleLower === 'service person' ||
    roleLower === 'service engineer' ||
    roleLower === 'technician' ||
    roleLower === 'engineer' ||
    (roleLower.includes('service') && !roleLower.includes('center') && !roleLower.includes('shoppee') && !roleLower.includes('shop') && !roleLower.includes('store') && !roleLower.includes('customer'))
  );

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    mobile: '',
    whatsapp: '',
    whatsappSameAsMobile: true,
    email: '',
    address: '',
    city: '',
    pincode: '',

    serialNumber: '',
    modelNo: '',
    productType: 'IP Camera',
    category: 'HD CAMERA',
    subCategory: '',
    purchaseDate: '',
    invoiceNo: '',
    dealerName: '',
    warrantyStatus: 'IN_WARRANTY',
    accessories: [],

    complaintCategory: '',
    complaintDescription: '',
    attachments: []
  });

  // Scanner & Lookup State
  const [serialLookupLoading, setSerialLookupLoading] = useState(false);
  const [serialLookupResult, setSerialLookupResult] = useState(null);
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Success Dialog State
  const [successDialog, setSuccessDialog] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);

  // Modern In-App Notification / Toast State
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const showToast = (message, severity = 'info') => {
    setToast({ open: true, message, severity });
  };

  const scanInputRef = useRef(null);

  // Customer Mobile auto-lookup
  const handleMobileBlur = async () => {
    const mob = formData.mobile.trim();
    if (mob.length >= 10) {
      try {
        setCustomerLookupLoading(true);
        const res = await fetch(`${API_BASE}/storecustomers?search=${mob}`);
        const data = await res.json();
        const customerList = data?.data || data || [];
        const existing = Array.isArray(customerList) ? customerList.find(c => (c.phoneNo || '').includes(mob)) : null;

        if (existing) {
          setFormData(prev => ({
            ...prev,
            customerName: existing.customerName || prev.customerName,
            email: existing.mailId || prev.email,
            address: existing.address || prev.address,
            whatsapp: prev.whatsappSameAsMobile ? mob : prev.whatsapp
          }));
        }
      } catch (err) {
        console.error('Customer lookup error:', err);
      } finally {
        setCustomerLookupLoading(false);
      }
    }
  };

  // Serial Barcode Auto-Lookup
  const handleSerialLookup = async (serialToLookup) => {
    const s = (serialToLookup || formData.serialNumber).trim();
    if (!s) return;

    try {
      setSerialLookupLoading(true);
      const res = await fetch(`${API_BASE}/service/warranty-lookup/${encodeURIComponent(s)}`);
      const result = await res.json();

      if (result.success && result.found) {
        setSerialLookupResult(result);
        if (result.isReplaced) {
          setFormData(prev => ({
            ...prev,
            modelNo: result.modelNo || prev.modelNo,
            category: result.category || prev.category,
            warrantyStatus: 'OUT_OF_WARRANTY'
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            customerName: result.customerName || prev.customerName,
            mobile: result.customerMobile || prev.mobile,
            address: result.customerAddress || prev.address,
            modelNo: result.modelNo || prev.modelNo,
            category: result.category || prev.category,
            subCategory: result.subCategory || prev.subCategory,
            warrantyStatus: result.status || 'IN_WARRANTY',
            purchaseDate: result.purchaseDate ? new Date(result.purchaseDate).toISOString().split('T')[0] : '',
            invoiceNo: result.invoiceNo || prev.invoiceNo,
            dealerName: result.dealerName || prev.dealerName
          }));
        }
      } else {
        setSerialLookupResult({
          found: false,
          inwarded: false,
          status: 'NOT_INWARDED',
          message: result.message || 'Serial number not found in store inward, dispatch, or sales records. Marked as Out of Warranty.'
        });
        setFormData(prev => ({
          ...prev,
          warrantyStatus: 'OUT_OF_WARRANTY',
        }));
      }
    } catch (err) {
      console.error('Serial lookup error:', err);
    } finally {
      setSerialLookupLoading(false);
    }
  };

  const handleAccessoryToggle = (acc) => {
    setFormData(prev => {
      const exists = prev.accessories.includes(acc);
      return {
        ...prev,
        accessories: exists ? prev.accessories.filter(a => a !== acc) : [...prev.accessories, acc]
      };
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (isServicePerson) {
      showToast('Service Persons cannot create service requests. Service requests must be raised by Stores, Customers, or Super Admin.', 'error');
      return;
    }

    if (!formData.customerName || !formData.mobile || !formData.modelNo || !formData.serialNumber || !formData.complaintCategory) {
      showToast('Please fill in all required fields (Customer Name, Mobile, Model No, Serial No, Complaint Category)', 'warning');
      return;
    }

    if (serialLookupResult?.isReplaced) {
      showToast(`Cannot raise service request: This defective product was already replaced under RMA #${serialLookupResult.rmaNumber}. Replacement S/N: ${serialLookupResult.replacedBySerialNumber}. Please raise service using the active replacement serial number.`, 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        whatsapp: formData.whatsappSameAsMobile ? formData.mobile : formData.whatsapp,
        storeName: activeStore,
        createdBy: user?.name || user?.role || 'Store Employee',
        userRole: user?.role || '',
      };

      const res = await fetch(`${API_BASE}/service/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to raise service request');
      }

      setCreatedTicket(data.data);
      setSuccessDialog(true);
    } catch (err) {
      console.error('Submit Service Request error:', err);
      showToast('Error creating Service Request: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      mobile: '',
      whatsapp: '',
      whatsappSameAsMobile: true,
      email: '',
      address: '',
      city: '',
      pincode: '',

      serialNumber: '',
      modelNo: '',
      productType: 'IP Camera',
      category: 'HD CAMERA',
      subCategory: '',
      purchaseDate: '',
      invoiceNo: '',
      dealerName: '',
      warrantyStatus: 'IN_WARRANTY',
      accessories: [],

      complaintCategory: '',
      complaintDescription: '',
      attachments: []
    });
    setSerialLookupResult(null);
  };

  if (isServicePerson) {
    return (
      <Box sx={{ width: '100%', p: { xs: 2, md: 3 }, maxWidth: 650, mx: 'auto', mt: 4 }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0', textAlign: 'center', backgroundColor: '#ffffff' }}>
          <Box sx={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <ShieldAlert size={28} />
          </Box>
          <Typography variant="h6" fontWeight={800} color="#0f172a">
            Service Request Creation Restricted
          </Typography>
          <Typography variant="body2" color="#64748b" sx={{ mt: 1, maxWidth: 480, mx: 'auto', lineHeight: 1.6 }}>
            Service Persons cannot create service requests. Service requests must be raised by Stores, Customers, or Super Admin.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Header Banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 3, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' }}>
            <PlusCircle size={26} color="#2563eb" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
              Raise Service Request
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Register new customer complaints, scan serial numbers & auto-validate warranty for <strong>{activeStore}</strong>
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RotateCcw size={16} />}
          onClick={resetForm}
          sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b', borderColor: '#cbd5e1' }}
        >
          Reset Form
        </Button>
      </Box>

      {/* Form Container */}
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>

          {/* SECTION 1: Customer Details */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 2, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <User size={18} />
              </Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', fontSize: '16px' }}>
                1. Customer Information
              </Typography>
              {customerLookupLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
            </Box>

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: 2.5
            }}>
              <Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Customer Mobile No *"
                  placeholder="10-digit mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData(p => ({ ...p, mobile: e.target.value, whatsapp: p.whatsappSameAsMobile ? e.target.value : p.whatsapp }))}
                  onBlur={handleMobileBlur}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Phone size={16} color="#64748b" /></InputAdornment>,
                    sx: { borderRadius: 2 }
                  }}
                  helperText="Search existing customer by mobile"
                />
              </Box>

              <Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Customer Name *"
                  placeholder="Enter full name"
                  value={formData.customerName}
                  onChange={(e) => setFormData(p => ({ ...p, customerName: e.target.value }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><User size={16} color="#64748b" /></InputAdornment>,
                    sx: { borderRadius: 2 }
                  }}
                />
              </Box>

              <Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Email Address"
                  placeholder="customer@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Mail size={16} color="#64748b" /></InputAdornment>,
                    sx: { borderRadius: 2 }
                  }}
                />
              </Box>

              <Box>
                <TextField
                  fullWidth
                  size="small"
                  label="WhatsApp Number"
                  placeholder="WhatsApp number"
                  disabled={formData.whatsappSameAsMobile}
                  value={formData.whatsappSameAsMobile ? formData.mobile : formData.whatsapp}
                  onChange={(e) => setFormData(p => ({ ...p, whatsapp: e.target.value }))}
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={formData.whatsappSameAsMobile}
                      onChange={(e) => setFormData(p => ({ ...p, whatsappSameAsMobile: e.target.checked, whatsapp: e.target.checked ? p.mobile : p.whatsapp }))}
                    />
                  }
                  label={<Typography variant="caption" color="#64748b">WhatsApp same as mobile</Typography>}
                />
              </Box>

              <Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Address"
                  placeholder="Street / Area address"
                  value={formData.address}
                  onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><MapPin size={16} color="#64748b" /></InputAdornment>,
                    sx: { borderRadius: 2 }
                  }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="City"
                  placeholder="e.g. Chennai"
                  value={formData.city}
                  onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Pincode"
                  placeholder="600xxx"
                  value={formData.pincode}
                  onChange={(e) => setFormData(p => ({ ...p, pincode: e.target.value }))}
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
              </Box>
            </Box>
          </Paper>

          {/* SECTION 2: Product & Serial Scanner */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 2, backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <Barcode size={18} />
              </Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', fontSize: '16px' }}>
                2. Product Identification & Warranty Validation
              </Typography>
            </Box>

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: 2.5
            }}>
              <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Serial Number Scan / Input *"
                  placeholder="Scan barcode with scanner or enter S/N..."
                  value={formData.serialNumber}
                  onChange={(e) => setFormData(p => ({ ...p, serialNumber: e.target.value }))}
                  onBlur={() => handleSerialLookup()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSerialLookup();
                    }
                  }}
                  inputRef={scanInputRef}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Barcode size={18} color="#2563eb" /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleSerialLookup()}
                          disabled={serialLookupLoading || !formData.serialNumber}
                          sx={{ textTransform: 'none', borderRadius: 1.5, py: 0.3, px: 1.5, fontSize: '11px' }}
                        >
                          {serialLookupLoading ? <CircularProgress size={14} color="inherit" /> : 'Validate S/N'}
                        </Button>
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2, fontFamily: 'monospace', fontWeight: 700 }
                  }}
                />

                {/* Live Serial Lookup Banner */}
                {serialLookupResult && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      borderRadius: 2.5,
                      backgroundColor:
                        serialLookupResult.isReplaced
                          ? '#fff1f2'
                          : serialLookupResult.isReplacementUnit || serialLookupResult.status === 'IN_WARRANTY'
                            ? '#f0fdf4'
                            : serialLookupResult.status === 'NOT_INWARDED'
                              ? '#fef2f2'
                              : '#fffbeb',
                      border:
                        serialLookupResult.isReplaced
                          ? '1.5px solid #fecdd3'
                          : serialLookupResult.isReplacementUnit || serialLookupResult.status === 'IN_WARRANTY'
                            ? '1px solid #bbf7d0'
                            : serialLookupResult.status === 'NOT_INWARDED'
                              ? '1px solid #fecaca'
                              : '1px solid #fde68a',
                    }}
                  >
                    {serialLookupResult.isReplaced ? (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ShieldAlert size={22} color="#e11d48" />
                          <Typography variant="subtitle2" fontWeight={900} sx={{ color: '#be123c' }}>
                            ⛔ DEFECTIVE UNIT ALREADY REPLACED
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#9f1239', fontWeight: 600, mt: 0.8, lineHeight: 1.5 }}>
                          This product was already replaced under <strong>RMA #{serialLookupResult.rmaNumber}</strong>.
                        </Typography>
                        <Box sx={{ mt: 1, p: 1.2, bgcolor: '#ffffff', borderRadius: 2, border: '1px dashed #fda4af' }}>
                          <Typography variant="caption" color="#475569" display="block">
                            Replacement Serial Issued: <strong style={{ color: '#15803d' }}>{serialLookupResult.replacedBySerialNumber}</strong>
                          </Typography>
                          <Typography variant="caption" color="#e11d48" fontWeight={700} display="block" sx={{ mt: 0.3 }}>
                            Cannot raise a new service request for a replaced defective unit. Please use the replacement serial number.
                          </Typography>
                        </Box>
                      </Box>
                    ) : serialLookupResult.isReplacementUnit ? (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ShieldCheck size={22} color="#16a34a" />
                          <Typography variant="subtitle2" fontWeight={900} sx={{ color: '#15803d' }}>
                            ✓ Serial Verified: RMA REPLACEMENT UNIT (IN WARRANTY)
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#166534', display: 'block', mt: 0.5, fontWeight: 600 }}>
                          ↳ Warranty inherited from RMA #{serialLookupResult.rmaNumber} (Original S/N: {serialLookupResult.warrantyInheritedFrom})
                        </Typography>
                        {serialLookupResult.expiryDate && (
                          <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.3 }}>
                            Warranty Valid Until: <strong>{new Date(serialLookupResult.expiryDate).toLocaleDateString()}</strong>
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {serialLookupResult.status === 'IN_WARRANTY' ? (
                            <ShieldCheck size={20} color="#16a34a" />
                          ) : serialLookupResult.status === 'NOT_INWARDED' ? (
                            <AlertCircle size={20} color="#dc2626" />
                          ) : (
                            <ShieldAlert size={20} color="#d97706" />
                          )}
                          <Typography
                            variant="subtitle2"
                            fontWeight={800}
                            sx={{
                              color:
                                serialLookupResult.status === 'IN_WARRANTY'
                                  ? '#15803d'
                                  : serialLookupResult.status === 'NOT_INWARDED'
                                    ? '#b91c1c'
                                    : '#b45309',
                            }}
                          >
                            {serialLookupResult.status === 'IN_WARRANTY'
                              ? 'Serial Verified: IN WARRANTY'
                              : serialLookupResult.status === 'NOT_INWARDED'
                                ? 'Serial Number NOT Inwarded in Software'
                                : 'Serial Found: WARRANTY EXPIRED (Chargeable)'}
                          </Typography>
                        </Box>
                        {serialLookupResult.purchaseDate && (
                          <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.5 }}>
                            Purchase Date: <strong>{new Date(serialLookupResult.purchaseDate).toLocaleDateString()}</strong> | Expiry: <strong>{serialLookupResult.expiryDate ? new Date(serialLookupResult.expiryDate).toLocaleDateString() : 'N/A'}</strong>
                          </Typography>
                        )}
                        {serialLookupResult.status === 'NOT_INWARDED' && (
                          <Typography variant="caption" sx={{ color: '#991b1b', display: 'block', mt: 0.5 }}>
                            This serial number was not inwarded or recorded in software inventory.
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>
                )}
              </Box>

              <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 1' } }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Model Number *"
                  placeholder="e.g. COL-IP4MP / SHD-VD201"
                  value={formData.modelNo}
                  onChange={(e) => setFormData(p => ({ ...p, modelNo: e.target.value }))}
                  InputProps={{ sx: { borderRadius: 2, fontWeight: 700 } }}
                />
              </Box>

              <Box>
                <FormControl fullWidth size="small">
                  <InputLabel>Product Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Product Category"
                    onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="HD CAMERA">HD CAMERA</MenuItem>
                    <MenuItem value="IP CAMERA">IP CAMERA</MenuItem>
                    <MenuItem value="XVR / DVR">XVR / DVR</MenuItem>
                    <MenuItem value="NVR">NVR</MenuItem>
                    <MenuItem value="ACCESSORIES">ACCESSORIES</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <FormControl fullWidth size="small">
                  <InputLabel>Warranty Status</InputLabel>
                  <Select
                    value={formData.warrantyStatus}
                    label="Warranty Status"
                    onChange={(e) => setFormData(p => ({ ...p, warrantyStatus: e.target.value }))}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="IN_WARRANTY">In Warranty (Free)</MenuItem>
                    <MenuItem value="OUT_OF_WARRANTY">Out of Warranty (Chargeable)</MenuItem>
                    <MenuItem value="EXTENDED_WARRANTY">Extended Warranty</MenuItem>
                    <MenuItem value="EXPIRED">Expired</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Purchase Date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData(p => ({ ...p, purchaseDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
              </Box>

              {/* Accessories Received Checkbox Grid */}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                  Accessories Handed Over by Customer:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {['Power Adapter', 'Mounting Bracket', 'LAN Cable', 'Antenna', 'BNC Connector', 'Original Box'].map((acc) => (
                    <Chip
                      key={acc}
                      label={acc}
                      clickable
                      color={formData.accessories.includes(acc) ? 'primary' : 'default'}
                      variant={formData.accessories.includes(acc) ? 'filled' : 'outlined'}
                      onClick={() => handleAccessoryToggle(acc)}
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* SECTION 3: Complaint Details */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 2, backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
                <AlertCircle size={18} />
              </Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', fontSize: '16px' }}>
                3. Customer Complaint & Fault Description
              </Typography>
            </Box>

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
              gap: 2.5
            }}>
              <Box>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Primary Complaint Category *</InputLabel>
                  <Select
                    value={formData.complaintCategory}
                    label="Primary Complaint Category *"
                    onChange={(e) => setFormData(p => ({ ...p, complaintCategory: e.target.value, complaintDescription: p.complaintDescription || e.target.value }))}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="No Power">No Power / Dead Device</MenuItem>
                    <MenuItem value="No Video">No Video / Blank Display</MenuItem>
                    <MenuItem value="IR Night Vision Failure">IR Night Vision Failure / Dark Image</MenuItem>
                    <MenuItem value="LAN Network Failure">LAN / Network Port Not Detecting</MenuItem>
                    <MenuItem value="Water Damage">Water / Moisture Ingress</MenuItem>
                    <MenuItem value="Firmware Corruption">Firmware Reboot Loop / Bricked</MenuItem>
                    <MenuItem value="Sensor / Lens Blur">Lens Blurred / Focus Issue</MenuItem>
                    <MenuItem value="Physical Damage">Physical Broken Body / Port</MenuItem>
                    <MenuItem value="Other">Other Specific Issue</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Detailed Complaint Description *"
                  placeholder="Describe customer observed fault in detail..."
                  multiline
                  rows={2}
                  value={formData.complaintDescription}
                  onChange={(e) => setFormData(p => ({ ...p, complaintDescription: e.target.value }))}
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
              </Box>
            </Box>
          </Paper>

          {/* Action Bar */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting || Boolean(serialLookupResult?.isReplaced)}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Send size={18} />}
              sx={{
                backgroundColor: serialLookupResult?.isReplaced ? '#94a3b8' : '#2563eb',
                color: '#ffffff',
                fontWeight: 800,
                borderRadius: 2.5,
                px: 4,
                py: 1.2,
                textTransform: 'none',
                fontSize: '15px',
                boxShadow: serialLookupResult?.isReplaced ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.3)',
                '&:hover': { backgroundColor: serialLookupResult?.isReplaced ? '#94a3b8' : '#1d4ed8' }
              }}
            >
              {submitting ? 'Generating Ticket...' : 'Create Service Request'}
            </Button>
          </Box>
        </Stack>
      </form>

      {/* SUCCESS TICKET CREATED MODAL */}
      <Dialog
        open={successDialog}
        onClose={() => setSuccessDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3.5, p: 1, boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)' }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <Box sx={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5, border: '2px solid #a7f3d0' }}>
            <CheckCircle2 size={36} color="#059669" />
          </Box>
          <Typography variant="h5" fontWeight={900} sx={{ color: '#0f172a' }}>
            Service Request Registered!
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Customer notification dispatched via SMS & WhatsApp
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {createdTicket && (
            <Paper elevation={0} sx={{ p: 2.5, backgroundColor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Generated Ticket Number:
                </Typography>
                <Chip label={createdTicket.ticketNo} color="primary" sx={{ fontWeight: 900, fontFamily: 'monospace', fontSize: '14px' }} />
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="#64748b">Customer Name:</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0f172a">{createdTicket.customerSnapshot?.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="#64748b">Mobile Number:</Typography>
                  <Typography variant="body2" fontWeight={700} color="#16a34a">{createdTicket.customerSnapshot?.mobile}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="#64748b">Model & Serial:</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0f172a">{createdTicket.modelNo} ({createdTicket.serialNumber})</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="#64748b">Current Status:</Typography>
                  <Chip label="WAITING_FOR_PRODUCT" size="small" sx={{ fontSize: '10px', fontWeight: 800, backgroundColor: '#fef3c7', color: '#b45309' }} />
                </Grid>
              </Grid>
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => {
              setSuccessDialog(false);
              resetForm();
            }}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Raise Another
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              setSuccessDialog(false);
              if (onServiceCreated) {
                onServiceCreated(createdTicket);
              } else {
                window.dispatchEvent(new CustomEvent('NAVIGATE_DRAWER', { detail: { id: 'service_requests' } }));
              }
            }}
            sx={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: 800,
              borderRadius: 2.5,
              px: 3.5,
              textTransform: 'none',
              '&:hover': { backgroundColor: '#1d4ed8' }
            }}
          >
            View Service Requests
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modern In-App Notification / Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: 999999 }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{
            width: '100%',
            minWidth: '340px',
            maxWidth: '680px',
            fontWeight: 700,
            fontSize: '0.92rem',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
