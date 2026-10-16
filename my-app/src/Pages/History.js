import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from './UserContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  IconButton,
  TextField,
  Typography,
  MenuItem,
  Stack,
  FormControl,
  Select,
  Paper,
  Box,
  Card,
  CardContent,
  Chip,
  Tooltip,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Divider,
  Avatar
} from '@mui/material';
import {
  History as HistoryIcon,
  Search,
  RotateCcw,
  Barcode,
  Calendar,
  Package,
  Building,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Printer,
  Phone,
  MapPin,
  Tag,
  Clock,
  ArrowRightLeft,
  DollarSign
} from 'lucide-react';
import Spinner from '../Components/Spinner';

const API_BASE = 'https://coloroninventoy.onrender.com/api';

function History() {
  const { user } = useUser();
  const [stockMovements, setStockMovements] = useState([]);
  const [filteredMovements, setFilteredMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState('');

  // Bill Modal & Customer Details
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Fetch customer by mobile number
  const fetchCustomerByMobile = async (mobile) => {
    try {
      const response = await fetch(`${API_BASE}/customers?mobile=${mobile}`);
      const data = await response.json();
      if (data.length > 0) {
        setCustomer(data[0]);
      } else {
        setCustomer(null);
      }
    } catch (err) {
      console.error('Error fetching customer:', err);
      setCustomer(null);
    }
  };

  // Fetch stock movements with pagination
  const fetchStockMovements = async () => {
    try {
      setLoading(true);
      const activeStore =
        user?.assignedLocation ||
        user?.warehouseName ||
        user?.serviceCenter ||
        user?.staffLocation ||
        user?.customerStore ||
        user?.role ||
        '';
      const roleLower = (user?.role || '').toLowerCase().trim();
      const isSuperAdmin =
        ['admin', 'super admin', 'manager', 'warehouse', 'headoffice'].includes(roleLower) ||
        roleLower.includes('warehouse') ||
        roleLower.includes('headoffice');
      const storeParam =
        !isSuperAdmin && activeStore
          ? `&storeName=${encodeURIComponent(activeStore)}`
          : '';

      const response = await fetch(
        `${API_BASE}/stock-outward?page=${currentPage}&limit=${itemsPerPage}${storeParam}`
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setStockMovements(result.data);
        setFilteredMovements(result.data);
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages);
          setTotalItems(result.pagination.totalItems);
        }
      } else {
        throw new Error(result.error || 'Invalid API response structure');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching stock movements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (movement) => {
    setSelectedMovement(movement);
    if (movement.customerMobile) {
      await fetchCustomerByMobile(movement.customerMobile);
    }
    setShowBillModal(true);
  };

  const handleDeleteConfirm = (id) => {
    fetch(`${API_BASE}/stock-outward/${id}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to delete');
        fetchStockMovements();
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  const downloadInvoiceAsPDF = () => {
    const input = document.getElementById('invoice-content');
    if (!input) return;
    input.style.padding = '40px';
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`invoice_${selectedMovement?._id || 'details'}.pdf`);
    });
  };

  const handleExportExcel = async () => {
    try {
      const activeStore =
        user?.assignedLocation ||
        user?.warehouseName ||
        user?.serviceCenter ||
        user?.staffLocation ||
        user?.customerStore ||
        user?.role ||
        '';
      const roleLower = (user?.role || '').toLowerCase().trim();
      const isSuperAdmin =
        ['admin', 'super admin', 'manager', 'warehouse', 'headoffice'].includes(roleLower) ||
        roleLower.includes('warehouse') ||
        roleLower.includes('headoffice');
      const storeParam =
        !isSuperAdmin && activeStore
          ? `&storeName=${encodeURIComponent(activeStore)}`
          : '';

      const response = await fetch(`${API_BASE}/stock-outward?page=1&limit=0${storeParam}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        const dataToExport = result.data.map((m) => ({
          'ACTIVITY NAME': m.reason === 'Stock Outward' ? 'Store Inward' : (m.reason || 'Store Inward'),
          'MODEL NO': m.modelNo || 'N/A',
          'CATEGORY': m.category || 'N/A',
          'SUB CATEGORY': m.subCategory || 'N/A',
          'QUANTITY': m.quantity ?? 'N/A',
          'CUSTOMER NAME': m.customerName || 'N/A',
          'MOBILE': m.customerMobile || 'N/A',
          'ADDRESS': m.customerAddress || 'N/A',
          'STORE': m.storeName || 'N/A',
          'DATE': m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A',
          'PRICE': m.price ? `₹${m.price.toLocaleString()}` : 'N/A',
          'SCANNED CODES': m.scannedList && m.scannedList.length > 0
            ? m.scannedList.join(', ')
            : m.scannedCodes || 'N/A',
          'UPDATED AT': m.updatedAt ? new Date(m.updatedAt).toLocaleString() : 'N/A'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Movements');
        XLSX.writeFile(workbook, 'Stock_Movement_History.xlsx');
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error exporting Excel:', err);
      alert('Failed to export Excel report: ' + err.message);
    }
  };

  useEffect(() => {
    fetchStockMovements();
  }, [user, currentPage, itemsPerPage]);

  // Client-side search filtering
  const displayedMovements = useMemo(() => {
    return stockMovements.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const activity = m.reason === 'Stock Outward' ? 'Store Inward' : (m.reason || 'Store Inward');
      const codes = m.scannedList && m.scannedList.length > 0
        ? m.scannedList.join(' ')
        : String(m.scannedCodes || '');

      const matchesSearch =
        !q ||
        activity.toLowerCase().includes(q) ||
        (m.modelNo || '').toLowerCase().includes(q) ||
        (m.category || '').toLowerCase().includes(q) ||
        (m.subCategory || '').toLowerCase().includes(q) ||
        (m.customerName || '').toLowerCase().includes(q) ||
        (m.customerMobile || '').toLowerCase().includes(q) ||
        (m.customerAddress || '').toLowerCase().includes(q) ||
        (m.storeName || '').toLowerCase().includes(q) ||
        codes.toLowerCase().includes(q);

      const matchesActivity = !activityFilter || activity.toLowerCase() === activityFilter.toLowerCase();

      return matchesSearch && matchesActivity;
    });
  }, [stockMovements, searchQuery, activityFilter]);

  // KPI Calculations
  const stats = useMemo(() => {
    const count = totalItems || stockMovements.length;
    const totalUnits = stockMovements.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
    const totalValuation = stockMovements.reduce((sum, m) => sum + ((Number(m.quantity) || 0) * (Number(m.price) || 0)), 0);
    const activeStore =
      user?.assignedLocation ||
      user?.warehouseName ||
      user?.serviceCenter ||
      user?.staffLocation ||
      user?.customerStore ||
      user?.role ||
      'All Stores';

    return { count, totalUnits, totalValuation, activeStore };
  }, [stockMovements, totalItems, user]);

  const inr = (n) => `₹ ${Number(n || 0).toLocaleString('en-IN')}`;

  if (loading && stockMovements.length === 0) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <Spinner message="Loading stock movement history..." />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Header Banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 3, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' }}>
            <HistoryIcon size={26} color="#2563eb" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
              Stock Movement History
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Track all inventory transactions and customer stock outwards for {stats.activeStore}
            </Typography>
          </Box>
        </Box>

        {/* Excel Export Button */}
        <Button
          variant="contained"
          startIcon={<FileSpreadsheet size={18} />}
          onClick={handleExportExcel}
          sx={{
            backgroundColor: '#107c41',
            color: '#ffffff',
            fontWeight: 800,
            borderRadius: 2.5,
            px: 2.5,
            py: 1,
            textTransform: 'none',
            fontSize: '14px',
            boxShadow: '0 4px 14px rgba(16, 124, 65, 0.25)',
            '&:hover': { backgroundColor: '#0e6b37' }
          }}
        >
          Export Excel Report
        </Button>
      </Box>

      {/* KPI Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 3, width: '100%' }}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', width: '100%' }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Transactions
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5 }}>
                  {stats.count}
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HistoryIcon size={22} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', width: '100%' }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Moved Units
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#059669', mt: 0.5 }}>
                  {stats.totalUnits}
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={22} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', width: '100%' }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Valuation
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#7c3aed', mt: 0.5 }}>
                  {inr(stats.totalValuation)}
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={22} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', width: '100%' }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Active Store
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#0284c7', mt: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                  {stats.activeStore}
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building size={22} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Filter Toolbar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', width: '100%', boxSizing: 'border-box' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search Model No, Customer, Mobile, Address, Store, or Serial Barcodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1, minWidth: 280 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#64748b" />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <X size={16} />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: { borderRadius: 2, backgroundColor: '#f8fafc', fontSize: '14px' }
            }}
          />

          <FormControl size="small" sx={{ minWidth: 170 }}>
            <Select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              displayEmpty
              sx={{ borderRadius: 2, backgroundColor: '#f8fafc', fontSize: '14px' }}
            >
              <MenuItem value="">All Activity Types</MenuItem>
              <MenuItem value="Store Inward">Store Inward</MenuItem>
              <MenuItem value="Stock Outward">Stock Outward</MenuItem>
            </Select>
          </FormControl>

          {(searchQuery || activityFilter) && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<RotateCcw size={14} />}
              onClick={() => {
                setSearchQuery('');
                setActivityFilter('');
              }}
              sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b', borderColor: '#cbd5e1' }}
            >
              Reset Filters
            </Button>
          )}
        </Box>
      </Paper>

      {/* Main Stock Movement History Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', overflow: 'hidden', width: '100%' }}>
        <TableContainer>
          <Table sx={{ minWidth: 1000 }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Activity Name
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Model No
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Category
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Quantity
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Customer Details
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Store Location
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Date
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Price
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Scanned Codes
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.8 }}>
                  Updated At
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {displayedMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <HistoryIcon size={36} color="#cbd5e1" />
                      <Typography variant="subtitle2" fontWeight={700} color="#334155">
                        No stock movement records found
                      </Typography>
                      <Typography variant="caption" color="#64748b">
                        {searchQuery ? 'Try adjusting your search filters' : 'Transactions will appear here when inventory moves'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                displayedMovements.map((m, idx) => {
                  const activityName = m.reason === 'Stock Outward' ? 'Store Inward' : (m.reason || 'Store Inward');
                  const codesString = (() => {
                    if (m.scannedList && m.scannedList.length > 0) {
                      return m.scannedList.join(', ');
                    }
                    const val = m.scannedCodes;
                    if (!val) return 'N/A';
                    if (Array.isArray(val)) {
                      return val.map((v) => (typeof v === 'string' ? v.trim() : String(v))).join(', ');
                    }
                    const str = String(val).trim();
                    if (str.includes(',') || str.includes(' ')) return str;
                    return str.split(/(?=[A-Z]{2,}[-_])/).filter(Boolean).join(', ');
                  })();

                  const codesArray = codesString !== 'N/A' ? codesString.split(',').map(c => c.trim()) : [];

                  return (
                    <TableRow
                      key={m._id || idx}
                      hover
                      sx={{
                        transition: 'background-color 0.15s ease',
                        '&:hover': { backgroundColor: '#f8fafc' }
                      }}
                    >
                      {/* Activity Name */}
                      <TableCell sx={{ py: 1.8 }}>
                        <Chip
                          label={activityName}
                          size="small"
                          sx={{
                            fontSize: '11px',
                            fontWeight: 800,
                            backgroundColor: activityName === 'Store Inward' ? '#dcfce7' : '#f3e8ff',
                            color: activityName === 'Store Inward' ? '#15803d' : '#7c3aed',
                            border: activityName === 'Store Inward' ? '1px solid #86efac' : '1px solid #ddd6fe'
                          }}
                        />
                      </TableCell>

                      {/* Model No */}
                      <TableCell sx={{ py: 1.8 }}>
                        <Typography variant="body2" fontWeight={800} sx={{ color: '#0f172a', fontSize: '13px' }}>
                          {m.modelNo || 'N/A'}
                        </Typography>
                      </TableCell>

                      {/* Category */}
                      <TableCell sx={{ py: 1.8 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                          <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600, fontSize: '12px' }}>
                            {m.category || 'N/A'}
                          </Typography>
                          {m.subCategory && (
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px' }}>
                              {m.subCategory}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      {/* Quantity */}
                      <TableCell sx={{ py: 1.8 }}>
                        <Chip
                          label={`${m.quantity ?? 0} unit${(m.quantity ?? 0) > 1 ? 's' : ''}`}
                          size="small"
                          sx={{
                            fontSize: '11px',
                            fontWeight: 800,
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe'
                          }}
                        />
                      </TableCell>

                      {/* Customer Details */}
                      <TableCell sx={{ py: 1.8 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                          <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a', fontSize: '13px' }}>
                            {m.customerName || 'N/A'}
                          </Typography>
                          {m.customerMobile && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Phone size={12} color="#16a34a" />
                              <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>
                                {m.customerMobile}
                              </Typography>
                            </Box>
                          )}
                          {m.customerAddress && (
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px' }}>
                              {m.customerAddress}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      {/* Store */}
                      <TableCell sx={{ py: 1.8 }}>
                        <Chip
                          icon={<Building size={12} />}
                          label={m.storeName || 'N/A'}
                          size="small"
                          sx={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#475569' }}
                        />
                      </TableCell>

                      {/* Date */}
                      <TableCell sx={{ py: 1.8 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Calendar size={14} color="#64748b" />
                          <Typography variant="body2" sx={{ color: '#334155', fontSize: '12px' }}>
                            {m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Price */}
                      <TableCell sx={{ py: 1.8 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '13px' }}>
                          {m.price ? `₹${Number(m.price).toLocaleString('en-IN')}` : 'N/A'}
                        </Typography>
                      </TableCell>

                      {/* Scanned Codes */}
                      <TableCell sx={{ py: 1.8, maxWidth: 220 }}>
                        {codesArray.length > 0 ? (
                          <Tooltip title={codesArray.join(', ')} arrow placement="top">
                            <Chip
                              icon={<Barcode size={12} />}
                              label={codesArray.length === 1 ? codesArray[0] : `${codesArray.length} scanned codes`}
                              size="small"
                              sx={{
                                fontFamily: 'monospace',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                maxWidth: 200,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            />
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>—</Typography>
                        )}
                      </TableCell>

                      {/* Updated At */}
                      <TableCell sx={{ py: 1.8 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Clock size={12} color="#94a3b8" />
                          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px' }}>
                            {m.updatedAt ? new Date(m.updatedAt).toLocaleString('en-IN') : 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Table Footer Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
            Showing {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} records
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              Rows per page:
            </Typography>
            <Select
              size="small"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              sx={{ borderRadius: 1.5, height: 32, fontSize: '12px' }}
            >
              {[5, 10, 20, 50, 100].map((val) => (
                <MenuItem key={val} value={val}>{val}</MenuItem>
              ))}
            </Select>

            <Button
              size="small"
              variant="outlined"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              sx={{ borderRadius: 2, textTransform: 'none', fontSize: '12px' }}
            >
              Previous
            </Button>

            <Typography variant="caption" fontWeight={700} sx={{ color: '#0f172a', px: 1 }}>
              Page {currentPage} of {totalPages || 1}
            </Typography>

            <Button
              size="small"
              variant="outlined"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              sx={{ borderRadius: 2, textTransform: 'none', fontSize: '12px' }}
            >
              Next
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default History;
