import React, { useEffect, useState, useMemo } from 'react';
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
  Chip,
  IconButton,
  Breadcrumbs,
  Link,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import StarIcon from '@mui/icons-material/Star';
import { useUser } from './UserContext';

const AVATAR_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function TopCustomersView({ onNavigateHome }) {
  const { user } = useUser();
  const [dispatches, setDispatches] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dispatchRes, custRes] = await Promise.all([
          fetch('http://localhost:5002/api/dispatch'),
          fetch('http://localhost:5002/api/customers')
        ]);

        const dispatchData = await dispatchRes.json();
        const customerData = await custRes.json();

        // Customer details lookup map
        const detailsMap = {};
        if (Array.isArray(customerData)) {
          customerData.forEach(c => {
            const key = (c.name || c.company || '').trim().toLowerCase();
            if (key) {
              detailsMap[key] = {
                location: c.city || c.address || c.state || 'JAIPUR',
                email: c.email || '',
                phone: c.phone || ''
              };
            }
          });
        }

        // Aggregate customer purchases from dispatch
        const custMap = {};
        if (Array.isArray(dispatchData)) {
          dispatchData.forEach(item => {
            const rawName = item.customerName || item.storeName || item.dispatchTo || 'Walk-in Customer';
            const name = rawName.toUpperCase().trim();
            const key = name.toLowerCase();
            const qty = Number(item.quantity ?? item.qty ?? 1);
            const price = Number(item.price ?? item.unitPrice ?? 0);
            const cat = (item.category || 'General').toUpperCase();

            if (!custMap[key]) {
              const meta = detailsMap[key] || {};
              custMap[key] = {
                name,
                ordersCount: 0,
                totalSpend: 0,
                location: (meta.location || item.customerAddress || item.city || 'JAIPUR').toUpperCase(),
                categoriesMap: {}
              };
            }
            custMap[key].ordersCount += 1;
            custMap[key].totalSpend += (qty * price);
            custMap[key].categoriesMap[cat] = (custMap[key].categoriesMap[cat] || 0) + qty;
          });
        }

        const sorted = Object.values(custMap).map(c => {
          // Find top category for customer
          let topCat = 'General';
          let maxCatQty = 0;
          Object.entries(c.categoriesMap).forEach(([cat, qty]) => {
            if (qty > maxCatQty) {
              maxCatQty = qty;
              topCat = cat;
            }
          });

          // Assign tier status badge
          let tier = 'Standard Buyer';
          let tierBg = '#F3F4F6';
          let tierColor = '#4B5563';

          if (c.totalSpend >= 5000000 || c.ordersCount >= 30) {
            tier = 'VIP Customer';
            tierBg = '#FEF3C7';
            tierColor = '#D97706';
          } else if (c.totalSpend >= 1000000 || c.ordersCount >= 10) {
            tier = 'Frequent Buyer';
            tierBg = '#ECFDF5';
            tierColor = '#059669';
          }

          return {
            ...c,
            topCategory: topCat,
            tier,
            tierBg,
            tierColor
          };
        }).sort((a, b) => b.totalSpend - a.totalSpend);

        setCustomersList(sorted);
      } catch (err) {
        console.error('Error fetching top customers view:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Unique location list
  const locationOptions = useMemo(() => {
    const locs = new Set();
    customersList.forEach(c => {
      if (c.location) locs.add(c.location);
    });
    return Array.from(locs).sort();
  }, [customersList]);

  // Filtered list
  const filteredCustomers = useMemo(() => {
    return customersList.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.topCategory.toLowerCase().includes(searchQuery.toLowerCase());

      const matchLoc = selectedLocation === 'ALL' || c.location === selectedLocation;

      return matchSearch && matchLoc;
    });
  }, [customersList, searchQuery, selectedLocation]);

  // KPI Metrics
  const totalRevenue = useMemo(() => customersList.reduce((acc, c) => acc + c.totalSpend, 0), [customersList]);
  const totalOrders = useMemo(() => customersList.reduce((acc, c) => acc + c.ordersCount, 0), [customersList]);
  const topCustomerName = customersList.length > 0 ? customersList[0].name : 'N/A';

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
          color="inherit"
          onClick={onNavigateHome}
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px', color: '#6b7280' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>Top Customers Analytics</Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton onClick={onNavigateHome} sx={{ color: '#112a46', '&:hover': { backgroundColor: 'rgba(17, 42, 70, 0.1)' } }}>
            <ArrowBackIcon />
          </IconButton>
          <div>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#112a46' }}>
              TOP CUSTOMERS ANALYTICS
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Customer Purchasing & Revenue Breakdown
            </Typography>
          </div>
        </Box>

        {/* Location Dropdown */}
        <FormControl sx={{ minWidth: 220, backgroundColor: 'white', borderRadius: 2 }}>
          <InputLabel id="location-select-label" sx={{ fontWeight: 600, color: '#4b5563' }}>Filter by City</InputLabel>
          <Select
            labelId="location-select-label"
            value={selectedLocation}
            label="Filter by City"
            onChange={(e) => {
              setSelectedLocation(e.target.value);
              setPage(0);
            }}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="ALL">
              <strong>All Cities</strong>
            </MenuItem>
            {locationOptions.map((loc, idx) => (
              <MenuItem key={idx} value={loc}>
                {loc}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* KPI Cards Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Total Customers */}
        <Paper sx={{ p: 2.5, borderRadius: 3, borderLeft: '6px solid #3b82f6', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 600, mb: 0.5 }}>
              Total Customers
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', mb: 0.5 }}>
              {customersList.length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 600 }}>
              Active Purchasing Accounts
            </Typography>
          </div>
          <Box sx={{ width: 48, height: 48, borderRadius: 2.5, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <GroupsIcon fontSize="medium" />
          </Box>
        </Paper>

        {/* Card 2: Total Revenue */}
        <Paper sx={{ p: 2.5, borderRadius: 3, borderLeft: '6px solid #10b981', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 600, mb: 0.5 }}>
              Total Revenue
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#10b981', mb: 0.5 }}>
              ₹{totalRevenue.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
              Customer Gross Volume
            </Typography>
          </div>
          <Box sx={{ width: 48, height: 48, borderRadius: 2.5, backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <CurrencyRupeeIcon fontSize="medium" />
          </Box>
        </Paper>

        {/* Card 3: Total Orders */}
        <Paper sx={{ p: 2.5, borderRadius: 3, borderLeft: '6px solid #f59e0b', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 600, mb: 0.5 }}>
              Total Orders
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#d97706', mb: 0.5 }}>
              {totalOrders}
            </Typography>
            <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 600 }}>
              Dispatch Invoices
            </Typography>
          </div>
          <Box sx={{ width: 48, height: 48, borderRadius: 2.5, backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
            <ShoppingBagIcon fontSize="medium" />
          </Box>
        </Paper>

        {/* Card 4: Top Account */}
        <Paper sx={{ p: 2.5, borderRadius: 3, borderLeft: '6px solid #8b5cf6', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 600, mb: 0.5 }}>
              #1 Customer
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#6d28d9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
              {topCustomerName}
            </Typography>
            <Typography variant="caption" sx={{ color: '#8b5cf6', fontWeight: 600 }}>
              Highest Sales Volume
            </Typography>
          </div>
          <Box sx={{ width: 48, height: 48, borderRadius: 2.5, backgroundColor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
            <StarIcon fontSize="medium" />
          </Box>
        </Paper>
      </div>

      {/* Main Table Paper Container */}
      <Paper sx={{ width: '100%', borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        {/* Search Toolbar */}
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderBottom: '1px solid #f3f4f6' }}>
          <TextField
            placeholder="Search customer name, location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            size="small"
            sx={{ width: 340 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9ca3af' }} />
                </InputAdornment>
              ),
            }}
          />
          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
            Showing {filteredCustomers.length} Customer{filteredCustomers.length !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* Data Table */}
        <TableContainer>
          <Table sx={{ minWidth: 700 }} aria-label="top customers table">
            <TableHead sx={{ backgroundColor: '#112a46' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 700, width: 80 }}>Rank</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Customer Name & Location</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }} align="center">Total Orders</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Top Category</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }} align="center">Customer Tier</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }} align="right">Total Revenue</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#9ca3af' }}>
                    No customers found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => {
                    const globalRank = page * rowsPerPage + index + 1;
                    const avatarBg = AVATAR_COLORS[(globalRank - 1) % AVATAR_COLORS.length];

                    return (
                      <TableRow key={index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        {/* Rank */}
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

                        {/* Name & Location */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              sx={{
                                width: 42,
                                height: 42,
                                borderRadius: 2.5,
                                backgroundColor: avatarBg,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 16,
                                flexShrink: 0
                              }}
                            >
                              {row.name.charAt(0).toUpperCase()}
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#111827' }}>
                                {row.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                {row.location}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Orders Count */}
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827' }}>
                            {row.ordersCount}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6b7280' }}>
                            Orders
                          </Typography>
                        </TableCell>

                        {/* Top Category */}
                        <TableCell>
                          <Chip
                            label={row.topCategory}
                            size="small"
                            sx={{ backgroundColor: '#F1F5F9', color: '#334155', fontWeight: 600, fontSize: '11px' }}
                          />
                        </TableCell>

                        {/* Customer Tier */}
                        <TableCell align="center">
                          <Chip
                            label={row.tier}
                            size="small"
                            sx={{
                              backgroundColor: row.tierBg,
                              color: row.tierColor,
                              fontWeight: 700,
                              fontSize: '11px',
                              px: 1
                            }}
                          />
                        </TableCell>

                        {/* Total Revenue */}
                        <TableCell align="right">
                          <Typography variant="body1" sx={{ fontWeight: 800, color: '#111827' }}>
                            ₹{row.totalSpend.toLocaleString()}
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
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}
