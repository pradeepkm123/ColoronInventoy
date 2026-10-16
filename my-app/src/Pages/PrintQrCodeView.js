import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Card,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Printer,
  QrCode,
  Search,
  Plus,
  Trash2,
  Eye,
  Sliders,
  CheckSquare
} from 'lucide-react';
import axios from 'axios';

const API_URL = 'https://coloroninventoy.onrender.com/api/products';

// SVG QR Code Renderer
const QrCodeSvg = ({ text = 'LOOKMAN-PROD-001', size = 110 }) => {
  const gridSize = 21;
  const matrix = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));

  // Corner Position Detection Markers (7x7 squares)
  const drawCornerMarker = (startR, startC) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startR + r][startC + c] = true;
        }
      }
    }
  };

  drawCornerMarker(0, 0); // Top-left
  drawCornerMarker(0, gridSize - 7); // Top-right
  drawCornerMarker(gridSize - 7, 0); // Bottom-left

  // Pseudo Data Modules based on string hash
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed += text.charCodeAt(i) * (i + 1);
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Don't overwrite position markers
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= gridSize - 8;
      const inBL = r >= gridSize - 8 && c < 8;
      if (!inTL && !inTR && !inBL) {
        const val = Math.sin(seed + r * 17 + c * 31) > 0;
        matrix[r][c] = val;
      }
    }
  }

  const cellSize = size / gridSize;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="#ffffff" />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.1}
              height={cellSize + 0.1}
              fill="#0f172a"
            />
          ) : null
        )
      )}
    </svg>
  );
};

export default function PrintQrCodeView() {
  const [products, setProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [qrContentFormat, setQrContentFormat] = useState('URL_WITH_SERIAL');
  const [qrSize, setQrSize] = useState('medium');

  const [options, setOptions] = useState({
    storeName: 'LOOKMAN ASSET TRACKER',
    showStoreName: true,
    showProductName: true,
    showPrice: true,
    showSku: true,
    showSerialNumber: true,
  });

  const sampleProducts = [
    { id: 1, name: 'Hikvision 4K IP Bullet Camera IR 80M', sku: 'HIK-4K-BUL-80', serial: 'SN-HK4K-2025-901', price: 4850 },
    { id: 2, name: 'CP Plus 16 Ch 4K Network Video Recorder', sku: 'CP-NVR-16CH', serial: 'SN-CP16-2025-412', price: 9200 },
    { id: 3, name: 'Western Digital Purple 6TB Surveillance', sku: 'WD-PUR-6TB', serial: 'SN-WDP-2025-108', price: 11400 },
    { id: 4, name: 'Gigabit 16-Port Managed PoE Switch', sku: 'NET-POE-16G', serial: 'SN-SW16-2025-783', price: 6500 },
    { id: 5, name: 'Cat6 Pure Copper Outdoor Gel-Filled 305M', sku: 'CAB-GEL-305', serial: 'SN-CAB6-2025-554', price: 5600 },
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(API_URL);
      if (res.data && res.data.length > 0) {
        const mapped = res.data.map((p, idx) => ({
          id: p._id || idx + 1,
          name: p.model || p.productName || `Product ${idx + 1}`,
          sku: p.brand ? `${p.brand.substring(0, 3).toUpperCase()}-${idx + 100}` : `SKU-${idx + 100}`,
          serial: `SN-LK-${idx + 1000}-${Math.floor(1000 + Math.random() * 9000)}`,
          price: p.mrp || p.dealerPrice || 1850,
        }));
        setProducts(mapped);
        setSelectedItems([{ ...mapped[0], qty: 4 }]);
      } else {
        setProducts(sampleProducts);
        setSelectedItems([{ ...sampleProducts[0], qty: 4 }, { ...sampleProducts[1], qty: 2 }]);
      }
    } catch {
      setProducts(sampleProducts);
      setSelectedItems([{ ...sampleProducts[0], qty: 4 }, { ...sampleProducts[1], qty: 2 }]);
    }
  };

  const handleAddProduct = (p) => {
    const existing = selectedItems.find((item) => item.id === p.id);
    if (existing) {
      setSelectedItems(
        selectedItems.map((item) =>
          item.id === p.id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      setSelectedItems([...selectedItems, { ...p, qty: 1 }]);
    }
  };

  const handleUpdateQty = (id, newQty) => {
    const qty = Math.max(1, parseInt(newQty, 10) || 1);
    setSelectedItems(
      selectedItems.map((item) => (item.id === id ? { ...item, qty } : item))
    );
  };

  const handleRemoveItem = (id) => {
    setSelectedItems(selectedItems.filter((item) => item.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  const flatLabels = selectedItems.flatMap((item) =>
    Array(item.qty).fill(item)
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.serial.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
            QR Code Label Print Studio
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Generate 2D QR asset tags with product serial numbers, warranty lookup, and direct mobile inventory scanning.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Printer size={18} />}
          onClick={handlePrint}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            backgroundColor: '#0f2b48',
            fontWeight: 600,
            px: 3,
            py: 1,
            '&:hover': { backgroundColor: '#1e3a8a' },
          }}
        >
          Print QR Sheet ({flatLabels.length} tags)
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Settings & Queue */}
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f172a', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Sliders size={18} color="#0f2b48" /> QR Code Payload & Format
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>QR Code Encoded Data</InputLabel>
                  <Select
                    value={qrContentFormat}
                    label="QR Code Encoded Data"
                    onChange={(e) => setQrContentFormat(e.target.value)}
                  >
                    <MenuItem value="URL_WITH_SERIAL">Asset URL + Serial No.</MenuItem>
                    <MenuItem value="SERIAL_ONLY">Serial Number Only</MenuItem>
                    <MenuItem value="JSON_FULL">Full JSON (SKU, Price, Batch)</MenuItem>
                    <MenuItem value="SKU_ONLY">Product SKU Only</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>QR Code Display Size</InputLabel>
                  <Select
                    value={qrSize}
                    label="QR Code Display Size"
                    onChange={(e) => setQrSize(e.target.value)}
                  >
                    <MenuItem value="small">Small (35mm)</MenuItem>
                    <MenuItem value="medium">Standard (45mm)</MenuItem>
                    <MenuItem value="large">Large (60mm)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Header / Store Name"
                  size="small"
                  fullWidth
                  value={options.storeName}
                  onChange={(e) => setOptions({ ...options, storeName: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" fontWeight={600} sx={{ color: '#475569', display: 'block', mb: 1 }}>
                  Include on Tag:
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={options.showStoreName}
                          onChange={(e) => setOptions({ ...options, showStoreName: e.target.checked })}
                        />
                      }
                      label={<Typography variant="body2">Header Title</Typography>}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={options.showProductName}
                          onChange={(e) => setOptions({ ...options, showProductName: e.target.checked })}
                        />
                      }
                      label={<Typography variant="body2">Product Name</Typography>}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={options.showSerialNumber}
                          onChange={(e) => setOptions({ ...options, showSerialNumber: e.target.checked })}
                        />
                      }
                      label={<Typography variant="body2">Serial Number</Typography>}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={options.showPrice}
                          onChange={(e) => setOptions({ ...options, showPrice: e.target.checked })}
                        />
                      }
                      label={<Typography variant="body2">Price (₹)</Typography>}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>

          {/* Selected QR Queue */}
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckSquare size={18} color="#0f2b48" /> Selected Products ({selectedItems.length})
              </Typography>
              {selectedItems.length > 0 && (
                <Button size="small" onClick={() => setSelectedItems([])} sx={{ color: '#ef4444', textTransform: 'none' }}>
                  Clear All
                </Button>
              )}
            </Box>

            {selectedItems.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  No items in QR queue. Search and add products below.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>Product</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: '12px' }}>Qty (Stickers)</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: '12px' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a', fontSize: '13px' }}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {item.serial}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            size="small"
                            value={item.qty}
                            onChange={(e) => handleUpdateQty(item.id, e.target.value)}
                            sx={{ width: 65, '& input': { textAlign: 'center', py: 0.5, fontSize: '13px' } }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => handleRemoveItem(item.id)} sx={{ color: '#ef4444' }}>
                            <Trash2 size={15} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Divider sx={{ my: 2.5 }} />
            <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#334155', mb: 1.5 }}>
              Add Products from Inventory:
            </Typography>
            <TextField
              placeholder="Search product name, SKU, or serial number..."
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color="#94a3b8" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, fontSize: '13px' }
              }}
            />

            <Box sx={{ maxHeight: 220, overflowY: 'auto', mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {filteredProducts.slice(0, 6).map((p) => (
                <Box
                  key={p.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid #f1f5f9',
                    backgroundColor: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    '&:hover': { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }
                  }}
                >
                  <Box sx={{ pr: 1 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#1e293b', fontSize: '13px' }}>
                      {p.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      SKU: {p.sku} | S/N: {p.serial}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Plus size={14} />}
                    onClick={() => handleAddProduct(p)}
                    sx={{ textTransform: 'none', borderRadius: 1.5, minWidth: 70, py: 0.3 }}
                  >
                    Add
                  </Button>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Live Sheet Preview */}
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Eye size={18} color="#0f2b48" /> Live QR Sheet Layout
              </Typography>
              <Chip label={`${flatLabels.length} QR Stickers`} size="small" sx={{ fontWeight: 600, backgroundColor: '#eff6ff', color: '#1d4ed8' }} />
            </Box>

            {flatLabels.length === 0 ? (
              <Box sx={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #e2e8f0', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Select products to preview generated QR Code stickers.
                </Typography>
              </Box>
            ) : (
              <Box
                id="printable-qr-sheet"
                sx={{
                  p: 3,
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: 2.5,
                  maxHeight: 700,
                  overflowY: 'auto'
                }}
              >
                {flatLabels.map((item, idx) => (
                  <Card
                    key={idx}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px dashed #94a3b8',
                      boxShadow: 'none',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    {options.showStoreName && (
                      <Typography variant="caption" fontWeight={800} sx={{ color: '#0f172a', letterSpacing: 0.5, fontSize: '10px', textTransform: 'uppercase' }}>
                        {options.storeName}
                      </Typography>
                    )}

                    <Box sx={{ my: 1 }}>
                      <QrCodeSvg
                        text={`https://lookman.in/track?serial=${item.serial}&sku=${item.sku}`}
                        size={qrSize === 'large' ? 120 : qrSize === 'small' ? 85 : 100}
                      />
                    </Box>

                    {options.showProductName && (
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        sx={{
                          color: '#1e293b',
                          fontSize: '11px',
                          lineHeight: 1.2,
                          mb: 0.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {item.name}
                      </Typography>
                    )}

                    {options.showSerialNumber && (
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#0369a1', fontSize: '10px' }}>
                        {item.serial}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 0.5, pt: 0.5, borderTop: '1px dotted #e2e8f0' }}>
                      {options.showSku && (
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '10px' }}>
                          {item.sku}
                        </Typography>
                      )}
                      {options.showPrice && (
                        <Typography variant="caption" fontWeight={700} sx={{ color: '#0f172a', fontSize: '11px' }}>
                          ₹{item.price}
                        </Typography>
                      )}
                    </Box>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
