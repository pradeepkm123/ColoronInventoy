import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  Package,
  Printer,
  Download,
  Save,
  RotateCcw,
  CheckCircle2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Sliders,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import axios from 'axios';
import JsBarcode from 'jsbarcode';
import { QRCodeSVG } from 'qrcode.react';
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import coloronLogo from '../assets/img/coloron.png';
import { COLORON_LOGO_DATA_URL } from '../assets/img/coloronBase64';

const API_BASE = 'https://coloroninventoy.onrender.com/api';
const CARTON_API = `${API_BASE}/carton-box`;
const INVENTORY_API = `${API_BASE}/inventory`;

// 1D Code128 Barcode Renderer for Carton Label
const Code128Barcode = ({ code, height = 20, width = 1.05 }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && code) {
      try {
        JsBarcode(svgRef.current, code, {
          format: 'CODE128',
          width: width,
          height: height,
          displayValue: false,
          margin: 2,
          background: '#ffffff',
          lineColor: '#000000'
        });
      } catch (err) {
        console.error('Carton barcode render error:', err);
      }
    }
  }, [code, height, width]);

  return <svg ref={svgRef} style={{ display: 'block', margin: '0 auto', maxWidth: '100%', height: 'auto' }} />;
};

// Official COLOR ON Brand Logo from Assets (coloron.png)
const ColorOnCartonLogo = () => {
  const logoSrc = COLORON_LOGO_DATA_URL || coloronLogo;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
      <img
        src={logoSrc}
        alt="Color On Logo"
        style={{
          height: '34px',
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
          imageRendering: '-webkit-optimize-contrast',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact'
        }}
      />
    </div>
  );
};



// Zebra ZD420 & Standard Carton Box Label Presets
export const CARTON_LABEL_PRESETS = {
  zebra_100x150: {
    id: 'zebra_100x150',
    name: 'Zebra ZD420 - 100mm × 150mm (4" × 6")',
    shortName: '100×150mm (4×6")',
    widthMm: 100,
    heightMm: 150,
    pageSize: '100mm 150mm'
  },
  zebra_100x125: {
    id: 'zebra_100x125',
    name: 'Zebra ZD420 - 100mm × 125mm (4" × 5")',
    shortName: '100×125mm (4×5")',
    widthMm: 100,
    heightMm: 125,
    pageSize: '100mm 125mm'
  },
  zebra_100x100: {
    id: 'zebra_100x100',
    name: 'Zebra ZD420 - 100mm × 100mm (4" × 4")',
    shortName: '100×100mm (4×4")',
    widthMm: 100,
    heightMm: 100,
    pageSize: '100mm 100mm'
  },
  zebra_100x75: {
    id: 'zebra_100x75',
    name: 'Zebra ZD420 - 100mm × 75mm (4" × 3")',
    shortName: '100×75mm (4×3")',
    widthMm: 100,
    heightMm: 75,
    pageSize: '100mm 75mm'
  },
  zebra_100x50: {
    id: 'zebra_100x50',
    name: 'Zebra ZD420 - 100mm × 50mm (4" × 2")',
    shortName: '100×50mm (4×2")',
    widthMm: 100,
    heightMm: 50,
    pageSize: '100mm 50mm'
  },
  custom: {
    id: 'custom',
    name: 'Custom Dimensions (mm)',
    shortName: 'Custom (mm)',
    widthMm: 100,
    heightMm: 150,
    pageSize: '100mm 150mm'
  }
};

// SMART HYBRID Graphic Logo (Exact Design: Stylized S Stem with Dot & Straight Typography)
const SmartHybridLogo = () => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', lineHeight: 1 }}>
    {/* Exact Stylized Curved S with Top Dot from Physical Sticker Photo */}
    <svg
      width="15"
      height="38"
      viewBox="0 0 33 166"
      fill="#000000"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <path d="M 12.0 0.5 L 17.5 0.0 L 24.5 3.0 L 28.0 7.5 L 28.0 11.5 L 29.0 12.5 L 28.0 16.5 L 24.5 20.0 L 18.5 21.0 L 15.0 23.5 L 12.0 32.5 L 12.0 37.5 L 11.0 38.5 L 11.0 56.5 L 15.0 68.5 L 15.0 71.5 L 17.0 73.5 L 18.0 78.5 L 20.0 80.5 L 29.0 99.5 L 31.0 106.5 L 31.0 110.5 L 32.0 111.5 L 33.0 122.5 L 32.0 123.5 L 31.0 137.5 L 28.0 143.5 L 28.0 145.5 L 21.0 156.5 L 11.5 166.0 L 11.0 164.5 L 17.0 152.5 L 21.0 138.5 L 21.0 119.5 L 20.0 118.5 L 20.0 113.5 L 18.0 109.5 L 17.0 103.5 L 11.0 90.5 L 9.0 88.5 L 9.0 86.5 L 7.0 84.5 L 7.0 82.5 L 3.0 74.5 L 1.0 62.5 L 0.0 61.5 L 0.0 46.5 L 1.0 45.5 L 1.0 40.5 L 4.0 31.5 L 11.0 20.5 L 10.0 18.5 L 6.0 15.5 L 5.0 6.5 L 8.5 2.0 L 12.0 0.5 Z" />
    </svg>
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1 }}>
      <span
        style={{
          fontFamily: 'Arial Black, "Arial Black", Arial, sans-serif',
          fontWeight: 900,
          fontSize: '15px',
          letterSpacing: '0.4px',
          color: '#000000',
          lineHeight: 1
        }}
      >
        MART
      </span>
      <span
        style={{
          fontFamily: 'Arial Black, "Arial Black", Arial, sans-serif',
          fontWeight: 900,
          fontSize: '11px',
          letterSpacing: '0.5px',
          color: '#000000',
          lineHeight: 1,
          marginTop: '2.5px'
        }}
      >
        HYBRID
      </span>
    </div>
  </div>
);
const DualLightLogo = () => <SmartHybridLogo />;

export default function CartonBoxView() {
  // Model & DB State
  const [modelsList, setModelsList] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingSerials, setLoadingSerials] = useState(false);

  // Available Serials from DB
  const [availableSerials, setAvailableSerials] = useState([]);
  const [totalSerialsCount, setTotalSerialsCount] = useState(0);
  const [packedSerialsCount, setPackedSerialsCount] = useState(0);
  const [existingBoxes, setExistingBoxes] = useState([]);

  // Batching: 20 S/N per Carton Box
  const [cartonQty, setCartonQty] = useState(20);
  const [activeBoxIndex, setActiveBoxIndex] = useState(0); // 0-based batch index
  const [selectedSerials, setSelectedSerials] = useState([]);
  const [cartonPreset, setCartonPreset] = useState('zebra_100x150');
  const [labelWidthMm, setLabelWidthMm] = useState(100);
  const [labelHeightMm, setLabelHeightMm] = useState(150);
  const [qrFormat, setQrFormat] = useState('newline'); // 'newline' (One by One \r\n) | 'comma'

  const handlePresetChange = (presetId) => {
    setCartonPreset(presetId);
    const p = CARTON_LABEL_PRESETS[presetId];
    if (p && p.id !== 'custom') {
      setLabelWidthMm(p.widthMm);
      setLabelHeightMm(p.heightMm);
    }
  };

  // Carton Label Specs (Auto-populated from DB, editable)
  const [cartonNo, setCartonNo] = useState('');
  const [productType, setProductType] = useState('DOME CAMERA');
  const [resolution, setResolution] = useState('4MP');
  const [lens, setLens] = useState('2.8 mm');
  const [badgeType, setBadgeType] = useState('SMART HYBRID'); // 'SMART HYBRID' | 'DUAL LIGHT'
  const [netWeight, setNetWeight] = useState('6.07 KG');
  const [grossWeight, setGrossWeight] = useState('6.82 KG');

  // Company Footer
  const [companyName, setCompanyName] = useState('Lookman Distribution Private limited');
  const [addressLine1, setAddressLine1] = useState('No.9/15, II Street Extn, III Main Road,');
  const [addressLine2, setAddressLine2] = useState('CIT Nagar, Nandanam, Chennai - 600 035.');
  const [country, setCountry] = useState('MADE IN INDIA');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const [viewBoxModal, setViewBoxModal] = useState({ open: false, box: null });

  // 1. Fetch list of models that have saved serial barcodes in DB
  const fetchModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      // Try /api/carton-box/models first, fallback to /api/inventory/carton-models
      let res;
      try {
        res = await axios.get(`${CARTON_API}/models`);
      } catch (e) {
        res = await axios.get(`${INVENTORY_API}/carton-models`);
      }

      if (res.data.success && Array.isArray(res.data.models)) {
        setModelsList(res.data.models);
        if (res.data.models.length > 0 && !selectedModel) {
          setSelectedModel(res.data.models[0].modelNo);
        }
      }
    } catch (err) {
      console.warn('Error fetching carton models:', err);
    } finally {
      setLoadingModels(false);
    }
  }, [selectedModel]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // 2. Fetch available serials and saved specifications when model changes
  const fetchModelSerials = useCallback(async (model) => {
    if (!model) return;
    setLoadingSerials(true);
    try {
      let res;
      try {
        res = await axios.get(`${CARTON_API}/available-serials?modelNo=${encodeURIComponent(model)}`);
      } catch (e) {
        res = await axios.get(`${INVENTORY_API}/carton-serials?modelNo=${encodeURIComponent(model)}`);
      }

      if (res.data.success) {
        const { specs, availableSerials: serials, totalSerials, packedCount, packedBoxes, nextCartonNo } = res.data;

        setAvailableSerials(serials || []);
        setTotalSerialsCount(totalSerials || 0);
        setPackedSerialsCount(packedCount || 0);
        setExistingBoxes(packedBoxes || []);
        setCartonNo(nextCartonNo || `CB-${model.replace(/[^a-zA-Z0-9]/g, '')}-001`);

        if (specs) {
          if (specs.productType) setProductType(specs.productType);
          if (specs.resolution) setResolution(specs.resolution);
          if (specs.lens) setLens(specs.lens);
          if (specs.badgeType) setBadgeType(specs.badgeType);
          if (specs.defaultNetWeight) setNetWeight(specs.defaultNetWeight);
          if (specs.defaultGrossWeight) setGrossWeight(specs.defaultGrossWeight);
        }

        // Initialize first batch of 20 S/Ns
        const initialBatch = (serials || []).slice(0, 20);
        setSelectedSerials(initialBatch);
        setActiveBoxIndex(0);
      }
    } catch (err) {
      console.warn('Error fetching model serials:', err);
      setToast({
        open: true,
        message: `Failed to load serials: ${err.response?.data?.message || err.message}`,
        severity: 'error'
      });
    } finally {
      setLoadingSerials(false);
    }
  }, []);

  useEffect(() => {
    if (selectedModel) {
      fetchModelSerials(selectedModel);
    }
  }, [selectedModel, fetchModelSerials]);

  // Calculate total batches (20 S/N per Carton Box)
  const totalBatches = Math.max(1, Math.ceil((availableSerials.length || 1) / cartonQty));

  // Switch to a specific 20 S/N batch
  const handleSelectBatch = (batchIdx) => {
    setActiveBoxIndex(batchIdx);
    const start = batchIdx * cartonQty;
    const end = start + cartonQty;
    const batch = availableSerials.slice(start, end);
    setSelectedSerials(batch);

    // Increment carton box number with batch
    const basePrefix = selectedModel.replace(/[^a-zA-Z0-9]/g, '');
    const boxNum = existingBoxes.length + batchIdx + 1;
    setCartonNo(`CB-${basePrefix}-${String(boxNum).padStart(3, '0')}`);
  };

  // Toggle individual serial number selection
  const handleToggleSerial = (sn) => {
    setSelectedSerials((prev) => {
      if (prev.includes(sn)) {
        return prev.filter((item) => item !== sn);
      } else {
        if (prev.length >= cartonQty) {
          setToast({
            open: true,
            message: `⚠️ Maximum ${cartonQty} S/Ns allowed per Carton Box. Remove one to add this.`,
            severity: 'warning'
          });
          return prev;
        }
        return [...prev, sn];
      }
    });
  };

  // 3. Save Carton Box to Database
  const handleSaveCarton = async () => {
    if (selectedSerials.length === 0) {
      setToast({
        open: true,
        message: '⚠️ Cannot save: Please select at least 1 serial number for this Carton Box.',
        severity: 'warning'
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        cartonNo: cartonNo.trim(),
        modelNo: selectedModel.trim(),
        productType,
        resolution,
        lens,
        badgeType,
        quantity: selectedSerials.length,
        netWeight,
        grossWeight,
        serialNumbers: selectedSerials,
        companyName,
        addressLine1,
        addressLine2,
        country
      };

      let res;
      try {
        res = await axios.post(`${CARTON_API}/create`, payload);
      } catch (e) {
        res = await axios.post(`${INVENTORY_API}/carton-create`, payload);
      }

      if (res.data.success) {
        setToast({
          open: true,
          message: `✅ Carton Box ${cartonNo} saved with ${selectedSerials.length} S/Ns!`,
          severity: 'success'
        });
        // Refresh available serials & box count
        await fetchModelSerials(selectedModel);
        await fetchModels();
      }
    } catch (err) {
      setToast({
        open: true,
        message: `Failed to save: ${err.response?.data?.message || err.message}`,
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Delete / Unpack a Carton Box
  const handleDeleteBox = async (boxId) => {
    try {
      let res;
      try {
        res = await axios.delete(`${CARTON_API}/${boxId}`);
      } catch (e) {
        res = await axios.delete(`${INVENTORY_API}/carton-delete/${boxId}`);
      }

      if (res.data.success) {
        setToast({
          open: true,
          message: '✅ Carton Box deleted and serial numbers released back to available pool!',
          severity: 'success'
        });
        await fetchModelSerials(selectedModel);
        await fetchModels();
      }
    } catch (err) {
      setToast({
        open: true,
        message: `Delete failed: ${err.response?.data?.message || err.message}`,
        severity: 'error'
      });
    }
  };

  // Current batch window (20 S/N per box)
  const currentBatchStart = activeBoxIndex * cartonQty;
  const currentBatchSerials = availableSerials.slice(currentBatchStart, currentBatchStart + cartonQty);

  // Active product serial numbers (strictly real serial numbers, NO dummy data)
  const activeSerials = selectedSerials.length > 0
    ? selectedSerials
    : currentBatchSerials;

  // Place serials one by one on separate lines using CRLF (\r\n) so barcode scanners send Enter key per S/N
  const qrString = activeSerials.length > 0
    ? (qrFormat === 'comma' ? activeSerials.join(', ') : (activeSerials.join('\r\n') + '\r\n'))
    : '';

  // Dynamic scaling calibrated to label physical height (Preserves proportions & scan quality)
  const currentHeightMm = Number(labelHeightMm) || 150;
  const dynamicQrSize = Math.max(110, Math.min(180, Math.round(currentHeightMm * 1.18)));
  const dynamicBarcodeHeight = Math.max(16, Math.min(24, Math.round(currentHeightMm * 0.15)));

  // Format Address Line 2 into clean separate lines matching Reference Photo Image 2
  const formattedAddressLines = (() => {
    if (!addressLine2) return [];
    if (addressLine2.includes('\n')) {
      return addressLine2.split('\n').map((l) => l.trim()).filter(Boolean);
    }
    if (addressLine2.includes('CIT Nagar,') && addressLine2.includes('Nandanam')) {
      const parts = addressLine2.split('Nandanam');
      return ['CIT Nagar,', `Nandanam${parts[1] || ''}`.trim()];
    }
    return [addressLine2];
  })();

  // 5. Print Carton Label (Strict Single-Sheet 100% Full Physical Size Vector Print - Zero Page Splits, Strict Portrait)
  const handlePrint = () => {
    const cardEl = document.getElementById('carton-sticker-preview');
    if (!cardEl) {
      window.print();
      return;
    }

    const widthMm = Number(labelWidthMm) || 100;
    const heightMm = Number(labelHeightMm) || 150;

    // Remove any previous print iframe to prevent memory leaks and duplicate print jobs
    const existingFrame = document.getElementById('carton-standalone-print-frame');
    if (existingFrame) {
      existingFrame.remove();
    }

    const printFrame = document.createElement('iframe');
    printFrame.id = 'carton-standalone-print-frame';
    printFrame.setAttribute('aria-hidden', 'true');
    printFrame.style.position = 'fixed';
    printFrame.style.top = '0px';
    printFrame.style.left = '-10000px';
    printFrame.style.width = `${widthMm}mm`;
    printFrame.style.height = `${heightMm}mm`;
    printFrame.style.border = 'none';
    printFrame.style.zIndex = '-9999';
    document.body.appendChild(printFrame);

    const printDoc = printFrame.contentWindow.document;
    printDoc.open();
    printDoc.write(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Carton Label - ${selectedModel || 'Box'}</title>
    <style>
      /* Strict Portrait Orientation and Exact Physical Dimensions */
      @page {
        size: portrait;
        margin: 0;
      }
      @page {
        size: ${widthMm}mm ${heightMm}mm portrait;
        margin: 0;
      }
      @page {
        size: ${widthMm}mm ${heightMm}mm;
        margin: 0;
      }
      *, *::before, *::after {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: ${widthMm}mm !important;
        height: ${heightMm}mm !important;
        max-width: ${widthMm}mm !important;
        max-height: ${heightMm}mm !important;
        min-width: ${widthMm}mm !important;
        min-height: ${heightMm}mm !important;
        overflow: hidden !important;
        background-color: #ffffff !important;
        font-family: Arial, Helvetica, sans-serif !important;
      }
      .carton-print-root {
        width: ${widthMm}mm !important;
        height: ${heightMm}mm !important;
        max-width: ${widthMm}mm !important;
        max-height: ${heightMm}mm !important;
        min-width: ${widthMm}mm !important;
        min-height: ${heightMm}mm !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        border: 2px solid #000000 !important;
        border-radius: 4px !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        overflow: hidden !important;
        background: #ffffff !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-before: avoid !important;
        page-break-after: avoid !important;
      }
      .carton-header-banner {
        background-color: #000000 !important;
        color: #ffffff !important;
        padding: 12px 10px !important;
        text-align: center !important;
        flex-shrink: 0 !important;
      }
      .carton-body-content {
        padding: 8px 14px 10px 14px !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        flex: 1 !important;
        overflow: hidden !important;
      }
      img {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        image-rendering: -webkit-optimize-contrast !important;
      }
      svg {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        shape-rendering: crispEdges !important;
      }
    </style>
  </head>
  <body>
    <div class="carton-print-root">
      ${cardEl.innerHTML}
    </div>
  </body>
</html>`);
    printDoc.close();

    let hasPrinted = false;
    const executePrint = () => {
      if (hasPrinted) return;
      hasPrinted = true;
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (err) {
        console.warn('Iframe print error, falling back to window.print():', err);
        window.print();
      }
    };

    printFrame.onload = executePrint;
    setTimeout(executePrint, 300);
  };

  // 6. Download PDF (Full Physical Size Portrait Calibration)
  const handleDownloadPDF = () => {
    const element = document.getElementById('carton-sticker-preview');
    if (!element) return;

    const widthMm = Number(labelWidthMm) || 100;
    const heightMm = Number(labelHeightMm) || 150;

    const opt = {
      margin: 0,
      filename: `ColorOn_CartonBox_${selectedModel || 'Box'}_${cartonNo}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 3.5, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: [widthMm, heightMm], orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* 100% Full Physical Size Edge-to-Edge Print Engine for Zebra ZD420 & Thermal Printers */}
      <style>
        {`
          @media print {
            @page {
              size: portrait;
              margin: 0;
            }
            @page {
              size: ${Number(labelWidthMm) || 100}mm ${Number(labelHeightMm) || 150}mm portrait;
              margin: 0;
            }
            @page {
              size: ${Number(labelWidthMm) || 100}mm ${Number(labelHeightMm) || 150}mm;
              margin: 0;
            }

            *, *::before, *::after {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              box-sizing: border-box !important;
            }

            html,
            body {
              margin: 0 !important;
              padding: 0 !important;
              width: ${Number(labelWidthMm) || 100}mm !important;
              height: ${Number(labelHeightMm) || 150}mm !important;
              max-width: ${Number(labelWidthMm) || 100}mm !important;
              max-height: ${Number(labelHeightMm) || 150}mm !important;
              min-width: ${Number(labelWidthMm) || 100}mm !important;
              min-height: ${Number(labelHeightMm) || 150}mm !important;
              background-color: #ffffff !important;
              overflow: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Hide all other UI elements during printing */
            body * {
              visibility: hidden !important;
            }

            .no-print, header, nav, aside, .MuiDrawer-root, .MuiAppBar-root, .MuiGrid-item:first-of-type {
              display: none !important;
            }

            #root, #root > div, main, .MuiBox-root, .MuiGrid-container, .MuiPaper-root {
              position: static !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }

            /* Show strictly the label print area */
            .label-print-area,
            .label-print-area * {
              visibility: visible !important;
            }

            .label-print-area {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: ${Number(labelWidthMm) || 100}mm !important;
              height: ${Number(labelHeightMm) || 150}mm !important;
              max-width: ${Number(labelWidthMm) || 100}mm !important;
              max-height: ${Number(labelHeightMm) || 150}mm !important;
              min-width: ${Number(labelWidthMm) || 100}mm !important;
              min-height: ${Number(labelHeightMm) || 150}mm !important;
              margin: 0 !important;
              padding: 0 !important;
              box-sizing: border-box !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              border: 2px solid #000000 !important;
              border-radius: 4px !important;
              box-shadow: none !important;
              background: #ffffff !important;
              overflow: hidden !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              z-index: 999999 !important;
              transform: none !important;
            }

            .label-print-area .carton-header-banner {
              background-color: #000000 !important;
              color: #ffffff !important;
              padding: 12px 10px !important;
              text-align: center !important;
              flex-shrink: 0 !important;
            }

            .label-print-area .carton-body-content {
              padding: 8px 14px 10px 14px !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              flex: 1 !important;
              overflow: hidden !important;
            }

            img {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              image-rendering: -webkit-optimize-contrast !important;
            }

            svg {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              shape-rendering: crispEdges !important;
            }
          }
        `}
      </style>

      {/* Top Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: '#0f2b48', display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Package size={28} color="#0f2b48" /> Carton Box Label Studio
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Select Model No to auto-load saved specifications &amp; available serial numbers. Packs <strong>20 S/Ns per Carton Box</strong> with 2D QR Code.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={17} />}
            onClick={() => {
              fetchModels();
              if (selectedModel) fetchModelSerials(selectedModel);
            }}
            disabled={loadingModels || loadingSerials}
            sx={{ textTransform: 'none', borderRadius: 2, color: '#0f2b48', borderColor: '#cbd5e1' }}
          >
            Refresh
          </Button>

          <Button
            variant="outlined"
            startIcon={<Save size={17} />}
            onClick={handleSaveCarton}
            disabled={isSaving || selectedSerials.length === 0}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: '#0f2b48',
              color: '#0f2b48',
              fontWeight: 700,
              px: 2,
              '&:hover': { backgroundColor: '#f1f5f9' }
            }}
          >
            {isSaving ? 'Saving...' : 'Save Carton to DB'}
          </Button>

          <Button
            variant="outlined"
            startIcon={<Download size={17} />}
            onClick={handleDownloadPDF}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: '#059669',
              color: '#059669',
              fontWeight: 700,
              px: 2,
              '&:hover': { backgroundColor: '#ecfdf5' }
            }}
          >
            Download PDF
          </Button>

          <Button
            variant="contained"
            startIcon={<Printer size={18} />}
            onClick={handlePrint}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              backgroundColor: '#0f2b48',
              fontWeight: 700,
              px: 3,
              '&:hover': { backgroundColor: '#1e3a8a' }
            }}
          >
            Print Carton Label
          </Button>
        </Box>
      </Box>

      {/* Main Grid: Left Controls & Serials (7 cols) + Right Live Preview (5 cols) */}
      <Grid container spacing={3}>
        {/* Left Column: Model Selection, 20 S/N Allocation, & Carton Parameters */}
        <Grid item xs={12} lg={7}>
          {/* Card 1: Model Selection & Statistics */}
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f2b48', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Layers size={18} color="#0f2b48" /> 1. Select Model No (Saved From Print Barcode)
            </Typography>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Select Camera Model No</InputLabel>
                  <Select
                    value={selectedModel}
                    label="Select Camera Model No"
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    {modelsList.length === 0 ? (
                      <MenuItem value="" disabled>No saved models in DB yet. Print &amp; Save a barcode first.</MenuItem>
                    ) : (
                      modelsList.map((m) => (
                        <MenuItem key={m.modelNo} value={m.modelNo}>
                          <strong>{m.modelNo}</strong> &nbsp;—&nbsp; {m.productType} ({m.resolution}, {m.lens}) &nbsp;[{m.availableSerials} Available S/Ns]
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Carton Box No"
                  size="small"
                  fullWidth
                  value={cartonNo}
                  onChange={(e) => setCartonNo(e.target.value)}
                  helperText="Unique Carton Identifier"
                />
              </Grid>
            </Grid>

            {/* Serial Inventory Status Pill */}
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: availableSerials.length > 0 ? '#f0fdf4' : '#fffbeb',
                border: availableSerials.length > 0 ? '1px solid #bbf7d0' : '1px solid #fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle2 size={18} color={availableSerials.length > 0 ? '#16a34a' : '#d97706'} />
                <Typography variant="body2" fontWeight={700} sx={{ color: availableSerials.length > 0 ? '#15803d' : '#b45309' }}>
                  Total Generated: {totalSerialsCount} S/Ns &nbsp;|&nbsp; Already Packed: {packedSerialsCount} &nbsp;|&nbsp;{' '}
                  <span style={{ textDecoration: 'underline' }}>Available for Boxing: {availableSerials.length} S/Ns</span>
                </Typography>
              </Box>

              <Chip
                label={`${existingBoxes.length} Boxes Packed`}
                size="small"
                sx={{ backgroundColor: '#0f2b48', color: '#ffffff', fontWeight: 700 }}
              />
            </Box>
          </Paper>

          {/* Card 2: 20 S/N Carton Batch Controller */}
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f2b48', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Sliders size={18} color="#0f2b48" /> 2. Carton Box S/N Allocation ({selectedSerials.length} / {cartonQty} Selected)
              </Typography>

              {/* Batch Pagination for 20 S/Ns */}
              {availableSerials.length > cartonQty && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ChevronLeft size={16} />}
                    disabled={activeBoxIndex <= 0}
                    onClick={() => handleSelectBatch(activeBoxIndex - 1)}
                    sx={{ textTransform: 'none' }}
                  >
                    Prev Box
                  </Button>

                  <Chip
                    label={`Box Batch ${activeBoxIndex + 1} of ${totalBatches}`}
                    size="small"
                    sx={{ fontWeight: 800, backgroundColor: '#dcfce7', color: '#166534' }}
                  />

                  <Button
                    size="small"
                    variant="outlined"
                    endIcon={<ChevronRight size={16} />}
                    disabled={activeBoxIndex >= totalBatches - 1}
                    onClick={() => handleSelectBatch(activeBoxIndex + 1)}
                    sx={{ textTransform: 'none' }}
                  >
                    Next Box
                  </Button>
                </Box>
              )}
            </Box>

            {/* Quick S/N Selection Chips (20 per Box) */}
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
              Click any serial number to toggle. The QR code on the carton sticker encodes all {selectedSerials.length} serial numbers.
            </Typography>

            {loadingSerials ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={28} />
              </Box>
            ) : availableSerials.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  No unpacked serial numbers available for model <strong>{selectedModel}</strong>. Go to <strong>Print Barcode</strong> to generate and save more!
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  maxHeight: 220,
                  overflowY: 'auto',
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}
              >
                {currentBatchSerials.map((sn, idx) => {
                  const globalIdx = currentBatchStart + idx + 1;
                  const isSelected = selectedSerials.includes(sn);
                  return (
                    <Chip
                      key={sn}
                      label={`#${globalIdx}: ${sn}`}
                      size="small"
                      clickable
                      onClick={() => handleToggleSerial(sn)}
                      sx={{
                        fontFamily: 'monospace',
                        fontWeight: isSelected ? 800 : 500,
                        backgroundColor: isSelected ? '#0f2b48' : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#475569',
                        border: isSelected ? '1px solid #0f2b48' : '1px solid #cbd5e1',
                        '&:hover': {
                          backgroundColor: isSelected ? '#1e3a8a' : '#e2e8f0'
                        }
                      }}
                    />
                  );
                })}
              </Box>
            )}

            {/* Range Summary */}
            {selectedSerials.length > 0 && (
              <Box sx={{ mt: 1.5, p: 1, backgroundColor: '#eff6ff', borderRadius: 1.5, border: '1px solid #bfdbfe' }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: '#1e40af', display: 'block' }}>
                  Carton Sequence ({selectedSerials.length} S/Ns): &nbsp;
                  <span style={{ fontFamily: 'monospace' }}>
                    {selectedSerials[0]} &nbsp;→&nbsp; {selectedSerials[selectedSerials.length - 1]}
                  </span>
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Card 3: Carton Physical Parameters & Weight */}
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f2b48', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Sliders size={18} color="#0f2b48" /> 3. Specifications, Weights &amp; Company Footer
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Product Type"
                  size="small"
                  fullWidth
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Resolution"
                  size="small"
                  fullWidth
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Lens Specification"
                  size="small"
                  fullWidth
                  value={lens}
                  onChange={(e) => setLens(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Badge / Feature</InputLabel>
                  <Select
                    value={badgeType}
                    label="Badge / Feature"
                    onChange={(e) => setBadgeType(e.target.value)}
                  >
                    <MenuItem value="SMART HYBRID">SMART HYBRID</MenuItem>
                    <MenuItem value="DUAL LIGHT">DUAL LIGHT</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Net Weight (N.W.)"
                  size="small"
                  fullWidth
                  value={netWeight}
                  onChange={(e) => setNetWeight(e.target.value)}
                  helperText="e.g. 6.07 KG"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Gross Weight (G.W.)"
                  size="small"
                  fullWidth
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(e.target.value)}
                  helperText="e.g. 6.82 KG"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Company Name"
                  size="small"
                  fullWidth
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Country of Origin"
                  size="small"
                  fullWidth
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Address Line 1"
                  size="small"
                  fullWidth
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Address Line 2"
                  size="small"
                  fullWidth
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Right Column: Live Carton Box Sticker Preview (Matches Reference Photo Image 2) */}
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Eye size={20} color="#0f2b48" />
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f2b48' }}>
                  Live Carton Box Sticker
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 145 }}>
                  <Select
                    value={cartonPreset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    sx={{ fontSize: '12px', height: '32px', backgroundColor: '#f8fafc' }}
                  >
                    {Object.values(CARTON_LABEL_PRESETS).map((p) => (
                      <MenuItem key={p.id} value={p.id} sx={{ fontSize: '12px' }}>
                        {p.shortName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Exact Width (mm) */}
                <TextField
                  label="Width (mm)"
                  size="small"
                  type="number"
                  value={labelWidthMm}
                  onChange={(e) => {
                    setLabelWidthMm(Number(e.target.value) || '');
                    setCartonPreset('custom');
                  }}
                  inputProps={{ min: 40, max: 250, step: 1 }}
                  sx={{
                    width: '95px',
                    '& .MuiInputBase-root': { height: '32px', fontSize: '12px', backgroundColor: '#f8fafc' },
                    '& .MuiInputLabel-root': { fontSize: '11px', top: '-3px' }
                  }}
                />

                {/* Exact Height (mm) */}
                <TextField
                  label="Height (mm)"
                  size="small"
                  type="number"
                  value={labelHeightMm}
                  onChange={(e) => {
                    setLabelHeightMm(Number(e.target.value) || '');
                    setCartonPreset('custom');
                  }}
                  inputProps={{ min: 40, max: 350, step: 1 }}
                  sx={{
                    width: '95px',
                    '& .MuiInputBase-root': { height: '32px', fontSize: '12px', backgroundColor: '#f8fafc' },
                    '& .MuiInputLabel-root': { fontSize: '11px', top: '-3px' }
                  }}
                />

                <FormControl size="small" sx={{ minWidth: 165 }}>
                  <Select
                    value={qrFormat}
                    onChange={(e) => setQrFormat(e.target.value)}
                    sx={{ fontSize: '12px', height: '32px', backgroundColor: '#f8fafc' }}
                  >
                    <MenuItem value="newline" sx={{ fontSize: '12px', fontWeight: 600 }}>
                      QR: One by One (\r\n)
                    </MenuItem>
                    <MenuItem value="comma" sx={{ fontSize: '12px' }}>
                      QR: Comma Separated (,)
                    </MenuItem>
                  </Select>
                </FormControl>

                <Chip
                  label={`QTY: ${selectedSerials.length > 0 ? selectedSerials.length : (cartonQty || 20)} PCS`}
                  size="small"
                  sx={{ fontWeight: 800, backgroundColor: '#0f2b48', color: '#ffffff' }}
                />
              </Box>
            </Box>

            {/* Informational Exact Size Guarantee Note */}
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                gap: 1.2
              }}
            >
              <CheckCircle2 size={18} color="#2563eb" style={{ flexShrink: 0 }} />
              <Typography variant="caption" sx={{ color: '#1e40af', lineHeight: 1.4 }}>
                <strong>Zebra &amp; Thermal Sticker Calibrated:</strong> Output strictly locked to <strong>Portrait {labelWidthMm || 100}mm × {labelHeightMm || 150}mm</strong> (Full Size Edge-to-Edge). In Chrome print dialog: select <em>Layout: Portrait</em>, <em>Margins: None</em>, and <em>Scale: 100%</em>.
              </Typography>
            </Box>

            {/* Container for Printable Sticker */}
            <Box sx={{ p: 2, backgroundColor: '#f1f5f9', borderRadius: 2.5, border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'center' }}>
              {/* EXACT PHYSICAL STICKER RECREATION (Reference Photo Image 2) */}
              <div
                id="carton-sticker-preview"
                className="print-label label-print-area"
                style={{
                  width: '100%',
                  maxWidth: '360px',
                  aspectRatio: `${Number(labelWidthMm) || 100} / ${Number(labelHeightMm) || 150}`,
                  backgroundColor: '#ffffff',
                  border: '2px solid #000000',
                  borderRadius: '4px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {/* 1. Top Header Black Banner with Bold White Model Number */}
                <div
                  className="carton-header-banner"
                  style={{
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    padding: '12px 10px',
                    textAlign: 'center',
                    borderTopLeftRadius: '2px',
                    borderTopRightRadius: '2px'
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Arial Black, Arial, sans-serif',
                      fontWeight: 900,
                      fontSize: '24px',
                      letterSpacing: '0.6px',
                      display: 'block',
                      lineHeight: 1.1,
                      textTransform: 'uppercase',
                      color: '#ffffff'
                    }}
                  >
                    {selectedModel || 'CO-I-4DFDML(V)'}
                  </span>
                </div>

                {/* 2. Sticker Content Body (Full 100% Vertical Spread) */}
                <div
                  className="carton-body-content"
                  style={{
                    padding: '10px 14px 12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    flex: 1,
                    gap: '6px'
                  }}
                >
                  {/* Row 1: COLOR ON Logo (Left) | SMART HYBRID Graphic Logo (Right) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <ColorOnCartonLogo />
                    <SmartHybridLogo />
                  </div>

                  {/* Row 2: Product Type (e.g. DOME CAMERA / IP BULLET CAMERA) */}
                  <div>
                    <span
                      style={{
                        fontFamily: 'Arial Black, Arial, sans-serif',
                        fontWeight: 900,
                        fontSize: '16px',
                        color: '#000000',
                        display: 'block',
                        textTransform: 'uppercase',
                        letterSpacing: '0.2px',
                        lineHeight: 1.1
                      }}
                    >
                      {productType}
                    </span>
                  </div>

                  {/* Row 3: Resolution (Left) | Net Weight (Right) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontFamily: 'Arial Black, Arial, sans-serif',
                        fontWeight: 900,
                        fontSize: '16.5px',
                        color: '#000000',
                        lineHeight: 1
                      }}
                    >
                      {resolution}
                    </span>
                    <span
                      style={{
                        fontFamily: 'Arial Black, Arial, sans-serif',
                        fontWeight: 900,
                        fontSize: '14px',
                        color: '#000000',
                        textAlign: 'right',
                        lineHeight: 1
                      }}
                    >
                      N.W: {netWeight}
                    </span>
                  </div>

                  {/* Row 4: Lens (Left) | Gross Weight (Right) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontFamily: 'Arial Black, Arial, sans-serif',
                        fontWeight: 900,
                        fontSize: '16.5px',
                        color: '#000000',
                        lineHeight: 1
                      }}
                    >
                      {lens}
                    </span>
                    <span
                      style={{
                        fontFamily: 'Arial Black, Arial, sans-serif',
                        fontWeight: 900,
                        fontSize: '14px',
                        color: '#000000',
                        textAlign: 'right',
                        lineHeight: 1
                      }}
                    >
                      G.W.: {grossWeight}
                    </span>
                  </div>

                  {/* Row 5: 1D Barcode (Code128 - Encodes Quantity as per QTY) */}
                  <div style={{ margin: '1px 0', display: 'flex', justifyContent: 'flex-start' }}>
                    <Code128Barcode
                      code={String(selectedSerials.length > 0 ? selectedSerials.length : (cartonQty || 20))}
                      height={dynamicBarcodeHeight}
                      width={1.6}
                    />
                  </div>

                  {/* Row 6: QTY: 20 PCS */}
                  <div>
                    <span
                      style={{
                        fontFamily: 'Arial Black, Arial, sans-serif',
                        fontWeight: 900,
                        fontSize: '16px',
                        color: '#000000',
                        display: 'block',
                        letterSpacing: '0.3px',
                        lineHeight: 1.1
                      }}
                    >
                      QTY: {selectedSerials.length > 0 ? selectedSerials.length : (cartonQty || 20)} PCS
                    </span>
                  </div>

                  {/* Row 7: S/N: */}
                  <div>
                    <span
                      style={{
                        fontFamily: 'Arial Black, Arial, sans-serif',
                        fontWeight: 900,
                        fontSize: '15px',
                        color: '#000000',
                        display: 'block',
                        lineHeight: 1
                      }}
                    >
                      S/N:
                    </span>
                  </div>

                  {/* Row 8: 2D QR Code containing all 20 serial numbers (Full Sized) */}
                  <div style={{ marginTop: '1px', marginBottom: '1px' }}>
                    <div
                      style={{
                        display: 'inline-block',
                        backgroundColor: '#ffffff',
                        padding: '3px',
                        border: '1.5px solid #000000',
                        borderRadius: '4px'
                      }}
                    >
                      {qrString ? (
                        <QRCodeSVG
                          value={qrString}
                          size={dynamicQrSize}
                          level="L"
                          includeMargin={false}
                        />
                      ) : (
                        <div
                          style={{
                            width: dynamicQrSize,
                            height: dynamicQrSize,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            padding: '10px'
                          }}
                        >
                          NO S/N ALLOCATED
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 9: Bottom Footer Address Block - Full Font Weight & Width Matching Image 2 */}
                  <div style={{ marginTop: '4px', lineHeight: 1.25, width: '100%' }}>
                    <span
                      style={{
                        fontFamily: 'Arial Black, "Arial Black", Arial, sans-serif',
                        fontWeight: 900,
                        fontSize: '16.5px',
                        color: '#000000',
                        display: 'block',
                        letterSpacing: '0.6px',
                        width: '100%',
                        textTransform: 'uppercase'
                      }}
                    >
                      {country}
                    </span>
                    <span
                      style={{
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: 600,
                        fontSize: '14.5px',
                        color: '#000000',
                        display: 'block',
                        marginTop: '2px',
                        letterSpacing: '0.1px',
                        width: '100%'
                      }}
                    >
                      {companyName}
                    </span>
                    <span
                      style={{
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: 550,
                        fontSize: '14px',
                        color: '#000000',
                        display: 'block',
                        marginTop: '1px',
                        letterSpacing: '0.1px',
                        width: '100%'
                      }}
                    >
                      {addressLine1}
                    </span>
                    {formattedAddressLines.map((line, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontFamily: 'Arial, sans-serif',
                          fontWeight: 550,
                          fontSize: '14px',
                          color: '#000000',
                          display: 'block',
                          letterSpacing: '0.1px',
                          width: '100%',
                          marginTop: idx > 0 ? '1px' : '0px'
                        }}
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* History of Created Carton Boxes Table */}
      <Paper sx={{ mt: 3, p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f2b48', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Package size={18} color="#0f2b48" /> Previously Packed Carton Boxes ({existingBoxes.length})
        </Typography>

        {existingBoxes.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#94a3b8', py: 2 }}>
            No carton boxes packed for model <strong>{selectedModel}</strong> yet. Select 20 serial numbers above and click <strong>"Save Carton to DB"</strong>!
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Carton Box No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Model No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Quantity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Weights (N.W. / G.W.)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Serial Numbers Range</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Packed Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {existingBoxes.map((box) => (
                  <TableRow key={box._id} hover>
                    <TableCell>
                      <strong>{box.cartonNo}</strong>
                    </TableCell>
                    <TableCell>{box.modelNo}</TableCell>
                    <TableCell>
                      <Chip label={`${box.quantity || box.serialNumbers?.length} PCS`} size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>{box.netWeight} / {box.grossWeight}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '11px' }}>
                      {box.serialNumbers && box.serialNumbers.length > 0 ? (
                        <>
                          {box.serialNumbers[0]} &nbsp;→&nbsp; {box.serialNumbers[box.serialNumbers.length - 1]}
                        </>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>{new Date(box.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View All 20 S/Ns">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => setViewBoxModal({ open: true, box })}
                        >
                          <Eye size={16} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete & Release S/Ns">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteBox(box._id)}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Modal: View All 20 S/Ns for a specific Carton Box */}
      <Dialog
        open={viewBoxModal.open}
        onClose={() => setViewBoxModal({ open: false, box: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f2b48' }}>
          Carton Box: {viewBoxModal.box?.cartonNo} ({viewBoxModal.box?.serialNumbers?.length || 0} S/Ns)
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
            Model: <strong>{viewBoxModal.box?.modelNo}</strong> &nbsp;|&nbsp; Specs: {viewBoxModal.box?.productType} ({viewBoxModal.box?.resolution}, {viewBoxModal.box?.lens})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {(viewBoxModal.box?.serialNumbers || []).map((sn, idx) => (
              <Chip
                key={sn}
                label={`#${idx + 1}: ${sn}`}
                size="small"
                sx={{ fontFamily: 'monospace', fontWeight: 600 }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewBoxModal({ open: false, box: null })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
