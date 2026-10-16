import React, { useState, useEffect } from 'react';
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
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Inventory2Icon from '@mui/icons-material/Inventory2';

const DISPATCH_API_URL = 'https://coloroninventoy.onrender.com/api/dispatch';
const PRODUCTS_API_URL = 'https://coloroninventoy.onrender.com/api/products';

export default function RecentOutwardView({ onNavigateHome }) {
  const [outwardData, setOutwardData] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dispatchRes, productRes] = await Promise.all([
          fetch(DISPATCH_API_URL),
          fetch(PRODUCTS_API_URL)
        ]);

        const dispatchData = await dispatchRes.json();
        const productData = await productRes.json();

        // Sort most recent first
        const sorted = dispatchData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setOutwardData(sorted);
        setProducts(productData);
      } catch (error) {
        console.error('Error fetching recent outward data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getProductImage = (modelNo) => {
    if (!modelNo) return '';
    const product = products.find(p =>
      (p.model || p.modelNo || p.name || '').trim().toLowerCase() === modelNo.trim().toLowerCase()
    );
    return product?.productImage || '';
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  const filteredData = outwardData.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (item.modelNo && item.modelNo.toLowerCase().includes(searchLower)) ||
      (item.customerName && item.customerName.toLowerCase().includes(searchLower)) ||
      (item.invoiceNumber && item.invoiceNumber.toLowerCase().includes(searchLower))
    );
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
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
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>Recent Outward</Typography>
      </Breadcrumbs>

      {/* Header and Search */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={onNavigateHome} sx={{ color: '#112a46', '&:hover': { backgroundColor: 'rgba(17, 42, 70, 0.1)' } }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#112a46', textTransform: 'uppercase' }}>
            Recent Outward
          </Typography>
        </Box>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search records..."
          value={searchQuery}
          onChange={handleSearch}
          sx={{ backgroundColor: '#fff', borderRadius: 1, minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Table Container */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f4f6f8', color: '#4b5563' }}>MODEL NO.</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f4f6f8', color: '#4b5563' }}>INVOICE NO.</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f4f6f8', color: '#4b5563' }}>CUSTOMER</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f4f6f8', color: '#4b5563' }}>DATE</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f4f6f8', color: '#4b5563', align: 'center' }}>QTY</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f4f6f8', color: '#4b5563', align: 'right' }}>PRICE (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, color: '#6b7280' }}>
                    No recent outward records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => {
                    const productImage = getProductImage(row.modelNo);
                    return (
                      <TableRow key={index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 40, height: 40, borderRadius: 1, backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee', overflow: 'hidden', flexShrink: 0 }}>
                              {productImage ? (
                                <img 
                                  src={`https://coloroninventoy.onrender.com/uploads/${productImage}`} 
                                  alt={row.modelNo}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) {
                                      e.target.nextSibling.style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              <Box sx={{ display: productImage ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                <Inventory2Icon sx={{ fontSize: 20 }} />
                              </Box>
                            </Box>
                            <Typography variant="body2" fontWeight={500} color="#112a46">
                              {row.modelNo || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{row.invoiceNumber || '-'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{row.customerName || '-'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{new Date(row.createdAt).toLocaleDateString()}</Typography></TableCell>
                        <TableCell align="center">
                          <Box sx={{ 
                            display: 'inline-block', px: 1.5, py: 0.5, borderRadius: 1, 
                            backgroundColor: '#fef2f2', color: '#ef4444', fontWeight: 600, fontSize: '0.85rem' 
                          }}>
                            {row.qty || row.quantity || 1}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ 
                            display: 'inline-block', px: 1.5, py: 0.5, borderRadius: 1, 
                            backgroundColor: '#ecfdf5', color: '#059669', fontWeight: 600, fontSize: '0.85rem' 
                          }}>
                            ₹{row.price ?? 0}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid #e0e0e0' }}
        />
      </Paper>
    </Box>
  );
}
