import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  Chip,
  Divider,
  Stack,
  Alert
} from '@mui/material';
import {
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  Truck,
  Inbox,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Barcode,
  FileText,
  Sparkles,
  Zap,
  Activity,
  Headphones,
  RotateCcw,
  X
} from 'lucide-react';

const API_BASE = 'http://localhost:5002/api';

export default function ServiceTracking() {
  const [searchKey, setSearchKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = () => {
    setSearchKey('');
    setTrackingResult(null);
    setErrorMsg('');
  };

  const executeTrack = async (queryValue) => {
    const q = (queryValue || searchKey).trim();
    if (!q) return;

    try {
      setLoading(true);
      setErrorMsg('');
      setTrackingResult(null);

      // 1. Search service requests first
      const res = await fetch(`${API_BASE}/service/requests?search=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const sr = data.data[0];
        let rma = null;
        if (sr.rmaId) {
          const rmaRes = await fetch(`${API_BASE}/rma/${sr.rmaId}`);
          const rmaData = await rmaRes.json();
          if (rmaData.success && rmaData.data) {
            rma = rmaData.data.rma || rmaData.data;
          }
        }
        setTrackingResult({ serviceRequest: sr, rma });
        return;
      }

      // 2. Direct RMA Search fallback
      const rmaRes = await fetch(`${API_BASE}/rma?search=${encodeURIComponent(q)}`);
      const rmaData = await rmaRes.json();
      const rmaList = rmaData.data || rmaData;
      if (Array.isArray(rmaList) && rmaList.length > 0) {
        const matchingRma = rmaList[0];
        let sr = null;
        if (matchingRma.serviceRequestId) {
          const srRes = await fetch(
            `${API_BASE}/service/requests?search=${encodeURIComponent(
              matchingRma.ticketNo || matchingRma.serviceRequestId
            )}`
          );
          const srData = await srRes.json();
          if (srData.success && Array.isArray(srData.data) && srData.data.length > 0) {
            sr = srData.data[0];
          }
        }
        if (!sr) {
          sr = {
            ticketNo: matchingRma.ticketNo || matchingRma.rmaNo,
            modelNo: matchingRma.modelNo,
            serialNumber: matchingRma.serialNumber,
            storeName: matchingRma.storeName,
            customerSnapshot: matchingRma.customerSnapshot,
            warranty: matchingRma.warranty,
            createdAt: matchingRma.createdAt,
            currentStatus: matchingRma.currentStatus
          };
        }
        setTrackingResult({ serviceRequest: sr, rma: matchingRma });
        return;
      }

      setErrorMsg(`No service record found matching "${q}". Please check your RMA No, Ticket No, Serial No, or Mobile number.`);
    } catch (err) {
      console.error('Tracking error:', err);
      setErrorMsg('Failed to fetch tracking data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = (e) => {
    if (e) e.preventDefault();
    executeTrack(searchKey);
  };

  const getTimelineSteps = (sr, rma) => {
    const status = rma?.currentStatus || sr?.currentStatus || 'SERVICE_REQUEST_CREATED';

    const steps = [
      {
        title: 'Service Request Created',
        desc: `Ticket #${sr.ticketNo} registered • From ${sr.storeName}`,
        date: sr.createdAt ? new Date(sr.createdAt).toLocaleDateString() : 'N/A',
        done: true,
        current: status === 'SERVICE_REQUEST_CREATED'
      },
      {
        title: 'Product Received & Inward',
        desc: rma ? `RMA #${rma.rmaNo} generated & check-in completed` : 'Awaiting physical product arrival',
        date: rma?.receivedAt ? new Date(rma.receivedAt).toLocaleDateString() : 'Pending',
        done: !!rma,
        current: status === 'PRODUCT_RECEIVED'
      },
      {
        title: 'Initial Inspection & Diagnosis',
        desc: rma?.diagnosis?.failureCode ? `Failure Code: ${rma.diagnosis.failureCode} (${rma.diagnosis.failureDesc})` : 'Diagnosis in progress',
        done: ['FAULT_CONFIRMED', 'NO_FAULT_FOUND', 'READY_FOR_REPAIR', 'UNDER_REPAIR', 'REPAIR_COMPLETED', 'QC_TESTING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CLOSED'].includes(status),
        current: ['FAULT_CONFIRMED', 'UNDER_DIAGNOSIS', 'WAITING_CUSTOMER_APPROVAL'].includes(status)
      },
      {
        title: 'Component Repair',
        desc: rma?.repair?.completedAt ? 'Repair completed by engineer' : 'Engineer repairing component',
        done: ['REPAIR_COMPLETED', 'QC_TESTING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CLOSED'].includes(status),
        current: ['UNDER_REPAIR', 'WAITING_SPARE', 'READY_FOR_REPAIR'].includes(status)
      },
      {
        title: 'Quality Control (QC)',
        desc: rma?.qc?.passed ? 'Passed all video, power & network tests' : 'Under QC & testing',
        done: ['READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CLOSED'].includes(status),
        current: ['REPAIR_COMPLETED', 'QC_TESTING', 'BURN_IN_TESTING'].includes(status)
      },
      {
        title: 'Dispatched / Ready for Pickup',
        desc: rma?.dispatch?.awbNumber ? `Dispatched via ${rma.dispatch.courierName} (AWB: ${rma.dispatch.awbNumber})` : 'Ready for collection',
        done: ['DISPATCHED', 'DELIVERED', 'CLOSED'].includes(status),
        current: status === 'READY_FOR_DISPATCH'
      }
    ];

    return steps;
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', boxSizing: 'border-box', px: { xs: 2, sm: 3 }, py: 3, pb: 8 }}>
      {/* Header Banner */}
      <Box sx={{ textAlign: 'center', mb: 3.5 }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.6, borderRadius: 10, backgroundColor: '#eff6ff', border: '1px solid #dbeafe', mb: 1.5 }}>
          <Sparkles size={14} color="#2563eb" />
          <Typography variant="caption" fontWeight={700} sx={{ color: '#1d4ed8', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            Live RMA & Service Tracking Portal
          </Typography>
        </Box>
        <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', letterSpacing: '-0.03em', fontSize: { xs: '26px', sm: '34px' } }}>
          COLORON Service Tracking
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b', mt: 0.8, maxWidth: '750px', mx: 'auto', fontSize: '15px' }}>
          Real-time status updates for your CCTV cameras, NVRs, DVRs, and accessories under repair or warranty service.
        </Typography>
      </Box>

      {/* Search Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3.5,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
          mb: 3.5,
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <form onSubmit={handleTrack}>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <TextField
              fullWidth
              size="medium"
              placeholder="Enter RMA Number (e.g. RMA2609010001), Ticket No (SR...), Serial Number, or Mobile..."
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={22} color="#2563eb" />
                  </InputAdornment>
                ),
                endAdornment: searchKey ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleReset} title="Clear search">
                      <X size={16} color="#64748b" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: { borderRadius: 2.5, fontSize: '15px', backgroundColor: '#f8fafc' }
              }}
              sx={{ flex: 1, minWidth: 280 }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !searchKey.trim()}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Search size={18} />}
              sx={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: 800,
                borderRadius: 2.5,
                px: 3.5,
                py: 1.5,
                textTransform: 'none',
                fontSize: '15px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)',
                '&:hover': { backgroundColor: '#1d4ed8' }
              }}
            >
              {loading ? 'Searching...' : 'Track Status'}
            </Button>
            {(searchKey || trackingResult) && (
              <Button
                type="button"
                variant="outlined"
                size="large"
                onClick={handleReset}
                startIcon={<RotateCcw size={16} />}
                sx={{
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  px: 3,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '15px',
                  backgroundColor: '#ffffff',
                  '&:hover': { backgroundColor: '#f8fafc', borderColor: '#94a3b8', color: '#0f172a' }
                }}
              >
                Reset
              </Button>
            )}
          </Box>
        </form>

        {/* Quick Search Suggestions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
            Quick Search Tips:
          </Typography>
          <Chip
            size="small"
            icon={<Barcode size={12} />}
            label="Serial Number (S/N)"
            onClick={() => { setSearchKey('COL-'); }}
            sx={{ fontSize: '11.5px', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'pointer', '&:hover': { backgroundColor: '#e2e8f0' } }}
          />
          <Chip
            size="small"
            icon={<FileText size={12} />}
            label="RMA Number (RMA...)"
            onClick={() => { setSearchKey('RMA'); }}
            sx={{ fontSize: '11.5px', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'pointer', '&:hover': { backgroundColor: '#e2e8f0' } }}
          />
          <Chip
            size="small"
            icon={<Phone size={12} />}
            label="Customer Mobile"
            onClick={() => { setSearchKey(''); }}
            sx={{ fontSize: '11.5px', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'default' }}
          />
        </Box>
      </Paper>

      {/* Error Alert */}
      {errorMsg && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleReset} sx={{ textTransform: 'none', fontWeight: 700 }}>
              Reset
            </Button>
          }
          sx={{ mb: 3.5, borderRadius: 2.5 }}
        >
          {errorMsg}
        </Alert>
      )}

      {/* Tracking Result View */}
      {trackingResult ? (
        <Stack spacing={3} sx={{ width: '100%' }}>
          {/* Summary Card */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3.5,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  SERVICE TICKET NUMBER
                </Typography>
                <Typography variant="h5" fontWeight={900} sx={{ color: '#0f172a', fontFamily: 'monospace' }}>
                  {trackingResult.serviceRequest.ticketNo}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                {trackingResult.rma && (
                  <Chip
                    icon={<Activity size={14} />}
                    label={`RMA: ${trackingResult.rma.rmaNo}`}
                    sx={{
                      fontWeight: 900,
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      py: 2,
                      px: 1.5,
                      borderRadius: 2
                    }}
                  />
                )}
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleReset}
                  startIcon={<RotateCcw size={14} />}
                  sx={{
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 2,
                    fontSize: '12px',
                    px: 1.5,
                    py: 0.6,
                    '&:hover': { backgroundColor: '#f8fafc', color: '#0f172a', borderColor: '#94a3b8' }
                  }}
                >
                  Reset / New Search
                </Button>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 2.5
              }}
            >
              <Box>
                <Typography variant="caption" color="#64748b" fontWeight={600}>Customer Name</Typography>
                <Typography variant="body1" fontWeight={700} color="#0f172a">
                  {trackingResult.serviceRequest.customerSnapshot?.name || 'Walk-in Customer'}
                </Typography>
                {trackingResult.serviceRequest.customerSnapshot?.mobile && (
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.3 }}>
                    📞 {trackingResult.serviceRequest.customerSnapshot.mobile}
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography variant="caption" color="#64748b" fontWeight={600}>Product & Serial</Typography>
                <Typography variant="body1" fontWeight={700} color="#0f172a">
                  {trackingResult.serviceRequest.modelNo}
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 700, display: 'block', mt: 0.3 }}>
                  S/N: {trackingResult.serviceRequest.serialNumber}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="#64748b" fontWeight={600}>Warranty Coverage</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    icon={trackingResult.serviceRequest.warranty?.status === 'IN_WARRANTY' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                    label={trackingResult.serviceRequest.warranty?.status === 'IN_WARRANTY' ? 'In Warranty (Free)' : 'Out of Warranty (Chargeable)'}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      backgroundColor: trackingResult.serviceRequest.warranty?.status === 'IN_WARRANTY' ? '#dcfce7' : '#fef3c7',
                      color: trackingResult.serviceRequest.warranty?.status === 'IN_WARRANTY' ? '#15803d' : '#b45309',
                      borderRadius: 1.5
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Timeline */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: 3.5,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ width: 34, height: 34, borderRadius: 2, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <Clock size={18} />
              </Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a' }}>
                Live Service & RMA Lifecycle Timeline
              </Typography>
            </Box>

            <Stack spacing={3}>
              {getTimelineSteps(trackingResult.serviceRequest, trackingResult.rma).map((step, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      backgroundColor: step.done ? '#ecfdf5' : step.current ? '#eff6ff' : '#f8fafc',
                      border: step.done ? '2px solid #059669' : step.current ? '2px solid #2563eb' : '2px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: step.done ? '#059669' : step.current ? '#2563eb' : '#94a3b8',
                      flexShrink: 0
                    }}
                  >
                    {step.done ? <CheckCircle2 size={20} /> : <Clock size={18} />}
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography variant="subtitle1" fontWeight={step.done || step.current ? 800 : 500} sx={{ color: step.done || step.current ? '#0f172a' : '#94a3b8' }}>
                        {step.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                        {step.date}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: step.done || step.current ? '#475569' : '#cbd5e1', mt: 0.3 }}>
                      {step.desc}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Stack>
      ) : (
        /* Empty / Landing Overview State - 100% Full Width Responsive CSS Grid */
        <Stack spacing={3.5} sx={{ width: '100%' }}>
          {/* 4-Step Lifecycle Workflow Showcase */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: 3.5,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 2, backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <Activity size={18} />
              </Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', fontSize: '17px' }}>
                How COLORON Service & RMA Tracking Works
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 2.5,
                width: '100%'
              }}
            >
              {[
                {
                  step: '01',
                  title: 'Request & Inward',
                  desc: 'Store generates a verified SR Ticket & receives physical hardware.',
                  icon: <Inbox size={22} color="#2563eb" />,
                  bg: '#eff6ff'
                },
                {
                  step: '02',
                  title: 'Diagnosis & Quote',
                  desc: 'Specialist technician diagnoses the fault & logs failure analysis.',
                  icon: <Wrench size={22} color="#d97706" />,
                  bg: '#fffbeb'
                },
                {
                  step: '03',
                  title: 'Repair & QC Testing',
                  desc: 'Component repair with genuine parts followed by burn-in tests.',
                  icon: <ShieldCheck size={22} color="#16a34a" />,
                  bg: '#f0fdf4'
                },
                {
                  step: '04',
                  title: 'Dispatch & Return',
                  desc: 'Quality checked unit dispatched back to your store with live AWB.',
                  icon: <Truck size={22} color="#7c3aed" />,
                  bg: '#f5f3ff'
                }
              ].map((item, i) => (
                <Box
                  key={i}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: '1px solid #f1f5f9',
                    backgroundColor: '#f8fafc',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    '&:hover': {
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ width: 42, height: 42, borderRadius: 2.5, backgroundColor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.icon}
                    </Box>
                    <Typography variant="caption" fontWeight={900} sx={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '13px' }}>
                      {item.step}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#0f172a', mb: 0.6, fontSize: '14.5px' }}>
                      {item.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.5, display: 'block', fontSize: '12px' }}>
                      {item.desc}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* 3 Core Guarantee / Feature Cards - Full Width 3 Columns */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 2.5,
              width: '100%'
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
                '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.04)', borderColor: '#cbd5e1' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={20} color="#16a34a" />
                </Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#0f172a', fontSize: '15px' }}>
                  Authentic Warranty Check
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px', lineHeight: 1.6 }}>
                Instant serial barcode validation directly verified against authorized inward & dispatch records.
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
                '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.04)', borderColor: '#cbd5e1' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={20} color="#2563eb" />
                </Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#0f172a', fontSize: '15px' }}>
                  Real-Time Milestones
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px', lineHeight: 1.6 }}>
                Receive continuous audit updates as your unit moves from diagnosis through quality control burn-in.
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
                '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.04)', borderColor: '#cbd5e1' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Headphones size={20} color="#7c3aed" />
                </Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#0f172a', fontSize: '15px' }}>
                  Dedicated Help Desk
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px', lineHeight: 1.6 }}>
                Need urgent assistance? Contact your nearest authorized COLORON service hub or store manager.
              </Typography>
            </Paper>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
