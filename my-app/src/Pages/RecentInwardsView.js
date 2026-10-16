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

const API_URL = 'https://coloroninventoy.onrender.com/api/inventory';

export default function RecentInwardsView({ onNavigateHome }) {
  const [inwardData, setInwardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchInward = async () => {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        // Sort most recent first
        const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setInwardData(sorted);
      } catch (error) {
        console.error('Error fetching recent inwards:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInward();
  }, []);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  const filteredData = inwardData.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (item.modelNo && item.modelNo.toLowerCase().includes(searchLower)) ||
      (item.location && item.location.toLowerCase().includes(searchLower))
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
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>Recent Inwards</Typography>
      </Breadcrumbs>

      {/* Header and Search */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={onNavigateHome} sx={{ color: '#112a46', '&:hover': { backgroundColor: 'rgba(17, 42, 70, 0.1)' } }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#112a46', textTransform: 'uppercase' }}>
            Recent Inwards
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
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f4f6f8', color: '#4b5563' }}>LOCATION</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f4f6f8', color: '#4b5563' }}>DATE</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f4f6f8', color: '#4b5563', align: 'center' }}>QTY</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f4f6f8', color: '#4b5563', align: 'right' }}>PRICE (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5, color: '#6b7280' }}>
                    No recent inward records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => (
                    <TableRow key={index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {row.productImage ? (
                            <img 
                              src={`https://coloroninventoy.onrender.com/uploads/${row.productImage}`} 
                              alt={row.modelNo}
                              style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', border: '1px solid #eee' }} 
                            />
                          ) : (
                            <Box sx={{ width: 40, height: 40, borderRadius: 1, backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee' }}>
                              <Typography variant="caption" color="text.secondary">IMG</Typography>
                            </Box>
                          )}
                          <Typography variant="body2" fontWeight={500} color="#112a46">
                            {row.modelNo || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{row.location || '-'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{new Date(row.createdAt).toLocaleDateString()}</Typography></TableCell>
                      <TableCell align="center">
                        <Box sx={{ 
                          display: 'inline-block', px: 1.5, py: 0.5, borderRadius: 1, 
                          backgroundColor: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: '0.85rem' 
                        }}>
                          {row.quantity || 0}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ 
                          display: 'inline-block', px: 1.5, py: 0.5, borderRadius: 1, 
                          backgroundColor: '#ecfdf5', color: '#059669', fontWeight: 600, fontSize: '0.85rem' 
                        }}>
                          ₹{row.dealerPrice ?? 0}
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
