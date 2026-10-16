import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Chip,
  InputAdornment,
  Alert,
  Snackbar,
  Tooltip,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Printer,
  Barcode as BarcodeIcon,
  Search,
  RefreshCw,
  Eye,
  Sliders,
  Download,
  AlertTriangle,
  Package,
  Layers,
  ChevronLeft,
  ChevronRight,
  Database,
  Tag,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import JsBarcode from 'jsbarcode';
import coloronLogo from '../assets/img/coloron.png';
import { COLORON_LOGO_DATA_URL } from '../assets/img/coloronBase64';

const API_BASE = 'https://coloroninventoy.onrender.com/api';
const CARTON_API = `${API_BASE}/carton-box`;
const BATCH_SIZE = 100;

// Zebra ZD420 Standard Product Label Presets (50mm × 25mm is the Default Camera Sticker)
export const LABEL_PRESETS = {
  zebra_50x25: {
    id: 'zebra_50x25',
    name: 'Zebra ZD420 - 50mm × 25mm (1.97" × 0.98") [Exact Camera Sticker - Default]',
    shortName: 'ZD420 50×25mm (1.97"×0.98")',
    widthMm: 50,
    heightMm: 25,
    isRoll: true,
    columns: 1,
    pageSize: '50mm 25mm',
    orientation: 'portrait',
    aspectRatio: '52 / 21'
  },
  zebra_100x50: {
    id: 'zebra_100x50',
    name: 'Zebra ZD420 - 100mm × 50mm (4" × 2") Roll [Standard Product Label]',
    shortName: 'ZD420 100×50mm',
    widthMm: 100,
    heightMm: 50,
    isRoll: true,
    columns: 1,
    pageSize: '100mm 50mm landscape',
    orientation: 'landscape'
  },
  zebra_100x60: {
    id: 'zebra_100x60',
    name: 'Zebra ZD420 - 100mm × 60mm (4" × 2.4") Roll [Camera Box Label]',
    shortName: 'ZD420 100×60mm',
    widthMm: 100,
    heightMm: 60,
    isRoll: true,
    columns: 1,
    pageSize: '100mm 60mm landscape',
    orientation: 'landscape'
  },
  zebra_100x75: {
    id: 'zebra_100x75',
    name: 'Zebra ZD420 - 100mm × 75mm (4" × 3") Roll [Large Label]',
    shortName: 'ZD420 100×75mm',
    widthMm: 100,
    heightMm: 75,
    isRoll: true,
    columns: 1,
    pageSize: '100mm 75mm landscape',
    orientation: 'landscape'
  }
};

// Exact Official Vector SVG Certification Logos: CE and FC
const CeFcLogos = ({ height = 15 }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', lineHeight: 1 }}>
    {/* Official CE Mark */}
    <svg
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      stroke="#000000"
      strokeWidth="11"
      strokeLinecap="butt"
      strokeLinejoin="miter"
      style={{ display: 'block', height: `${height}px`, width: 'auto' }}
    >
      <path d="M 46 12 A 38 38 0 1 0 46 88" />
      <path d="M 88 12 A 38 38 0 1 0 88 88" />
      <path d="M 50 50 L 78 50" />
    </svg>

    {/* Official Bold FC Mark from Camera Label */}
    <svg
      height={height}
      viewBox="0 0 85 100"
      fill="#000000"
      style={{ display: 'block', height: `${height}px`, width: 'auto' }}
    >
      {/* Letter F */}
      <path d="M 6 12 L 38 12 L 38 23 L 18 23 L 18 43 L 34 43 L 34 54 L 18 54 L 18 88 L 6 88 Z" />
      {/* Letter C */}
      <path d="M 82 28 L 71 36 C 66 29 60 25 52 25 C 39 25 31 35 31 50 C 31 65 39 75 52 75 C 60 75 66 71 71 64 L 82 72 C 75 83 65 89 52 89 C 31 89 17 73 17 50 C 17 27 31 11 52 11 C 65 11 75 17 82 28 Z" transform="translate(6, 0)" />
    </svg>
  </div>
);

// SMART HYBRID Graphic Logo (Exact Physical Sticker Design: Stylized S Stem with Dot & Straight Typography)
const SmartHybridLogo = ({ height = 26 }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', lineHeight: 1 }}>
    {/* Exact Stylized Curved S with Top Dot from Physical Sticker Photo */}
    <svg
      width={Math.round(height * (14 / 38))}
      height={height}
      viewBox="0 0 34 167"
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
          fontSize: `${Math.max(9, Math.round(height * 0.42))}px`,
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
          fontSize: `${Math.max(7, Math.round(height * 0.31))}px`,
          letterSpacing: '0.5px',
          color: '#000000',
          lineHeight: 1,
          marginTop: '2px'
        }}
      >
        HYBRID
      </span>
    </div>
  </div>
);

// DUAL LIGHT Badge Graphic
const DualLightBadge = ({ height = 18, colorMode = 'full_color' }) => {
  const isColor = colorMode === 'full_color';
  const primaryColor = isColor ? '#16a34a' : '#000000';

  return (
    <svg
      height={height}
      viewBox="0 0 112 32"
      style={{ display: 'inline-block', verticalAlign: 'middle', height: `${height}px` }}
    >
      <rect
        x="1"
        y="1"
        width="110"
        height="30"
        rx="15"
        fill="#ffffff"
        stroke={primaryColor}
        strokeWidth="2"
      />
      <path
        d="M 16 1 A 15 15 0 0 0 1 16 A 15 15 0 0 0 16 31 L 56 31 L 56 1 Z"
        fill={primaryColor}
      />
      <line x1="56" y1="1" x2="56" y2="31" stroke={primaryColor} strokeWidth="1.5" />
      <text
        x="28"
        y="21"
        fill="#ffffff"
        fontSize="12.5"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        textAnchor="middle"
        letterSpacing="0.8"
      >
        DUAL
      </text>
      <text
        x="84"
        y="21"
        fill={isColor ? primaryColor : '#000000'}
        fontSize="12.5"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        textAnchor="middle"
        letterSpacing="0.8"
      >
        LIGHT
      </text>
    </svg>
  );
};

// JsBarcode Code 128 Renderer
const Code128Svg = ({ code, width = 1.15, height = 24 }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && code) {
      try {
        JsBarcode(svgRef.current, code, {
          format: "CODE128B",
          width: width,
          height: height,
          displayValue: false,
          margin: 0,
          background: "#ffffff",
          lineColor: "#000000"
        });
      } catch (err) {
        console.error("JsBarcode render error:", err);
      }
    }
  }, [code, width, height]);

  return <svg ref={svgRef} style={{ display: 'block', margin: '0 auto', maxWidth: '100%', height: `${height}px` }}></svg>;
};

// ColorOn Brand Logo Component
const ColorOnBrandLogo = ({ height = 18, colorMode = 'mono_300dpi' }) => {
  const logoSrc = COLORON_LOGO_DATA_URL || coloronLogo;

  if (colorMode === 'mono_300dpi') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
        <img
          src={logoSrc}
          alt="Coloron Logo"
          style={{
            height: `${height}px`,
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
            filter: 'grayscale(100%) contrast(500%) brightness(0)',
            imageRendering: '-webkit-optimize-contrast',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact'
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
      <img
        src={logoSrc}
        alt="Coloron Logo"
        style={{
          height: `${height}px`,
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

export default function ProductLabelView() {
  // Only Models Saved from Print Barcode Page
  const [printBarcodeModels, setPrintBarcodeModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingSerials, setLoadingSerials] = useState(false);

  // Exact Data & Serials Loaded from Print Barcode Page
  const [allPrintBarcodeSerials, setAllPrintBarcodeSerials] = useState([]);
  const [availablePrintBarcodeSerials, setAvailablePrintBarcodeSerials] = useState([]);
  const [selectedSerials, setSelectedSerials] = useState([]);
  const [serialFilter, setSerialFilter] = useState('available'); // 'available' | 'all'
  const [serialSearchQuery, setSerialSearchQuery] = useState('');

  // Distinct Range & Quantity State (From, To, Quantity)
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(1);
  const [rangeQty, setRangeQty] = useState(1);

  // Specs loaded directly from Print Barcode Page
  const [productType, setProductType] = useState('DOME CAMERA');
  const [resolution, setResolution] = useState('4MP');
  const [lens, setLens] = useState('2.8mm');
  const [badgeType, setBadgeType] = useState('SMART HYBRID'); // 'SMART HYBRID' | 'DUAL LIGHT' | 'NONE'

  // Pagination for labels
  const [currentBatchPage, setCurrentBatchPage] = useState(1);

  // Layout & Dimension (Zebra ZD420 50mm × 25mm / 1.97" × 0.98" is default)
  const [labelDimension, setLabelDimension] = useState('zebra_50x25');
  const activePreset = LABEL_PRESETS[labelDimension] || LABEL_PRESETS.zebra_50x25;
  const [colorMode, setColorMode] = useState('mono_300dpi'); // 'mono_300dpi' | 'full_color'

  // Company Footer
  const [companyName, setCompanyName] = useState('Lookman Distribution Private Limited');
  const [addressLine1, setAddressLine1] = useState('No.9/15, II Street Extn, III Main Road, CIT Nagar,');
  const [addressLine2, setAddressLine2] = useState('Nandanam, Chennai - 600 035');
  const [country, setCountry] = useState('MADE IN INDIA');

  // UI Toast
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  // Current active pool of serials (Available vs All)
  const currentPoolSerials = useMemo(() => {
    return serialFilter === 'available' ? availablePrintBarcodeSerials : allPrintBarcodeSerials;
  }, [serialFilter, availablePrintBarcodeSerials, allPrintBarcodeSerials]);

  // Synchronize From/To/Quantity range with a given serials list
  const syncRangeWithPool = useCallback((pool) => {
    const len = pool.length;
    if (len > 0) {
      setRangeFrom(1);
      setRangeTo(len);
      setRangeQty(len);
      setSelectedSerials(pool);
    } else {
      setRangeFrom(1);
      setRangeTo(1);
      setRangeQty(0);
      setSelectedSerials([]);
    }
    setCurrentBatchPage(1);
  }, []);

  // 1. Fetch ONLY models that have data generated/saved in Print Barcode page
  const fetchPrintBarcodeModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      const res = await axios.get(`${CARTON_API}/models`);
      if (res.data?.success && Array.isArray(res.data.models)) {
        const validModels = res.data.models.filter(m => (m.totalSerials > 0 || m.availableSerials > 0));
        setPrintBarcodeModels(validModels);

        if (validModels.length > 0 && !selectedModel) {
          setSelectedModel(validModels[0].modelNo);
        }
      }
    } catch (err) {
      console.warn('Error fetching Print Barcode models:', err);
    } finally {
      setLoadingModels(false);
    }
  }, [selectedModel]);

  useEffect(() => {
    fetchPrintBarcodeModels();
  }, [fetchPrintBarcodeModels]);

  // 2. When user selects a model, fetch ONLY its Print Barcode page serials & specs
  const fetchModelBarcodeData = useCallback(async (model) => {
    if (!model) return;
    setLoadingSerials(true);
    try {
      const res = await axios.get(`${CARTON_API}/available-serials?modelNo=${encodeURIComponent(model)}`);
      if (res.data?.success) {
        const { specs, availableSerials = [], allSerials = [] } = res.data;

        // Apply specs saved from Print Barcode page
        if (specs) {
          if (specs.productType) setProductType(specs.productType);
          if (specs.resolution) setResolution(specs.resolution);
          if (specs.lens) setLens(specs.lens);
          if (specs.badgeType) setBadgeType(specs.badgeType);
        }

        const availList = availableSerials.length > 0 ? availableSerials : allSerials;
        const allList = allSerials.length > 0 ? allSerials : availableSerials;

        setAvailablePrintBarcodeSerials(availList);
        setAllPrintBarcodeSerials(allList);

        const targetPool = serialFilter === 'available' ? availList : allList;
        syncRangeWithPool(targetPool);

        setToast({
          open: true,
          message: `✅ Loaded ${availList.length} barcodes from Print Barcode for model ${model}!`,
          severity: 'success'
        });
      }
    } catch (err) {
      console.warn('Error fetching serials for model:', err);
      setToast({
        open: true,
        message: `Failed to load Print Barcode data: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoadingSerials(false);
    }
  }, [serialFilter, syncRangeWithPool]);

  useEffect(() => {
    if (selectedModel) {
      fetchModelBarcodeData(selectedModel);
    }
  }, [selectedModel, fetchModelBarcodeData]);

  // Handle Model Change
  const handleModelChange = (newModel) => {
    setSelectedModel(newModel);
  };

  // Handle Filter Change (Available vs All)
  const handleFilterChange = (newFilter) => {
    setSerialFilter(newFilter);
    const newPool = newFilter === 'available' ? availablePrintBarcodeSerials : allPrintBarcodeSerials;
    syncRangeWithPool(newPool);
  };

  // Distinct Range Change Handlers: From, To, Quantity
  const handleRangeFromChange = (val) => {
    const total = currentPoolSerials.length;
    if (total === 0) return;
    const f = Math.max(1, Math.min(parseInt(val, 10) || 1, total));
    setRangeFrom(f);
    const t = Math.max(f, rangeTo > total ? total : rangeTo);
    setRangeTo(t);
    setRangeQty(t - f + 1);
    setSelectedSerials(currentPoolSerials.slice(f - 1, t));
    setCurrentBatchPage(1);
  };

  const handleRangeToChange = (val) => {
    const total = currentPoolSerials.length;
    if (total === 0) return;
    const parsed = parseInt(val, 10);
    const t = Math.max(rangeFrom, Math.min(isNaN(parsed) ? rangeFrom : parsed, total));
    setRangeTo(t);
    setRangeQty(t - rangeFrom + 1);
    setSelectedSerials(currentPoolSerials.slice(rangeFrom - 1, t));
    setCurrentBatchPage(1);
  };

  const handleRangeQtyChange = (val) => {
    const total = currentPoolSerials.length;
    if (total === 0) return;
    const q = Math.max(1, Math.min(parseInt(val, 10) || 1, total));
    setRangeQty(q);
    const newTo = Math.min(total, rangeFrom + q - 1);
    setRangeTo(newTo);
    setSelectedSerials(currentPoolSerials.slice(rangeFrom - 1, newTo));
    setCurrentBatchPage(1);
  };

  const applyPreset = (from, to) => {
    const total = currentPoolSerials.length;
    if (total === 0) return;
    const f = Math.max(1, Math.min(from, total));
    const t = Math.max(f, Math.min(to, total));
    setRangeFrom(f);
    setRangeTo(t);
    setRangeQty(t - f + 1);
    setSelectedSerials(currentPoolSerials.slice(f - 1, t));
    setCurrentBatchPage(1);
  };

  // Toggle single serial selection
  const handleToggleSerial = (sn) => {
    setSelectedSerials(prev => {
      const next = prev.includes(sn) ? prev.filter(s => s !== sn) : [...prev, sn];
      setRangeQty(next.length);
      return next;
    });
  };

  // Select All / Deselect All
  const handleSelectAll = () => {
    if (selectedSerials.length === currentPoolSerials.length) {
      setSelectedSerials([]);
      setRangeQty(0);
    } else {
      setSelectedSerials([...currentPoolSerials]);
      setRangeFrom(1);
      setRangeTo(currentPoolSerials.length);
      setRangeQty(currentPoolSerials.length);
    }
  };

  // Serials matching search query
  const searchedPoolSerials = useMemo(() => {
    if (!serialSearchQuery.trim()) return currentPoolSerials;
    const q = serialSearchQuery.trim().toLowerCase();
    return currentPoolSerials.filter(sn => sn.toLowerCase().includes(q));
  }, [currentPoolSerials, serialSearchQuery]);

  // Active Serials to be printed (strictly the selected ones in the Distinct From-To range)
  const activePrintSerials = useMemo(() => {
    return selectedSerials.filter(sn => currentPoolSerials.includes(sn));
  }, [selectedSerials, currentPoolSerials]);

  // Pagination for display preview
  const totalCount = activePrintSerials.length;
  const totalBatches = Math.max(1, Math.ceil(totalCount / BATCH_SIZE));
  const activeBatchPage = Math.min(currentBatchPage, totalBatches);
  const batchOffset = (activeBatchPage - 1) * BATCH_SIZE;
  const displayedBarcodes = activePrintSerials.slice(batchOffset, batchOffset + BATCH_SIZE);

  // Print Labels
  const handlePrint = () => {
    const sheetElement = document.getElementById('product-label-printable-sheet');
    if (!sheetElement || displayedBarcodes.length === 0) {
      return;
    }

    const cardsHtml = sheetElement.innerHTML;
    const printHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>ColorOn Product Labels - ${selectedModel}</title>
    <style>
      @page {
        size: ${activePreset.widthMm}mm ${activePreset.heightMm}mm;
        margin: 0;
      }
      *, *::before, *::after {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        font-family: Arial, sans-serif !important;
        width: ${activePreset.widthMm}mm !important;
      }
      .sticker-card {
        width: ${activePreset.widthMm}mm !important;
        height: ${activePreset.heightMm}mm !important;
        max-width: ${activePreset.widthMm}mm !important;
        max-height: ${activePreset.heightMm}mm !important;
        min-width: ${activePreset.widthMm}mm !important;
        min-height: ${activePreset.heightMm}mm !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        border: none !important;
        box-shadow: none !important;
        padding: ${activePreset.widthMm <= 60 ? '0.8mm 1.4mm' : '3mm 5mm'} !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        box-sizing: border-box !important;
        background: #ffffff !important;
        overflow: hidden !important;
      }
      .sticker-card .barcode-container svg {
        max-height: ${activePreset.widthMm <= 60 ? '5.5mm' : '10mm'} !important;
        width: auto !important;
        max-width: 100% !important;
      }
      .sticker-card:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }
    </style>
  </head>
  <body>
    ${cardsHtml}
  </body>
</html>`;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    document.body.appendChild(printFrame);

    const printDoc = printFrame.contentWindow.document;
    printDoc.open();
    printDoc.write(printHtml);
    printDoc.close();

    let hasPrinted = false;
    const executePrint = () => {
      if (hasPrinted) return;
      hasPrinted = true;
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (err) {
        window.print();
      }
      setTimeout(() => {
        try { document.body.removeChild(printFrame); } catch (e) {}
      }, 1000);
    };

    printFrame.onload = executePrint;
    setTimeout(executePrint, 400);
  };

  // Download PDF
  const handleDownloadPDF = () => {
    const element = document.getElementById('product-label-printable-sheet');
    if (!element || displayedBarcodes.length === 0) return;

    const opt = {
      margin: 0,
      filename: `ProductLabels_${selectedModel}_${activePreset.widthMm}x${activePreset.heightMm}mm_From${rangeFrom}_To${rangeTo}_${activePrintSerials.length}Labels.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 3.5, useCORS: true, logging: false },
      jsPDF: {
        unit: 'mm',
        format: [activePreset.widthMm, activePreset.heightMm],
        orientation: activePreset.widthMm >= activePreset.heightMm ? 'landscape' : 'portrait'
      }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Top Title & Actions Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: '#0f2b48', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tag size={28} color="#0f2b48" /> Product Label
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Showing ONLY barcodes and specifications generated in the <strong>Print Barcode</strong> page.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={() => {
              fetchPrintBarcodeModels();
              if (selectedModel) fetchModelBarcodeData(selectedModel);
            }}
            disabled={loadingModels || loadingSerials}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: '#0f2b48',
              color: '#0f2b48',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#f1f5f9' }
            }}
          >
            Refresh Data
          </Button>

          <Button
            variant="outlined"
            startIcon={<Download size={18} />}
            onClick={handleDownloadPDF}
            disabled={activePrintSerials.length === 0}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: '#16a34a',
              color: '#16a34a',
              fontWeight: 600,
              px: 2,
              '&:hover': { backgroundColor: '#f0fdf4', borderColor: '#16a34a' }
            }}
          >
            Download PDF ({activePrintSerials.length})
          </Button>

          <Button
            variant="contained"
            startIcon={<Printer size={18} />}
            onClick={handlePrint}
            disabled={activePrintSerials.length === 0}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              backgroundColor: '#0f2b48',
              color: '#ffffff',
              fontWeight: 700,
              px: 2.5,
              '&:hover': { backgroundColor: '#1e3a5f' }
            }}
          >
            Print Labels ({activePrintSerials.length})
          </Button>
        </Box>
      </Box>

      {/* Warning banner if no models found from Print Barcode */}
      {printBarcodeModels.length === 0 && !loadingModels && (
        <Alert
          severity="warning"
          icon={<AlertTriangle size={24} />}
          sx={{ mb: 3, borderRadius: 2.5, fontWeight: 600, backgroundColor: '#fefce8', border: '1px solid #fde047' }}
        >
          No saved barcodes found from the <strong>Print Barcode</strong> page yet! Please go to <strong>Print Barcode</strong> in the drawer menu, generate labels, and click <strong>"Save to DB"</strong>. Those items will then automatically appear here for product labeling.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Model Selection & Print Barcode Data Pool */}
        <Grid item xs={12} lg={5}>
          {/* Card 1: Select Model from Print Barcode Data */}
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f2b48', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Sliders size={18} color="#0f2b48" /> Select Model from Print Barcode
              </Typography>
              <Chip
                icon={<Database size={14} />}
                label={`${printBarcodeModels.length} Saved Models`}
                size="small"
                sx={{ fontWeight: 600, backgroundColor: '#f0fdf4', color: '#166534' }}
              />
            </Box>

            {/* Model Dropdown (ONLY models from Print Barcode) */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Model (from Print Barcode Page)</InputLabel>
              <Select
                value={selectedModel}
                label="Model (from Print Barcode Page)"
                onChange={(e) => handleModelChange(e.target.value)}
              >
                {printBarcodeModels.map((m) => (
                  <MenuItem key={m.modelNo} value={m.modelNo}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700 }}>{m.modelNo}</span>
                      <Chip
                        label={`${m.availableSerials} Available (${m.totalSerials} Total)`}
                        size="small"
                        sx={{ ml: 1, fontSize: '11px', height: '20px', fontWeight: 600 }}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Model Specs Display (loaded from Print Barcode) */}
            {selectedModel && (
              <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', mb: 2 }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: '#64748b', display: 'block', mb: 1, textTransform: 'uppercase' }}>
                  Specifications (Saved in Print Barcode):
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Product Type:</Typography>
                    <Typography variant="body2" fontWeight={700}>{productType}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Resolution:</Typography>
                    <Typography variant="body2" fontWeight={700}>{resolution}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Lens:</Typography>
                    <Typography variant="body2" fontWeight={700}>{lens}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Badge Logo:</Typography>
                    <Typography variant="body2" fontWeight={700}>{badgeType}</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Label Size / Preset Selector */}
            <Typography variant="caption" fontWeight={700} sx={{ color: '#0f2b48', display: 'block', mb: 1 }}>
              Printer Label Size &amp; Preset:
            </Typography>
            <FormControl size="small" fullWidth sx={{ mb: 2 }}>
              <InputLabel>Label Size (Preset)</InputLabel>
              <Select
                value={labelDimension}
                label="Label Size (Preset)"
                onChange={(e) => setLabelDimension(e.target.value)}
              >
                {Object.values(LABEL_PRESETS).map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span style={{ fontWeight: p.id === 'zebra_50x25' ? 700 : 500 }}>{p.name}</span>
                      {p.id === 'zebra_50x25' && (
                        <Chip
                          label="Default"
                          size="small"
                          sx={{ ml: 1, height: '18px', fontSize: '10px', bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}
                        />
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Editable Specs (Optional Overrides) */}
            <Typography variant="caption" fontWeight={700} sx={{ color: '#0f2b48', display: 'block', mb: 1 }}>
              Label Details &amp; Badges:
            </Typography>
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              <Grid item xs={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Product Type"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Resolution"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Lens"
                  value={lens}
                  onChange={(e) => setLens(e.target.value)}
                />
              </Grid>
            </Grid>

            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Badge Type</InputLabel>
                  <Select
                    value={badgeType}
                    label="Badge Type"
                    onChange={(e) => setBadgeType(e.target.value)}
                  >
                    <MenuItem value="SMART HYBRID">SMART HYBRID</MenuItem>
                    <MenuItem value="DUAL LIGHT">DUAL LIGHT</MenuItem>
                    <MenuItem value="NONE">None</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Color Mode</InputLabel>
                  <Select
                    value={colorMode}
                    label="Color Mode"
                    onChange={(e) => setColorMode(e.target.value)}
                  >
                    <MenuItem value="mono_300dpi">Monochrome (Zebra Thermal Black)</MenuItem>
                    <MenuItem value="full_color">Full Color (Logo)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Card 2: Distinct Quantity & Range Selector (From ➔ To) */}
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f2b48', display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarcodeIcon size={18} color="#0f2b48" /> Generated Serials Pool
              </Typography>
              <Chip
                label={`${activePrintSerials.length} / ${currentPoolSerials.length} Selected`}
                size="small"
                sx={{ fontWeight: 700, backgroundColor: '#0f2b48', color: '#ffffff' }}
              />
            </Box>

            {/* Filter Toggle: Available vs All */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                size="small"
                variant={serialFilter === 'available' ? 'contained' : 'outlined'}
                onClick={() => handleFilterChange('available')}
                sx={{
                  textTransform: 'none',
                  fontSize: '12px',
                  borderRadius: 2,
                  backgroundColor: serialFilter === 'available' ? '#0f2b48' : 'transparent',
                  color: serialFilter === 'available' ? '#ffffff' : '#0f2b48'
                }}
              >
                Available Serials ({availablePrintBarcodeSerials.length})
              </Button>
              <Button
                size="small"
                variant={serialFilter === 'all' ? 'contained' : 'outlined'}
                onClick={() => handleFilterChange('all')}
                sx={{
                  textTransform: 'none',
                  fontSize: '12px',
                  borderRadius: 2,
                  backgroundColor: serialFilter === 'all' ? '#0f2b48' : 'transparent',
                  color: serialFilter === 'all' ? '#ffffff' : '#0f2b48'
                }}
              >
                All Generated ({allPrintBarcodeSerials.length})
              </Button>
            </Box>

            {/* DISTINCT RANGE & QUANTITY CONTROLLER BOX */}
            <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2.5, backgroundColor: '#f0fdf4', borderColor: '#86efac' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#166534', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Layers size={17} color="#166534" /> Distinct Quantity &amp; Print Range
                </Typography>
                <Chip
                  label={`Quantity: ${activePrintSerials.length} Labels`}
                  size="small"
                  sx={{ fontWeight: 800, backgroundColor: '#166534', color: '#ffffff' }}
                />
              </Box>

              {/* Range Inputs: From (# Index), To (# Index), Quantity */}
              <Grid container spacing={1.5} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="From (# Index)"
                    size="small"
                    fullWidth
                    type="number"
                    value={rangeFrom}
                    onChange={(e) => handleRangeFromChange(e.target.value)}
                    inputProps={{ min: 1, max: currentPoolSerials.length || 1 }}
                    helperText={currentPoolSerials[rangeFrom - 1] ? `Start: ${currentPoolSerials[rangeFrom - 1]}` : ''}
                    sx={{ backgroundColor: '#ffffff', borderRadius: 1 }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    label="To (# Index)"
                    size="small"
                    fullWidth
                    type="number"
                    value={rangeTo}
                    onChange={(e) => handleRangeToChange(e.target.value)}
                    inputProps={{ min: rangeFrom, max: currentPoolSerials.length || 1 }}
                    helperText={currentPoolSerials[rangeTo - 1] ? `End: ${currentPoolSerials[rangeTo - 1]}` : ''}
                    sx={{ backgroundColor: '#ffffff', borderRadius: 1 }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Quantity (Count)"
                    size="small"
                    fullWidth
                    type="number"
                    value={rangeQty}
                    onChange={(e) => handleRangeQtyChange(e.target.value)}
                    inputProps={{ min: 1, max: currentPoolSerials.length || 1 }}
                    helperText={`Total: ${rangeQty} Labels`}
                    sx={{ backgroundColor: '#ffffff', borderRadius: 1 }}
                  />
                </Grid>
              </Grid>

              {/* Dropdowns: Select Exact Serial Range */}
              {currentPoolSerials.length > 0 && (
                <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} sm={6}>
                    <FormControl size="small" fullWidth sx={{ backgroundColor: '#ffffff', borderRadius: 1 }}>
                      <InputLabel>From Serial Number</InputLabel>
                      <Select
                        value={rangeFrom}
                        label="From Serial Number"
                        onChange={(e) => handleRangeFromChange(e.target.value)}
                      >
                        {currentPoolSerials.map((sn, idx) => (
                          <MenuItem key={sn} value={idx + 1}>
                            #{idx + 1}: {sn}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl size="small" fullWidth sx={{ backgroundColor: '#ffffff', borderRadius: 1 }}>
                      <InputLabel>To Serial Number</InputLabel>
                      <Select
                        value={rangeTo}
                        label="To Serial Number"
                        onChange={(e) => handleRangeToChange(e.target.value)}
                      >
                        {currentPoolSerials.map((sn, idx) => (
                          <MenuItem key={sn} value={idx + 1} disabled={idx + 1 < rangeFrom}>
                            #{idx + 1}: {sn}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}

              {/* Quick Presets */}
              <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: '#166534' }}>
                  Quick Presets:
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => applyPreset(1, Math.min(10, currentPoolSerials.length))}
                  sx={{ textTransform: 'none', fontSize: '11px', py: 0.3, px: 1, borderColor: '#86efac', color: '#166534', backgroundColor: '#ffffff' }}
                >
                  First 10 (#1-10)
                </Button>
                {currentPoolSerials.length > 10 && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => applyPreset(11, Math.min(20, currentPoolSerials.length))}
                    sx={{ textTransform: 'none', fontSize: '11px', py: 0.3, px: 1, borderColor: '#86efac', color: '#166534', backgroundColor: '#ffffff' }}
                  >
                    Next 10 (#11-20)
                  </Button>
                )}
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => applyPreset(1, currentPoolSerials.length)}
                  sx={{ textTransform: 'none', fontSize: '11px', py: 0.3, px: 1, borderColor: '#86efac', color: '#166534', backgroundColor: '#ffffff' }}
                >
                  All (#1-{currentPoolSerials.length})
                </Button>
              </Box>

              {/* Range Breadcrumb Banner */}
              <Box sx={{ mt: 1.5, p: 1, backgroundColor: '#ffffff', borderRadius: 1.5, border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Range: <strong>{currentPoolSerials[rangeFrom - 1] || 'None'}</strong> <ArrowRight size={14} /> <strong>{currentPoolSerials[rangeTo - 1] || 'None'}</strong>
                </Typography>
                <Chip
                  size="small"
                  label={`Only these ${activePrintSerials.length} labels will print`}
                  sx={{ backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: '11px' }}
                />
              </Box>
            </Paper>

            {/* Search within serials & Select All / Deselect All */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search serial number..."
                value={serialSearchQuery}
                onChange={(e) => setSerialSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color="#64748b" />
                    </InputAdornment>
                  )
                }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={handleSelectAll}
                sx={{
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  fontSize: '12px',
                  borderRadius: 2,
                  borderColor: '#cbd5e1',
                  color: '#0f2b48'
                }}
              >
                {selectedSerials.length === currentPoolSerials.length ? 'Deselect All' : 'Select All'}
              </Button>
            </Box>

            {/* Serials Chips Grid */}
            {loadingSerials ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress size={28} />
                <Typography variant="body2" sx={{ mt: 1, color: '#64748b' }}>
                  Loading serial numbers from Print Barcode...
                </Typography>
              </Box>
            ) : searchedPoolSerials.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  No serial numbers found for model <strong>{selectedModel}</strong>.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.8,
                  maxHeight: 220,
                  overflowY: 'auto',
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}
              >
                {searchedPoolSerials.map((sn, idx) => {
                  const globalIdx = currentPoolSerials.indexOf(sn) + 1;
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
                        fontWeight: isSelected ? 700 : 500,
                        backgroundColor: isSelected ? '#0f2b48' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#334155',
                        border: isSelected ? '1px solid #0f2b48' : '1px solid #cbd5e1',
                        '&:hover': {
                          backgroundColor: isSelected ? '#1e3a5f' : '#f1f5f9'
                        }
                      }}
                    />
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Live Printable Sticker Preview of Distinct From-To Labels */}
        <Grid item xs={12} lg={7}>
          {/* Zebra ZD420 Printer Settings Guide (Step 1 & Step 2) */}
          <Paper
            sx={{
              p: 2.5,
              mb: 2.5,
              borderRadius: 2.5,
              backgroundColor: '#ffffff',
              border: '1px solid #bae6fd',
              boxShadow: '0 2px 10px rgba(2, 132, 199, 0.06)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Printer size={20} color="#0284c7" /> Zebra ZD420 Setup (50 mm × 25 mm / 1.97" × 0.98")
              </Typography>
              <Chip
                label="50 mm × 25 mm [1.97″ × 0.98″]"
                size="small"
                sx={{ fontWeight: 800, backgroundColor: '#e0f2fe', color: '#0369a1' }}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" fontWeight={800} sx={{ color: '#0f172a', display: 'block', mb: 0.8, textTransform: 'uppercase' }}>
                  Step 1 — Enter Zebra printer settings (Printing Preferences → Page Setup)
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f0f9ff' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, py: 0.5, fontSize: '11.5px' }}>Setting</TableCell>
                        <TableCell sx={{ fontWeight: 800, py: 0.5, fontSize: '11.5px' }}>Enter</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ py: 0.4, fontSize: '11px', fontWeight: 600 }}>Stock</TableCell>
                        <TableCell sx={{ py: 0.4, fontSize: '11px', fontWeight: 700, color: '#0369a1' }}>Custom</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ py: 0.4, fontSize: '11px', fontWeight: 600 }}>Width</TableCell>
                        <TableCell sx={{ py: 0.4, fontSize: '11px', fontWeight: 700, color: '#0369a1' }}>1.97 inches</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ py: 0.4, fontSize: '11px', fontWeight: 600 }}>Height</TableCell>
                        <TableCell sx={{ py: 0.4, fontSize: '11px', fontWeight: 700, color: '#0369a1' }}>0.98 inches</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ py: 0.4, fontSize: '11px', fontWeight: 600 }}>Media Type</TableCell>
                        <TableCell sx={{ py: 0.4, fontSize: '11px', fontWeight: 700, color: '#0369a1' }}>Labels with gaps</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ py: 0.4, fontSize: '11px', fontWeight: 600 }}>Rotation</TableCell>
                        <TableCell sx={{ py: 0.4, fontSize: '11px', fontWeight: 700, color: '#0369a1' }}>0° – Portrait (initial setting)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ py: 0.4, fontSize: '11px', fontWeight: 600 }}>Mirror Label</TableCell>
                        <TableCell sx={{ py: 0.4, fontSize: '11px', fontWeight: 700, color: '#0369a1' }}>Unchecked</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ py: 0.4, fontSize: '11px', fontWeight: 600 }}>Inverse</TableCell>
                        <TableCell sx={{ py: 0.4, fontSize: '11px', fontWeight: 700, color: '#0369a1' }}>Unchecked</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.8, fontSize: '10.5px' }}>
                  💡 <em>These dimensions correspond to 50 mm × 25 mm. If the driver accepts millimetres, enter 50 and 25 directly.</em>
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" fontWeight={800} sx={{ color: '#0f172a', display: 'block', mb: 0.8, textTransform: 'uppercase' }}>
                  Step 2 — Save and test
                </Typography>
                <Box sx={{ p: 1.5, backgroundColor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0', fontSize: '11.5px' }}>
                  <ol style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6, color: '#334155', fontWeight: 500 }}>
                    <li>Click <strong>Apply → OK</strong>.</li>
                    <li>Open your label printing application.</li>
                    <li>Set the application's label size to <strong>50 mm × 25 mm</strong>.</li>
                    <li>Select your <strong>Zebra ZD420</strong> printer.</li>
                    <li>Set <strong>Scale to 100%</strong> and <strong>Margins to None</strong>, if available.</li>
                    <li>Check print preview and print one test label.</li>
                  </ol>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Eye size={20} color="#0f2b48" />
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f2b48' }}>
                  Live Printable Sticker Preview ({activePreset.shortName})
                </Typography>
              </Box>
              <Chip
                label={`Total: ${activePrintSerials.length.toLocaleString()} Labels (#${rangeFrom} to #${rangeTo})`}
                size="small"
                sx={{ fontWeight: 800, backgroundColor: '#0f2b48', color: '#ffffff' }}
              />
            </Box>

            {/* Batch Pagination Controller if large quantity */}
            {totalCount > BATCH_SIZE && (
              <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2, backgroundColor: '#f0fdf4', borderColor: '#86efac' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight={800} sx={{ color: '#166534' }}>
                    Showing Batch {activeBatchPage} of {totalBatches} ({displayedBarcodes.length} labels)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ChevronLeft size={16} />}
                      disabled={activeBatchPage <= 1}
                      onClick={() => setCurrentBatchPage(p => Math.max(1, p - 1))}
                    >
                      Prev
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      endIcon={<ChevronRight size={16} />}
                      disabled={activeBatchPage >= totalBatches}
                      onClick={() => setCurrentBatchPage(p => Math.min(totalBatches, p + 1))}
                    >
                      Next
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* Empty state if no serials selected */}
            {displayedBarcodes.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 2.5, border: '1px dashed #cbd5e1' }}>
                <BarcodeIcon size={40} color="#94a3b8" style={{ marginBottom: 8 }} />
                <Typography variant="body1" fontWeight={700} sx={{ color: '#64748b' }}>
                  No serial numbers selected for printing
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                  Set a valid From ➔ To range on the left panel to preview and print labels.
                </Typography>
              </Box>
            ) : (
              /* Printable Sticker Container */
              <Box
                id="product-label-printable-sheet"
                sx={{
                  p: 2,
                  backgroundColor: '#f1f5f9',
                  borderRadius: 2.5,
                  border: '1px solid #cbd5e1',
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 2,
                  maxHeight: 780,
                  overflowY: 'auto'
                }}
              >
                {displayedBarcodes.map((codeVal, idx) => (
                  <div
                    key={idx}
                    className="sticker-card"
                    style={{
                      width: '100%',
                      maxWidth: activePreset.widthMm <= 50 ? '360px' : '480px',
                      aspectRatio: activePreset.aspectRatio || (activePreset.widthMm <= 50 ? '52 / 21' : `${activePreset.widthMm} / ${activePreset.heightMm}`),
                      padding: activePreset.widthMm <= 50 ? '6px 10px' : '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxSizing: 'border-box',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                      margin: '0 auto',
                      position: 'relative'
                    }}
                  >
                    {/* Top Row: Two Columns (Left: Brand + Type + Model | Right: Res & Lens + Smart Hybrid) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', lineHeight: 1.15 }}>
                      {/* Left Column: Brand Logo + Product Type + Model No */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <ColorOnBrandLogo colorMode={colorMode} height={activePreset.widthMm <= 50 ? 20 : 24} />

                        <span
                          style={{
                            fontFamily: 'Arial, Helvetica, sans-serif',
                            fontWeight: 900,
                            fontSize: activePreset.widthMm <= 50 ? '10.5px' : '11.5px',
                            color: '#000000',
                            display: 'block',
                            textTransform: 'uppercase',
                            letterSpacing: '0.2px',
                            lineHeight: 1.15,
                            marginTop: '2px'
                          }}
                        >
                          {productType}
                        </span>

                        <span
                          style={{
                            fontFamily: 'Arial, Helvetica, sans-serif',
                            fontWeight: 900,
                            fontSize: activePreset.widthMm <= 50 ? '10.5px' : '11.5px',
                            color: '#000000',
                            display: 'block',
                            marginTop: '1px',
                            lineHeight: 1.15
                          }}
                        >
                          Model: {selectedModel}
                        </span>
                      </div>

                      {/* Right Column: Resolution & Lens (Line 1) + SMART HYBRID / DUAL LIGHT Logo (Line 2) */}
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span
                          style={{
                            fontFamily: 'Arial, Helvetica, sans-serif',
                            fontWeight: 900,
                            fontSize: activePreset.widthMm <= 50 ? '13px' : '14.5px',
                            color: '#000000',
                            lineHeight: 1,
                            letterSpacing: '0.2px'
                          }}
                        >
                          {resolution} {lens}
                        </span>

                        <div style={{ marginTop: '2.5px' }}>
                          {badgeType === 'SMART HYBRID' && <SmartHybridLogo height={activePreset.widthMm <= 50 ? 24 : 28} />}
                          {badgeType === 'DUAL LIGHT' && <DualLightBadge height={activePreset.widthMm <= 50 ? 16 : 18} colorMode={colorMode} />}
                        </div>
                      </div>
                    </div>

                    {/* Barcode Graphic - tightly centered with edge-to-edge spread */}
                    <div className="barcode-container" style={{ textAlign: 'center', margin: '1px 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                      <Code128Svg code={codeVal} height={activePreset.widthMm <= 50 ? 22 : 32} width={activePreset.widthMm <= 50 ? 1.35 : 1.45} />
                    </div>

                    {/* Bottom Unified Block: S/N + Address + CE FC (Tightly grouped without empty gaps, matching reference) */}
                    <div style={{ width: '100%', marginTop: '0' }}>
                      {/* S/N Row: SN: on left and Serial Number centered under barcode */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          width: '100%',
                          marginBottom: '2px',
                          fontFamily: 'Arial, Helvetica, sans-serif'
                        }}
                      >
                        <span style={{ fontWeight: 900, fontSize: activePreset.widthMm <= 50 ? '9.5px' : '11px', color: '#000000', width: '15%', textAlign: 'left' }}>
                          SN:
                        </span>
                        <span style={{ fontWeight: 900, fontSize: activePreset.widthMm <= 50 ? '11px' : '12px', color: '#000000', width: '70%', textAlign: 'center', letterSpacing: '0.4px' }}>
                          {codeVal}
                        </span>
                        <span style={{ width: '15%' }}></span>
                      </div>

                      {/* Company Address Block & CE FC Certification Logos */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', lineHeight: 1.18 }}>
                        <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              fontFamily: 'Arial, Helvetica, sans-serif',
                              fontWeight: 900,
                              fontSize: activePreset.widthMm <= 50 ? '10px' : '11px',
                              color: '#000000',
                              display: 'block',
                              letterSpacing: '0.2px',
                              lineHeight: 1.15,
                              marginBottom: '1.5px'
                            }}
                          >
                            {country}
                          </span>
                          <span style={{ fontSize: activePreset.widthMm <= 50 ? '9px' : '10px', color: '#000000', fontWeight: 700, display: 'block', lineHeight: 1.18 }}>
                            {companyName}
                          </span>
                          <span style={{ fontSize: activePreset.widthMm <= 50 ? '8.2px' : '9.2px', color: '#000000', fontWeight: 500, display: 'block', lineHeight: 1.18 }}>
                            {addressLine1}
                          </span>
                          <span style={{ fontSize: activePreset.widthMm <= 50 ? '8.2px' : '9.2px', color: '#000000', fontWeight: 500, display: 'block', lineHeight: 1.18 }}>
                            {addressLine2}
                          </span>
                        </div>

                        <div style={{ paddingLeft: '8px', flexShrink: 0 }}>
                          <CeFcLogos height={activePreset.widthMm <= 50 ? 25 : 30} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
