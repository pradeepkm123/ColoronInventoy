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

const API_URL = 'http://localhost:5002/api/products';

export default function LowStockView({ onNavigateHome }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        // Matching the widget's low stock logic
        const filtered = data.filter((product) => Number(product.reorderLevel) <= 5);
        setProducts(filtered);
      } catch (error) {
        console.error('Error fetching low stock products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLowStock();
  }, []);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  const filteredProducts = products.filter((product) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (product.brand && product.brand.toLowerCase().includes(searchLower)) ||
      (product.model && product.model.toLowerCase().includes(searchLower)) ||
      (product.category && product.category.toLowerCase().includes(searchLower))
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
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>Low Stock</Typography>
      </Breadcrumbs>

      {/* Header and Search */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={onNavigateHome} sx={{ color: '#112a46', '&:hover': { backgroundColor: 'rgba(17, 42, 70, 0.1)' } }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#112a46' }}>
            LOW STOCK PRODUCTS
          </Typography>
        </Box>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search product..."
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
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f4f6f8', color: '#4b5563' }}>PRODUCT NAME</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f4f6f8', color: '#4b5563' }}>CODE</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f4f6f8', color: '#4b5563' }}>CATEGORY</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f4f6f8', color: '#4b5563' }}>BRAND</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f4f6f8', color: '#4b5563' }}>LOCATION</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f4f6f8', color: '#4b5563', align: 'center' }}>QTY</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f4f6f8', color: '#4b5563', align: 'center' }}>ALERT</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: '#6b7280' }}>
                    No low stock products found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => (
                    <TableRow key={index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {row.productImage ? (
                          <img 
                            src={`http://localhost:5002/${row.productImage.replace(/\\/g, '/')}`} 
                            alt={row.model}
                            style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', border: '1px solid #eee' }} 
                          />
                        ) : (
                          <Box sx={{ width: 40, height: 40, borderRadius: 1, backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee' }}>
                            <Typography variant="caption" color="text.secondary">IMG</Typography>
                          </Box>
                        )}
                        <Typography variant="body2" fontWeight={500} color="#112a46">
                          {row.model || 'Unknown Product'}
                        </Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{row.model || '-'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{row.category || '-'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{row.brand || '-'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">Main Warehouse</Typography></TableCell>
                      <TableCell align="center">
                        <Box sx={{ 
                          display: 'inline-block', px: 1.5, py: 0.5, borderRadius: 1, 
                          backgroundColor: '#fef2f2', color: '#ef4444', fontWeight: 600, fontSize: '0.85rem' 
                        }}>
                          {row.reorderLevel || 0}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ 
                          display: 'inline-block', px: 1.5, py: 0.5, borderRadius: 1, 
                          backgroundColor: '#fffbeb', color: '#d97706', fontWeight: 600, fontSize: '0.85rem' 
                        }}>
                          {row.reorderLevel || 5}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredProducts.length}
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
