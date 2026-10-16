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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CategoryIcon from '@mui/icons-material/Category';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SpeedIcon from '@mui/icons-material/Speed';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import { useUser } from './UserContext';

const DISPATCH_API_URL = 'https://coloroninventoy.onrender.com/api/dispatch';
const PRODUCTS_API_URL = 'https://coloroninventoy.onrender.com/api/products';
const STORES_API_URL = 'https://coloroninventoy.onrender.com/api/locations';

export default function TopSellingProductsView({ onNavigateHome }) {
  const { user } = useUser();
  const [dispatches, setDispatches] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Determine if logged in user is Super Admin / Admin / HO / Manager
  const isAdminOrHO = useMemo(() => {
    if (!user) return true;
    const role = (user.role || '').toLowerCase().trim();
    const loc = (
      user.assignedLocation ||
      user.customerStore ||
      user.staffLocation ||
      user.warehouseName ||
      ''
    ).toLowerCase().trim();
    return (
      ['admin', 'super admin', 'manager', 'ho', 'lookman ho'].includes(role) ||
      ['ho', 'lookman ho', 'head office'].includes(loc) ||
      role.includes('admin') ||
      role.includes('manager')
    );
  }, [user]);

  // Filter States
  const [selectedStore, setSelectedStore] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSpeed, setSelectedSpeed] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dispatchRes, productsRes] = await Promise.all([
          fetch(DISPATCH_API_URL),
          fetch(PRODUCTS_API_URL)
        ]);

        const dispatchData = await dispatchRes.json();
        const productsData = await productsRes.json();

        // Create product mapping by model
        const pMap = {};
        if (Array.isArray(productsData)) {
          productsData.forEach(p => {
            const key = (p.model || p.name || '').trim().toLowerCase();
            if (key) {
              pMap[key] = p;
            }
          });
        }

        setDispatches(Array.isArray(dispatchData) ? dispatchData : []);
        setProductsMap(pMap);
      } catch (error) {
        console.error('Error fetching top selling data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Extract unique store/customer names from dispatches
  const storeOptions = useMemo(() => {
    const storesSet = new Set();
    dispatches.forEach(d => {
      const store = d.storeName || d.customerName || d.dispatchTo;
      if (store && store.trim()) {
        storesSet.add(store.trim());
      }
    });
    return Array.from(storesSet).sort();
  }, [dispatches]);

  // Automatically set default store: 'ALL' for Admin/HO, or user's assigned store for store users
  useEffect(() => {
    if (!isAdminOrHO && storeOptions.length > 0 && user) {
      const userStore = (
        user.assignedLocation ||
        user.customerStore ||
        user.role ||
        user.staffLocation ||
        ''
      ).toLowerCase().trim();

      if (userStore) {
        const matchedStore = storeOptions.find(
          s => s.toLowerCase().trim() === userStore ||
               userStore.includes(s.toLowerCase().trim()) ||
               s.toLowerCase().trim().includes(userStore)
        );
        if (matchedStore) {
          setSelectedStore(matchedStore);
        }
      }
    } else if (isAdminOrHO) {
      setSelectedStore('ALL');
    }
  }, [isAdminOrHO, storeOptions, user]);

  // Aggregate sales per product model (filtered by store)
  const aggregatedProducts = useMemo(() => {
    const map = {};

    dispatches.forEach(item => {
      const storeName = item.storeName || item.customerName || item.dispatchTo || '';
      
      // Apply store filter
      if (selectedStore !== 'ALL' && storeName.trim().toLowerCase() !== selectedStore.trim().toLowerCase()) {
        return;
      }

      const modelNo = item.modelNo || 'Unknown Model';
      const key = modelNo.trim().toLowerCase();
      const qty = Number(item.quantity ?? item.qty ?? 0);
      const price = Number(item.price ?? item.unitPrice ?? 0);

      if (!map[key]) {
        const matchedProduct = productsMap[key] || {};
        map[key] = {
          modelNo: modelNo,
          category: matchedProduct.category || 'General',
          brand: matchedProduct.brand || 'Unbranded',
          productImage: matchedProduct.productImage || '',
          totalQuantitySold: 0,
          totalRevenue: 0,
          storesCount: new Set(),
          lastSoldDate: item.createdAt || item.dispatchDate,
        };
      }

      map[key].totalQuantitySold += qty;
      map[key].totalRevenue += (qty * price);
      if (storeName) map[key].storesCount.add(storeName);
      
      const itemDate = new Date(item.createdAt || item.dispatchDate);
      if (itemDate > new Date(map[key].lastSoldDate)) {
        map[key].lastSoldDate = item.createdAt || item.dispatchDate;
      }
    });

    // Convert map to array & calculate maximum sales volume for velocity tiers
    const list = Object.values(map);
    const maxSales = list.length > 0 ? Math.max(...list.map(i => i.totalQuantitySold)) : 0;

    // Assign velocity speed (Faster, Medium, Slower) based on relative sales
    return list.map(item => {
      let speed = 'Medium';
      let speedColor = '#F59E0B'; // Amber
      let speedBg = '#FEF3C7';
      let speedBorder = '#FDE68A';

      const ratio = maxSales > 0 ? item.totalQuantitySold / maxSales : 0;

      if (ratio >= 0.5 || item.totalQuantitySold >= 40) {
        speed = 'Faster';
        speedColor = '#047857';
        speedBg = '#ECFDF5';
        speedBorder = '#A7F3D0';
      } else if (ratio < 0.2 || item.totalQuantitySold <= 10) {
        speed = 'Slower';
        speedColor = '#B91C1C';
        speedBg = '#FEF2F2';
        speedBorder = '#FCA5A5';
      } else {
        speed = 'Medium';
        speedColor = '#B45309';
        speedBg = '#FEF3C7';
        speedBorder = '#FDE68A';
      }

      return {
        ...item,
        speed,
        speedColor,
        speedBg,
        speedBorder,
        storesCountNumber: item.storesCount.size
      };
    }).sort((a, b) => b.totalQuantitySold - a.totalQuantitySold);
  }, [dispatches, productsMap, selectedStore]);

  // Extract unique categories
  const categoryOptions = useMemo(() => {
    const categoriesSet = new Set();
    aggregatedProducts.forEach(p => {
      if (p.category) categoriesSet.add(p.category);
    });
    return Array.from(categoriesSet).sort();
  }, [aggregatedProducts]);

  // Apply Search, Category, and Speed Filters
  const filteredProducts = useMemo(() => {
    return aggregatedProducts.filter(item => {
      // Category filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      // Speed filter
      if (selectedSpeed !== 'ALL' && item.speed !== selectedSpeed) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const modelMatch = item.modelNo.toLowerCase().includes(query);
        const categoryMatch = item.category.toLowerCase().includes(query);
        const brandMatch = item.brand.toLowerCase().includes(query);
        return modelMatch || categoryMatch || brandMatch;
      }
      return true;
    });
  }, [aggregatedProducts, selectedCategory, selectedSpeed, searchQuery]);

  // Category-wise summary stats
  const categoryStats = useMemo(() => {
    const stats = {};
    aggregatedProducts.forEach(p => {
      const cat = p.category || 'General';
      if (!stats[cat]) {
        stats[cat] = { totalSold: 0, revenue: 0, faster: 0, medium: 0, slower: 0 };
      }
      stats[cat].totalSold += p.totalQuantitySold;
      stats[cat].revenue += p.totalRevenue;
      if (p.speed === 'Faster') stats[cat].faster++;
      else if (p.speed === 'Medium') stats[cat].medium++;
      else if (p.speed === 'Slower') stats[cat].slower++;
    });
    return stats;
  }, [aggregatedProducts]);

  // Overall Statistics
  const totalUnitsSold = useMemo(() => aggregatedProducts.reduce((sum, i) => sum + i.totalQuantitySold, 0), [aggregatedProducts]);
  const totalRevenue = useMemo(() => aggregatedProducts.reduce((sum, i) => sum + i.totalRevenue, 0), [aggregatedProducts]);
  const fasterCount = useMemo(() => aggregatedProducts.filter(i => i.speed === 'Faster').length, [aggregatedProducts]);
  const mediumCount = useMemo(() => aggregatedProducts.filter(i => i.speed === 'Medium').length, [aggregatedProducts]);
  const slowerCount = useMemo(() => aggregatedProducts.filter(i => i.speed === 'Slower').length, [aggregatedProducts]);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f8f9fa', minHeight: '100vh', width: '100%', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }}>
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
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>Top Selling Products</Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton onClick={onNavigateHome} sx={{ color: '#112a46', '&:hover': { backgroundColor: 'rgba(17, 42, 70, 0.1)' } }}>
            <ArrowBackIcon />
          </IconButton>
          <div>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#112a46' }}>
              TOP SELLING PRODUCTS
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Category & Store Performance Analytics
            </Typography>
          </div>
        </Box>

        {/* Store Selector Dropdown */}
        <FormControl sx={{ minWidth: 260, backgroundColor: 'white', borderRadius: 2 }}>
          <InputLabel id="store-select-label" sx={{ fontWeight: 600, color: '#4b5563' }}>Filter by Store</InputLabel>
          <Select
            labelId="store-select-label"
            value={selectedStore}
            label="Filter by Store"
            onChange={(e) => {
              setSelectedStore(e.target.value);
              setPage(0);
            }}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="ALL">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: '#1e3a8a' }}>
                <StorefrontIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                Inventory HO
              </Box>
            </MenuItem>
            {storeOptions.map((store, idx) => (
              <MenuItem key={idx} value={store}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorefrontIcon sx={{ color: '#9ca3af', fontSize: 18 }} />
                  {store}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Full-Width KPI Cards Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        width: '100%',
        marginBottom: '24px'
      }}>
        {/* Card 1: Total Units Sold */}
        <Paper sx={{
          p: 2.5,
          borderRadius: 3,
          borderLeft: '6px solid #3b82f6',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 600, mb: 0.5 }}>
              Total Units Sold
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', mb: 0.5 }}>
              {totalUnitsSold.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 600 }}>
              {aggregatedProducts.length} Products Traced
            </Typography>
          </div>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            backgroundColor: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3b82f6',
            flexShrink: 0
          }}>
            <ShoppingBagIcon fontSize="medium" />
          </Box>
        </Paper>

        {/* Card 2: Total Revenue */}
        <Paper sx={{
          p: 2.5,
          borderRadius: 3,
          borderLeft: '6px solid #10b981',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 600, mb: 0.5 }}>
              Total Revenue
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', mb: 0.5 }}>
              ₹{totalRevenue.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
              Gross Sales Amount
            </Typography>
          </div>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            backgroundColor: '#ECFDF5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981',
            flexShrink: 0
          }}>
            <CurrencyRupeeIcon fontSize="medium" />
          </Box>
        </Paper>

        {/* Card 3: Faster Selling */}
        <Paper sx={{
          p: 2.5,
          borderRadius: 3,
          borderLeft: '6px solid #059669',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 600, mb: 0.5 }}>
              🟢 Faster Selling
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#059669', mb: 0.5 }}>
              {fasterCount}
            </Typography>
            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
              High Velocity Products
            </Typography>
          </div>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            backgroundColor: '#D1FAE5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#059669',
            flexShrink: 0
          }}>
            <TrendingUpIcon fontSize="medium" />
          </Box>
        </Paper>

        {/* Card 4: Medium & Slower Selling */}
        <Paper sx={{
          p: 2.5,
          borderRadius: 3,
          borderLeft: '6px solid #f59e0b',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 600, mb: 0.5 }}>
              🟡 Medium & 🔴 Slower
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#d97706', mb: 0.5 }}>
              {mediumCount} <span style={{ fontSize: '20px', color: '#dc2626', fontWeight: 700 }}>/ {slowerCount}</span>
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
              Moderate & Slow Velocity
            </Typography>
          </div>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            backgroundColor: '#FEF3C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d97706',
            flexShrink: 0
          }}>
            <SpeedIcon fontSize="medium" />
          </Box>
        </Paper>
      </div>

      {/* Category Performance Summary Row */}
      <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3, backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: '#111827', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CategoryIcon sx={{ color: '#3b82f6' }} /> Category-Wise Selling Speed Breakdown
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(categoryStats).map(([catName, stats]) => (
            <Grid item xs={12} sm={6} md={4} key={catName}>
              <Box sx={{ p: 1.5, border: '1px solid #e5e7eb', borderRadius: 2, backgroundColor: '#f9fafb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#1f2937' }}>{catName}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6' }}>{stats.totalSold} sold</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Chip
                    label={`🟢 ${stats.faster} Faster`}
                    size="small"
                    sx={{
                      backgroundColor: stats.faster > 0 ? '#ECFDF5' : '#F9FAFB',
                      color: stats.faster > 0 ? '#047857' : '#9CA3AF',
                      border: `1px solid ${stats.faster > 0 ? '#A7F3D0' : '#E5E7EB'}`,
                      fontWeight: stats.faster > 0 ? 600 : 400,
                      fontSize: '11px',
                      height: '24px'
                    }}
                  />
                  <Chip
                    label={`🟡 ${stats.medium} Medium`}
                    size="small"
                    sx={{
                      backgroundColor: stats.medium > 0 ? '#FEF3C7' : '#F9FAFB',
                      color: stats.medium > 0 ? '#B45309' : '#9CA3AF',
                      border: `1px solid ${stats.medium > 0 ? '#FDE68A' : '#E5E7EB'}`,
                      fontWeight: stats.medium > 0 ? 600 : 400,
                      fontSize: '11px',
                      height: '24px'
                    }}
                  />
                  <Chip
                    label={`🔴 ${stats.slower} Slower`}
                    size="small"
                    sx={{
                      backgroundColor: stats.slower > 0 ? '#FEF2F2' : '#F9FAFB',
                      color: stats.slower > 0 ? '#B91C1C' : '#9CA3AF',
                      border: `1px solid ${stats.slower > 0 ? '#FCA5A5' : '#E5E7EB'}`,
                      fontWeight: stats.slower > 0 ? 600 : 400,
                      fontSize: '11px',
                      height: '24px'
                    }}
                  />
                </div>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Main Table Paper */}
      <Paper sx={{ width: '100%', borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {/* Controls Header (Search & Speed Filter) */}
        <Box sx={{ p: 2.5, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <TextField
              size="small"
              placeholder="Search product model, brand, category..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#9ca3af' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 320, backgroundColor: 'white' }}
            />

            {/* Category Dropdown */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                value={selectedCategory}
                label="Category"
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="ALL">All Categories</MenuItem>
                {categoryOptions.map((cat, idx) => (
                  <MenuItem key={idx} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Speed Filter Dropdown */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="speed-filter-label">Selling Speed</InputLabel>
              <Select
                labelId="speed-filter-label"
                value={selectedSpeed}
                label="Selling Speed"
                onChange={(e) => {
                  setSelectedSpeed(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="ALL">All Speeds</MenuItem>
                <MenuItem value="Faster">🟢 Faster Selling</MenuItem>
                <MenuItem value="Medium">🟡 Medium Selling</MenuItem>
                <MenuItem value="Slower">🔴 Slower Selling</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
            Showing {filteredProducts.length} items
          </Typography>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table sx={{ minWidth: 700 }} aria-label="top selling products table">
            <TableHead sx={{ backgroundColor: '#112a46' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 700, width: 70 }}>Rank</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Product Model</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Category & Brand</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Selling Speed</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 700 }}>Units Sold</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 700 }}>Revenue (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#9ca3af' }}>
                    No top selling products match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => {
                    const globalRank = page * rowsPerPage + index + 1;
                    const imageUrl = row.productImage
                      ? `https://coloroninventoy.onrender.com/uploads/${row.productImage}`
                      : '/placeholder.png';

                    return (
                      <TableRow key={row.modelNo} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              backgroundColor: globalRank <= 3 ? '#FF6B35' : '#f3f4f6',
                              color: globalRank <= 3 ? 'white' : '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 13,
                            }}
                          >
                            {globalRank}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 2,
                                backgroundColor: '#f3f4f6',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {row.productImage ? (
                                <img
                                  src={imageUrl}
                                  alt={row.modelNo}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <Box sx={{ display: row.productImage ? 'none' : 'flex', color: '#9ca3af' }}>
                                <Inventory2Icon fontSize="small" />
                              </Box>
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#111827' }}>
                                {row.modelNo}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                {row.storesCountNumber} Store{row.storesCountNumber !== 1 ? 's' : ''} Sold
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                            {row.category}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                            Brand: {row.brand}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={
                              row.speed === 'Faster'
                                ? '🟢 Faster Selling'
                                : row.speed === 'Medium'
                                ? '🟡 Medium Selling'
                                : '🔴 Slower Selling'
                            }
                            sx={{
                              backgroundColor: row.speedBg,
                              color: row.speedColor,
                              border: `1px solid ${row.speedBorder}`,
                              fontWeight: 700,
                              fontSize: '12px',
                              px: 1,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" sx={{ fontWeight: 700, color: '#111827' }}>
                            {row.totalQuantitySold.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6b7280' }}>
                            Units
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" sx={{ fontWeight: 700, color: '#059669' }}>
                            ₹{row.totalRevenue.toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredProducts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}
