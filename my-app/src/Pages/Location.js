import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Chip,
  Card,
  CardContent,
  Tooltip,
  Switch,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  MapPin,
  Warehouse as WarehouseIcon,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  X,
} from 'lucide-react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';

const API = 'http://localhost:5002';

export default function Location() {
  const { enqueueSnackbar } = useSnackbar();

  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [locations, setLocations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    locationName: '',
    warehouseId: '',
    createdOn: new Date(),
    status: true,
  });

  const [filterText, setFilterText] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/locations`);
      setLocations(Array.isArray(res.data) ? res.data : []);
    } catch {
      enqueueSnackbar('Error fetching locations!', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/warehouses`);
      setWarehouses(Array.isArray(res.data) ? res.data : []);
    } catch {
      enqueueSnackbar('Error fetching warehouses!', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchLocations();
    fetchWarehouses();
  }, [fetchLocations, fetchWarehouses]);

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      locationName: '',
      warehouseId: warehouses[0]?._id || '',
      createdOn: new Date(),
      status: true,
    });
    setOpen(true);
  };

  const handleEdit = (loc) => {
    setEditId(loc._id);
    setFormData({
      locationName: loc.locationName || '',
      warehouseId: loc.warehouseId || '',
      createdOn: loc.createdOn ? new Date(loc.createdOn) : new Date(),
      status: loc.status ?? true,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditId(null);
  };

  const handleSave = async () => {
    if (!formData.locationName.trim()) {
      enqueueSnackbar('Location Name is required!', { variant: 'warning' });
      return;
    }

    try {
      const payload = {
        locationName: formData.locationName,
        warehouseId: formData.warehouseId,
        createdOn: formData.createdOn,
        status: formData.status,
      };

      if (editId) {
        await axios.put(`${API}/api/locations/${editId}`, payload);
        enqueueSnackbar('Location updated successfully!', { variant: 'success' });
      } else {
        await axios.post(`${API}/api/locations`, payload);
        enqueueSnackbar('Location created successfully!', { variant: 'success' });
      }
      fetchLocations();
      handleClose();
    } catch (error) {
      console.error('Error saving location:', error);
      enqueueSnackbar('Error saving location details!', { variant: 'error' });
    }
  };

  const handleDeleteConfirmOpen = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API}/api/locations/${deleteId}`);
      enqueueSnackbar('Location deleted successfully!', { variant: 'success' });
      fetchLocations();
      setConfirmOpen(false);
      setDeleteId(null);
    } catch {
      enqueueSnackbar('Error deleting location!', { variant: 'error' });
    }
  };

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const q = filterText.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (loc.locationName && loc.locationName.toLowerCase().includes(q));

      const matchesWarehouse =
        warehouseFilter === 'all' || loc.warehouseId === warehouseFilter;

      return matchesSearch && matchesWarehouse;
    });
  }, [locations, filterText, warehouseFilter]);

  const activeLocationsCount = locations.filter((l) => l.status).length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
            Store & Warehouse Locations
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Manage specific aisle, shelf, zone, and distribution points linked to primary warehouses.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={() => {
              fetchLocations();
              fetchWarehouses();
            }}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: '#cbd5e1',
              color: '#334155',
              fontWeight: 600,
              px: 2,
              '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f1f5f9' },
            }}
          >
            Refresh
          </Button>

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
            Add Location
          </Button>
        </Box>
      </Box>

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
                Total Locations
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5 }}>
                {locations.length}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={22} color="#2563eb" />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Connected Warehouses
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#16a34a', mt: 0.5 }}>
                {warehouses.length}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WarehouseIcon size={22} color="#16a34a" />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Active Locations
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#9333ea', mt: 0.5 }}>
                {activeLocationsCount}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={22} color="#9333ea" />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden', width: '100%' }}>
        <Box sx={{ p: 2.5, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff' }}>
          <TextField
            placeholder="Search location name or zone..."
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value);
              setPage(0);
            }}
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

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Warehouse</InputLabel>
              <Select
                value={warehouseFilter}
                label="Filter by Warehouse"
                onChange={(e) => {
                  setWarehouseFilter(e.target.value);
                  setPage(0);
                }}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Warehouses</MenuItem>
                {warehouses.map((w) => (
                  <MenuItem key={w._id} value={w._id}>
                    {w.warehouse}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', width: 60 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Location Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Linked Warehouse</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Created Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', width: 120 }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredLocations
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((loc, idx) => {
                  const linkedWh = warehouses.find((w) => w._id === loc.warehouseId);

                  return (
                    <TableRow key={loc._id || idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={18} color="#2563eb" />
                          </Box>
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a' }}>
                            {loc.locationName}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={linkedWh ? linkedWh.warehouse : 'Unassigned'}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            backgroundColor: linkedWh ? '#eff6ff' : '#f1f5f9',
                            color: linkedWh ? '#1d4ed8' : '#64748b',
                            borderRadius: 1.5,
                            fontSize: '12px',
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px' }}>
                          {loc.createdOn ? new Date(loc.createdOn).toLocaleDateString('en-GB') : '—'}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          label={loc.status ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            backgroundColor: loc.status ? '#dcfce7' : '#fee2e2',
                            color: loc.status ? '#15803d' : '#b91c1c',
                            fontWeight: 700,
                            borderRadius: 1.5,
                            fontSize: '12px',
                          }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Tooltip title="Edit Location">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(loc)}
                              sx={{ color: '#0284c7', backgroundColor: '#e0f2fe', '&:hover': { backgroundColor: '#bae6fd' } }}
                            >
                              <Edit2 size={15} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Location">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteConfirmOpen(loc._id)}
                              sx={{ color: '#ef4444', backgroundColor: '#fee2e2', '&:hover': { backgroundColor: '#fecaca' } }}
                            >
                              <Trash2 size={15} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}

              {filteredLocations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <MapPin size={40} color="#94a3b8" style={{ marginBottom: 8 }} />
                    <Typography variant="body1" fontWeight={600} sx={{ color: '#334155' }}>
                      No Locations Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Try adjusting your search criteria or click "Add Location" to create a new one.
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
          count={filteredLocations.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ px: 3, py: 2.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#0f172a', fontSize: '18px' }}>
              {editId ? 'Edit Location' : 'Add New Location'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {editId ? 'Modify location details and primary warehouse link' : 'Define new warehouse zone, rack, or aisle location'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: '#64748b', '&:hover': { backgroundColor: '#e2e8f0' } }}>
            <X size={18} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Location / Zone Name <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. Zone A - Rack 04, Ground Floor Bay 1"
                value={formData.locationName}
                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Linked Primary Warehouse <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={formData.warehouseId}
                  onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                  sx={{ borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' }}
                >
                  {warehouses.map((w) => (
                    <MenuItem key={w._id} value={w._id}>
                      {w.warehouse}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Registration Date
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  value={formData.createdOn}
                  onChange={(newDate) => setFormData({ ...formData, createdOn: newDate || new Date() })}
                  slotProps={{ textField: { fullWidth: true, size: 'small', InputProps: { sx: { borderRadius: 2, backgroundColor: '#fff' } } } }}
                />
              </LocalizationProvider>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                border: '1px solid #e2e8f0',
                borderRadius: 2.5,
                backgroundColor: formData.status ? '#f0fdf4' : '#f8fafc',
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a' }}>
                  Location Status: {formData.status ? 'Active' : 'Inactive'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Active locations can receive inward and outward stock movements.
                </Typography>
              </Box>
              <Switch
                checked={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                color="primary"
              />
            </Box>
          </Box>
        </DialogContent>

        <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Button onClick={handleClose} sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600, px: 2.5 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
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
            {editId ? 'Update Location' : 'Save Location'}
          </Button>
        </Box>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#0f172a' }}>
            Confirm Delete Location
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
            Are you sure you want to remove this storage location?
          </Typography>
        </Box>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}>
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
              px: 2.5,
              '&:hover': { backgroundColor: '#dc2626' },
            }}
          >
            Delete
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
