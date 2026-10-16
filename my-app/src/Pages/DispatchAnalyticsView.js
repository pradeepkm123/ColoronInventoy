import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Breadcrumbs,
  Link,
  CircularProgress,
  IconButton,
  ButtonGroup,
  Button,
  LinearProgress,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ClearIcon from '@mui/icons-material/Clear';
import BarChartIcon from '@mui/icons-material/BarChart';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const DISPATCH_API_URL = 'http://localhost:5002/api/dispatch';
const INVENTORY_VALUE_API_URL = 'http://localhost:5002/api/inventory/total-value';
const PRODUCTS_API_URL = 'http://localhost:5002/api/products';
const INVENTORY_API_URL = 'http://localhost:5002/api/inventory';

// Palette for Category graphic bars
const BAR_COLORS = [
  '#10B981', '#2563EB', '#8B5CF6', '#F59E0B', '#EC4899',
  '#06B6D4', '#D97706', '#64748B', '#059669', '#1E40AF'
];

// Normalize model string helper for reliable key matching
const normKey = (str) => (str || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

// Custom X-Axis Tick renderer to ensure clean, non-overlapping label strings
const CustomXAxisTick = (props) => {
  const { x, y, payload } = props;
  if (!payload || payload.value === undefined) return null;

  const rawVal = payload.value.toString();
  const parts = rawVal.split('___');
  const cat = parts[0] || '';
  const sub = parts[1] || '';

  let label = cat;
  if (sub && sub !== 'General' && sub.toLowerCase() !== cat.toLowerCase()) {
    label = `${cat} › ${sub}`;
  }

  // Truncate cleanly to max 14 chars to guarantee zero label collisions
  const displayLabel = label.length > 14 ? `${label.substring(0, 13)}…` : label;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="end"
        fill="#334155"
        fontSize={10.5}
        fontWeight={700}
        transform="rotate(-28)"
      >
        {displayLabel}
      </text>
    </g>
  );
};

export default function DispatchAnalyticsView({ onNavigateHome, initialTab = 'stock' }) {
  // Active Tab state: 'stock' (Total Value in Stock) or 'dispatch' (Total Dispatch Value)
  const [activeTab, setActiveTab] = useState(initialTab);

  const [dispatchData, setDispatchData] = useState([]);
  const [stockTotalValueApi, setStockTotalValueApi] = useState(0);
  const [products, setProducts] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date range filters for custom range
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  // Time frame state for Graphic: '1D', '1M', '1Y', 'ALL'
  const [timeFrame, setTimeFrame] = useState('1M');

  // Graphic filter state: 'ALL', 'FAST', 'MOVING', 'SLOW_MOVING', 'NON_MOVING'
  const [movementFilter, setMovementFilter] = useState('ALL');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dispatchRes, stockValueRes, productRes, inventoryRes] = await Promise.all([
          fetch(DISPATCH_API_URL),
          fetch(INVENTORY_VALUE_API_URL),
          fetch(PRODUCTS_API_URL),
          fetch(INVENTORY_API_URL),
        ]);

        const dispatchJson = await dispatchRes.json();
        const stockValueJson = await stockValueRes.json();
        const productJson = await productRes.json();
        const inventoryJson = await inventoryRes.json();

        const sortedDispatch = Array.isArray(dispatchJson)
          ? dispatchJson.sort((a, b) => new Date(b.dispatchDate || b.createdAt) - new Date(a.dispatchDate || a.createdAt))
          : [];

        setDispatchData(sortedDispatch);
        setStockTotalValueApi(stockValueJson?.totalValue || 0);
        setProducts(Array.isArray(productJson) ? productJson : []);
        setInventoryList(Array.isArray(inventoryJson) ? inventoryJson : []);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Map product model keys to Category and SubCategory
  const productCategoryMap = useMemo(() => {
    const catMap = {};
    const subCatMap = {};

    products.forEach((p) => {
      const key = normKey(p.model || p.modelNo);
      if (key) {
        if (p.category) catMap[key] = p.category;
        if (p.subCategory || p.subcategory || p.sub_category) {
          subCatMap[key] = p.subCategory || p.subcategory || p.sub_category;
        }
      }
    });

    inventoryList.forEach((inv) => {
      const key = normKey(inv.modelNo || inv.model);
      if (key) {
        if (inv.category && !catMap[key]) catMap[key] = inv.category;
        if ((inv.subCategory || inv.subcategory) && !subCatMap[key]) {
          subCatMap[key] = inv.subCategory || inv.subcategory;
        }
      }
    });

    return { catMap, subCatMap };
  }, [products, inventoryList]);

  // Compute stock quantity map using normalized model keys
  const stockQtyMap = useMemo(() => {
    const inwardMap = {};
    const outwardMap = {};

    if (Array.isArray(inventoryList)) {
      inventoryList.forEach((inv) => {
        const key = normKey(inv.modelNo || inv.model);
        if (key) {
          const q = Number(inv.quantity ?? inv.currentStock ?? inv.qty ?? 0);
          inwardMap[key] = (inwardMap[key] || 0) + q;
        }
      });
    }

    if (Array.isArray(dispatchData)) {
      dispatchData.forEach((disp) => {
        const key = normKey(disp.modelNo || disp.model);
        if (key) {
          const q = Number(disp.quantity ?? disp.qty ?? 1);
          outwardMap[key] = (outwardMap[key] || 0) + q;
        }
      });
    }

    const netMap = {};
    const allKeys = new Set([...Object.keys(inwardMap), ...Object.keys(outwardMap)]);
    allKeys.forEach((k) => {
      const inQty = inwardMap[k] || 0;
      const outQty = outwardMap[k] || 0;
      netMap[k] = Math.max(0, inQty - outQty);
    });

    return { inwardMap, outwardMap, netMap };
  }, [inventoryList, dispatchData]);

  // Helper to get in-stock quantity for a product row
  const getProductStockQty = (p) => {
    const key = normKey(p.model || p.modelNo);
    const directQty = Number(p.quantity ?? p.qty ?? p.stock ?? p.currentStock ?? 0);
    if (directQty > 0) return directQty;

    const inQty = stockQtyMap.inwardMap[key] || 0;
    const netQty = stockQtyMap.netMap[key] || 0;
    if (netQty > 0) return netQty;
    if (inQty > 0) return inQty;

    const fallbackQty = Number(p.reorderLevel ?? p.openingStock ?? 0);
    return fallbackQty > 0 ? fallbackQty : 0;
  };

  // Today's orders count
  const todaysOrdersCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return dispatchData.filter(item => {
      const itemDate = new Date(item.dispatchDate || item.createdAt).toISOString().split('T')[0];
      return itemDate === todayStr;
    }).length;
  }, [dispatchData]);

  // Calculate stock products total value sum
  const calculatedStockTotalValue = useMemo(() => {
    if (!products.length) return stockTotalValueApi;
    const sum = products.reduce((acc, p) => {
      const q = getProductStockQty(p);
      const pr = Number(p.dealerPrice ?? p.mrp ?? p.price ?? 0);
      return acc + (q * pr);
    }, 0);
    return sum > 0 ? sum : stockTotalValueApi;
  }, [products, stockTotalValueApi, stockQtyMap]);

  // Graphic Filtered Dispatches based on Date Range OR TimeFrame ('1D', '1M', '1Y', 'ALL')
  const graphicFilteredDispatch = useMemo(() => {
    // Priority 1: Custom Date Range Filter if set in Date Picker
    if (fromDate || toDate) {
      return dispatchData.filter((item) => {
        const rawDate = item.dispatchDate || item.createdAt || item.date;
        if (!rawDate) return false;
        const itemDate = new Date(rawDate);
        if (isNaN(itemDate.getTime())) return false;

        if (fromDate) {
          const start = new Date(fromDate);
          start.setHours(0, 0, 0, 0);
          if (itemDate < start) return false;
        }

        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          if (itemDate > end) return false;
        }

        return true;
      });
    }

    // Priority 2: Preset TimeFrame ('1D', '1M', '1Y', 'ALL')
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return dispatchData.filter((item) => {
      const rawDate = item.dispatchDate || item.createdAt || item.date;
      if (!rawDate) return timeFrame === 'ALL';

      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return timeFrame === 'ALL';

      if (timeFrame === '1D') {
        const itemDateStr = d.toISOString().split('T')[0];
        return itemDateStr === todayStr;
      }

      if (timeFrame === '1M') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }

      if (timeFrame === '1Y') {
        return d.getFullYear() === now.getFullYear();
      }

      return true; // 'ALL'
    });
  }, [dispatchData, fromDate, toDate, timeFrame]);

  // Category & Sub-Category 4-Tier Movement Velocity Analytics
  // (Fast Moving, Moving, Slow Moving, Non-Moving)
  const categorySubCatAnalytics = useMemo(() => {
    const catSubMap = {};

    // 1. Process all active products to capture Category & Sub-Category combinations
    products.forEach((p) => {
      const key = normKey(p.model || p.modelNo);
      const cat = p.category || productCategoryMap.catMap[key] || 'General';
      const subCat = p.subCategory || p.subcategory || productCategoryMap.subCatMap[key] || 'General';
      const comboKey = `${cat}___${subCat}`;

      if (!catSubMap[comboKey]) {
        catSubMap[comboKey] = {
          comboKey,
          category: cat,
          subCategory: subCat,
          dispatchedQty: 0,
          dispatchedValue: 0,
          productCount: 0,
          stockQty: 0,
          stockValue: 0,
        };
      }
      const stQty = getProductStockQty(p);
      const pr = Number(p.dealerPrice ?? p.mrp ?? p.price ?? 0);
      catSubMap[comboKey].productCount += 1;
      catSubMap[comboKey].stockQty += stQty;
      catSubMap[comboKey].stockValue += (stQty * pr);
    });

    // 2. Accumulate dispatches for period or custom date range
    graphicFilteredDispatch.forEach((item) => {
      const key = normKey(item.modelNo || item.model);
      const cat = item.category || productCategoryMap.catMap[key] || 'General';
      const subCat = item.subCategory || productCategoryMap.subCatMap[key] || 'General';
      const comboKey = `${cat}___${subCat}`;

      const qty = Number(item.quantity ?? item.qty ?? 1);
      const price = Number(item.price ?? item.singlePicPrice ?? item.unitPrice ?? 0);
      const val = qty * price;

      if (!catSubMap[comboKey]) {
        catSubMap[comboKey] = {
          comboKey,
          category: cat,
          subCategory: subCat,
          dispatchedQty: 0,
          dispatchedValue: 0,
          productCount: 1,
          stockQty: 0,
          stockValue: 0,
        };
      }

      catSubMap[comboKey].dispatchedQty += qty;
      catSubMap[comboKey].dispatchedValue += val;
    });

    const allList = Object.values(catSubMap);
    let totalOverallValue = 0;
    let totalOverallQty = 0;

    allList.forEach((item) => {
      totalOverallValue += item.dispatchedValue;
      totalOverallQty += item.dispatchedQty;

      // Classify Movement Status Velocity into 4 Tiers:
      // 1. FAST: Dispatched >= 15
      // 2. MOVING: Dispatched 6 to 14
      // 3. SLOW_MOVING: Dispatched 1 to 5
      // 4. NON_MOVING: Dispatched === 0
      if (item.dispatchedQty >= 15) {
        item.status = 'FAST';
        item.statusLabel = 'Fast Moving';
        item.badgeColor = '#10B981';
        item.badgeBg = '#ECFDF5';
      } else if (item.dispatchedQty >= 6) {
        item.status = 'MOVING';
        item.statusLabel = 'Moving';
        item.badgeColor = '#2563EB';
        item.badgeBg = '#EFF6FF';
      } else if (item.dispatchedQty >= 1) {
        item.status = 'SLOW_MOVING';
        item.statusLabel = 'Slow Moving';
        item.badgeColor = '#8B5CF6';
        item.badgeBg = '#F5F3FF';
      } else {
        item.status = 'NON_MOVING';
        item.statusLabel = 'Non-Moving';
        item.badgeColor = '#D97706';
        item.badgeBg = '#FEF3C7';
      }
    });

    // Summary Movement Counters for the 4 Velocity Tiers
    const fastList = allList.filter((i) => i.status === 'FAST');
    const movingList = allList.filter((i) => i.status === 'MOVING');
    const slowMovingList = allList.filter((i) => i.status === 'SLOW_MOVING');
    const nonMovingList = allList.filter((i) => i.status === 'NON_MOVING');

    const totalCount = allList.length || 1;

    const fastValueSum = fastList.reduce((s, i) => s + i.dispatchedValue, 0);
    const movingValueSum = movingList.reduce((s, i) => s + i.dispatchedValue, 0);
    const slowMovingValueSum = slowMovingList.reduce((s, i) => s + i.dispatchedValue, 0);
    const nonMovingValueSum = nonMovingList.reduce((s, i) => s + i.dispatchedValue, 0);

    const fastPct = ((fastList.length / totalCount) * 100).toFixed(1);
    const movingPct = ((movingList.length / totalCount) * 100).toFixed(1);
    const slowMovingPct = ((slowMovingList.length / totalCount) * 100).toFixed(1);
    const nonMovingPct = ((nonMovingList.length / totalCount) * 100).toFixed(1);

    // Sort list by dispatched value descending
    const sortedList = allList.sort((a, b) => b.dispatchedValue - a.dispatchedValue);

    return {
      allList: sortedList,
      totalOverallValue,
      totalOverallQty,
      fastStats: { count: fastList.length, value: fastValueSum, pct: fastPct, qty: fastList.reduce((s, i) => s + i.dispatchedQty, 0) },
      movingStats: { count: movingList.length, value: movingValueSum, pct: movingPct, qty: movingList.reduce((s, i) => s + i.dispatchedQty, 0) },
      slowMovingStats: { count: slowMovingList.length, value: slowMovingValueSum, pct: slowMovingPct, qty: slowMovingList.reduce((s, i) => s + i.dispatchedQty, 0) },
      nonMovingStats: { count: nonMovingList.length, value: nonMovingValueSum, pct: nonMovingPct },
    };
  }, [products, graphicFilteredDispatch, productCategoryMap]);

  // Clean Chart Display Data for the 4 Tiers
  const chartDisplayData = useMemo(() => {
    if (movementFilter === 'FAST') {
      return categorySubCatAnalytics.allList.filter((i) => i.status === 'FAST');
    }
    if (movementFilter === 'MOVING') {
      return categorySubCatAnalytics.allList.filter((i) => i.status === 'MOVING');
    }
    if (movementFilter === 'SLOW_MOVING') {
      return categorySubCatAnalytics.allList.filter((i) => i.status === 'SLOW_MOVING');
    }
    if (movementFilter === 'NON_MOVING') {
      // For Non-Moving items, sort by Tied-Up Stock Value so chart shows meaningful stock metrics!
      return categorySubCatAnalytics.allList
        .filter((i) => i.status === 'NON_MOVING')
        .sort((a, b) => b.stockValue - a.stockValue)
        .slice(0, 8);
    }
    // 'ALL': Show active categories with dispatches first to keep graphic clean & uncluttered
    const activeItems = categorySubCatAnalytics.allList.filter((i) => i.dispatchedValue > 0 || i.dispatchedQty > 0);
    return activeItems.length > 0 ? activeItems : categorySubCatAnalytics.allList.slice(0, 8);
  }, [categorySubCatAnalytics, movementFilter]);

  // Side List Display Data
  const sideListDisplayData = useMemo(() => {
    if (movementFilter === 'ALL') return categorySubCatAnalytics.allList;
    return categorySubCatAnalytics.allList.filter((i) => i.status === movementFilter);
  }, [categorySubCatAnalytics, movementFilter]);

  // Filtered Dispatch Transactions for Table & Total Value Card (Date-wise)
  const filteredDispatchData = useMemo(() => {
    return dispatchData.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (item.modelNo && item.modelNo.toLowerCase().includes(searchLower)) ||
        (item.customerName && item.customerName.toLowerCase().includes(searchLower)) ||
        (item.invoiceNumber && item.invoiceNumber.toLowerCase().includes(searchLower)) ||
        (item.salesPerson && item.salesPerson.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      const rawDate = item.dispatchDate || item.createdAt || item.date;
      if (!rawDate) return true;
      const itemDate = new Date(rawDate);
      if (isNaN(itemDate.getTime())) return true;

      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
      }

      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }

      return true;
    });
  }, [dispatchData, searchQuery, fromDate, toDate]);

  // Calculate total dispatch value dynamically based on date filter
  const totalDispatchValueSum = useMemo(() => {
    return filteredDispatchData.reduce((sum, item) => {
      const qty = Number(item.quantity ?? item.qty ?? 0);
      const price = Number(item.price ?? item.singlePicPrice ?? item.unitPrice ?? 0);
      return sum + (qty * price);
    }, 0);
  }, [filteredDispatchData]);

  // Filtered Stock Products for Table (when activeTab === 'stock')
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        (p.model && p.model.toLowerCase().includes(searchLower)) ||
        (p.category && p.category.toLowerCase().includes(searchLower)) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(searchLower)) ||
        (p.brand && p.brand.toLowerCase().includes(searchLower))
      );
    });
  }, [products, searchQuery]);

  // Handle Tab Switch
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(0);
    setSearchQuery('');
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClearDateFilter = () => {
    setFromDate(null);
    setToDate(null);
    setPage(0);
  };

  const formatCurrency = (val) =>
    typeof val === 'number' ? val.toLocaleString('en-IN') : '0';

  const formatDateDisplay = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Custom Rich Tooltip for Unique Graphic Chart
  const CustomGraphicTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isNonMoving = movementFilter === 'NON_MOVING';
      const sharePct = categorySubCatAnalytics.totalOverallValue > 0
        ? ((data.dispatchedValue / categorySubCatAnalytics.totalOverallValue) * 100).toFixed(1)
        : 0;

      const getBadgeLabel = (status) => {
        if (status === 'FAST') return '⚡ Fast';
        if (status === 'MOVING') return '🚚 Moving';
        if (status === 'SLOW_MOVING') return '🐢 Slow';
        return '🛑 Non-Moving';
      };

      return (
        <Paper elevation={6} sx={{ p: 2, backgroundColor: '#FFFFFF', border: '1.5px solid #CBD5E1', borderRadius: '12px', minWidth: '230px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '14px' }}>
              {data.category}
            </Typography>
            <Chip
              label={getBadgeLabel(data.status)}
              size="small"
              sx={{
                fontSize: '11px',
                fontWeight: 800,
                backgroundColor: data.badgeBg,
                color: data.badgeColor,
                height: '22px'
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5, fontWeight: 600 }}>
            Sub Category: <span style={{ color: '#0F172A' }}>{data.subCategory}</span>
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, borderTop: '1px solid #F1F5F9', pt: 1.2 }}>
            {isNonMoving ? (
              <>
                <Typography variant="body2" sx={{ color: '#D97706', fontWeight: 700, fontSize: '13.5px' }}>
                  Tied-Up Stock Value: <strong>₹{formatCurrency(data.stockValue)}</strong>
                </Typography>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                  In-Stock Remaining: <strong>{data.stockQty.toLocaleString('en-IN')} Units</strong>
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body2" sx={{ color: '#2563EB', fontWeight: 600, fontSize: '13px' }}>
                  Dispatched Qty: <strong>{data.dispatchedQty.toLocaleString('en-IN')} Pcs</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: '#059669', fontWeight: 700, fontSize: '14px' }}>
                  Dispatched Revenue: <strong>₹{formatCurrency(data.dispatchedValue)}</strong>
                </Typography>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>
                  Revenue Share: <strong>{sharePct}% of Total Dispatches</strong>
                </Typography>
              </>
            )}
          </Box>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#6c757d' }}
          onClick={onNavigateHome}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>
          {activeTab === 'stock' ? 'Stock Value Analytics' : 'Dispatch Analytics'}
        </Typography>
      </Breadcrumbs>

      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={onNavigateHome} sx={{ color: '#112a46', '&:hover': { backgroundColor: 'rgba(17, 42, 70, 0.1)' } }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', fontSize: '28px', lineHeight: '34px' }}>
              {activeTab === 'stock' ? 'Inventory Stock Analytics' : 'Dispatch Analytics'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '14px', mt: 0.5 }}>
              You have <span style={{ fontWeight: 700, color: '#D97706' }}>{todaysOrdersCount > 0 ? `${todaysOrdersCount}+` : '0'}</span> Orders, Today
            </Typography>
          </Box>
        </Box>

        {/* Date Range Picker Widget (Shown ONLY for Total Dispatch Value tab) */}
        {activeTab === 'dispatch' && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: '#FFFFFF',
            border: (fromDate || toDate) ? '1.5px solid #2563EB' : '1px solid #E5E7EB',
            borderRadius: '10px',
            px: 1.8,
            py: 0.8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease-in-out'
          }}>
            <CalendarTodayIcon sx={{ color: (fromDate || toDate) ? '#2563EB' : '#6B7280', fontSize: 18 }} />
            
            <ReactDatePicker
              selected={fromDate}
              onChange={(date) => { setFromDate(date); setPage(0); }}
              selectsStart
              startDate={fromDate}
              endDate={toDate}
              dateFormat="dd-MMM-yyyy"
              placeholderText="Start Date"
              customInput={
                <input
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '13px',
                    color: '#374151',
                    fontWeight: 600,
                    width: '92px',
                    cursor: 'pointer',
                    backgroundColor: 'transparent'
                  }}
                />
              }
            />
            
            <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 700 }}>-</Typography>
            
            <ReactDatePicker
              selected={toDate}
              onChange={(date) => { setToDate(date); setPage(0); }}
              selectsEnd
              startDate={fromDate}
              endDate={toDate}
              minDate={fromDate}
              dateFormat="dd-MMM-yyyy"
              placeholderText="End Date"
              customInput={
                <input
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '13px',
                    color: '#374151',
                    fontWeight: 600,
                    width: '92px',
                    cursor: 'pointer',
                    backgroundColor: 'transparent'
                  }}
                />
              }
            />

            {(fromDate || toDate) && (
              <IconButton size="small" onClick={handleClearDateFilter} sx={{ p: 0.2, ml: 0.5, backgroundColor: '#F3F4F6', '&:hover': { backgroundColor: '#E5E7EB' } }}>
                <ClearIcon sx={{ fontSize: 14, color: '#4B5563' }} />
              </IconButton>
            )}
          </Box>
        )}
      </Box>

      {/* Interactive KPI Cards Grid */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 3,
        mb: 4
      }}>
        {/* Card 1: Total Value in Stock (Solid Orange) */}
        <Paper
          elevation={0}
          onClick={() => handleTabChange('stock')}
          sx={{
            p: 3,
            borderRadius: '14px',
            backgroundColor: '#FF9F43',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: 2.5,
            cursor: 'pointer',
            opacity: activeTab === 'stock' ? 1 : 0.88,
            border: activeTab === 'stock' ? '3px solid #E65100' : '3px solid transparent',
            boxShadow: activeTab === 'stock' ? '0 8px 24px rgba(255, 159, 67, 0.38)' : '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.25s ease-in-out',
            transform: activeTab === 'stock' ? 'translateY(-2px)' : 'none',
            '&:hover': {
              opacity: 1,
              transform: 'translateY(-3px)',
              boxShadow: '0 10px 25px rgba(255, 159, 67, 0.45)'
            }
          }}
        >
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}>
            <DescriptionOutlinedIcon sx={{ color: '#FF8300', fontSize: 26 }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, fontSize: '13.5px', letterSpacing: '0.2px' }}>
              Total Value in Stock
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '25px', letterSpacing: '-0.5px' }}>
                ₹{formatCurrency(calculatedStockTotalValue)}
              </Typography>
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                color: '#E65100',
                px: 1.2,
                py: 0.3,
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
              }}>
                {products.length} Products
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Card 2: Total Dispatch Value (Solid Navy Blue) */}
        <Paper
          elevation={0}
          onClick={() => handleTabChange('dispatch')}
          sx={{
            p: 3,
            borderRadius: '14px',
            backgroundColor: '#0B2545',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: 2.5,
            cursor: 'pointer',
            opacity: activeTab === 'dispatch' ? 1 : 0.88,
            border: activeTab === 'dispatch' ? '3px solid #2563EB' : '3px solid transparent',
            boxShadow: activeTab === 'dispatch' ? '0 8px 24px rgba(11, 37, 69, 0.38)' : '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.25s ease-in-out',
            transform: activeTab === 'dispatch' ? 'translateY(-2px)' : 'none',
            '&:hover': {
              opacity: 1,
              transform: 'translateY(-3px)',
              boxShadow: '0 10px 25px rgba(11, 37, 69, 0.45)'
            }
          }}
        >
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}>
            <SyncAltIcon sx={{ color: '#0B2545', fontSize: 26 }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, fontSize: '13.5px', letterSpacing: '0.2px' }}>
              Total Dispatch Value {(fromDate || toDate) ? '(Date Filtered)' : ''}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '25px', letterSpacing: '-0.5px' }}>
                ₹{formatCurrency(totalDispatchValueSum)}
              </Typography>
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                px: 1.2,
                py: 0.3,
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700
              }}>
                {filteredDispatchData.length} Dispatches
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* UNIQUE MOVEMENT & CATEGORY/SUBCATEGORY GRAPHIC SECTION (SHOWN ONLY WHEN activeTab === 'dispatch') */}
      {activeTab === 'dispatch' && (
        <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #E5E7EB', p: 3, mb: 4, backgroundColor: '#FFFFFF' }}>
          {/* Graphic Header & Time Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChartIcon sx={{ color: '#2563EB', fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', fontSize: '19px' }}>
                  Product Movement & Category / Sub-Category Graphic
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '13px' }}>
                  Velocity classification (Fast Moving, Moving, Slow Moving, Non-Moving) with Category & Sub-Category share percentages
                </Typography>
              </Box>
            </Box>

            {/* Time Filter Controls (1D, 1M, 1Y, ALL) - Disabled visual hint when Custom Date Filter is Active */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: (fromDate || toDate) ? '#9CA3AF' : '#6B7280', fontWeight: 600, mr: 0.5 }}>
                Period:
              </Typography>
              <ButtonGroup size="small" variant="outlined" sx={{ backgroundColor: '#F9FAFB', borderRadius: '10px', p: 0.3, opacity: (fromDate || toDate) ? 0.6 : 1 }}>
                {[
                  { label: '1D (Today)', value: '1D' },
                  { label: '1M (Monthly)', value: '1M' },
                  { label: '1Y (Yearly)', value: '1Y' },
                  { label: 'All', value: 'ALL' },
                ].map((tf) => (
                  <Button
                    key={tf.value}
                    onClick={() => {
                      if (!fromDate && !toDate) setTimeFrame(tf.value);
                    }}
                    disabled={Boolean(fromDate || toDate)}
                    sx={{
                      px: 2,
                      py: 0.6,
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: '8px !important',
                      border: 'none !important',
                      backgroundColor: (!fromDate && !toDate && timeFrame === tf.value) ? '#0B2545' : 'transparent',
                      color: (!fromDate && !toDate && timeFrame === tf.value) ? '#FFFFFF' : '#4B5563',
                      boxShadow: (!fromDate && !toDate && timeFrame === tf.value) ? '0 2px 6px rgba(11,37,69,0.2)' : 'none',
                      '&:hover': {
                        backgroundColor: (!fromDate && !toDate && timeFrame === tf.value) ? '#0B2545' : '#E5E7EB',
                      }
                    }}
                  >
                    {tf.label}
                  </Button>
                ))}
              </ButtonGroup>
            </Box>
          </Box>

          {/* EXPLANATORY VELOCITY GUIDE BANNER (4 TIERS) */}
          <Box sx={{
            p: 2,
            borderRadius: '12px',
            backgroundColor: (fromDate || toDate) ? '#EFF6FF' : '#F8FAFC',
            border: (fromDate || toDate) ? '1.5px solid #BFDBFE' : '1px solid #E2E8F0',
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <InfoOutlinedIcon sx={{ color: '#2563EB', fontSize: 22 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '13.5px' }}>
                  4-Tier Velocity Rules ({(fromDate || toDate) ? `Filtered: ${formatDateDisplay(fromDate) || 'Start'} to ${formatDateDisplay(toDate) || 'Present'}` : `${timeFrame} Period`} Analytics):
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontSize: '12.5px' }}>
                  {(fromDate || toDate)
                    ? 'Graphic data is synchronized with your custom selected Date Filter range above.'
                    : 'Products are dynamically classified into Fast Moving, Moving, Slow Moving, and Non-Moving tiers.'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
              <Chip label="⚡ Fast Moving: ≥ 15 Units" size="small" sx={{ backgroundColor: '#ECFDF5', color: '#047857', fontWeight: 700, fontSize: '11.5px', border: '1px solid #A7F3D0' }} />
              <Chip label="🚚 Moving: 6 to 14 Units" size="small" sx={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, fontSize: '11.5px', border: '1px solid #BFDBFE' }} />
              <Chip label="🐢 Slow Moving: 1 to 5 Units" size="small" sx={{ backgroundColor: '#F5F3FF', color: '#6D28D9', fontWeight: 700, fontSize: '11.5px', border: '1px solid #DDD6FE' }} />
              <Chip label="🛑 Non-Moving: 0 Dispatches" size="small" sx={{ backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 700, fontSize: '11.5px', border: '1px solid #FDE68A' }} />
            </Box>
          </Box>

          {/* TOP 4 UNIQUE MOVEMENT CLASSIFICATION CARDS (FAST MOVING, MOVING, SLOW MOVING, NON-MOVING) */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
            gap: 2,
            mb: 3.5
          }}>
            {/* Card 1: Fast Moving Products */}
            <Box sx={{
              p: 2,
              borderRadius: '14px',
              backgroundColor: '#ECFDF5',
              border: '1.5px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Box sx={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FlashOnIcon sx={{ color: '#FFFFFF', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#047857', fontWeight: 700, textTransform: 'uppercase', fontSize: '10.5px' }}>
                    Fast Moving
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#065F46', fontSize: '17px', lineHeight: 1.2 }}>
                    ₹{formatCurrency(categorySubCatAnalytics.fastStats.value)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600, fontSize: '11px' }}>
                    {categorySubCatAnalytics.fastStats.qty.toLocaleString('en-IN')} Units
                  </Typography>
                </Box>
              </Box>

              <Box sx={{
                px: 1.2,
                py: 0.4,
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                color: '#059669',
                fontWeight: 800,
                fontSize: '11.5px',
                border: '1px solid #6EE7B7'
              }}>
                {categorySubCatAnalytics.fastStats.pct}%
              </Box>
            </Box>

            {/* Card 2: Moving Products */}
            <Box sx={{
              p: 2,
              borderRadius: '14px',
              backgroundColor: '#EFF6FF',
              border: '1.5px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Box sx={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <LocalShippingIcon sx={{ color: '#FFFFFF', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#1D4ED8', fontWeight: 700, textTransform: 'uppercase', fontSize: '10.5px' }}>
                    Moving
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1E40AF', fontSize: '17px', lineHeight: 1.2 }}>
                    ₹{formatCurrency(categorySubCatAnalytics.movingStats.value)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#1D4ED8', fontWeight: 600, fontSize: '11px' }}>
                    {categorySubCatAnalytics.movingStats.qty.toLocaleString('en-IN')} Units
                  </Typography>
                </Box>
              </Box>

              <Box sx={{
                px: 1.2,
                py: 0.4,
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                color: '#2563EB',
                fontWeight: 800,
                fontSize: '11.5px',
                border: '1px solid #93C5FD'
              }}>
                {categorySubCatAnalytics.movingStats.pct}%
              </Box>
            </Box>

            {/* Card 3: Slow Moving Products */}
            <Box sx={{
              p: 2,
              borderRadius: '14px',
              backgroundColor: '#F5F3FF',
              border: '1.5px solid #DDD6FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Box sx={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <HourglassEmptyIcon sx={{ color: '#FFFFFF', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#6D28D9', fontWeight: 700, textTransform: 'uppercase', fontSize: '10.5px' }}>
                    Slow Moving
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#5B21B6', fontSize: '17px', lineHeight: 1.2 }}>
                    ₹{formatCurrency(categorySubCatAnalytics.slowMovingStats.value)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6D28D9', fontWeight: 600, fontSize: '11px' }}>
                    {categorySubCatAnalytics.slowMovingStats.qty.toLocaleString('en-IN')} Units
                  </Typography>
                </Box>
              </Box>

              <Box sx={{
                px: 1.2,
                py: 0.4,
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                color: '#7C3AED',
                fontWeight: 800,
                fontSize: '11.5px',
                border: '1px solid #C4B5FD'
              }}>
                {categorySubCatAnalytics.slowMovingStats.pct}%
              </Box>
            </Box>

            {/* Card 4: Non-Moving Products */}
            <Box sx={{
              p: 2,
              borderRadius: '14px',
              backgroundColor: '#FEF3C7',
              border: '1.5px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Box sx={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <WarningAmberIcon sx={{ color: '#FFFFFF', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 700, textTransform: 'uppercase', fontSize: '10.5px' }}>
                    Non-Moving
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#92400E', fontSize: '17px', lineHeight: 1.2 }}>
                    {categorySubCatAnalytics.nonMovingStats.count} Items
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 600, fontSize: '11px' }}>
                    0 Dispatches
                  </Typography>
                </Box>
              </Box>

              <Box sx={{
                px: 1.2,
                py: 0.4,
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                color: '#D97706',
                fontWeight: 800,
                fontSize: '11.5px',
                border: '1px solid #FCD34D'
              }}>
                {categorySubCatAnalytics.nonMovingStats.pct}%
              </Box>
            </Box>
          </Box>

          {/* Graphic Movement Filter Tabs (4 Tiers) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 700, mr: 1 }}>
              Filter Graphic View:
            </Typography>
            {[
              { label: `All Active Categories (${categorySubCatAnalytics.fastStats.count + categorySubCatAnalytics.movingStats.count + categorySubCatAnalytics.slowMovingStats.count})`, value: 'ALL', color: '#111827' },
              { label: `⚡ Fast Moving (${categorySubCatAnalytics.fastStats.count})`, value: 'FAST', color: '#10B981' },
              { label: `🚚 Moving (${categorySubCatAnalytics.movingStats.count})`, value: 'MOVING', color: '#2563EB' },
              { label: `🐢 Slow Moving (${categorySubCatAnalytics.slowMovingStats.count})`, value: 'SLOW_MOVING', color: '#8B5CF6' },
              { label: `🛑 Non-Moving (${categorySubCatAnalytics.nonMovingStats.count})`, value: 'NON_MOVING', color: '#D97706' },
            ].map((tab) => (
              <Chip
                key={tab.value}
                label={tab.label}
                onClick={() => setMovementFilter(tab.value)}
                sx={{
                  fontWeight: 700,
                  fontSize: '12.5px',
                  py: 1.8,
                  px: 0.5,
                  cursor: 'pointer',
                  backgroundColor: movementFilter === tab.value ? tab.color : '#F3F4F6',
                  color: movementFilter === tab.value ? '#FFFFFF' : '#4B5563',
                  border: movementFilter === tab.value ? 'none' : '1px solid #E5E7EB',
                  '&:hover': {
                    backgroundColor: movementFilter === tab.value ? tab.color : '#E5E7EB',
                  }
                }}
              />
            ))}
          </Box>

          {/* Unique Graphic Chart & Category / Sub-Category Breakdown Cards */}
          {chartDisplayData.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center', color: '#9CA3AF' }}>
              No categories match the selected movement filter ({movementFilter}).
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, gap: 3, alignItems: 'start' }}>
              {/* Left Side: Clean Graphic Chart with Custom SVG Ticks */}
              <Box sx={{ height: 360, width: '100%', pt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartDisplayData}
                    margin={{ top: 15, right: 15, left: 5, bottom: 65 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="comboKey"
                      tick={<CustomXAxisTick />}
                      interval={0}
                      height={65}
                    />
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      stroke={movementFilter === 'NON_MOVING' ? '#D97706' : '#2563EB'}
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip content={<CustomGraphicTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                    
                    <Bar
                      yAxisId="left"
                      dataKey={movementFilter === 'NON_MOVING' ? 'stockValue' : 'dispatchedValue'}
                      name={movementFilter === 'NON_MOVING' ? 'Tied-Up Stock Value (₹)' : 'Dispatched Revenue Value (₹)'}
                      radius={[8, 8, 0, 0]}
                      maxBarSize={60}
                    >
                      {chartDisplayData.map((entry, index) => (
                        <Cell
                          key={`cell-movement-${index}`}
                          fill={movementFilter === 'NON_MOVING' ? '#F59E0B' : BAR_COLORS[index % BAR_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              {/* Right Side: Category & Sub-Category Detailed Metrics List */}
              <Box sx={{
                maxHeight: 360,
                overflowY: 'auto',
                pr: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-thumb': { backgroundColor: '#CBD5E1', borderRadius: '4px' }
              }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Category & Sub-Category Velocity Breakdown ({sideListDisplayData.length} Items)
                </Typography>

                {sideListDisplayData.map((item, idx) => {
                  const sharePct = categorySubCatAnalytics.totalOverallValue > 0
                    ? ((item.dispatchedValue / categorySubCatAnalytics.totalOverallValue) * 100).toFixed(1)
                    : 0;

                  const getBadgeText = (status) => {
                    if (status === 'FAST') return '⚡ Fast Moving';
                    if (status === 'MOVING') return '🚚 Moving';
                    if (status === 'SLOW_MOVING') return '🐢 Slow Moving';
                    return '🛑 Non-Moving';
                  };

                  return (
                    <Box
                      key={idx}
                      sx={{
                        p: 1.8,
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': { borderColor: item.badgeColor, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.badgeColor }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '14px' }}>
                            Category: {item.category}
                          </Typography>
                        </Box>

                        <Chip
                          label={getBadgeText(item.status)}
                          size="small"
                          sx={{
                            fontSize: '11px',
                            fontWeight: 800,
                            backgroundColor: item.badgeBg,
                            color: item.badgeColor,
                            height: '22px'
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                          Sub Category: <span style={{ color: '#0F172A', fontWeight: 700 }}>{item.subCategory}</span>
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: item.status === 'NON_MOVING' ? '#D97706' : '#059669', fontSize: '13.5px' }}>
                          {item.status === 'NON_MOVING' ? `₹${formatCurrency(item.stockValue)} (Stock)` : `₹${formatCurrency(item.dispatchedValue)}`}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
                        <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '12px' }}>
                          {item.status === 'NON_MOVING' ? `Remaining Stock: ${item.stockQty.toLocaleString('en-IN')} Units` : `Dispatched: ${item.dispatchedQty.toLocaleString('en-IN')} Units`}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#0F172A', fontSize: '12px', fontWeight: 700 }}>
                          {sharePct}% Share of Revenue
                        </Typography>
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={Number(sharePct)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#F1F5F9',
                          '& .MuiLinearProgress-bar': { backgroundColor: item.badgeColor, borderRadius: 3 }
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* Dynamic Table Section */}
      <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #E5E7EB', p: 3, backgroundColor: '#FFFFFF' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', fontSize: '18px' }}>
              {activeTab === 'stock' ? 'Stock Inventory Details' : 'Dispatch Details'}
            </Typography>
            {(fromDate || toDate) && activeTab === 'dispatch' && (
              <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 600 }}>
                Showing records from {formatDateDisplay(fromDate) || 'Start'} to {formatDateDisplay(toDate) || 'Present'} ({filteredDispatchData.length} records)
              </Typography>
            )}
          </Box>

          <TextField
            variant="outlined"
            placeholder={activeTab === 'stock' ? 'Search Model, Category, Sub Category...' : 'Search Model, Customer, Invoice...'}
            size="small"
            value={searchQuery}
            onChange={handleSearch}
            sx={{
              width: { xs: '100%', sm: '320px' },
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                backgroundColor: '#F9FAFB',
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9CA3AF' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer>
          <Table>
            {activeTab === 'stock' ? (
              /* TAB 1: STOCK INVENTORY TABLE HEAD (SUB CATEGORY INCLUDED) */
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#4B5563', fontSize: '12px', textTransform: 'uppercase' }}>Product / Model</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4B5563', fontSize: '12px', textTransform: 'uppercase' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4B5563', fontSize: '12px', textTransform: 'uppercase' }}>Sub Category</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4B5563', fontSize: '12px', textTransform: 'uppercase' }}>Brand</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4B5563', fontSize: '12px', textTransform: 'uppercase' }}>Location</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#4B5563', fontSize: '12px', textTransform: 'uppercase' }}>In-Stock Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#4B5563', fontSize: '12px', textTransform: 'uppercase' }}>Unit Price</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#4B5563', fontSize: '12px', textTransform: 'uppercase' }}>Total Stock Value</TableCell>
                </TableRow>
              </TableHead>
            ) : (
              /* TAB 2: DISPATCH DETAILS TABLE HEAD */
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#4B5563', fontSize: '12px', textTransform: 'uppercase' }}>Model No</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4B5563', fontSize: '12px', textTransform: 'uppercase' }}>Invoice No</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4B5563', fontSize: '12px', textTransform: 'uppercase' }}>Customer Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4B5563', fontSize: '12px', textTransform: 'uppercase' }}>Sales Person</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4B5563', fontSize: '12px', textTransform: 'uppercase' }}>Date / Time</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#4B5563', fontSize: '12px', textTransform: 'uppercase' }}>Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#4B5563', fontSize: '12px', textTransform: 'uppercase' }}>Single Pic Price</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#4B5563', fontSize: '12px', textTransform: 'uppercase' }}>Total Amount</TableCell>
                </TableRow>
              </TableHead>
            )}

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : activeTab === 'stock' ? (
                /* TAB 1: STOCK INVENTORY ROWS */
                filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#9CA3AF' }}>
                      No inventory products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, idx) => {
                      const qty = getProductStockQty(row);
                      const price = Number(row.dealerPrice ?? row.mrp ?? row.price ?? 0);
                      const totalValue = qty * price;
                      const subCategory = row.subCategory || row.subcategory || row.sub_category || '-';

                      return (
                        <TableRow key={idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 600, color: '#111827' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              {row.productImage ? (
                                <img
                                  src={`http://localhost:5002/${row.productImage.replace(/\\/g, '/')}`}
                                  alt={row.model}
                                  style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', border: '1px solid #eee' }}
                                  onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                                />
                              ) : null}
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                                {row.model || 'N/A'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: '#6B7280' }}>{row.category || '-'}</TableCell>
                          <TableCell sx={{ color: '#6B7280', fontWeight: 500 }}>{subCategory}</TableCell>
                          <TableCell sx={{ color: '#6B7280' }}>{row.brand || '-'}</TableCell>
                          <TableCell sx={{ color: '#6B7280' }}>Main Warehouse</TableCell>
                          <TableCell align="center">
                            <Box sx={{
                              display: 'inline-block', px: 1.5, py: 0.3, borderRadius: '8px',
                              backgroundColor: qty > 0 ? '#EFF6FF' : '#FEF2F2',
                              color: qty > 0 ? '#2563EB' : '#EF4444',
                              fontWeight: 700, fontSize: '13px'
                            }}>
                              {qty}
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#374151', fontWeight: 500 }}>
                            ₹{formatCurrency(price)}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{
                              display: 'inline-block', px: 1.5, py: 0.3, borderRadius: '8px',
                              backgroundColor: totalValue > 0 ? '#FEF3C7' : '#F3F4F6',
                              color: totalValue > 0 ? '#D97706' : '#9CA3AF',
                              fontWeight: 700, fontSize: '13px'
                            }}>
                              ₹{formatCurrency(totalValue)}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )
              ) : (
                /* TAB 2: DISPATCH DETAILS ROWS */
                filteredDispatchData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#9CA3AF' }}>
                      No dispatch transactions found for the selected date range.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDispatchData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, idx) => {
                      const qty = Number(row.quantity ?? row.qty ?? 1);
                      const price = Number(row.price ?? row.singlePicPrice ?? row.unitPrice ?? 0);
                      const lineTotal = qty * price;
                      const rowDate = row.dispatchDate || row.createdAt || row.date;

                      return (
                        <TableRow key={idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 600, color: '#111827' }}>
                            {row.modelNo || 'N/A'}
                          </TableCell>
                          <TableCell sx={{ color: '#6B7280' }}>
                            {row.invoiceNumber || '-'}
                          </TableCell>
                          <TableCell sx={{ color: '#374151', fontWeight: 500 }}>
                            {row.customerName || '-'}
                          </TableCell>
                          <TableCell sx={{ color: '#6B7280' }}>
                            {row.salesPerson || row.salePerson || '-'}
                          </TableCell>
                          <TableCell sx={{ color: '#6B7280', fontSize: '13px' }}>
                            {rowDate ? new Date(rowDate).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{
                              display: 'inline-block', px: 1.5, py: 0.3, borderRadius: '8px',
                              backgroundColor: '#FEF2F2', color: '#EF4444', fontWeight: 700, fontSize: '13px'
                            }}>
                              {qty}
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#374151', fontWeight: 500 }}>
                            ₹{formatCurrency(price)}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{
                              display: 'inline-block', px: 1.5, py: 0.3, borderRadius: '8px',
                              backgroundColor: '#ECFDF5', color: '#059669', fontWeight: 700, fontSize: '13.5px'
                            }}>
                              ₹{formatCurrency(lineTotal)}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={activeTab === 'stock' ? filteredProducts.length : filteredDispatchData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}
