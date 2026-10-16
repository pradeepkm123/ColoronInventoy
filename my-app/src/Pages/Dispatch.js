// import React, { useState, useEffect, useRef } from 'react';
// import {
//   Box,
//   Button,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
//   TextField,
//   IconButton,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Checkbox,
//   TablePagination,
//   Typography,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   FormHelperText
// } from '@mui/material';
// import DeleteIcon from '@mui/icons-material/Delete';
// import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
// import axios from 'axios';
// import { useSnackbar } from 'notistack';

// const Dispatch = () => {
//   const { enqueueSnackbar } = useSnackbar();
//   const [invoices, setInvoices] = useState([]);
//   const [models, setModels] = useState([]);
//   const [salePersons, setSalePersons] = useState([]);
//   const [page, setPage] = useState(0);
//   const [rowsPerPage, setRowsPerPage] = useState(5);
//   const [selected, setSelected] = useState([]);
//   const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
//   const [openDispatchDialog, setOpenDispatchDialog] = useState(false);
//   const [selectedInvoice, setSelectedInvoice] = useState(null);
//   const [formData, setFormData] = useState({
//     invoiceId: '',
//     modelNo: '',
//     salePerson: '',
//     quantity: 0,
//     price: 0,
//     shd: '',
//     scannedCodes: '',
//   });
//   const [errors, setErrors] = useState({
//     invoiceId: '',
//     modelNo: '',
//     salePerson: '',
//     shd: '',
//   });
//   const [scannedBarcodes, setScannedBarcodes] = useState(new Set());
//   const shdInputRef = useRef(null);

//   useEffect(() => {
//     fetchInvoices();
//     fetchModels();
//     fetchSalePersons();
//   }, []);

//   const fetchInvoices = async () => {
//     try {
//       const response = await axios.get('http://localhost:5002/api/invoices');
//       setInvoices(response.data);
//     } catch (error) {
//       console.error('Error fetching invoices:', error);
//       enqueueSnackbar('Failed to fetch invoices', { variant: 'error' });
//     }
//   };

//   const fetchModels = async () => {
//     try {
//       const response = await axios.get('http://localhost:5002/api/inventory');
//       const data = Array.isArray(response.data) ? response.data : response.data.models || [];
//       setModels(data);
//     } catch (error) {
//       console.error('Error fetching models:', error);
//       enqueueSnackbar('Failed to fetch models', { variant: 'error' });
//     }
//   };

//   const fetchSalePersons = async () => {
//     try {
//       const response = await axios.get('http://localhost:5002/salesPersons');
//       setSalePersons(response.data);
//     } catch (error) {
//       console.error('Error fetching sale persons:', error);
//       enqueueSnackbar('Failed to fetch sales persons', { variant: 'error' });
//     }
//   };

//   const handleDelete = (invoice) => {
//     setSelectedInvoice(invoice);
//     setOpenDeleteDialog(true);
//   };

//   const handleConfirmDelete = async () => {
//     try {
//       if (selected.length > 0) {
//         await Promise.all(
//           selected.map((id) => axios.delete(`http://localhost:5002/api/invoices/${id}`))
//         );
//         enqueueSnackbar(`${selected.length} invoices deleted successfully`, { variant: 'success' });
//       } else if (selectedInvoice) {
//         await axios.delete(`http://localhost:5002/api/invoices/${selectedInvoice._id}`);
//         enqueueSnackbar('Invoice deleted successfully', { variant: 'success' });
//       }
//       setOpenDeleteDialog(false);
//       setSelected([]);
//       fetchInvoices();
//     } catch (error) {
//       console.error('Error deleting invoice(s):', error);
//       enqueueSnackbar('Failed to delete invoice(s)', { variant: 'error' });
//     }
//   };

//   const handleDispatch = (invoice) => {
//     setSelectedInvoice(invoice);
//     setOpenDispatchDialog(true);
//     setFormData({
//       invoiceId: invoice._id,
//       modelNo: '',
//       salePerson: '',
//       quantity: 0,
//       price: 0,
//       shd: '',
//       scannedCodes: '',
//     });
//     setScannedBarcodes(new Set());
//     setErrors({
//       invoiceId: '',
//       modelNo: '',
//       salePerson: '',
//       shd: '',
//     });
//   };

//   const handleCloseDeleteDialog = () => {
//     setOpenDeleteDialog(false);
//   };

//   const handleCloseDispatchDialog = () => {
//     setOpenDispatchDialog(false);
//   };

//   const handleChangePage = (event, newPage) => {
//     setPage(newPage);
//   };

//   const handleChangeRowsPerPage = (event) => {
//     setRowsPerPage(parseInt(event.target.value, 10));
//     setPage(0);
//   };

//   const handleFormChange = (event) => {
//     const { name, value } = event.target;
//     setFormData({
//       ...formData,
//       [name]: value,
//     });
//     if (errors[name]) {
//       setErrors({
//         ...errors,
//         [name]: '',
//       });
//     }
//   };

//   const handleInvoiceChange = (event) => {
//     const selectedInvoiceId = event.target.value;
//     const selectedInvoice = invoices.find(invoice => invoice._id === selectedInvoiceId);
//     setFormData({
//       ...formData,
//       invoiceId: selectedInvoiceId,
//       customerName: selectedInvoice.customer.customerName,
//       customerAddress: selectedInvoice.customer.address,
//       mailId: selectedInvoice.customer.mailId,
//       phoneNumber: selectedInvoice.customer.phoneNo,
//     });
//   };

//   useEffect(() => {
//     const processBarcode = () => {
//       const barcode = formData.shd.trim();
//       if (!barcode) return;
//       if (!formData.modelNo) {
//         setErrors(prev => ({ ...prev, shd: 'Please select model number first!' }));
//         enqueueSnackbar('Please select model number before scanning!', { variant: 'error' });
//         return;
//       }
//       if (barcode.length >= 8) {
//         const hyphenIndex = formData.modelNo.indexOf("-");
//         const modelRelevantPart = hyphenIndex !== -1 ? formData.modelNo.slice(hyphenIndex + 1) : formData.modelNo;
//         if (scannedBarcodes.has(barcode)) {
//           setErrors(prev => ({ ...prev, shd: 'Barcode already scanned!' }));
//           enqueueSnackbar('This barcode already scanned!', { variant: 'error' });
//         } else if (!barcode.includes(modelRelevantPart)) {
//           setErrors(prev => ({ ...prev, shd: 'Mismatch: Barcode does not contain model number!' }));
//           enqueueSnackbar('Mismatch: Barcode does not contain model number!', { variant: 'error' });
//         } else {
//           setScannedBarcodes(prev => new Set(prev).add(barcode));
//           setFormData(prevFormData => ({
//             ...prevFormData,
//             scannedCodes: prevFormData.scannedCodes
//               ? `${prevFormData.scannedCodes} ${barcode}`
//               : barcode,
//             shd: '',
//           }));
//           setErrors(prev => ({ ...prev, shd: '' }));
//         }
//       }
//     };
//     if (formData.shd) {
//       const timer = setTimeout(processBarcode, 100);
//       return () => clearTimeout(timer);
//     }
//   }, [formData.shd, formData.modelNo, scannedBarcodes, enqueueSnackbar]);

//   const validateForm = () => {
//     let valid = true;
//     const newErrors = { invoiceId: '', modelNo: '', salePerson: '', shd: '' };
//     if (!formData.invoiceId) {
//       newErrors.invoiceId = 'Invoice No is required';
//       valid = false;
//     }
//     if (!formData.modelNo) {
//       newErrors.modelNo = 'Model No is required';
//       valid = false;
//     }
//     if (!formData.salePerson) {
//       newErrors.salePerson = 'Sales Person is required';
//       valid = false;
//     }
//     if (scannedBarcodes.size === 0) {
//       newErrors.shd = 'Please scan at least one barcode';
//       valid = false;
//     }
//     setErrors(newErrors);
//     return valid;
//   };

//   const handleSubmitDispatch = async () => {
//     if (!validateForm()) return;
//     try {
//       const dispatchData = {
//         invoiceId: formData.invoiceId,
//         modelNo: formData.modelNo,
//         quantity: formData.quantity,
//         price: formData.price,
//         salePerson: formData.salePerson,
//         barcodes: Array.from(scannedBarcodes),
//         dispatchDate: new Date(),
//         customerName: selectedInvoice?.customer?.customerName || '',
//         customerAddress: selectedInvoice?.customer?.address || '',
//         mailId: selectedInvoice?.customer?.mailId || '',
//         phoneNumber: selectedInvoice?.customer?.phoneNo || '',
//       };

//       await axios.post('http://localhost:5002/api/dispatch', dispatchData);
//       enqueueSnackbar('Dispatch recorded successfully!', { variant: 'success' });
//       handleCloseDispatchDialog();
//     } catch (error) {
//       console.error('Error recording dispatch:', error);
//       enqueueSnackbar('Failed to record dispatch', { variant: 'error' });
//     }
//   };

//   const emptyRows = rowsPerPage - Math.min(rowsPerPage, invoices.length - page * rowsPerPage);

//   return (
//     <Box sx={{ width: '100%', p: 3 }}>
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//         <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
//           Dispatch Management
//         </Typography>
//         <Button
//           variant="contained"
//           color="error"
//           startIcon={<DeleteSweepIcon />}
//           onClick={() => selected.length > 0 && setOpenDeleteDialog(true)}
//           disabled={selected.length === 0}
//         >
//           Delete Selected
//         </Button>
//       </Box>
//       <TableContainer component={Paper} sx={{ mb: 3 }}>
//         <Table sx={{ minWidth: 650 }}>
//           <TableHead>
//             <TableRow>
//               <TableCell padding="checkbox">
//                 <Checkbox
//                   indeterminate={selected.length > 0 && selected.length < invoices.length}
//                   checked={invoices.length > 0 && selected.length === invoices.length}
//                   onChange={(e) => {
//                     if (e.target.checked) {
//                       setSelected(invoices.map((invoice) => invoice._id));
//                     } else {
//                       setSelected([]);
//                     }
//                   }}
//                 />
//               </TableCell>
//               <TableCell>Invoice No</TableCell>
//               <TableCell>Invoice Date</TableCell>
//               <TableCell>Customer Name</TableCell>
//               <TableCell>Customer Address</TableCell>
//               <TableCell>Mail ID</TableCell>
//               <TableCell>Phone Number</TableCell>
//               <TableCell>Actions</TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {invoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((invoice) => (
//               <TableRow key={invoice._id} hover>
//                 <TableCell padding="checkbox">
//                   <Checkbox
//                     checked={selected.includes(invoice._id)}
//                     onChange={(e) => {
//                       if (e.target.checked) {
//                         setSelected((prev) => [...prev, invoice._id]);
//                       } else {
//                         setSelected((prev) => prev.filter((id) => id !== invoice._id));
//                       }
//                     }}
//                   />
//                 </TableCell>
//                 <TableCell>{invoice.invoiceNumber}</TableCell>
//                 <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
//                 <TableCell>{invoice.customer?.customerName || 'N/A'}</TableCell>
//                 <TableCell>{invoice.customer?.address || 'N/A'}</TableCell>
//                 <TableCell>{invoice.customer?.mailId || 'N/A'}</TableCell>
//                 <TableCell>{invoice.customer?.phoneNo || 'N/A'}</TableCell>
//                 <TableCell>
//                   <Box sx={{ display: 'flex', gap: 1 }}>
//                     <IconButton onClick={() => handleDelete(invoice)} color="error">
//                       <DeleteIcon />
//                     </IconButton>
//                     <Button
//                       variant="contained"
//                       size="small"
//                       onClick={() => handleDispatch(invoice)}
//                     >
//                       Dispatch
//                     </Button>
//                   </Box>
//                 </TableCell>
//               </TableRow>
//             ))}
//             {emptyRows > 0 && (
//               <TableRow style={{ height: 53 * emptyRows }}>
//                 <TableCell colSpan={8} />
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </TableContainer>
//       <TablePagination
//         rowsPerPageOptions={[5, 10, 25]}
//         component="div"
//         count={invoices.length}
//         rowsPerPage={rowsPerPage}
//         page={page}
//         onPageChange={handleChangePage}
//         onRowsPerPageChange={handleChangeRowsPerPage}
//       />
//       <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
//         <DialogTitle>Confirm Delete</DialogTitle>
//         <DialogContent>
//           {selected.length > 0
//             ? `Are you sure you want to delete ${selected.length} selected invoices?`
//             : 'Are you sure you want to delete this invoice?'}
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
//           <Button onClick={handleConfirmDelete} color="error" variant="contained">
//             Delete
//           </Button>
//         </DialogActions>
//       </Dialog>
//       <Dialog
//         open={openDispatchDialog}
//         onClose={handleCloseDispatchDialog}
//         maxWidth="sm"
//         fullWidth
//       >
//         <DialogTitle>Dispatch Products</DialogTitle>
//         <DialogContent>
//           <Typography variant="h6" component="h2" sx={{ mt: 2 }}>
//             Customer Details
//           </Typography>
//           <FormControl fullWidth sx={{ mt: 2 }}>
//             <InputLabel id="invoice-select-label">Invoice No *</InputLabel>
//             <Select
//               labelId="invoice-select-label"
//               id="invoice-select"
//               value={formData.invoiceId}
//               label="Invoice No *"
//               onChange={handleInvoiceChange}
//               name="invoiceId"
//               error={!!errors.invoiceId}
//             >
//               {invoices.map((invoice) => (
//                 <MenuItem key={invoice._id} value={invoice._id}>
//                   {invoice.invoiceNumber}
//                 </MenuItem>
//               ))}
//             </Select>
//             <FormHelperText>{errors.invoiceId}</FormHelperText>
//           </FormControl>
//           <TextField
//             margin="dense"
//             label="Invoice Date"
//             fullWidth
//             value={selectedInvoice ? new Date(selectedInvoice.invoiceDate).toLocaleDateString() : ''}
//             InputProps={{ readOnly: true }}
//           />
//           <TextField
//             margin="dense"
//             label="Customer Name"
//             fullWidth
//             value={selectedInvoice?.customer?.customerName || ''}
//             InputProps={{ readOnly: true }}
//           />
//           <TextField
//             margin="dense"
//             label="Customer Address"
//             fullWidth
//             value={selectedInvoice?.customer?.address || ''}
//             InputProps={{ readOnly: true }}
//           />
//           <TextField
//             margin="dense"
//             label="Mail ID"
//             fullWidth
//             value={selectedInvoice?.customer?.mailId || ''}
//             InputProps={{ readOnly: true }}
//           />
//           <TextField
//             margin="dense"
//             label="Phone Number"
//             fullWidth
//             value={selectedInvoice?.customer?.phoneNo || ''}
//             InputProps={{ readOnly: true }}
//           />
//           <FormControl fullWidth error={!!errors.modelNo} sx={{ mt: 2 }}>
//             <InputLabel id="model-select-label">Model No *</InputLabel>
//             <Select
//               labelId="model-select-label"
//               id="model-select"
//               value={formData.modelNo}
//               label="Model No *"
//               onChange={handleFormChange}
//               name="modelNo"
//             >
//               {models.map((model) => (
//                 <MenuItem key={model._id} value={model.modelNo}>
//                   {model.modelNo}
//                 </MenuItem>
//               ))}
//             </Select>
//             <FormHelperText>{errors.modelNo}</FormHelperText>
//           </FormControl>
//           <FormControl fullWidth error={!!errors.salePerson} sx={{ mt: 2 }}>
//             <InputLabel id="salesperson-select-label">Sales Person *</InputLabel>
//             <Select
//               labelId="salesperson-select-label"
//               id="salesperson-select"
//               value={formData.salePerson}
//               label="Sales Person *"
//               onChange={handleFormChange}
//               name="salePerson"
//             >
//               {salePersons.map((person) => (
//                 <MenuItem key={person._id} value={person.employeeName}>
//                   {person.employeeName}
//                 </MenuItem>
//               ))}
//             </Select>
//             <FormHelperText>{errors.salePerson}</FormHelperText>
//           </FormControl>
//           <TextField
//             label="Quantity"
//             type="number"
//             fullWidth
//             value={formData.quantity}
//             onChange={(e) => {
//               const value = Math.max(0, parseInt(e.target.value) || 0);
//               setFormData(prev => ({
//                 ...prev,
//                 quantity: value,
//               }));
//             }}
//             name="quantity"
//             inputProps={{ min: 0 }}
//             sx={{ mt: 2 }}
//           />
//           <TextField
//             label="Price per Unit"
//             type="number"
//             fullWidth
//             value={formData.price}
//             onChange={handleFormChange}
//             name="price"
//             InputProps={{ startAdornment: '₹' }}
//             inputProps={{ min: 0, step: '0.01' }}
//             sx={{ mt: 2 }}
//           />
//           <TextField
//             margin="dense"
//             label="Scan barcode (auto-scan)"
//             fullWidth
//             value={formData.shd}
//             onChange={handleFormChange}
//             name="shd"
//             inputRef={shdInputRef}
//             error={!!errors.shd}
//             helperText={errors.shd}
//             sx={{ mt: 2 }}
//             autoFocus
//           />
//           <TextField
//             margin="dense"
//             label="Scanned Codes"
//             fullWidth
//             multiline
//             rows={4}
//             value={formData.scannedCodes}
//             name="scannedCodes"
//             onChange={handleFormChange}
//             InputProps={{ readOnly: true }}
//           />
//           <Typography variant="body2" sx={{ mr: 2, color: '#757575' }}>
//             Total Scanned Barcodes: {scannedBarcodes.size}
//           </Typography>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleCloseDispatchDialog}>Cancel</Button>
//           <Button
//             onClick={handleSubmitDispatch}
//             variant="contained"
//             color="primary"
//           >
//             Submit Dispatch
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// };

// export default Dispatch;


import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  TablePagination,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import axios from 'axios';
import { useSnackbar } from 'notistack';

const API = 'http://localhost:5002';

const Dispatch = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [invoices, setInvoices] = useState([]);
  const [models, setModels] = useState([]);
  const [salePersons, setSalePersons] = useState([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [selected, setSelected] = useState([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDispatchDialog, setOpenDispatchDialog] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [formData, setFormData] = useState({
    invoiceId: '',
    modelNo: '',
    salePerson: '',
    quantity: 0,
    price: 0,
    shd: '',
    scannedCodes: '',
  });

  const [errors, setErrors] = useState({
    invoiceId: '',
    modelNo: '',
    salePerson: '',
    shd: '',
  });

  const [scannedBarcodes, setScannedBarcodes] = useState(new Set());
  const shdInputRef = useRef(null);

  // ✅ useCallback fixes the ESLint dependency warning
  const fetchInvoices = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/api/invoices`);
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      enqueueSnackbar('Failed to fetch invoices', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const fetchModels = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/api/inventory`);
      const data = Array.isArray(response.data) ? response.data : (response.data?.models || []);
      setModels(data);
    } catch (error) {
      console.error('Error fetching models:', error);
      enqueueSnackbar('Failed to fetch models', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const fetchSalePersons = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/salesPersons`);
      setSalePersons(response.data || []);
    } catch (error) {
      console.error('Error fetching sale persons:', error);
      enqueueSnackbar('Failed to fetch sales persons', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  // ✅ now ESLint is happy
  useEffect(() => {
    fetchInvoices();
    fetchModels();
    fetchSalePersons();
  }, [fetchInvoices, fetchModels, fetchSalePersons]);

  const handleDelete = (invoice) => {
    setSelectedInvoice(invoice);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (selected.length > 0) {
        await Promise.all(selected.map((id) => axios.delete(`${API}/api/invoices/${id}`)));
        enqueueSnackbar(`${selected.length} invoices deleted successfully`, { variant: 'success' });
      } else if (selectedInvoice) {
        await axios.delete(`${API}/api/invoices/${selectedInvoice._id}`);
        enqueueSnackbar('Invoice deleted successfully', { variant: 'success' });
      }

      setOpenDeleteDialog(false);
      setSelected([]);
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice(s):', error);
      enqueueSnackbar('Failed to delete invoice(s)', { variant: 'error' });
    }
  };

  const handleDispatch = (invoice) => {
    setSelectedInvoice(invoice);
    setOpenDispatchDialog(true);

    setFormData({
      invoiceId: invoice._id,
      modelNo: '',
      salePerson: '',
      quantity: 0,
      price: 0,
      shd: '',
      scannedCodes: '',
    });

    setScannedBarcodes(new Set());
    setErrors({ invoiceId: '', modelNo: '', salePerson: '', shd: '' });

    // autofocus scan input
    setTimeout(() => shdInputRef.current?.focus?.(), 0);
  };

  const handleCloseDeleteDialog = () => setOpenDeleteDialog(false);
  const handleCloseDispatchDialog = () => setOpenDispatchDialog(false);

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleInvoiceChange = (event) => {
    const selectedInvoiceId = event.target.value;
    const inv = invoices.find((i) => i._id === selectedInvoiceId) || null;

    setSelectedInvoice(inv);
    setFormData((p) => ({ ...p, invoiceId: selectedInvoiceId }));
    if (errors.invoiceId) setErrors((p) => ({ ...p, invoiceId: '' }));
  };

  // Barcode auto-process
  useEffect(() => {
    const processBarcode = () => {
      const barcode = formData.shd.trim();
      if (!barcode) return;

      if (!formData.modelNo) {
        setErrors((prev) => ({ ...prev, shd: 'Please select model number first!' }));
        enqueueSnackbar('Please select model number before scanning!', { variant: 'error' });
        return;
      }

      if (barcode.length >= 8) {
        const hyphenIndex = formData.modelNo.indexOf('-');
        const modelRelevantPart = hyphenIndex !== -1 ? formData.modelNo.slice(hyphenIndex + 1) : formData.modelNo;

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

        setScannedBarcodes((prev) => new Set(prev).add(barcode));
        setFormData((prev) => ({
          ...prev,
          scannedCodes: prev.scannedCodes ? `${prev.scannedCodes} ${barcode}` : barcode,
          shd: '',
        }));
        setErrors((prev) => ({ ...prev, shd: '' }));
      }
    };

    if (formData.shd) {
      const timer = setTimeout(processBarcode, 100);
      return () => clearTimeout(timer);
    }
  }, [formData.shd, formData.modelNo, scannedBarcodes, enqueueSnackbar]);

  const validateForm = () => {
    let valid = true;
    const newErrors = { invoiceId: '', modelNo: '', salePerson: '', shd: '' };

    if (!formData.invoiceId) {
      newErrors.invoiceId = 'Invoice No is required';
      valid = false;
    }
    if (!formData.modelNo) {
      newErrors.modelNo = 'Model No is required';
      valid = false;
    }
    if (!formData.salePerson) {
      newErrors.salePerson = 'Sales Person is required';
      valid = false;
    }
    if (scannedBarcodes.size === 0) {
      newErrors.shd = 'Please scan at least one barcode';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmitDispatch = async () => {
    if (!validateForm()) return;

    try {
      const dispatchData = {
        invoiceId: formData.invoiceId,
        modelNo: formData.modelNo,
        quantity: Number(formData.quantity) || 0,
        price: Number(formData.price) || 0,
        salePerson: formData.salePerson,
        barcodes: Array.from(scannedBarcodes),
        dispatchDate: new Date(),
        customerName: selectedInvoice?.customer?.customerName || '',
        customerAddress: selectedInvoice?.customer?.address || '',
        mailId: selectedInvoice?.customer?.mailId || '',
        phoneNumber: selectedInvoice?.customer?.phoneNo || '',
      };

      await axios.post(`${API}/api/dispatch`, dispatchData);
      enqueueSnackbar('Dispatch recorded successfully!', { variant: 'success' });
      handleCloseDispatchDialog();
    } catch (error) {
      console.error('Error recording dispatch:', error);
      enqueueSnackbar('Failed to record dispatch', { variant: 'error' });
    }
  };

  const emptyRows = rowsPerPage - Math.min(rowsPerPage, invoices.length - page * rowsPerPage);

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Dispatch Management
        </Typography>
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteSweepIcon />}
          onClick={() => selected.length > 0 && setOpenDeleteDialog(true)}
          disabled={selected.length === 0}
        >
          Delete Selected
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < invoices.length}
                  checked={invoices.length > 0 && selected.length === invoices.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelected(invoices.map((inv) => inv._id));
                    else setSelected([]);
                  }}
                />
              </TableCell>
              <TableCell>Invoice No</TableCell>
              <TableCell>Invoice Date</TableCell>
              <TableCell>Customer Name</TableCell>
              <TableCell>Customer Address</TableCell>
              <TableCell>Mail ID</TableCell>
              <TableCell>Phone Number</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {invoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((invoice) => (
              <TableRow key={invoice._id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(invoice._id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelected((prev) => [...prev, invoice._id]);
                      else setSelected((prev) => prev.filter((id) => id !== invoice._id));
                    }}
                  />
                </TableCell>
                <TableCell>{invoice.invoiceNumber}</TableCell>
                <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                <TableCell>{invoice.customer?.customerName || 'N/A'}</TableCell>
                <TableCell>{invoice.customer?.address || 'N/A'}</TableCell>
                <TableCell>{invoice.customer?.mailId || 'N/A'}</TableCell>
                <TableCell>{invoice.customer?.phoneNo || 'N/A'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton onClick={() => handleDelete(invoice)} color="error">
                      <DeleteIcon />
                    </IconButton>
                    <Button variant="contained" size="small" onClick={() => handleDispatch(invoice)}>
                      Dispatch
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}

            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={8} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={invoices.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          {selected.length > 0
            ? `Are you sure you want to delete ${selected.length} selected invoices?`
            : 'Are you sure you want to delete this invoice?'}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dispatch Dialog */}
      <Dialog open={openDispatchDialog} onClose={handleCloseDispatchDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Dispatch Products</DialogTitle>
        <DialogContent>
          <Typography variant="h6" component="h2" sx={{ mt: 2 }}>
            Customer Details
          </Typography>

          <FormControl fullWidth sx={{ mt: 2 }} error={!!errors.invoiceId}>
            <InputLabel id="invoice-select-label">Invoice No *</InputLabel>
            <Select
              labelId="invoice-select-label"
              id="invoice-select"
              value={formData.invoiceId}
              label="Invoice No *"
              onChange={handleInvoiceChange}
              name="invoiceId"
            >
              {invoices.map((invoice) => (
                <MenuItem key={invoice._id} value={invoice._id}>
                  {invoice.invoiceNumber}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{errors.invoiceId}</FormHelperText>
          </FormControl>

          <TextField
            margin="dense"
            label="Invoice Date"
            fullWidth
            value={selectedInvoice ? new Date(selectedInvoice.invoiceDate).toLocaleDateString() : ''}
            InputProps={{ readOnly: true }}
          />
          <TextField
            margin="dense"
            label="Customer Name"
            fullWidth
            value={selectedInvoice?.customer?.customerName || ''}
            InputProps={{ readOnly: true }}
          />
          <TextField
            margin="dense"
            label="Customer Address"
            fullWidth
            value={selectedInvoice?.customer?.address || ''}
            InputProps={{ readOnly: true }}
          />
          <TextField
            margin="dense"
            label="Mail ID"
            fullWidth
            value={selectedInvoice?.customer?.mailId || ''}
            InputProps={{ readOnly: true }}
          />
          <TextField
            margin="dense"
            label="Phone Number"
            fullWidth
            value={selectedInvoice?.customer?.phoneNo || ''}
            InputProps={{ readOnly: true }}
          />

          <FormControl fullWidth error={!!errors.modelNo} sx={{ mt: 2 }}>
            <InputLabel id="model-select-label">Model No *</InputLabel>
            <Select
              labelId="model-select-label"
              id="model-select"
              value={formData.modelNo}
              label="Model No *"
              onChange={handleFormChange}
              name="modelNo"
            >
              {models.map((model) => (
                <MenuItem key={model._id} value={model.modelNo}>
                  {model.modelNo}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{errors.modelNo}</FormHelperText>
          </FormControl>

          <FormControl fullWidth error={!!errors.salePerson} sx={{ mt: 2 }}>
            <InputLabel id="salesperson-select-label">Sales Person *</InputLabel>
            <Select
              labelId="salesperson-select-label"
              id="salesperson-select"
              value={formData.salePerson}
              label="Sales Person *"
              onChange={handleFormChange}
              name="salePerson"
            >
              {salePersons.map((person) => (
                <MenuItem key={person._id} value={person.employeeName}>
                  {person.employeeName}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{errors.salePerson}</FormHelperText>
          </FormControl>

          <TextField
            label="Quantity"
            type="number"
            fullWidth
            value={formData.quantity}
            onChange={(e) => {
              const value = Math.max(0, parseInt(e.target.value, 10) || 0);
              setFormData((prev) => ({ ...prev, quantity: value }));
            }}
            name="quantity"
            inputProps={{ min: 0 }}
            sx={{ mt: 2 }}
          />

          <TextField
            label="Price per Unit"
            type="number"
            fullWidth
            value={formData.price}
            onChange={handleFormChange}
            name="price"
            inputProps={{ min: 0, step: '0.01' }}
            sx={{ mt: 2 }}
          />

          <TextField
            margin="dense"
            label="Scan barcode (auto-scan)"
            fullWidth
            value={formData.shd}
            onChange={handleFormChange}
            name="shd"
            inputRef={shdInputRef}
            error={!!errors.shd}
            helperText={errors.shd}
            sx={{ mt: 2 }}
            autoFocus
          />

          <TextField
            margin="dense"
            label="Scanned Codes"
            fullWidth
            multiline
            rows={4}
            value={formData.scannedCodes}
            name="scannedCodes"
            onChange={handleFormChange}
            InputProps={{ readOnly: true }}
          />

          <Typography variant="body2" sx={{ mr: 2, color: '#757575' }}>
            Total Scanned Barcodes: {scannedBarcodes.size}
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDispatchDialog}>Cancel</Button>
          <Button onClick={handleSubmitDispatch} variant="contained" color="primary">
            Submit Dispatch
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dispatch;
