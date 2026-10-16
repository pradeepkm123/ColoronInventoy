import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Divider,
  Grid,
} from '@mui/material';
import { Print, FileCopy } from '@mui/icons-material';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import Logo from '../assets/img/Lookman.png';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const convertToIndianCurrencyWords = (amount) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  const convertLessThanOneThousand = (number) => {
    let word = '';
    if (number % 100 < 10) {
      word = ones[number % 10];
      number = Math.floor(number / 10);
    } else if (number % 100 < 20) {
      word = teens[number % 10];
      number = Math.floor(number / 10);
    } else {
      word = ones[number % 10];
      number = Math.floor(number / 10);
      word = tens[number % 10] + ' ' + word;
      number = Math.floor(number / 10);
    }
    if (number === 0) return word.trim();
    return (ones[number] + ' Hundred ' + word).trim();
  };

  const convert = (number) => {
    if (number === 0) return 'Zero';
    let word = '';
    if (number >= 10000000) {
      word += convertLessThanOneThousand(Math.floor(number / 10000000)) + ' Crore ';
      number %= 10000000;
    }
    if (number >= 100000) {
      word += convertLessThanOneThousand(Math.floor(number / 100000)) + ' Lakh ';
      number %= 100000;
    }
    if (number >= 1000) {
      word += convertLessThanOneThousand(Math.floor(number / 1000)) + ' Thousand ';
      number %= 1000;
    }
    if (number > 0) {
      word += convertLessThanOneThousand(number);
    }
    return word.trim();
  };

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let amountInWords = convert(rupees) + ' Rupees';
  if (paise > 0) amountInWords += ' and ' + convert(paise) + ' Paise';
  return amountInWords;
};

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoiceRef = useRef(null);

  const [dispatch, setDispatch] = useState(null);
  const [warehouseDetails, setWarehouseDetails] = useState({
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    contactPerson: '',
    email: '',
    phoneNo: '',
  });

  useEffect(() => {
    const fetchWarehouseDetails = async () => {
      try {
        const res = await axios.get('http://localhost:5002/api/warehouses');
        if (Array.isArray(res.data) && res.data.length > 0) {
          const w = res.data[0];
          setWarehouseDetails({
            address: w.address || '',
            city: w.city || '',
            state: w.state || '',
            country: w.country || '',
            zipCode: w.zipCode || '',
            contactPerson: w.contactPerson || '',
            email: w.email || '',
            phoneNo: w.phoneNo || '',
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    const fetchDispatch = async () => {
      try {
        const res = await axios.get(`http://localhost:5002/api/dispatch/${id}`);
        setDispatch(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchWarehouseDetails();
    fetchDispatch();
  }, [id]);

  const handleDownload = () => {
    if (!invoiceRef.current) return;
    html2pdf().from(invoiceRef.current).save(`Invoice_${id}.pdf`);
  };

  const handlePrint = () => {
    if (!invoiceRef.current) return;
    const printContent = invoiceRef.current.innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const subtotal = useMemo(() => {
    if (!dispatch) return 0;
    const qty = Number(dispatch.quantity || 0);
    const price = Number(dispatch.price || 0);
    return qty * price;
  }, [dispatch]);

  if (!dispatch) return <Typography sx={{ p: 4 }}>Loading...</Typography>;

  return (
    <Box sx={{ p: 4, backgroundColor: '#f9f9f9' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>Invoice Details</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/');
            }
          }}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.85rem',
            color: '#1e3a8a',
            bgcolor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            px: 2,
            py: 0.6,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            '&:hover': { bgcolor: '#dbeafe', borderColor: '#93c5fd' },
          }}
        >
          Back
        </Button>
      </Box>

      <Box ref={invoiceRef} sx={{ backgroundColor: '#fff', p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
          <Box>
            <img src={Logo} alt="Logo" height={70} />
            <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 700 }}>
              Warehouse / Seller Details
            </Typography>

            {/* ✅ warehouseDetails USED HERE (fixes no-unused-vars) */}
            <Typography variant="body2">
              {warehouseDetails.address}
              {(warehouseDetails.city || warehouseDetails.state || warehouseDetails.zipCode) ? ',' : ''}
              {' '}
              {warehouseDetails.city}
              {warehouseDetails.state ? `, ${warehouseDetails.state}` : ''}
              {warehouseDetails.zipCode ? ` - ${warehouseDetails.zipCode}` : ''}
              {warehouseDetails.country ? `, ${warehouseDetails.country}` : ''}
            </Typography>

            {warehouseDetails.contactPerson && (
              <Typography variant="body2">Contact: {warehouseDetails.contactPerson}</Typography>
            )}
            {warehouseDetails.phoneNo && (
              <Typography variant="body2">Phone: {warehouseDetails.phoneNo}</Typography>
            )}
            {warehouseDetails.email && (
              <Typography variant="body2">Email: {warehouseDetails.email}</Typography>
            )}
          </Box>

          <Box textAlign="right">
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Invoice ID
            </Typography>
            <Typography variant="body2">{id}</Typography>

            <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 700 }}>
              Date
            </Typography>
            <Typography variant="body2">
              {dispatch.createdAt ? new Date(dispatch.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 700 }}>
              Customer Name
            </Typography>
            <Typography variant="body2">
              {dispatch.customerName || dispatch.customer || '-'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Optional: Customer / Receiver details if available */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Dispatch Details
            </Typography>
            <Typography variant="body2">Model: {dispatch.modelNo}</Typography>
            <Typography variant="body2">Quantity: {dispatch.quantity}</Typography>
            <Typography variant="body2">Price: ₹{dispatch.price}</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Additional Info
            </Typography>
            <Typography variant="body2">Store: {dispatch.storeName || '-'}</Typography>
            <Typography variant="body2">Sales Person: {dispatch.salePerson || '-'}</Typography>
          </Grid>
        </Grid>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Model</TableCell>
              <TableCell>Qty</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Barcodes</TableCell>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            <TableRow>
              <TableCell>{dispatch.modelNo}</TableCell>
              <TableCell>{dispatch.quantity}</TableCell>
              <TableCell>₹{dispatch.price}</TableCell>
              <TableCell>
                {Array.isArray(dispatch.barcodes) ? dispatch.barcodes.join(', ') : dispatch.barcodes || '-'}
              </TableCell>
              <TableCell>₹{subtotal}</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2} flexWrap="wrap">
          <Typography variant="body2">
            Amount in Words: ({convertToIndianCurrencyWords(subtotal)}) Only
          </Typography>

          <Box textAlign="right">
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Subtotal
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              ₹{subtotal}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box mt={2} textAlign="center">
        <Button startIcon={<Print />} onClick={handlePrint} sx={{ mr: 2 }}>
          Print
        </Button>
        <Button startIcon={<FileCopy />} onClick={handleDownload}>
          Download
        </Button>
      </Box>
    </Box>
  );
};

export default InvoiceDetails;
