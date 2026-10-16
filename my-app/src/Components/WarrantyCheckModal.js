import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Divider,
  Chip,
  Tooltip,
  Fade
} from '@mui/material';
import {
  Scan,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Search,
  Clock,
  Calendar,
  User,
  FileText,
  MapPin,
  History,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  ArrowLeft,
  Truck,
  Store,
  ShoppingBag,
  Package,
  Layers,
  RefreshCw
} from 'lucide-react';
import client from '../api/client';

const WarrantyCheckModal = ({ open, onClose }) => {
  const [step, setStep] = useState('scan'); // 'scan', 'loading', 'result', 'history'
  const [barcode, setBarcode] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus the input field when modal opens to be immediately ready for barcode scanner
  useEffect(() => {
    if (open && step === 'scan') {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 120);
      return () => clearTimeout(timer);
    } else if (!open) {
      setStep('scan');
      setBarcode('');
      setResult(null);
      setCopied(false);
    }
  }, [open, step]);

  const handleScanSubmit = async (e) => {
    if (e) e.preventDefault();
    const query = barcode.trim();
    if (!query) return;

    setStep('loading');

    try {
      // Direct API call
      const response = await client.get(`/warranty/check/${encodeURIComponent(query)}`);
      setResult(response.data);
      setStep('result');
    } catch (error) {
      console.warn("Direct GET check failed, attempting POST fallback...", error);
      try {
        const fallbackRes = await client.post(`/warranty/check`, { barcode: query });
        setResult(fallbackRes.data);
        setStep('result');
      } catch (err2) {
        console.error("Warranty check failed:", err2);
        setResult({
          success: false,
          found: false,
          serialNumber: query,
          message: 'Serial Number Not Found. This Serial Number does not exist in Inventory.'
        });
        setStep('result');
      }
    }
  };

  const handleScanAgain = () => {
    setBarcode('');
    setResult(null);
    setCopied(false);
    setStep('scan');
  };

  const handleCopySN = (sn) => {
    if (!sn) return;
    navigator.clipboard.writeText(sn);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Status color helper
  const getStatusChip = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'REPLACEMENT_DISPATCHED' || s === 'ACTIVE_WITH_CUSTOMER') {
      return <Chip label="REPLACEMENT DISPATCHED" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: '11px' }} />;
    }
    if (s === 'RESERVED_FOR_RMA') {
      return <Chip label="RESERVED FOR RMA" size="small" sx={{ bgcolor: '#f3e8ff', color: '#7e22ce', fontWeight: 800, fontSize: '11px' }} />;
    }
    if (s === 'REPLACED') {
      return <Chip label="PRODUCT REPLACED" size="small" sx={{ bgcolor: '#ffedd5', color: '#c2410c', fontWeight: 800, fontSize: '11px' }} />;
    }
    if (s === 'SOLD') {
      return <Chip label="SOLD" size="small" sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 700, fontSize: '11px' }} />;
    }
    if (s === 'IN_STOCK') {
      return <Chip label="IN STOCK" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700, fontSize: '11px' }} />;
    }
    if (s === 'DISPATCHED') {
      return <Chip label="DISPATCHED" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700, fontSize: '11px' }} />;
    }
    if (s === 'STORE_RECEIVED') {
      return <Chip label="STORE RECEIVED" size="small" sx={{ bgcolor: '#e0e7ff', color: '#3730a3', fontWeight: 700, fontSize: '11px' }} />;
    }
    return <Chip label={s || 'UNKNOWN'} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: '11px' }} />;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={step === 'history' ? 'md' : 'sm'} 
      fullWidth 
      PaperProps={{ 
        sx: { 
          borderRadius: 3.5,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        } 
      }}
    >
      {/* Header */}
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 2.5, 
          pb: 2,
          borderBottom: '1px solid #f1f5f9',
          bgcolor: '#fafcff'
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          {step === 'history' ? (
            <Button
              size="small"
              onClick={() => setStep('result')}
              startIcon={<ArrowLeft size={16} />}
              sx={{ textTransform: 'none', color: '#0f2b48', fontWeight: 600, pl: 0 }}
            >
              Back to Summary
            </Button>
          ) : step === 'result' ? (
            <Button
              size="small"
              onClick={handleScanAgain}
              startIcon={<ArrowLeft size={16} />}
              sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600, pl: 0 }}
            >
              Scan Again
            </Button>
          ) : (
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#e0f2fe', color: '#0284c7', display: 'flex' }}>
              <Scan size={20} />
            </Box>
          )}
          
          <Typography variant="h6" fontWeight={700} color="#0f2b48" fontSize="17px">
            {step === 'history' ? 'Serial Number History & Journey' : step === 'result' ? 'Warranty Details' : 'Warranty Check'}
          </Typography>
        </Box>

        <IconButton onClick={onClose} size="small" sx={{ color: '#94a3b8', '&:hover': { bgcolor: '#f1f5f9', color: '#334155' } }}>
          <X size={19} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* STEP 1: SCAN SCREEN */}
        {step === 'scan' && (
          <Box sx={{ p: 4, pt: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <Box 
              sx={{ 
                width: 110, 
                height: 110, 
                borderRadius: '24px', 
                border: '2px dashed #93c5fd', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mb: 3,
                backgroundColor: '#eff6ff',
                position: 'relative',
                boxShadow: '0 8px 24px -4px rgba(59, 130, 246, 0.15)'
              }}
            >
              <Scan size={44} color="#2563eb" />
            </Box>
            
            <Typography variant="h6" fontWeight={700} color="#0f2b48" mb={0.5}>
              Scan Barcode / Serial Number
            </Typography>
            <Typography variant="body2" color="#64748b" mb={3.5} maxWidth={320}>
              Place barcode inside scanning area or type the Serial Number below.
            </Typography>

            <Box component="form" onSubmit={handleScanSubmit} sx={{ width: '100%', maxWidth: '380px' }}>
              <TextField
                fullWidth
                inputRef={inputRef}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Barcode or Serial No"
                variant="outlined"
                size="small"
                autoComplete="off"
                InputProps={{
                  startAdornment: <Search size={18} color="#94a3b8" style={{ marginRight: 8, flexShrink: 0 }} />,
                  sx: { 
                    borderRadius: 2.5,
                    bgcolor: '#fff',
                    fontSize: '14px',
                    fontWeight: 500
                  }
                }}
              />
              <Button 
                fullWidth 
                type="submit" 
                variant="contained" 
                disabled={!barcode.trim()}
                sx={{ 
                  mt: 2, 
                  backgroundColor: '#0f2b48', 
                  '&:hover': { backgroundColor: '#1e3a8a' },
                  borderRadius: 2.5,
                  py: 1.2,
                  fontWeight: 600,
                  fontSize: '14px',
                  textTransform: 'none',
                  boxShadow: '0 4px 14px 0 rgba(15, 43, 72, 0.25)'
                }}
              >
                SCAN
              </Button>
            </Box>
          </Box>
        )}

        {/* STEP 2: LOADING SCREEN */}
        {step === 'loading' && (
          <Box sx={{ p: 7, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <CircularProgress size={44} sx={{ color: '#0f2b48', mb: 3 }} thickness={4} />
            <Typography variant="subtitle1" fontWeight={700} color="#1e293b" mb={0.5}>
              Verifying Serial Number
            </Typography>
            <Typography variant="body2" color="#64748b">
              Searching serialized inventory, sales records & warranty lifecycle...
            </Typography>
          </Box>
        )}

        {/* STEP 3: RESULT SCREEN */}
        {step === 'result' && result && (
          <Box sx={{ p: 3 }}>
            {!result.found ? (
              // ⚠️ NOT INWARDED / NOT FOUND STATE
              <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                <Box 
                  sx={{ 
                    width: 76, 
                    height: 76, 
                    borderRadius: '50%', 
                    bgcolor: '#fffbeb', 
                    border: '2px solid #fde68a',
                    color: '#d97706', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    mx: 'auto', 
                    mb: 2.5,
                    boxShadow: '0 8px 20px -4px rgba(217, 119, 6, 0.15)'
                  }}
                >
                  <AlertTriangle size={40} />
                </Box>
                <Typography variant="h6" fontWeight={800} color="#b45309" mb={1} letterSpacing="-0.01em">
                  Inward that S/N First
                </Typography>
                <Typography variant="body2" color="#64748b" mb={2} maxWidth={400} mx="auto" lineHeight={1.5}>
                  {result.message || 'This Serial Number has not been inwarded in Inventory. Please inward this S/N first.'}
                </Typography>

                {result.product && (result.product.modelNo || result.product.name) && (
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={`Model: ${result.product.modelNo || result.product.name}`} 
                      size="small" 
                      sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: '12px' }} 
                    />
                  </Box>
                )}

                <Typography variant="caption" sx={{ display: 'inline-block', bgcolor: '#f1f5f9', px: 2, py: 0.8, borderRadius: 2, color: '#334155', fontWeight: 700, mb: 4, border: '1px solid #e2e8f0' }}>
                  Scanned S/N: {result.serialNumber || barcode}
                </Typography>
                
                <Box display="flex" justifyContent="center" gap={2}>
                  <Button 
                    variant="contained" 
                    onClick={handleScanAgain} 
                    sx={{ 
                      borderRadius: 2, 
                      px: 3.5, 
                      py: 1, 
                      bgcolor: '#0f2b48', 
                      '&:hover': { bgcolor: '#1e3a8a' },
                      textTransform: 'none',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(15, 43, 72, 0.2)'
                    }}
                  >
                    Scan Again
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={onClose} 
                    sx={{ 
                      borderRadius: 2, 
                      px: 3.5, 
                      py: 1, 
                      borderColor: '#cbd5e1', 
                      color: '#475569',
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Close
                  </Button>
                </Box>
              </Box>
            ) : (
              // ✅ FOUND STATE
              <Fade in timeout={300}>
                <Box>
                  {/* Status Banner for RMA Replacement Unit */}
                  {result.isReplacementUnit && (
                    <Box 
                      sx={{ 
                        backgroundColor: '#f0fdf4', 
                        border: '1.5px solid #86efac', 
                        borderRadius: 2.5, 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        mb: 2.5,
                        boxShadow: '0 2px 8px rgba(34, 197, 94, 0.08)'
                      }}
                    >
                      <Box sx={{ p: 1.2, bgcolor: '#dcfce7', borderRadius: '50%', color: '#15803d', display: 'flex' }}>
                        <RefreshCw size={26} />
                      </Box>
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" fontWeight={800} color="#15803d" letterSpacing={0.5}>
                            🔄 RMA REPLACEMENT UNIT
                          </Typography>
                          <Chip 
                            label={result.currentStatus === 'REPLACEMENT_DISPATCHED' ? 'ACTIVE WITH CUSTOMER' : 'RESERVED FOR RMA'} 
                            size="small" 
                            sx={{ bgcolor: '#16a34a', color: '#fff', fontWeight: 800, fontSize: '10px', height: 20 }} 
                          />
                        </Box>
                        <Typography variant="body2" color="#166534" fontWeight={500}>
                          This product was issued as a warranty replacement against RMA #{result.replacementDetails?.rmaNumber || 'RMA'}.
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Status Banner for Defective Product Replaced */}
                  {result.isOriginalReplaced && (
                    <Box 
                      sx={{ 
                        backgroundColor: '#fff7ed', 
                        border: '1.5px solid #fdba74', 
                        borderRadius: 2.5, 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        mb: 2.5,
                        boxShadow: '0 2px 8px rgba(234, 88, 12, 0.08)'
                      }}
                    >
                      <Box sx={{ p: 1.2, bgcolor: '#ffedd5', borderRadius: '50%', color: '#c2410c', display: 'flex' }}>
                        <ShieldAlert size={26} />
                      </Box>
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" fontWeight={800} color="#c2410c" letterSpacing={0.5}>
                            🔁 DEFECTIVE UNIT REPLACED
                          </Typography>
                          <Chip label="REPLACED" size="small" sx={{ bgcolor: '#ea580c', color: '#fff', fontWeight: 800, fontSize: '10px', height: 20 }} />
                        </Box>
                        <Typography variant="body2" color="#9a3412" fontWeight={500}>
                          This defective product was replaced under warranty against RMA #{result.replacementDetails?.rmaNumber}. Replacement S/N: <strong>{result.replacementDetails?.replacedBySerialNumber}</strong>
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Normal Status Banners */}
                  {!result.isReplacementUnit && !result.isOriginalReplaced && result.warrantyStatus === 'IN_WARRANTY' && (
                    <Box 
                      sx={{ 
                        backgroundColor: '#f0fdf4', 
                        border: '1px solid #86efac', 
                        borderRadius: 2.5, 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        mb: 2.5,
                        boxShadow: '0 2px 8px rgba(34, 197, 94, 0.08)'
                      }}
                    >
                      <Box sx={{ p: 1, bgcolor: '#dcfce7', borderRadius: '50%', color: '#15803d', display: 'flex' }}>
                        <ShieldCheck size={28} />
                      </Box>
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" fontWeight={800} color="#15803d" letterSpacing={0.5}>
                            🟢 IN WARRANTY
                          </Typography>
                          <Chip label="ACTIVE" size="small" sx={{ bgcolor: '#22c55e', color: '#fff', fontWeight: 700, fontSize: '10px', height: 20 }} />
                        </Box>
                        <Typography variant="body2" color="#166534" fontWeight={500}>
                          Product is currently under active customer warranty coverage.
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {!result.isReplacementUnit && !result.isOriginalReplaced && result.warrantyStatus === 'EXPIRED' && (
                    <Box 
                      sx={{ 
                        backgroundColor: '#fef2f2', 
                        border: '1px solid #fca5a5', 
                        borderRadius: 2.5, 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        mb: 2.5,
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.08)'
                      }}
                    >
                      <Box sx={{ p: 1, bgcolor: '#fee2e2', borderRadius: '50%', color: '#b91c1c', display: 'flex' }}>
                        <ShieldAlert size={28} />
                      </Box>
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" fontWeight={800} color="#b91c1c" letterSpacing={0.5}>
                            🔴 WARRANTY EXPIRED
                          </Typography>
                          <Chip label="EXPIRED" size="small" sx={{ bgcolor: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '10px', height: 20 }} />
                        </Box>
                        <Typography variant="body2" color="#991b1b" fontWeight={500}>
                          Standard customer warranty period has elapsed. Eligible for paid service.
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {!result.isReplacementUnit && !result.isOriginalReplaced && result.warrantyStatus === 'NOT_STARTED' && (
                    <Box 
                      sx={{ 
                        backgroundColor: '#f8fafc', 
                        border: '1px solid #cbd5e1', 
                        borderRadius: 2.5, 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        mb: 2.5 
                      }}
                    >
                      <Box sx={{ p: 1, bgcolor: '#e2e8f0', borderRadius: '50%', color: '#475569', display: 'flex' }}>
                        <Package size={28} />
                      </Box>
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" fontWeight={800} color="#334155" letterSpacing={0.5}>
                            ⚪ {result.currentStatus === 'DISPATCHED' 
                              ? 'DISPATCHED (WARRANTY NOT STARTED)' 
                              : result.currentStatus === 'STORE_RECEIVED' 
                              ? 'STORE RECEIVED (WARRANTY NOT STARTED)' 
                              : 'IN STOCK (WARRANTY NOT STARTED)'}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="#64748b" fontWeight={500}>
                          {result.currentStatus === 'DISPATCHED' || result.currentStatus === 'STORE_RECEIVED'
                            ? 'Product is dispatched to warehouse/store. Customer warranty starts on customer sale.'
                            : 'Product is in inventory. Customer warranty starts on customer sale.'}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {!result.isReplacementUnit && !result.isOriginalReplaced && (result.warrantyStatus === 'INFO_NOT_AVAILABLE' || result.warrantyStatus === 'NOT_INWARDED') && (
                    <Box 
                      sx={{ 
                        backgroundColor: '#fffbeb', 
                        border: '1px solid #fde68a', 
                        borderRadius: 2.5, 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        mb: 2.5 
                      }}
                    >
                      <Box sx={{ p: 1, bgcolor: '#fef3c7', borderRadius: '50%', color: '#b45309', display: 'flex' }}>
                        <AlertTriangle size={28} />
                      </Box>
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight={800} color="#b45309">
                          ⚠️ INWARD THAT S/N FIRST
                        </Typography>
                        <Typography variant="body2" color="#92400e">
                          {result.message || 'This Serial Number has not been inwarded into Inventory. Please Inward this S/N first.'}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Serial Number & Product Header Card */}
                  <Box sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2.5, p: 2.5, mb: 2.5 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="caption" fontWeight={700} color="#64748b" letterSpacing={0.5} textTransform="uppercase">
                          Serial Number
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} mt={0.3}>
                          <Typography variant="h6" fontWeight={800} color="#0f2b48" fontSize="16px">
                            {result.serialNumber || result.barcode}
                          </Typography>
                          <Tooltip title={copied ? "Copied!" : "Copy Serial Number"}>
                            <IconButton size="small" onClick={() => handleCopySN(result.serialNumber || result.barcode)} sx={{ p: 0.5 }}>
                              {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} color="#64748b" />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      <Box textAlign="right">
                        <Typography variant="caption" fontWeight={700} color="#64748b" display="block" mb={0.5} textTransform="uppercase">
                          Current Status
                        </Typography>
                        {getStatusChip(result.currentStatus || 'IN_STOCK')}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5, borderColor: '#e2e8f0' }} />

                    {/* Metadata Grid */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.8 }}>
                      <Box>
                        <Typography variant="caption" color="#94a3b8" display="block">Product</Typography>
                        <Typography variant="body2" fontWeight={700} color="#1e293b">
                          {result.product?.name || 'N/A'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="#94a3b8" display="block">Model</Typography>
                        <Typography variant="body2" fontWeight={700} color="#1e293b">
                          {result.product?.modelNo || 'N/A'}
                        </Typography>
                      </Box>

                      {result.customer?.name && result.customer?.name !== 'N/A' && (
                        <>
                          <Box>
                            <Typography variant="caption" color="#94a3b8" display="block">Customer</Typography>
                            <Typography variant="body2" fontWeight={700} color="#1e293b">
                              {result.customer?.name}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="#94a3b8" display="block">Invoice Ref</Typography>
                            <Typography variant="body2" fontWeight={700} color="#1e293b">
                              {result.customer?.invoiceNo || 'N/A'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="#94a3b8" display="block">Sale Date</Typography>
                            <Typography variant="body2" fontWeight={700} color="#1e293b">
                              {result.customer?.saleDate || 'N/A'}
                            </Typography>
                          </Box>
                        </>
                      )}

                      <Box>
                        <Typography variant="caption" color="#94a3b8" display="block">Inward Warehouse</Typography>
                        <Typography variant="body2" fontWeight={700} color="#1e293b">
                          {result.inward?.location || 'Main Warehouse'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Section: RMA Replacement Details (When Unit is an RMA Replacement) */}
                  {result.isReplacementUnit && result.replacementDetails && (
                    <Box sx={{ bgcolor: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 2.5, p: 2.5, mb: 2.5 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Typography variant="caption" fontWeight={800} color="#15803d" textTransform="uppercase" letterSpacing={0.5}>
                          🔄 RMA Replacement Details
                        </Typography>
                        <Chip label="2% Spares Replacement" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: '10px' }} />
                      </Box>

                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                        <Box>
                          <Typography variant="caption" color="#64748b" display="block">RMA Number</Typography>
                          <Typography variant="body2" fontWeight={800} color="#0f2b48">
                            {result.replacementDetails.rmaNumber}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="#64748b" display="block">Replaced Original S/N</Typography>
                          <Typography variant="body2" fontWeight={800} color="#dc2626">
                            {result.replacementDetails.originalSerialNumber}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="#64748b" display="block">Customer Name</Typography>
                          <Typography variant="body2" fontWeight={700} color="#1e293b">
                            {result.replacementDetails.customerName}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="#64748b" display="block">Originating Store</Typography>
                          <Typography variant="body2" fontWeight={700} color="#1e293b">
                            {result.replacementDetails.storeName}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="#64748b" display="block">QC Status</Typography>
                          <Typography variant="body2" fontWeight={800} color="#16a34a">
                            ✓ {result.replacementDetails.qcStatus || 'PASSED'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="#64748b" display="block">Replacement Date</Typography>
                          <Typography variant="body2" fontWeight={700} color="#1e293b">
                            {result.replacementDetails.replacementDate}
                          </Typography>
                        </Box>
                        <Box sx={{ gridColumn: 'span 2' }}>
                          <Typography variant="caption" color="#64748b" display="block">Replacement Source</Typography>
                          <Typography variant="body2" fontWeight={700} color="#0284c7">
                            {result.replacementDetails.replacementSource}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}

                  {/* Section: Replaced Original Unit Details */}
                  {result.isOriginalReplaced && result.replacementDetails && (
                    <Box sx={{ bgcolor: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 2.5, p: 2.5, mb: 2.5 }}>
                      <Typography variant="caption" fontWeight={800} color="#c2410c" textTransform="uppercase" letterSpacing={0.5} display="block" mb={1.5}>
                        🔁 Replacement Linkage
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                        <Box>
                          <Typography variant="caption" color="#64748b" display="block">RMA Number</Typography>
                          <Typography variant="body2" fontWeight={800} color="#0f2b48">
                            {result.replacementDetails.rmaNumber}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="#64748b" display="block">Replacement Unit Issued</Typography>
                          <Typography variant="body2" fontWeight={800} color="#15803d">
                            {result.replacementDetails.replacedBySerialNumber}
                          </Typography>
                        </Box>
                        <Box sx={{ gridColumn: 'span 2' }}>
                          <Typography variant="caption" color="#64748b" display="block">Replacement Date</Typography>
                          <Typography variant="body2" fontWeight={700} color="#1e293b">
                            {result.replacementDetails.replacementDate}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}

                  {/* Warranty Calculation Summary Card */}
                  {result.warranty && (
                    <Box 
                      sx={{ 
                        bgcolor: (result.isReplacementUnit || result.warrantyStatus === 'IN_WARRANTY') ? '#f0fdf4' : result.warrantyStatus === 'EXPIRED' ? '#fef2f2' : '#f8fafc',
                        border: `1px solid ${(result.isReplacementUnit || result.warrantyStatus === 'IN_WARRANTY') ? '#bbf7d0' : result.warrantyStatus === 'EXPIRED' ? '#fecaca' : '#e2e8f0'}`,
                        borderRadius: 2.5, 
                        p: 2.5, 
                        mb: 3 
                      }}
                    >
                      <Typography variant="caption" fontWeight={700} color={(result.isReplacementUnit || result.warrantyStatus === 'IN_WARRANTY') ? '#15803d' : result.warrantyStatus === 'EXPIRED' ? '#b91c1c' : '#475569'} textTransform="uppercase" letterSpacing={0.5}>
                        {result.isReplacementUnit ? 'Customer Warranty Summary (Inherited)' : result.warranty.type === 'CUSTOMER' ? 'Customer Warranty Summary' : 'Supplier Warranty Summary'}
                      </Typography>

                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1.5, mb: 1.5 }}>
                        <Box>
                          <Typography variant="caption" color="#64748b" display="block">Warranty Start</Typography>
                          <Typography variant="body2" fontWeight={700} color="#1e293b">
                            {result.warranty.startDate || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="#64748b" display="block">Warranty Expiry</Typography>
                          <Typography variant="body2" fontWeight={700} color="#1e293b">
                            {result.warranty.endDate || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 1.5, borderColor: (result.isReplacementUnit || result.warrantyStatus === 'IN_WARRANTY') ? '#bbf7d0' : result.warrantyStatus === 'EXPIRED' ? '#fecaca' : '#e2e8f0' }} />

                      {result.isReplacementUnit ? (
                        <Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                            <Typography variant="caption" fontWeight={600} color="#475569">
                              Customer Warranty:
                            </Typography>
                            <Typography variant="caption" fontWeight={800} color="#15803d">
                              🟢 ACTIVE ({result.warranty.remainingFormatted || 'Active'} remaining)
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="#166534" display="block" sx={{ fontStyle: 'italic', mb: 1 }}>
                            ↳ Inherited from original defective unit (S/N: {result.replacementDetails?.originalSerialNumber})
                          </Typography>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" fontWeight={600} color="#475569">
                              Supplier Warranty:
                            </Typography>
                            <Typography variant="caption" fontWeight={700} color="#15803d">
                              🟢 ACTIVE ({result.supplierWarranty?.remainingFormatted || 'Active'} remaining)
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <>
                          {result.warrantyStatus === 'IN_WARRANTY' && (
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle2" fontWeight={600} color="#166534">
                                Remaining Warranty:
                              </Typography>
                              <Typography variant="subtitle1" fontWeight={800} color="#15803d">
                                {result.warranty.remainingFormatted || 'Active'}
                              </Typography>
                            </Box>
                          )}

                          {result.warrantyStatus === 'EXPIRED' && (
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle2" fontWeight={600} color="#991b1b">
                                Expired Since:
                              </Typography>
                              <Typography variant="subtitle1" fontWeight={800} color="#b91c1c">
                                {result.warranty.expiredSinceFormatted || 'Expired'}
                              </Typography>
                            </Box>
                          )}

                          {result.warrantyStatus === 'NOT_STARTED' && (
                            <Box>
                              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                <Typography variant="caption" fontWeight={600} color="#475569">
                                  Supplier Warranty:
                                </Typography>
                                <Typography variant="caption" fontWeight={700} color="#15803d">
                                  🟢 ACTIVE ({result.supplierWarranty?.remainingFormatted || 'Active'} remaining)
                                </Typography>
                              </Box>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="caption" fontWeight={600} color="#475569">
                                  Customer Warranty:
                                </Typography>
                                <Typography variant="caption" fontWeight={700} color="#64748b">
                                  ⚪ NOT STARTED (Begins on sale)
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </>
                      )}
                    </Box>
                  )}

                  {/* Actions */}
                  <Box display="flex" gap={2}>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      onClick={() => setStep('history')}
                      startIcon={<History size={18} />}
                      sx={{ 
                        backgroundColor: '#0f2b48', 
                        '&:hover': { backgroundColor: '#1e3a8a' }, 
                        borderRadius: 2, 
                        py: 1.2, 
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: '14px',
                        boxShadow: '0 4px 12px rgba(15, 43, 72, 0.2)'
                      }}
                    >
                      View Full History
                    </Button>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      onClick={handleScanAgain}
                      startIcon={<Scan size={18} />}
                      sx={{ 
                        borderRadius: 2, 
                        py: 1.2, 
                        fontWeight: 700, 
                        color: '#475569',
                        borderColor: '#cbd5e1',
                        textTransform: 'none',
                        fontSize: '14px'
                      }}
                    >
                      Scan Another
                    </Button>
                  </Box>
                </Box>
              </Fade>
            )}
          </Box>
        )}

        {/* STEP 4: FULL HISTORY & TIMELINE VIEW */}
        {step === 'history' && result && (
          <Fade in timeout={300}>
            <Box sx={{ p: 3, pt: 2 }}>
              {/* S/N Summary Header in History View */}
              <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2.5, mb: 3, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="#64748b" fontWeight={700} textTransform="uppercase">
                    Lifecycle Journey for
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={800} color="#0f2b48">
                    {result.serialNumber || result.barcode}
                  </Typography>
                  <Typography variant="caption" color="#475569">
                    {result.product?.name} • {result.product?.modelNo}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  {getStatusChip(result.currentStatus || 'IN_STOCK')}
                </Box>
              </Box>

              {/* Timeline Items */}
              <Box sx={{ position: 'relative', px: 1, py: 1 }}>
                {result.timeline && result.timeline.length > 0 ? (
                  result.timeline.map((item, idx) => {
                    const isLast = idx === result.timeline.length - 1;
                    const isExpired = item.status === 'expired';
                    const isActive = item.status === 'active' || item.type === 'warranty_start';

                    return (
                      <Box key={idx} sx={{ display: 'flex', gap: 2.5, mb: isLast ? 0 : 0.5 }}>
                        {/* Timeline Left Column (Icon + Vertical Connecting Line) */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 36 }}>
                          {/* Circle Icon */}
                          <Box 
                            sx={{ 
                              width: 36, 
                              height: 36, 
                              borderRadius: '50%', 
                              bgcolor: isExpired ? '#fef2f2' : isActive ? '#f0fdf4' : '#eff6ff', 
                              border: `2px solid ${isExpired ? '#ef4444' : isActive ? '#22c55e' : '#3b82f6'}`,
                              color: isExpired ? '#ef4444' : isActive ? '#16a34a' : '#2563eb',
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                              zIndex: 1,
                            }}
                          >
                            {item.type === 'inward' && <Package size={17} />}
                            {item.type === 'dispatch' && <Truck size={17} />}
                            {item.type === 'store_inward' && <Store size={17} />}
                            {item.type === 'sale' && <ShoppingBag size={17} />}
                            {item.type === 'warranty_start' && <ShieldCheck size={17} />}
                            {item.type === 'warranty_expiry' && (isExpired ? <ShieldAlert size={17} /> : <ShieldCheck size={17} />)}
                            {!['inward', 'dispatch', 'store_inward', 'sale', 'warranty_start', 'warranty_expiry'].includes(item.type) && <CheckCircle2 size={17} />}
                          </Box>

                          {/* Vertical Connecting Line */}
                          {!isLast && (
                            <Box 
                              sx={{ 
                                width: 2, 
                                flex: 1, 
                                minHeight: 24, 
                                bgcolor: isExpired ? '#fca5a5' : isActive ? '#86efac' : '#bfdbfe',
                                my: 0.5
                              }} 
                            />
                          )}
                        </Box>

                        {/* Content Card */}
                        <Box 
                          sx={{ 
                            flex: 1, 
                            bgcolor: isExpired ? '#fff5f5' : isActive ? '#f8fdf9' : '#ffffff',
                            border: `1px solid ${isExpired ? '#fed7d7' : isActive ? '#c6f6d5' : '#e2e8f0'}`,
                            borderRadius: 2.5, 
                            p: 2,
                            mb: isLast ? 0 : 2,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                            <Typography variant="subtitle2" fontWeight={800} color="#0f2b48">
                              {item.title}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={0.5} sx={{ bgcolor: '#f1f5f9', px: 1, py: 0.3, borderRadius: 1 }}>
                              <Calendar size={12} color="#64748b" />
                              <Typography variant="caption" fontWeight={700} color="#475569">
                                {item.date || 'N/A'}
                              </Typography>
                            </Box>
                          </Box>

                          <Typography variant="body2" fontWeight={600} color="#334155">
                            {item.details}
                          </Typography>

                          {item.subDetails && (
                            <Typography variant="caption" color="#64748b" display="block" mt={0.3}>
                              {item.subDetails}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })
                ) : (
                  <Typography variant="body2" color="#64748b" textAlign="center" py={3}>
                    No timeline history recorded for this item yet.
                  </Typography>
                )}
              </Box>

              {/* Bottom Actions */}
              <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                <Button 
                  variant="outlined" 
                  onClick={handleScanAgain}
                  startIcon={<Scan size={16} />}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: '#475569', borderColor: '#cbd5e1' }}
                >
                  Scan Another S/N
                </Button>
                <Button 
                  variant="contained" 
                  onClick={onClose}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, bgcolor: '#0f2b48', '&:hover': { bgcolor: '#1e3a8a' } }}
                >
                  Close
                </Button>
              </Box>
            </Box>
          </Fade>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WarrantyCheckModal;
