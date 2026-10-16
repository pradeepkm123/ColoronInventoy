// <<<<<<< HEAD
// =======
// // import React, { useState, useEffect } from 'react';
// // import {
// //   Box,
// //   TextField,
// //   Typography,
// //   FormControl,
// //   InputLabel,
// //   Select,
// //   MenuItem,
// //   Button,
// //   Grid,
// //   FormHelperText,
// // } from '@mui/material';
// // import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// // import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// // import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// // import axios from 'axios';
// // import {
// //   AccountCircle,
// //   Email,
// //   Phone,
// //   Home,
// //   Receipt,
// //   CalendarToday,
// //   Save,
// //   Clear,
// // } from '@mui/icons-material';

// // const SalesInvoice = () => {
// //   const [invoiceNumber, setInvoiceNumber] = useState('');
// //   const [invoiceDate, setInvoiceDate] = useState(new Date());
// //   const [customers, setCustomers] = useState([]);
// //   const [selectedCustomer, setSelectedCustomer] = useState('');
// //   const [customerDetails, setCustomerDetails] = useState({
// //     gstNo: '',
// //     address: '',
// //     email: '',
// //     phoneNo: '',
// //   });
// //   const [errors, setErrors] = useState({
// //     invoiceNumber: false,
// //     invoiceDate: false,
// //     selectedCustomer: false,
// //     gstNo: false,
// //     address: false,
// //     email: false,
// //     phoneNo: false,
// //   });
// //   const [errorMessages, setErrorMessages] = useState({
// //     invoiceNumber: '',
// //     invoiceDate: '',
// //     selectedCustomer: '',
// //     gstNo: '',
// //     address: '',
// //     email: '',
// //     phoneNo: '',
// //   });

// //   useEffect(() => {
// //     fetchCustomers();
// //   }, []);

// //   const fetchCustomers = async () => {
// //     try {
// //       const response = await axios.get('http://localhost:5002/api/customers');
// //       setCustomers(response.data);
// //     } catch (error) {
// //       console.error('Error fetching customers:', error);
// //     }
// //   };

// //   const validateFields = () => {
// //     let isValid = true;
// //     const newErrors = { ...errors };
// //     const newErrorMessages = { ...errorMessages };

// //     if (!invoiceNumber.trim()) {
// //       newErrors.invoiceNumber = true;
// //       newErrorMessages.invoiceNumber = 'Invoice number is required';
// //       isValid = false;
// //     } else {
// //       newErrors.invoiceNumber = false;
// //       newErrorMessages.invoiceNumber = '';
// //     }

// //     if (!invoiceDate) {
// //       newErrors.invoiceDate = true;
// //       newErrorMessages.invoiceDate = 'Invoice date is required';
// //       isValid = false;
// //     } else {
// //       newErrors.invoiceDate = false;
// //       newErrorMessages.invoiceDate = '';
// //     }

// //     if (!selectedCustomer) {
// //       newErrors.selectedCustomer = true;
// //       newErrorMessages.selectedCustomer = 'Customer is required';
// //       isValid = false;
// //     } else {
// //       newErrors.selectedCustomer = false;
// //       newErrorMessages.selectedCustomer = '';
// //     }

// //     if (!customerDetails.gstNo.trim()) {
// //       newErrors.gstNo = true;
// //       newErrorMessages.gstNo = 'GST number is required';
// //       isValid = false;
// //     } else {
// //       newErrors.gstNo = false;
// //       newErrorMessages.gstNo = '';
// //     }

// //     if (!customerDetails.address.trim()) {
// //       newErrors.address = true;
// //       newErrorMessages.address = 'Address is required';
// //       isValid = false;
// //     } else {
// //       newErrors.address = false;
// //       newErrorMessages.address = '';
// //     }

// //     if (!customerDetails.email.trim()) {
// //       newErrors.email = true;
// //       newErrorMessages.email = 'Email is required';
// //       isValid = false;
// //     } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email)) {
// //       newErrors.email = true;
// //       newErrorMessages.email = 'Invalid email format';
// //       isValid = false;
// //     } else {
// //       newErrors.email = false;
// //       newErrorMessages.email = '';
// //     }

// //     if (!customerDetails.phoneNo.trim()) {
// //       newErrors.phoneNo = true;
// //       newErrorMessages.phoneNo = 'Phone number is required';
// //       isValid = false;
// //     } else if (!/^[0-9]{10}$/.test(customerDetails.phoneNo)) {
// //       newErrors.phoneNo = true;
// //       newErrorMessages.phoneNo = 'Phone number must be 10 digits';
// //       isValid = false;
// //     } else {
// //       newErrors.phoneNo = false;
// //       newErrorMessages.phoneNo = '';
// //     }

// //     setErrors(newErrors);
// //     setErrorMessages(newErrorMessages);
// //     return isValid;
// //   };

// //   const handleCustomerChange = (event) => {
// //     const customerId = event.target.value;
// //     setSelectedCustomer(customerId);
// //     const customer = customers.find((c) => c._id === customerId);
// //     if (customer) {
// //       setCustomerDetails({
// //         gstNo: customer.gstNo || '',
// //         address: customer.address || '',
// //         email: customer.mailId || '',
// //         phoneNo: customer.phoneNo || '',
// //       });
// //     }
// //     setErrors({ ...errors, selectedCustomer: false });
// //     setErrorMessages({ ...errorMessages, selectedCustomer: '' });
// //   };

// //   const handleSubmit = async () => {
// //     if (!validateFields()) {
// //       return;
// //     }
// //     try {
// //       const invoiceData = {
// //         invoiceNumber,
// //         invoiceDate,
// //         customer: selectedCustomer,
// //         ...customerDetails,
// //       };
// //       await axios.post('http://localhost:5002/api/invoices', invoiceData);
// //       alert('Invoice saved successfully');
// //       handleClear();
// //     } catch (error) {
// //       console.error('Error saving invoice:', error);
// //       alert('Failed to save invoice');
// //     }
// //   };

// //   const handleClear = () => {
// //     setInvoiceNumber('');
// //     setInvoiceDate(new Date());
// //     setSelectedCustomer('');
// //     setCustomerDetails({
// //       gstNo: '',
// //       address: '',
// //       email: '',
// //       phoneNo: '',
// //     });
// //     setErrors({
// //       invoiceNumber: false,
// //       invoiceDate: false,
// //       selectedCustomer: false,
// //       gstNo: false,
// //       address: false,
// //       email: false,
// //       phoneNo: false,
// //     });
// //     setErrorMessages({
// //       invoiceNumber: '',
// //       invoiceDate: '',
// //       selectedCustomer: '',
// //       gstNo: '',
// //       address: '',
// //       email: '',
// //       phoneNo: '',
// //     });
// //   };

// //   return (
// //     <Box sx={{ padding: 3 }}>
// //       <Typography variant="h4" gutterBottom>
// //         Sales Invoice
// //       </Typography>
// //       <Typography variant="h6" gutterBottom>
// //         Billing Details
// //       </Typography>
// //       <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mb: 3, boxShadow: 3, p: 2 }}>
// //         <TextField
// //           label="Invoice Number"
// //           variant="outlined"
// //           value={invoiceNumber}
// //           onChange={(e) => {
// //             setInvoiceNumber(e.target.value);
// //             setErrors({ ...errors, invoiceNumber: false });
// //             setErrorMessages({ ...errorMessages, invoiceNumber: '' });
// //           }}
// //           sx={{ flex: 1 }}
// //           error={errors.invoiceNumber}
// //           helperText={errorMessages.invoiceNumber}
// //           InputProps={{
// //             startAdornment: <Receipt />,
// //           }}
// //           required
// //         />
// //         <LocalizationProvider dateAdapter={AdapterDateFns}>
// //           <DatePicker
// //             label="Invoice Date"
// //             value={invoiceDate}
// //             onChange={(newValue) => {
// //               setInvoiceDate(newValue);
// //               setErrors({ ...errors, invoiceDate: false });
// //               setErrorMessages({ ...errorMessages, invoiceDate: '' });
// //             }}
// //             renderInput={(params) => (
// //               <TextField
// //                 {...params}
// //                 sx={{ flex: 1 }}
// //                 error={errors.invoiceDate}
// //                 helperText={errorMessages.invoiceDate}
// //                 InputProps={{
// //                   startAdornment: <CalendarToday />,
// //                 }}
// //                 required
// //               />
// //             )}
// //           />
// //         </LocalizationProvider>
// //       </Box>
// //       <Typography variant="h6" gutterBottom>
// //         Customer Details
// //       </Typography>
// //       <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, boxShadow: 3, p: 2 }}>
// //         <Grid container spacing={2}>
// //           <Grid item xs={12}>
// //             <FormControl fullWidth error={errors.selectedCustomer}>
// //               <InputLabel id="customer-select-label">Customer Name *</InputLabel>
// //               <Select
// //                 labelId="customer-select-label"
// //                 id="customer-select"
// //                 value={selectedCustomer}
// //                 label="Customer Name *"
// //                 onChange={handleCustomerChange}
// //               >
// //                 {customers.map((customer) => (
// //                   <MenuItem key={customer._id} value={customer._id}>
// //                     {customer.customerName}
// //                   </MenuItem>
// //                 ))}
// //               </Select>
// //               {errors.selectedCustomer && (
// //                 <FormHelperText>{errorMessages.selectedCustomer}</FormHelperText>
// //               )}
// //             </FormControl>
// //           </Grid>
// //           <Grid item xs={12}>
// //             <TextField
// //               label="GST No *"
// //               variant="outlined"
// //               value={customerDetails.gstNo}
// //               onChange={(e) => {
// //                 setCustomerDetails({ ...customerDetails, gstNo: e.target.value });
// //                 setErrors({ ...errors, gstNo: false });
// //                 setErrorMessages({ ...errorMessages, gstNo: '' });
// //               }}
// //               error={errors.gstNo}
// //               helperText={errorMessages.gstNo}
// //               fullWidth
// //               InputProps={{
// //                 startAdornment: <AccountCircle />,
// //               }}
// //             />
// //           </Grid>
// //           <Grid item xs={12}>
// //             <TextField
// //               label="Customer Address *"
// //               variant="outlined"
// //               value={customerDetails.address}
// //               onChange={(e) => {
// //                 setCustomerDetails({ ...customerDetails, address: e.target.value });
// //                 setErrors({ ...errors, address: false });
// //                 setErrorMessages({ ...errorMessages, address: '' });
// //               }}
// //               error={errors.address}
// //               helperText={errorMessages.address}
// //               fullWidth
// //               InputProps={{
// //                 startAdornment: <Home />,
// //               }}
// //             />
// //           </Grid>
// //           <Grid item xs={12}>
// //             <TextField
// //               label="Mail ID *"
// //               variant="outlined"
// //               value={customerDetails.email}
// //               onChange={(e) => {
// //                 setCustomerDetails({ ...customerDetails, email: e.target.value });
// //                 setErrors({ ...errors, email: false });
// //                 setErrorMessages({ ...errorMessages, email: '' });
// //               }}
// //               error={errors.email}
// //               helperText={errorMessages.email}
// //               fullWidth
// //               InputProps={{
// //                 startAdornment: <Email />,
// //               }}
// //             />
// //           </Grid>
// //           <Grid item xs={12}>
// //             <TextField
// //               label="Phone No *"
// //               variant="outlined"
// //               value={customerDetails.phoneNo}
// //               onChange={(e) => {
// //                 setCustomerDetails({ ...customerDetails, phoneNo: e.target.value });
// //                 setErrors({ ...errors, phoneNo: false });
// //                 setErrorMessages({ ...errorMessages, phoneNo: '' });
// //               }}
// //               error={errors.phoneNo}
// //               helperText={errorMessages.phoneNo}
// //               fullWidth
// //               InputProps={{
// //                 startAdornment: <Phone />,
// //               }}
// //             />
// //           </Grid>
// //         </Grid>
// //       </Box>
// //       <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
// //         <Button variant="contained" color="primary" startIcon={<Save />} onClick={handleSubmit}>
// //           Submit
// //         </Button>
// //         <Button variant="outlined" color="primary" startIcon={<Clear />} onClick={handleClear}>
// //           Clear
// //         </Button>
// //       </Box>
// //     </Box>
// //   );
// // };

// // export default SalesInvoice;



// >>>>>>> 31d76e31ea2ed9e2fc722a7f9133118915ac4b07
// import React, { useState, useEffect } from 'react';
// import {
//   Box,
//   TextField,
//   Typography,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Button,
//   Grid,
//   FormHelperText,
// } from '@mui/material';
// import axios from 'axios';
// import {
//   AccountCircle,
//   Email,
//   Phone,
//   Home,
//   Receipt,
//   CalendarToday,
//   Save,
//   Clear,
// } from '@mui/icons-material';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// const SalesInvoice = () => {
//   const [invoiceNumber, setInvoiceNumber] = useState('');
//   const [invoiceDate, setInvoiceDate] = useState(new Date());
//   const [customers, setCustomers] = useState([]);
//   const [selectedCustomer, setSelectedCustomer] = useState('');
//   const [customerDetails, setCustomerDetails] = useState({
//     gstNo: '',
//     address: '',
//     email: '',
//     phoneNo: '',
//   });
//   const [errors, setErrors] = useState({
//     invoiceNumber: false,
//     invoiceDate: false,
//     selectedCustomer: false,
//     gstNo: false,
//     address: false,
//     email: false,
//     phoneNo: false,
//   });
//   const [errorMessages, setErrorMessages] = useState({
//     invoiceNumber: '',
//     invoiceDate: '',
//     selectedCustomer: '',
//     gstNo: '',
//     address: '',
//     email: '',
//     phoneNo: '',
//   });
//   const [modelNo, setModelNo] = useState('');
//   const [productDetails, setProductDetails] = useState(null);
//   const [models, setModels] = useState([]);

//   useEffect(() => {
//     fetchCustomers();
//     fetchModels();
//   }, []);

//   const fetchCustomers = async () => {
//     try {
//       const response = await axios.get('http://localhost:5002/api/customers');
//       setCustomers(response.data);
//     } catch (error) {
//       console.error('Error fetching customers:', error);
//     }
//   };

//   const fetchModels = async () => {
//     try {
//       const response = await axios.get('http://localhost:5002/api/products');
//       const uniqueModels = [...new Set(response.data.map(product => product.model))];
//       setModels(uniqueModels);
//     } catch (error) {
//       console.error('Error fetching models:', error);
//     }
//   };

//   const fetchProductDetails = async () => {
//     try {
//       const response = await axios.get(`http://localhost:5002/api/products/model/${modelNo}`);
//       setProductDetails(response.data);
//     } catch (error) {
//       console.error('Error fetching product details:', error);
//     }
//   };

//   const validateFields = () => {
//     let isValid = true;
//     const newErrors = { ...errors };
//     const newErrorMessages = { ...errorMessages };

//     if (!invoiceNumber.trim()) {
//       newErrors.invoiceNumber = true;
//       newErrorMessages.invoiceNumber = 'Invoice number is required';
//       isValid = false;
//     } else {
//       newErrors.invoiceNumber = false;
//       newErrorMessages.invoiceNumber = '';
//     }

//     if (!invoiceDate) {
//       newErrors.invoiceDate = true;
//       newErrorMessages.invoiceDate = 'Invoice date is required';
//       isValid = false;
//     } else {
//       newErrors.invoiceDate = false;
//       newErrorMessages.invoiceDate = '';
//     }

//     if (!selectedCustomer) {
//       newErrors.selectedCustomer = true;
//       newErrorMessages.selectedCustomer = 'Customer is required';
//       isValid = false;
//     } else {
//       newErrors.selectedCustomer = false;
//       newErrorMessages.selectedCustomer = '';
//     }

//     if (!customerDetails.gstNo.trim()) {
//       newErrors.gstNo = true;
//       newErrorMessages.gstNo = 'GST number is required';
//       isValid = false;
//     } else {
//       newErrors.gstNo = false;
//       newErrorMessages.gstNo = '';
//     }

//     if (!customerDetails.address.trim()) {
//       newErrors.address = true;
//       newErrorMessages.address = 'Address is required';
//       isValid = false;
//     } else {
//       newErrors.address = false;
//       newErrorMessages.address = '';
//     }

//     if (!customerDetails.email.trim()) {
//       newErrors.email = true;
//       newErrorMessages.email = 'Email is required';
//       isValid = false;
//     } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email)) {
//       newErrors.email = true;
//       newErrorMessages.email = 'Invalid email format';
//       isValid = false;
//     } else {
//       newErrors.email = false;
//       newErrorMessages.email = '';
//     }

//     if (!customerDetails.phoneNo.trim()) {
//       newErrors.phoneNo = true;
//       newErrorMessages.phoneNo = 'Phone number is required';
//       isValid = false;
//     } else if (!/^[0-9]{10}$/.test(customerDetails.phoneNo)) {
//       newErrors.phoneNo = true;
//       newErrorMessages.phoneNo = 'Phone number must be 10 digits';
//       isValid = false;
//     } else {
//       newErrors.phoneNo = false;
//       newErrorMessages.phoneNo = '';
//     }

//     setErrors(newErrors);
//     setErrorMessages(newErrorMessages);
//     return isValid;
//   };

//   const handleCustomerChange = (event) => {
//     const customerId = event.target.value;
//     setSelectedCustomer(customerId);
//     const customer = customers.find((c) => c._id === customerId);
//     if (customer) {
//       setCustomerDetails({
//         gstNo: customer.gstNo || '',
//         address: customer.address || '',
//         email: customer.mailId || '',
//         phoneNo: customer.phoneNo || '',
//       });
//     }
//     setErrors({ ...errors, selectedCustomer: false });
//     setErrorMessages({ ...errorMessages, selectedCustomer: '' });
//   };

//   const handleModelChange = (event) => {
//     setModelNo(event.target.value);
//   };

//   const handleFetchDetails = () => {
//     fetchProductDetails();
//   };

//   const handleSubmit = async () => {
//     if (!validateFields()) {
//       return;
//     }
//     try {
//       const invoiceData = {
//         invoiceNumber,
//         invoiceDate,
//         customer: selectedCustomer,
//         ...customerDetails,
//       };
//       await axios.post('http://localhost:5002/api/invoices', invoiceData);
//       alert('Invoice saved successfully');
//       handleClear();
//     } catch (error) {
//       console.error('Error saving invoice:', error);
//       alert('Failed to save invoice');
//     }
//   };

//   const handleClear = () => {
//     setInvoiceNumber('');
//     setInvoiceDate(new Date());
//     setSelectedCustomer('');
//     setCustomerDetails({
//       gstNo: '',
//       address: '',
//       email: '',
//       phoneNo: '',
//     });
//     setErrors({
//       invoiceNumber: false,
//       invoiceDate: false,
//       selectedCustomer: false,
//       gstNo: false,
//       address: false,
//       email: false,
//       phoneNo: false,
//     });
//     setErrorMessages({
//       invoiceNumber: '',
//       invoiceDate: '',
//       selectedCustomer: '',
//       gstNo: '',
//       address: '',
//       email: '',
//       phoneNo: '',
//     });
//   };

//   return (
//     <Box sx={{ padding: 3 }}>
//       <Typography variant="h4" gutterBottom>
//         Sales Invoice
//       </Typography>
//       <Typography variant="h6" gutterBottom>
//         Billing Details
//       </Typography>
//       <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mb: 3, boxShadow: 3, p: 2 }}>
//         <TextField
//           label="Invoice Number"
//           variant="outlined"
//           value={invoiceNumber}
//           onChange={(e) => {
//             setInvoiceNumber(e.target.value);
//             setErrors({ ...errors, invoiceNumber: false });
//             setErrorMessages({ ...errorMessages, invoiceNumber: '' });
//           }}
//           sx={{ flex: 1 }}
//           error={errors.invoiceNumber}
//           helperText={errorMessages.invoiceNumber}
//           InputProps={{
//             startAdornment: <Receipt />,
//           }}
//           required
//         />
//         <LocalizationProvider dateAdapter={AdapterDateFns}>
//           <DatePicker
//             label="Invoice Date"
//             value={invoiceDate}
//             onChange={(newValue) => {
//               setInvoiceDate(newValue);
//               setErrors({ ...errors, invoiceDate: false });
//               setErrorMessages({ ...errorMessages, invoiceDate: '' });
//             }}
//             renderInput={(params) => (
//               <TextField
//                 {...params}
//                 sx={{ flex: 1 }}
//                 error={errors.invoiceDate}
//                 helperText={errorMessages.invoiceDate}
//                 InputProps={{
//                   startAdornment: <CalendarToday />,
//                 }}
//                 required
//               />
//             )}
//           />
//         </LocalizationProvider>
//       </Box>
//       <Typography variant="h6" gutterBottom>
//         Customer Details
//       </Typography>
//       <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, boxShadow: 3, p: 2 }}>
//         <Grid container spacing={2}>
//           <Grid item xs={12}>
//             <FormControl fullWidth error={errors.selectedCustomer}>
//               <InputLabel id="customer-select-label">Customer Name *</InputLabel>
//               <Select
//                 labelId="customer-select-label"
//                 id="customer-select"
//                 value={selectedCustomer}
//                 label="Customer Name *"
//                 onChange={handleCustomerChange}
//               >
//                 {customers.map((customer) => (
//                   <MenuItem key={customer._id} value={customer._id}>
//                     {customer.customerName}
//                   </MenuItem>
//                 ))}
//               </Select>
//               {errors.selectedCustomer && (
//                 <FormHelperText>{errorMessages.selectedCustomer}</FormHelperText>
//               )}
//             </FormControl>
//           </Grid>
//           <Grid item xs={12}>
//             <TextField
//               label="GST No *"
//               variant="outlined"
//               value={customerDetails.gstNo}
//               onChange={(e) => {
//                 setCustomerDetails({ ...customerDetails, gstNo: e.target.value });
//                 setErrors({ ...errors, gstNo: false });
//                 setErrorMessages({ ...errorMessages, gstNo: '' });
//               }}
//               error={errors.gstNo}
//               helperText={errorMessages.gstNo}
//               fullWidth
//               InputProps={{
//                 startAdornment: <AccountCircle />,
//               }}
//             />
//           </Grid>
//           <Grid item xs={12}>
//             <TextField
//               label="Customer Address *"
//               variant="outlined"
//               value={customerDetails.address}
//               onChange={(e) => {
//                 setCustomerDetails({ ...customerDetails, address: e.target.value });
//                 setErrors({ ...errors, address: false });
//                 setErrorMessages({ ...errorMessages, address: '' });
//               }}
//               error={errors.address}
//               helperText={errorMessages.address}
//               fullWidth
//               InputProps={{
//                 startAdornment: <Home />,
//               }}
//             />
//           </Grid>
//           <Grid item xs={12}>
//             <TextField
//               label="Mail ID *"
//               variant="outlined"
//               value={customerDetails.email}
//               onChange={(e) => {
//                 setCustomerDetails({ ...customerDetails, email: e.target.value });
//                 setErrors({ ...errors, email: false });
//                 setErrorMessages({ ...errorMessages, email: '' });
//               }}
//               error={errors.email}
//               helperText={errorMessages.email}
//               fullWidth
//               InputProps={{
//                 startAdornment: <Email />,
//               }}
//             />
//           </Grid>
//           <Grid item xs={12}>
//             <TextField
//               label="Phone No *"
//               variant="outlined"
//               value={customerDetails.phoneNo}
//               onChange={(e) => {
//                 setCustomerDetails({ ...customerDetails, phoneNo: e.target.value });
//                 setErrors({ ...errors, phoneNo: false });
//                 setErrorMessages({ ...errorMessages, phoneNo: '' });
//               }}
//               error={errors.phoneNo}
//               helperText={errorMessages.phoneNo}
//               fullWidth
//               InputProps={{
//                 startAdornment: <Phone />,
//               }}
//             />
//           </Grid>
//         </Grid>
//       </Box>
//       <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, boxShadow: 3, p: 2, mt: 3 }}>
//         <FormControl fullWidth>
//           <InputLabel id="model-select-label">Model Number</InputLabel>
//           <Select
//             labelId="model-select-label"
//             id="model-select"
//             value={modelNo}
//             label="Model Number"
//             onChange={handleModelChange}
//           >
//             {models.map((model) => (
//               <MenuItem key={model} value={model}>
//                 {model}
//               </MenuItem>
//             ))}
//           </Select>
//         </FormControl>
//         <Button variant="contained" color="primary" onClick={handleFetchDetails}>
//           Fetch Details
//         </Button>
//         {productDetails && (
//           <Box sx={{ mt: 2 }}>
//             <Typography variant="h6" gutterBottom>
//               Product Details
//             </Typography>
//             <Typography>Brand: {productDetails.brand}</Typography>
//             <Typography>Model: {productDetails.model}</Typography>
//             <Typography>Description: {productDetails.productDescriptions}</Typography>
//             <Typography>MRP: {productDetails.mrp}</Typography>
//             <Typography>Dealer Price: {productDetails.dealerPrice}</Typography>
//             {/* Add more fields as needed */}
//           </Box>
//         )}
//       </Box>
//       <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
//         <Button variant="contained" color="primary" startIcon={<Save />} onClick={handleSubmit}>
//           Submit
//         </Button>
//         <Button variant="outlined" color="primary" startIcon={<Clear />} onClick={handleClear}>
//           Clear
//         </Button>
//       </Box>
//     </Box>
//   );
// };

// export default SalesInvoice;












import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  FormHelperText,
} from '@mui/material';
import axios from 'axios';
import {
  AccountCircle,
  Email,
  Phone,
  Home,
  Receipt,
  CalendarToday,
  Save,
  Clear,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const SalesInvoice = () => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customerDetails, setCustomerDetails] = useState({
    gstNo: '',
    address: '',
    email: '',
    phoneNo: '',
  });
  const [errors, setErrors] = useState({
    invoiceNumber: false,
    invoiceDate: false,
    selectedCustomer: false,
    gstNo: false,
    address: false,
    email: false,
    phoneNo: false,
  });
  const [errorMessages, setErrorMessages] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    selectedCustomer: '',
    gstNo: '',
    address: '',
    email: '',
    phoneNo: '',
  });
  const [modelNo, setModelNo] = useState('');
  const [productDetails, setProductDetails] = useState(null);
  const [models, setModels] = useState([]);

  useEffect(() => {
    fetchCustomers();
    fetchModels();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('http://localhost:5002/api/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await axios.get('http://localhost:5002/api/products');
      const uniqueModels = [...new Set(response.data.map(product => product.model))];
      setModels(uniqueModels);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchProductDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5002/api/products/model/${modelNo}`);
      setProductDetails(response.data);
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  };

  const validateFields = () => {
    let isValid = true;
    const newErrors = { ...errors };
    const newErrorMessages = { ...errorMessages };

    if (!invoiceNumber.trim()) {
      newErrors.invoiceNumber = true;
      newErrorMessages.invoiceNumber = 'Invoice number is required';
      isValid = false;
    } else {
      newErrors.invoiceNumber = false;
      newErrorMessages.invoiceNumber = '';
    }

    if (!invoiceDate) {
      newErrors.invoiceDate = true;
      newErrorMessages.invoiceDate = 'Invoice date is required';
      isValid = false;
    } else {
      newErrors.invoiceDate = false;
      newErrorMessages.invoiceDate = '';
    }

    if (!selectedCustomer) {
      newErrors.selectedCustomer = true;
      newErrorMessages.selectedCustomer = 'Customer is required';
      isValid = false;
    } else {
      newErrors.selectedCustomer = false;
      newErrorMessages.selectedCustomer = '';
    }

    if (!customerDetails.gstNo.trim()) {
      newErrors.gstNo = true;
      newErrorMessages.gstNo = 'GST number is required';
      isValid = false;
    } else {
      newErrors.gstNo = false;
      newErrorMessages.gstNo = '';
    }

    if (!customerDetails.address.trim()) {
      newErrors.address = true;
      newErrorMessages.address = 'Address is required';
      isValid = false;
    } else {
      newErrors.address = false;
      newErrorMessages.address = '';
    }

    if (!customerDetails.email.trim()) {
      newErrors.email = true;
      newErrorMessages.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email)) {
      newErrors.email = true;
      newErrorMessages.email = 'Invalid email format';
      isValid = false;
    } else {
      newErrors.email = false;
      newErrorMessages.email = '';
    }

    if (!customerDetails.phoneNo.trim()) {
      newErrors.phoneNo = true;
      newErrorMessages.phoneNo = 'Phone number is required';
      isValid = false;
    } else if (!/^[0-9]{10}$/.test(customerDetails.phoneNo)) {
      newErrors.phoneNo = true;
      newErrorMessages.phoneNo = 'Phone number must be 10 digits';
      isValid = false;
    } else {
      newErrors.phoneNo = false;
      newErrorMessages.phoneNo = '';
    }

    setErrors(newErrors);
    setErrorMessages(newErrorMessages);
    return isValid;
  };

  const handleCustomerChange = (event) => {
    const customerId = event.target.value;
    setSelectedCustomer(customerId);
    const customer = customers.find((c) => c._id === customerId);
    if (customer) {
      setCustomerDetails({
        gstNo: customer.gstNo || '',
        address: customer.address || '',
        email: customer.mailId || '',
        phoneNo: customer.phoneNo || '',
      });
    }
    setErrors({ ...errors, selectedCustomer: false });
    setErrorMessages({ ...errorMessages, selectedCustomer: '' });
  };

  const handleModelChange = (event) => {
    setModelNo(event.target.value);
  };

  const handleFetchDetails = () => {
    fetchProductDetails();
  };

  const handleSubmit = async () => {
    if (!validateFields()) {
      return;
    }
    try {
      const invoiceData = {
        invoiceNumber,
        invoiceDate,
        customer: selectedCustomer,
        ...customerDetails,
      };
      await axios.post('http://localhost:5002/api/invoices', invoiceData);
      alert('Invoice saved successfully');
      handleClear();
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice');
    }
  };

  const handleClear = () => {
    setInvoiceNumber('');
    setInvoiceDate(new Date());
    setSelectedCustomer('');
    setCustomerDetails({
      gstNo: '',
      address: '',
      email: '',
      phoneNo: '',
    });
    setErrors({
      invoiceNumber: false,
      invoiceDate: false,
      selectedCustomer: false,
      gstNo: false,
      address: false,
      email: false,
      phoneNo: false,
    });
    setErrorMessages({
      invoiceNumber: '',
      invoiceDate: '',
      selectedCustomer: '',
      gstNo: '',
      address: '',
      email: '',
      phoneNo: '',
    });
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sales Invoice
      </Typography>
      <Typography variant="h6" gutterBottom>
        Billing Details
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mb: 3, boxShadow: 3, p: 2 }}>
        <TextField
          label="Invoice Number"
          variant="outlined"
          value={invoiceNumber}
          onChange={(e) => {
            setInvoiceNumber(e.target.value);
            setErrors({ ...errors, invoiceNumber: false });
            setErrorMessages({ ...errorMessages, invoiceNumber: '' });
          }}
          sx={{ flex: 1 }}
          error={errors.invoiceNumber}
          helperText={errorMessages.invoiceNumber}
          InputProps={{
            startAdornment: <Receipt />,
          }}
          required
        />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Invoice Date"
            value={invoiceDate}
            onChange={(newValue) => {
              setInvoiceDate(newValue);
              setErrors({ ...errors, invoiceDate: false });
              setErrorMessages({ ...errorMessages, invoiceDate: '' });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                sx={{ flex: 1 }}
                error={errors.invoiceDate}
                helperText={errorMessages.invoiceDate}
                InputProps={{
                  startAdornment: <CalendarToday />,
                }}
                required
              />
            )}
          />
        </LocalizationProvider>
      </Box>
      <Typography variant="h6" gutterBottom>
        Customer Details
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, boxShadow: 3, p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth error={errors.selectedCustomer}>
              <InputLabel id="customer-select-label">Customer Name *</InputLabel>
              <Select
                labelId="customer-select-label"
                id="customer-select"
                value={selectedCustomer}
                label="Customer Name *"
                onChange={handleCustomerChange}
              >
                {customers.map((customer) => (
                  <MenuItem key={customer._id} value={customer._id}>
                    {customer.customerName}
                  </MenuItem>
                ))}
              </Select>
              {errors.selectedCustomer && (
                <FormHelperText>{errorMessages.selectedCustomer}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="GST No *"
              variant="outlined"
              value={customerDetails.gstNo}
              onChange={(e) => {
                setCustomerDetails({ ...customerDetails, gstNo: e.target.value });
                setErrors({ ...errors, gstNo: false });
                setErrorMessages({ ...errorMessages, gstNo: '' });
              }}
              error={errors.gstNo}
              helperText={errorMessages.gstNo}
              fullWidth
              InputProps={{
                startAdornment: <AccountCircle />,
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Customer Address *"
              variant="outlined"
              value={customerDetails.address}
              onChange={(e) => {
                setCustomerDetails({ ...customerDetails, address: e.target.value });
                setErrors({ ...errors, address: false });
                setErrorMessages({ ...errorMessages, address: '' });
              }}
              error={errors.address}
              helperText={errorMessages.address}
              fullWidth
              InputProps={{
                startAdornment: <Home />,
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Mail ID *"
              variant="outlined"
              value={customerDetails.email}
              onChange={(e) => {
                setCustomerDetails({ ...customerDetails, email: e.target.value });
                setErrors({ ...errors, email: false });
                setErrorMessages({ ...errorMessages, email: '' });
              }}
              error={errors.email}
              helperText={errorMessages.email}
              fullWidth
              InputProps={{
                startAdornment: <Email />,
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Phone No *"
              variant="outlined"
              value={customerDetails.phoneNo}
              onChange={(e) => {
                setCustomerDetails({ ...customerDetails, phoneNo: e.target.value });
                setErrors({ ...errors, phoneNo: false });
                setErrorMessages({ ...errorMessages, phoneNo: '' });
              }}
              error={errors.phoneNo}
              helperText={errorMessages.phoneNo}
              fullWidth
              InputProps={{
                startAdornment: <Phone />,
              }}
            />
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, boxShadow: 3, p: 2, mt: 3 }}>
        <FormControl fullWidth>
          <InputLabel id="model-select-label">Model Number</InputLabel>
          <Select
            labelId="model-select-label"
            id="model-select"
            value={modelNo}
            label="Model Number"
            onChange={handleModelChange}
          >
            {models.map((model) => (
              <MenuItem key={model} value={model}>
                {model}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" color="primary" onClick={handleFetchDetails}>
          Fetch Details
        </Button>
        {productDetails && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Product Details
            </Typography>
            <Typography>Brand: {productDetails.brand}</Typography>
            <Typography>Model: {productDetails.model}</Typography>
            <Typography>Description: {productDetails.productDescriptions}</Typography>
            <Typography>MRP: {productDetails.mrp}</Typography>
            <Typography>Dealer Price: {productDetails.dealerPrice}</Typography>
            {/* Add more fields as needed */}
          </Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button variant="contained" color="primary" startIcon={<Save />} onClick={handleSubmit}>
          Submit
        </Button>
        <Button variant="outlined" color="primary" startIcon={<Clear />} onClick={handleClear}>
          Clear
        </Button>
      </Box>
    </Box>
  );
};

export default SalesInvoice;
