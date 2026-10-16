import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Snackbar,
  Alert,
  Skeleton,
  Fade,
  Stack,
  LinearProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  FileDownload as FileDownloadIcon,
  ContentCopy as ContentCopyIcon,
  QrCode2 as QrCodeIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Storefront as StorefrontIcon,
  CalendarToday as CalendarIcon,
  LocalShipping as LocalShippingIcon,
  ReceiptLong as ReceiptLongIcon,
  CurrencyRupee as CurrencyRupeeIcon,
  TrendingUp as TrendingUpIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  FileUpload as FileUploadIcon,
} from '@mui/icons-material';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_BASE = process.env.REACT_APP_API_URL || 'https://coloroninventoy.onrender.com/api';

// Indian currency formatter
const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

// Formatter for dates
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

function Invoice() {
  const navigate = useNavigate();

  // Data states
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('ALL');
  const [selectedSalesPerson, setSelectedSalesPerson] = useState('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog & Modal states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  // Bulk Excel Import & S/N Validation States
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState('strict'); // 'strict' | 'historical'
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [rawExcelRows, setRawExcelRows] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState(null);

  const handleDownloadSampleTemplate = () => {
    const templateData = [
      {
        'Invoice Number': 'INV-2026-001',
        'Model No': 'CL-4MP-DOME',
        'Serial Number': 'SN10001',
        'Price': 2450,
        'Sales Person': 'John Doe',
        'Dispatch Date': '2026-08-15',
        'Customer Type': 'Store',
        'Store Name': 'Chennai Branch',
        'Customer Name': 'Chennai Retail',
        'Phone Number': '9876543210',
        'Customer Address': 'No 10, Anna Salai, Chennai',
        'GST No': '33AAAAA0000A1Z5'
      },
      {
        'Invoice Number': 'INV-2026-001',
        'Model No': 'CL-4MP-DOME',
        'Serial Number': 'SN10002',
        'Price': 2450,
        'Sales Person': 'John Doe',
        'Dispatch Date': '2026-08-15',
        'Customer Type': 'Store',
        'Store Name': 'Chennai Branch',
        'Customer Name': 'Chennai Retail',
        'Phone Number': '9876543210',
        'Customer Address': 'No 10, Anna Salai, Chennai',
        'GST No': '33AAAAA0000A1Z5'
      },
      {
        'Invoice Number': 'INV-2026-002',
        'Model No': 'CL-2MP-BULLET',
        'Serial Number': 'SN20005',
        'Price': 1850,
        'Sales Person': 'Sarah Smith',
        'Dispatch Date': '2026-08-18',
        'Customer Type': 'Customer',
        'Store Name': '',
        'Customer Name': 'ABC Security Systems',
        'Phone Number': '9845012345',
        'Customer Address': '12 Industrial Estate, Bangalore',
        'GST No': '29BBBBB1111B1Z2'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 16 },
      { wch: 18 },
      { wch: 20 },
      { wch: 10 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 22 },
      { wch: 14 },
      { wch: 30 },
      { wch: 18 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dispatch_Template');
    XLSX.writeFile(wb, 'Dispatch_Import_Template.xlsx');
    setSnackbar({ open: true, message: 'Downloaded Dispatch Excel Template!', severity: 'info' });
  };

  const handleExcelFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportFeedback(null);
    setValidationResult(null);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setImportFeedback({ type: 'warning', message: 'The uploaded file has no data rows!' });
          setRawExcelRows([]);
          return;
        }

        const flattened = [];
        rawJson.forEach((row, idx) => {
          const invoiceNumber = row['Invoice Number'] || row['InvoiceNo'] || row['invoiceNumber'] || row['Invoice'] || '';
          const modelNo = row['Model No'] || row['Model'] || row['modelNo'] || row['Product'] || '';
          const price = Number(row['Price'] || row['price'] || 0);
          const salePerson = row['Sales Person'] || row['Salesperson'] || row['salePerson'] || 'Excel Import';
          const rawSN = row['Serial Number'] || row['S/N'] || row['SN'] || row['Barcodes'] || row['serialNumber'] || row['Barcode'] || row['serial'] || '';
          const dispatchDate = row['Dispatch Date'] || row['Date'] || row['dispatchDate'] || '';
          const customerType = row['Customer Type'] || row['Type'] || row['customerType'] || 'Store';
          const storeName = row['Store Name'] || row['storeName'] || '';
          const customerName = row['Customer Name'] || row['customerName'] || storeName;

          const serials = String(rawSN).split(/[,;\n\r]+/).map(s => s.trim()).filter(Boolean);

          if (serials.length > 0) {
            serials.forEach(sn => {
              flattened.push({
                _origRow: idx + 1,
                invoiceNumber: String(invoiceNumber).trim(),
                modelNo: String(modelNo).trim(),
                serialNumber: sn,
                customerName: String(customerName).trim(),
                storeName: String(storeName).trim(),
                customerType: String(customerType).trim(),
                price,
                salePerson: String(salePerson).trim(),
                dispatchDate: dispatchDate instanceof Date ? dispatchDate.toISOString().split('T')[0] : String(dispatchDate).trim(),
                phoneNumber: String(row['Phone Number'] || row['Mobile'] || row['phoneNumber'] || '').trim(),
                customerAddress: String(row['Customer Address'] || row['Address'] || row['customerAddress'] || '').trim(),
                gstNo: String(row['GST No'] || row['gstNo'] || '').trim(),
              });
            });
          } else {
            flattened.push({
              _origRow: idx + 1,
              invoiceNumber: String(invoiceNumber).trim(),
              modelNo: String(modelNo).trim(),
              serialNumber: '',
              customerName: String(customerName).trim(),
              storeName: String(storeName).trim(),
              customerType: String(customerType).trim(),
              price,
              salePerson: String(salePerson).trim(),
              dispatchDate: dispatchDate instanceof Date ? dispatchDate.toISOString().split('T')[0] : String(dispatchDate).trim(),
              phoneNumber: String(row['Phone Number'] || row['Mobile'] || row['phoneNumber'] || '').trim(),
              customerAddress: String(row['Customer Address'] || row['Address'] || row['customerAddress'] || '').trim(),
              gstNo: String(row['GST No'] || row['gstNo'] || '').trim(),
            });
          }
        });

        setRawExcelRows(flattened);
        setImportFeedback({ type: 'info', message: `Parsed ${flattened.length} item(s) from "${file.name}". Click "Validate Excel" to check against inventory.` });
      } catch (err) {
        console.error('Error parsing Excel:', err);
        setImportFeedback({ type: 'error', message: 'Failed to read Excel file. Please verify file format.' });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleRunValidation = async () => {
    if (!rawExcelRows || rawExcelRows.length === 0) return;

    try {
      setIsValidating(true);
      setImportFeedback(null);

      const res = await axios.post(`${API_BASE}/dispatch/import/validate`, {
        rows: rawExcelRows,
        mode: importMode
      });

      setValidationResult(res.data);
      if (res.data.isAllValid) {
        setImportFeedback({
          type: 'success',
          message: `All ${res.data.totalRows} serial numbers verified against inventory stock! You may now import.`
        });
      } else {
        setImportFeedback({
          type: 'error',
          message: `Validation Failed: ${res.data.invalidCount + res.data.duplicateCount} issue(s) detected. Upload is blocked until all errors are fixed.`
        });
      }
    } catch (err) {
      console.error('Validation error:', err);
      const status = err.response?.status;
      let msg = 'Error occurred during validation.';
      if (status === 404) {
        msg = 'API Route Not Loaded (HTTP 404): The running backend server does not have the new validation route in memory. Please restart your backend server (Ctrl + C then "node server.js") to activate the new route!';
      } else if (err.response?.data?.error) {
        msg = `Server Error (${status || '500'}): ${err.response.data.error}`;
      } else if (err.response?.data?.message) {
        msg = `Server Error (${status || '500'}): ${err.response.data.message}`;
      } else if (err.message) {
        msg = `Connection Error: ${err.message}`;
      }
      setImportFeedback({ type: 'error', message: msg });
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmImportDispatches = async () => {
    if (!validationResult || !validationResult.isAllValid) return;

    try {
      setIsImporting(true);
      setImportFeedback(null);

      const res = await axios.post(`${API_BASE}/dispatch/import/confirm`, {
        rows: validationResult.rows,
        mode: importMode,
        importedFileName: uploadedFileName
      });

      setSnackbar({
        open: true,
        message: res.data.message || `Successfully dispatched ${res.data.totalDispatched} serial numbers!`,
        severity: 'success'
      });
      setImportModalOpen(false);
      setRawExcelRows([]);
      setValidationResult(null);
      fetchDispatches(true);
    } catch (err) {
      console.error('Bulk Import Error:', err);
      const status = err.response?.status;
      let msg = 'Failed to complete dispatch import.';
      if (status === 404) {
        msg = 'API Route Not Loaded (HTTP 404): Backend server needs to be restarted to activate the import confirmation route. Please restart "node server.js".';
      } else if (err.response?.data?.error) {
        msg = `Import Error (${status || '500'}): ${err.response.data.error}`;
      } else if (err.response?.data?.message) {
        msg = `Import Error (${status || '500'}): ${err.response.data.message}`;
      } else if (err.message) {
        msg = `Connection Error: ${err.message}`;
      }
      setImportFeedback({ type: 'error', message: msg });
    } finally {
      setIsImporting(false);
    }
  };

  // Snackbar notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch Dispatches from backend
  const fetchDispatches = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await axios.get(`${API_BASE}/dispatch`);
      const data = Array.isArray(response.data) ? response.data : [];
      // Default sort newest first
      const sorted = data.slice().sort((a, b) => new Date(b.dispatchDate || b.createdAt || 0) - new Date(a.dispatchDate || a.createdAt || 0));
      setDispatches(sorted);
      if (isRefresh) {
        setSnackbar({ open: true, message: `Successfully synchronized ${sorted.length} invoices!`, severity: 'success' });
      }
    } catch (error) {
      console.error('Error fetching dispatches:', error);
      setSnackbar({ open: true, message: 'Failed to load invoices from server.', severity: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem('last_active_drawer_tab', 'invoices');
    } catch {}
    fetchDispatches();
  }, [fetchDispatches]);

  // Unique customers and sales persons for dropdown filters
  const uniqueCustomers = useMemo(() => {
    const set = new Set();
    dispatches.forEach((d) => {
      if (d.customerName && d.customerName.trim()) set.add(d.customerName.trim());
    });
    return Array.from(set).sort();
  }, [dispatches]);

  const uniqueSalesPersons = useMemo(() => {
    const set = new Set();
    dispatches.forEach((d) => {
      const sp = d.salePerson || d.salesPerson;
      if (sp && sp.trim()) set.add(sp.trim());
    });
    return Array.from(set).sort();
  }, [dispatches]);

  // Filter and sort dispatches
  const filteredDispatches = useMemo(() => {
    let result = [...dispatches];

    // Search query filter (matches Invoice #, Customer, Model, SalesPerson, Barcodes)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((d) => {
        const invNo = (d.invoiceNumber || '').toLowerCase();
        const cust = (d.customerName || '').toLowerCase();
        const model = (d.modelNo || d.productName || '').toLowerCase();
        const sp = (d.salePerson || d.salesPerson || '').toLowerCase();
        const barcodes = Array.isArray(d.barcodes) ? d.barcodes.join(' ').toLowerCase() : '';
        const phone = (d.phoneNumber || '').toLowerCase();
        return (
          invNo.includes(q) ||
          cust.includes(q) ||
          model.includes(q) ||
          sp.includes(q) ||
          barcodes.includes(q) ||
          phone.includes(q)
        );
      });
    }

    // Customer filter
    if (selectedCustomer !== 'ALL') {
      result = result.filter((d) => (d.customerName || '').trim() === selectedCustomer);
    }

    // Sales Person filter
    if (selectedSalesPerson !== 'ALL') {
      result = result.filter((d) => (d.salePerson || d.salesPerson || '').trim() === selectedSalesPerson);
    }

    // Date preset filter
    if (dateRangeFilter !== 'ALL') {
      const now = new Date();
      result = result.filter((d) => {
        const itemDate = new Date(d.dispatchDate || d.createdAt || 0);
        if (isNaN(itemDate.getTime())) return false;

        if (dateRangeFilter === 'TODAY') {
          return itemDate.toDateString() === now.toDateString();
        }
        if (dateRangeFilter === 'LAST_7_DAYS') {
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return itemDate >= sevenDaysAgo;
        }
        if (dateRangeFilter === 'THIS_MONTH') {
          return (
            itemDate.getMonth() === now.getMonth() &&
            itemDate.getFullYear() === now.getFullYear()
          );
        }
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.dispatchDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.dispatchDate || b.createdAt || 0).getTime();
      const priceA = Number(a.price || 0) * Number(a.quantity || 1);
      const priceB = Number(b.price || 0) * Number(b.quantity || 1);
      const qtyA = Number(a.quantity || 0);
      const qtyB = Number(b.quantity || 0);

      switch (sortBy) {
        case 'NEWEST':
          return dateB - dateA;
        case 'OLDEST':
          return dateA - dateB;
        case 'PRICE_HIGH':
          return priceB - priceA;
        case 'PRICE_LOW':
          return priceA - priceB;
        case 'QTY_HIGH':
          return qtyB - qtyA;
        default:
          return dateB - dateA;
      }
    });

    return result;
  }, [dispatches, searchTerm, selectedCustomer, selectedSalesPerson, dateRangeFilter, sortBy]);

  // KPI Metrics Calculation
  const kpis = useMemo(() => {
    const totalInvoices = dispatches.length;
    let totalValue = 0;
    let totalUnits = 0;
    const customerSet = new Set();

    dispatches.forEach((d) => {
      const qty = Number(d.quantity || 0);
      const p = Number(d.price || 0);
      totalUnits += qty;
      totalValue += p * (qty > 0 ? qty : 1);
      if (d.customerName && d.customerName.trim()) {
        customerSet.add(d.customerName.trim());
      }
    });

    return {
      totalInvoices,
      totalValue,
      totalUnits,
      uniqueCustomers: customerSet.size,
    };
  }, [dispatches]);

  // Actions
  const handleView = (id) => {
    navigate(`/invoicedetails/${id}`);
  };

  const handleCopyText = (text, label = 'Copied') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: `${label} to clipboard!`, severity: 'success' });
  };

  const handleDeletePrompt = (id) => {
    setSelectedDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDeleteId) return;
    try {
      await axios.delete(`${API_BASE}/dispatch/${selectedDeleteId}`);
      setDispatches((prev) => prev.filter((d) => d._id !== selectedDeleteId));
      setSnackbar({ open: true, message: 'Invoice dispatch record deleted successfully.', severity: 'success' });
    } catch (error) {
      console.error('Error deleting dispatch:', error);
      setSnackbar({ open: true, message: 'Failed to delete invoice record.', severity: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedDeleteId(null);
    }
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (filteredDispatches.length === 0) {
      setSnackbar({ open: true, message: 'No invoice data to export.', severity: 'warning' });
      return;
    }

    const exportRows = filteredDispatches.map((d, index) => ({
      'S.No': index + 1,
      'Invoice No': d.invoiceNumber || 'N/A',
      'Customer Name': d.customerName || 'N/A',
      'Customer Phone': d.phoneNumber || '',
      'Customer Email': d.mailId || '',
      'Customer Address': d.customerAddress || '',
      'Model / Product': d.modelNo || d.productName || 'N/A',
      'Unit Price': Number(d.price || 0),
      'Quantity': Number(d.quantity || 1),
      'Total Value': Number(d.price || 0) * Number(d.quantity || 1),
      'Sales Person': d.salePerson || d.salesPerson || 'N/A',
      'Dispatch Date': formatDate(d.dispatchDate),
      'Status': d.status || 'Dispatched',
      'Barcodes': Array.isArray(d.barcodes) ? d.barcodes.join(', ') : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Invoices_Export_${timestamp}.xlsx`);

    setSnackbar({ open: true, message: `Exported ${exportRows.length} invoice records to Excel!`, severity: 'success' });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCustomer('ALL');
    setSelectedSalesPerson('ALL');
    setDateRangeFilter('ALL');
    setSortBy('NEWEST');
    setPage(0);
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 1. Header Banner & Page Title */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          mb: 3.5,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)',
                color: '#ffffff',
              }}
            >
              <ReceiptLongIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: '#0f172a',
                    fontSize: { xs: '1.5rem', sm: '1.75rem' },
                    letterSpacing: '-0.02em',
                  }}
                >
                  Invoices & Dispatches
                </Typography>
                <Chip
                  label="Verified Stock"
                  size="small"
                  sx={{
                    bgcolor: '#ecfdf5',
                    color: '#059669',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    border: '1px solid #a7f3d0',
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.88rem' }}>
                Track stock dispatch invoices, customer billings, barcodes, and delivery history
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Global Header Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
          <Tooltip title="Refresh live database records">
            <IconButton
              onClick={() => fetchDispatches(true)}
              disabled={refreshing}
              sx={{
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#475569',
                borderRadius: '10px',
                p: 1.1,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                '&:hover': { bgcolor: '#f1f5f9', color: '#1e293b' },
              }}
            >
              <RefreshIcon sx={{ fontSize: 20, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>

          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportExcel}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#0f766e',
              borderColor: '#99f6e4',
              bgcolor: '#f0fdfa',
              px: 2,
              py: 0.9,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              '&:hover': { bgcolor: '#ccfbf1', borderColor: '#5eead4' },
            }}
          >
            Export Excel
          </Button>

          <Button
            variant="contained"
            startIcon={<FileUploadIcon />}
            onClick={() => {
              setImportFeedback(null);
              setImportModalOpen(true);
            }}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#ffffff',
              bgcolor: '#0284c7',
              px: 2,
              py: 0.9,
              boxShadow: '0 2px 8px rgba(2,132,199,0.25)',
              '&:hover': { bgcolor: '#0369a1' },
            }}
          >
            Import Excel
          </Button>

          <Box
            sx={{
              display: 'flex',
              bgcolor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              p: 0.4,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <Tooltip title="Table View">
              <IconButton
                size="small"
                onClick={() => setViewMode('table')}
                sx={{
                  borderRadius: '8px',
                  bgcolor: viewMode === 'table' ? '#0f172a' : 'transparent',
                  color: viewMode === 'table' ? '#ffffff' : '#64748b',
                  '&:hover': { bgcolor: viewMode === 'table' ? '#1e293b' : '#f1f5f9' },
                }}
              >
                <ViewListIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Grid Cards View">
              <IconButton
                size="small"
                onClick={() => setViewMode('grid')}
                sx={{
                  borderRadius: '8px',
                  bgcolor: viewMode === 'grid' ? '#0f172a' : 'transparent',
                  color: viewMode === 'grid' ? '#ffffff' : '#64748b',
                  '&:hover': { bgcolor: viewMode === 'grid' ? '#1e293b' : '#f1f5f9' },
                }}
              >
                <ViewModuleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* 2. KPI Summary Cards - 100% Full Width */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 2.5,
          width: '100%',
          mb: 3.5,
          boxSizing: 'border-box',
        }}
      >
        {/* Total Invoices */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '16px',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0, 0, 0, 0.06)' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Invoices
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.4 }}>
                {loading ? <Skeleton width={60} /> : kpis.totalInvoices}
              </Typography>
              <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4 }}>
                <TrendingUpIcon sx={{ fontSize: 14 }} /> Active stock records
              </Typography>
            </Box>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '12px',
                bgcolor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ReceiptLongIcon />
            </Box>
          </Box>
        </Paper>

        {/* Total Dispatched Value */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '16px',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0, 0, 0, 0.06)' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Billing Value
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.4 }}>
                {loading ? <Skeleton width={100} /> : formatINR(kpis.totalValue)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4 }}>
                <CheckCircleIcon sx={{ fontSize: 14 }} /> Verified dispatched total
              </Typography>
            </Box>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '12px',
                bgcolor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CurrencyRupeeIcon sx={{ fontSize: 24 }} />
            </Box>
          </Box>
        </Paper>

        {/* Total Units Dispatched */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '16px',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0, 0, 0, 0.06)' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Units Dispatched
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.4 }}>
                {loading ? <Skeleton width={60} /> : `${kpis.totalUnits.toLocaleString()} Nos`}
              </Typography>
              <Typography variant="caption" sx={{ color: '#7c3aed', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4 }}>
                <LocalShippingIcon sx={{ fontSize: 14 }} /> Outward items fulfilled
              </Typography>
            </Box>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '12px',
                bgcolor: '#f5f3ff',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <LocalShippingIcon />
            </Box>
          </Box>
        </Paper>

        {/* Active Customers */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '16px',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0, 0, 0, 0.06)' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Unique Customers
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.4 }}>
                {loading ? <Skeleton width={60} /> : kpis.uniqueCustomers}
              </Typography>
              <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4 }}>
                <StorefrontIcon sx={{ fontSize: 14 }} /> Distinct recipient accounts
              </Typography>
            </Box>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '12px',
                bgcolor: '#fffbeb',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <StorefrontIcon />
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* 3. Smart Filter & Search Bar - 100% Full Width */}
      <Paper
        elevation={0}
        sx={{
          p: 2.2,
          mb: 3,
          borderRadius: '16px',
          bgcolor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: '2fr 1.5fr 1.2fr 1fr 1fr',
            },
            gap: 1.5,
            alignItems: 'center',
            width: '100%',
          }}
        >
          {/* Universal Search Input */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search by invoice #, customer, model, barcode..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <ClearIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                bgcolor: '#f8fafc',
                fontSize: '0.88rem',
              },
            }}
          />

          {/* Customer Filter */}
          <FormControl fullWidth size="small">
            <InputLabel id="customer-filter-label" sx={{ fontSize: '0.85rem' }}>Customer</InputLabel>
            <Select
              labelId="customer-filter-label"
              value={selectedCustomer}
              label="Customer"
              onChange={(e) => {
                setSelectedCustomer(e.target.value);
                setPage(0);
              }}
              sx={{ borderRadius: '10px', bgcolor: '#f8fafc', fontSize: '0.85rem' }}
            >
              <MenuItem value="ALL">All Customers ({dispatches.length})</MenuItem>
              {uniqueCustomers.map((c) => (
                <MenuItem key={c} value={c} sx={{ fontSize: '0.85rem' }}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Sales Person Filter */}
          <FormControl fullWidth size="small">
            <InputLabel id="sp-filter-label" sx={{ fontSize: '0.85rem' }}>Sales Person</InputLabel>
            <Select
              labelId="sp-filter-label"
              value={selectedSalesPerson}
              label="Sales Person"
              onChange={(e) => {
                setSelectedSalesPerson(e.target.value);
                setPage(0);
              }}
              sx={{ borderRadius: '10px', bgcolor: '#f8fafc', fontSize: '0.85rem' }}
            >
              <MenuItem value="ALL">All Sales Persons</MenuItem>
              {uniqueSalesPersons.map((sp) => (
                <MenuItem key={sp} value={sp} sx={{ fontSize: '0.85rem' }}>
                  {sp}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date Filter */}
          <FormControl fullWidth size="small">
            <InputLabel id="date-filter-label" sx={{ fontSize: '0.85rem' }}>Date Range</InputLabel>
            <Select
              labelId="date-filter-label"
              value={dateRangeFilter}
              label="Date Range"
              onChange={(e) => {
                setDateRangeFilter(e.target.value);
                setPage(0);
              }}
              sx={{ borderRadius: '10px', bgcolor: '#f8fafc', fontSize: '0.85rem' }}
            >
              <MenuItem value="ALL">All Time</MenuItem>
              <MenuItem value="TODAY">Today Only</MenuItem>
              <MenuItem value="LAST_7_DAYS">Last 7 Days</MenuItem>
              <MenuItem value="THIS_MONTH">This Month</MenuItem>
            </Select>
          </FormControl>

          {/* Sort By */}
          <FormControl fullWidth size="small">
            <InputLabel id="sort-filter-label" sx={{ fontSize: '0.85rem' }}>Sort By</InputLabel>
            <Select
              labelId="sort-filter-label"
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
              sx={{ borderRadius: '10px', bgcolor: '#f8fafc', fontSize: '0.85rem' }}
            >
              <MenuItem value="NEWEST">Newest First</MenuItem>
              <MenuItem value="OLDEST">Oldest First</MenuItem>
              <MenuItem value="PRICE_HIGH">Value: High to Low</MenuItem>
              <MenuItem value="PRICE_LOW">Value: Low to High</MenuItem>
              <MenuItem value="QTY_HIGH">Quantity: High</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Active Filter Indicators */}
        {(searchTerm || selectedCustomer !== 'ALL' || selectedSalesPerson !== 'ALL' || dateRangeFilter !== 'ALL') && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              Active Filters:
            </Typography>
            {searchTerm && (
              <Chip
                size="small"
                label={`Keyword: "${searchTerm}"`}
                onDelete={() => setSearchTerm('')}
                sx={{ bgcolor: '#f1f5f9', fontSize: '0.75rem', fontWeight: 600 }}
              />
            )}
            {selectedCustomer !== 'ALL' && (
              <Chip
                size="small"
                label={`Customer: ${selectedCustomer}`}
                onDelete={() => setSelectedCustomer('ALL')}
                sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: 600 }}
              />
            )}
            {selectedSalesPerson !== 'ALL' && (
              <Chip
                size="small"
                label={`Sales: ${selectedSalesPerson}`}
                onDelete={() => setSelectedSalesPerson('ALL')}
                sx={{ bgcolor: '#f5f3ff', color: '#6d28d9', fontSize: '0.75rem', fontWeight: 600 }}
              />
            )}
            {dateRangeFilter !== 'ALL' && (
              <Chip
                size="small"
                label={`Date: ${dateRangeFilter.replace(/_/g, ' ')}`}
                onDelete={() => setDateRangeFilter('ALL')}
                sx={{ bgcolor: '#fffbeb', color: '#b45309', fontSize: '0.75rem', fontWeight: 600 }}
              />
            )}
            <Button
              size="small"
              onClick={handleResetFilters}
              sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}
            >
              Clear All
            </Button>
            <Typography variant="caption" sx={{ color: '#94a3b8', ml: 'auto' }}>
              Showing {filteredDispatches.length} of {dispatches.length} invoices
            </Typography>
          </Box>
        )}
      </Paper>

      {/* 4. Table or Grid Content */}
      {viewMode === 'table' ? (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
            overflow: 'hidden',
          }}
        >
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem', py: 1.8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Invoice No
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem', py: 1.8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Customer Details
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem', py: 1.8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Product / Model
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem', py: 1.8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Value & Qty
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem', py: 1.8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Sales Person
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem', py: 1.8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Scanned Barcodes
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem', py: 1.8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Dispatch Date
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem', py: 1.8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: rowsPerPage }).map((_, idx) => (
                  <TableRow key={`skeleton-${idx}`}>
                    <TableCell><Skeleton variant="rectangular" height={24} width={80} sx={{ borderRadius: '6px' }} /></TableCell>
                    <TableCell><Skeleton height={20} width={140} /><Skeleton height={14} width={90} /></TableCell>
                    <TableCell><Skeleton height={20} width={100} /></TableCell>
                    <TableCell><Skeleton height={20} width={80} /><Skeleton height={14} width={50} /></TableCell>
                    <TableCell><Skeleton height={20} width={80} /></TableCell>
                    <TableCell><Skeleton height={24} width={160} sx={{ borderRadius: '6px' }} /></TableCell>
                    <TableCell><Skeleton height={20} width={90} /></TableCell>
                    <TableCell><Skeleton height={32} width={70} sx={{ mx: 'auto', borderRadius: '8px' }} /></TableCell>
                  </TableRow>
                ))
              ) : filteredDispatches.length > 0 ? (
                filteredDispatches
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((dispatch) => {
                    const totalAmount = Number(dispatch.price || 0) * Number(dispatch.quantity || 1);
                    const barcodes = Array.isArray(dispatch.barcodes) ? dispatch.barcodes : [];

                    return (
                      <TableRow
                        key={dispatch._id}
                        hover
                        sx={{
                          transition: 'background-color 0.15s ease',
                          '&:hover': { bgcolor: '#f8fafc' },
                          '& td': { py: 1.6 },
                        }}
                      >
                        {/* Invoice Number */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <Chip
                              label={dispatch.invoiceNumber || 'INV-N/A'}
                              size="small"
                              onClick={() => handleCopyText(dispatch.invoiceNumber, 'Invoice number copied')}
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                bgcolor: '#eff6ff',
                                color: '#1e40af',
                                border: '1px solid #bfdbfe',
                                cursor: 'pointer',
                                '&:hover': { bgcolor: '#dbeafe' },
                              }}
                            />
                            <Tooltip title="Copy invoice number">
                              <IconButton
                                size="small"
                                onClick={() => handleCopyText(dispatch.invoiceNumber, 'Invoice number copied')}
                                sx={{ p: 0.3, color: '#94a3b8', '&:hover': { color: '#1e40af' } }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 13 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>

                        {/* Customer Name & Location */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: '#f1f5f9',
                                color: '#334155',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                border: '1px solid #e2e8f0',
                              }}
                            >
                              {(dispatch.customerName || 'C')[0].toUpperCase()}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="subtitle2"
                                noWrap
                                sx={{
                                  fontWeight: 700,
                                  color: '#0f172a',
                                  fontSize: '0.86rem',
                                  maxWidth: 220,
                                }}
                              >
                                {dispatch.customerName || 'Unknown Customer'}
                              </Typography>
                              {(dispatch.customerAddress || dispatch.phoneNumber) && (
                                <Typography variant="caption" noWrap sx={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>
                                  {dispatch.customerAddress ? `${dispatch.customerAddress} • ` : ''}
                                  {dispatch.phoneNumber || ''}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Product / Model */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.84rem' }}>
                            {dispatch.modelNo || dispatch.productName || 'General Stock'}
                          </Typography>
                          <Chip
                            label="Stock Outward"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              bgcolor: '#f8fafc',
                              color: '#64748b',
                              border: '1px solid #e2e8f0',
                              mt: 0.3,
                            }}
                          />
                        </TableCell>

                        {/* Price & Quantity */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                            {formatINR(totalAmount)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>
                            {dispatch.quantity} {dispatch.quantity > 1 ? 'units' : 'unit'} @ {formatINR(dispatch.price)}
                          </Typography>
                        </TableCell>

                        {/* Sales Person */}
                        <TableCell>
                          <Chip
                            icon={<PersonIcon style={{ fontSize: 13, color: '#475569' }} />}
                            label={dispatch.salePerson || dispatch.salesPerson || 'Admin'}
                            size="small"
                            sx={{
                              bgcolor: '#f8fafc',
                              color: '#334155',
                              border: '1px solid #e2e8f0',
                              fontWeight: 600,
                              fontSize: '0.74rem',
                            }}
                          />
                        </TableCell>

                        {/* Scanned Barcodes */}
                        <TableCell>
                          {barcodes.length > 0 ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', maxWidth: 260 }}>
                              <Chip
                                icon={<QrCodeIcon style={{ fontSize: 13, color: '#0369a1' }} />}
                                label={barcodes[0]}
                                size="small"
                                onClick={() => handleCopyText(barcodes[0], 'Barcode copied')}
                                sx={{
                                  bgcolor: '#f0f9ff',
                                  color: '#0369a1',
                                  border: '1px solid #bae6fd',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  maxWidth: 160,
                                }}
                              />
                              {barcodes.length > 1 && (
                                <Tooltip
                                  title={
                                    <Box sx={{ p: 0.5 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                                        All Barcodes ({barcodes.length}):
                                      </Typography>
                                      {barcodes.map((b, i) => (
                                        <Typography key={i} variant="caption" sx={{ display: 'block', fontFamily: 'monospace' }}>
                                          • {b}
                                        </Typography>
                                      ))}
                                    </Box>
                                  }
                                >
                                  <Chip
                                    label={`+${barcodes.length - 1} more`}
                                    size="small"
                                    onClick={() => setPreviewItem(dispatch)}
                                    sx={{
                                      bgcolor: '#f1f5f9',
                                      color: '#475569',
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          ) : (
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                              No barcodes
                            </Typography>
                          )}
                        </TableCell>

                        {/* Dispatch Date */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                            <CalendarIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                            <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                              {formatDate(dispatch.dispatchDate)}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <Tooltip title="View Complete Tax Invoice Details">
                              <IconButton
                                size="small"
                                onClick={() => handleView(dispatch._id)}
                                sx={{
                                  color: '#ffffff',
                                  bgcolor: '#1e3a8a',
                                  p: 0.6,
                                  borderRadius: '8px',
                                  boxShadow: '0 2px 6px rgba(30, 58, 138, 0.2)',
                                  '&:hover': { bgcolor: '#1e40af' },
                                }}
                              >
                                <DescriptionIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Quick Summary">
                              <IconButton
                                size="small"
                                onClick={() => setPreviewItem(dispatch)}
                                sx={{
                                  color: '#0284c7',
                                  bgcolor: '#f0f9ff',
                                  border: '1px solid #e0f2fe',
                                  p: 0.6,
                                  borderRadius: '8px',
                                  '&:hover': { bgcolor: '#e0f2fe' },
                                }}
                              >
                                <VisibilityIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete Invoice Record">
                              <IconButton
                                size="small"
                                onClick={() => handleDeletePrompt(dispatch._id)}
                                sx={{
                                  color: '#ef4444',
                                  bgcolor: '#fef2f2',
                                  border: '1px solid #fee2e2',
                                  p: 0.6,
                                  borderRadius: '8px',
                                  '&:hover': { bgcolor: '#fee2e2' },
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          bgcolor: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 1.5,
                        }}
                      >
                        <ReceiptLongIcon sx={{ fontSize: 28, color: '#94a3b8' }} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
                        No invoice records found
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 360, mt: 0.5, mb: 2 }}>
                        No dispatches match your search filters. Try adjusting your query or resetting filters.
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleResetFilters}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
                      >
                        Reset All Filters
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Table Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            component="div"
            count={filteredDispatches.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{
              borderTop: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              '.MuiTablePagination-toolbar': { minHeight: 52 },
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                fontSize: '0.82rem',
                color: '#64748b',
                fontWeight: 500,
              },
            }}
          />
        </TableContainer>
      ) : (
        /* Grid Cards View */
        <Box>
          <Grid container spacing={2.5}>
            {loading ? (
              Array.from({ length: rowsPerPage }).map((_, idx) => (
                <Grid item xs={12} sm={6} md={4} key={`skeleton-card-${idx}`}>
                  <Paper sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <Skeleton height={28} width="60%" />
                    <Skeleton height={20} width="80%" sx={{ my: 1 }} />
                    <Skeleton height={40} width="100%" sx={{ my: 1 }} />
                    <Skeleton height={36} width="100%" sx={{ borderRadius: '8px' }} />
                  </Paper>
                </Grid>
              ))
            ) : filteredDispatches.length > 0 ? (
              filteredDispatches
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((dispatch) => {
                  const totalAmount = Number(dispatch.price || 0) * Number(dispatch.quantity || 1);
                  const barcodes = Array.isArray(dispatch.barcodes) ? dispatch.barcodes : [];

                  return (
                    <Grid item xs={12} sm={6} md={4} key={dispatch._id}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: '16px',
                          bgcolor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                            borderColor: '#cbd5e1',
                          },
                        }}
                      >
                        {/* Card Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Chip
                            label={dispatch.invoiceNumber || 'INV-N/A'}
                            size="small"
                            onClick={() => handleCopyText(dispatch.invoiceNumber, 'Invoice number copied')}
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              bgcolor: '#eff6ff',
                              color: '#1e40af',
                              border: '1px solid #bfdbfe',
                              cursor: 'pointer',
                            }}
                          />
                          <Chip
                            label="Dispatched"
                            size="small"
                            icon={<CheckCircleIcon style={{ fontSize: 13, color: '#059669' }} />}
                            sx={{
                              height: 22,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              bgcolor: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
                            }}
                          />
                        </Box>

                        {/* Customer Info */}
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', mb: 0.3 }}>
                          {dispatch.customerName || 'Unknown Customer'}
                        </Typography>
                        {dispatch.customerAddress && (
                          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.74rem', display: 'block', mb: 1 }}>
                            📍 {dispatch.customerAddress}
                          </Typography>
                        )}

                        <Divider sx={{ my: 1.2, borderColor: '#f1f5f9' }} />

                        {/* Item Details */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                            Product Model:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                            {dispatch.modelNo || dispatch.productName || 'General Stock'}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                            Quantity:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                            {dispatch.quantity} units
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                            Total Invoice Value:
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                            {formatINR(totalAmount)}
                          </Typography>
                        </Box>

                        {/* Barcodes Summary */}
                        {barcodes.length > 0 && (
                          <Box sx={{ mt: 1, mb: 1.5, p: 1, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 0.5 }}>
                              Scanned Barcodes ({barcodes.length}):
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              <Chip
                                label={barcodes[0]}
                                size="small"
                                sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#ffffff', border: '1px solid #e2e8f0' }}
                              />
                              {barcodes.length > 1 && (
                                <Chip
                                  label={`+${barcodes.length - 1} more`}
                                  size="small"
                                  onClick={() => setPreviewItem(dispatch)}
                                  sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#e2e8f0', cursor: 'pointer' }}
                                />
                              )}
                            </Box>
                          </Box>
                        )}

                        <Box sx={{ mt: 'auto', pt: 1.5, display: 'flex', gap: 1 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            startIcon={<DescriptionIcon />}
                            onClick={() => handleView(dispatch._id)}
                            sx={{
                              borderRadius: '8px',
                              textTransform: 'none',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              bgcolor: '#1e3a8a',
                              '&:hover': { bgcolor: '#1e40af' },
                            }}
                          >
                            Tax Invoice
                          </Button>
                          <IconButton
                            size="small"
                            onClick={() => setPreviewItem(dispatch)}
                            sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', p: 0.8 }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeletePrompt(dispatch._id)}
                            sx={{ border: '1px solid #fee2e2', color: '#ef4444', borderRadius: '8px', p: 0.8 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })
            ) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '16px' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    No invoice records found matching your filters.
                  </Typography>
                  <Button variant="outlined" size="small" onClick={handleResetFilters} sx={{ mt: 1.5 }}>
                    Reset Filters
                  </Button>
                </Paper>
              </Grid>
            )}
          </Grid>

          {/* Grid View Pagination */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <TablePagination
              rowsPerPageOptions={[6, 12, 24, 48]}
              component="div"
              count={filteredDispatches.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              sx={{ bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
            />
          </Box>
        </Box>
      )}

      {/* 5. Quick Preview Modal */}
      <Dialog
        open={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '20px', p: 1 },
        }}
      >
        {previewItem && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: '#eff6ff',
                    color: '#1d4ed8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ReceiptLongIcon />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                    Invoice {previewItem.invoiceNumber}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Dispatched on {formatDate(previewItem.dispatchDate)}
                  </Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setPreviewItem(null)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ borderColor: '#f1f5f9' }}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Customer Name</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{previewItem.customerName || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Sales Person</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{previewItem.salePerson || previewItem.salesPerson || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Product / Model</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{previewItem.modelNo || previewItem.productName || 'General Stock'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Billing Value</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
                    {formatINR(Number(previewItem.price || 0) * Number(previewItem.quantity || 1))}
                  </Typography>
                </Grid>
              </Grid>

              {/* Scanned Barcodes List */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <QrCodeIcon sx={{ fontSize: 18 }} /> Scanned Serial Numbers & Barcodes ({Array.isArray(previewItem.barcodes) ? previewItem.barcodes.length : 0})
                </Typography>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    maxHeight: 180,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.8,
                  }}
                >
                  {Array.isArray(previewItem.barcodes) && previewItem.barcodes.length > 0 ? (
                    previewItem.barcodes.map((code, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          px: 1.2,
                          py: 0.6,
                          bgcolor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #f1f5f9',
                        }}
                      >
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#1e293b' }}>
                          #{idx + 1}: {code}
                        </Typography>
                        <Tooltip title="Copy code">
                          <IconButton size="small" onClick={() => handleCopyText(code, 'Barcode copied')} sx={{ p: 0.2 }}>
                            <ContentCopyIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', py: 1 }}>
                      No serial barcodes recorded for this dispatch.
                    </Typography>
                  )}
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 1.5 }}>
              <Button onClick={() => setPreviewItem(null)} sx={{ textTransform: 'none', color: '#64748b' }}>
                Close
              </Button>
              <Button
                variant="contained"
                startIcon={<DescriptionIcon />}
                onClick={() => {
                  const id = previewItem._id;
                  setPreviewItem(null);
                  handleView(id);
                }}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 700,
                  bgcolor: '#1e3a8a',
                  '&:hover': { bgcolor: '#1e40af' },
                }}
              >
                Open Full Printable Tax Invoice
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* 6. Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#ef4444' }}>
          Delete Invoice Record?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#475569', fontSize: '0.9rem' }}>
            Are you sure you want to permanently delete this dispatch invoice record? This action will remove it from invoice reports and stock logs.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
          >
            Yes, Delete Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* 6b. Excel Bulk Import & Serial Number Validation Dialog */}
      <Dialog
        open={importModalOpen}
        onClose={() => !isImporting && setImportModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ backgroundColor: '#f8fafc', p: 2.5, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 42, height: 42, borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileUploadIcon sx={{ color: '#0284c7', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#0f172a">
                Excel Dispatch Import & Serial Number Validation
              </Typography>
              <Typography variant="caption" color="#64748b">
                Validate Model No + S/N against inventory stock before atomic dispatch
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setImportModalOpen(false)} disabled={isImporting || isValidating} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            {/* Top Row: Template Download & Import Mode Selection */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, p: 2, backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Validation Mode:
                </Typography>
                <RadioGroup
                  row
                  value={importMode}
                  onChange={(e) => {
                    setImportMode(e.target.value);
                    setValidationResult(null);
                  }}
                  sx={{ mt: 0.3 }}
                >
                  <FormControlLabel
                    value="strict"
                    control={<Radio size="small" />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={700} color="#0f172a">
                          Strict Dispatch Validation
                        </Typography>
                        <Typography variant="caption" color="#64748b" display="block">
                          Require S/N status = AVAILABLE in current stock
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="historical"
                    control={<Radio size="small" />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={700} color="#0f172a">
                          Historical Migration Backfill
                        </Typography>
                        <Typography variant="caption" color="#64748b" display="block">
                          Reconcile offline dispatches with existing stock records
                        </Typography>
                      </Box>
                    }
                    sx={{ ml: { xs: 0, sm: 2 } }}
                  />
                </RadioGroup>
              </Box>

              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={handleDownloadSampleTemplate}
                sx={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  color: '#334155',
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: '8px',
                  height: 38,
                  px: 2,
                  '&:hover': { backgroundColor: '#f1f5f9', borderColor: '#94a3b8' }
                }}
              >
                Download Sample Template
              </Button>
            </Box>

            {/* File Upload & Validate Controls */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch', flexWrap: 'wrap' }}>
              <Box
                component="label"
                sx={{
                  flex: 3,
                  minWidth: 280,
                  border: '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  p: 2.5,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: uploadedFileName ? '#f0fdf4' : '#f8fafc',
                  borderColor: uploadedFileName ? '#86efac' : '#cbd5e1',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  '&:hover': {
                    borderColor: '#0284c7',
                    backgroundColor: '#f0f9ff'
                  }
                }}
              >
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  hidden
                  onChange={handleExcelFileSelect}
                />
                <FileUploadIcon sx={{ fontSize: 32, color: uploadedFileName ? '#16a34a' : '#0284c7' }} />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" fontWeight={800} color="#0f172a">
                    {uploadedFileName ? `Selected: ${uploadedFileName}` : 'Choose Dispatch Excel File (.xlsx, .xls, .csv)'}
                  </Typography>
                  <Typography variant="caption" color="#64748b">
                    {rawExcelRows.length > 0 ? `${rawExcelRows.length} serial item(s) parsed and ready` : 'Columns: Model No, Serial Number, Customer, Date, Price, Invoice No'}
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                disabled={rawExcelRows.length === 0 || isValidating || isImporting}
                onClick={handleRunValidation}
                sx={{
                  flex: 1,
                  minWidth: 160,
                  backgroundColor: '#0f766e',
                  color: '#ffffff',
                  fontWeight: 800,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: '0.92rem',
                  boxShadow: '0 2px 8px rgba(15,118,110,0.3)',
                  '&:hover': { backgroundColor: '#115e59' },
                  '&.Mui-disabled': { backgroundColor: '#cbd5e1', color: '#94a3b8' }
                }}
              >
                {isValidating ? 'Validating...' : 'Validate Excel'}
              </Button>
            </Box>

            {/* Status Feedback Message */}
            {importFeedback && (
              <Alert severity={importFeedback.type} sx={{ borderRadius: '10px', fontWeight: 600 }}>
                {importFeedback.message}
              </Alert>
            )}

            {/* Validation Result Screen (KPI Cards + Status Banner) */}
            {validationResult && (
              <Box sx={{ pt: 1 }}>
                {/* Status Banner */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: validationResult.isAllValid ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${validationResult.isAllValid ? '#86efac' : '#fecaca'}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ fontSize: 24 }}>
                      {validationResult.isAllValid ? '✓' : '❌'}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={800} color={validationResult.isAllValid ? '#15803d' : '#b91c1c'}>
                        Status: {validationResult.isAllValid ? 'READY TO IMPORT' : 'UPLOAD BLOCKED'}
                      </Typography>
                      <Typography variant="caption" color={validationResult.isAllValid ? '#166534' : '#991b1b'}>
                        {validationResult.isAllValid
                          ? 'All rows matched inventory stock. You can now commit this dispatch.'
                          : 'Nothing will be removed from stock if even one row fails validation. Resolve the errors below to proceed.'}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={validationResult.isAllValid ? '100% Passed' : `${validationResult.invalidCount + validationResult.duplicateCount} Error(s)`}
                    color={validationResult.isAllValid ? 'success' : 'error'}
                    sx={{ fontWeight: 800, px: 1 }}
                  />
                </Paper>

                {/* 4 KPI Summary Cards */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '10px', textAlign: 'center', borderColor: '#e2e8f0' }}>
                    <Typography variant="caption" color="#64748b" fontWeight={700}>TOTAL ROWS</Typography>
                    <Typography variant="h5" fontWeight={800} color="#0f172a">{validationResult.totalRows}</Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '10px', textAlign: 'center', borderColor: '#bbf7d0', bgcolor: '#f0fdf4' }}>
                    <Typography variant="caption" color="#16a34a" fontWeight={700}>VALID S/N</Typography>
                    <Typography variant="h5" fontWeight={800} color="#16a34a">{validationResult.validCount} ✓</Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '10px', textAlign: 'center', borderColor: validationResult.invalidCount > 0 ? '#fecaca' : '#e2e8f0', bgcolor: validationResult.invalidCount > 0 ? '#fef2f2' : '#ffffff' }}>
                    <Typography variant="caption" color={validationResult.invalidCount > 0 ? '#ef4444' : '#64748b'} fontWeight={700}>INVALID S/N</Typography>
                    <Typography variant="h5" fontWeight={800} color={validationResult.invalidCount > 0 ? '#ef4444' : '#0f172a'}>{validationResult.invalidCount}</Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '10px', textAlign: 'center', borderColor: validationResult.duplicateCount > 0 ? '#fed7aa' : '#e2e8f0', bgcolor: validationResult.duplicateCount > 0 ? '#fff7ed' : '#ffffff' }}>
                    <Typography variant="caption" color={validationResult.duplicateCount > 0 ? '#ea580c' : '#64748b'} fontWeight={700}>DUPLICATE S/N</Typography>
                    <Typography variant="h5" fontWeight={800} color={validationResult.duplicateCount > 0 ? '#ea580c' : '#0f172a'}>{validationResult.duplicateCount}</Typography>
                  </Paper>
                </Box>

                {/* Detailed Validation Results Table */}
                <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ mb: 1 }}>
                  Row-by-Row Verification Results:
                </Typography>

                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320, borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ '& th': { backgroundColor: '#f1f5f9', fontWeight: 800, fontSize: '12px' } }}>
                        <TableCell>Excel Row</TableCell>
                        <TableCell>Invoice No</TableCell>
                        <TableCell>Model No</TableCell>
                        <TableCell>Serial Number (S/N)</TableCell>
                        <TableCell>Recipient</TableCell>
                        <TableCell align="center">Result</TableCell>
                        <TableCell>Validation Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {validationResult.rows.map((row) => (
                        <TableRow
                          key={row.rowNumber}
                          hover
                          sx={{
                            backgroundColor: row.isValid ? '#ffffff' : '#fef2f2',
                            '& td': { fontSize: '12px' }
                          }}
                        >
                          <TableCell sx={{ fontWeight: 700 }}>Row {row.rowNumber}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#0284c7' }}>{row.invoiceNumber}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{row.modelNo}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{row.serialNumber || '—'}</TableCell>
                          <TableCell>{row.customerName}</TableCell>
                          <TableCell align="center">
                            {row.isValid ? (
                              <Chip label="✓" size="small" color="success" sx={{ height: 22, fontWeight: 900, minWidth: 28 }} />
                            ) : (
                              <Chip label="❌" size="small" color="error" sx={{ height: 22, fontWeight: 900, minWidth: 28 }} />
                            )}
                          </TableCell>
                          <TableCell sx={{ color: row.isValid ? '#15803d' : '#b91c1c', fontWeight: row.isValid ? 500 : 700 }}>
                            {row.reason}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {isImporting && (
              <Box sx={{ width: '100%', pt: 1 }}>
                <LinearProgress sx={{ borderRadius: 1 }} />
                <Typography variant="caption" sx={{ color: '#0284c7', display: 'block', mt: 0.5, textAlign: 'center', fontWeight: 700 }}>
                  Committing atomic dispatch and updating stock records... Please wait.
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <Divider sx={{ borderColor: '#f1f5f9' }} />

        <DialogActions sx={{ p: 2.5, backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => setImportModalOpen(false)}
            disabled={isImporting || isValidating}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, color: '#64748b', borderColor: '#cbd5e1' }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={
              !validationResult ||
              !validationResult.isAllValid ||
              validationResult.invalidCount > 0 ||
              validationResult.duplicateCount > 0 ||
              isImporting ||
              isValidating
            }
            onClick={handleConfirmImportDispatches}
            sx={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              fontWeight: 800,
              borderRadius: '8px',
              px: 3.5,
              py: 1.2,
              fontSize: '13px',
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
              '&:hover': { backgroundColor: '#15803d' },
              '&.Mui-disabled': { backgroundColor: '#cbd5e1', color: '#94a3b8', boxShadow: 'none' }
            }}
          >
            {isImporting
              ? 'Importing Dispatches...'
              : validationResult?.isAllValid
              ? `Confirm & Import Dispatch (${validationResult.totalRows} S/Ns)`
              : 'Import Dispatch (Blocked - Resolve Errors)'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 7. Snackbar Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Invoice;
