import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Chip,
  Card,
  CardContent,
  InputAdornment,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Boxes,
  Layers,
  MapPin,
  Barcode,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Copy,
  Check,
  Eye,
  Package,
  PackagePlus,
  ArrowDownToLine,
  Warehouse,
  Sparkles,
  AlertCircle,
  Hash,
  CheckCircle2,
} from 'lucide-react';
import { useSnackbar } from 'notistack';

const API = 'https://coloroninventoy.onrender.com';

// Helper to parse comma or whitespace-separated codes
const parseCodes = (codesStr) => {
  if (!codesStr) return [];
  return codesStr
    .split(/[,\s]+/)
    .map((c) => c.trim())
    .filter(Boolean);
};

const Inventory = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [codesModalOpen, setCodesModalOpen] = useState(false);
  const [selectedRecordForCodes, setSelectedRecordForCodes] = useState(null);
  const [codesSearchQuery, setCodesSearchQuery] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);

  const [inventoryData, setInventoryData] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  const [formData, setFormData] = useState({
    modelNo: '',
    location: '',
    quantity: 0,
    shd: '',
    scannedCodes: '',
  });

  const [errors, setErrors] = useState({
    modelNo: '',
    location: '',
    quantity: '',
    shd: '',
  });

  const [editIndex, setEditIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [scannedBarcodes, setScannedBarcodes] = useState(new Set());
  const [showRawCodesInput, setShowRawCodesInput] = useState(false);
  const shdInputRef = useRef(null);

  // Fetch Inventory
  const fetchInventoryData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/inventory`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      setInventoryData(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      enqueueSnackbar('Error fetching inventory!', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Fetch Locations
  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch(`${API}/api/locations`);
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      enqueueSnackbar('Error fetching locations!', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchInventoryData();
    fetchLocations();
  }, [fetchInventoryData, fetchLocations]);

  useEffect(() => {
    if (open && shdInputRef.current) {
      shdInputRef.current.focus();
    }
  }, [open]);

  // Barcode scan processing
  useEffect(() => {
    const processBarcode = () => {
      const barcode = (formData.shd || '').trim();
      if (!barcode) return;

      // Require model first
      if (!formData.modelNo) {
        setErrors((prev) => ({ ...prev, shd: 'Please fill model number first!' }));
        enqueueSnackbar('Please fill model number before scanning!', { variant: 'error' });
        return;
      }

      if (barcode.length >= 8) {
        const hyphenIndex = formData.modelNo.indexOf('-');
        const modelRelevantPart =
          hyphenIndex !== -1 ? formData.modelNo.slice(hyphenIndex + 1) : formData.modelNo;

        if (scannedBarcodes.has(barcode)) {
          setErrors((prev) => ({ ...prev, shd: 'Barcode already scanned!' }));
          enqueueSnackbar('This barcode already scanned!', { variant: 'error' });
          return;
        }

        if (!barcode.includes(modelRelevantPart)) {
          setErrors((prev) => ({ ...prev, shd: 'Mismatch: Barcode does not contain model number!' }));
          enqueueSnackbar('Mismatch: Barcode does not contain model number!', { variant: 'error' });
          return;
        }

        setScannedBarcodes((prev) => {
          const next = new Set(prev);
          next.add(barcode);
          return next;
        });

        setFormData((prev) => {
          const updatedCodes = prev.scannedCodes ? `${prev.scannedCodes} ${barcode}` : barcode;
          return {
            ...prev,
            scannedCodes: updatedCodes,
            shd: '',
            quantity: prev.quantity > 0 ? prev.quantity : scannedBarcodes.size + 1,
          };
        });

        setErrors((prev) => ({ ...prev, shd: '' }));
        enqueueSnackbar(`Scanned barcode: ${barcode}`, { variant: 'success' });
      }
    };

    if (formData.shd) {
      const timer = setTimeout(processBarcode, 100);
      return () => clearTimeout(timer);
    }
  }, [formData.shd, formData.modelNo, scannedBarcodes, enqueueSnackbar]);

  const handleOpen = () => {
    setFormData({
      modelNo: '',
      location: locations[0]?.locationName || 'Chennai',
      quantity: 0,
      shd: '',
      scannedCodes: '',
    });
    setErrors({
      modelNo: '',
      location: '',
      quantity: '',
      shd: '',
    });
    setScannedBarcodes(new Set());
    setEditIndex(null);
    setShowRawCodesInput(false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditIndex(null);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'scannedCodes') {
      const parsed = parseCodes(value);
      setScannedBarcodes(new Set(parsed));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleRemoveScannedCode = (codeToRemove) => {
    setScannedBarcodes((prev) => {
      const next = new Set(prev);
      next.delete(codeToRemove);
      return next;
    });

    setFormData((prev) => {
      const currentCodes = parseCodes(prev.scannedCodes);
      const remainingCodes = currentCodes.filter((c) => c !== codeToRemove);
      return {
        ...prev,
        scannedCodes: remainingCodes.join(' '),
      };
    });
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { modelNo: '', location: '', quantity: '', shd: '' };

    if (!formData.modelNo.trim()) {
      newErrors.modelNo = 'Model No is required';
      valid = false;
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
      valid = false;
    }
    if (formData.quantity === undefined || Number(formData.quantity) < 0) {
      newErrors.quantity = 'Quantity must be 0 or greater';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const isEdit = editIndex !== null;
      const url = isEdit
        ? `${API}/api/inventory/${inventoryData[editIndex]._id}`
        : `${API}/api/inventory`;

      const payload = {
        ...formData,
        quantity: Number(formData.quantity) || 0,
      };

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save/update data');
      const result = await response.json();

      if (isEdit) {
        const updated = inventoryData.map((item, index) => (index === editIndex ? result : item));
        setInventoryData(updated);
        enqueueSnackbar('Inventory updated successfully!', { variant: 'success' });
      } else {
        setInventoryData((prev) => [result, ...prev]);
        enqueueSnackbar('Inventory inward created successfully!', { variant: 'success' });
      }

      handleClose();
      await fetchInventoryData();
    } catch (error) {
      console.error('Error saving data:', error);
      enqueueSnackbar(error.message || 'Error saving data!', { variant: 'error' });
    }
  };

  const handleEdit = (data, index) => {
    setFormData({
      modelNo: data.modelNo || '',
      location: data.location || '',
      quantity: data.quantity || 0,
      shd: '',
      scannedCodes: data.scannedCodes || '',
    });

    const parsed = parseCodes(data.scannedCodes);
    setScannedBarcodes(new Set(parsed));
    setEditIndex(index);
    setErrors({ modelNo: '', location: '', quantity: '', shd: '' });
    setShowRawCodesInput(false);
    setOpen(true);
  };

  const handleDeleteConfirmOpen = (index) => {
    setDeleteIndex(index);
    setConfirmOpen(true);
  };

  const handleDeleteConfirmClose = () => {
    setConfirmOpen(false);
    setDeleteIndex(null);
  };

  const handleDelete = async () => {
    try {
      const itemToDelete = inventoryData[deleteIndex];
      const response = await fetch(`${API}/api/inventory/${itemToDelete._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete data');

      setInventoryData((prev) => prev.filter((_, i) => i !== deleteIndex));
      enqueueSnackbar('Inventory record deleted successfully!', { variant: 'success' });
      handleDeleteConfirmClose();
    } catch (error) {
      console.error('Error deleting data:', error);
      enqueueSnackbar('Error deleting data!', { variant: 'error' });
    }
  };

  // Codes Inspection Modal
  const handleOpenCodesModal = (record) => {
    setSelectedRecordForCodes(record);
    setCodesSearchQuery('');
    setCopiedAll(false);
    setCodesModalOpen(true);
  };

  const handleCloseCodesModal = () => {
    setCodesModalOpen(false);
    setSelectedRecordForCodes(null);
  };

  const handleCopyAllCodes = () => {
    if (!selectedRecordForCodes?.scannedCodes) return;
    const codes = parseCodes(selectedRecordForCodes.scannedCodes);
    navigator.clipboard.writeText(codes.join('\n'));
    setCopiedAll(true);
    enqueueSnackbar(`Copied ${codes.length} serial codes to clipboard!`, { variant: 'success' });
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleCopySingleCode = (code) => {
    navigator.clipboard.writeText(code);
    enqueueSnackbar(`Copied ${code}`, { variant: 'info' });
  };

  // KPI Metrics Calculation
  const totalRecords = inventoryData.length;
  const totalUnits = useMemo(
    () => inventoryData.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0),
    [inventoryData]
  );
  const uniqueModelsCount = useMemo(
    () => new Set(inventoryData.map((item) => item.modelNo).filter(Boolean)).size,
    [inventoryData]
  );
  const totalBarcodesTracked = useMemo(
    () => inventoryData.reduce((acc, item) => acc + parseCodes(item.scannedCodes).length, 0),
    [inventoryData]
  );

  // Filtered Inventory Data
  const filteredData = useMemo(() => {
    return inventoryData.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const modelMatch = (item.modelNo || '').toLowerCase().includes(q);
      const locationMatch = (item.location || '').toLowerCase().includes(q);
      const codeMatch = (item.scannedCodes || '').toLowerCase().includes(q);
      const searchPass = !q || modelMatch || locationMatch || codeMatch;

      const locationPass =
        locationFilter === 'all' ||
        (item.location || '').toLowerCase() === locationFilter.toLowerCase();

      const stockPass =
        stockFilter === 'all' ||
        (stockFilter === 'inStock' && Number(item.quantity) > 0) ||
        (stockFilter === 'zeroStock' && Number(item.quantity) === 0);

      return searchPass && locationPass && stockPass;
    });
  }, [inventoryData, searchQuery, locationFilter, stockFilter]);

  // Codes filtered inside the Codes Inspection Modal
  const modalCodesList = useMemo(() => {
    if (!selectedRecordForCodes?.scannedCodes) return [];
    const allCodes = parseCodes(selectedRecordForCodes.scannedCodes);
    if (!codesSearchQuery.trim()) return allCodes;
    return allCodes.filter((c) => c.toLowerCase().includes(codesSearchQuery.toLowerCase().trim()));
  }, [selectedRecordForCodes, codesSearchQuery]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
          width: '100%',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: '12px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)',
              flexShrink: 0,
            }}
          >
            <PackagePlus size={24} color="#2563eb" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
              Move To Inventory Details
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.3 }}>
              Track inward stock movements, manage model serial codes, barcodes, and inventory locations.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={fetchInventoryData}
            sx={{ textTransform: 'none', borderRadius: 2, borderColor: '#cbd5e1', color: '#475569', fontWeight: 600 }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={handleOpen}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              backgroundColor: '#0f2b48',
              fontWeight: 600,
              px: 2.5,
              py: 1,
              '&:hover': { backgroundColor: '#1e3a8a' },
            }}
          >
            Add Inventory
          </Button>
        </Box>
      </Box>

      {/* KPI Metric Summary Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 2.5,
          mb: 3,
          width: '100%',
        }}
      >
        {/* Card 1: Total Records */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Inward Records
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5 }}>
                {totalRecords}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Boxes size={22} color="#2563eb" />
            </Box>
          </CardContent>
        </Card>

        {/* Card 2: Total Units */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Quantity
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#16a34a', mt: 0.5 }}>
                {totalUnits.toLocaleString()}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                backgroundColor: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={22} color="#16a34a" />
            </Box>
          </CardContent>
        </Card>

        {/* Card 3: Unique Models */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Unique Models
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#7c3aed', mt: 0.5 }}>
                {uniqueModelsCount}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                backgroundColor: '#f5f3ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={22} color="#7c3aed" />
            </Box>
          </CardContent>
        </Card>

        {/* Card 4: Scanned Barcodes */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Barcodes Tracked
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5 }}>
                {totalBarcodesTracked.toLocaleString()}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                backgroundColor: '#fffbeb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Barcode size={22} color="#d97706" />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Main Table Card */}
      <Paper
        sx={{
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {/* Filters Bar */}
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <TextField
            placeholder="Search by model number, scanned barcode, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ width: { xs: '100%', sm: 380 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#94a3b8" />
                </InputAdornment>
              ),
              sx: { borderRadius: 2, fontSize: '14px' },
            }}
          />

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Location filter */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Location</InputLabel>
              <Select
                value={locationFilter}
                label="Location"
                onChange={(e) => setLocationFilter(e.target.value)}
                sx={{ borderRadius: 2, fontSize: '13px' }}
              >
                <MenuItem value="all">All Locations</MenuItem>
                {Array.from(new Set(inventoryData.map((d) => d.location).filter(Boolean))).map((loc) => (
                  <MenuItem key={loc} value={loc}>
                    {loc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Stock filter */}
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Stock Status</InputLabel>
              <Select
                value={stockFilter}
                label="Stock Status"
                onChange={(e) => setStockFilter(e.target.value)}
                sx={{ borderRadius: 2, fontSize: '13px' }}
              >
                <MenuItem value="all">All Items</MenuItem>
                <MenuItem value="inStock">In Stock (Qty &gt; 0)</MenuItem>
                <MenuItem value="zeroStock">Zero Stock (0)</MenuItem>
              </Select>
            </FormControl>

            {(searchQuery || locationFilter !== 'all' || stockFilter !== 'all') && (
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setSearchQuery('');
                  setLocationFilter('all');
                  setStockFilter('all');
                }}
                sx={{ textTransform: 'none', color: '#ef4444', fontWeight: 600, fontSize: '13px' }}
              >
                Reset
              </Button>
            )}
          </Box>
        </Box>

        {/* Data Table */}
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', width: 60 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', minWidth: 160 }}>
                  Model No
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', minWidth: 320 }}>
                  Scanned Codes / Barcodes
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', width: 120 }}>
                  Quantity
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', width: 150 }}>
                  Location
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', width: 110 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((data, index) => {
                  const codes = parseCodes(data.scannedCodes);
                  const actualIndex = page * rowsPerPage + index;

                  return (
                    <TableRow
                      key={data._id || actualIndex}
                      hover
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Index */}
                      <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '13px' }}>
                        {actualIndex + 1}
                      </TableCell>

                      {/* Model No */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 2,
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '12px',
                              border: '1px solid #bfdbfe',
                              flexShrink: 0,
                            }}
                          >
                            <Package size={18} />
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                              {data.modelNo || '—'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              Inward Batch Item
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Scanned Codes (Sleek pill preview instead of messy text wall!) */}
                      <TableCell>
                        {codes.length === 0 ? (
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                            No codes scanned
                          </Typography>
                        ) : codes.length <= 2 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, alignItems: 'center' }}>
                            {codes.map((code, cIdx) => (
                              <Chip
                                key={cIdx}
                                label={code}
                                size="small"
                                onClick={() => handleCopySingleCode(code)}
                                sx={{
                                  fontFamily: 'monospace',
                                  fontSize: '12px',
                                  backgroundColor: '#f1f5f9',
                                  color: '#1e293b',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 1.5,
                                  cursor: 'pointer',
                                  '&:hover': { backgroundColor: '#e2e8f0' },
                                }}
                              />
                            ))}
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, alignItems: 'center' }}>
                            {codes.slice(0, 1).map((code, cIdx) => (
                              <Chip
                                key={cIdx}
                                label={code}
                                size="small"
                                onClick={() => handleCopySingleCode(code)}
                                sx={{
                                  fontFamily: 'monospace',
                                  fontSize: '12px',
                                  backgroundColor: '#f1f5f9',
                                  color: '#1e293b',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 1.5,
                                  cursor: 'pointer',
                                  '&:hover': { backgroundColor: '#e2e8f0' },
                                }}
                              />
                            ))}
                            <Tooltip title="Click to inspect and copy all scanned barcodes">
                              <Chip
                                label={`+${codes.length - 1} more (${codes.length} total)`}
                                size="small"
                                onClick={() => handleOpenCodesModal(data)}
                                icon={<Eye size={13} style={{ marginLeft: 4 }} />}
                                sx={{
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  backgroundColor: '#eff6ff',
                                  color: '#2563eb',
                                  border: '1px solid #bfdbfe',
                                  borderRadius: 1.5,
                                  cursor: 'pointer',
                                  '&:hover': { backgroundColor: '#dbeafe' },
                                }}
                              />
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>

                      {/* Quantity Pill */}
                      <TableCell align="center">
                        <Chip
                          label={`${data.quantity || 0} Units`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '12px',
                            backgroundColor: (data.quantity || 0) > 0 ? '#dcfce7' : '#f1f5f9',
                            color: (data.quantity || 0) > 0 ? '#15803d' : '#64748b',
                            border: (data.quantity || 0) > 0 ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                            borderRadius: 2,
                            px: 0.5,
                          }}
                        />
                      </TableCell>

                      {/* Location Badge */}
                      <TableCell>
                        <Chip
                          icon={<MapPin size={13} color="#0284c7" />}
                          label={data.location || 'Not Specified'}
                          size="small"
                          sx={{
                            backgroundColor: '#f0f9ff',
                            color: '#0369a1',
                            border: '1px solid #bae6fd',
                            fontWeight: 600,
                            fontSize: '12px',
                            borderRadius: 1.5,
                          }}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Tooltip title="Edit Inventory Inward">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(data, actualIndex)}
                              sx={{
                                color: '#0284c7',
                                backgroundColor: '#e0f2fe',
                                '&:hover': { backgroundColor: '#bae6fd' },
                                borderRadius: 1.5,
                              }}
                            >
                              <Edit2 size={15} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete Item">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteConfirmOpen(actualIndex)}
                              sx={{
                                color: '#ef4444',
                                backgroundColor: '#fee2e2',
                                '&:hover': { backgroundColor: '#fecaca' },
                                borderRadius: 1.5,
                              }}
                            >
                              <Trash2 size={15} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}

              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Boxes size={42} color="#94a3b8" style={{ marginBottom: 8 }} />
                    <Typography variant="body1" fontWeight={600} sx={{ color: '#334155' }}>
                      No Inventory Inward Records Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                      {searchQuery || locationFilter !== 'all' || stockFilter !== 'all'
                        ? 'Try clearing your search or filters to see more results.'
                        : 'Click "+ Add Inventory" above to record your first inward stock movement.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Scanned Codes Inspection Modal */}
      <Dialog
        open={codesModalOpen}
        onClose={handleCloseCodesModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' },
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f172a' }}>
              Scanned Serial Numbers & Barcodes
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Model:{' '}
              <strong style={{ color: '#0f172a' }}>{selectedRecordForCodes?.modelNo}</strong> • Total{' '}
              {parseCodes(selectedRecordForCodes?.scannedCodes).length} codes tracked
            </Typography>
          </Box>
          <IconButton onClick={handleCloseCodesModal} size="small" sx={{ color: '#64748b' }}>
            <X size={18} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search code within this model..."
              value={codesSearchQuery}
              onChange={(e) => setCodesSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color="#94a3b8" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, fontSize: '13px' },
              }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleCopyAllCodes}
              startIcon={copiedAll ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
              sx={{
                whiteSpace: 'nowrap',
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 600,
                borderColor: copiedAll ? '#16a34a' : '#cbd5e1',
                color: copiedAll ? '#16a34a' : '#334155',
              }}
            >
              {copiedAll ? 'Copied!' : 'Copy All'}
            </Button>
          </Box>

          <Box
            sx={{
              maxHeight: 360,
              overflowY: 'auto',
              p: 1.5,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 2.5,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            {modalCodesList.length > 0 ? (
              modalCodesList.map((code, idx) => (
                <Chip
                  key={idx}
                  label={code}
                  size="small"
                  onClick={() => handleCopySingleCode(code)}
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#eff6ff',
                      borderColor: '#93c5fd',
                    },
                  }}
                />
              ))
            ) : (
              <Typography variant="body2" sx={{ color: '#94a3b8', p: 2, textAlign: 'center', width: '100%' }}>
                No matching barcodes found.
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Button
            onClick={handleCloseCodesModal}
            variant="contained"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              backgroundColor: '#0f2b48',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#1e3a8a' },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add / Edit Inventory Inward Form Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          },
        }}
      >
        {/* Modal Header */}
        <Box
          sx={{
            px: 3,
            py: 2.2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <PackagePlus size={20} color="#2563eb" />
              <Typography variant="h6" fontWeight={700} sx={{ color: '#0f172a', fontSize: '18px' }}>
                {editIndex !== null ? 'Edit Inventory Inward' : 'Add Inventory Inward'}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#64748b', ml: 3.8 }}>
              {editIndex !== null
                ? 'Update model stock counts and scanned barcode records'
                : 'Scan barcodes and record newly received stock into inventory'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: '#64748b' }}>
            <X size={18} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.2 }}>
            {/* Model Number */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Model Number <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="modelNo"
                placeholder="e.g. CO-N-041 or SHD-VB501LCM"
                value={formData.modelNo}
                onChange={handleFormChange}
                error={!!errors.modelNo}
                helperText={errors.modelNo}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Location */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Storage Location <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <FormControl fullWidth size="small" error={!!errors.location}>
                <Select
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                  sx={{ borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' }}
                >
                  {locations.length > 0 ? (
                    locations.map((loc) => (
                      <MenuItem key={loc._id || loc.locationName} value={loc.locationName}>
                        {loc.locationName}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="Chennai">Chennai</MenuItem>
                  )}
                </Select>
                {errors.location && (
                  <Typography sx={{ color: '#d32f2f', fontSize: '0.75rem', mt: 0.4 }}>
                    {errors.location}
                  </Typography>
                )}
              </FormControl>
            </Box>

            {/* Quantity */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Quantity (Units) <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                  setFormData((prev) => ({ ...prev, quantity: val }));
                  if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: '' }));
                }}
                error={!!errors.quantity}
                helperText={errors.quantity}
                inputProps={{ min: 0 }}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Live Barcode Scanner Box */}
            <Box
              sx={{
                gridColumn: '1 / -1',
                p: 2,
                backgroundColor: '#eff6ff',
                borderRadius: 2.5,
                border: '1.5px dashed #93c5fd',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Barcode size={18} color="#2563eb" />
                  <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1e3a8a' }}>
                    Live Barcode Scanner
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 600 }}>
                    Ready to scan
                  </Typography>
                </Box>
              </Box>

              <TextField
                fullWidth
                size="small"
                name="shd"
                inputRef={shdInputRef}
                placeholder="Scan barcode with hardware scanner or type..."
                value={formData.shd}
                onChange={handleFormChange}
                error={!!errors.shd}
                helperText={errors.shd || 'Scanner automatically validates barcode matching the model.'}
                InputProps={{
                  sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' },
                }}
              />
            </Box>

            {/* Scanned Codes List & Chips Manager */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Scanned Barcodes ({scannedBarcodes.size} items)
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setShowRawCodesInput((prev) => !prev)}
                  sx={{ textTransform: 'none', fontSize: '12px', fontWeight: 600, color: '#2563eb' }}
                >
                  {showRawCodesInput ? 'Hide Bulk Raw Input' : 'Edit as Raw Text'}
                </Button>
              </Box>

              {showRawCodesInput ? (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="scannedCodes"
                  placeholder="Paste or edit space-separated barcodes..."
                  value={formData.scannedCodes}
                  onChange={handleFormChange}
                  InputProps={{
                    sx: { borderRadius: 2, fontSize: '13px', fontFamily: 'monospace', backgroundColor: '#fff' },
                  }}
                />
              ) : (
                <Box
                  sx={{
                    maxHeight: 140,
                    overflowY: 'auto',
                    p: 1.5,
                    border: '1px solid #e2e8f0',
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0.8,
                  }}
                >
                  {scannedBarcodes.size > 0 ? (
                    Array.from(scannedBarcodes).map((code) => (
                      <Chip
                        key={code}
                        label={code}
                        size="small"
                        onDelete={() => handleRemoveScannedCode(code)}
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '11.5px',
                          backgroundColor: '#ffffff',
                          color: '#1e293b',
                          border: '1px solid #cbd5e1',
                          borderRadius: 1.5,
                        }}
                      />
                    ))
                  ) : (
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', p: 1 }}>
                      No barcodes scanned yet. Focus the input above to begin scanning.
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>

        {/* Modal Actions */}
        <Box
          sx={{
            px: 3,
            py: 2,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.5,
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
          }}
        >
          <Button onClick={handleClose} sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              backgroundColor: '#0f2b48',
              fontWeight: 600,
              px: 3,
              '&:hover': { backgroundColor: '#1e3a8a' },
            }}
          >
            {editIndex !== null ? 'Update Inventory' : 'Save Inventory'}
          </Button>
        </Box>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={handleDeleteConfirmClose}
        PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 420 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AlertCircle size={20} color="#ef4444" />
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            Are you sure you want to delete this inventory inward record? This will remove all associated scanned
            barcodes for this item.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleDeleteConfirmClose} sx={{ textTransform: 'none', color: '#64748b' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              backgroundColor: '#ef4444',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#dc2626' },
            }}
          >
            Delete Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
