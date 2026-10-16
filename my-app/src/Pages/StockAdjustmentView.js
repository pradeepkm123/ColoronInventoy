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
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  IconButton
} from '@mui/material';
import {
  Search,
  Plus,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Package,
  X
} from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5002/api/products';

const INITIAL_ADJUSTMENTS = [
  {
    id: 'ADJ-2025-001',
    productName: 'Hikvision 2MP Dome Camera',
    sku: 'HIK-DOM-2MP',
    warehouse: 'Main Warehouse Chennai',
    adjustmentType: 'Deduction (-)',
    qty: 2,
    reason: 'Damaged in transit during unloading',
    adjustedBy: 'Warehouse Manager',
    date: '2025-08-10 14:30',
  },
  {
    id: 'ADJ-2025-002',
    productName: 'Cat6 Cable 305M Roll (Blue)',
    sku: 'CAB-CAT6-305',
    warehouse: 'Avadi Store',
    adjustmentType: 'Addition (+)',
    qty: 5,
    reason: 'Physical count audit excess found',
    adjustedBy: 'Store Supervisor',
    date: '2025-08-09 11:15',
  },
  {
    id: 'ADJ-2025-003',
    productName: 'Seagate SkyHawk 4TB Surveillance HDD',
    sku: 'ST-SKY-4TB',
    warehouse: 'Main Warehouse Chennai',
    adjustmentType: 'Deduction (-)',
    qty: 1,
    reason: 'Defective RMA return to manufacturer',
    adjustedBy: 'Inventory Admin',
    date: '2025-08-08 16:45',
  },
  {
    id: 'ADJ-2025-004',
    productName: '12V 10A Power Supply Unit Metal',
    sku: 'PSU-12V-10A',
    warehouse: 'Central Hub Ambattur',
    adjustmentType: 'Addition (+)',
    qty: 10,
    reason: 'Returned demo / sample stock restored',
    adjustedBy: 'Sales Coordinator',
    date: '2025-08-07 09:20',
  },
];

export default function StockAdjustmentView() {
  const [adjustments, setAdjustments] = useState(INITIAL_ADJUSTMENTS);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    selectedProduct: null,
    warehouse: 'Main Warehouse Chennai',
    adjustmentType: 'Deduction (-)',
    qty: 1,
    reason: 'Physical Count Discrepancy',
    notes: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(API_URL);
      if (res.data && res.data.length > 0) {
        setProducts(
          res.data.map((p, idx) => ({
            id: p._id || idx + 1,
            name: p.model || p.productName || `Product ${idx + 1}`,
            sku: p.brand ? `${p.brand.substring(0, 3).toUpperCase()}-${idx + 100}` : `SKU-${idx + 100}`,
            currentStock: p.stockQuantity || p.reorderLevel || 15,
          }))
        );
      } else {
        setProducts([
          { id: 1, name: 'Hikvision 2MP Dome Camera', sku: 'HIK-DOM-2MP', currentStock: 24 },
          { id: 2, name: 'Cat6 Cable 305M Roll (Blue)', sku: 'CAB-CAT6-305', currentStock: 12 },
          { id: 3, name: 'Seagate SkyHawk 4TB Surveillance HDD', sku: 'ST-SKY-4TB', currentStock: 8 },
        ]);
      }
    } catch {
      setProducts([
        { id: 1, name: 'Hikvision 2MP Dome Camera', sku: 'HIK-DOM-2MP', currentStock: 24 },
        { id: 2, name: 'Cat6 Cable 305M Roll (Blue)', sku: 'CAB-CAT6-305', currentStock: 12 },
        { id: 3, name: 'Seagate SkyHawk 4TB Surveillance HDD', sku: 'ST-SKY-4TB', currentStock: 8 },
      ]);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      selectedProduct: products[0] || null,
      warehouse: 'Main Warehouse Chennai',
      adjustmentType: 'Deduction (-)',
      qty: 1,
      reason: 'Physical Count Discrepancy',
      notes: '',
    });
    setDialogOpen(true);
  };

  const handleSaveAdjustment = () => {
    if (!formData.selectedProduct) return;

    const newAdj = {
      id: `ADJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      productName: formData.selectedProduct.name,
      sku: formData.selectedProduct.sku,
      warehouse: formData.warehouse,
      adjustmentType: formData.adjustmentType,
      qty: parseInt(formData.qty, 10) || 1,
      reason: formData.notes ? `${formData.reason} (${formData.notes})` : formData.reason,
      adjustedBy: 'Admin User',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setAdjustments([newAdj, ...adjustments]);
    setDialogOpen(false);
  };

  const filteredAdjustments = adjustments.filter(
    (a) =>
      a.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.warehouse.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
            Stock Adjustment & Reconciliation
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Perform inventory corrections (+/-) for physical audit discrepancies, damaged goods, or write-offs.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={handleOpenAdd}
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
          New Stock Adjustment
        </Button>
      </Box>

      {/* KPI Cards (Full Screen Grid) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(3, 1fr)',
          },
          gap: 2.5,
          mb: 3,
          width: '100%',
        }}
      >
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Recorded Adjustments
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5 }}>
                {adjustments.length}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpDown size={22} color="#2563eb" />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Positive Adjustments (+)
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#16a34a', mt: 0.5 }}>
                {adjustments.filter((a) => a.adjustmentType.includes('+')).length}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={22} color="#16a34a" />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Deductions / Damage (-)
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#ef4444', mt: 0.5 }}>
                {adjustments.filter((a) => a.adjustmentType.includes('-')).length}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={22} color="#ef4444" />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Main Table Card */}
      <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff' }}>
          <TextField
            placeholder="Search adjustments by ID, product, warehouse, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ width: { xs: '100%', sm: 360 } }}
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

        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Adjustment ID</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Product Details</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Location / Warehouse</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Type & Qty</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Adjustment Reason</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Adjusted By</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Date & Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAdjustments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                const isAddition = row.adjustmentType.includes('+');
                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Chip label={row.id} size="small" sx={{ fontWeight: 700, backgroundColor: '#f1f5f9', color: '#0f172a', borderRadius: 1.5 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a' }}>
                        {row.productName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        SKU: {row.sku}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#334155' }}>
                        {row.warehouse}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={isAddition ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        label={`${isAddition ? '+' : '-'}${row.qty} Units`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          backgroundColor: isAddition ? '#dcfce7' : '#fee2e2',
                          color: isAddition ? '#15803d' : '#b91c1c',
                          borderRadius: 2
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '13px' }}>
                        {row.reason}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>
                        {row.adjustedBy}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px' }}>
                        {row.date}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredAdjustments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* New Adjustment Dialog with Proper Top-Labeled Input Design */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
          },
        }}
      >
        {/* Modal Header */}
        <Box sx={{ px: 3, py: 2.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#0f172a', fontSize: '18px' }}>
              Record Stock Adjustment
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Reconcile physical inventory discrepancies, write-offs, or stock damage
            </Typography>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)} size="small" sx={{ color: '#64748b', '&:hover': { backgroundColor: '#e2e8f0' } }}>
            <X size={18} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
            {/* Field: Product Select (Full Width) */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Select Inventory Product <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <Autocomplete
                options={products}
                getOptionLabel={(option) => `${option.name} (SKU: ${option.sku}) - Current: ${option.currentStock}`}
                value={formData.selectedProduct}
                onChange={(_, newValue) => setFormData({ ...formData, selectedProduct: newValue })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search product by title, SKU, or serial..."
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' },
                    }}
                  />
                )}
              />
            </Box>

            {/* Field: Warehouse */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Warehouse / Location <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={formData.warehouse}
                  onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                  sx={{ borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' }}
                >
                  <MenuItem value="Main Warehouse Chennai">Main Warehouse Chennai</MenuItem>
                  <MenuItem value="Avadi Store">Avadi Store</MenuItem>
                  <MenuItem value="Central Hub Ambattur">Central Hub Ambattur</MenuItem>
                  <MenuItem value="Tambaram Branch">Tambaram Branch</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Field: Adjustment Type */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Adjustment Type <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={formData.adjustmentType}
                  onChange={(e) => setFormData({ ...formData, adjustmentType: e.target.value })}
                  sx={{ borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' }}
                >
                  <MenuItem value="Deduction (-)">Deduction (-) Subtract from stock</MenuItem>
                  <MenuItem value="Addition (+)">Addition (+) Add to stock</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Field: Quantity */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Adjustment Quantity <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                type="number"
                fullWidth
                size="small"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Field: Reason */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Adjustment Reason <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  sx={{ borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' }}
                >
                  <MenuItem value="Physical Count Discrepancy">Physical Count Discrepancy</MenuItem>
                  <MenuItem value="Damaged in Warehouse">Damaged in Warehouse</MenuItem>
                  <MenuItem value="Expired Goods">Expired Goods</MenuItem>
                  <MenuItem value="Defective RMA Return">Defective RMA Return</MenuItem>
                  <MenuItem value="Stolen / Lost Inventory">Stolen / Lost Inventory</MenuItem>
                  <MenuItem value="Sample / Demo Write-Off">Sample / Demo Write-Off</MenuItem>
                  <MenuItem value="Supplier Correction">Supplier Correction</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Field: Remarks (Full Width) */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Audit Remarks & Reference Notes
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                placeholder="Include invoice/audit reference, batch number, or inspector notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>
          </Box>
        </DialogContent>

        {/* Modal Actions */}
        <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600, px: 2.5 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAdjustment}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              backgroundColor: '#0f2b48',
              fontWeight: 600,
              px: 3.5,
              py: 1,
              '&:hover': { backgroundColor: '#1e3a8a' },
            }}
          >
            Confirm Adjustment
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
