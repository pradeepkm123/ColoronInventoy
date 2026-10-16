// // // import React, { useEffect, useRef, useState } from 'react';
// // // import {
// // //   Box,
// // //   Button,
// // //   Dialog,
// // //   DialogActions,
// // //   DialogContent,
// // //   DialogTitle,
// // //   TextField,
// // //   Typography,
// // //   FormControl,
// // //   InputLabel,
// // //   Select,
// // //   MenuItem,
// // //   FormHelperText,
// // //   IconButton,
// // //   Divider,
// // //   Grid,
// // //   Paper,
// // //   Stack,
// // //   Tooltip,
// // //   Chip,
// // // } from '@mui/material';
// // // import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
// // // import axios from 'axios';
// // // import { useSnackbar } from 'notistack';

// // // const API_BASE = 'https://coloroninventoy.onrender.com/api';
// // // const FILE_HOST = 'https://coloroninventoy.onrender.com';

// // // // Helper: Image URL
// // // const getImageUrl = (img) => {
// // //   if (!img) return '/no-image.png';
// // //   const file = String(img)
// // //     .replace(/\\/g, '/')
// // //     .replace(/^\/?uploads\/?/i, '')
// // //     .split('/')
// // //     .pop();
// // //   return `${FILE_HOST}/uploads/${file}`;
// // // };

// // // // Helper: Status for Quantity
// // // const statusForQty = (qty) => {
// // //   if (qty <= 0) return 'Out of Stock';
// // //   if (qty > 0 && qty <= 5) return 'Low Stock';
// // //   return 'In Stock';
// // // };

// // // // Helper: Status Style
// // // const getStatusStyle = (status) => {
// // //   if (status === 'In Stock') {
// // //     return {
// // //       backgroundColor: '#d4edda',
// // //       color: '#155724',
// // //       padding: '4px 12px',
// // //       borderRadius: '16px',
// // //       fontSize: '12px',
// // //       fontWeight: '500',
// // //     };
// // //   } else if (status === 'Out of Stock') {
// // //     return {
// // //       backgroundColor: 'rgb(255 221 232)',
// // //       color: 'rgb(186 13 13)',
// // //       padding: '4px 12px',
// // //       borderRadius: '16px',
// // //       fontSize: '12px',
// // //       fontWeight: '500',
// // //     };
// // //   } else if (status === 'Low Stock') {
// // //     return {
// // //       backgroundColor: '#fff3cd',
// // //       color: '#856404',
// // //       padding: '4px 12px',
// // //       borderRadius: '16px',
// // //       fontSize: '12px',
// // //       fontWeight: '500',
// // //     };
// // //   }
// // //   return {};
// // // };

// // // // Helper: Empty Line
// // // function makeEmptyLine() {
// // //   return {
// // //     modelNo: '',
// // //     salePerson: '',
// // //     quantity: 0,
// // //     price: 0,
// // //     shd: '',
// // //     scannedCodes: '',
// // //     scannedList: [],
// // //     isQuantityManual: false,
// // //     lowStockWarning: '',
// // //   };
// // // }

// // // // Helper: Sanitize
// // // const sanitize = (s) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// // // // Helper: Find Model Match in Barcode
// // // const findModelMatchInBarcode = (model, barcode) => {
// // //   const m = sanitize(model);
// // //   const b = sanitize(barcode);
// // //   if (!m || !b) return null;
// // //   const lengths = [5, 4];
// // //   for (const L of lengths) {
// // //     if (m.length < L) continue;
// // //     for (let i = 0; i <= m.length - L; i++) {
// // //       const sub = m.slice(i, i + L);
// // //       if (b.includes(sub)) return sub;
// // //     }
// // //   }
// // //   return null;
// // // };

// // // // Helper: Cap for Line
// // // const capForLine = (ln) => {
// // //   const q = Number(ln.quantity);
// // //   if (ln.isQuantityManual && Number.isFinite(q) && q > 0) return q;
// // //   return Infinity;
// // // };

// // // // Helper: Remaining for Line
// // // const remainingForLine = (ln) => {
// // //   const cap = capForLine(ln);
// // //   if (cap === Infinity) return Infinity;
// // //   return Math.max(0, cap - (ln.scannedList?.length || 0));
// // // };

// // // // Helper: Quantity for Line
// // // const qtyForLine = (ln) => {
// // //   const manual = Number(ln.quantity);
// // //   if (!Number.isNaN(manual) && manual > 0) return manual;
// // //   return ln.scannedList?.length || 0;
// // // };

// // // const StockOutward = () => {
// // //   const { enqueueSnackbar } = useSnackbar();
// // //   const [models, setModels] = useState([]);
// // //   const [salePersons, setSalePersons] = useState([]);
// // //   const [customers, setCustomers] = useState([]);
// // //   const [openDialog, setOpenDialog] = useState(false);
// // //    const [lineErrors, setLineErrors] = useState({});
// // //   const [customer, setCustomer] = useState({
// // //     id: '',
// // //     customerName: '',
// // //     customerAddress: '',
// // //     mailId: '',
// // //     phoneNumber: '',
// // //     storeName: '',
// // //   });
// // //   const [errors, setErrors] = useState({});
// // //   const [globalScanned, setGlobalScanned] = useState(new Set());
// // //   const [lines, setLines] = useState([makeEmptyLine()]);
// // //   const shdRefs = useRef({});
// // //   const scannerBuffers = useRef({});
// // //   const scannerTimers = useRef({});

// // //   // Fetch master data
// // //   useEffect(() => {
// // //     fetchModels();
// // //     fetchSalePersons();
// // //     fetchCustomers();
// // //   }, []);

// // //   const fetchModels = async () => {
// // //     try {
// // //       const res = await axios.get(`${API_BASE}/products`);
// // //       setModels(res.data || []);
// // //     } catch (e) {
// // //       enqueueSnackbar('Failed to fetch models', { variant: 'error' });
// // //     }
// // //   };

// // //   const fetchSalePersons = async () => {
// // //     try {
// // //       const res = await axios.get(`${API_BASE}/salesPersons`);
// // //       setSalePersons(res.data || []);
// // //     } catch (e) {
// // //       enqueueSnackbar('Failed to fetch sales persons', { variant: 'error' });
// // //     }
// // //   };

// // //   const fetchCustomers = async () => {
// // //     try {
// // //       const res = await axios.get(`${API_BASE}/customers`);
// // //       setCustomers(res.data || []);
// // //     } catch (e) {
// // //       enqueueSnackbar('Failed to fetch customers', { variant: 'error' });
// // //     }
// // //   };

// // //   // Dialog open/close
// // //   const openOutwardDialog = () => {
// // //     setCustomer({
// // //       id: '',
// // //       customerName: '',
// // //       customerAddress: '',
// // //       mailId: '',
// // //       phoneNumber: '',
// // //       storeName: '',
// // //     });
// // //     setLines([makeEmptyLine()]);
// // //     setErrors({});
// // //     setGlobalScanned(new Set());
// // //     setOpenDialog(true);
// // //   };

// // //   const closeDialog = () => setOpenDialog(false);

// // //   // Customer change
// // //   const handleCustomerChange = (e) => {
// // //     const id = e.target.value;
// // //     const c = customers.find((x) => x._id === id);
// // //     setCustomer({
// // //       id,
// // //       customerName: c?.customerName || '',
// // //       customerAddress: c?.address || '',
// // //       mailId: c?.mailId || '',
// // //       phoneNumber: c?.phoneNo || '',
// // //       storeName: c?.storeName || '',
// // //     });
// // //     if (errors.customer) {
// // //       setErrors((prev) => ({ ...prev, customer: '' }));
// // //     }
// // //   };

// // //   // Get next model for new line
// // //   const getNextModelForNewLine = (currentLines, products) => {
// // //     if (!products.length) return '';
// // //     const used = new Set(currentLines.map((l) => l.modelNo).filter(Boolean));
// // //     const lastModel = currentLines[currentLines.length - 1]?.modelNo || '';
// // //     const baseIndex = products.findIndex((p) => p.model === lastModel);
// // //     for (let step = 1; step <= products.length; step++) {
// // //       const idx = ((baseIndex >= 0 ? baseIndex : -1) + step) % products.length;
// // //       const candidate = products[idx].model;
// // //       if (!used.has(candidate)) return candidate;
// // //     }
// // //     return '';
// // //   };

// // //   // Line helpers
// // //   const setLineValue = (index, field, value) => {
// // //     setLines((prev) => {
// // //       const next = [...prev];
// // //       next[index] = { ...next[index], [field]: value };
// // //       return next;
// // //     });
// // //     if (errors[`line_${index}_${field}`]) {
// // //       setErrors((prev) => ({ ...prev, [`line_${index}_${field}`]: '' }));
// // //     }
// // //   };

// // //   const addLine = () => {
// // //     setLines((prev) => {
// // //       const newIdx = prev.length;
// // //       const nextLine = makeEmptyLine();
// // //       const autoModel = getNextModelForNewLine(prev, models);
// // //       if (autoModel) {
// // //         nextLine.modelNo = autoModel;
// // //         const p = models.find((m) => m.model === autoModel);
// // //         const stock = p?.reorderLevel ?? 0;
// // //         nextLine.lowStockWarning = stock <= 5 ? `Low stock for ${autoModel}: ${stock}` : '';
// // //       }
// // //       const next = [...prev, nextLine];
// // //       setTimeout(() => {
// // //         if (shdRefs.current[newIdx]) {
// // //           shdRefs.current[newIdx].focus();
// // //         }
// // //       }, 0);
// // //       return next;
// // //     });
// // //   };

// // //   const removeLine = (index) => {
// // //     setLines((prev) => {
// // //       const line = prev[index];
// // //       if (line?.scannedList?.length) {
// // //         const ns = new Set(globalScanned);
// // //         line.scannedList.forEach((code) => ns.delete(code));
// // //         setGlobalScanned(ns);
// // //       }
// // //       const next = prev.slice(0, index).concat(prev.slice(index + 1));
// // //       return next.length ? next : [makeEmptyLine()];
// // //     });
// // //   };

// // //   // Recompute low stock warning
// // //   const recomputeLowStockForLine = (index, modelName) => {
// // //     const p = models.find((m) => m.model === modelName);
// // //     const stock = p?.reorderLevel ?? 0;
// // //     const text = stock <= 5 ? `Low stock for ${modelName}: ${stock}` : '';
// // //     setLineValue(index, 'lowStockWarning', text);
// // //   };

// // //   // Handle barcode scanning
// // //   const handleShdChange = (index, value) => {
// // //     setLineValue(index, 'shd', value);
// // //     if (value && value.trim().length >= 18) {
// // //       setTimeout(() => processBarcode(index), 80);
// // //     }
// // //   };

// // //   const handleScanKeyDown = (e, idx) => {
// // //     if (!scannerBuffers.current[idx]) scannerBuffers.current[idx] = '';
// // //     if (e.key === 'Enter') {
// // //       e.preventDefault();
// // //       const code = scannerBuffers.current[idx];
// // //       if (code) {
// // //         setLineValue(idx, 'shd', code);
// // //         processBarcode(idx, code);
// // //       }
// // //       scannerBuffers.current[idx] = '';
// // //       return;
// // //     }
// // //     if (e.key.length === 1) {
// // //       scannerBuffers.current[idx] += e.key;
// // //     }
// // //     clearTimeout(scannerTimers.current[idx]);
// // //     scannerTimers.current[idx] = setTimeout(() => {
// // //       const code = scannerBuffers.current[idx];
// // //       if (code) {
// // //         setLineValue(idx, 'shd', code);
// // //         processBarcode(idx, code);
// // //       }
// // //       scannerBuffers.current[idx] = '';
// // //     }, 200);
// // //   };

// // //   const processBarcode = (index, overrideRaw) => {
// // //     const line = lines[index];
// // //     const barcodeRaw = (overrideRaw || line.shd || '').trim();
// // //     if (!barcodeRaw) return;

// // //     // Validate customer and model
// // //     if (!customer.id) {
// // //       enqueueSnackbar('Please select a Customer first', { variant: 'error' });
// // //       setErrors((prev) => ({ ...prev, customer: 'Customer is required' }));
// // //       return;
// // //     }
// // //     if (!line.modelNo) {
// // //       enqueueSnackbar('Please select Model No for this line first', { variant: 'error' });
// // //       setErrors((prev) => ({ ...prev, [`line_${index}_modelNo`]: 'Model No is required' }));
// // //       return;
// // //     }

// // //     // Check quantity cap
// // //     const cap = capForLine(line);
// // //     if (cap !== Infinity && (line.scannedList?.length || 0) >= cap) {
// // //       enqueueSnackbar(`Target reached: ${cap} scans for this row`, { variant: 'warning' });
// // //       setLineValue(index, 'shd', '');
// // //       return;
// // //     }

// // //     // Check for duplicate barcodes
// // //     if (globalScanned.has(barcodeRaw)) {
// // //       enqueueSnackbar('This barcode is already scanned (any line)', { variant: 'error' });
// // //       setLineValue(index, 'shd', '');
// // //       return;
// // //     }

// // //     // Validate barcode against model number
// // //     const matched = findModelMatchInBarcode(line.modelNo, barcodeRaw);
// // //     if (!matched) {
// // //       enqueueSnackbar('Mismatch: No 5/4-char continuous segment from Model No found in barcode', { variant: 'error' });
// // //       setErrors((prev) => ({ ...prev, [`line_${index}_shd`]: 'Barcode mismatch with Model No' }));
// // //       return;
// // //     }

// // //     // Update scanned list and global set
// // //     setLines((prev) => {
// // //       const arr = [...prev];
// // //       const L = { ...arr[index] };
// // //       const _cap = capForLine(L);
// // //       const currentLen = L.scannedList?.length || 0;
// // //       if (_cap !== Infinity && currentLen >= _cap) {
// // //         return arr;
// // //       }
// // //       const nextList = Array.from(new Set([...(L.scannedList || []), barcodeRaw]));
// // //       if (_cap !== Infinity && nextList.length > _cap) {
// // //         return arr;
// // //       }
// // //       L.scannedList = nextList;
// // //       L.scannedCodes = nextList.join(', ');
// // //       if (!L.isQuantityManual) {
// // //         L.quantity = nextList.length;
// // //       }
// // //       L.shd = '';
// // //       arr[index] = L;
// // //       const ns = new Set(globalScanned);
// // //       ns.add(barcodeRaw);
// // //       setGlobalScanned(ns);
// // //       const left = remainingForLine(L);
// // //       enqueueSnackbar(
// // //         left === Infinity
// // //           ? `Accepted for ${line.modelNo} (match: "${matched}")`
// // //           : `Accepted (${line.modelNo}). Remaining: ${left}`,
// // //         { variant: 'success' }
// // //       );
// // //       return arr;
// // //     });
// // //   };

// // //   // Validate form
// // //   const validateForm = () => {
// // //     const e = {};
// // //     let ok = true;
// // //     if (!customer.id) {
// // //       e.customer = 'Customer is required';
// // //       ok = false;
// // //     }
// // //     lines.forEach((ln, i) => {
// // //       if (!ln.modelNo) {
// // //         e[`line_${i}_modelNo`] = 'Model No is required';
// // //         ok = false;
// // //       }
// // //       if (!ln.salePerson) {
// // //         e[`line_${i}_salePerson`] = 'Sales Person is required';
// // //         ok = false;
// // //       }
// // //       const qty = qtyForLine(ln);
// // //       if (qty <= 0) {
// // //         e[`line_${i}_quantity`] = 'Enter a quantity > 0 or scan at least one code';
// // //         ok = false;
// // //       }
// // //       const prod = models.find((m) => m.model === ln.modelNo);
// // //       const stock = prod?.reorderLevel || 0;
// // //       if (qty > stock) {
// // //         e[`line_${i}_quantity`] = `Quantity exceeds available stock (${stock})`;
// // //         ok = false;
// // //       }
// // //     });
// // //     setErrors(e);
// // //     return ok;
// // //   };

// // //   // Submit form
// // //   const handleSubmit = async () => {
// // //     if (!validateForm()) return;
// // //     try {
// // //       const res = await axios.get(`${API_BASE}/products`);
// // //       const products = res.data || [];
// // //       for (const ln of lines) {
// // //         if (!ln.modelNo) continue;
// // //         const qty = qtyForLine(ln);
// // //         if (qty <= 0) continue;
// // //         const product = products.find((p) => p.model === ln.modelNo);
// // //         if (!product) continue;
// // //         const payload = {
// // //           modelNo: ln.modelNo,
// // //           quantity: qty,
// // //           price: Number(ln.price) || 0,
// // //           salePerson: ln.salePerson,
// // //           customerName: customer.customerName,
// // //           barcodes: ln.scannedList || [],
// // //           dispatchDate: new Date(),
// // //           customerAddress: customer.customerAddress,
// // //           mailId: customer.mailId,
// // //           phoneNumber: customer.phoneNumber,
// // //           storeName: customer.storeName,
// // //         };
// // //         await axios.post(`${API_BASE}/dispatch`, payload);
// // //         const updatedReorder = Math.max(0, (product.reorderLevel || 0) - qty);
// // //         const newStatus = statusForQty(updatedReorder);
// // //         await axios.put(`${API_BASE}/products/${product._id}`, {
// // //           reorderLevel: updatedReorder,
// // //           stockStatus: newStatus,
// // //         });
// // //       }
// // //       enqueueSnackbar('Stock outward recorded and stocks updated!', { variant: 'success' });
// // //       closeDialog();
// // //     } catch (err) {
// // //       console.error(err);
// // //       enqueueSnackbar('Failed to submit stock outward', { variant: 'error' });
// // //     }
// // //   };

// // //   return (
// // //     <Box sx={{ padding: '40px 20px' }}>
// // //       <Box sx={{ textAlign: 'center', mb: 4 }}>
// // //         <Typography variant="h4">Stock Outward</Typography>
// // //         <Typography variant="body1">Scan products to remove them from inventory</Typography>
// // //       </Box>
// // //       <Box
// // //         sx={{
// // //           maxWidth: 500,
// // //           mx: 'auto',
// // //           bgcolor: 'white',
// // //           borderRadius: 2,
// // //           p: 6,
// // //           textAlign: 'center',
// // //           border: '1px solid #e5e7eb',
// // //           boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
// // //         }}
// // //       >
// // //         <Box
// // //           sx={{
// // //             width: 80,
// // //             height: 80,
// // //             bgcolor: '#fee2e2',
// // //             borderRadius: '50%',
// // //             display: 'inline-flex',
// // //             alignItems: 'center',
// // //             justifyContent: 'center',
// // //             mb: 3,
// // //           }}
// // //         >
// // //           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
// // //             <path d="M9 12l2 2 4-4" />
// // //             <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.12 0 4.04.74 5.57 1.97" />
// // //           </svg>
// // //         </Box>
// // //         <Typography variant="h6">Scan Product Barcode</Typography>
// // //         <Typography variant="body2">Use your camera or enter barcode manually</Typography>
// // //         <Button variant="contained" color="error" onClick={openOutwardDialog} sx={{ mt: 2 }}>
// // //           Start Scanning
// // //         </Button>
// // //       </Box>
// // //       <Dialog open={openDialog}   onClose={(event, reason) => {
// // //     if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
// // //       return; 
// // //     }
// // //     closeDialog();
// // //   }} maxWidth="lg" fullWidth>
// // //         <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
// // //           Stock Outward
// // //           <Tooltip title="Add Model">
// // //             <IconButton color="primary" onClick={addLine}>
// // //               <AddIcon />
// // //             </IconButton>
// // //           </Tooltip>
// // //         </DialogTitle>
// // //         <DialogContent>
// // //           <FormControl fullWidth sx={{ mt: 1 }} error={!!errors.customer}>
// // //             <InputLabel>Customer Name *</InputLabel>
// // //             <Select name="customerId" value={customer.id} onChange={handleCustomerChange} label="Customer Name *">
// // //               {customers.map((c) => (
// // //                 <MenuItem key={c._id} value={c._id}>
// // //                   {c.customerName}
// // //                 </MenuItem>
// // //               ))}
// // //             </Select>
// // //             <FormHelperText>{errors.customer}</FormHelperText>
// // //           </FormControl>
// // //           <Grid container spacing={2} sx={{ mt: 1 }}>
// // //             <Grid item xs={12} sm={6} sx={{ width: '23%' }}>
// // //               <TextField label="Address" fullWidth value={customer.customerAddress} InputProps={{ readOnly: true }} />
// // //             </Grid>
// // //             <Grid item xs={6} sm={6} sx={{ width: '23%' }}>
// // //               <TextField label="Email" fullWidth value={customer.mailId} InputProps={{ readOnly: true }} />
// // //             </Grid>
// // //             <Grid item xs={12} sm={6} sx={{ width: '23%' }}>
// // //               <TextField label="Phone" fullWidth value={customer.phoneNumber} InputProps={{ readOnly: true }} />
// // //             </Grid>
// // //             <Grid item xs={12} sm={6} sx={{ width: '26%' }}>
// // //               <TextField label="Store Name" fullWidth value={customer.storeName} InputProps={{ readOnly: true }} />
// // //             </Grid>
// // //           </Grid>
// // //           <Divider sx={{ my: 3 }} />
// // //           <Stack spacing={2}>
// // //             {lines.map((ln, idx) => {
// // //               const product = models.find((m) => m.model === ln.modelNo);
// // //               const stock = product?.reorderLevel ?? 0;
// // //               const qty = qtyForLine(ln);
// // //               const afterStock = Math.max(0, stock - qty);
// // //               const remaining = remainingForLine(ln);
// // //               const cap = capForLine(ln);
// // //               return (
// // //                 <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
// // //                   <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
// // //                     <Typography fontWeight={600}>Model #{idx + 1}</Typography>
// // //                     <Stack direction="row" spacing={1} alignItems="center">
// // //                       {ln.lowStockWarning && <Chip label={ln.lowStockWarning} color="warning" size="small" />}
// // //                       <Tooltip title="Remove model line">
// // //                         <span>
// // //                           <IconButton color="error" onClick={() => removeLine(idx)} disabled={lines.length === 1}>
// // //                             <DeleteIcon />
// // //                           </IconButton>
// // //                         </span>
// // //                       </Tooltip>
// // //                     </Stack>
// // //                   </Stack>
// // //                   <Grid container spacing={2}>
// // //                     <Grid item xs={12} sm={6} md={4} sx={{ width: '20rem' }}>
// // //                       <FormControl fullWidth error={!!errors[`line_${idx}_modelNo`]}>
// // //                         <InputLabel>Model No *</InputLabel>
// // //                         <Select
// // //                           label="Model No *"
// // //                           value={ln.modelNo}
// // //                           onChange={(e) => {
// // //                             setLineValue(idx, 'modelNo', e.target.value);
// // //                             recomputeLowStockForLine(idx, e.target.value);
// // //                           }}
// // //                         >
// // //                           {models.map((m) => (
// // //                             <MenuItem key={m._id} value={m.model}>
// // //                               {m.model}
// // //                             </MenuItem>
// // //                           ))}
// // //                         </Select>
// // //                         <FormHelperText>{errors[`line_${idx}_modelNo`]}</FormHelperText>
// // //                       </FormControl>
// // //                       <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
// // //                         Current stock: {stock}
// // //                       </Typography>
// // //                     </Grid>
// // //                     <Grid item xs={12} sm={6} md={4} sx={{ width: '20rem' }}>
// // //                       <FormControl fullWidth error={!!errors[`line_${idx}_salePerson`]}>
// // //                         <InputLabel>Sales Person *</InputLabel>
// // //                         <Select
// // //                           label="Sales Person *"
// // //                           value={ln.salePerson}
// // //                           onChange={(e) => setLineValue(idx, 'salePerson', e.target.value)}
// // //                         >
// // //                           {salePersons.map((p) => (
// // //                             <MenuItem key={p._id} value={p.employeeName}>
// // //                               {p.employeeName}
// // //                             </MenuItem>
// // //                           ))}
// // //                         </Select>
// // //                         <FormHelperText>{errors[`line_${idx}_salePerson`]}</FormHelperText>
// // //                       </FormControl>
// // //                     </Grid>
// // //                     <Grid item xs={12} sm={6} md={4} sx={{ width: '27rem' }}>
// // //                       <TextField
// // //                         label="Quantity"
// // //                         type="number"
// // //                         fullWidth
// // //                         value={ln.quantity}
// // //                         onChange={(e) => {
// // //                           const val = Number(e.target.value);
// // //                           setLineValue(idx, 'isQuantityManual', true);
// // //                           setLineValue(idx, 'quantity', e.target.value);
// // //                           setLines((prev) => {
// // //                             const arr = [...prev];
// // //                             const L = { ...arr[idx] };
// // //                             const q = Number(val);
// // //                             if (Number.isFinite(q) && q >= 0) {
// // //                               const cur = L.scannedList || [];
// // //                               if (cur.length > q) {
// // //                                 const kept = cur.slice(0, q);
// // //                                 const removed = cur.slice(q);
// // //                                 const ns = new Set(globalScanned);
// // //                                 removed.forEach((c) => ns.delete(c));
// // //                                 setGlobalScanned(ns);
// // //                                 L.scannedList = kept;
// // //                                 L.scannedCodes = kept.join(', ');
// // //                               }
// // //                             }
// // //                             arr[idx] = L;
// // //                             return arr;
// // //                           });
// // //                         }}
// // //                         error={!!errors[`line_${idx}_quantity`]}
// // //                         helperText={errors[`line_${idx}_quantity`] || 'Typed value caps how many barcodes you can scan for this row'}
// // //                       />
// // //                       <div style={{ display: 'flex', justifyContent: 'space-between' }}>
// // //                         <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
// // //                           After outward: {afterStock} {qty > 0 ? `(-${qty})` : ''}
// // //                         </Typography>
// // //                         <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
// // //                           {cap === Infinity ? 'No scan limit (uses scanned count)' : `Remaining scans allowed: ${remaining}`}
// // //                         </Typography>
// // //                       </div>
// // //                     </Grid>
// // //                     <Grid item xs={12} sm={6} md={4} sx={{ width: '30rem' }}>
// // //                       <TextField
// // //                         label="Price per Unit"
// // //                         type="number"
// // //                         fullWidth
// // //                         value={ln.price}
// // //                         onChange={(e) => setLineValue(idx, 'price', e.target.value)}
// // //                       />
// // //                     </Grid>
// // //                     <Grid item xs={12} md={8} sx={{ width: '38rem' }}>
// // //                     <TextField
// // //                                             label="Scan barcode"
// // //                                             fullWidth
// // //                                             value={ln.shd}
// // //                                             onChange={(e) => setLineValue(idx, 'shd', e.target.value)}
// // //                                             onKeyDown={(e) => {
// // //                                               if (e.key === 'Enter') {
// // //                                                 e.preventDefault();
// // //                                                 if (ln.shd.trim()) {
// // //                                                   processBarcode(idx, ln.shd.trim());
// // //                                                 }
// // //                                               } else {
// // //                                                 handleScanKeyDown(e, idx);
// // //                                               }
// // //                                             }}
// // //                                             error={!!lineErrors[`l${idx}_shd`]}
// // //                                             helperText={
// // //                                               lineErrors[`l${idx}_shd`] ||
// // //                                               (cap === Infinity
// // //                                                 ? 'Barcode must include any continuous 5 or 4 chars from Model No'
// // //                                                 : `Allowed up to ${cap} scans for this row`)
// // //                                             }
// // //                                             inputRef={(el) => (shdRefs.current[idx] = el)}
// // //                                             disabled={remaining === 0}
// // //                                           />
// // //                     </Grid>
// // //                     <Grid item xs={12} sx={{ width: '100%' }}>
// // //                       <TextField
// // //                         label="Scanned Codes"
// // //                         fullWidth
// // //                         multiline
// // //                         rows={3}
// // //                         value={ln.scannedCodes}
// // //                         InputProps={{ readOnly: true }}
// // //                         sx={{ width: '100%' }}
// // //                       />
// // //                       <Typography variant="caption" sx={{ mt: 0.5, display: 'block', width: '100%' }}>
// // //                         Total scanned: {ln.scannedList.length}
// // //                       </Typography>
// // //                     </Grid>
// // //                   </Grid>
// // //                 </Paper>
// // //               );
// // //             })}
// // //           </Stack>
// // //           <Divider sx={{ my: 3 }}>Selected Products Preview</Divider>
// // //           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
// // //             {lines
// // //               .filter((ln) => ln.modelNo)
// // //               .map((ln, i) => {
// // //                 const p = models.find((x) => x.model === ln.modelNo);
// // //                 if (!p) return null;
// // //                 const current = p.reorderLevel ?? 0;
// // //                 const qty = qtyForLine(ln);
// // //                 const after = Math.max(0, current - qty);
// // //                 const statusAfter = statusForQty(after);
// // //                 return (
// // //                   <div
// // //                     key={`${ln.modelNo}-${i}`}
// // //                     style={{
// // //                       backgroundColor: 'white',
// // //                       borderRadius: 12,
// // //                       padding: 24,
// // //                       boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
// // //                       border: '1px solid #f0f0f0',
// // //                     }}
// // //                   >
// // //                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
// // //                       <div>
// // //                         <h3 style={{ margin: 0, fontSize: 17, color: '#1a1a1a', marginBottom: 4 }}>{p.brand || 'No Brand'}</h3>
// // //                         <div style={{ display: 'flex', gap: 10 }}>
// // //                           <div style={{ fontSize: 13, color: '#6c757d' }}>Model:</div>
// // //                           <div style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>{p.model || 'No Model'}</div>
// // //                         </div>
// // //                         <div style={{ display: 'flex', gap: 10 }}>
// // //                           <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 4 }}>Sub-Category:</div>
// // //                           <div style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>{p.subCategory || '-'}</div>
// // //                         </div>
// // //                       </div>
// // //                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
// // //                         <span style={getStatusStyle(statusAfter)}>{statusAfter}</span>
// // //                         <img
// // //                           src={getImageUrl(p.productImage)}
// // //                           alt="Product"
// // //                           onError={(e) => {
// // //                             e.currentTarget.onerror = null;
// // //                             // e.currentTarget.src = '/no-image.png';
// // //                           }}
// // //                           style={{
// // //                             width: 45,
// // //                             height: 45,
// // //                             objectFit: 'cover',
// // //                             border: '1px solid #e9e9e9',
// // //                             borderRadius: 4,
// // //                             boxShadow: 'rgba(0, 0, 0, 0.16) 0px 1px 4px',
// // //                           }}
// // //                         />
// // //                       </div>
// // //                     </div>
// // //                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: 24 }}>
// // //                       <div style={{ display: 'flex', gap: 10 }}>
// // //                         <div style={{ fontSize: 13, color: '#1a1a1a', marginBottom: 4 }}>Category:</div>
// // //                         <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{p.category || '-'}</div>
// // //                       </div>
// // //                       <div style={{ textAlign: 'right', display: 'flex', gap: 10, justifyContent: 'end' }}>
// // //                         <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 4 }}>EmailTo:</div>
// // //                         <div style={{ fontSize: 13, color: '#1a1a1a' }}>{p.emailTo || '-'}</div>
// // //                       </div>
// // //                       <div style={{ display: 'flex', gap: 10 }}>
// // //                         <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 4 }}>Quantity:</div>
// // //                         <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>
// // //                           {current} → <span style={{ fontWeight: 700 }}>{after}</span> {qty > 0 ? `(-${qty})` : ''}
// // //                         </div>
// // //                       </div>
// // //                       <div style={{ textAlign: 'right', display: 'flex', gap: 10, justifyContent: 'end', alignItems: 'center' }}>
// // //                         <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 4 }}>Old Price:</div>
// // //                         <div style={{ fontSize: 13, color: 'rgb(108 117 125)', textDecoration: 'line-through' }}>
// // //                           ₹{Number(p.mrp || 0).toLocaleString()}
// // //                         </div>
// // //                         <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 4, marginLeft: 10 }}>Price:</div>
// // //                         <div style={{ fontSize: 13, fontWeight: 500, color: '#28a745' }}>
// // //                           ₹{Number(p.dealerPrice || 0).toLocaleString()}
// // //                         </div>
// // //                       </div>
// // //                     </div>
// // //                   </div>
// // //                 );
// // //               })}
// // //           </div>
// // //         </DialogContent>
// // //         <DialogActions>
// // //           <Button onClick={closeDialog}>Cancel</Button>
// // //           <Button onClick={handleSubmit} variant="contained" color="primary">
// // //             Submit
// // //           </Button>
// // //         </DialogActions>
// // //       </Dialog>
// // //     </Box>
// // //   );
// // // };

// // // export default StockOutward;







// import React, { useEffect, useRef, useState } from 'react';
// import {
//   Box,
//   Button,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
//   TextField,
//   Typography,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   FormHelperText,
//   IconButton,
//   Divider,
//   Grid,
//   Paper,
//   Stack,
//   Tooltip,
//   Chip,
// } from '@mui/material';
// import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
// import axios from 'axios';
// import { useSnackbar } from 'notistack';

// const API_BASE = 'https://coloroninventoy.onrender.com/api';
// const FILE_HOST = 'https://coloroninventoy.onrender.com';

// // Helper: Image URL
// const getImageUrl = (img) => {
//   if (!img) return '/no-image.png';
//   const file = String(img)
//     .replace(/\\/g, '/')
//     .replace(/^\/?uploads\/?/i, '')
//     .split('/')
//     .pop();
//   return `${FILE_HOST}/uploads/${file}`;
// };

// // Helper: Status for Quantity
// const statusForQty = (qty) => {
//   if (qty <= 0) return 'Out of Stock';
//   if (qty > 0 && qty <= 5) return 'Low Stock';
//   return 'In Stock';
// };

// // Helper: Status Style
// const getStatusStyle = (status) => {
//   if (status === 'In Stock') {
//     return {
//       backgroundColor: '#d4edda',
//       color: '#155724',
//       padding: '4px 12px',
//       borderRadius: '16px',
//       fontSize: '12px',
//       fontWeight: '500',
//     };
//   } else if (status === 'Out of Stock') {
//     return {
//       backgroundColor: 'rgb(255 221 232)',
//       color: 'rgb(186 13 13)',
//       padding: '4px 12px',
//       borderRadius: '16px',
//       fontSize: '12px',
//       fontWeight: '500',
//     };
//   } else if (status === 'Low Stock') {
//     return {
//       backgroundColor: '#fff3cd',
//       color: '#856404',
//       padding: '4px 12px',
//       borderRadius: '16px',
//       fontSize: '12px',
//       fontWeight: '500',
//     };
//   }
//   return {};
// };

// // Helper: Empty Line
// function makeEmptyLine() {
//   return {
//     modelNo: '',
//     category: '',
//     subCategory: '', // Added subCategory
//     salePerson: '',
//     quantity: 0,
//     price: 0,
//     shd: '',
//     scannedCodes: '',
//     scannedList: [],
//     isQuantityManual: false,
//     lowStockWarning: '',
//   };
// }

// // Helper: Sanitize
// const sanitize = (s) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// // Helper: Find Model Match in Barcode
// const findModelMatchInBarcode = (model, barcode) => {
//   const m = sanitize(model);
//   const b = sanitize(barcode);
//   if (!m || !b) return null;
//   const lengths = [5, 4];
//   for (const L of lengths) {
//     if (m.length < L) continue;
//     for (let i = 0; i <= m.length - L; i++) {
//       const sub = m.slice(i, i + L);
//       if (b.includes(sub)) return sub;
//     }
//   }
//   return null;
// };

// // Helper: Cap for Line
// const capForLine = (ln) => {
//   const q = Number(ln.quantity);
//   if (ln.isQuantityManual && Number.isFinite(q) && q > 0) return q;
//   return Infinity;
// };

// // Helper: Remaining for Line
// const remainingForLine = (ln) => {
//   const cap = capForLine(ln);
//   if (cap === Infinity) return Infinity;
//   return Math.max(0, cap - (ln.scannedList?.length || 0));
// };

// // Helper: Quantity for Line
// const qtyForLine = (ln) => {
//   const manual = Number(ln.quantity);
//   if (!Number.isNaN(manual) && manual > 0) return manual;
//   return ln.scannedList?.length || 0;
// };

// const StockOutward = () => {
//   const { enqueueSnackbar } = useSnackbar();
//   const [models, setModels] = useState([]);
//   const [salePersons, setSalePersons] = useState([]);
//   const [customers, setCustomers] = useState([]);
//   const [openDialog, setOpenDialog] = useState(false);
//   const [lineErrors, setLineErrors] = useState({});
//   const [customer, setCustomer] = useState({
//     id: '',
//     customerName: '',
//     customerAddress: '',
//     mailId: '',
//     phoneNumber: '',
//     storeName: '',
//     gstNo: '',
//     customerType: '',
//   });
//   const [errors, setErrors] = useState({});
//   const [globalScanned, setGlobalScanned] = useState(new Set());
//   const [lines, setLines] = useState([makeEmptyLine()]);
//   const shdRefs = useRef({});
//   const scannerBuffers = useRef({});
//   const scannerTimers = useRef({});

//   const [stockInward, setStockInward] = useState([]);
//   const [stockOutward, setStockOutward] = useState([]);
//   // Fetch master data
//   useEffect(() => {
//     fetchModels();
//     fetchSalePersons();
//     fetchCustomers();
//     fetchStockData();
//   }, []);

//   // Auto-save draft
//   useEffect(() => {
//     const draft = {
//       customer,
//       lines,
//       globalScanned: Array.from(globalScanned),
//     };
//     localStorage.setItem('stockOutwardDraft', JSON.stringify(draft));
//   }, [customer, lines, globalScanned]);

//   const fetchStockData = async () => {
//     try {
//       const [inRes, outRes] = await Promise.all([
//         axios.get(`${API_BASE}/stock-inward`),
//         axios.get(`${API_BASE}/stock-outward`)
//       ]);

//       const inData = Array.isArray(inRes.data) ? inRes.data : (inRes.data.movements || inRes.data.data || []);
//       const outData = Array.isArray(outRes.data) ? outRes.data : (outRes.data.data || []);

//       setStockInward(inData);
//       setStockOutward(outData);
//     } catch (e) {
//       console.error("Error fetching stock data", e);
//     }
//   };

//   const fetchModels = async () => {
//     try {
//       const res = await axios.get(`${API_BASE}/products`);
//       setModels(res.data || []);
//     } catch (e) {
//       enqueueSnackbar('Failed to fetch models', { variant: 'error' });
//     }
//   };

//   const fetchSalePersons = async () => {
//     try {
//       const res = await axios.get(`${API_BASE}/salesPersons`);
//       setSalePersons(res.data || []);
//     } catch (e) {
//       enqueueSnackbar('Failed to fetch sales persons', { variant: 'error' });
//     }
//   };

//   const fetchCustomers = async () => {
//     try {
//       const res = await axios.get(`${API_BASE}/customers`);
//       setCustomers(res.data || []);
//     } catch (e) {
//       enqueueSnackbar('Failed to fetch customers', { variant: 'error' });
//     }
//   };

//   // Dialog open/close
//   const openOutwardDialog = () => {
//     const draft = localStorage.getItem('stockOutwardDraft');
//     if (draft) {
//       const parsed = JSON.parse(draft);
//       setCustomer(parsed.customer);
//       setLines(parsed.lines);
//       setGlobalScanned(new Set(parsed.globalScanned));
//       enqueueSnackbar('Restored draft data', { variant: 'info' });
//     } else {
//       setCustomer({
//         id: '',
//         customerName: '',
//         customerAddress: '',
//         mailId: '',
//         phoneNumber: '',
//         storeName: '',
//         gstNo: '',
//         customerType: '',
//       });
//       setLines([makeEmptyLine()]);
//       setGlobalScanned(new Set());
//     }
//     setErrors({});
//     setOpenDialog(true);
//     // Refresh stock data on open to strictly validate against latest
//     fetchStockData();
//   };

//   const closeDialog = () => setOpenDialog(false);

//   // Customer change
//   const handleCustomerChange = (e) => {
//     const id = e.target.value;
//     const c = customers.find((x) => x._id === id);
//     setCustomer({
//       id,
//       customerName: c?.customerName || '',
//       customerAddress: c?.address || '',
//       mailId: c?.mailId || '',
//       phoneNumber: c?.phoneNo || '',
//       storeName: c?.storeName || '',
//       gstNo: c?.gstNo || '', // Added GST No if exists
//       customerType: c?.customerType || '', // Added Customer Type if exists
//     });
//     if (errors.customer) {
//       setErrors((prev) => ({ ...prev, customer: '' }));
//     }
//   };

//   // Get next model for new line
//   const getNextModelForNewLine = (currentLines, products) => {
//     if (!products.length) return '';
//     const used = new Set(currentLines.map((l) => l.modelNo).filter(Boolean));
//     const lastModel = currentLines[currentLines.length - 1]?.modelNo || '';
//     const baseIndex = products.findIndex((p) => p.model === lastModel);
//     for (let step = 1; step <= products.length; step++) {
//       const idx = ((baseIndex >= 0 ? baseIndex : -1) + step) % products.length;
//       const candidate = products[idx].model;
//       if (!used.has(candidate)) return candidate;
//     }
//     return '';
//   };

//   // Line helpers
//   const setLineValue = (index, field, value) => {
//     setLines((prev) => {
//       const next = [...prev];
//       next[index] = { ...next[index], [field]: value };
//       return next;
//     });
//     if (errors[`line_${index}_${field}`]) {
//       setErrors((prev) => ({ ...prev, [`line_${index}_${field}`]: '' }));
//     }
//   };

//   const addLine = () => {
//     setLines((prev) => {
//       const newIdx = prev.length;
//       const nextLine = makeEmptyLine();
//       const autoModel = getNextModelForNewLine(prev, models);
//       if (autoModel) {
//         nextLine.modelNo = autoModel;
//         const p = models.find((m) => m.model === autoModel);
//         const stock = p?.reorderLevel ?? 0;
//         nextLine.category = p?.category || '';
//         nextLine.subCategory = p?.subCategory || ''; // Auto-fill subCategory
//         nextLine.lowStockWarning = stock <= 5 ? `Low stock for ${autoModel}: ${stock}` : '';
//       }
//       const next = [...prev, nextLine];
//       setTimeout(() => {
//         if (shdRefs.current[newIdx]) {
//           shdRefs.current[newIdx].focus();
//         }
//       }, 0);
//       return next;
//     });
//   };

//   const removeLine = (index) => {
//     setLines((prev) => {
//       const line = prev[index];
//       if (line?.scannedList?.length) {
//         const ns = new Set(globalScanned);
//         line.scannedList.forEach((code) => ns.delete(code));
//         setGlobalScanned(ns);
//       }
//       const next = prev.slice(0, index).concat(prev.slice(index + 1));
//       return next.length ? next : [makeEmptyLine()];
//     });
//   };

//   const recomputeLowStockForLine = (index, modelName) => {
//     const p = models.find((m) => m.model === modelName);
//     const stock = p?.reorderLevel ?? 0;
//     const text = stock <= 5 ? `Low stock for ${modelName}: ${stock}` : '';

//     // Update both warning and category
//     setLines((prev) => {
//       const next = [...prev];
//       next[index] = {
//         ...next[index],
//         lowStockWarning: text,
//         category: p?.category || '',
//         subCategory: p?.subCategory || '' // Auto-fill subCategory here
//       };
//       return next;
//     });
//   };

//   // Handle barcode scanning
//   const handleShdChange = (index, value) => {
//     setLineValue(index, 'shd', value);
//     if (value && value.trim().length >= 18) {
//       setTimeout(() => processBarcode(index), 80);
//     }
//   };

//   const handleScanKeyDown = (e, idx) => {
//     if (!scannerBuffers.current[idx]) scannerBuffers.current[idx] = '';
//     if (e.key === 'Enter') {
//       e.preventDefault();
//       const code = scannerBuffers.current[idx];
//       if (code) {
//         setLineValue(idx, 'shd', code);
//         processBarcode(idx, code);
//       }
//       scannerBuffers.current[idx] = '';
//       return;
//     }
//     if (e.key.length === 1) {
//       scannerBuffers.current[idx] += e.key;
//     }
//     clearTimeout(scannerTimers.current[idx]);
//     scannerTimers.current[idx] = setTimeout(() => {
//       const code = scannerBuffers.current[idx];
//       if (code) {
//         setLineValue(idx, 'shd', code);
//         processBarcode(idx, code);
//       }
//       scannerBuffers.current[idx] = '';
//     }, 200);
//   };

//   const processBarcode = (index, overrideRaw) => {
//     const line = lines[index];
//     const barcodeRaw = (overrideRaw || line.shd || '').trim();
//     if (!barcodeRaw) return;

//     // Helper to set error and clear input safely
//     const showError = (msg) => {
//       enqueueSnackbar(msg, { variant: 'error' });
//       // Clear input manually to avoid setLineValue's side effect of clearing errors
//       setLines((prev) => {
//         const next = [...prev];
//         next[index] = { ...next[index], shd: '' };
//         return next;
//       });
//       setErrors((prev) => ({ ...prev, [`line_${index}_shd`]: msg }));
//     };

//     // Validate customer and model
//     if (!customer.id) {
//       showError('Please select a Customer first');
//       setErrors((prev) => ({ ...prev, customer: 'Customer is required' }));
//       return;
//     }
//     if (!line.modelNo) {
//       showError('Please select Model No for this line first');
//       setErrors((prev) => ({ ...prev, [`line_${index}_modelNo`]: 'Model No is required' }));
//       return;
//     }

//     // Check quantity cap
//     const cap = capForLine(line);
//     if (cap !== Infinity && (line.scannedList?.length || 0) >= cap) {
//       enqueueSnackbar(`Target reached: ${cap} scans for this row`, { variant: 'warning' });
//       setLineValue(index, 'shd', '');
//       return;
//     }

//     // Check for duplicate barcodes (Local check in this transaction)
//     if (globalScanned.has(barcodeRaw)) {
//       showError('This barcode is already scanned (any line)');
//       return;
//     }

//     // --- Strict Barcode Validation against Stock ---
//     const modelName = line.modelNo;
//     const getCodes = (record) => {
//       const codes = [];
//       const raw = record.scannedBarcode || record.barcodes || record.scannedList || record.scannedCodes;
//       if (Array.isArray(raw)) {
//         raw.forEach(c => codes.push(String(c).trim()));
//       } else if (typeof raw === 'string') {
//         raw.split(',').forEach(c => {
//           if (c.trim()) codes.push(c.trim());
//         });
//       }
//       return codes;
//     };

//     // 1. Get all Inward barcodes for this model
//     const modelInwards = stockInward.filter(m => (m.product === modelName || m.modelNo === modelName));
//     const inwardSet = new Set();
//     modelInwards.forEach(m => getCodes(m).forEach(c => inwardSet.add(c)));

//     // 2. Get all Outward barcodes for this model
//     const modelOutwards = stockOutward.filter(m => (m.modelNo === modelName));
//     const outwardSet = new Set();
//     modelOutwards.forEach(m => getCodes(m).forEach(c => outwardSet.add(c)));

//     // 3. Verify availability (Inward AND NOT Outward)
//     if (!inwardSet.has(barcodeRaw)) {
//       showError('Barcode not found in inward stock for this model');
//       return;
//     }
//     if (outwardSet.has(barcodeRaw)) {
//       showError('Barcode already outwarded/sold');
//       return;
//     }
//     // -----------------------------------------------

//     // Validate barcode against model number (Sub-string check) - kept as secondary check
//     const matched = findModelMatchInBarcode(line.modelNo, barcodeRaw);
//     if (!matched) {
//       showError('Mismatch: No 5/4-char continuous segment from Model No found in barcode');
//       return;
//     }

//     // Update scanned list and global set
//     setLines((prev) => {
//       const arr = [...prev];
//       const L = { ...arr[index] };
//       const _cap = capForLine(L);
//       const currentLen = L.scannedList?.length || 0;
//       if (_cap !== Infinity && currentLen >= _cap) {
//         return arr;
//       }
//       const nextList = Array.from(new Set([...(L.scannedList || []), barcodeRaw]));
//       if (_cap !== Infinity && nextList.length > _cap) {
//         return arr;
//       }
//       L.scannedList = nextList;
//       L.scannedCodes = nextList.join(', ');
//       if (!L.isQuantityManual) {
//         L.quantity = nextList.length;
//       }
//       L.shd = '';
//       arr[index] = L;
//       const ns = new Set(globalScanned);
//       ns.add(barcodeRaw);
//       setGlobalScanned(ns);
//       const left = remainingForLine(L);
//       enqueueSnackbar(
//         left === Infinity
//           ? `Accepted for ${line.modelNo} (match: "${matched}")`
//           : `Accepted (${line.modelNo}). Remaining: ${left}`,
//         { variant: 'success' }
//       );
//       return arr;
//     });
//   };

//   // Validate form
//   const validateForm = () => {
//     const e = {};
//     let ok = true;
//     if (!customer.id) {
//       e.customer = 'Customer is required';
//       ok = false;
//     }
//     lines.forEach((ln, i) => {
//       if (!ln.modelNo) {
//         e[`line_${i}_modelNo`] = 'Model No is required';
//         ok = false;
//       }
//       if (!ln.salePerson) {
//         e[`line_${i}_salePerson`] = 'Sales Person is required';
//         ok = false;
//       }
//       const qty = qtyForLine(ln);
//       if (qty <= 0) {
//         e[`line_${i}_quantity`] = 'Enter a quantity > 0 or scan at least one code';
//         ok = false;
//       }
//       const prod = models.find((m) => m.model === ln.modelNo);
//       const stock = prod?.reorderLevel || 0;
//       if (qty > stock) {
//         e[`line_${i}_quantity`] = `Quantity exceeds available stock (${stock})`;
//         ok = false;
//       }
//       // New check: Scanned quantity must match manual quantity if manual is set
//       if (ln.isQuantityManual && ln.scannedList.length !== Number(ln.quantity)) {
//         e[`line_${i}_quantity`] = `Scanned quantity (${ln.scannedList.length}) does not match manual quantity (${ln.quantity})`;
//         ok = false;
//       }
//     });
//     setErrors(e);
//     return ok;
//   };

//   // Submit form
//   const handleSubmit = async () => {
//     if (!validateForm()) return;
//     try {
//       const res = await axios.get(`${API_BASE}/products`);
//       const products = res.data || [];
//       for (const ln of lines) {
//         if (!ln.modelNo) continue;
//         const qty = qtyForLine(ln);
//         if (qty <= 0) continue;
//         const product = products.find((p) => p.model === ln.modelNo);
//         if (!product) continue;
//         const payload = {
//           modelNo: ln.modelNo,
//           category: ln.category,
//           subCategory: ln.subCategory, // Added subCategory to payload
//           quantity: qty,
//           price: Number(ln.price) || 0,
//           salePerson: ln.salePerson,
//           customerName: customer.customerName,
//           barcodes: ln.scannedList || [],
//           dispatchDate: new Date(),
//           customerAddress: customer.customerAddress,
//           mailId: customer.mailId,
//           phoneNumber: customer.phoneNumber,
//           storeName: customer.storeName,
//           gstNo: customer.gstNo,
//           customerType: customer.customerType,
//         };
//         await axios.post(`${API_BASE}/dispatch`, payload);
//         const updatedReorder = Math.max(0, (product.reorderLevel || 0) - qty);
//         const newStatus = statusForQty(updatedReorder);
//         await axios.put(`${API_BASE}/products/${product._id}`, {
//           reorderLevel: updatedReorder,
//           stockStatus: newStatus,
//         });
//       }
//       enqueueSnackbar('Stock outward recorded and stocks updated!', { variant: 'success' });
//       localStorage.removeItem('stockOutwardDraft'); // Clear draft
//       closeDialog();
//     } catch (err) {
//       console.error(err);
//       enqueueSnackbar('Failed to submit stock outward', { variant: 'error' });
//     }
//   };

//   return (
//     <Box sx={{ padding: '40px 20px' }}>
//       <Box sx={{ textAlign: 'center', mb: 4 }}>
//         <Typography variant="h4">Stock Outward</Typography>
//         <Typography variant="body1">Scan products to remove them from inventory</Typography>
//       </Box>
//       <Box
//         sx={{
//           maxWidth: 500,
//           mx: 'auto',
//           bgcolor: 'white',
//           borderRadius: 2,
//           p: 6,
//           textAlign: 'center',
//           border: '1px solid #e5e7eb',
//           boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
//         }}
//       >
//         <Box
//           sx={{
//             width: 80,
//             height: 80,
//             bgcolor: '#fee2e2',
//             borderRadius: '50%',
//             display: 'inline-flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             mb: 3,
//           }}
//         >
//           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
//             <path d="M9 12l2 2 4-4" />
//             <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.12 0 4.04.74 5.57 1.97" />
//           </svg>
//         </Box>
//         <Typography variant="h6">Scan Product Barcode</Typography>
//         <Typography variant="body2">Use your camera or enter barcode manually</Typography>
//         <Button variant="contained" color="error" onClick={openOutwardDialog} sx={{ mt: 2 }}>
//           Start Scanning
//         </Button>
//       </Box>
//       <Dialog
//         open={openDialog}
//         onClose={(event, reason) => {
//           if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
//             return;
//           }
//           closeDialog();
//         }}
//         maxWidth="lg"
//         fullWidth
//       >
//         <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//           Stock Outward
//           <Tooltip title="Add Model">
//             <IconButton color="primary" onClick={addLine}>
//               <AddIcon />
//             </IconButton>
//           </Tooltip>
//         </DialogTitle>
//         <DialogContent>
//           <FormControl fullWidth sx={{ mt: 1 }} error={!!errors.customer}>
//             <InputLabel>Customer Name *</InputLabel>
//             <Select
//               name="customerId"
//               value={customer.id}
//               onChange={handleCustomerChange}
//               label="Customer Name *"
//             >
//               {customers.map((c) => (
//                 <MenuItem key={c._id} value={c._id}>
//                   {c.customerName}
//                 </MenuItem>
//               ))}
//             </Select>
//             <FormHelperText>{errors.customer}</FormHelperText>
//           </FormControl>
//           <Grid container spacing={2} sx={{ mt: 1 }}>
//             <Grid item xs={12} sm={6} md={2}>
//               <TextField
//                 label="Address"
//                 fullWidth
//                 value={customer.customerAddress}
//                 InputProps={{ readOnly: true }}
//               />
//             </Grid>
//             <Grid item xs={12} sm={6} md={2}>
//               <TextField label="Email" fullWidth value={customer.mailId} InputProps={{ readOnly: true }} />
//             </Grid>
//             <Grid item xs={12} sm={6} md={2}>
//               <TextField label="Phone" fullWidth value={customer.phoneNumber} InputProps={{ readOnly: true }} />
//             </Grid>
//             <Grid item xs={12} sm={6} md={2}>
//               <TextField label="GST No" fullWidth value={customer.gstNo} InputProps={{ readOnly: true }} />
//             </Grid>
//             <Grid item xs={12} sm={6} md={2}>
//               <TextField label="Customer Type" fullWidth value={customer.customerType} InputProps={{ readOnly: true }} />
//             </Grid>
//             <Grid item xs={12} sm={6} md={2}>
//               <TextField label="Store Name" fullWidth value={customer.storeName} InputProps={{ readOnly: true }} />
//             </Grid>
//           </Grid>
//           <Divider sx={{ my: 3 }} />
//           <Stack spacing={2}>
//             {lines.map((ln, idx) => {
//               const product = models.find((m) => m.model === ln.modelNo);
//               const stock = product?.reorderLevel ?? 0;
//               const qty = qtyForLine(ln);
//               const afterStock = Math.max(0, stock - qty);
//               const remaining = remainingForLine(ln);
//               const cap = capForLine(ln);
//               return (
//                 <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
//                   <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
//                     <Typography fontWeight={600}>Model #{idx + 1}</Typography>
//                     <Stack direction="row" spacing={1} alignItems="center">
//                       {ln.lowStockWarning && <Chip label={ln.lowStockWarning} color="warning" size="small" />}
//                       <Tooltip title="Remove model line">
//                         <span>
//                           <IconButton color="error" onClick={() => removeLine(idx)} disabled={lines.length === 1}>
//                             <DeleteIcon />
//                           </IconButton>
//                         </span>
//                       </Tooltip>
//                     </Stack>
//                   </Stack>
//                   <Grid container spacing={2}>
//                     <Grid item xs={12} sm={6} md={4} sx={{ width: '20rem' }}>
//                       <FormControl fullWidth error={!!errors[`line_${idx}_modelNo`]}>
//                         <InputLabel>Model No *</InputLabel>
//                         <Select
//                           label="Model No *"
//                           value={ln.modelNo}
//                           onChange={(e) => {
//                             setLineValue(idx, 'modelNo', e.target.value);
//                             recomputeLowStockForLine(idx, e.target.value);
//                           }}
//                         >
//                           {models.map((m) => (
//                             <MenuItem key={m._id} value={m.model}>
//                               {m.model}
//                             </MenuItem>
//                           ))}
//                         </Select>
//                         <FormHelperText>{errors[`line_${idx}_modelNo`]}</FormHelperText>
//                       </FormControl>
//                       <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
//                         Current stock: {stock}
//                       </Typography>
//                     </Grid>
//                     <Grid item xs={12} sm={6} md={4} sx={{ width: '20rem' }}>
//                       <TextField
//                         label="Category"
//                         fullWidth
//                         value={ln.category}
//                         onChange={(e) => setLineValue(idx, 'category', e.target.value)}
//                         sx={{ mb: 2 }}
//                         InputProps={{ readOnly: true }} // Made read-only as it's auto-filled
//                       />
//                       <TextField
//                         label="Sub Category"
//                         fullWidth
//                         value={ln.subCategory}
//                         onChange={(e) => setLineValue(idx, 'subCategory', e.target.value)}
//                         sx={{ mb: 2 }}
//                         InputProps={{ readOnly: true }} // Made read-only as it's auto-filled
//                       />
//                       <FormControl fullWidth error={!!errors[`line_${idx}_salePerson`]}>

//                         value={ln.category}
//                         onChange={(e) => setLineValue(idx, 'category', e.target.value)}
//                         sx={{ mb: 2 }}
//                         InputProps={{ readOnly: true }} // Made read-only as it's auto-filled
//                       />
//                         <TextField
//                           label="Sub Category"
//                           fullWidth
//                           value={ln.subCategory}
//                           onChange={(e) => setLineValue(idx, 'subCategory', e.target.value)}
//                           sx={{ mb: 2 }}
//                           InputProps={{ readOnly: true }} // Made read-only as it's auto-filled
//                         />
//                         <FormControl fullWidth error={!!errors[`line_${idx}_salePerson`]}>

// =======
//                       <FormControl fullWidth error={!!errors[`line_${idx}_salePerson`]}>
// >>>>>>> 31d76e31ea2ed9e2fc722a7f9133118915ac4b07
//                             | [];
//                               if (cur.length > q) {
//                                 const kept = cur.slice(0, q);
//                             const removed = cur.slice(q);
//                             const ns = new Set(globalScanned);
//                                 removed.forEach((c) => ns.delete(c));
//                             setGlobalScanned(ns);
//                             L.scannedList = kept;
//                             L.scannedCodes = kept.join(', ');
//                               }
//                             }
//                             arr[idx] = L;
//                             return arr;
//                           });
//                         }}
//                             error={!!errors[`line_${idx}_quantity`]}
//                             helperText={
//                               errors[`line_${idx}_quantity`] || 'Typed value caps how many barcodes you can scan for this row'
//                             }
//                       />
//                             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//                               <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
//                                 After outward: {afterStock} {qty > 0 ? `(-${qty})` : ''}
//                               </Typography>
//                               <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
//                                 {cap === Infinity ? 'No scan limit (uses scanned count)' : `Remaining scans allowed: ${remaining}`}
//                               </Typography>
//                             </div>
//                           </Grid>
//                           <Grid item xs={12} sm={6} md={4} sx={{ width: '30rem' }}>
//                             <TextField
//                               label="Price per Unit"
//                               type="number"
//                               fullWidth
//                               value={ln.price}
//                               onChange={(e) => setLineValue(idx, 'price', e.target.value)}
//                             />
//                           </Grid>
//                           <Grid item xs={12} md={8} sx={{ width: '38rem' }}>
//                             <TextField
//                               label="Scan barcode"
//                               fullWidth
//                               value={ln.shd}
//                               onChange={(e) => setLineValue(idx, 'shd', e.target.value)}
//                               onKeyDown={(e) => {
//                                 if (e.key === 'Enter') {
//                                   e.preventDefault();
//                                   if (ln.shd.trim()) {
//                                     processBarcode(idx, ln.shd.trim());
//                                   }
//                                 } else {
//                                   handleScanKeyDown(e, idx);
//                                 }
//                               }}
//                               error={!!errors[`line_${idx}_shd`]}
//                               helperText={
//                                 errors[`line_${idx}_shd`] ||
//                                 (cap === Infinity
//                                   ? 'Barcode must include any continuous 5 or 4 chars from Model No'
//                                   : `Allowed up to ${cap} scans for this row`)
//                               }
//                               inputRef={(el) => (shdRefs.current[idx] = el)}
//                               disabled={remaining === 0}
//                             />
//                           </Grid>
//                           <Grid item xs={12} sx={{ width: '100%' }}>
//                             <TextField
//                               label="Scanned Codes"
//                               fullWidth
//                               multiline
//                               rows={3}
//                               value={ln.scannedCodes}
//                               InputProps={{ readOnly: true }}
//                               sx={{ width: '100%' }}
//                             />
//                             <Typography variant="caption" sx={{ mt: 0.5, display: 'block', width: '100%' }}>
//                               Total scanned: {ln.scannedList.length}
//                             </Typography>
//                           </Grid>
//                         </Grid>
//                       </Paper>
//                       );
//             })}
//                     </Stack>
//                     <Divider sx={{ my: 3 }}>Selected Products Preview</Divider>
//                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
//                       {lines
//                         .filter((ln) => ln.modelNo)
//                         .map((ln, i) => {
//                           const p = models.find((x) => x.model === ln.modelNo);
//                           if (!p) return null;
//                           const current = p.reorderLevel ?? 0;
//                           const qty = qtyForLine(ln);
//                           const after = Math.max(0, current - qty);
//                           const statusAfter = statusForQty(after);
//                           return (
//                             <div
//                               key={`${ln.modelNo}-${i}`}
//                               style={{
//                                 backgroundColor: 'white',
//                                 borderRadius: 12,
//                                 padding: 24,
//                                 boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
//                                 border: '1px solid #f0f0f0',
//                               }}
//                             >
//                               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
//                                 <div>
//                                   <h3 style={{ margin: 0, fontSize: 17, color: '#1a1a1a', marginBottom: 4 }}>{p.brand || 'No Brand'}</h3>
//                                   <div style={{ display: 'flex', gap: 10 }}>
//                                     <div style={{ fontSize: 13, color: '#6c757d' }}>Model:</div>
//                                     <div style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>{p.model || 'No Model'}</div>
//                                   </div>
//                                   <div style={{ display: 'flex', gap: 10 }}>
//                                     <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 4 }}>Sub-Category:</div>
//                                     <div style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>{p.subCategory || '-'}</div>
//                                   </div>
//                                 </div>
//                                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
//                                   <span style={getStatusStyle(statusAfter)}>{statusAfter}</span>
//                                   <img
//                                     src={getImageUrl(p.productImage)}
//                                     alt="Product"
//                                     onError={(e) => {
//                                       e.currentTarget.onerror = null;
//                                     }}
//                                     style={{
//                                       width: 45,
//                                       height: 45,
//                                       objectFit: 'cover',
//                                       border: '1px solid #e9e9e9',
//                                       borderRadius: 4,
//                                       boxShadow: 'rgba(0, 0, 0, 0.16) 0px 1px 4px',
//                                     }}
//                                   />
//                                 </div>
//                               </div>
//                               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: 24 }}>
//                                 <div style={{ display: 'flex', gap: 10 }}>
//                                   <div style={{ fontSize: 13, color: '#1a1a1a', marginBottom: 4 }}>Category:</div>
//                                   <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{p.category || '-'}</div>
//                                 </div>
//                                 <div style={{ textAlign: 'right', display: 'flex', gap: 10, justifyContent: 'end' }}>
//                                   <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 4 }}>EmailTo:</div>
//                                   <div style={{ fontSize: 13, color: '#1a1a1a' }}>{p.emailTo || '-'}</div>
//                                 </div>
//                                 <div style={{ display: 'flex', gap: 10 }}>
//                                   <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 4 }}>Quantity:</div>
//                                   <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>
//                                     {current} → <span style={{ fontWeight: 700 }}>{after}</span> {qty > 0 ? `(-${qty})` : ''}
//                                   </div>
//                                 </div>
//                                 <div style={{ textAlign: 'right', display: 'flex', gap: 10, justifyContent: 'end', alignItems: 'center' }}>
//                                   <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 4 }}>Old Price:</div>
//                                   <div style={{ fontSize: 13, color: 'rgb(108 117 125)', textDecoration: 'line-through' }}>
//                                     ₹{Number(p.mrp || 0).toLocaleString()}
//                                   </div>
//                                   <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 4, marginLeft: 10 }}>Price:</div>
//                                   <div style={{ fontSize: 13, fontWeight: 500, color: '#28a745' }}>
//                                     ₹{Number(p.dealerPrice || 0).toLocaleString()}
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>
//                           );
//                         })}
//                     </div>
//                   </DialogContent>
//                   <DialogActions>
//                     <Button onClick={closeDialog}>Cancel</Button>
//                     <Button onClick={handleSubmit} variant="contained" color="primary">
//                       Submit
//                     </Button>
//                   </DialogActions>
//                 </Dialog>
//     </Box>
//           );
// };

//           export default StockOutward;



















// src/Pages/StockOutward.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  IconButton,
  Divider,
  Grid,
  Paper,
  Stack,
  Tooltip,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';
import { useSnackbar } from 'notistack';

const API_BASE = 'https://coloroninventoy.onrender.com/api';
const FILE_HOST = 'https://coloroninventoy.onrender.com';

// Helper: Image URL
const getImageUrl = (img) => {
  if (!img) return '/no-image.png';
  const file = String(img)
    .replace(/\\/g, '/')
    .replace(/^\/?uploads\/?/i, '')
    .split('/')
    .pop();
  return `${FILE_HOST}/uploads/${file}`;
};

// Helper: Status for Quantity
const statusForQty = (qty) => {
  if (qty <= 0) return 'Out of Stock';
  if (qty > 0 && qty <= 5) return 'Low Stock';
  return 'In Stock';
};

// Helper: Status Style
const getStatusStyle = (status) => {
  if (status === 'In Stock') {
    return {
      backgroundColor: '#d4edda',
      color: '#155724',
      padding: '4px 12px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: '500',
    };
  } else if (status === 'Out of Stock') {
    return {
      backgroundColor: 'rgb(255 221 232)',
      color: 'rgb(186 13 13)',
      padding: '4px 12px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: '500',
    };
  } else if (status === 'Low Stock') {
    return {
      backgroundColor: '#fff3cd',
      color: '#856404',
      padding: '4px 12px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: '500',
    };
  }
  return {};
};

// Helper: Empty Line
function makeEmptyLine() {
  return {
    modelNo: '',
    category: '',
    subCategory: '',
    salePerson: '',
    quantity: 0,
    price: 0,
    shd: '',
    scannedCodes: '',
    scannedList: [],
    isQuantityManual: false,
    lowStockWarning: '',
  };
}

// Helper: Cap for Line
const capForLine = (ln) => {
  const q = Number(ln.quantity);
  if (ln.isQuantityManual && Number.isFinite(q) && q > 0) return q;
  return Infinity;
};

// Helper: Remaining for Line
const remainingForLine = (ln) => {
  const cap = capForLine(ln);
  if (cap === Infinity) return Infinity;
  return Math.max(0, cap - (ln.scannedList?.length || 0));
};

// Helper: Quantity for Line
const qtyForLine = (ln) => {
  const manual = Number(ln.quantity);
  if (!Number.isNaN(manual) && manual > 0) return manual;
  return ln.scannedList?.length || 0;
};

// Helper: split combined scanner strings
const splitBarcodes = (raw, modelNo) => {
  if (!raw) return [];
  // First split by commas, semicolons, newlines, tabs, and spaces
  const initialSegments = raw.split(/[,;\s\t\n]+/).map(s => s.trim()).filter(Boolean);

  const finalCodes = [];
  for (const seg of initialSegments) {
    // 1. Try universal pattern match first
    const matches = seg.match(/[A-Z]{2}-[A-Z0-9-_]+?\d{5,}/gi);
    if (matches && matches.length > 0) {
      finalCodes.push(...matches);
      continue;
    }

    // 2. Try dynamic repeating prefix detection
    let repeatPrefix = null;
    for (let len = 8; len >= 3; len--) {
      if (seg.length < len * 2) continue;
      const cand = seg.substring(0, len);
      // Ensure cand contains letters or numbers
      if (!/[A-Z0-9]/i.test(cand)) continue;
      const firstIdx = seg.indexOf(cand);
      const lastIdx = seg.lastIndexOf(cand);
      if (firstIdx === 0 && lastIdx > 0) {
        repeatPrefix = cand;
        break;
      }
    }

    if (repeatPrefix) {
      const escapedPrefix = repeatPrefix.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(?=${escapedPrefix})`, 'i');
      const subSegs = seg.split(regex).map(s => s.trim()).filter(Boolean);
      finalCodes.push(...subSegs);
    } else {
      // 3. Fallback to model-prefix lookahead or general XX-H- / XX-I- check
      let modelPrefix = '';
      if (modelNo) {
        const parts = modelNo.split('-');
        if (parts.length >= 2) {
          modelPrefix = parts.slice(0, 2).join('-');
        }
      }
      let subSegs = [seg];
      if (modelPrefix && seg.toLowerCase().indexOf(modelPrefix.toLowerCase()) !== seg.toLowerCase().lastIndexOf(modelPrefix.toLowerCase())) {
        const regex = new RegExp(`(?=${modelPrefix.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'i');
        subSegs = seg.split(regex).map(s => s.trim()).filter(Boolean);
      } else if (/(?=([A-Z0-9]{2,4}-[A-Z0-9]{1,4}-))/i.test(seg)) {
        subSegs = seg.split(/(?=[A-Z0-9]{2,4}-[A-Z0-9]{1,4}-)/i).map(s => s.trim()).filter(Boolean);
      }
      finalCodes.push(...subSegs);
    }
  }
  return finalCodes.filter((code) => code.length >= 8);
};

const StockOutward = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [models, setModels] = useState([]);
  const [salePersons, setSalePersons] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [openDialog, setOpenDialog] = useState(false);

  const [customer, setCustomer] = useState({
    id: '',
    customerName: '',
    customerAddress: '',
    mailId: '',
    phoneNumber: '',
    storeName: '',
    gstNo: '',
    customerType: '',
  });

  const [errors, setErrors] = useState({});
  const [globalScanned, setGlobalScanned] = useState(new Set());
  const [lines, setLines] = useState([makeEmptyLine()]);

  const shdRefs = useRef({});
  const scannerBuffers = useRef({});
  const scannerTimers = useRef({});

  const [availableInventoryBarcodes, setAvailableInventoryBarcodes] = useState({});

  // ✅ fetchers
  const fetchAvailableBarcodes = useCallback(async () => {
    try {
      const [invRes, warRes] = await Promise.all([
        axios.get(`${API_BASE}/inventory`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/warranties`).catch(() => ({ data: [] }))
      ]);

      const invData = Array.isArray(invRes.data) ? invRes.data : [];
      const warData = Array.isArray(warRes.data) ? warRes.data : [];

      const modelBarcodeMap = {};

      // 1. From Inventory records
      invData.forEach((item) => {
        const m = (item.modelNo || item.model || '').trim();
        if (!m) return;
        if (!modelBarcodeMap[m]) modelBarcodeMap[m] = new Set();

        if (Array.isArray(item.barcodes)) {
          item.barcodes.forEach((b) => {
            if (b && typeof b === 'string') modelBarcodeMap[m].add(b.trim());
          });
        }
        if (item.scannedCodes && typeof item.scannedCodes === 'string') {
          item.scannedCodes.split(/[,;\s\n]+/).forEach((b) => {
            const clean = b.trim();
            if (clean && clean.length >= 6) modelBarcodeMap[m].add(clean);
          });
        }
      });

      // 2. From Warranties records (stock items)
      warData.forEach((w) => {
        const m = (w.modelNo || w.productName || '').trim();
        if (!m) return;
        if (!modelBarcodeMap[m]) modelBarcodeMap[m] = new Set();
        if (w.barcode && typeof w.barcode === 'string') modelBarcodeMap[m].add(w.barcode.trim());
        if (w.serialNumber && typeof w.serialNumber === 'string') modelBarcodeMap[m].add(w.serialNumber.trim());
      });

      setAvailableInventoryBarcodes(modelBarcodeMap);
    } catch (err) {
      console.error('Failed to load available barcodes map', err);
    }
  }, []);

  const fetchModels = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/products`);
      setModels(res.data || []);
    } catch (e) {
      enqueueSnackbar('Failed to fetch models', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const fetchSalePersons = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/salesPersons`);
      setSalePersons(res.data || []);
    } catch (e) {
      enqueueSnackbar('Failed to fetch sales persons', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/customers`);
      setCustomers(res.data || []);
    } catch (e) {
      enqueueSnackbar('Failed to fetch customers', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchModels();
    fetchSalePersons();
    fetchCustomers();
    fetchAvailableBarcodes();
  }, [fetchModels, fetchSalePersons, fetchCustomers, fetchAvailableBarcodes]);

  // Auto-save draft
  useEffect(() => {
    const draft = {
      customer,
      lines,
      globalScanned: Array.from(globalScanned),
    };
    localStorage.setItem('stockOutwardDraft', JSON.stringify(draft));
  }, [customer, lines, globalScanned]);

  // Dialog open/close
  const openOutwardDialog = () => {
    fetchAvailableBarcodes();
    const draft = localStorage.getItem('stockOutwardDraft');
    if (draft) {
      const parsed = JSON.parse(draft);
      setCustomer(parsed.customer);
      setLines((parsed.lines || [makeEmptyLine()]).map(l => {
        if (l.modelNo && (!l.price || Number(l.price) === 0)) {
          const p = models.find(m => m.model === l.modelNo);
          if (p) {
            const priceVal = p.dealerPrice !== undefined && p.dealerPrice !== null && p.dealerPrice !== ''
              ? Number(p.dealerPrice)
              : (Number(p.mrp) || Number(p.price) || 0);
            return { ...l, price: priceVal };
          }
        }
        return l;
      }));
      setGlobalScanned(new Set(parsed.globalScanned || []));
      enqueueSnackbar('Restored draft data', { variant: 'info' });
    } else {
      setCustomer({
        id: '',
        customerName: '',
        customerAddress: '',
        mailId: '',
        phoneNumber: '',
        storeName: '',
        gstNo: '',
        customerType: '',
      });
      setLines([makeEmptyLine()]);
      setGlobalScanned(new Set());
    }
    setErrors({});
    setOpenDialog(true);
  };

  const closeDialog = () => setOpenDialog(false);

  // Customer change
  const handleCustomerChange = (e) => {
    const id = e.target.value;
    const c = customers.find((x) => x._id === id);
    setCustomer({
      id,
      customerName: c?.customerName || '',
      customerAddress: c?.address || '',
      mailId: c?.mailId || '',
      phoneNumber: c?.phoneNo || '',
      storeName: c?.storeName || '',
      gstNo: c?.gstNo || '',
      customerType: c?.customerType || '',
    });
    if (errors.customer) setErrors((prev) => ({ ...prev, customer: '' }));
  };

  // Get next model for new line
  const getNextModelForNewLine = (currentLines, products) => {
    if (!products.length) return '';
    const used = new Set(currentLines.map((l) => l.modelNo).filter(Boolean));
    const lastModel = currentLines[currentLines.length - 1]?.modelNo || '';
    const baseIndex = products.findIndex((p) => p.model === lastModel);
    for (let step = 1; step <= products.length; step++) {
      const idx = ((baseIndex >= 0 ? baseIndex : -1) + step) % products.length;
      const candidate = products[idx].model;
      if (!used.has(candidate)) return candidate;
    }
    return '';
  };

  // Line helpers
  const setLineValue = (index, field, value) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    if (errors[`line_${index}_${field}`]) {
      setErrors((prev) => ({ ...prev, [`line_${index}_${field}`]: '' }));
    }
  };

  const addLine = () => {
    setLines((prev) => {
      const newIdx = prev.length;
      const nextLine = makeEmptyLine();
      const autoModel = getNextModelForNewLine(prev, models);
      if (autoModel) {
        nextLine.modelNo = autoModel;
        const p = models.find((m) => m.model === autoModel);
        const stock = p?.reorderLevel ?? 0;
        const priceVal = p?.dealerPrice !== undefined && p?.dealerPrice !== null && p?.dealerPrice !== ''
          ? Number(p.dealerPrice)
          : (Number(p?.mrp) || Number(p?.price) || 0);

        nextLine.category = p?.category || '';
        nextLine.subCategory = p?.subCategory || '';
        nextLine.price = priceVal;
        nextLine.lowStockWarning = stock <= 5 ? `Low stock for ${autoModel}: ${stock}` : '';
      }
      const next = [...prev, nextLine];
      setTimeout(() => shdRefs.current[newIdx]?.focus?.(), 0);
      return next;
    });
  };

  const removeLine = (index) => {
    setLines((prev) => {
      const line = prev[index];
      if (line?.scannedList?.length) {
        const ns = new Set(globalScanned);
        line.scannedList.forEach((code) => ns.delete(code));
        setGlobalScanned(ns);
      }
      const next = prev.slice(0, index).concat(prev.slice(index + 1));
      return next.length ? next : [makeEmptyLine()];
    });
  };

  const recomputeLowStockForLine = (index, modelName) => {
    const p = models.find((m) => m.model === modelName);
    const stock = p?.reorderLevel ?? 0;
    const text = stock <= 5 ? `Low stock for ${modelName}: ${stock}` : '';
    const priceVal = p?.dealerPrice !== undefined && p?.dealerPrice !== null && p?.dealerPrice !== ''
      ? Number(p.dealerPrice)
      : (Number(p?.mrp) || Number(p?.price) || 0);

    setLines((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        lowStockWarning: text,
        category: p?.category || '',
        subCategory: p?.subCategory || '',
        price: priceVal,
      };
      return next;
    });
  };

  /**
   * ✅ ACCEPT ANY BARCODE:
   * - blocks duplicates (global)
   * - respects quantity cap (if manual)
   * - transfers FULL barcode value into scannedCodes
   */
  const processBarcode = (index, overrideRaw) => {
    const rawInput = String(overrideRaw || '').trim();
    if (!rawInput) return;

    if (!customer.id) {
      enqueueSnackbar('Please select a Customer first', { variant: 'error' });
      setErrors((prev) => ({ ...prev, customer: 'Customer is required' }));
      return;
    }

    setLines((prev) => {
      const arr = [...prev];
      const L0 = arr[index];
      if (!L0) return prev;

      if (!L0.modelNo) {
        setTimeout(() => {
          enqueueSnackbar('Please select Model No for this line first', { variant: 'error' });
        }, 0);
        setErrors((p) => ({ ...p, [`line_${index}_modelNo`]: 'Model No is required' }));
        arr[index] = { ...L0, shd: '' };
        return arr;
      }

      // Split input into individual barcodes
      const barcodes = splitBarcodes(rawInput, L0.modelNo);
      if (barcodes.length === 0) return prev;

      const currentList = L0.scannedList || [];
      const nextList = [...currentList];
      const cap = capForLine(L0);

      const targetModel = (L0.modelNo || '').trim();
      const availableSet = availableInventoryBarcodes[targetModel] || new Set();

      let addedCount = 0;
      const duplicateBarcodes = [];
      const invalidUnavailableBarcodes = [];
      let capReached = false;

      for (const code of barcodes) {
        if (cap !== Infinity && nextList.length >= cap) {
          capReached = true;
          break;
        }

        // Duplicate check (both in current session and globally in this form)
        if (globalScanned.has(code) || nextList.includes(code)) {
          duplicateBarcodes.push(code);
          continue;
        }

        // Available in stock check for this specific model
        if (availableSet.size > 0) {
          const isAvailable = Array.from(availableSet).some(
            (avail) => avail.toLowerCase() === code.toLowerCase()
          );
          if (!isAvailable) {
            invalidUnavailableBarcodes.push(code);
            continue;
          }
        }

        nextList.push(code);
        addedCount++;

        // Update global scanned set
        setGlobalScanned((prevSet) => {
          const ns = new Set(prevSet);
          ns.add(code);
          return ns;
        });
      }

      if (invalidUnavailableBarcodes.length > 0) {
        setTimeout(() => {
          setErrors((e) => ({
            ...e,
            [`line_${index}_shd`]: `Barcode is not available in stock for Model ${targetModel}`,
          }));
          invalidUnavailableBarcodes.forEach((code) => {
            enqueueSnackbar(
              `Not in Stock: Barcode "${code}" is not available in inventory for Model ${targetModel}!`,
              { variant: 'error' }
            );
          });
        }, 0);
      }

      if (duplicateBarcodes.length > 0) {
        setTimeout(() => {
          setErrors((e) => ({ ...e, [`line_${index}_shd`]: 'This barcode is already scanned in another row' }));
          duplicateBarcodes.forEach((code) => {
            enqueueSnackbar(`Already scanned: ${code}`, { variant: 'warning' });
          });
        }, 0);
      }

      if (capReached) {
        setTimeout(() => {
          enqueueSnackbar(`Target reached: ${cap} scans for this row`, { variant: 'warning' });
        }, 0);
      }

      if (addedCount > 0) {
        const L = { ...L0 };
        L.scannedList = nextList;
        L.scannedCodes = nextList.join(', ');
        if (!L.isQuantityManual) L.quantity = nextList.length;
        L.shd = '';
        arr[index] = L;

        const left = remainingForLine(L);
        setTimeout(() => {
          enqueueSnackbar(
            left === Infinity ? `Accepted ${addedCount} barcode(s) for ${L.modelNo}` : `Accepted ${addedCount} barcode(s) (${L.modelNo}). Remaining: ${left}`,
            { variant: 'success' }
          );
        }, 0);
        return arr;
      } else {
        // No new barcodes were added
        const L = { ...L0 };
        L.shd = '';
        arr[index] = L;
        return arr;
      }
    });
  };

  /**
   * ✅ Scanner input:
   * - buffer chars
   * - Enter/Tab ends scan
   * - OR 200ms idle ends scan
   * -> ensures FULL barcode is sent
   */
  const handleScanKeyDown = (e, idx) => {
    if (!scannerBuffers.current[idx]) scannerBuffers.current[idx] = '';

    const flush = () => {
      const buffered = String(scannerBuffers.current[idx] || e.target.value || '').trim();
      if (buffered) {
        // show in input quickly (optional)
        setLineValue(idx, 'shd', buffered);
        processBarcode(idx, buffered);
      }
      scannerBuffers.current[idx] = '';
    };

    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      flush();
      return;
    }

    if (['Shift', 'CapsLock', 'Control', 'Alt', 'Meta'].includes(e.key)) return;

    if (e.key.length === 1) scannerBuffers.current[idx] += e.key;

    clearTimeout(scannerTimers.current[idx]);
    scannerTimers.current[idx] = setTimeout(() => flush(), 200);
  };

  const validateForm = () => {
    const e = {};
    let ok = true;

    if (!customer.id) {
      e.customer = 'Customer is required';
      ok = false;
    }

    lines.forEach((ln, i) => {
      if (!ln.modelNo) {
        e[`line_${i}_modelNo`] = 'Model No is required';
        ok = false;
      }
      if (!ln.category) {
        e[`line_${i}_category`] = 'Category is required';
        ok = false;
      }
      if (!ln.subCategory) {
        e[`line_${i}_subCategory`] = 'Sub Category is required';
        ok = false;
      }
      if (!ln.salePerson) {
        e[`line_${i}_salePerson`] = 'Sales Person is required';
        ok = false;
      }

      const qty = qtyForLine(ln);
      if (qty <= 0) {
        e[`line_${i}_quantity`] = 'Quantity must be greater than 0';
        ok = false;
      }

      const prod = models.find((m) => m.model === ln.modelNo);
      const stock = prod?.reorderLevel || 0;
      if (qty > stock) {
        e[`line_${i}_quantity`] = `Quantity exceeds available stock (${stock})`;
        ok = false;
      }

      if (ln.price === '' || ln.price === null || ln.price === undefined || Number(ln.price) <= 0) {
        e[`line_${i}_price`] = 'Price per Unit is required';
        ok = false;
      }

      const scannedCount = ln.scannedList?.length || 0;
      if (scannedCount === 0) {
        e[`line_${i}_shd`] = 'Please scan the barcode(s) for this model';
        ok = false;
      } else if (ln.isQuantityManual && scannedCount !== Number(ln.quantity)) {
        e[`line_${i}_quantity`] = `Scanned count (${scannedCount}) does not match quantity (${ln.quantity})`;
        ok = false;
      }
    });

    setErrors(e);
    if (!ok) {
      enqueueSnackbar('Please fill in all required fields for each model line', { variant: 'error' });
    }
    return ok;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const res = await axios.get(`${API_BASE}/products`);
      const products = res.data || [];

      for (const ln of lines) {
        if (!ln.modelNo) continue;

        const qty = qtyForLine(ln);
        if (qty <= 0) continue;

        const product = products.find((p) => p.model === ln.modelNo);
        if (!product) continue;

        const payload = {
          modelNo: ln.modelNo,
          category: ln.category,
          subCategory: ln.subCategory,
          quantity: qty,
          price: Number(ln.price) || 0,
          salePerson: ln.salePerson,
          customerName: customer.customerName,
          barcodes: ln.scannedList || [],
          dispatchDate: new Date(),
          customerAddress: customer.customerAddress,
          mailId: customer.mailId,
          phoneNumber: customer.phoneNumber,
          storeName: customer.storeName,
          gstNo: customer.gstNo,
          customerType: customer.customerType,
        };

        await axios.post(`${API_BASE}/dispatch`, payload);

        const updatedReorder = Math.max(0, (product.reorderLevel || 0) - qty);
        const newStatus = statusForQty(updatedReorder);

        await axios.put(`${API_BASE}/products/${product._id}`, {
          reorderLevel: updatedReorder,
          stockStatus: newStatus,
        });
      }

      enqueueSnackbar('Stock outward recorded and stocks updated!', { variant: 'success' });
      localStorage.removeItem('stockOutwardDraft');
      closeDialog();
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Failed to submit stock outward', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ padding: '40px 20px' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4">Stock Outward</Typography>
        <Typography variant="body1">Scan products to remove them from inventory</Typography>
      </Box>

      <Box
        sx={{
          maxWidth: 500,
          mx: 'auto',
          bgcolor: 'white',
          borderRadius: 2,
          p: 6,
          textAlign: 'center',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            bgcolor: '#fee2e2',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <path d="M9 12l2 2 4-4" />
            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.12 0 4.04.74 5.57 1.97" />
          </svg>
        </Box>

        <Typography variant="h6">Scan Product Barcode</Typography>
        <Typography variant="body2">Use your scanner or enter barcode manually</Typography>
        <Button variant="contained" color="error" onClick={openOutwardDialog} sx={{ mt: 2 }}>
          Start Scanning
        </Button>
      </Box>

      <Dialog
        open={openDialog}
        onClose={(event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
          closeDialog();
        }}
        disableEscapeKeyDown
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Stock Outward
          <Tooltip title="Add Model">
            <IconButton color="primary" onClick={addLine}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </DialogTitle>

        <DialogContent>
          {/* Customer Details Header Section */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: 3,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}
          >
            <Typography variant="subtitle2" fontWeight={700} color="#334155" mb={1.5}>
              Customer Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6} width={{ sm: 200, md: 200 }}>
                <FormControl fullWidth error={!!errors.customer} size="small">
                  <InputLabel>Customer Name *</InputLabel>
                  <Select
                    name="customerId"
                    value={customer.id}
                    onChange={handleCustomerChange}
                    label="Customer Name *"
                    sx={{ borderRadius: 1.5, backgroundColor: '#ffffff' }}
                  >
                    {customers.map((c) => (
                      <MenuItem key={c._id} value={c._id}>
                        {c.customerName}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.customer}</FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Store Name"
                  size="small"
                  fullWidth
                  value={customer.storeName}
                  InputProps={{ readOnly: true, sx: { borderRadius: 1.5, backgroundColor: '#ffffff' } }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Phone"
                  size="small"
                  fullWidth
                  value={customer.phoneNumber}
                  InputProps={{ readOnly: true, sx: { borderRadius: 1.5, backgroundColor: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Email"
                  size="small"
                  fullWidth
                  value={customer.mailId}
                  InputProps={{ readOnly: true, sx: { borderRadius: 1.5, backgroundColor: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="GST No"
                  size="small"
                  fullWidth
                  value={customer.gstNo}
                  InputProps={{ readOnly: true, sx: { borderRadius: 1.5, backgroundColor: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3} width={{ sm: 200, md: 540 }}>
                <TextField
                  label="Customer Type"
                  size="small"
                  fullWidth
                  value={customer.customerType}
                  InputProps={{ readOnly: true, sx: { borderRadius: 1.5, backgroundColor: '#ffffff' } }}
                />
              </Grid>

              <Grid item xs={12} width={{ sm: 200, md: 540 }} >
                <TextField
                  label="Address"
                  size="small"
                  fullWidth
                  value={customer.customerAddress}
                  InputProps={{ readOnly: true, sx: { borderRadius: 1.5, backgroundColor: '#ffffff' } }}
                />
              </Grid>
            </Grid>
          </Paper>

          <Divider sx={{ my: 2.5 }} />

          {/* Model Items Section */}
          <Stack spacing={2.5}>
            {lines.map((ln, idx) => {
              const product = models.find((m) => m.model === ln.modelNo);
              const stock = product?.reorderLevel ?? 0;
              const qty = qtyForLine(ln);
              const afterStock = Math.max(0, stock - qty);
              const remaining = remainingForLine(ln);
              const cap = capForLine(ln);

              return (
                <Paper
                  key={idx}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#cbd5e1',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                    }
                  }}
                >
                  {/* Model Header */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          backgroundColor: '#eff6ff',
                          color: '#1d4ed8',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          border: '1px solid #bfdbfe'
                        }}
                      >
                        Model #{idx + 1}
                      </Box>
                      {ln.lowStockWarning && (
                        <Chip
                          label={ln.lowStockWarning}
                          color="warning"
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                        />
                      )}
                    </Stack>

                    <Tooltip title="Remove model line">
                      <span>
                        <IconButton
                          color="error"
                          onClick={() => removeLine(idx)}
                          disabled={lines.length === 1}
                          size="small"
                          sx={{
                            backgroundColor: '#fef2f2',
                            '&:hover': { backgroundColor: '#fee2e2' },
                            '&.Mui-disabled': { backgroundColor: '#f3f4f6' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>

                  {/* Primary Inputs Grid (12 Columns) */}
                  <Grid container spacing={2} alignItems="flex-start">
                    {/* Model Selection (3 cols) */}
                    <Grid item xs={12} sm={6} md={3} width={{ sm: 200, md: 200 }}>
                      <FormControl fullWidth error={!!errors[`line_${idx}_modelNo`]} size="small">
                        <InputLabel>Model No *</InputLabel>
                        <Select
                          label="Model No *"
                          value={ln.modelNo}
                          onChange={(e) => {
                            setLineValue(idx, 'modelNo', e.target.value);
                            recomputeLowStockForLine(idx, e.target.value);
                          }}
                          sx={{ borderRadius: 1.5 }}
                        >
                          {models.map((m) => (
                            <MenuItem key={m._id} value={m.model}>
                              {m.model}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>{errors[`line_${idx}_modelNo`]}</FormHelperText>
                      </FormControl>
                      <Typography variant="caption" sx={{ mt: 0.5, color: '#64748b', display: 'block', fontWeight: 500 }}>
                        Current Stock: <strong style={{ color: '#0f172a' }}>{stock}</strong>
                      </Typography>
                    </Grid>

                    {/* Category (2 cols) */}
                    <Grid item xs={12} sm={6} md={2} width={{ sm: 200, md: 200 }}>
                      <TextField
                        label="Category *"
                        size="small"
                        fullWidth
                        value={ln.category}
                        error={!!errors[`line_${idx}_category`]}
                        helperText={errors[`line_${idx}_category`]}
                        InputProps={{ readOnly: true, sx: { borderRadius: 1.5, backgroundColor: '#f8fafc' } }}
                      />
                    </Grid>

                    {/* Sub Category (2 cols) */}
                    <Grid item xs={12} sm={6} md={2} width={{ sm: 200, md: 200 }}>
                      <TextField
                        label="Sub Category *"
                        size="small"
                        fullWidth
                        value={ln.subCategory}
                        error={!!errors[`line_${idx}_subCategory`]}
                        helperText={errors[`line_${idx}_subCategory`]}
                        InputProps={{ readOnly: true, sx: { borderRadius: 1.5, backgroundColor: '#f8fafc' } }}
                      />
                    </Grid>

                    {/* Sales Person (3 cols) */}
                    <Grid item xs={12} sm={6} md={3} width={{ sm: 200, md: 200 }}>
                      <FormControl fullWidth error={!!errors[`line_${idx}_salePerson`]} size="small">
                        <InputLabel>Sales Person *</InputLabel>
                        <Select
                          label="Sales Person *"
                          value={ln.salePerson}
                          onChange={(e) => setLineValue(idx, 'salePerson', e.target.value)}
                          sx={{ borderRadius: 1.5 }}
                        >
                          {salePersons.map((p) => (
                            <MenuItem key={p._id} value={p.employeeName}>
                              {p.employeeName}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>{errors[`line_${idx}_salePerson`]}</FormHelperText>
                      </FormControl>
                    </Grid>

                    {/* Quantity (2 cols) */}
                    <Grid item xs={12} sm={6} md={2} width={{ sm: 200, md: 200 }} >
                      <TextField
                        label="Quantity *"
                        type="number"
                        size="small"
                        fullWidth
                        value={ln.quantity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setLineValue(idx, 'isQuantityManual', true);
                          setLineValue(idx, 'quantity', e.target.value);

                          setLines((prev) => {
                            const arr = [...prev];
                            const L = { ...arr[idx] };
                            const q = Number(val);

                            if (Number.isFinite(q) && q >= 0) {
                              const cur = L.scannedList || [];
                              if (cur.length > q) {
                                const kept = cur.slice(0, q);
                                const removed = cur.slice(q);

                                setGlobalScanned((prevSet) => {
                                  const ns = new Set(prevSet);
                                  removed.forEach((c) => ns.delete(c));
                                  return ns;
                                });

                                L.scannedList = kept;
                                L.scannedCodes = kept.join(', ');
                              }
                            }
                            arr[idx] = L;
                            return arr;
                          });
                        }}
                        error={!!errors[`line_${idx}_quantity`]}
                        helperText={errors[`line_${idx}_quantity`]}
                        InputProps={{ sx: { borderRadius: 1.5 } }}
                      />
                      <Typography variant="caption" sx={{ mt: 0.5, color: '#64748b', display: 'block', fontSize: '0.7rem' }}>
                        After: <strong style={{ color: '#dc2626' }}>{afterStock}</strong> {qty > 0 ? `(-${qty})` : ''}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Secondary Inputs: Price & Scanning (12 Columns) */}
                  <Box
                    sx={{
                      mt: 2.5,
                      p: 2,
                      borderRadius: 2.5,
                      backgroundColor: '#f8fafc',
                      border: '1px dashed #cbd5e1'
                    }}
                  >
                    <Grid container spacing={2} alignItems="flex-start">
                      {/* Price per Unit (3 cols) */}
                      <Grid item xs={12} md={3} width={{ sm: 200, md: 340 }}>
                        <TextField
                          label="Price per Unit *"
                          type="number"
                          size="small"
                          fullWidth
                          value={ln.price}
                          onChange={(e) => setLineValue(idx, 'price', e.target.value)}
                          error={!!errors[`line_${idx}_price`]}
                          helperText={errors[`line_${idx}_price`]}
                          InputProps={{ sx: { borderRadius: 1.5, backgroundColor: '#ffffff' } }}
                        />
                      </Grid>

                      {/* Scan Input (9 cols) */}
                      <Grid item xs={12} md={9} width={{ sm: 200, md: 340 }}>
                        <TextField
                          label="Scan Barcode / Serial No *"
                          size="small"
                          fullWidth
                          value={ln.shd}
                          onChange={(e) => setLineValue(idx, 'shd', e.target.value)}
                          onKeyDown={(e) => handleScanKeyDown(e, idx)}
                          error={!!errors[`line_${idx}_shd`]}
                          helperText={
                            errors[`line_${idx}_shd`] ||
                            (cap === Infinity
                              ? 'Scan barcode (Enter/Tab ends scan)'
                              : `Scan up to ${cap} items for this row`)
                          }
                          inputRef={(el) => (shdRefs.current[idx] = el)}
                          disabled={remaining === 0}
                          InputProps={{ sx: { borderRadius: 1.5, backgroundColor: '#ffffff' } }}
                        />
                      </Grid>

                      {/* Scanned Codes List */}
                      <Grid item xs={12} width={{ sm: 200, md: 340 }}>
                        <TextField
                          label={`Scanned Barcodes (${ln.scannedList?.length || 0} / ${cap === Infinity ? '∞' : cap})`}
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          value={ln.scannedCodes}
                          InputProps={{
                            readOnly: true,
                            sx: { borderRadius: 1.5, backgroundColor: '#ffffff', fontSize: '0.85rem' }
                          }}
                        />
                        <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                            Total scanned: <strong style={{ color: '#2563eb' }}>{ln.scannedList.length}</strong>
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {cap === Infinity ? 'No scan limit' : `Remaining scans allowed: ${remaining}`}
                          </Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              );
            })}
          </Stack>

          <Divider sx={{ my: 3 }}>Selected Products Preview</Divider>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {lines
              .filter((ln) => ln.modelNo)
              .map((ln, i) => {
                const p = models.find((x) => x.model === ln.modelNo);
                if (!p) return null;

                const current = p.reorderLevel ?? 0;
                const qty = qtyForLine(ln);
                const after = Math.max(0, current - qty);
                const statusAfter = statusForQty(after);

                return (
                  <div
                    key={`${ln.modelNo}-${i}`}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 12,
                      padding: 24,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid #f0f0f0',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 16,
                      }}
                    >
                      <div>
                        <h3 style={{ margin: 0, fontSize: 17, color: '#1a1a1a', marginBottom: 4 }}>
                          {p.brand || 'No Brand'}
                        </h3>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <div style={{ fontSize: 13, color: '#6c757d' }}>Model:</div>
                          <div style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>
                            {p.model || 'No Model'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 4 }}>Sub-Category:</div>
                          <div style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>
                            {p.subCategory || '-'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <span style={getStatusStyle(statusAfter)}>{statusAfter}</span>
                        <img
                          src={getImageUrl(p.productImage)}
                          alt="Product"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                          }}
                          style={{
                            width: 45,
                            height: 45,
                            objectFit: 'cover',
                            border: '1px solid #e9e9e9',
                            borderRadius: 4,
                            boxShadow: 'rgba(0, 0, 0, 0.16) 0px 1px 4px',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: 24 }}>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ fontSize: 13, color: '#1a1a1a', marginBottom: 4 }}>Category:</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{p.category || '-'}</div>
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', gap: 10, justifyContent: 'end' }}>
                        <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 4 }}>EmailTo:</div>
                        <div style={{ fontSize: 13, color: '#1a1a1a' }}>{p.emailTo || '-'}</div>
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 4 }}>Quantity:</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>
                          {current} → <span style={{ fontWeight: 700 }}>{after}</span> {qty > 0 ? `(-${qty})` : ''}
                        </div>
                      </div>

                      <div
                        style={{
                          textAlign: 'right',
                          display: 'flex',
                          gap: 10,
                          justifyContent: 'end',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 4 }}>Old Price:</div>
                        <div style={{ fontSize: 13, color: 'rgb(108 117 125)', textDecoration: 'line-through' }}>
                          ₹{Number(p.mrp || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 4, marginLeft: 10 }}>Price:</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#28a745' }}>
                          ₹{Number(p.dealerPrice || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
};

export default StockOutward;
