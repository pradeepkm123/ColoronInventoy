import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
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
  Typography,
  Chip,
  Card,
  CardContent,
  Avatar,
  InputAdornment,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Users,
  UserCheck,
  MapPin,
  Phone,
  BadgeCheck,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  X,
  Building
} from 'lucide-react';
import { useSnackbar } from 'notistack';

const API = 'http://localhost:5002';

export default function SalesPerson() {
  const { enqueueSnackbar } = useSnackbar();

  const [salesPersons, setSalesPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');

  // Dialog State
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeId: '',
    location: '',
    mobileNo: '',
  });

  const [errors, setErrors] = useState({});

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchSalesPersons();
  }, []);

  const fetchSalesPersons = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/api/salesPersons`);
      setSalesPersons(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching sales persons:', error);
      enqueueSnackbar('Error fetching sales persons from server!', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      employeeName: '',
      employeeId: '',
      location: '',
      mobileNo: '',
    });
    setErrors({});
    setOpen(true);
  };

  const handleOpenEdit = (person) => {
    setEditId(person._id);
    setFormData({
      employeeName: person.employeeName || '',
      employeeId: person.employeeId || '',
      location: person.location || '',
      mobileNo: person.mobileNo || '',
    });
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditId(null);
    setErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.employeeName.trim()) newErrors.employeeName = 'Employee Name is required';
    if (!formData.employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
    if (!formData.location.trim()) newErrors.location = 'Location / Branch is required';
    if (!formData.mobileNo.trim()) newErrors.mobileNo = 'Mobile Number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (editId) {
        await axios.put(`${API}/api/salesPersons/${editId}`, formData);
        enqueueSnackbar('Sales person updated successfully!', { variant: 'success' });
      } else {
        await axios.post(`${API}/api/salesPersons`, formData);
        enqueueSnackbar('Sales person added successfully!', { variant: 'success' });
      }
      fetchSalesPersons();
      handleClose();
    } catch (error) {
      console.error('Error saving sales person:', error);
      enqueueSnackbar('Error saving sales person details!', { variant: 'error' });
    }
  };

  const handleDeleteConfirmOpen = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirmClose = () => {
    setConfirmOpen(false);
    setDeleteId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API}/api/salesPersons/${deleteId}`);
      enqueueSnackbar('Sales person deleted successfully!', { variant: 'success' });
      fetchSalesPersons();
      handleDeleteConfirmClose();
    } catch (error) {
      console.error('Error deleting sales person:', error);
      enqueueSnackbar('Error deleting sales person!', { variant: 'error' });
    }
  };

  // Location filter options
  const uniqueLocations = useMemo(() => {
    const locs = salesPersons.map((sp) => sp.location).filter(Boolean);
    return Array.from(new Set(locs));
  }, [salesPersons]);

  // Client-side filtering
  const filteredSalesPersons = useMemo(() => {
    return salesPersons.filter((sp) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (sp.employeeName && sp.employeeName.toLowerCase().includes(q)) ||
        (sp.employeeId && sp.employeeId.toLowerCase().includes(q)) ||
        (sp.location && sp.location.toLowerCase().includes(q)) ||
        (sp.mobileNo && sp.mobileNo.toLowerCase().includes(q));

      const matchesLocation =
        filterLocation === 'all' ||
        (sp.location && sp.location.toLowerCase() === filterLocation.toLowerCase());

      return matchesSearch && matchesLocation;
    });
  }, [salesPersons, searchQuery, filterLocation]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
            Sales Person Details
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Manage sales representatives, field personnel, territory allocations, and contact records.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={fetchSalesPersons}
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
            Add Employee
          </Button>
        </Box>
      </Box>

      {/* KPI Stat Cards (Full Screen Grid) */}
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
                Total Sales Persons
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5 }}>
                {salesPersons.length}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} color="#2563eb" />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Active Territories
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#16a34a', mt: 0.5 }}>
                {uniqueLocations.length}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={22} color="#16a34a" />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Assigned Staff IDs
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#9333ea', mt: 0.5 }}>
                {salesPersons.filter((sp) => sp.employeeId).length}
              </Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BadgeCheck size={22} color="#9333ea" />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Main Table Paper */}
      <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden', width: '100%' }}>
        {/* Filters Bar */}
        <Box sx={{ p: 2.5, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff' }}>
          <TextField
            placeholder="Search employee name, ID, location, or mobile..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
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
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Filter Location</InputLabel>
              <Select
                value={filterLocation}
                label="Filter Location"
                onChange={(e) => {
                  setFilterLocation(e.target.value);
                  setPage(0);
                }}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Locations</MenuItem>
                {uniqueLocations.map((loc, idx) => (
                  <MenuItem key={idx} value={loc}>
                    {loc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Data Table */}
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', width: 60 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Employee Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Employee ID</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Location / Branch</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Mobile Number</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', width: 120 }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredSalesPersons
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((person, idx) => {
                  const initials = (person.employeeName || 'SP')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <TableRow key={person._id || idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              fontSize: '13px',
                              fontWeight: 700,
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #dbeafe',
                            }}
                          >
                            {initials}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a' }}>
                              {person.employeeName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              Sales Representative
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={person.employeeId || '—'}
                          size="small"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            backgroundColor: '#f1f5f9',
                            color: '#1e293b',
                            borderRadius: 1.5,
                            fontSize: '12px',
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <MapPin size={15} color="#64748b" />
                          <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>
                            {person.location || '—'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Phone size={15} color="#64748b" />
                          <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 500, fontFamily: 'monospace' }}>
                            {person.mobileNo || '—'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Tooltip title="Edit Employee">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(person)}
                              sx={{ color: '#0284c7', backgroundColor: '#e0f2fe', '&:hover': { backgroundColor: '#bae6fd' } }}
                            >
                              <Edit2 size={15} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Employee">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteConfirmOpen(person._id)}
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

              {filteredSalesPersons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Users size={40} color="#94a3b8" style={{ marginBottom: 8 }} />
                    <Typography variant="body1" fontWeight={600} sx={{ color: '#334155' }}>
                      No Sales Persons Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Try adjusting your search criteria or click "Add Employee" to register one.
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
          count={filteredSalesPersons.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Add / Edit Dialog with Proper Top-Labeled Input Design */}
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
        {/* Modal Header */}
        <Box sx={{ px: 3, py: 2.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#0f172a', fontSize: '18px' }}>
              {editId ? 'Edit Sales Person' : 'Add New Sales Person'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {editId ? 'Update personnel records and contact details' : 'Register sales executive and branch allocation'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: '#64748b', '&:hover': { backgroundColor: '#e2e8f0' } }}>
            <X size={18} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
            {/* Field: Employee Name */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Employee Full Name <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="employeeName"
                placeholder="e.g. Ramesh Kumar"
                value={formData.employeeName}
                onChange={handleFormChange}
                error={!!errors.employeeName}
                helperText={errors.employeeName}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Field: Employee ID */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Employee ID Code <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="employeeId"
                placeholder="e.g. EMP-1049"
                value={formData.employeeId}
                onChange={handleFormChange}
                error={!!errors.employeeId}
                helperText={errors.employeeId}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', fontFamily: 'monospace', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Field: Location / Branch */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Location / Territory <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="location"
                placeholder="e.g. Chennai, Jaipur, Bangalore"
                value={formData.location}
                onChange={handleFormChange}
                error={!!errors.location}
                helperText={errors.location}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>

            {/* Field: Mobile Number */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                Mobile Contact Number <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="mobileNo"
                placeholder="e.g. 9876543210"
                value={formData.mobileNo}
                onChange={handleFormChange}
                error={!!errors.mobileNo}
                helperText={errors.mobileNo}
                InputProps={{ sx: { borderRadius: 2, fontSize: '14px', backgroundColor: '#fff' } }}
              />
            </Box>
          </Box>
        </DialogContent>

        {/* Modal Actions */}
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
            {editId ? 'Update Employee' : 'Save Employee'}
          </Button>
        </Box>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={handleDeleteConfirmClose}
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
            Confirm Delete Sales Person
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
            Are you sure you want to remove this sales representative? Historical inward/outward invoices referencing this employee will still retain their name.
          </Typography>
        </Box>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={handleDeleteConfirmClose} sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}>
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
