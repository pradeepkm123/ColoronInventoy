import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TablePagination,
} from '@mui/material';
import axios from 'axios';
import { Typography } from '@mui/material';

const Qoh = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [locations, setLocations] = useState([]);
  const [modelNumber, setModelNumber] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    fetchInventoryData();
    fetchLocations();
  }, []);

  const fetchInventoryData = async () => {
    try {
      const response = await axios.get('http://localhost:5002/api/inventory');
      setInventoryData(response.data);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get('http://localhost:5002/api/locations');
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const getLocationName = (locationId) => {
    if (!locationId) return 'Unknown';
    if (typeof locationId === 'string' && locationId !== '') {
      const foundLocation = locations.find(loc =>
        loc._id === locationId || loc.locationName === locationId
      );
      return foundLocation ? foundLocation.locationName : locationId;
    }
    if (typeof locationId === 'object' && locationId.locationName) {
      return locationId.locationName;
    }
    return 'Unknown';
  };

  const ensureArray = (data) => {
    if (!Array.isArray(data)) {
      return [data]; // Convert to array if it's not already
    }
    return data;
  };

  const filteredInventoryData = inventoryData.filter((item) => {
    const matchesModelNumber = item.modelNo.toLowerCase().includes(modelNumber.toLowerCase());
    const matchesLocation = selectedLocation ? getLocationName(item.location) === selectedLocation : true;
    return matchesModelNumber && matchesLocation;
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Quality On Hand
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, boxShadow: 3, p: 2 }}>
        <TextField
          label="Model Number"
          variant="outlined"
          value={modelNumber}
          onChange={(e) => setModelNumber(e.target.value)}
          sx={{ width: '48%' }}
        />
        <FormControl sx={{ width: '48%' }}>
          <InputLabel id="location-select-label">Location</InputLabel>
          <Select
            labelId="location-select-label"
            id="location-select"
            value={selectedLocation}
            label="Location"
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {locations.map((location) => (
              <MenuItem key={location._id} value={location.locationName}>
                {location.locationName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Model No</TableCell>
              <TableCell>Scanned Codes</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Location</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInventoryData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.modelNo}</TableCell>
                  <TableCell>{ensureArray(item.scannedCodes).join(', ')}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{getLocationName(item.location)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredInventoryData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default Qoh;
