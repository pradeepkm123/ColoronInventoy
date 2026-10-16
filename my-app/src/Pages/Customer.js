import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ReactSwitch from 'react-switch';
import {
  Box,
  Button,
  Checkbox,
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel
} from '@mui/material';
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  FileDown,
  Mail,
  Phone,
  Building,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  X
} from 'lucide-react';
import { useSnackbar } from 'notistack';

const API = 'http://localhost:5002';

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

const initialAddressState = {
  addressLine1: '',
  addressLine2: '',
  area: '',
  landmark: '',
  city: '',
  state: '',
  pinCode: '',
  country: 'India',
};

const initialFormData = {
  customerName: '',
  mobileNumber: '',
  email: '',
  gstIdentificationNumber: '',
  storeName: '',
  storeHandle: '',
  status: true,
  profilePicture: null,
  billingAddress: { ...initialAddressState },
  shippingSameAsBilling: true,
  shippingAddress: { ...initialAddressState },
};

const Customer = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/customers`);
      const data = (res.data || []).map((c) => ({ ...c, status: !!c.status }));
      setCustomers(data);
    } catch (error) {
      enqueueSnackbar('Error fetching customers!', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Field-level validator
  const validateField = (fieldPath, value, currentData = formData) => {
    // 1. Customer Name
    if (fieldPath === 'customerName') {
      const trimmed = (value || '').trim();
      if (!trimmed) return 'Customer Name is required.';
      const hasLetter = /[a-zA-Z]/.test(trimmed);
      const validChars = /^[a-zA-Z0-9\s.\-&']+$/.test(trimmed);
      if (!hasLetter || !validChars) {
        return 'Enter a valid customer name.';
      }
      return '';
    }

    // 2. Mobile Number
    if (fieldPath === 'mobileNumber') {
      const trimmed = (value || '').toString().trim();
      if (!trimmed) return 'Mobile number is required.';
      if (!/^\d{10}$/.test(trimmed)) {
        return 'Mobile number must be exactly 10 digits.';
      }
      return '';
    }

    // 3. Email Address (Optional)
    if (fieldPath === 'email') {
      const trimmed = (value || '').trim();
      if (!trimmed) return ''; // Optional: allowed
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return 'Enter a valid email address.';
      }
      return '';
    }

    // 4. GST Identification Number (Optional)
    if (fieldPath === 'gstIdentificationNumber') {
      const trimmed = (value || '').trim().toUpperCase();
      if (!trimmed) return ''; // Optional: allowed
      if (trimmed.length !== 15) {
        return 'GST Identification Number must be exactly 15 characters.';
      }
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(trimmed)) {
        return 'Enter a valid GST Identification Number.';
      }
      return '';
    }

    // 5. Billing Address Line 1 (Required)
    if (fieldPath === 'billingAddress.addressLine1') {
      const trimmed = (value || '').trim();
      if (!trimmed) return 'Address Line 1 is required.';
      const hasMeaningful = /[a-zA-Z0-9]/.test(trimmed);
      const validChars = /^[a-zA-Z0-9\s/.,\-#]+$/.test(trimmed);
      if (!hasMeaningful || !validChars) {
        return 'Enter a valid address.';
      }
      return '';
    }

    // Address Line 2 (Optional)
    if (fieldPath === 'billingAddress.addressLine2') {
      const trimmed = (value || '').trim();
      if (!trimmed) return '';
      const hasMeaningful = /[a-zA-Z0-9]/.test(trimmed);
      const validChars = /^[a-zA-Z0-9\s/.,\-#]+$/.test(trimmed);
      if (!hasMeaningful || !validChars) {
        return 'Enter a valid address.';
      }
      return '';
    }

    // Area / Locality (Optional)
    if (fieldPath === 'billingAddress.area') {
      const trimmed = (value || '').trim();
      if (!trimmed) return '';
      const hasLetter = /[a-zA-Z]/.test(trimmed);
      const validChars = /^[a-zA-Z0-9\s/.,\-#]+$/.test(trimmed);
      if (!hasLetter || !validChars) {
        return 'Enter a valid area/locality.';
      }
      return '';
    }

    // City (Required)
    if (fieldPath === 'billingAddress.city') {
      const trimmed = (value || '').trim();
      if (!trimmed) return 'City is required.';
      const hasLetter = /[a-zA-Z]/.test(trimmed);
      const validChars = /^[a-zA-Z\s.\-]+$/.test(trimmed);
      if (!hasLetter || !validChars) {
        return 'Enter a valid city name.';
      }
      return '';
    }

    // State (Required)
    if (fieldPath === 'billingAddress.state') {
      const trimmed = (value || '').trim();
      if (!trimmed || trimmed === 'Select State') return 'Please select a state.';
      return '';
    }

    // PIN Code (Required, 6 digits)
    if (fieldPath === 'billingAddress.pinCode') {
      const trimmed = (value || '').toString().trim();
      if (!trimmed) return 'PIN code is required.';
      if (!/^\d{6}$/.test(trimmed)) {
        return 'Enter a valid 6-digit PIN code.';
      }
      return '';
    }

    // Shipping Address fields (Validated only when not same as billing)
    if (!currentData.shippingSameAsBilling) {
      if (fieldPath === 'shippingAddress.addressLine1') {
        const trimmed = (value || '').trim();
        if (!trimmed) return 'Address Line 1 is required.';
        const hasMeaningful = /[a-zA-Z0-9]/.test(trimmed);
        const validChars = /^[a-zA-Z0-9\s/.,\-#]+$/.test(trimmed);
        if (!hasMeaningful || !validChars) {
          return 'Enter a valid address.';
        }
        return '';
      }

      if (fieldPath === 'shippingAddress.addressLine2') {
        const trimmed = (value || '').trim();
        if (!trimmed) return '';
        const hasMeaningful = /[a-zA-Z0-9]/.test(trimmed);
        const validChars = /^[a-zA-Z0-9\s/.,\-#]+$/.test(trimmed);
        if (!hasMeaningful || !validChars) {
          return 'Enter a valid address.';
        }
        return '';
      }

      if (fieldPath === 'shippingAddress.area') {
        const trimmed = (value || '').trim();
        if (!trimmed) return '';
        const hasLetter = /[a-zA-Z]/.test(trimmed);
        const validChars = /^[a-zA-Z0-9\s/.,\-#]+$/.test(trimmed);
        if (!hasLetter || !validChars) {
          return 'Enter a valid area/locality.';
        }
        return '';
      }

      if (fieldPath === 'shippingAddress.city') {
        const trimmed = (value || '').trim();
        if (!trimmed) return 'City is required.';
        const hasLetter = /[a-zA-Z]/.test(trimmed);
        const validChars = /^[a-zA-Z\s.\-]+$/.test(trimmed);
        if (!hasLetter || !validChars) {
          return 'Enter a valid city name.';
        }
        return '';
      }

      if (fieldPath === 'shippingAddress.state') {
        const trimmed = (value || '').trim();
        if (!trimmed || trimmed === 'Select State') return 'Please select a state.';
        return '';
      }

      if (fieldPath === 'shippingAddress.pinCode') {
        const trimmed = (value || '').toString().trim();
        if (!trimmed) return 'PIN code is required.';
        if (!/^\d{6}$/.test(trimmed)) {
          return 'Enter a valid 6-digit PIN code.';
        }
        return '';
      }
    }

    return '';
  };

  const handleFieldChange = (fieldPath, rawValue) => {
    let value = rawValue;

    // Formatting & restrictions
    if (fieldPath === 'mobileNumber') {
      value = rawValue.replace(/\D/g, '').slice(0, 10);
    } else if (fieldPath === 'gstIdentificationNumber') {
      value = rawValue.toUpperCase().slice(0, 15);
    } else if (fieldPath.endsWith('.pinCode')) {
      value = rawValue.replace(/\D/g, '').slice(0, 6);
    }

    setFormData((prev) => {
      let updated;
      if (fieldPath.includes('.')) {
        const [parent, child] = fieldPath.split('.');
        updated = {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value,
          },
        };
      } else {
        updated = { ...prev, [fieldPath]: value };
      }

      // Live sync Billing to Shipping when shippingSameAsBilling is checked
      if (updated.shippingSameAsBilling && fieldPath.startsWith('billingAddress.')) {
        const child = fieldPath.split('.')[1];
        updated.shippingAddress = {
          ...updated.shippingAddress,
          [child]: value,
        };
      }

      // Revalidate immediately on change if error exists or field was touched
      if (errors[fieldPath] || touched[fieldPath]) {
        const err = validateField(fieldPath, value, updated);
        setErrors((prevErr) => ({
          ...prevErr,
          [fieldPath]: err,
        }));
      }

      return updated;
    });
  };

  const handleBlur = (fieldPath) => {
    setTouched((prev) => ({ ...prev, [fieldPath]: true }));

    let val;
    if (fieldPath.includes('.')) {
      const [p, c] = fieldPath.split('.');
      val = formData[p]?.[c];
    } else {
      val = formData[fieldPath];
    }

    const err = validateField(fieldPath, val, formData);
    setErrors((prev) => ({
      ...prev,
      [fieldPath]: err,
    }));
  };

  const handleCheckboxSameAddress = (checked) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        shippingSameAsBilling: checked,
      };
      if (checked) {
        // Immediately copy Billing Address into Shipping Address
        updated.shippingAddress = { ...prev.billingAddress };
        // Clear shipping address errors
        setErrors((errs) => {
          const next = { ...errs };
          Object.keys(next).forEach((k) => {
            if (k.startsWith('shippingAddress.')) delete next[k];
          });
          return next;
        });
      }
      return updated;
    });
  };

  const handleSwitchChange = (checked) => {
    setFormData((p) => ({ ...p, status: checked }));
  };

  const handleFileChange = (event) => {
    setFormData((p) => ({ ...p, profilePicture: event.target.files?.[0] || null }));
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      mobileNumber: '',
      email: '',
      gstIdentificationNumber: '',
      storeName: '',
      storeHandle: '',
      status: true,
      profilePicture: null,
      billingAddress: { ...initialAddressState },
      shippingSameAsBilling: true,
      shippingAddress: { ...initialAddressState },
    });
    setErrors({});
    setTouched({});
  };

  const handleOpen = () => {
    resetForm();
    setEditId(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditId(null);
  };

  const validateAll = () => {
    const newErrors = {};
    const fieldsToValidate = [
      'customerName',
      'mobileNumber',
      'email',
      'gstIdentificationNumber',
      'billingAddress.addressLine1',
      'billingAddress.addressLine2',
      'billingAddress.area',
      'billingAddress.city',
      'billingAddress.state',
      'billingAddress.pinCode',
    ];

    if (!formData.shippingSameAsBilling) {
      fieldsToValidate.push(
        'shippingAddress.addressLine1',
        'shippingAddress.addressLine2',
        'shippingAddress.area',
        'shippingAddress.city',
        'shippingAddress.state',
        'shippingAddress.pinCode'
      );
    }

    fieldsToValidate.forEach((fieldPath) => {
      let val;
      if (fieldPath.includes('.')) {
        const [p, c] = fieldPath.split('.');
        val = formData[p]?.[c];
      } else {
        val = formData[fieldPath];
      }
      const err = validateField(fieldPath, val, formData);
      if (err) {
        newErrors[fieldPath] = err;
      }
    });

    setErrors(newErrors);

    // Mark fields touched
    const allTouched = {};
    fieldsToValidate.forEach((f) => {
      allTouched[f] = true;
    });
    setTouched(allTouched);

    return newErrors;
  };

  const handleSave = async () => {
    const formErrors = validateAll();
    const errorKeys = Object.keys(formErrors);

    if (errorKeys.length > 0) {
      // Find first error and scroll / focus to it
      const firstField = errorKeys[0];
      const domId = `field-${firstField.replace('.', '-')}`;
      const el = document.getElementById(domId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return;
    }

    try {
      const fd = new FormData();
      const cleanedCustomerName = formData.customerName.trim().replace(/\s+/g, ' ');
      fd.append('customerName', cleanedCustomerName);
      fd.append('storeName', formData.storeName.trim() || 'Lookman Distribution');
      fd.append('mobileNumber', formData.mobileNumber.trim());
      fd.append('phoneNo', formData.mobileNumber.trim());
      fd.append('email', formData.email.trim());
      fd.append('mailId', formData.email.trim());
      fd.append('gstIdentificationNumber', formData.gstIdentificationNumber.trim().toUpperCase());
      fd.append('gstNo', formData.gstIdentificationNumber.trim().toUpperCase());
      fd.append('storeHandle', formData.storeHandle.trim() || 'General');
      fd.append('status', formData.status.toString());
      fd.append('shippingSameAsBilling', formData.shippingSameAsBilling.toString());
      fd.append('billingAddress', JSON.stringify(formData.billingAddress));
      fd.append('shippingAddress', JSON.stringify(formData.shippingSameAsBilling ? formData.billingAddress : formData.shippingAddress));

      // Build formatted address string for existing table & compatibility
      const b = formData.billingAddress;
      const addressParts = [
        b.addressLine1,
        b.addressLine2,
        b.area,
        b.city,
        b.state ? (b.pinCode ? `${b.state} - ${b.pinCode}` : b.state) : b.pinCode,
        b.country,
      ].filter(Boolean);
      fd.append('address', addressParts.join(', '));

      if (formData.profilePicture) {
        fd.append('profilePicture', formData.profilePicture);
      }

      if (editId) {
        await axios.put(`${API}/api/customers/${editId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        enqueueSnackbar('Customer updated successfully!', { variant: 'success' });
      } else {
        await axios.post(`${API}/api/customers`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        enqueueSnackbar('Customer added successfully', { variant: 'success' });
      }

      await fetchCustomers();
      handleClose();
    } catch (error) {
      const backendErrors = error.response?.data?.errors;
      if (backendErrors && typeof backendErrors === 'object') {
        setErrors((prev) => ({ ...prev, ...backendErrors }));
        const firstBackendKey = Object.keys(backendErrors)[0];
        const domId = `field-${firstBackendKey.replace('.', '-')}`;
        const el = document.getElementById(domId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      }
      enqueueSnackbar(error.response?.data?.message || 'Error saving customer!', { variant: 'error' });
    }
  };

  const handleEdit = (customer) => {
    const billing = customer.billingAddress || {
      addressLine1: customer.address || '',
      addressLine2: '',
      area: '',
      landmark: '',
      city: '',
      state: '',
      pinCode: '',
      country: 'India',
    };
    const same = customer.shippingSameAsBilling !== undefined ? !!customer.shippingSameAsBilling : true;
    const shipping = customer.shippingAddress || { ...billing };

    setFormData({
      customerName: customer.customerName || '',
      mobileNumber: customer.mobileNumber || customer.phoneNo || '',
      email: customer.email || customer.mailId || '',
      gstIdentificationNumber: customer.gstIdentificationNumber || customer.gstNo || '',
      storeName: customer.storeName || '',
      storeHandle: customer.storeHandle || '',
      billingAddress: {
        addressLine1: billing.addressLine1 || '',
        addressLine2: billing.addressLine2 || '',
        area: billing.area || '',
        landmark: billing.landmark || '',
        city: billing.city || '',
        state: billing.state || '',
        pinCode: billing.pinCode || '',
        country: billing.country || 'India',
      },
      shippingSameAsBilling: same,
      shippingAddress: {
        addressLine1: shipping.addressLine1 || '',
        addressLine2: shipping.addressLine2 || '',
        area: shipping.area || '',
        landmark: shipping.landmark || '',
        city: shipping.city || '',
        state: shipping.state || '',
        pinCode: shipping.pinCode || '',
        country: shipping.country || 'India',
      },
      status: customer.status !== false,
      profilePicture: null,
    });
    setEditId(customer._id);
    setErrors({});
    setTouched({});
    setOpen(true);
  };

  const handleDeleteConfirmOpen = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirmClose = () => {
    setConfirmOpen(false);
    setDeleteId(null);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/customers/${deleteId}`);
      enqueueSnackbar('Customer deleted successfully!', { variant: 'success' });
      await fetchCustomers();
      handleDeleteConfirmClose();
    } catch (error) {
      enqueueSnackbar('Error deleting customer!', { variant: 'error' });
    }
  };

  const handleToggleStatus = async (cust) => {
    try {
      const fd = new FormData();
      fd.append('storeName', cust.storeName || '');
      fd.append('customerName', cust.customerName || '');
      fd.append('gstNo', cust.gstNo || '');
      fd.append('address', cust.address || '');
      fd.append('mailId', cust.mailId || '');
      fd.append('phoneNo', cust.phoneNo || '');
      fd.append('storeHandle', cust.storeHandle || '');
      fd.append('status', (!cust.status).toString());

      await axios.put(`${API}/api/customers/${cust._id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      enqueueSnackbar(`Status set to ${!cust.status ? 'Active' : 'Inactive'}`, { variant: 'success' });
      await fetchCustomers();
    } catch (err) {
      enqueueSnackbar('Failed to update status', { variant: 'error' });
    }
  };

  const activeCount = customers.filter((c) => c.status).length;
  const inactiveCount = customers.filter((c) => !c.status).length;
  const verifiedGstCount = customers.filter((c) => {
    const g = c.gstIdentificationNumber || c.gstNo;
    return g && g.length === 15;
  }).length;

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (c.customerName || '').toLowerCase().includes(q) ||
      (c.storeName || '').toLowerCase().includes(q) ||
      (c.gstIdentificationNumber || c.gstNo || '').toLowerCase().includes(q) ||
      (c.mobileNumber || c.phoneNo || '').toLowerCase().includes(q) ||
      (c.email || c.mailId || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return c.status === true;
    if (statusFilter === 'inactive') return c.status === false;
    return true;
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2, width: '100%' }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
            Customer Directory
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Manage registered clients, billing information, GST identification numbers, and contact profiles.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={fetchCustomers}
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
            Add New Customer
          </Button>
        </Box>
      </Box>

      {/* KPI Metric Summary Cards (Full Screen Grid) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
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
                Total Customers
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5 }}>
                {customers.length}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} color="#2563eb" />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Active Accounts
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#16a34a', mt: 0.5 }}>
                {activeCount}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={22} color="#16a34a" />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Inactive Accounts
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#ef4444', mt: 0.5 }}>
                {inactiveCount}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserX size={22} color="#ef4444" />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Verified GST Clients
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5 }}>
                {verifiedGstCount}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} color="#9333ea" />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Main Table Card */}
      <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden', width: '100%', mt: 3 }}>
        {/* Filters Bar */}
        <Box sx={{ p: 2.5, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff' }}>
          <TextField
            placeholder="Search customer name, store, GST, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="inactive">Inactive Only</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Data Table */}
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', width: 60 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Customer / Company</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Store Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>GST Number</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Contact Info</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Store Handle</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredCustomers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((customer, idx) => {
                  const initials = (customer.customerName || 'C')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <TableRow key={customer._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={customer.profilePicture ? `${API}/${customer.profilePicture}` : undefined}
                            sx={{
                              width: 38,
                              height: 38,
                              fontSize: '13px',
                              fontWeight: 700,
                              backgroundColor: customer.status ? '#eff6ff' : '#f1f5f9',
                              color: customer.status ? '#1d4ed8' : '#64748b',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {initials}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a' }}>
                              {customer.customerName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                              {customer.address || '—'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>
                          {customer.storeName}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={customer.gstIdentificationNumber || customer.gstNo || 'Unregistered'}
                          size="small"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            backgroundColor: '#f1f5f9',
                            color: '#1e293b',
                            borderRadius: 1.5,
                            fontSize: '12px',
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                          <Typography variant="caption" sx={{ color: '#334155', display: 'flex', alignItems: 'center', gap: 0.6 }}>
                            <Phone size={12} color="#64748b" /> {customer.mobileNumber || customer.phoneNo || '—'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.6 }}>
                            <Mail size={12} color="#64748b" /> {customer.email || customer.mailId || '—'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={customer.storeHandle || 'General'}
                          size="small"
                          sx={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontWeight: 500 }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Tooltip title="Click to toggle Active/Inactive state">
                          <Chip
                            label={customer.status ? 'Active' : 'Inactive'}
                            size="small"
                            onClick={() => handleToggleStatus(customer)}
                            sx={{
                              backgroundColor: customer.status ? '#dcfce7' : '#fee2e2',
                              color: customer.status ? '#15803d' : '#b91c1c',
                              fontWeight: 600,
                              fontSize: '12px',
                              borderRadius: 2,
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.85 },
                            }}
                          />
                        </Tooltip>
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Tooltip title="Edit Customer">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(customer)}
                              sx={{ color: '#0284c7', backgroundColor: '#e0f2fe', '&:hover': { backgroundColor: '#bae6fd' } }}
                            >
                              <Edit2 size={15} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete Customer">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteConfirmOpen(customer._id)}
                              sx={{ color: '#ef4444', backgroundColor: '#fee2e2', '&:hover': { backgroundColor: '#fecaca' } }}
                            >
                              <Trash2 size={15} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}

              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Users size={40} color="#94a3b8" style={{ marginBottom: 8 }} />
                    <Typography variant="body1" fontWeight={600} sx={{ color: '#334155' }}>
                      No Customers Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Try adjusting your search filters or click "Add New Customer".
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
          count={filteredCustomers.length}
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
        maxWidth="md"
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
              {editId ? 'Edit Customer Information' : 'Add New Customer'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {editId ? 'Update customer details, billing, and shipping information' : 'Enter customer details, billing information, and store credentials'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: '#64748b', '&:hover': { backgroundColor: '#e2e8f0' } }}>
            <X size={18} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, maxHeight: '75vh' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.2 }}>

            {/* SECTION: CUSTOMER INFORMATION */}
            <Box sx={{ gridColumn: '1 / -1', pb: 0.8, borderBottom: '1.5px solid #e2e8f0' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Customer Information
              </Typography>
            </Box>

            {/* Field: Customer Name */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Customer Name <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                id="field-customerName"
                fullWidth
                size="small"
                name="customerName"
                placeholder="e.g. Ramesh Kumar or ABC Enterprises"
                value={formData.customerName}
                onChange={(e) => handleFieldChange('customerName', e.target.value)}
                onBlur={() => handleBlur('customerName')}
                error={!!errors.customerName}
                helperText={errors.customerName}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Field: Mobile Number */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Mobile Number <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                id="field-mobileNumber"
                fullWidth
                size="small"
                name="mobileNumber"
                placeholder="e.g. 9876543210"
                value={formData.mobileNumber}
                onChange={(e) => handleFieldChange('mobileNumber', e.target.value)}
                onBlur={() => handleBlur('mobileNumber')}
                error={!!errors.mobileNumber}
                helperText={errors.mobileNumber}
                inputProps={{ maxLength: 10 }}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Field: Email Address */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Email Address
              </Typography>
              <TextField
                id="field-email"
                fullWidth
                size="small"
                name="email"
                type="email"
                placeholder="customer@gmail.com"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Field: GST Identification Number (15 Digits) */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                GST Identification Number (15 Digits)
              </Typography>
              <TextField
                id="field-gstIdentificationNumber"
                fullWidth
                size="small"
                name="gstIdentificationNumber"
                placeholder="e.g. 29ABCDE1234F1Z5"
                value={formData.gstIdentificationNumber}
                onChange={(e) => handleFieldChange('gstIdentificationNumber', e.target.value)}
                onBlur={() => handleBlur('gstIdentificationNumber')}
                error={!!errors.gstIdentificationNumber}
                helperText={errors.gstIdentificationNumber}
                inputProps={{ maxLength: 15 }}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', fontFamily: 'monospace', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Field: Store / Company Name */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Store / Company Name
              </Typography>
              <TextField
                id="field-storeName"
                fullWidth
                size="small"
                name="storeName"
                placeholder="e.g. Lookman Distribution Pvt Ltd"
                value={formData.storeName}
                onChange={(e) => handleFieldChange('storeName', e.target.value)}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Field: Store Handle / Territory */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Store Handle / Territory
              </Typography>
              <TextField
                id="field-storeHandle"
                fullWidth
                size="small"
                name="storeHandle"
                placeholder="e.g. Geetha, South Branch"
                value={formData.storeHandle}
                onChange={(e) => handleFieldChange('storeHandle', e.target.value)}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* SECTION: BILLING ADDRESS */}
            <Box sx={{ gridColumn: '1 / -1', mt: 1.5, pb: 0.8, borderBottom: '1.5px solid #e2e8f0' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Billing Address
              </Typography>
            </Box>

            {/* Billing Address Line 1 */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Address Line 1 <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                id="field-billingAddress-addressLine1"
                fullWidth
                size="small"
                name="billingAddress.addressLine1"
                placeholder="e.g. 12, Gandhi Road"
                value={formData.billingAddress.addressLine1}
                onChange={(e) => handleFieldChange('billingAddress.addressLine1', e.target.value)}
                onBlur={() => handleBlur('billingAddress.addressLine1')}
                error={!!errors['billingAddress.addressLine1']}
                helperText={errors['billingAddress.addressLine1']}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Billing Address Line 2 */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Address Line 2
              </Typography>
              <TextField
                id="field-billingAddress-addressLine2"
                fullWidth
                size="small"
                name="billingAddress.addressLine2"
                placeholder="Apartment, suite, unit, etc."
                value={formData.billingAddress.addressLine2}
                onChange={(e) => handleFieldChange('billingAddress.addressLine2', e.target.value)}
                onBlur={() => handleBlur('billingAddress.addressLine2')}
                error={!!errors['billingAddress.addressLine2']}
                helperText={errors['billingAddress.addressLine2']}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Billing Area / Locality */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Area / Locality
              </Typography>
              <TextField
                id="field-billingAddress-area"
                fullWidth
                size="small"
                name="billingAddress.area"
                placeholder="e.g. Gandhi Nagar"
                value={formData.billingAddress.area}
                onChange={(e) => handleFieldChange('billingAddress.area', e.target.value)}
                onBlur={() => handleBlur('billingAddress.area')}
                error={!!errors['billingAddress.area']}
                helperText={errors['billingAddress.area']}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Billing City */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                City <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                id="field-billingAddress-city"
                fullWidth
                size="small"
                name="billingAddress.city"
                placeholder="e.g. Vellore"
                value={formData.billingAddress.city}
                onChange={(e) => handleFieldChange('billingAddress.city', e.target.value)}
                onBlur={() => handleBlur('billingAddress.city')}
                error={!!errors['billingAddress.city']}
                helperText={errors['billingAddress.city']}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Billing State */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                State <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <FormControl fullWidth size="small" error={!!errors['billingAddress.state']}>
                <Select
                  id="field-billingAddress-state"
                  displayEmpty
                  value={formData.billingAddress.state}
                  onChange={(e) => handleFieldChange('billingAddress.state', e.target.value)}
                  onBlur={() => handleBlur('billingAddress.state')}
                  sx={{ borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' }}
                >
                  <MenuItem value="">
                    <span style={{ color: '#94a3b8' }}>Select State</span>
                  </MenuItem>
                  {INDIAN_STATES.map((st) => (
                    <MenuItem key={st} value={st}>
                      {st}
                    </MenuItem>
                  ))}
                </Select>
                {errors['billingAddress.state'] && (
                  <Typography sx={{ color: '#d32f2f', fontSize: '0.75rem', mt: 0.4, ml: 1.75 }}>
                    {errors['billingAddress.state']}
                  </Typography>
                )}
              </FormControl>
            </Box>

            {/* Billing PIN Code */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                PIN Code <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                id="field-billingAddress-pinCode"
                fullWidth
                size="small"
                name="billingAddress.pinCode"
                placeholder="e.g. 632001"
                value={formData.billingAddress.pinCode}
                onChange={(e) => handleFieldChange('billingAddress.pinCode', e.target.value)}
                onBlur={() => handleBlur('billingAddress.pinCode')}
                error={!!errors['billingAddress.pinCode']}
                helperText={errors['billingAddress.pinCode']}
                inputProps={{ maxLength: 6 }}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Billing Country */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Country
              </Typography>
              <TextField
                id="field-billingAddress-country"
                fullWidth
                size="small"
                name="billingAddress.country"
                value={formData.billingAddress.country || 'India'}
                onChange={(e) => handleFieldChange('billingAddress.country', e.target.value)}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Checkbox: Shipping Address same as Billing Address */}
            <Box
              sx={{
                gridColumn: '1 / -1',
                mt: 1,
                p: 1.5,
                backgroundColor: '#f8fafc',
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.shippingSameAsBilling}
                    onChange={(e) => handleCheckboxSameAddress(e.target.checked)}
                    sx={{ color: '#0f2b48', '&.Mui-checked': { color: '#0f2b48' } }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b' }}>
                    Shipping Address same as Billing Address
                  </Typography>
                }
              />
            </Box>

            {/* SECTION: SHIPPING ADDRESS */}
            <Box
              sx={{
                gridColumn: '1 / -1',
                mt: 1,
                pb: 0.8,
                borderBottom: '1.5px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Shipping Address
              </Typography>
              {formData.shippingSameAsBilling && (
                <Chip
                  label="Synchronized with Billing"
                  size="small"
                  sx={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: '11px', border: '1px solid #bfdbfe' }}
                />
              )}
            </Box>

            {/* Shipping Address Line 1 */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Address Line 1 {!formData.shippingSameAsBilling && <span style={{ color: '#ef4444' }}>*</span>}
              </Typography>
              <TextField
                id="field-shippingAddress-addressLine1"
                fullWidth
                size="small"
                name="shippingAddress.addressLine1"
                placeholder="e.g. 12, Gandhi Road"
                value={formData.shippingAddress.addressLine1}
                onChange={(e) => handleFieldChange('shippingAddress.addressLine1', e.target.value)}
                onBlur={() => handleBlur('shippingAddress.addressLine1')}
                error={!formData.shippingSameAsBilling && !!errors['shippingAddress.addressLine1']}
                helperText={!formData.shippingSameAsBilling ? errors['shippingAddress.addressLine1'] : undefined}
                InputProps={{
                  readOnly: formData.shippingSameAsBilling,
                  sx: {
                    borderRadius: 2,
                    fontSize: '14px',
                    backgroundColor: formData.shippingSameAsBilling ? '#f1f5f9' : '#fff',
                    color: '#1e293b',
                  },
                }}
              />
            </Box>

            {/* Shipping Address Line 2 */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Address Line 2
              </Typography>
              <TextField
                id="field-shippingAddress-addressLine2"
                fullWidth
                size="small"
                name="shippingAddress.addressLine2"
                placeholder="Apartment, suite, unit, etc."
                value={formData.shippingAddress.addressLine2}
                onChange={(e) => handleFieldChange('shippingAddress.addressLine2', e.target.value)}
                onBlur={() => handleBlur('shippingAddress.addressLine2')}
                error={!formData.shippingSameAsBilling && !!errors['shippingAddress.addressLine2']}
                helperText={!formData.shippingSameAsBilling ? errors['shippingAddress.addressLine2'] : undefined}
                InputProps={{
                  readOnly: formData.shippingSameAsBilling,
                  sx: {
                    borderRadius: 2,
                    fontSize: '14px',
                    backgroundColor: formData.shippingSameAsBilling ? '#f1f5f9' : '#fff',
                    color: '#1e293b',
                  },
                }}
              />
            </Box>

            {/* Shipping Area / Locality */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Area / Locality
              </Typography>
              <TextField
                id="field-shippingAddress-area"
                fullWidth
                size="small"
                name="shippingAddress.area"
                placeholder="e.g. Gandhi Nagar"
                value={formData.shippingAddress.area}
                onChange={(e) => handleFieldChange('shippingAddress.area', e.target.value)}
                onBlur={() => handleBlur('shippingAddress.area')}
                error={!formData.shippingSameAsBilling && !!errors['shippingAddress.area']}
                helperText={!formData.shippingSameAsBilling ? errors['shippingAddress.area'] : undefined}
                InputProps={{
                  readOnly: formData.shippingSameAsBilling,
                  sx: {
                    borderRadius: 2,
                    fontSize: '14px',
                    backgroundColor: formData.shippingSameAsBilling ? '#f1f5f9' : '#fff',
                    color: '#1e293b',
                  },
                }}
              />
            </Box>

            {/* Shipping City */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                City {!formData.shippingSameAsBilling && <span style={{ color: '#ef4444' }}>*</span>}
              </Typography>
              <TextField
                id="field-shippingAddress-city"
                fullWidth
                size="small"
                name="shippingAddress.city"
                placeholder="e.g. Vellore"
                value={formData.shippingAddress.city}
                onChange={(e) => handleFieldChange('shippingAddress.city', e.target.value)}
                onBlur={() => handleBlur('shippingAddress.city')}
                error={!formData.shippingSameAsBilling && !!errors['shippingAddress.city']}
                helperText={!formData.shippingSameAsBilling ? errors['shippingAddress.city'] : undefined}
                InputProps={{
                  readOnly: formData.shippingSameAsBilling,
                  sx: {
                    borderRadius: 2,
                    fontSize: '14px',
                    backgroundColor: formData.shippingSameAsBilling ? '#f1f5f9' : '#fff',
                    color: '#1e293b',
                  },
                }}
              />
            </Box>

            {/* Shipping State */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                State {!formData.shippingSameAsBilling && <span style={{ color: '#ef4444' }}>*</span>}
              </Typography>
              <FormControl fullWidth size="small" error={!formData.shippingSameAsBilling && !!errors['shippingAddress.state']}>
                <Select
                  id="field-shippingAddress-state"
                  displayEmpty
                  disabled={formData.shippingSameAsBilling}
                  value={formData.shippingAddress.state}
                  onChange={(e) => handleFieldChange('shippingAddress.state', e.target.value)}
                  onBlur={() => handleBlur('shippingAddress.state')}
                  sx={{
                    borderRadius: 2,
                    fontSize: '14px',
                    backgroundColor: formData.shippingSameAsBilling ? '#f1f5f9' : '#fff',
                    color: '#1e293b',
                  }}
                >
                  <MenuItem value="">
                    <span style={{ color: '#94a3b8' }}>Select State</span>
                  </MenuItem>
                  {INDIAN_STATES.map((st) => (
                    <MenuItem key={st} value={st}>
                      {st}
                    </MenuItem>
                  ))}
                </Select>
                {!formData.shippingSameAsBilling && errors['shippingAddress.state'] && (
                  <Typography sx={{ color: '#d32f2f', fontSize: '0.75rem', mt: 0.4, ml: 1.75 }}>
                    {errors['shippingAddress.state']}
                  </Typography>
                )}
              </FormControl>
            </Box>

            {/* Shipping PIN Code */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                PIN Code {!formData.shippingSameAsBilling && <span style={{ color: '#ef4444' }}>*</span>}
              </Typography>
              <TextField
                id="field-shippingAddress-pinCode"
                fullWidth
                size="small"
                name="shippingAddress.pinCode"
                placeholder="e.g. 632001"
                value={formData.shippingAddress.pinCode}
                onChange={(e) => handleFieldChange('shippingAddress.pinCode', e.target.value)}
                onBlur={() => handleBlur('shippingAddress.pinCode')}
                error={!formData.shippingSameAsBilling && !!errors['shippingAddress.pinCode']}
                helperText={!formData.shippingSameAsBilling ? errors['shippingAddress.pinCode'] : undefined}
                inputProps={{ maxLength: 6 }}
                InputProps={{
                  readOnly: formData.shippingSameAsBilling,
                  sx: {
                    borderRadius: 2,
                    fontSize: '14px',
                    backgroundColor: formData.shippingSameAsBilling ? '#f1f5f9' : '#fff',
                    color: '#1e293b',
                  },
                }}
              />
            </Box>

            {/* Shipping Country */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Country
              </Typography>
              <TextField
                id="field-shippingAddress-country"
                fullWidth
                size="small"
                name="shippingAddress.country"
                value={formData.shippingAddress.country || 'India'}
                onChange={(e) => handleFieldChange('shippingAddress.country', e.target.value)}
                InputProps={{
                  readOnly: formData.shippingSameAsBilling,
                  sx: {
                    borderRadius: 2,
                    fontSize: '14px',
                    backgroundColor: formData.shippingSameAsBilling ? '#f1f5f9' : '#fff',
                    color: '#1e293b',
                  },
                }}
              />
            </Box>

            {/* Status Switch Card */}
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
                mt: 1,
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a' }}>
                  Account Status: {formData.status ? 'Active Account' : 'Inactive Account'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Active accounts can place outward orders and generate tax invoices.
                </Typography>
              </Box>
              <ReactSwitch
                checked={formData.status}
                onChange={handleSwitchChange}
                onColor="#16a34a"
                offColor="#cbd5e1"
                checkedIcon={false}
                uncheckedIcon={false}
                height={24}
                width={48}
              />
            </Box>

            {/* Profile Picture Upload */}
            <Box
              sx={{
                gridColumn: '1 / -1',
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
                    {formData.profilePicture ? formData.profilePicture.name : 'Upload Profile Picture / Logo'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Supported formats: PNG, JPG, or WEBP up to 5MB
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="outlined"
                component="label"
                size="small"
                sx={{ textTransform: 'none', borderRadius: 2, borderColor: '#cbd5e1', color: '#334155', fontWeight: 600, px: 2.5 }}
              >
                {formData.profilePicture ? 'Change File' : 'Browse File'}
                <input hidden accept="image/*" type="file" onChange={handleFileChange} />
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
            {editId ? 'Update Customer' : 'Add Customer'}
          </Button>
        </Box>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={handleDeleteConfirmClose} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            Are you sure you want to delete this customer? This action cannot be undone.
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

export default Customer;
