import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
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
import {
  Wrench,
  Package,
  IndianRupee,
  MapPin,
  Search,
  Barcode,
  X,
  PackageX,
  CheckCircle2,
  AlertCircle,
  Tag,
  ShieldCheck,
  Layers,
  GitFork,
  ArrowLeftRight,
  ArrowRight,
} from 'lucide-react';
import { useSnackbar } from 'notistack';

const API_BASE = 'http://localhost:5002/api';

const Spares = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [spares, setSpares] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Serial codes modal
  const [selectedSerials, setSelectedSerials] = useState(null);

  // Transfer to Normal Inventory Modal State
  const [transferItem, setTransferItem] = useState(null);
  const [transferQty, setTransferQty] = useState(1);
  const [selectedBarcodesToTransfer, setSelectedBarcodesToTransfer] = useState([]);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  const fetchSpares = useCallback(async () => {
    try {
      const [invRes, prodRes] = await Promise.all([
        axios.get(`${API_BASE}/inventory`),
        axios.get(`${API_BASE}/products`)
      ]);

      const invList = Array.isArray(invRes.data) ? invRes.data : [];
      const prodList = Array.isArray(prodRes.data) ? prodRes.data : [];

      const prodMap = {};
      prodList.forEach(p => {
        if (p.model) prodMap[p.model] = p;
      });

      // 1. Spares from Inventory table (inwarded with isSpare: true or category/subCategory Spares)
      const spareInwards = invList
        .filter(inv => (inv.isSpare || inv.category === 'Spares' || inv.subCategory === 'Spares Inventory' || inv.subCategory === 'Spares') && (Number(inv.quantity) > 0) && (inv.active !== false))
        .map(inv => {
          const matchedProd = prodMap[inv.modelNo] || prodMap[inv.model];
          return {
            _id: inv._id,
            modelNo: inv.modelNo || inv.model || 'Unknown Model',
            location: inv.location || 'Main Warehouse',
            dealerPrice: inv.dealerPrice || matchedProd?.dealerPrice || matchedProd?.mrp || 0,
            quantity: Number(inv.quantity) || 0,
            scannedCodes: inv.scannedCodes || '',
            barcodes: inv.scannedCodes ? inv.scannedCodes.split(/[\n,]+/).map(c => c.trim()).filter(Boolean) : (inv.barcodes || []),
            brand: inv.brand || matchedProd?.brand || '—',
            category: matchedProd?.category || (inv.category !== 'Spares' ? inv.category : '') || '—',
            subCategory: matchedProd?.subCategory || (inv.subCategory !== 'Spares Inventory' ? inv.subCategory : '') || '—',
            warranty: inv.warrantyPeriod ? `${inv.warrantyPeriod} ${inv.warrantyUnit || 'YEARS'}` : (matchedProd?.warranty ? `${matchedProd.warranty} Years` : '—'),
            createdOn: inv.createdAt || inv.updatedAt || new Date(),
            isInventoryDoc: true
          };
        });

      // 2. Products flagged as isSpare
      const spareProducts = prodList
        .filter(p => p.isSpare && (Number(p.reorderLevel) > 0 || Number(p.quantity) > 0))
        .map(p => ({
          _id: p._id,
          modelNo: p.model || p.brand || 'Spare Product',
          location: 'Master Catalog',
          dealerPrice: p.dealerPrice || p.mrp || 0,
          quantity: p.reorderLevel || 0,
          scannedCodes: '',
          barcodes: [],
          brand: p.brand || '—',
          category: p.category || '—',
          subCategory: p.subCategory || '—',
          warranty: p.warranty ? `${p.warranty} Years` : '—',
          createdOn: p.createdAt || new Date(),
          isProductDoc: true
        }));

      // Merge results
      setSpares([...spareInwards, ...spareProducts]);
    } catch (error) {
      console.error('Error fetching spares:', error);
      enqueueSnackbar('Error fetching spares inventory!', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchSpares();
  }, [fetchSpares]);

  // Derived Metrics
  const uniqueModels = Array.from(new Set(spares.map(s => s.modelNo))).filter(Boolean);
  const totalItems = spares.length;
  const totalStock = spares.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  const totalValue = spares.reduce((sum, s) => sum + ((Number(s.dealerPrice) || 0) * (Number(s.quantity) || 0)), 0);
  const uniqueLocations = Array.from(new Set(spares.map(s => s.location).filter(Boolean)));

  // Filtered List
  const filtered = spares.filter(s => {
    const matchesSearch =
      (s.modelNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.scannedCodes || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation = locationFilter === 'All' || s.location === locationFilter;

    return matchesSearch && matchesLocation;
  });

  const handleOpenTransfer = (item) => {
    setTransferItem(item);
    const initialQty = Math.min(1, item.quantity || 1);
    setTransferQty(initialQty);
    if (item.barcodes && item.barcodes.length > 0) {
      setSelectedBarcodesToTransfer(item.barcodes.slice(0, initialQty));
    } else {
      setSelectedBarcodesToTransfer([]);
    }
  };

  const handleQtyChange = (val) => {
    const max = transferItem?.quantity || 1;
    const num = Math.min(Math.max(1, Number(val) || 1), max);
    setTransferQty(num);
    if (transferItem?.barcodes && transferItem.barcodes.length > 0) {
      setSelectedBarcodesToTransfer(transferItem.barcodes.slice(0, num));
    }
  };

  const toggleBarcodeSelection = (code) => {
    if (selectedBarcodesToTransfer.includes(code)) {
      setSelectedBarcodesToTransfer(prev => prev.filter(c => c !== code));
    } else {
      if (selectedBarcodesToTransfer.length < transferQty) {
        setSelectedBarcodesToTransfer(prev => [...prev, code]);
      } else {
        enqueueSnackbar(`You can only select up to ${transferQty} serials for this transfer.`, { variant: 'info' });
      }
    }
  };

  const handleConfirmTransfer = async () => {
    if (!transferItem || transferQty <= 0 || transferQty > transferItem.quantity) {
      enqueueSnackbar('Please enter a valid quantity to transfer!', { variant: 'warning' });
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      const qtyToMove = Number(transferQty);
      const remainingQty = Number(transferItem.quantity) - qtyToMove;

      // Barcodes partitioning
      const allCodes = transferItem.barcodes || [];
      const codesToMove = selectedBarcodesToTransfer.length === qtyToMove
        ? selectedBarcodesToTransfer
        : allCodes.slice(0, qtyToMove);
      const remainingCodes = allCodes.filter(c => !codesToMove.includes(c));

      // 1. Update / Deduct from Spares Inventory
      if (transferItem.isInventoryDoc) {
        if (remainingQty <= 0) {
          await axios.delete(`${API_BASE}/inventory/${transferItem._id}`);
        } else {
          await axios.put(`${API_BASE}/inventory/${transferItem._id}`, {
            quantity: remainingQty,
            scannedCodes: remainingCodes.join(','),
            currentStock: remainingQty,
          });
        }
      } else if (transferItem.isProductDoc) {
        const updatedStock = Math.max(0, (transferItem.quantity || 0) - qtyToMove);
        await axios.put(`${API_BASE}/products/${transferItem._id}`, {
          reorderLevel: updatedStock,
        });
      }

      // 2. Add to Normal Inventory
      const prodRes = await axios.get(`${API_BASE}/products`);
      const matchedProd = (prodRes.data || []).find(p => p.model === transferItem.modelNo && !p.isSpare);
      if (matchedProd) {
        const newProdStock = (matchedProd.reorderLevel || 0) + qtyToMove;
        await axios.put(`${API_BASE}/products/${matchedProd._id}`, {
          reorderLevel: newProdStock,
          stockStatus: newProdStock > 0 ? 'In Stock' : 'Out of Stock'
        });
      }

      // Create Normal Inventory entry
      await axios.post(`${API_BASE}/inventory`, {
        modelNo: transferItem.modelNo,
        location: transferItem.location || 'Main Warehouse',
        quantity: qtyToMove,
        scannedCodes: codesToMove.join(','),
        brand: transferItem.brand,
        dealerPrice: transferItem.dealerPrice,
        mrp: transferItem.dealerPrice,
        model: transferItem.modelNo,
        subCategory: transferItem.subCategory !== 'Spares Inventory' ? transferItem.subCategory : '',
        category: transferItem.category !== 'Spares' ? transferItem.category : '',
        currentStock: matchedProd ? (matchedProd.reorderLevel || 0) + qtyToMove : qtyToMove,
        isSpare: false,
        isAccessory: false
      });

      enqueueSnackbar(`Successfully transferred ${qtyToMove} unit(s) of ${transferItem.modelNo} to Normal Inventory!`, { variant: 'success' });
      setTransferItem(null);
      await fetchSpares();
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Failed to transfer spare to normal inventory', { variant: 'error' });
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 42, height: 42, borderRadius: 2.5, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe', flexShrink: 0 }}>
            <Wrench size={22} color="#2563eb" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
              Spares Inventory
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.2 }}>
              Manage allocated 2% spare products, replacement parts, warranty stock, and serial numbers.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* KPI Cards — 4 Columns */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2.5,
          mb: 3,
          width: '100%',
        }}
      >
        {/* Total Spare Models */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Spare Models
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5 }}>
                {uniqueModels.length}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={22} color="#2563eb" />
            </Box>
          </CardContent>
        </Card>

        {/* Total Spare Stock Units */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Spares Stock
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#16a34a', mt: 0.5 }}>
                {totalStock.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={22} color="#16a34a" />
            </Box>
          </CardContent>
        </Card>

        {/* Total Spares Value */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Spares Stock Value
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#7c3aed', mt: 0.5 }}>
                ₹{totalValue.toLocaleString('en-IN')}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={22} color="#7c3aed" />
            </Box>
          </CardContent>
        </Card>

        {/* Locations Holding Spares */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Locations
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#0891b2', mt: 0.5 }}>
                {uniqueLocations.length}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={22} color="#0891b2" />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Main Table Card */}
      <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden', width: '100%' }}>
        {/* Search & Location Filter Toolbar */}
        <Box sx={{ p: 2.5, display: 'flex', gap: 2, alignItems: 'center', backgroundColor: '#ffffff', flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1.5, minWidth: { xs: '100%', sm: 280 } }}>
            <TextField
              placeholder="Search by model, brand, location, or serial barcode..."
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

          <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: 200 } }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Filter by Location</InputLabel>
              <Select
                value={locationFilter}
                label="Filter by Location"
                onChange={(e) => setLocationFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="All">All Locations</MenuItem>
                {uniqueLocations.map(loc => (
                  <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', width: 50 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Model / Spare Item</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Brand</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Sub Category</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Dealer Price</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Spare Stock</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Warranty</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Barcodes / Serials</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Date Inwarded</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, idx) => (
                <TableRow key={item._id || idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>
                    {page * rowsPerPage + idx + 1}
                  </TableCell>

                  {/* Model */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Wrench size={18} color="#b45309" />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                          {item.modelNo}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 600 }}>
                          2% Allocated Spare
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Brand */}
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                      {item.brand || '—'}
                    </Typography>
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    {item.category && item.category !== '—' ? (
                      <Chip
                        label={item.category}
                        size="small"
                        icon={<Layers size={12} />}
                        sx={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: '12px' }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ color: '#cbd5e1' }}>—</Typography>
                    )}
                  </TableCell>

                  {/* Sub Category */}
                  <TableCell>
                    {item.subCategory && item.subCategory !== '—' ? (
                      <Chip
                        label={item.subCategory}
                        size="small"
                        icon={<GitFork size={12} />}
                        sx={{ backgroundColor: '#f0fdf4', color: '#15803d', fontWeight: 600, fontSize: '12px' }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ color: '#cbd5e1' }}>—</Typography>
                    )}
                  </TableCell>

                  {/* Location */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <MapPin size={15} color="#64748b" />
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#334155' }}>
                        {item.location}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Dealer Price */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                      ₹{Number(item.dealerPrice || 0).toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>

                  {/* Spare Stock */}
                  <TableCell>
                    <Chip
                      label={`${item.quantity} units`}
                      size="small"
                      sx={{
                        backgroundColor: Number(item.quantity) > 0 ? '#dcfce7' : '#fee2e2',
                        color: Number(item.quantity) > 0 ? '#15803d' : '#b91c1c',
                        fontWeight: 700,
                        fontSize: '12px',
                      }}
                    />
                  </TableCell>

                  {/* Warranty */}
                  <TableCell>
                    {item.warranty && item.warranty !== '—' ? (
                      <Chip
                        label={item.warranty}
                        size="small"
                        icon={<ShieldCheck size={12} />}
                        sx={{ backgroundColor: '#fdf4ff', color: '#9333ea', fontWeight: 600, fontSize: '12px' }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ color: '#cbd5e1' }}>—</Typography>
                    )}
                  </TableCell>

                  {/* Serials / Barcodes */}
                  <TableCell>
                    {item.barcodes && item.barcodes.length > 0 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          icon={<Barcode size={14} />}
                          label={`${item.barcodes.length} serials`}
                          size="small"
                          onClick={() => setSelectedSerials({ model: item.modelNo, barcodes: item.barcodes })}
                          sx={{
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            fontWeight: 700,
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: '#dbeafe' }
                          }}
                        />
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                        No serials attached
                      </Typography>
                    )}
                  </TableCell>

                  {/* Date Inwarded */}
                  <TableCell>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                      {new Date(item.createdOn).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Typography>
                  </TableCell>

                  {/* Action: Transfer Button */}
                  <TableCell align="center">
                    <Tooltip title={`Transfer ${item.modelNo} to Normal Inventory`}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ArrowLeftRight size={13} />}
                        onClick={() => handleOpenTransfer(item)}
                        sx={{
                          borderColor: '#bfdbfe',
                          color: '#1d4ed8',
                          backgroundColor: '#eff6ff',
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '12px',
                          py: 0.4,
                          px: 1.4,
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor: '#dbeafe',
                            borderColor: '#93c5fd'
                          }
                        }}
                      >
                        Transfer
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                      <PackageX size={36} color="#cbd5e1" />
                      <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                        No spares inventory records found.
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
              Spare Serial Numbers ({selectedSerials?.model})
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
      {/* Modal Dialog to Transfer Spare to Normal Inventory */}
      <Dialog
        open={Boolean(transferItem)}
        onClose={() => !isSubmittingTransfer && setTransferItem(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeftRight size={18} color="#2563eb" />
            </Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#0f172a' }}>
              Transfer to Normal Inventory
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setTransferItem(null)} disabled={isSubmittingTransfer}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ mt: 2 }}>
          {transferItem && (
            <Stack spacing={2.5}>
              {/* Item Info Box */}
              <Paper sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Model Number
                    </Typography>
                    <Typography variant="body1" fontWeight={700} sx={{ color: '#0f172a' }}>
                      {transferItem.modelNo}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Available Spare Stock
                    </Typography>
                    <Typography variant="body1" fontWeight={700} sx={{ color: '#16a34a' }}>
                      {transferItem.quantity} unit(s)
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Location
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#334155' }}>
                      {transferItem.location}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Brand / Category
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#334155' }}>
                      {transferItem.brand} ({transferItem.category || '—'})
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Quantity Input */}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: '#0f172a' }}>
                  Quantity to Transfer *
                </Typography>
                <TextField
                  type="number"
                  fullWidth
                  size="small"
                  value={transferQty}
                  onChange={(e) => handleQtyChange(e.target.value)}
                  inputProps={{ min: 1, max: transferItem.quantity }}
                  helperText={`Maximum transferable: ${transferItem.quantity} unit(s)`}
                  InputProps={{ sx: { borderRadius: 1.5 } }}
                />
              </Box>

              {/* Barcodes / Serials Picker (if item has barcodes) */}
              {transferItem.barcodes && transferItem.barcodes.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5, color: '#0f172a' }}>
                    Select Serials to Transfer ({selectedBarcodesToTransfer.length} of {transferQty} selected)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
                    Click a serial chip to select or unselect which specific serial moves to normal inventory.
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 180, overflowY: 'auto', p: 1, backgroundColor: '#f1f5f9', borderRadius: 2 }}>
                    {transferItem.barcodes.map((code, bIdx) => {
                      const isSelected = selectedBarcodesToTransfer.includes(code);
                      return (
                        <Chip
                          key={bIdx}
                          label={code}
                          size="small"
                          onClick={() => toggleBarcodeSelection(code)}
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#dbeafe' : '#ffffff',
                            color: isSelected ? '#1d4ed8' : '#64748b',
                            border: isSelected ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Transfer Summary Notice */}
              <Box sx={{ p: 1.5, backgroundColor: '#eff6ff', borderRadius: 2, border: '1px solid #bfdbfe' }}>
                <Typography variant="body2" sx={{ color: '#1e40af', fontWeight: 600 }}>
                  ℹ️ {transferQty} unit(s) will be added to Normal Products Inventory, and {Math.max(0, transferItem.quantity - transferQty)} unit(s) will remain in Spares.
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => setTransferItem(null)}
            disabled={isSubmittingTransfer}
            sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmTransfer}
            disabled={isSubmittingTransfer || transferQty <= 0 || transferQty > (transferItem?.quantity || 0)}
            sx={{
              backgroundColor: '#2563eb',
              '&:hover': { backgroundColor: '#1d4ed8' },
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              borderRadius: 2
            }}
          >
            {isSubmittingTransfer ? 'Transferring...' : 'Confirm Transfer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Spares;
