import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  ArrowLeft,
  Package,
  Search,
  RotateCcw,
  Building2,
  Phone,
  Mail,
  MapPin,
  User,
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  IndianRupee,
  CheckCircle2,
  Calendar,
  Barcode,
  PackageX,
  X,
} from 'lucide-react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
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
import WarehouseIcon from '@mui/icons-material/Warehouse';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useSnackbar } from 'notistack';
import { useUser } from './UserContext';
import './InventoryDashboard.css';

const API = 'http://localhost:5002/api';

const WarehouseStoreDetails = () => {
  const { user } = useUser();
  const { enqueueSnackbar } = useSnackbar();

  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [inwards, setInwards] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination for warehouse detail tabs
  const [tabIndex, setTabIndex] = useState(0); // 0 = Inventory, 1 = Inward, 2 = Outward
  const [invPage, setInvPage] = useState(0);
  const [invRowsPerPage, setInvRowsPerPage] = useState(10);
  const [inwardPage, setInwardPage] = useState(0);
  const [inwardRowsPerPage, setInwardRowsPerPage] = useState(10);
  const [dispatchPage, setDispatchPage] = useState(0);
  const [dispatchRowsPerPage, setDispatchRowsPerPage] = useState(10);

  // Date Filtering States for Detail View
  const now = new Date();
  const [detailSearch, setDetailSearch] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState('all'); // 'all', 'today', 'thisMonth', 'monthYear', 'custom'
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Serial codes modal
  const [selectedSerials, setSelectedSerials] = useState(null);

  // Helper formatting
  const inr = (n) => `₹ ${Number(n || 0).toLocaleString('en-IN')}`;
  const norm = (s) => (s ?? '').toString().trim().toLowerCase();

  const handleResetFilters = () => {
    setDetailSearch('');
    setDateFilterMode('all');
    setFromDate('');
    setToDate('');
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [whRes, userRes, prodRes, invRes, dispRes, inwRes] = await Promise.all([
        axios.get(`${API}/warehouses`).catch(() => ({ data: [] })),
        axios.get(`${API}/users`).catch(() => ({ data: [] })),
        axios.get(`${API}/products`).catch(() => ({ data: [] })),
        axios.get(`${API}/inventory`).catch(() => ({ data: [] })),
        axios.get(`${API}/dispatch`).catch(() => ({ data: [] })),
        axios.get(`${API}/store-inward`).catch(() => ({ data: [] })),
      ]);

      const rawWh = Array.isArray(whRes.data) ? whRes.data : [];
      const rawUsers = userRes.data?.users || (Array.isArray(userRes.data) ? userRes.data : []);
      const rawProducts = Array.isArray(prodRes.data) ? prodRes.data : [];
      const rawInv = Array.isArray(invRes.data) ? invRes.data : [];
      const rawDisp = Array.isArray(dispRes.data) ? dispRes.data : [];
      const rawInw = inwRes.data?.movements || (Array.isArray(inwRes.data) ? inwRes.data : []);

      setUsersList(rawUsers);
      setProducts(rawProducts);
      setInventory(rawInv);
      setDispatches(rawDisp);
      setInwards(rawInw);

      // Strict filter: ONLY show User Accounts from DB where role === 'Warehouse'
      const warehouseUserAccounts = rawUsers.filter((u) => {
        const r = (u.role || '').trim().toLowerCase();
        return r === 'warehouse';
      });

      const whList = warehouseUserAccounts.map((u) => {
        const facilityName = (u.warehouseName || u.assignedLocation || u.locationTag || u.name || 'Warehouse').toUpperCase();
        const locationAddress = u.assignedLocation || u.warehouseName || u.locationTag || 'Warehouse Facility';

        return {
          _id: u._id,
          name: facilityName,
          rawWarehouseName: u.warehouseName || u.assignedLocation || u.locationTag || u.name || '',
          contactPerson: u.name || 'Warehouse Manager',
          email: u.email || '—',
          phoneNo: u.phoneNumber || u.phone || '—',
          address: locationAddress,
          city: u.assignedLocation || u.warehouseName || '',
          state: '',
          status: true,
          role: u.role,
          userAccount: u,
        };
      });

      setWarehouses(whList);
    } catch (err) {
      console.error('Failed to load warehouse store data:', err);
      enqueueSnackbar('Failed to load warehouse data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Pricing lookup map
  const productMap = useMemo(() => {
    const map = {};
    for (const p of products) {
      const key = (p.modelNo || p.model || '').toString().trim().toLowerCase();
      if (key) map[key] = p;
    }
    return map;
  }, [products]);

  // Filter warehouses based on user account
  const filteredWarehouses = useMemo(() => {
    const isStandardAdmin = ['admin', 'super admin', 'manager'].includes((user?.role || '').toLowerCase());
    const assignedWh = (user?.warehouseName || user?.assignedLocation || '').toLowerCase();

    return warehouses.filter((wh) => {
      // Role scope: If not admin, only show this user's assigned warehouse
      if (!isStandardAdmin && assignedWh) {
        const match = norm(wh.name).includes(assignedWh) || assignedWh.includes(norm(wh.name));
        if (!match) return false;
      }

      // Search query filter
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        wh.name.toLowerCase().includes(q) ||
        wh.contactPerson.toLowerCase().includes(q) ||
        wh.email.toLowerCase().includes(q) ||
        wh.phoneNo.toLowerCase().includes(q) ||
        (wh.address && wh.address.toLowerCase().includes(q))
      );
    });
  }, [warehouses, user, searchTerm]);


  // Date Filter matching helper
  const matchesDateFilter = useCallback((dateVal) => {
    if (dateFilterMode === 'all') return true;
    if (!dateVal) return false;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return false;

    const today = new Date();
    if (dateFilterMode === 'today') {
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    } else if (dateFilterMode === 'thisMonth') {
      return (
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    } else if (dateFilterMode === 'monthYear') {
      return (
        d.getMonth() === Number(selectedMonth) &&
        d.getFullYear() === Number(selectedYear)
      );
    } else if (dateFilterMode === 'custom' || fromDate || toDate) {
      if (fromDate) {
        const start = new Date(fromDate + 'T00:00:00');
        if (d < start) return false;
      }
      if (toDate) {
        const end = new Date(toDate + 'T23:59:59');
        if (d > end) return false;
      }
      return true;
    }
    return true;
  }, [dateFilterMode, selectedMonth, selectedYear, fromDate, toDate]);

  // Warehouse specific data
  const warehouseInventory = useMemo(() => {
    if (!selectedWarehouse) return [];
    const whName = norm(selectedWarehouse.rawWarehouseName || selectedWarehouse.name);
    const contact = norm(selectedWarehouse.contactPerson);
    const email = norm(selectedWarehouse.email);

    return inventory
      .filter((item) => {
        const loc = norm(item.location || item.storeName || item.warehouse || '');
        const owner = norm(item.owner || item.userId || '');
        const matchLoc =
          loc.includes(whName) ||
          whName.includes(loc) ||
          owner.includes(contact) ||
          owner.includes(email);
        if (!matchLoc) return false;

        // Search query
        if (detailSearch.trim()) {
          const q = detailSearch.toLowerCase();
          const matchModel = (item.modelNo || item.model || '').toLowerCase().includes(q);
          const matchCat = (item.category || '').toLowerCase().includes(q);
          const matchSub = (item.subCategory || '').toLowerCase().includes(q);
          if (!matchModel && !matchCat && !matchSub) return false;
        }

        return true;
      })
      .map((item) => {
        const mKey = (item.modelNo || item.model || '').toString().trim().toLowerCase();
        const prod = productMap[mKey];
        const unitPrice = Number(item.price || item.dealerPrice || prod?.dealerPrice || prod?.mrp || 0);
        const qty = Number(item.quantity || item.stock || 0);
        return {
          ...item,
          modelNo: item.modelNo || item.model || 'Unknown',
          category: item.category || prod?.category || '—',
          subCategory: item.subCategory || prod?.subCategory || '—',
          unitPrice,
          totalValue: unitPrice * qty,
          quantity: qty,
        };
      });
  }, [selectedWarehouse, inventory, productMap, detailSearch]);

  const warehouseInwards = useMemo(() => {
    if (!selectedWarehouse) return [];
    const whName = norm(selectedWarehouse.rawWarehouseName || selectedWarehouse.name);
    const contact = norm(selectedWarehouse.contactPerson);

    return inwards
      .filter((item) => {
        const store = norm(item.storeName || item.location || '');
        const userField = norm(item.userId || item.salePerson || '');
        const matchStore = store.includes(whName) || whName.includes(store) || userField.includes(contact);
        if (!matchStore) return false;

        // Exclude products with 0 quantity (sold / outwarded)
        if (Number(item.quantity) === 0) return false;

        // Date filter
        const d = item.createdAt || item.date || item.dispatchDate;
        if (!matchesDateFilter(d)) return false;

        // Search query
        if (detailSearch.trim()) {
          const q = detailSearch.toLowerCase();
          const matchModel = (item.modelNo || item.model || '').toLowerCase().includes(q);
          const matchSP = (item.salePerson || item.userId || '').toLowerCase().includes(q);
          const matchSerials = (item.scannedBarcode || []).some(b => (b || '').toLowerCase().includes(q));
          if (!matchModel && !matchSP && !matchSerials) return false;
        }

        return true;
      })
      .map((item) => {
        const mKey = (item.modelNo || item.model || '').toString().trim().toLowerCase();
        const prod = productMap[mKey];
        const barcodesCount = Array.isArray(item.scannedBarcode) ? item.scannedBarcode.length : 0;
        const qty = Number(item.quantity) > 0 ? Number(item.quantity) : (barcodesCount > 0 ? barcodesCount : (Number(item.currentStock) || 0));
        const unitPrice = Number(item.dealerPrice || item.price || item.pricePerUnit || prod?.dealerPrice || prod?.mrp || 0);
        return {
          ...item,
          modelNo: item.modelNo || item.model || 'Unknown',
          quantity: qty,
          unitPrice,
          totalValue: unitPrice * qty,
        };
      });
  }, [selectedWarehouse, inwards, productMap, matchesDateFilter, detailSearch]);

  const warehouseDispatches = useMemo(() => {
    if (!selectedWarehouse) return [];
    const whName = norm(selectedWarehouse.rawWarehouseName || selectedWarehouse.name);
    const contact = norm(selectedWarehouse.contactPerson);

    return dispatches
      .filter((item) => {
        const store = norm(item.storeName || item.customerName || '');
        const sp = norm(item.salePerson || '');
        const matchStore = store.includes(whName) || whName.includes(store) || sp.includes(contact);
        if (!matchStore) return false;

        // Date filter
        const d = item.dispatchDate || item.createdAt;
        if (!matchesDateFilter(d)) return false;

        // Search query
        if (detailSearch.trim()) {
          const q = detailSearch.toLowerCase();
          const matchInv = (item.invoiceNumber || '').toLowerCase().includes(q);
          const matchModel = (item.modelNo || item.model || '').toLowerCase().includes(q);
          const matchSP = (item.salePerson || '').toLowerCase().includes(q);
          const matchBarcodes = (item.barcodes || []).some(b => (b || '').toLowerCase().includes(q));
          if (!matchInv && !matchModel && !matchSP && !matchBarcodes) return false;
        }

        return true;
      })
      .map((item) => {
        const mKey = (item.modelNo || item.model || '').toString().trim().toLowerCase();
        const prod = productMap[mKey];
        const barcodesCount = Array.isArray(item.barcodes) ? item.barcodes.length : 0;
        const qty = Number(item.quantity) > 0 ? Number(item.quantity) : (barcodesCount > 0 ? barcodesCount : 0);
        const unitPrice = Number(item.price || prod?.dealerPrice || prod?.mrp || 0);
        return {
          ...item,
          modelNo: item.modelNo || item.model || 'Unknown',
          quantity: qty,
          unitPrice,
          totalValue: unitPrice * qty,
        };
      });
  }, [selectedWarehouse, dispatches, productMap, matchesDateFilter, detailSearch]);

  // Dynamic KPIs based on active tab
  const currentTabMetrics = useMemo(() => {
    if (tabIndex === 0) {
      // Current Stock Tab
      const totalUnits = warehouseInventory.reduce((sum, i) => sum + i.quantity, 0);
      const totalVal = warehouseInventory.reduce((sum, i) => sum + i.totalValue, 0);
      const totalSKUs = new Set(warehouseInventory.map((i) => i.modelNo).filter(Boolean)).size;
      return {
        card1Title: 'Stock Value',
        card1Value: inr(totalVal),
        card2Title: 'Available Stock Units',
        card2Value: `${totalUnits.toLocaleString()} units`,
        card3Title: 'Total Products (SKUs)',
        card3Value: `${totalSKUs} models`,
      };
    } else if (tabIndex === 1) {
      // Stock Inward Movements Tab
      const totalUnits = warehouseInwards.reduce((sum, i) => sum + i.quantity, 0);
      const totalVal = warehouseInwards.reduce((sum, i) => sum + i.totalValue, 0);
      const totalSKUs = new Set(warehouseInwards.map((i) => i.modelNo).filter(Boolean)).size;
      return {
        card1Title: 'Inward Stock Value',
        card1Value: inr(totalVal),
        card2Title: 'Total Inward Units',
        card2Value: `${totalUnits.toLocaleString()} units`,
        card3Title: 'Inward Products (SKUs)',
        card3Value: `${totalSKUs} models`,
      };
    } else {
      // Dispatched Outward Tab
      const totalUnits = warehouseDispatches.reduce((sum, i) => sum + i.quantity, 0);
      const totalVal = warehouseDispatches.reduce((sum, i) => sum + i.totalValue, 0);
      const totalSKUs = new Set(warehouseDispatches.map((i) => i.modelNo).filter(Boolean)).size;
      return {
        card1Title: 'Dispatched Value',
        card1Value: inr(totalVal),
        card2Title: 'Total Dispatched Units',
        card2Value: `${totalUnits.toLocaleString()} units`,
        card3Title: 'Dispatched Products (SKUs)',
        card3Value: `${totalSKUs} models`,
      };
    }
  }, [tabIndex, warehouseInventory, warehouseInwards, warehouseDispatches]);

  const isSuperAdmin = ['admin', 'super admin', 'manager'].includes((user?.role || '').toLowerCase().trim());

  if (!isSuperAdmin) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', backgroundColor: '#f8fafc', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Paper sx={{ p: 4, borderRadius: 3, maxWidth: 450, textAlign: 'center', border: '1px solid #fee2e2', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <Box sx={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <Building2 size={28} />
          </Box>
          <Typography variant="h6" fontWeight={800} color="#b91c1c" mb={0.5}>
            Super Admin Access Only
          </Typography>
          <Typography variant="body2" color="#64748b">
            Warehouse Store Details dashboard is restricted to Super Admin users only.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      {/* Top Header */}
      <Box sx={{ mb: 3 }}>
        {selectedWarehouse ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => setSelectedWarehouse(null)}
              sx={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                p: 1,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                '&:hover': { backgroundColor: '#f1f5f9' },
              }}
            >
              <ArrowLeft size={20} color="#0f172a" />
            </IconButton>
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
                {selectedWarehouse.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mt: 0.2 }}>
                Warehouse account & real-time inventory management.
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  backgroundColor: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #bfdbfe',
                }}
              >
                <WarehouseIcon sx={{ color: '#2563eb', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
                  Warehouse Store Dashboard
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.2 }}>
                  Manage warehouse facilities, stock holdings, and user accounts.
                </Typography>
              </Box>
            </Box>

            {/* Search Warehouses */}
            <Box sx={{ minWidth: 260 }}>
              <TextField
                placeholder="Search warehouse stores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={17} color="#94a3b8" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, backgroundColor: '#ffffff' },
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* DASHBOARD VIEW: Warehouse Cards Grid */}
      {!selectedWarehouse ? (
        <>
          {/* Warehouse Store Cards Grid (Matching StoreDetails layout) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            {filteredWarehouses.map((wh) => (
              <Card
                key={wh._id || wh.name}
                onClick={() => {
                  setSelectedWarehouse(wh);
                  setTabIndex(0);
                }}
                sx={{
                  borderRadius: 3,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  backgroundColor: '#ffffff',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    borderColor: '#93c5fd',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header: Warehouse Name + Active Chip */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#03365b', fontSize: '1.05rem' }}>
                        {wh.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                        <MapPin size={13} color="#94a3b8" />
                        {wh.address || wh.city || 'Warehouse Facility'}
                      </Typography>
                    </Box>
                    <Chip
                      label="Active"
                      size="small"
                      sx={{
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        fontWeight: 700,
                        fontSize: '11px',
                        borderRadius: 1.5,
                      }}
                    />
                  </Box>

                  {/* Manager / Account Info Box */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      {wh.contactPerson ? wh.contactPerson.slice(0, 2).toUpperCase() : 'WH'}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#1e293b' }} noWrap>
                        {wh.contactPerson}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }} noWrap>
                        {wh.email || 'warehouse@lookman.in'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Phone & Meta Details */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #f1f5f9' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Phone size={14} color="#64748b" />
                      <Typography variant="caption" fontWeight={600} sx={{ color: '#475569' }}>
                        {wh.phoneNo}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 600 }}>
                      View Inventory →
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}

            {filteredWarehouses.length === 0 && (
              <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 8 }}>
                <PackageX size={44} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                <Typography variant="h6" color="#64748b" fontWeight={600}>
                  No warehouse store accounts found.
                </Typography>
              </Box>
            )}
          </Box>
        </>
      ) : (
        /* WAREHOUSE STORE DETAIL VIEW */
        <Box>
          {/* Dynamic Warehouse Summary Metrics */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 2.5,
              mb: 3,
            }}
          >
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', p: 2.5 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                {currentTabMetrics.card1Title}
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ color: '#7c3aed', mt: 0.5 }}>
                {currentTabMetrics.card1Value}
              </Typography>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', p: 2.5 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                {currentTabMetrics.card2Title}
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ color: '#16a34a', mt: 0.5 }}>
                {currentTabMetrics.card2Value}
              </Typography>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', p: 2.5 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                {currentTabMetrics.card3Title}
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ color: '#0284c7', mt: 0.5 }}>
                {currentTabMetrics.card3Value}
              </Typography>
            </Card>
          </Box>

          {/* Date Range & Search Filtering Toolbar for Detail View */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Search Input */}
                <Box sx={{ flex: 2, minWidth: { xs: '100%', sm: 260 } }}>
                  <TextField
                    placeholder="Search by model, category, serials, sales person..."
                    value={detailSearch}
                    onChange={(e) => setDetailSearch(e.target.value)}
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

                {/* Date Filter Preset */}
                <Box sx={{ flex: 1.2, minWidth: { xs: '100%', sm: 200 } }}>
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

                {/* Reset Filters Button */}
                {(dateFilterMode !== 'all' || detailSearch || fromDate || toDate) && (
                  <Tooltip title="Reset filters">
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
                        '&:hover': { backgroundColor: '#f1f5f9', borderColor: '#94a3b8' },
                      }}
                    >
                      Reset
                    </Button>
                  </Tooltip>
                )}
              </Box>

              {/* Month & Year Selection Row */}
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
                        {[2023, 2024, 2025, 2026, 2027, 2028].map((yr) => (
                          <MenuItem key={yr} value={yr}>{yr}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              )}

              {/* Custom Date Range Row */}
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
          </Paper>

          {/* Tab Navigation */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
            <Chip
              label={`Current Stock (${warehouseInventory.length})`}
              onClick={() => setTabIndex(0)}
              sx={{
                fontWeight: 700,
                fontSize: '13px',
                py: 2,
                px: 1,
                cursor: 'pointer',
                backgroundColor: tabIndex === 0 ? '#0f2b48' : '#ffffff',
                color: tabIndex === 0 ? '#ffffff' : '#475569',
                border: '1px solid #e2e8f0',
                '&:hover': { backgroundColor: tabIndex === 0 ? '#1e3a8a' : '#f1f5f9' },
              }}
            />
            <Chip
              label={`Stock Inward Movements (${warehouseInwards.length})`}
              onClick={() => setTabIndex(1)}
              sx={{
                fontWeight: 700,
                fontSize: '13px',
                py: 2,
                px: 1,
                cursor: 'pointer',
                backgroundColor: tabIndex === 1 ? '#0f2b48' : '#ffffff',
                color: tabIndex === 1 ? '#ffffff' : '#475569',
                border: '1px solid #e2e8f0',
                '&:hover': { backgroundColor: tabIndex === 1 ? '#1e3a8a' : '#f1f5f9' },
              }}
            />
            <Chip
              label={`Dispatched Outward (${warehouseDispatches.length})`}
              onClick={() => setTabIndex(2)}
              sx={{
                fontWeight: 700,
                fontSize: '13px',
                py: 2,
                px: 1,
                cursor: 'pointer',
                backgroundColor: tabIndex === 2 ? '#0f2b48' : '#ffffff',
                color: tabIndex === 2 ? '#ffffff' : '#475569',
                border: '1px solid #e2e8f0',
                '&:hover': { backgroundColor: tabIndex === 2 ? '#1e3a8a' : '#f1f5f9' },
              }}
            />
          </Box>

          {/* TAB 0: Current Stock Table */}
          {tabIndex === 0 && (
            <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', width: 50 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Model No</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Sub Category</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Available Qty</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Unit Price</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Total Stock Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {warehouseInventory
                      .slice(invPage * invRowsPerPage, invPage * invRowsPerPage + invRowsPerPage)
                      .map((item, idx) => (
                        <TableRow key={item._id || idx} hover>
                          <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>{invPage * invRowsPerPage + idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{item.modelNo}</TableCell>
                          <TableCell sx={{ color: '#475569' }}>{item.category}</TableCell>
                          <TableCell sx={{ color: '#475569' }}>{item.subCategory}</TableCell>
                          <TableCell>
                            <Chip
                              label={`${item.quantity} units`}
                              size="small"
                              sx={{
                                backgroundColor: item.quantity <= 5 ? '#fef2f2' : '#dcfce7',
                                color: item.quantity <= 5 ? '#dc2626' : '#15803d',
                                fontWeight: 700,
                                fontSize: '12px',
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#475569' }}>{inr(item.unitPrice)}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{inr(item.totalValue)}</TableCell>
                        </TableRow>
                      ))}

                    {warehouseInventory.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                          <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                            No inventory items currently registered for this warehouse.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={warehouseInventory.length}
                rowsPerPage={invRowsPerPage}
                page={invPage}
                onPageChange={(e, p) => setInvPage(p)}
                onRowsPerPageChange={(e) => {
                  setInvRowsPerPage(parseInt(e.target.value, 10));
                  setInvPage(0);
                }}
              />
            </Paper>
          )}

          {/* TAB 1: Stock Inward Table */}
          {tabIndex === 1 && (
            <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', width: 50 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Model No</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Serials / Barcodes</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Sales Person</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Inward Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {warehouseInwards
                      .slice(inwardPage * inwardRowsPerPage, inwardPage * inwardRowsPerPage + inwardRowsPerPage)
                      .map((item, idx) => (
                        <TableRow key={item._id || idx} hover>
                          <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>{inwardPage * inwardRowsPerPage + idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{item.modelNo || item.model}</TableCell>
                          <TableCell>
                            <Chip label={`${item.quantity} units`} size="small" sx={{ backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700 }} />
                          </TableCell>
                          <TableCell>
                            {item.scannedBarcode && item.scannedBarcode.length > 0 ? (
                              <Chip
                                icon={<Barcode size={13} />}
                                label={`${item.scannedBarcode.length} serials`}
                                size="small"
                                onClick={() => setSelectedSerials({ model: item.modelNo, barcodes: item.scannedBarcode })}
                                sx={{ cursor: 'pointer', backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }}
                              />
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell sx={{ color: '#475569' }}>{item.salePerson || item.userId || '—'}</TableCell>
                          <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>
                            {new Date(item.createdAt || item.date).toLocaleDateString('en-IN')}
                          </TableCell>
                        </TableRow>
                      ))}

                    {warehouseInwards.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                            No inward records logged for this warehouse.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={warehouseInwards.length}
                rowsPerPage={inwardRowsPerPage}
                page={inwardPage}
                onPageChange={(e, p) => setInwardPage(p)}
                onRowsPerPageChange={(e) => {
                  setInwardRowsPerPage(parseInt(e.target.value, 10));
                  setInwardPage(0);
                }}
              />
            </Paper>
          )}

          {/* TAB 2: Dispatches Table */}
          {tabIndex === 2 && (
            <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', width: 50 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Invoice No</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Model No</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Price</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Sales Person</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Dispatch Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {warehouseDispatches
                      .slice(dispatchPage * dispatchRowsPerPage, dispatchPage * dispatchRowsPerPage + dispatchRowsPerPage)
                      .map((item, idx) => (
                        <TableRow key={item._id || idx} hover>
                          <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>{dispatchPage * dispatchRowsPerPage + idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#1d4ed8', fontFamily: 'monospace' }}>{item.invoiceNumber || '—'}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{item.modelNo}</TableCell>
                          <TableCell>
                            <Chip label={`${item.quantity} units`} size="small" sx={{ backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700 }} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#475569' }}>{inr(item.price)}</TableCell>
                          <TableCell sx={{ color: '#475569' }}>{item.salePerson || '—'}</TableCell>
                          <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>
                            {new Date(item.dispatchDate || item.createdAt).toLocaleDateString('en-IN')}
                          </TableCell>
                        </TableRow>
                      ))}

                    {warehouseDispatches.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                          <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                            No dispatch records found for this warehouse.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={warehouseDispatches.length}
                rowsPerPage={dispatchRowsPerPage}
                page={dispatchPage}
                onPageChange={(e, p) => setDispatchPage(p)}
                onRowsPerPageChange={(e) => {
                  setDispatchRowsPerPage(parseInt(e.target.value, 10));
                  setDispatchPage(0);
                }}
              />
            </Paper>
          )}
        </Box>
      )}

      {/* Serials Dialog */}
      <Dialog
        open={Boolean(selectedSerials)}
        onClose={() => setSelectedSerials(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Serials for {selectedSerials?.model}
          </Typography>
          <IconButton size="small" onClick={() => setSelectedSerials(null)}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 300, overflowY: 'auto' }}>
            {(selectedSerials?.barcodes || []).map((code, idx) => (
              <Chip key={idx} label={code} size="small" sx={{ fontFamily: 'monospace' }} />
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default WarehouseStoreDetails;
