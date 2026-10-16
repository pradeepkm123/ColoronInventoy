import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  Alert,
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
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
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
} from '@mui/material';
import {
  Truck,
  Package,
  IndianRupee,
  Store,
  Search,
  Barcode,
  X,
  PackageX,
  CheckCircle2,
  Calendar,
  FileText,
  User,
  RotateCcw,
  PackageCheck,
  RefreshCw,
  Trash2,
  Copy,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useUser } from './UserContext';

const API_BASE = 'https://coloroninventoy.onrender.com/api';

const StoreDispatched = () => {
  const { user } = useUser();
  const { enqueueSnackbar } = useSnackbar();

  const [dispatches, setDispatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Date Filtering States
  const now = new Date();
  const [dateFilterMode, setDateFilterMode] = useState('all'); // 'all', 'today', 'thisMonth', 'monthYear', 'custom'
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Serial codes modal
  const [selectedSerials, setSelectedSerials] = useState(null);

  // Store Inward Scan Modal States
  const [inwardDialogItem, setInwardDialogItem] = useState(null);
  const [scannedSerials, setScannedSerials] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanFeedback, setScanFeedback] = useState(null);

  const [receivingId, setReceivingId] = useState(null);

  // Bulk Excel Import States
  const [openImportModal, setOpenImportModal] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState(null);

  const handleDownloadExcelTemplate = () => {
    const templateData = [
      {
        'Invoice Number': 'INV-2026-001',
        'Model No': 'CL-4MP-DOME',
        'Quantity': 2,
        'Price': 2450,
        'Sales Person': 'John Doe',
        'Barcodes': 'SN10001, SN10002',
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
        'Quantity': 1,
        'Price': 1850,
        'Sales Person': 'Sarah Smith',
        'Barcodes': 'SN20005',
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
      { wch: 10 },
      { wch: 10 },
      { wch: 16 },
      { wch: 26 },
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
    XLSX.writeFile(wb, 'Dispatch_Bulk_Import_Template.xlsx');
    enqueueSnackbar('Downloaded Dispatch Excel Template!', { variant: 'info' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportFeedback(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setImportFeedback({ type: 'warning', message: 'The uploaded file contains no data rows!' });
          setParsedData([]);
          return;
        }

        const formatted = rawJson.map((row, idx) => {
          const invoiceNumber = row['Invoice Number'] || row['InvoiceNo'] || row['invoiceNumber'] || row['Invoice'] || '';
          const modelNo = row['Model No'] || row['Model'] || row['modelNo'] || row['Product'] || '';
          const quantity = Number(row['Quantity'] || row['Qty'] || row['quantity'] || 1);
          const price = Number(row['Price'] || row['price'] || 0);
          const salePerson = row['Sales Person'] || row['Salesperson'] || row['salePerson'] || 'Excel Import';
          const rawBarcodes = row['Barcodes'] || row['Serial Numbers'] || row['barcodes'] || row['Serial'] || '';
          const barcodes = String(rawBarcodes).split(/[,;\n\r]+/).map(b => b.trim()).filter(Boolean);
          const dispatchDate = row['Dispatch Date'] || row['Date'] || row['dispatchDate'] || '';
          const customerType = row['Customer Type'] || row['Type'] || row['customerType'] || 'Store';
          const storeName = row['Store Name'] || row['storeName'] || '';
          const customerName = row['Customer Name'] || row['customerName'] || storeName;

          const isValid = Boolean(String(invoiceNumber).trim() && String(modelNo).trim());

          return {
            _rowId: idx + 1,
            invoiceNumber: String(invoiceNumber).trim(),
            modelNo: String(modelNo).trim(),
            quantity,
            price,
            salePerson: String(salePerson).trim(),
            barcodes,
            dispatchDate: dispatchDate instanceof Date ? dispatchDate.toISOString().split('T')[0] : String(dispatchDate).trim(),
            customerType: String(customerType).trim(),
            storeName: String(storeName).trim(),
            customerName: String(customerName).trim(),
            phoneNumber: String(row['Phone Number'] || row['Mobile'] || row['phoneNumber'] || '').trim(),
            customerAddress: String(row['Customer Address'] || row['Address'] || row['customerAddress'] || '').trim(),
            gstNo: String(row['GST No'] || row['gstNo'] || '').trim(),
            isValid
          };
        });

        setParsedData(formatted);
      } catch (err) {
        console.error('Error parsing Excel:', err);
        setImportFeedback({ type: 'error', message: 'Failed to read Excel file. Please check the file format.' });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleExecuteBulkImport = async () => {
    if (!parsedData || parsedData.length === 0) return;
    const validRows = parsedData.filter(r => r.isValid);
    if (validRows.length === 0) {
      setImportFeedback({ type: 'error', message: 'No valid rows found to import. Invoice Number and Model No are required!' });
      return;
    }

    try {
      setIsImporting(true);
      setImportFeedback(null);

      const payload = validRows.map(r => ({
        invoiceNumber: r.invoiceNumber,
        modelNo: r.modelNo,
        quantity: r.quantity,
        price: r.price,
        salePerson: r.salePerson,
        barcodes: r.barcodes,
        dispatchDate: r.dispatchDate,
        customerType: r.customerType,
        storeName: r.storeName,
        customerName: r.customerName,
        phoneNumber: r.phoneNumber,
        customerAddress: r.customerAddress,
        gstNo: r.gstNo
      }));

      const res = await axios.post(`${API_BASE}/dispatch/bulk-import`, { dispatches: payload });
      enqueueSnackbar(res.data.message || `Successfully imported ${res.data.importedCount} dispatches!`, { variant: 'success' });
      setOpenImportModal(false);
      setParsedData([]);
      fetchDispatchedData();
    } catch (err) {
      console.error('Bulk Import Error:', err);
      const msg = err.response?.data?.message || 'Error occurred during bulk import.';
      setImportFeedback({ type: 'error', message: msg });
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenInwardScanModal = (item) => {
    setInwardDialogItem(item);
    setScannedSerials([]);
    setBarcodeInput('');
    setScanFeedback(null);
  };

  const handleProcessBarcodeScan = (inputVal) => {
    const rawCode = (inputVal !== undefined ? inputVal : barcodeInput || '').trim();
    if (!rawCode) return false;

    if (!inwardDialogItem || !inwardDialogItem.barcodes || inwardDialogItem.barcodes.length === 0) {
      setScanFeedback({ type: 'info', message: 'No registered serial barcodes to verify for this product.' });
      setBarcodeInput('');
      return false;
    }

    const expectedBarcodes = inwardDialogItem.barcodes;
    const matched = expectedBarcodes.find(b => b.trim().toLowerCase() === rawCode.toLowerCase());

    if (!matched) {
      setScanFeedback({
        type: 'error',
        message: `Barcode "${rawCode}" does NOT match any dispatched serial barcode for ${inwardDialogItem.modelNo}!`
      });
      setBarcodeInput('');
      return false;
    }

    if (scannedSerials.some(s => s.trim().toLowerCase() === matched.trim().toLowerCase())) {
      setScanFeedback({
        type: 'warning',
        message: `Serial barcode "${matched}" has ALREADY been scanned and verified!`
      });
      setBarcodeInput('');
      return false;
    }

    setScannedSerials(prev => [...prev, matched]);
    setScanFeedback({
      type: 'success',
      message: `Serial barcode "${matched}" verified instantly!`
    });
    setBarcodeInput('');
    return true;
  };

  const handleRemoveVerifiedSerial = (codeToRemove) => {
    setScannedSerials(prev => prev.filter(c => c.trim().toLowerCase() !== codeToRemove.trim().toLowerCase()));
    setScanFeedback(null);
  };

  const handleResetSerials = () => {
    setScannedSerials([]);
    setBarcodeInput('');
    setScanFeedback(null);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    enqueueSnackbar(`Copied ${code} to clipboard`, { variant: 'info', autoHideDuration: 2000 });
  };

  const fetchDispatchedData = useCallback(async () => {
    try {
      const [dispatchRes, outwardRes, transferRes, storeInwardRes] = await Promise.all([
        axios.get(`${API_BASE}/dispatch`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/stock-outward`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/self-transfers`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/store-inward`).catch(() => ({ data: [] })),
      ]);

      const dispatchList = Array.isArray(dispatchRes.data) ? dispatchRes.data : [];
      const outwardList = Array.isArray(outwardRes.data) ? outwardRes.data : [];
      const transferList = Array.isArray(transferRes.data) ? transferRes.data : [];
      const storeInwardList = Array.isArray(storeInwardRes.data) ? storeInwardRes.data : [];

      // Set of barcodes already received in StoreInward
      const receivedBarcodesSet = new Set();
      storeInwardList.forEach(si => {
        const codes = Array.isArray(si.scannedBarcode) ? si.scannedBarcode : (si.scannedBarcode ? String(si.scannedBarcode).split(',').map(c => c.trim()) : []);
        codes.forEach(c => { if (c) receivedBarcodesSet.add(c); });
      });

      // 1. Process Dispatch collection records
      const fromDispatch = dispatchList.map(item => {
        const barcodes = Array.isArray(item.barcodes) ? item.barcodes : (item.barcodes ? String(item.barcodes).split(',').map(b => b.trim()).filter(Boolean) : []);
        const isReceivedInDb = item.status === 'Received' || (barcodes.length > 0 && barcodes.every(b => receivedBarcodesSet.has(b)));

        return {
          _id: item._id,
          invoiceNumber: item.invoiceNumber || item._id?.slice(-8).toUpperCase() || '—',
          modelNo: item.modelNo || item.model || 'Unknown Product',
          storeName: item.storeName || item.customerName || 'Store',
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
          salePerson: item.salePerson || '—',
          barcodes,
          dispatchDate: item.dispatchDate || item.createdAt || new Date(),
          category: item.category || '',
          subCategory: item.subCategory || '',
          status: isReceivedInDb ? 'Received' : 'Dispatched',
          type: 'Inventory Dispatch'
        };
      });

      // 2. Process Outward collection records targeting stores
      const fromOutward = outwardList
        .filter(item => item.storeName || item.owner)
        .map(item => {
          const barcodes = item.scannedList && item.scannedList.length > 0 ? item.scannedList : (item.scannedCodes ? item.scannedCodes.split(',').map(c => c.trim()).filter(Boolean) : []);
          const isReceivedInDb = barcodes.length > 0 && barcodes.every(b => receivedBarcodesSet.has(b));

          return {
            _id: item._id,
            invoiceNumber: item.reference || item.invoiceNumber || `OUT-${item._id?.slice(-6).toUpperCase()}`,
            modelNo: item.modelNo || 'Unknown Product',
            storeName: item.storeName || item.owner || 'Store',
            quantity: Number(item.quantity) || 0,
            price: Number(item.price) || 0,
            salePerson: item.salePerson || item.userId || '—',
            barcodes,
            dispatchDate: item.createdAt || new Date(),
            category: item.category || '',
            subCategory: item.subCategory || '',
            status: isReceivedInDb ? 'Received' : 'Dispatched',
            type: 'Stock Outward'
          };
        });

      // 3. Process Self-Transfers targeting stores
      const fromTransfers = transferList.map(item => {
        const barcodes = Array.isArray(item.scannedBarcode) ? item.scannedBarcode : [];
        const isReceivedInDb = barcodes.length > 0 && barcodes.every(b => receivedBarcodesSet.has(b));

        return {
          _id: item._id,
          invoiceNumber: `TRF-${item._id?.slice(-6).toUpperCase()}`,
          modelNo: item.modelNo || 'Unknown Product',
          storeName: item.toOwner || item.storeName || 'Store',
          quantity: Number(item.quantity) || 0,
          price: Number(item.productPrice) || 0,
          salePerson: item.userId || '—',
          barcodes,
          dispatchDate: item.createdAt || new Date(),
          category: item.category || '',
          subCategory: item.subCategory || '',
          status: isReceivedInDb ? 'Received' : 'Dispatched',
          type: 'Store Transfer'
        };
      });

      const combined = [...fromDispatch, ...fromOutward, ...fromTransfers];

      // Sort newest first
      combined.sort((a, b) => new Date(b.dispatchDate) - new Date(a.dispatchDate));

      setDispatches(combined);
    } catch (error) {
      console.error('Error fetching dispatched products:', error);
      enqueueSnackbar('Error fetching dispatched data!', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const handleReceiveInStore = async (item, verifiedBarcodesList = null) => {
    const barcodesToSend = Array.isArray(verifiedBarcodesList) && verifiedBarcodesList.length > 0
      ? verifiedBarcodesList
      : (item?.barcodes || []);

    try {
      setReceivingId(item._id);
      
      // Call endpoint to receive dispatch and save StoreInward
      const response = await axios.post(`${API_BASE}/store-inward/receive-dispatch`, {
        dispatchId: item._id,
        invoiceNumber: item.invoiceNumber,
        storeName: item.storeName,
        owner: item.storeName,
        scannedBarcode: barcodesToSend,
        userId: user?.name || user?.role || 'Store User'
      });

      if (response.data?.success) {
        enqueueSnackbar(`Product ${item.modelNo} (${item.quantity} units) received into Store Inward Details for ${item.storeName}!`, { 
          variant: 'success',
          autoHideDuration: 4000
        });
        await fetchDispatchedData();
        return true;
      } else {
        // Fallback manual store inward
        await axios.post(`${API_BASE}/store-inward`, {
          modelNo: item.modelNo,
          quantity: item.quantity,
          scannedBarcode: barcodesToSend,
          userId: user?.name || user?.role || 'Store User',
          storeName: item.storeName,
          owner: item.storeName,
          category: item.category || '',
          subCategory: item.subCategory || '',
          pricePerUnit: item.price || 0,
          salePerson: item.salePerson || ''
        });
        enqueueSnackbar(`Store Inward recorded for ${item.modelNo}!`, { variant: 'success' });
        await fetchDispatchedData();
        return true;
      }
    } catch (err) {
      console.error('Error receiving store inward:', err);
      // Fallback create store inward directly
      try {
        await axios.post(`${API_BASE}/store-inward`, {
          modelNo: item.modelNo,
          quantity: item.quantity,
          scannedBarcode: barcodesToSend,
          userId: user?.name || user?.role || 'Store User',
          storeName: item.storeName,
          owner: item.storeName,
          category: item.category || '',
          subCategory: item.subCategory || '',
          pricePerUnit: item.price || 0,
          salePerson: item.salePerson || ''
        });
        enqueueSnackbar(`Product ${item.modelNo} added to Store Inward Details!`, { variant: 'success' });
        await fetchDispatchedData();
        return true;
      } catch (fallbackErr) {
        enqueueSnackbar('Failed to receive product into Store Inward!', { variant: 'error' });
        return false;
      }
    } finally {
      setReceivingId(null);
    }
  };

  useEffect(() => {
    fetchDispatchedData();
  }, [fetchDispatchedData]);

  // If the user has an assigned store or specific role, auto-filter
  const userStore = user?.role !== 'Admin' && user?.role !== 'Super Admin' && user?.role !== 'Manager'
    ? (user?.assignedLocation || user?.customerStore || user?.warehouseName || user?.role || '')
    : '';

  // Get unique store list
  const uniqueStores = Array.from(new Set(dispatches.map(d => d.storeName).filter(Boolean)));

  // Filtered List
  const filtered = dispatches.filter(d => {
    // 1. Role filter
    if (userStore && userStore.toLowerCase() !== 'all') {
      const matchRole = (d.storeName || '').toLowerCase().includes(userStore.toLowerCase()) ||
                        userStore.toLowerCase().includes((d.storeName || '').toLowerCase());
      if (!matchRole) return false;
    }

    // 2. Dropdown store filter
    if (storeFilter !== 'All' && d.storeName !== storeFilter) {
      return false;
    }

    // 3. Date Filtering
    const itemDate = new Date(d.dispatchDate);
    if (!isNaN(itemDate.getTime())) {
      if (dateFilterMode === 'today') {
        const today = new Date();
        const isToday =
          itemDate.getDate() === today.getDate() &&
          itemDate.getMonth() === today.getMonth() &&
          itemDate.getFullYear() === today.getFullYear();
        if (!isToday) return false;
      } else if (dateFilterMode === 'thisMonth') {
        const today = new Date();
        const isThisMonth =
          itemDate.getMonth() === today.getMonth() &&
          itemDate.getFullYear() === today.getFullYear();
        if (!isThisMonth) return false;
      } else if (dateFilterMode === 'monthYear') {
        const matchMY =
          itemDate.getMonth() === Number(selectedMonth) &&
          itemDate.getFullYear() === Number(selectedYear);
        if (!matchMY) return false;
      } else if (dateFilterMode === 'custom' || fromDate || toDate) {
        if (fromDate) {
          const start = new Date(fromDate + 'T00:00:00');
          if (itemDate < start) return false;
        }
        if (toDate) {
          const end = new Date(toDate + 'T23:59:59');
          if (itemDate > end) return false;
        }
      }
    }

    // 4. Search query filter
    const search = searchQuery.toLowerCase().trim();
    if (!search) return true;

    const matchInvoice = (d.invoiceNumber || '').toLowerCase().includes(search);
    const matchModel = (d.modelNo || '').toLowerCase().includes(search);
    const matchStore = (d.storeName || '').toLowerCase().includes(search);
    const matchPerson = (d.salePerson || '').toLowerCase().includes(search);
    const matchBarcodes = (d.barcodes || []).some(b => (b || '').toLowerCase().includes(search));

    return matchInvoice || matchModel || matchStore || matchPerson || matchBarcodes;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setStoreFilter('All');
    setDateFilterMode('all');
    setFromDate('');
    setToDate('');
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
  };

  // KPI Calculations
  const totalOrders = filtered.length;
  const totalUnits = filtered.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
  const totalVal = filtered.reduce((sum, d) => sum + ((Number(d.price) || 0) * (Number(d.quantity) || 0)), 0);
  const totalStoresCount = Array.from(new Set(filtered.map(d => d.storeName).filter(Boolean))).length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 42, height: 42, borderRadius: 2.5, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe', flexShrink: 0 }}>
            <Truck size={22} color="#2563eb" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
              Dispatched Details
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.2 }}>
              Products and serial numbers dispatched from Inventory to this store.
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons: Download Template & Excel Bulk Import */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download size={16} />}
            onClick={handleDownloadExcelTemplate}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              borderColor: '#cbd5e1',
              color: '#334155',
              backgroundColor: '#ffffff',
              height: 40,
              px: 2,
              '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f1f5f9' }
            }}
          >
            Sample Excel Template
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<Upload size={16} />}
            onClick={() => {
              setImportFeedback(null);
              setOpenImportModal(true);
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              backgroundColor: '#0284c7',
              height: 40,
              px: 2.5,
              boxShadow: '0 2px 8px rgba(2,132,199,0.3)',
              '&:hover': { backgroundColor: '#0369a1' }
            }}
          >
            Import Excel Dispatches
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2.5,
          mb: 3,
          width: '100%',
        }}
      >
        {/* Total Dispatched Orders */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Dispatched Orders
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5 }}>
                {totalOrders}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={22} color="#2563eb" />
            </Box>
          </CardContent>
        </Card>

        {/* Total Dispatched Units */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Dispatched Quantity
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#16a34a', mt: 0.5 }}>
                {totalUnits.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={22} color="#16a34a" />
            </Box>
          </CardContent>
        </Card>

        {/* Total Dispatched Value */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Dispatched Value
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#7c3aed', mt: 0.5 }}>
                ₹{totalVal.toLocaleString('en-IN')}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={22} color="#7c3aed" />
            </Box>
          </CardContent>
        </Card>

        {/* Destination Stores */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Store Destinations
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#0891b2', mt: 0.5 }}>
                {totalStoresCount}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={22} color="#0891b2" />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Main Table Card */}
      <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden', width: '100%' }}>
        {/* Search & Comprehensive Date / Store Filter Toolbar */}
        <Box sx={{ p: 2.5, backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
          <Stack spacing={2}>
            {/* Primary Row: Search + Store Filter + Date Preset */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ flex: 2, minWidth: { xs: '100%', sm: 260 } }}>
                <TextField
                  placeholder="Search by invoice, model, store, sales person, or serial barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="small"
                  fullWidth
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

              {/* Date Filter Mode Dropdown */}
              <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: 220 } }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Date Filter</InputLabel>
                  <Select
                    value={dateFilterMode}
                    label="Date Filter"
                    onChange={(e) => setDateFilterMode(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">All Dates</MenuItem>
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="thisMonth">This Month</MenuItem>
                    <MenuItem value="monthYear">By Month & Year</MenuItem>
                    <MenuItem value="custom">Custom Date Range (From - To)</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Clear / Reset Filter Button */}
              {(dateFilterMode !== 'all' || searchQuery || fromDate || toDate) && (
                <Tooltip title="Reset all search and date filters">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RotateCcw size={14} />}
                    onClick={handleResetFilters}
                    sx={{
                      borderColor: '#cbd5e1',
                      color: '#64748b',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 2,
                      height: 40,
                      px: 2,
                      '&:hover': { backgroundColor: '#f1f5f9', borderColor: '#94a3b8' }
                    }}
                  >
                    Reset
                  </Button>
                </Tooltip>
              )}
            </Box>

            {/* Secondary Row: Specific Month/Year or From-To Date Inputs */}
            {dateFilterMode === 'monthYear' && (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 1.5, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                <Typography variant="body2" fontWeight={600} color="#334155" sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Calendar size={16} color="#0284c7" />
                  Select Month & Year:
                </Typography>

                <Box sx={{ minWidth: 160 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Month</InputLabel>
                    <Select
                      value={selectedMonth}
                      label="Month"
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      sx={{ borderRadius: 1.5, backgroundColor: '#ffffff' }}
                    >
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((mName, mIdx) => (
                        <MenuItem key={mIdx} value={mIdx}>{mName}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ minWidth: 120 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Year</InputLabel>
                    <Select
                      value={selectedYear}
                      label="Year"
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      sx={{ borderRadius: 1.5, backgroundColor: '#ffffff' }}
                    >
                      {[2023, 2024, 2025, 2026, 2027, 2028].map(yr => (
                        <MenuItem key={yr} value={yr}>{yr}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            )}

            {dateFilterMode === 'custom' && (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 1.5, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                <Typography variant="body2" fontWeight={600} color="#334155" sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Calendar size={16} color="#0284c7" />
                  From - To Date Range:
                </Typography>

                <TextField
                  type="date"
                  label="From Date"
                  size="small"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 170, backgroundColor: '#ffffff', borderRadius: 1.5 }}
                />

                <TextField
                  type="date"
                  label="To Date"
                  size="small"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 170, backgroundColor: '#ffffff', borderRadius: 1.5 }}
                />
              </Box>
            )}
          </Stack>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', width: 50 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Invoice / Ref No</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Model / Product</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Store / Destination</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Quantity</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Unit Price</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Total Amount</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Sales Person</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Serials / Barcodes</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Dispatch Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Store Inward Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, idx) => (
                <TableRow key={item._id || idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>
                    {page * rowsPerPage + idx + 1}
                  </TableCell>

                  {/* Invoice / Ref No */}
                  <TableCell>
                    <Chip
                      label={item.invoiceNumber}
                      size="small"
                      sx={{
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        fontWeight: 700,
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </TableCell>

                  {/* Model */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                      {item.modelNo}
                    </Typography>
                    {item.category && (
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {item.category}
                      </Typography>
                    )}
                  </TableCell>

                  {/* Store / Destination */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Store size={15} color="#0284c7" />
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#0f2b48' }}>
                        {item.storeName}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Quantity */}
                  <TableCell>
                    <Chip
                      label={`${item.quantity} units`}
                      size="small"
                      sx={{
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        fontWeight: 700,
                        fontSize: '12px',
                      }}
                    />
                  </TableCell>

                  {/* Unit Price */}
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                      ₹{Number(item.price || 0).toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>

                  {/* Total Amount */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                      ₹{(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>

                  {/* Sales Person */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <User size={14} color="#64748b" />
                      <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>
                        {item.salePerson}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Barcodes / Serials */}
                  <TableCell>
                    {item.barcodes && item.barcodes.length > 0 ? (
                      <Chip
                        icon={<Barcode size={14} />}
                        label={`${item.barcodes.length} serials`}
                        size="small"
                        onClick={() => setSelectedSerials({ invoice: item.invoiceNumber, model: item.modelNo, barcodes: item.barcodes })}
                        sx={{
                          backgroundColor: '#eff6ff',
                          color: '#1d4ed8',
                          fontWeight: 700,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: '#dbeafe' }
                        }}
                      />
                    ) : (
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                        No serials logged
                      </Typography>
                    )}
                  </TableCell>

                  {/* Dispatch Date */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <Calendar size={14} color="#64748b" />
                      <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                        {new Date(item.dispatchDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Status */}
                  <TableCell align="center">
                    {item.status === 'Received' ? (
                      <Chip
                        icon={<CheckCircle2 size={13} />}
                        label="Store Received"
                        size="small"
                        sx={{
                          backgroundColor: '#dcfce7',
                          color: '#15803d',
                          fontWeight: 700,
                          fontSize: '12px'
                        }}
                      />
                    ) : (
                      <Chip
                        icon={<Truck size={13} />}
                        label="Dispatched"
                        size="small"
                        sx={{
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          fontWeight: 700,
                          fontSize: '12px'
                        }}
                      />
                    )}
                  </TableCell>

                  {/* Store Inward Action */}
                  <TableCell align="center">
                    {item.status === 'Received' ? (
                      <Tooltip title="Already inwarded into Store Inward Details">
                        <Chip
                          label="Inwarded"
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: '#86efac',
                            color: '#16a34a',
                            fontWeight: 600,
                            fontSize: '11px'
                          }}
                        />
                      </Tooltip>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Package size={14} />}
                        disabled={receivingId === item._id}
                        onClick={() => handleOpenInwardScanModal(item)}
                        sx={{
                          backgroundColor: '#16a34a',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '11px',
                          textTransform: 'none',
                          borderRadius: 2,
                          px: 1.5,
                          py: 0.5,
                          boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                          '&:hover': {
                            backgroundColor: '#15803d'
                          }
                        }}
                      >
                        {receivingId === item._id ? 'Receiving...' : 'Store Inward'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                      <PackageX size={36} color="#cbd5e1" />
                      <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                        No dispatched products found for this store.
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
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Modal Dialog to View All Serial Numbers */}
      <Dialog
        open={Boolean(selectedSerials)}
        onClose={() => setSelectedSerials(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Barcode size={20} color="#2563eb" />
            <Typography variant="subtitle1" fontWeight={700}>
              Dispatched Serials ({selectedSerials?.invoice} - {selectedSerials?.model})
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setSelectedSerials(null)}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 350, overflowY: 'auto', p: 1 }}>
            {(selectedSerials?.barcodes || []).map((code, cIdx) => (
              <Chip
                key={cIdx}
                label={code}
                size="small"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  fontSize: '12px',
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  borderRadius: 1.5,
                }}
              />
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Store Inward Barcode Scanning & Verification Dialog */}
      <Dialog
        open={Boolean(inwardDialogItem)}
        onClose={() => setInwardDialogItem(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            p: 0.5,
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            overflow: 'hidden'
          }
        }}
      >
        {/* Modal Header */}
        <DialogTitle sx={{ p: 2.5, pb: 2, backgroundColor: '#ffffff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' }}>
                <PackageCheck size={24} color="#2563eb" />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', fontSize: '18px', letterSpacing: '-0.01em' }}>
                    Store Inward S/N Scan Verification
                  </Typography>
                  {inwardDialogItem?.barcodes?.length > 0 && (
                    <Chip
                      label={scannedSerials.length === inwardDialogItem.barcodes.length ? 'ALL VERIFIED' : 'SCANNING IN PROGRESS'}
                      size="small"
                      sx={{
                        fontSize: '10px',
                        fontWeight: 800,
                        height: 20,
                        backgroundColor: scannedSerials.length === inwardDialogItem.barcodes.length ? '#dcfce7' : '#e0f2fe',
                        color: scannedSerials.length === inwardDialogItem.barcodes.length ? '#15803d' : '#0369a1',
                        border: `1px solid ${scannedSerials.length === inwardDialogItem.barcodes.length ? '#86efac' : '#7dd3fc'}`
                      }}
                    />
                  )}
                </Box>
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.2 }}>
                  Scan or match serial barcodes before receiving product into store inventory.
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setInwardDialogItem(null)} sx={{ color: '#94a3b8', '&:hover': { backgroundColor: '#f1f5f9', color: '#0f172a' } }}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>

        <Divider sx={{ borderColor: '#f1f5f9' }} />

        <DialogContent sx={{ p: 2.5, backgroundColor: '#f8fafc' }}>
          {inwardDialogItem && (
            <Stack spacing={2.5}>
              {/* Product Info Header Card */}
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>
                      Invoice / Ref No
                    </Typography>
                    <Typography variant="body2" fontWeight={800} sx={{ color: '#2563eb', fontFamily: 'monospace', fontSize: '13px', mt: 0.3 }}>
                      {inwardDialogItem.invoiceNumber}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>
                      Model / Product
                    </Typography>
                    <Typography variant="body2" fontWeight={800} sx={{ color: '#0f172a', fontSize: '13px', mt: 0.3 }}>
                      {inwardDialogItem.modelNo}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>
                      Store Destination
                    </Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#0369a1', fontSize: '13px', mt: 0.3 }}>
                      {inwardDialogItem.storeName}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>
                      Total Quantity
                    </Typography>
                    <Typography variant="body2" fontWeight={800} sx={{ color: '#16a34a', fontSize: '13px', mt: 0.3 }}>
                      {inwardDialogItem.quantity} units
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Serials Verification Dashboard */}
              {inwardDialogItem.barcodes && inwardDialogItem.barcodes.length > 0 ? (
                <>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      backgroundColor: scannedSerials.length === inwardDialogItem.barcodes.length ? '#f0fdf4' : '#ffffff',
                      borderRadius: 2.5,
                      border: `1px solid ${scannedSerials.length === inwardDialogItem.barcodes.length ? '#bbf7d0' : '#e2e8f0'}`,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#0f172a', fontSize: '14px' }}>
                          Verification Progress
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.8 }}>
                          <Chip label={`Verified: ${scannedSerials.length}`} size="small" sx={{ height: 22, fontSize: '11px', fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d' }} />
                          <Chip label={`Pending: ${inwardDialogItem.barcodes.length - scannedSerials.length}`} size="small" sx={{ height: 22, fontSize: '11px', fontWeight: 700, backgroundColor: '#fef3c7', color: '#b45309' }} />
                          <Chip label={`Total: ${inwardDialogItem.barcodes.length}`} size="small" sx={{ height: 22, fontSize: '11px', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#475569' }} />
                        </Box>
                      </Box>

                      {/* Reset Action */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {scannedSerials.length > 0 && (
                          <Tooltip title="Reset all verified serials">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<RefreshCw size={14} />}
                              onClick={handleResetSerials}
                              sx={{
                                borderRadius: 1.5,
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '11px',
                                py: 0.3,
                                px: 1.2,
                                borderColor: '#e2e8f0',
                                color: '#64748b',
                                backgroundColor: '#ffffff',
                                '&:hover': { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }
                              }}
                            >
                              Reset Scans
                            </Button>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={(scannedSerials.length / inwardDialogItem.barcodes.length) * 100}
                      sx={{
                        height: 9,
                        borderRadius: 4,
                        backgroundColor: '#f1f5f9',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: scannedSerials.length === inwardDialogItem.barcodes.length ? '#16a34a' : '#2563eb',
                          borderRadius: 4,
                          transition: 'transform 0.4s ease'
                        }
                      }}
                    />
                  </Paper>

                  {/* Instant Barcode Scanner Input */}
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Scan S/N with barcode reader or type serial number..."
                      value={barcodeInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBarcodeInput(val);
                        if (scanFeedback) setScanFeedback(null);

                        // Instant verification on match
                        if (val && inwardDialogItem?.barcodes) {
                          const trimmed = val.trim();
                          const matched = inwardDialogItem.barcodes.find(b => b.trim().toLowerCase() === trimmed.toLowerCase());
                          if (matched) {
                            handleProcessBarcodeScan(trimmed);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleProcessBarcodeScan(barcodeInput);
                        }
                      }}
                      autoFocus
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Barcode size={20} color="#2563eb" />
                          </InputAdornment>
                        ),
                        sx: {
                          borderRadius: 2.5,
                          fontSize: '14px',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                          '&.Mui-focused': {
                            borderColor: '#2563eb',
                            boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.15)'
                          }
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={() => handleProcessBarcodeScan(barcodeInput)}
                      sx={{
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: 2.5,
                        px: 3,
                        height: 40,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                        '&:hover': { backgroundColor: '#1d4ed8' }
                      }}
                    >
                      Verify S/N
                    </Button>
                  </Box>

                  {/* Feedback Alert Banner */}
                  {scanFeedback && (
                    <Alert
                      severity={scanFeedback.type}
                      onClose={() => setScanFeedback(null)}
                      sx={{ borderRadius: 2, fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                    >
                      {scanFeedback.message}
                    </Alert>
                  )}

                  {/* Redesigned Serial Barcode Checklist Section */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                      <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#0f172a', fontSize: '14px' }}>
                        Serial Barcode Checklist ({inwardDialogItem.barcodes.length})
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Scan physical serial barcodes to verify each unit
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                        gap: 1.5,
                        maxHeight: 280,
                        overflowY: 'auto',
                        p: 1.5,
                        backgroundColor: '#ffffff',
                        borderRadius: 2.5,
                        border: '1px solid #e2e8f0',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      {inwardDialogItem.barcodes.map((code, idx) => {
                        const isVerified = scannedSerials.some(s => s.trim().toLowerCase() === code.trim().toLowerCase());
                        const itemNum = String(idx + 1).padStart(2, '0');

                        return (
                          <Paper
                            key={idx}
                            elevation={0}
                            sx={{
                              p: 1.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderRadius: 2,
                              border: `1.5px solid ${isVerified ? '#86efac' : '#e2e8f0'}`,
                              backgroundColor: isVerified ? '#f0fdf4' : '#fafafa',
                              cursor: 'default',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: isVerified ? '0 2px 8px rgba(22, 163, 74, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, overflow: 'hidden' }}>
                              {/* Index Pill */}
                              <Box
                                sx={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: '50%',
                                  backgroundColor: isVerified ? '#dcfce7' : '#f1f5f9',
                                  color: isVerified ? '#15803d' : '#64748b',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justify: 'center',
                                  flexShrink: 0
                                }}
                              >
                                #{itemNum}
                              </Box>

                              <Box sx={{ overflow: 'hidden' }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: 'monospace',
                                    fontWeight: 800,
                                    color: isVerified ? '#15803d' : '#0f172a',
                                    fontSize: '13px',
                                    lineHeight: 1.2
                                  }}
                                >
                                  {code}
                                </Typography>
                                <Typography variant="caption" sx={{ color: isVerified ? '#16a34a' : '#94a3b8', fontSize: '10px', display: 'block' }}>
                                  {isVerified ? 'Verified & Ready' : 'Pending Verification'}
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                              {/* Copy S/N Button */}
                              <Tooltip title="Copy S/N">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyCode(code);
                                  }}
                                  sx={{ color: '#94a3b8', p: 0.5, '&:hover': { color: '#2563eb' } }}
                                >
                                  <Copy size={13} />
                                </IconButton>
                              </Tooltip>

                              {/* Status Badge */}
                              <Chip
                                icon={isVerified ? <CheckCircle2 size={12} /> : <Barcode size={12} />}
                                label={isVerified ? 'VERIFIED' : 'PENDING'}
                                size="small"
                                sx={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  height: 22,
                                  backgroundColor: isVerified ? '#dcfce7' : '#f1f5f9',
                                  color: isVerified ? '#15803d' : '#64748b',
                                  border: `1px solid ${isVerified ? '#86efac' : '#cbd5e1'}`
                                }}
                              />

                              {/* Delete / Remove Verification */}
                              {isVerified && (
                                <Tooltip title="Remove verification">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveVerifiedSerial(code);
                                    }}
                                    sx={{ color: '#ef4444', p: 0.5, '&:hover': { backgroundColor: '#fef2f2' } }}
                                  >
                                    <Trash2 size={14} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </Paper>
                        );
                      })}
                    </Box>
                  </Box>
                </>
              ) : (
                /* Item has no serial barcodes logged */
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No registered serial barcodes were attached to this dispatch order. You can directly proceed with receiving the product into Store Inward.
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>

        <Divider sx={{ borderColor: '#f1f5f9' }} />

        {/* Modal Footer Actions */}
        <DialogActions sx={{ p: 2.5, backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => setInwardDialogItem(null)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: '#64748b', borderColor: '#cbd5e1', '&:hover': { backgroundColor: '#f8fafc' } }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            startIcon={<PackageCheck size={18} />}
            disabled={
              receivingId === inwardDialogItem?._id ||
              (inwardDialogItem?.barcodes?.length > 0 && scannedSerials.length < inwardDialogItem.barcodes.length)
            }
            onClick={async () => {
              const success = await handleReceiveInStore(inwardDialogItem, scannedSerials);
              if (success) {
                setInwardDialogItem(null);
              }
            }}
            sx={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              fontWeight: 800,
              borderRadius: 2.5,
              px: 3.5,
              py: 1.2,
              fontSize: '13px',
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
              '&:hover': { backgroundColor: '#15803d' },
              '&.Mui-disabled': { backgroundColor: '#cbd5e1', color: '#94a3b8', boxShadow: 'none' }
            }}
          >
            {receivingId === inwardDialogItem?._id
              ? 'Receiving...'
              : inwardDialogItem?.barcodes?.length > 0 && scannedSerials.length < inwardDialogItem.barcodes.length
              ? `Scan All Serials (${scannedSerials.length}/${inwardDialogItem.barcodes.length})`
              : 'Complete Store Inward'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Excel Bulk Import Dialog */}
      <Dialog
        open={openImportModal}
        onClose={() => !isImporting && setOpenImportModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ backgroundColor: '#f8fafc', p: 2.5, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={20} color="#0284c7" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#0f172a">
                Import Dispatches from Excel
              </Typography>
              <Typography variant="caption" color="#64748b">
                Upload historical or offline dispatch records (.xlsx, .xls, .csv)
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setOpenImportModal(false)} disabled={isImporting} size="small">
            <X size={18} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            {/* Download Template Banner */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: '#eff6ff',
                borderRadius: 2.5,
                border: '1px solid #bfdbfe',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1.5
              }}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="#1e40af">
                  Need the Excel Format?
                </Typography>
                <Typography variant="caption" color="#3b82f6">
                  Download our pre-formatted spreadsheet template with all required columns.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Download size={14} />}
                onClick={handleDownloadExcelTemplate}
                sx={{
                  backgroundColor: '#ffffff',
                  borderColor: '#93c5fd',
                  color: '#1d4ed8',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  '&:hover': { backgroundColor: '#f8fafc', borderColor: '#60a5fa' }
                }}
              >
                Download Template
              </Button>
            </Paper>

            {/* File Upload Drop Zone */}
            <Box
              component="label"
              sx={{
                border: '2px dashed #cbd5e1',
                borderRadius: 3,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#f8fafc',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
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
                onChange={handleFileChange}
              />
              <Upload size={32} color="#0284c7" />
              <Typography variant="body1" fontWeight={700} color="#0f172a">
                Click to select Excel / CSV file
              </Typography>
              <Typography variant="caption" color="#64748b">
                Supports .xlsx, .xls, and .csv files with invoice, model, and barcode columns
              </Typography>
            </Box>

            {/* Error / Status Feedback */}
            {importFeedback && (
              <Alert severity={importFeedback.type} sx={{ borderRadius: 2 }}>
                {importFeedback.message}
              </Alert>
            )}

            {/* Data Preview Section */}
            {parsedData.length > 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                    Data Preview ({parsedData.length} rows loaded)
                  </Typography>
                  <Chip
                    label={`${parsedData.filter(r => r.isValid).length} Valid / ${parsedData.filter(r => !r.isValid).length} Invalid`}
                    size="small"
                    color={parsedData.every(r => r.isValid) ? 'success' : 'warning'}
                    sx={{ fontWeight: 700 }}
                  />
                </Box>

                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{
                    maxHeight: 280,
                    borderRadius: 2,
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ '& th': { backgroundColor: '#f1f5f9', fontWeight: 700, fontSize: '12px' } }}>
                        <TableCell>#</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Invoice No</TableCell>
                        <TableCell>Model No</TableCell>
                        <TableCell>Qty</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Destination</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Barcodes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {parsedData.map((row) => (
                        <TableRow key={row._rowId} hover sx={{ '& td': { fontSize: '12px' } }}>
                          <TableCell>{row._rowId}</TableCell>
                          <TableCell>
                            {row.isValid ? (
                              <Chip label="Ready" size="small" color="success" sx={{ height: 20, fontSize: '10px', fontWeight: 700 }} />
                            ) : (
                              <Chip label="Missing Data" size="small" color="error" sx={{ height: 20, fontSize: '10px', fontWeight: 700 }} />
                            )}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#0284c7' }}>{row.invoiceNumber || '—'}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{row.modelNo || '—'}</TableCell>
                          <TableCell>{row.quantity}</TableCell>
                          <TableCell>₹{row.price}</TableCell>
                          <TableCell>{row.storeName || row.customerName || '—'}</TableCell>
                          <TableCell>{row.dispatchDate || 'Today'}</TableCell>
                          <TableCell>{row.barcodes?.length || 0} serial(s)</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 1 }}>
                  * Submitting will create these Dispatch documents, reduce corresponding central stock, and record the barcodes in the Warranty tracking database.
                </Typography>
              </Box>
            )}

            {isImporting && (
              <Box sx={{ width: '100%' }}>
                <LinearProgress sx={{ borderRadius: 1 }} />
                <Typography variant="caption" sx={{ color: '#0284c7', display: 'block', mt: 0.5, textAlign: 'center', fontWeight: 600 }}>
                  Importing and updating stock records... Please wait.
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <Divider sx={{ borderColor: '#f1f5f9' }} />

        <DialogActions sx={{ p: 2.5, backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => setOpenImportModal(false)}
            disabled={isImporting}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: '#64748b', borderColor: '#cbd5e1' }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={isImporting || parsedData.length === 0 || !parsedData.some(r => r.isValid)}
            onClick={handleExecuteBulkImport}
            sx={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontWeight: 800,
              borderRadius: 2.5,
              px: 3.5,
              py: 1.2,
              fontSize: '13px',
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
              '&:hover': { backgroundColor: '#0369a1' },
              '&.Mui-disabled': { backgroundColor: '#cbd5e1', color: '#94a3b8', boxShadow: 'none' }
            }}
          >
            {isImporting ? 'Importing...' : `Confirm & Import (${parsedData.filter(r => r.isValid).length} Dispatches)`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StoreDispatched;
