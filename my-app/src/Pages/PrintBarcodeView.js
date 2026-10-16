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
  Checkbox,
  FormControlLabel,
  Chip,
  Card,
  Divider,
  InputAdornment,
  Alert,
  Snackbar,
  Tooltip,
  IconButton,
  Switch,
  Stack,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import {
  Printer,
  Barcode as BarcodeIcon,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  Sliders,
  CheckSquare,
  Save,
  Download,
  Scan,
  CheckCircle2,
  AlertTriangle,
  Package,
  Layers,
  Building,
  Calendar,
  Sparkles,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import JsBarcode from 'jsbarcode';
import coloronLogo from '../assets/img/coloron.png';
import { COLORON_LOGO_DATA_URL } from '../assets/img/coloronBase64';

const API_BASE = 'https://coloroninventoy.onrender.com/api';
const INVENTORY_API = `${API_BASE}/inventory`;
const PRODUCTS_API = `${API_BASE}/products`;
const BATCH_SIZE = 100; // Max 100 labels rendered per view/print job to prevent browser OOM crashes

// --- Zebra ZD420 & Standard Label Dimension Configurations ---
export const LABEL_PRESETS = {
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
  },
  zebra_100x150: {
    id: 'zebra_100x150',
    name: 'Zebra ZD420 - 100mm × 150mm (4" × 6") Roll [Large Box / Shipping]',
    shortName: 'ZD420 100×150mm (4×6")',
    widthMm: 100,
    heightMm: 150,
    isRoll: true,
    columns: 1,
    pageSize: '100mm 150mm portrait',
    orientation: 'portrait'
  },
  zebra_2up: {
    id: 'zebra_2up',
    name: 'Zebra ZD420 - 50mm × 25mm 2-Up Roll [2 Columns on 104mm Roll]',
    shortName: 'ZD420 2-Up (50×25mm)',
    widthMm: 104,
    heightMm: 25,
    cardWidthMm: 49,
    isRoll: true,
    columns: 2,
    pageSize: '104mm 25mm landscape',
    orientation: 'landscape'
  },
  zebra_50x25: {
    id: 'zebra_50x25',
    name: 'Zebra ZD420 - 50mm × 25mm (2" × 1") Single Roll',
    shortName: 'ZD420 50×25mm',
    widthMm: 50,
    heightMm: 25,
    isRoll: true,
    columns: 1,
    pageSize: '50mm 25mm landscape',
    orientation: 'landscape'
  },
  a4_grid: {
    id: 'a4_grid',
    name: 'A4 Sheet (2 Columns: Left & Right Stickers - 8/10 per Page)',
    shortName: 'A4 Sheet (2-Col)',
    widthMm: 184,
    heightMm: 61.4,
    cardWidthMm: 90,
    isRoll: false,
    columns: 2,
    pageSize: 'A4 portrait',
    orientation: 'portrait'
  }
};

// --- Official COLOR ON Brand Logo Component (Full Color / 300 DPI Monochrome / Pre-Printed) ---
const ColorOnBrandLogo = ({ colorMode = 'full_color', height = 27 }) => {
  const logoSrc = COLORON_LOGO_DATA_URL || coloronLogo;

  if (colorMode === 'preprinted') {
    return (
      <div
        style={{
          height: `${height}px`,
          minWidth: '95px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed #94a3b8',
          borderRadius: '4px',
          padding: '0 6px',
          backgroundColor: '#f8fafc',
          boxSizing: 'border-box'
        }}
      >
        <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 800, letterSpacing: '0.4px', fontFamily: 'Arial, sans-serif' }}>
          [PRE-PRINTED LOGO]
        </span>
      </div>
    );
  }

  if (colorMode === 'mono_300dpi') {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={logoSrc}
          alt="Coloron Logo"
          style={{
            height: `${height}px`,
            objectFit: 'contain',
            display: 'block',
            filter: 'grayscale(100%) contrast(350%)',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact'
          }}
        />
      </div>
    );
  }

  // Full Color Mode: Preserves original Red & Green colors
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
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

// --- Industry Standard 100% Hardware Scanner Compatible JsBarcode Renderer ---
const Code128Svg = ({ code, width = 1.5, height = 42 }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && code) {
      try {
        JsBarcode(svgRef.current, code, {
          format: "CODE128B",  // Use Code 128 Set B for standard alphanumeric + parentheses
          width: width,        // Width of single bar module (px)
          height: height,      // Barcode height (px)
          displayValue: false, // Don't render text inside SVG, we render styled text below
          margin: 15,          // Quiet Zone margins on left and right (mandatory for physical scanners)
          background: "#ffffff",
          lineColor: "#000000"
        });
      } catch (err) {
        console.error("JsBarcode render error:", err);
      }
    }
  }, [code, width, height]);

  return <svg ref={svgRef} style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}></svg>;
};

// --- Exact Official Vector SVG Certification Logos: CE and FCC (FC with concentric double-C) ---
const CeFcLogos = ({ height = 15 }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
    {/* Official CE Mark */}
    <svg
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      stroke="#000000"
      strokeWidth="9"
      strokeLinecap="butt"
      strokeLinejoin="miter"
      style={{ display: 'block', height: `${height}px` }}
    >
      {/* C */}
      <path d="M 46 12 A 38 38 0 1 0 46 88" />
      {/* E */}
      <path d="M 88 12 A 38 38 0 1 0 88 88" />
      {/* E middle horizontal bar */}
      <path d="M 50 50 L 78 50" />
    </svg>

    {/* Exact Official FCC (Letter F with clear gap + concentric double-C) Mark */}
    <svg
      height={height}
      viewBox="0 0 130 100"
      fill="none"
      stroke="#000000"
      strokeWidth="9"
      strokeLinecap="butt"
      strokeLinejoin="miter"
      style={{ display: 'block', height: `${height}px` }}
    >
      {/* Standalone F with clear gap before C */}
      <path d="M 12 12 L 12 88 M 12 12 L 40 12 M 12 50 L 34 50" transform='scale(1,1)' />
      {/* Outer C */}
      <path d="M 117 23 A 38 38 0 1 0 117 77" />
      {/* Inner Concentric C */}
      <path d="M 106 34 A 22 22 0 1 0 106 66" />
    </svg>
  </div>
);

// --- Exact Vector SVG SMART HYBRID Graphic Logo ---
const SmartHybridLogo = ({ height = 24 }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', lineHeight: 1 }}>
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

// --- Exact Vector SVG DUAL LIGHT Badge (Supports Full Color Green & Monochrome 300 DPI) ---
const DualLightBadge = ({ height = 18, colorMode = 'full_color' }) => {
  const isColor = colorMode === 'full_color';
  const primaryColor = isColor ? '#16a34a' : '#000000';

  return (
    <svg
      height={height}
      viewBox="0 0 112 32"
      style={{ display: 'inline-block', verticalAlign: 'middle', height: `${height}px` }}
    >
      {/* Outer Capsule White Background & Border */}
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
      
      {/* Left Semi-Capsule for DUAL */}
      <path
        d="M 16 1 A 15 15 0 0 0 1 16 A 15 15 0 0 0 16 31 L 56 31 L 56 1 Z"
        fill={primaryColor}
      />

      {/* Center Divider Line */}
      <line x1="56" y1="1" x2="56" y2="31" stroke={primaryColor} strokeWidth="1.5" />

      {/* DUAL White Text */}
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

      {/* LIGHT Text */}
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

// --- Parse Barcode Structure: Extracts Model + 6-digit DateCode (YYDDMM) from Sequence Number ---
function parseBarcodeStructure(barcodeStr) {
  let trimmed = (barcodeStr || '').trim().replace(/^(S\/N|SN)\s*:?\s*/i, '');
  const dateMatch = trimmed.match(/^(.*?)(\d{6})(\d+)$/);
  if (dateMatch) {
    const fixedPrefix = `${dateMatch[1]}${dateMatch[2]}`; // Model + DateCode (e.g. CO-I-2BFDML(V)260108)
    const seqNumStr = dateMatch[3];
    const padLen = Math.max(3, seqNumStr.length);
    const startNum = parseInt(seqNumStr, 10);
    return { fixedPrefix, startNum, padLen };
  }

  const genericMatch = trimmed.match(/^(.*?)(\d+)$/);
  if (genericMatch) {
    return {
      fixedPrefix: genericMatch[1],
      startNum: parseInt(genericMatch[2], 10),
      padLen: Math.max(3, genericMatch[2].length)
    };
  }

  return { fixedPrefix: trimmed, startNum: 1, padLen: 3 };
}

// --- Safe Slice Generator: Generates only the active batch to prevent browser crashes on 50,000+ quantities ---
function generateBatchSequentialBarcodes(startBarcodeStr, count = 100, offset = 0, totalMax = 100) {
  const { fixedPrefix, startNum, padLen } = parseBarcodeStructure(startBarcodeStr);
  const maxAllowed = Math.min(count, Math.max(0, totalMax - offset));

  const result = [];
  for (let i = 0; i < maxAllowed; i++) {
    const currentNum = startNum + offset + i;
    const currentStr = String(currentNum);
    const padded = currentStr.length < padLen ? currentStr.padStart(padLen, '0') : currentStr;
    result.push(`${fixedPrefix}${padded}`);
  }

  return result;
}

// --- Calculate Exact Full Barcode Range (Supports any number e.g. 50000, 1000000) ---
function getBarcodeRangeInfo(startBarcodeStr, qty) {
  const count = Math.max(1, parseInt(qty, 10) || 1);
  const { fixedPrefix, startNum, padLen } = parseBarcodeStructure(startBarcodeStr);
  const endNum = startNum + count - 1;

  const startStr = String(startNum);
  const endStr = String(endNum);

  const startFormatted = startStr.length < padLen ? startStr.padStart(padLen, '0') : startStr;
  const endFormatted = endStr.length < padLen ? endStr.padStart(padLen, '0') : endStr;

  return {
    startCode: `${fixedPrefix}${startFormatted}`,
    endCode: `${fixedPrefix}${endFormatted}`,
    totalCount: count
  };
}

// Convert YYYY-MM-DD date string to YYDDMM format (Year: YY, Date: DD, Month: MM)
function formatDateCode(dateStr) {
  if (!dateStr) return { yy: '26', dd: '01', mm: '08', dateCode: '260108' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { yy: '26', dd: '01', mm: '08', dateCode: '260108' };

  const yy = String(d.getFullYear()).slice(-2);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');

  return { yy, dd, mm, dateCode: `${yy}${dd}${mm}` };
}

// Get Today's Current Date in YYYY-MM-DD format
function getTodayIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// --- Intelligent Product Specs Extractor (Extracts model, resolution, lens, productType from DB Product) ---
function extractProductSpecs(product) {
  if (!product) return {};
  const model = (product.model || product.name || '').trim();
  const desc = (product.productDescriptions || '').trim();
  const cat = (product.category || '').trim();
  const subCat = (product.subCategory || '').trim();
  const combined = `${model} ${desc} ${cat} ${subCat}`.toUpperCase();

  // Resolution detection
  let detectedRes = '2MP';
  const resMatch = combined.match(/\b(2|3|4|5|6|8|16)\s*MP\b/i) || model.match(/(2|3|4|5|6|8|16)MP/i);
  if (resMatch) {
    detectedRes = `${resMatch[1]}MP`;
  } else if (model.includes('-4') || model.includes('4DF') || model.includes('4BF')) {
    detectedRes = '4MP';
  } else if (model.includes('-6') || model.includes('6DF') || model.includes('6BF')) {
    detectedRes = '6MP';
  } else if (model.includes('-5') || model.includes('501')) {
    detectedRes = '5MP';
  } else if (model.includes('-8')) {
    detectedRes = '8MP';
  }

  // Product Type detection
  let detectedType = 'IP BULLET CAMERA';
  if (combined.includes('DOME')) {
    detectedType = combined.includes('HD') ? 'HD DOME CAMERA' : 'IP DOME CAMERA';
  } else if (combined.includes('BULLET')) {
    detectedType = combined.includes('HD') ? 'HD BULLET CAMERA' : 'IP BULLET CAMERA';
  } else if (combined.includes('VDP') || combined.includes('DOOR') || combined.includes('INTERCOM')) {
    detectedType = 'VIDEO DOOR PHONE';
  } else if (combined.includes('RACK')) {
    detectedType = 'SERVER RACK';
  } else if (combined.includes('SWITCH') || combined.includes('POE')) {
    detectedType = 'NETWORK SWITCH';
  } else if (cat) {
    detectedType = cat;
  }

  // Lens detection
  let detectedLens = '3.6mm';
  const lensMatch = combined.match(/\b(\d+(\.\d+)?)\s*MM\b/i);
  if (lensMatch) {
    detectedLens = `${lensMatch[1]}mm`;
  } else if (combined.includes('MOTORIZED')) {
    detectedLens = '2.8-12mm Motorized';
  }

  return {
    modelNo: model,
    productType: detectedType,
    resolution: detectedRes,
    lens: detectedLens
  };
}

export default function PrintBarcodeView() {
  // Product Inputs
  const [productType, setProductType] = useState('IP BULLET CAMERA');
  const [resolution, setResolution] = useState('2MP');
  const [modelNo, setModelNo] = useState('CO-I-2BFDML(V)');
  const [lens, setLens] = useState('3.6mm');

  // Fast API Products Data Cache
  const [productsList, setProductsList] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductObj, setSelectedProductObj] = useState(null);

  // Purchase Order Ideal No. (e.g. V1, V2, V3...)
  const [idealNo, setIdealNo] = useState('None');
  const [idealNoOptions, setIdealNoOptions] = useState([]);

  // Features Checkboxes
  const [features, setFeatures] = useState({
    dualLight: true,
    fullColor: false,
    ir: false,
    audio: false,
    ai: false,
  });

  // Print S/N: Prefix Options
  const [showSnPrefix, setShowSnPrefix] = useState(true);
  const [encodeSnInBarcode, setEncodeSnInBarcode] = useState(false);

  // Production Date defaults to Today's Current Date & Start Count
  const [prodDate, setProdDate] = useState(getTodayIsoDate);
  const [startCount, setStartCount] = useState(1);
  const [lastCount, setLastCount] = useState(0); // Option A: Continuous model counter

  // Full Barcode & Quantity (Supports any number: 10, 1000, 50000, etc.)
  const [startBarcode, setStartBarcode] = useState('CO-I-2BFDML(V)260108001');
  const [quantity, setQuantity] = useState(10);
  const [labelDimension, setLabelDimension] = useState('zebra_100x50'); // Default to Zebra ZD420 100mm x 50mm (4" x 2") Roll
  const [colorMode, setColorMode] = useState('full_color'); // 'full_color' | 'mono_300dpi' | 'preprinted'
  const activePreset = LABEL_PRESETS[labelDimension] || LABEL_PRESETS.zebra_100x50;
  const [printOrientation, setPrintOrientation] = useState(activePreset.orientation || 'landscape'); // 'landscape' | 'portrait'
  const [fitFullWidth, setFitFullWidth] = useState(true); // Full edge-to-edge printing with zero empty space

  // Sync orientation when user picks a preset
  const handleDimensionChange = (newDim) => {
    setLabelDimension(newDim);
    const preset = LABEL_PRESETS[newDim];
    if (preset && preset.orientation) {
      setPrintOrientation(preset.orientation);
    }
  };

  // Batch Pagination state for large quantities
  const [currentBatchPage, setCurrentBatchPage] = useState(1);

  // Company Footer
  const [companyHeader, setCompanyHeader] = useState('COLOR ON');
  const [companyName, setCompanyName] = useState('Lookman Distribution Private Limited');
  const [addressLine1, setAddressLine1] = useState('No.9/15, II Street Extn, III Main Road, CIT Nagar,');
  const [addressLine2, setAddressLine2] = useState('Nandanam, Chennai - 600 035.');
  const [country, setCountry] = useState('MADE IN INDIA');

  // States
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const [lastScannedBanner, setLastScannedBanner] = useState(null);

  const barcodeInputRef = useRef(null);

  // Fast Parallel API Loader: Fetch All Products and Purchase Order Ideal Numbers in Parallel
  const fetchAllDataQuickly = useCallback(async (isManualRefresh = false) => {
    setLoadingProducts(true);
    try {
      const [prodRes, poRes] = await Promise.allSettled([
        axios.get(PRODUCTS_API),
        axios.get(`${API_BASE}/purchase-orders`)
      ]);

      let loadedProds = [];
      if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value.data)) {
        loadedProds = prodRes.value.data;
        setProductsList(loadedProds);

        // Match current model in DB list
        const match = loadedProds.find(p => p.model && p.model.trim().toUpperCase() === modelNo.trim().toUpperCase());
        if (match) {
          setSelectedProductObj(match);
        }
      }

      if (poRes.status === 'fulfilled' && Array.isArray(poRes.value.data)) {
        const unique = [...new Set(poRes.value.data.map(o => o.idealNo).filter(Boolean))].sort();
        setIdealNoOptions(unique);
      }

      if (isManualRefresh) {
        setToast({
          open: true,
          message: `⚡ Instant API Sync: Loaded ${loadedProds.length} products & specifications!`,
          severity: 'success'
        });
      }
    } catch (err) {
      console.warn('Fast API load error:', err);
    } finally {
      setLoadingProducts(false);
    }
  }, [modelNo]);

  useEffect(() => {
    fetchAllDataQuickly(false);
  }, [fetchAllDataQuickly]);

  // Handler for quick product selection from DB Autocomplete
  const handleProductSelect = (event, selected) => {
    if (!selected) {
      setSelectedProductObj(null);
      return;
    }

    if (typeof selected === 'string') {
      const trimmed = selected.trim();
      setModelNo(trimmed);
      setSelectedProductObj({ model: trimmed });
      return;
    }

    applyProductSelection(selected);
  };

  const applyProductSelection = (prod) => {
    if (!prod) return;
    setSelectedProductObj(prod);

    const extracted = extractProductSpecs(prod);
    if (extracted.modelNo) setModelNo(extracted.modelNo);
    if (extracted.productType) setProductType(extracted.productType);
    if (extracted.resolution) setResolution(extracted.resolution);
    if (extracted.lens) setLens(extracted.lens);

    setToast({
      open: true,
      message: `⚡ Loaded DB specs for "${prod.model || prod.name}"!`,
      severity: 'success'
    });
  };

  // Derived Date Breakdown & Sequence Construction
  const { yy, dd, mm, dateCode } = formatDateCode(prodDate);
  const formattedCountStr = String(startCount || 1).length < 3
    ? String(Math.max(1, parseInt(startCount, 10) || 1)).padStart(3, '0')
    : String(startCount || 1);
  const constructedBarcode = `${modelNo.trim()}${dateCode}${formattedCountStr}`;

  // Sync startBarcode with model, date, and sequence count
  useEffect(() => {
    setStartBarcode(constructedBarcode);
  }, [constructedBarcode]);

  // Option A: Auto-fetch continuous sequence for this model from DB (never resets across dates)
  useEffect(() => {
    if (modelNo && modelNo.trim()) {
      fetchNextSequence();
    }
  }, [modelNo]);

  const fetchNextSequence = async () => {
    if (!modelNo || !modelNo.trim()) return;
    try {
      const res = await axios.post(`${INVENTORY_API}/next-sequence`, { modelNo: modelNo.trim() });
      if (res.data) {
        setLastCount(res.data.lastCount || 0);
        if (res.data.nextCount) {
          setStartCount(res.data.nextCount);
        }
        if (res.data.productType && !productType) setProductType(res.data.productType);
        if (res.data.resolution && !resolution) setResolution(res.data.resolution);
        if (res.data.lens && !lens) setLens(res.data.lens);
      }
    } catch (err) {
      // Endpoint fallback
    }
  };

  // Reset Continuous Sequence for this model back to 1
  const handleResetSequence = async () => {
    if (!modelNo || !modelNo.trim()) return;
    try {
      const res = await axios.post(`${API_BASE}/inventory/reset-sequence`, { modelNo: modelNo.trim() });
      if (res.data && res.data.success) {
        setLastCount(0);
        setStartCount(1);
        setToast({
          open: true,
          message: `✅ Model sequence for ${modelNo} has been reset to start at 1!`,
          severity: 'success'
        });
      }
    } catch (err) {
      setLastCount(0);
      setStartCount(1);
      setToast({
        open: true,
        message: `✅ Start count set to 1!`,
        severity: 'info'
      });
    }
  };

  // Range and Batch Calculations
  const totalQtyNum = Math.max(1, parseInt(quantity, 10) || 1);
  const rangeInfo = useMemo(() => getBarcodeRangeInfo(startBarcode, totalQtyNum), [startBarcode, totalQtyNum]);

  const totalBatches = Math.max(1, Math.ceil(totalQtyNum / BATCH_SIZE));
  const activeBatchPage = Math.min(currentBatchPage, totalBatches);
  const batchOffset = (activeBatchPage - 1) * BATCH_SIZE;

  // Active batch barcodes to safely render (Max 100 cards in DOM to guarantee ZERO browser crashes)
  const displayedBarcodes = useMemo(() => {
    return generateBatchSequentialBarcodes(startBarcode, BATCH_SIZE, batchOffset, totalQtyNum);
  }, [startBarcode, totalQtyNum, batchOffset]);

  const batchStartNum = batchOffset + 1;
  const batchEndNum = batchOffset + displayedBarcodes.length;

  // Validate barcode range with backend for duplicates
  useEffect(() => {
    const timer = setTimeout(() => {
      const sampleCodes = [rangeInfo.startCode, rangeInfo.endCode];
      validateBarcodeRange(sampleCodes);
    }, 400);
    return () => clearTimeout(timer);
  }, [startBarcode, quantity, rangeInfo]);

  const validateBarcodeRange = async (codes) => {
    if (!codes || codes.length === 0) return;
    setIsChecking(true);
    try {
      const res = await axios.post(`${INVENTORY_API}/check-barcodes`, { barcodes: codes });
      if (res.data && res.data.exists) {
        setDuplicateWarning(res.data.message || `Barcode range already exists (${res.data.existingBarcodes.join(', ')}). Please enter the next available barcode.`);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      setDuplicateWarning(null);
    } finally {
      setIsChecking(false);
    }
  };

  // --- Hardware Barcode Scanner Machine Listener ---
  useEffect(() => {
    let keyBuffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e) => {
      if (!e || typeof e.key !== 'string') return;

      const now = Date.now();

      // If keystroke gap > 80ms, reset buffer (human typing vs hardware scanner)
      if (now - lastKeyTime > 80) {
        keyBuffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (keyBuffer && keyBuffer.length >= 4) {
          const scannedVal = keyBuffer.trim();
          keyBuffer = '';
          handleBarcodeScanned(scannedVal);
        }
        keyBuffer = '';
        return;
      }

      if (e.key.length === 1) {
        keyBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Process scanned barcode
  const handleBarcodeScanned = async (rawScannedVal) => {
    if (!rawScannedVal) return;
    let cleanCode = rawScannedVal.trim().replace(/^(S\/N|SN)\s*:?\s*/i, '');

    setStartBarcode(cleanCode);
    setLastScannedBanner(cleanCode);

    // 1. Fast match against already-loaded products in memory (0ms latency)
    const matchedProd = productsList.find(p => p.model && cleanCode.toUpperCase().includes(p.model.toUpperCase()));
    if (matchedProd) {
      applyProductSelection(matchedProd);
      setToast({
        open: true,
        message: `📷 Scanned S/N: ${cleanCode} | Matched DB Model ${matchedProd.model}!`,
        severity: 'success'
      });
      return;
    }

    // 2. Search inventory DB to see if product info exists for this barcode
    try {
      const res = await axios.get(INVENTORY_API);
      if (res.data && Array.isArray(res.data)) {
        const found = res.data.find(inv => inv.scannedCodes && inv.scannedCodes.includes(cleanCode));
        if (found) {
          if (found.modelNo) setModelNo(found.modelNo);
          if (found.shd) {
            const shdParts = found.shd.match(/^(.*?)\s*\((.*?),\s*(.*?)\)/);
            if (shdParts) {
              setProductType(shdParts[1] || 'IP BULLET CAMERA');
              setResolution(shdParts[2] || '2MP');
              setLens(shdParts[3] || '3.6mm');
            }
          }
          setToast({
            open: true,
            message: `📷 Scanned S/N: ${cleanCode} | Database Match Found! Stickers updated for printing!`,
            severity: 'success'
          });
          return;
        }
      }
    } catch (e) {
      // Ignore DB fetch error
    }

    // Parse model & date from pattern e.g. CO-I-2BFDML(V)260108001 or CO-I-2BFDML(V)26010835000
    const match = cleanCode.match(/^(.*?)(\d{6})(\d+)$/);
    if (match) {
      const parsedModel = match[1];
      const parsedDateCode = match[2];
      const parsedCount = parseInt(match[3], 10);

      if (parsedModel) setModelNo(parsedModel);
      if (parsedCount) setStartCount(parsedCount);

      const pyy = parsedDateCode.substring(0, 2);
      const pdd = parsedDateCode.substring(2, 4);
      const pmm = parsedDateCode.substring(4, 6);
      const fullYear = `20${pyy}`;
      const isoDate = `${fullYear}-${pmm}-${pdd}`;

      if (!isNaN(new Date(isoDate).getTime())) {
        setProdDate(isoDate);
      }
    }

    setToast({
      open: true,
      message: `📷 Scanned S/N: ${cleanCode} | Set as starting serial for sticker printing!`,
      severity: 'success'
    });
  };

  const handleFeatureToggle = (key) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveToDatabase = async () => {
    if (duplicateWarning) {
      setToast({
        open: true,
        message: '⚠️ Cannot save: Barcode range contains duplicates already in database. Update date or sequence count.',
        severity: 'error'
      });
      return;
    }

    setIsSaving(true);
    try {
      // Generate all sequential barcodes for totalQtyNum to ensure full batch is saved
      const allBarcodesToSave = generateBatchSequentialBarcodes(startBarcode, totalQtyNum, 0, totalQtyNum);
      const barcodesToSend = allBarcodesToSave.length > 0 ? allBarcodesToSave : displayedBarcodes;

      const payload = {
        modelNo,
        productType,
        resolution,
        lens,
        dualLight: features.dualLight,
        features,
        startCount: parseInt(startCount, 10) || 1,
        quantity: totalQtyNum,
        barcodes: barcodesToSend
      };

      const res = await axios.post(`${INVENTORY_API}/batch-stickers`, payload);
      if (res.status === 200 || res.status === 201 || res.data.success) {
        setToast({
          open: true,
          message: `✅ Saved ${Number(totalQtyNum).toLocaleString()} serial barcodes & updated sequence counter to #${res.data.nextCount || (parseInt(startCount, 10) + totalQtyNum)}! (Recent Inward bypassed)`,
          severity: 'success'
        });
        // Auto-refresh continuous counter and advance sequence for next batch
        await fetchNextSequence();
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

  // Compute active dimensions & orientation for edge-to-edge full width printing
  const currentOrientation = printOrientation || activePreset.orientation || 'landscape';
  const isLandscape = currentOrientation === 'landscape';
  let activeWidthMm = activePreset.widthMm;
  let activeHeightMm = activePreset.heightMm;
  if (isLandscape && activeWidthMm < activeHeightMm) {
    [activeWidthMm, activeHeightMm] = [activeHeightMm, activeWidthMm];
  } else if (!isLandscape && activeWidthMm > activeHeightMm) {
    [activeWidthMm, activeHeightMm] = [activeHeightMm, activeWidthMm];
  }
  const dynamicPageSize = activePreset.id === 'a4_grid' ? 'A4 portrait' : `${activeWidthMm}mm ${activeHeightMm}mm ${currentOrientation}`;
  const dynamicCardHeight = `${activeHeightMm}mm`;

  const handlePrint = () => {
    const sheetElement = document.getElementById('printable-barcode-sheet');
    if (!sheetElement) {
      window.print();
      return;
    }

    const cardsHtml = sheetElement.innerHTML;
    const isRoll = activePreset.isRoll;
    const isCompact = activeHeightMm <= 30;
    const isStandardZebra = activeHeightMm <= 52 && !isCompact;

    const printHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>ColorOn Labels - ${activePreset.name}</title>
    <style>
      @page {
        size: ${dynamicPageSize};
        margin: ${isRoll ? '0' : '6mm 4mm'};
      }
      *, *::before, *::after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
        box-sizing: border-box !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background-color: #ffffff !important;
        width: 100% !important;
        height: 100% !important;
        font-family: Arial, Helvetica, sans-serif !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      #print-sheet-root {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        display: ${activePreset.columns === 2 ? 'grid' : 'block'} !important;
        ${activePreset.columns === 2 ? 'grid-template-columns: 1fr 1fr !important; column-gap: 2mm !important; row-gap: 2mm !important; justify-content: center !important;' : ''}
      }
      .sticker-card {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 100% !important;
        height: ${activePreset.columns === 2 ? dynamicCardHeight : '100%'} !important;
        min-height: ${activePreset.columns === 2 ? dynamicCardHeight : '100%'} !important;
        max-height: ${dynamicCardHeight} !important;
        box-sizing: border-box !important;
        border: 1.5px solid #000000 !important;
        border-radius: ${fitFullWidth ? '3px' : '6px'} !important;
        padding: ${isCompact ? '1mm 2mm' : isStandardZebra ? '2mm 3.5mm' : '3mm 4mm'} !important;
        margin: 0 !important;
        page-break-after: ${activePreset.columns === 2 ? 'auto' : 'always'} !important;
        break-after: ${activePreset.columns === 2 ? 'auto' : 'page'} !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        overflow: hidden !important;
        background-color: #ffffff !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      .sticker-card:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }
      img {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        image-rendering: -webkit-optimize-contrast !important;
      }
      svg {
        max-width: 100% !important;
      }
    </style>
  </head>
  <body>
    <div id="print-sheet-root">
      ${cardsHtml}
    </div>
  </body>
</html>`;

    try {
      let printFrame = document.getElementById('barcode-print-iframe');
      if (printFrame) {
        printFrame.remove();
      }

      printFrame = document.createElement('iframe');
      printFrame.id = 'barcode-print-iframe';
      printFrame.style.position = 'fixed';
      printFrame.style.top = '0px';
      printFrame.style.left = '0px';
      printFrame.style.width = '100vw';
      printFrame.style.height = '100vh';
      printFrame.style.border = 'none';
      printFrame.style.opacity = '0.001';
      printFrame.style.pointerEvents = 'none';
      printFrame.style.zIndex = '-99999';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow.document;
      frameDoc.open();
      frameDoc.write(printHtml);
      frameDoc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
        } catch (printErr) {
          console.warn('Iframe print error, falling back to window.print():', printErr);
          window.print();
        }
      }, 350);
    } catch (e) {
      console.warn('Print iframe error:', e);
      window.print();
    }
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-barcode-sheet');
    if (!element) return;

    let pdfFormat = [activeWidthMm, activeHeightMm];
    let orientation = currentOrientation;
    let margin = 0;

    if (activePreset.id === 'a4_grid') {
      pdfFormat = 'a4';
      orientation = 'portrait';
      margin = [6, 4, 6, 4];
    }

    const opt = {
      margin: margin,
      filename: `ColorOn_Labels_${activePreset.shortName.replace(/[^a-zA-Z0-9]/g, '_')}_Batch${activeBatchPage}_${modelNo}_${startBarcode}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 3, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: pdfFormat, orientation }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Dynamic Zebra ZD420 & A4 Print CSS with Complete Color Preservation & Edge-to-Edge Full Width */}
      <style>
        {`
          @media print {
            *, *::before, *::after {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            @page {
              size: ${dynamicPageSize};
              margin: ${activePreset.isRoll ? '0' : '6mm 4mm'};
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              width: 100% !important;
              height: 100% !important;
            }
            /* Hide non-printable app UI elements completely */
            .no-print, header, nav, aside, .MuiDrawer-root, .MuiGrid-item:first-of-type {
              display: none !important;
            }
            /* Force all parent wrappers to block with 0 margins */
            #root, #root > div, main, .MuiBox-root, .MuiGrid-container {
              display: block !important;
              position: static !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              flex: none !important;
              float: none !important;
              box-shadow: none !important;
              border: none !important;
            }
            .MuiGrid-item {
              display: block !important;
              max-width: 100% !important;
              width: 100% !important;
              flex-basis: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .preview-paper-container {
              box-shadow: none !important;
              border: none !important;
              background: transparent !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            body * {
              visibility: hidden;
            }
            #printable-barcode-sheet, #printable-barcode-sheet * {
              visibility: visible;
            }
            #printable-barcode-sheet {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              transform: none !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: transparent !important;
              background-color: transparent !important;
              box-shadow: none !important;
              border: none !important;
              max-height: none !important;
              overflow: visible !important;
              display: ${activePreset.columns === 2 ? 'grid' : 'block'} !important;
              ${activePreset.columns === 2 ? `grid-template-columns: 1fr 1fr !important; column-gap: 2mm !important; row-gap: 2mm !important; justify-content: center !important;` : ''}
            }
            .sticker-card {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 100% !important;
              height: ${activePreset.isRoll ? (activePreset.columns === 2 ? dynamicCardHeight : '100%') : dynamicCardHeight} !important;
              min-height: ${activePreset.isRoll ? (activePreset.columns === 2 ? dynamicCardHeight : '100%') : dynamicCardHeight} !important;
              max-height: ${dynamicCardHeight} !important;
              margin: 0 !important;
              border: 1.5px solid #000000 !important;
              border-radius: ${fitFullWidth ? '3px' : '6px'} !important;
              box-sizing: border-box !important;
              background-color: #ffffff !important;
              overflow: hidden !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              padding: ${activeHeightMm <= 30 ? '1mm 2mm' : activeHeightMm <= 52 ? '2mm 3.5mm' : '3mm 4mm'} !important;
              page-break-after: ${activePreset.columns === 2 ? 'auto' : 'always'} !important;
              break-after: ${activePreset.columns === 2 ? 'auto' : 'page'} !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .sticker-card:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
          }
        `}
      </style>

      {/* Top Title & Actions Bar */}
      <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: '#0f2b48', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarcodeIcon size={28} color="#0f2b48" /> Sticker Label Studio Generator
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Total: <strong>{totalQtyNum.toLocaleString()} Labels</strong> | Layout: <strong>{activePreset.name}</strong> | Mode: <strong>{colorMode === 'full_color' ? 'Full Color' : colorMode === 'mono_300dpi' ? 'Monochrome 300 DPI' : 'Pre-Printed Roll'}</strong>.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Save size={18} />}
            onClick={handleSaveToDatabase}
            disabled={isSaving}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: '#0f2b48',
              color: '#0f2b48',
              fontWeight: 600,
              px: 2,
              '&:hover': { backgroundColor: '#f1f5f9', borderColor: '#0f2b48' }
            }}
          >
            {isSaving ? 'Saving...' : 'Save to DB'}
          </Button>

          <Button
            variant="outlined"
            startIcon={<Download size={18} />}
            onClick={handleDownloadPDF}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: '#059669',
              color: '#059669',
              fontWeight: 600,
              px: 2,
              '&:hover': { backgroundColor: '#ecfdf5', borderColor: '#059669' }
            }}
          >
            Download Color PDF ({activePreset.shortName})
          </Button>

          <Button
            variant="contained"
            startIcon={<Printer size={18} />}
            onClick={handlePrint}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              backgroundColor: '#0f2b48',
              fontWeight: 600,
              px: 3,
              '&:hover': { backgroundColor: '#1e3a8a' }
            }}
          >
            {totalQtyNum <= BATCH_SIZE
              ? `Print Labels (${totalQtyNum})`
              : `Print Batch (${displayedBarcodes.length} Labels)`}
          </Button>
        </Box>
      </Box>

      {/* Scanned Barcode Active Banner */}
      {lastScannedBanner && (
        <Alert
          className="no-print"
          severity="success"
          icon={<Scan size={22} />}
          action={
            <Button color="inherit" size="small" onClick={handlePrint} sx={{ fontWeight: 800 }}>
              Print Labels Now
            </Button>
          }
          sx={{ mb: 3, borderRadius: 2, border: '1px solid #6ee7b7', backgroundColor: '#ecfdf5', color: '#065f46', fontWeight: 700 }}
        >
          📷 Scanned Barcode Machine Result: S/N {lastScannedBanner} — Stickers Generated & Ready to Print!
        </Alert>
      )}

      {/* Duplicate Warning Banner */}
      {duplicateWarning && (
        <Alert
          className="no-print"
          severity="warning"
          icon={<AlertTriangle size={22} />}
          sx={{ mb: 3, borderRadius: 2, border: '1px solid #fde047', backgroundColor: '#fefce8', fontWeight: 600 }}
        >
          {duplicateWarning}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Form Controls */}
        <Grid item xs={12} lg={5} className="no-print">
          {/* Specifications Form */}
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f2b48', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Sliders size={18} color="#0f2b48" /> Product Specifications
              </Typography>

              {/* Fast API Sync Status & Reload Action */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {loadingProducts ? (
                  <Chip
                    icon={<CircularProgress size={14} color="inherit" />}
                    label="Fetching DB Data..."
                    size="small"
                    sx={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600 }}
                  />
                ) : (
                  <Chip
                    icon={<Database size={14} color="#059669" />}
                    label={`${productsList.length} DB Products Ready`}
                    size="small"
                    sx={{ backgroundColor: '#ecfdf5', color: '#065f46', fontWeight: 700, borderColor: '#a7f3d0' }}
                    variant="outlined"
                  />
                )}

                <Tooltip title="Quick Reload all data from API">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => fetchAllDataQuickly(true)}
                      disabled={loadingProducts}
                      sx={{ color: '#0f2b48', backgroundColor: '#f1f5f9', '&:hover': { backgroundColor: '#e2e8f0' } }}
                    >
                      <RefreshCw size={15} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>

            {/* Quick Select / Search Product from Database */}
            <Box sx={{ mb: 2.5 }}>
              <Autocomplete
                freeSolo
                options={productsList}
                loading={loadingProducts}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return `${option.model || ''} - ${option.brand || ''} ${option.productDescriptions || option.category || ''}`.trim();
                }}
                value={selectedProductObj}
                onChange={handleProductSelect}
                filterOptions={(options, state) => {
                  const input = (state.inputValue || '').toUpperCase().trim();
                  if (!input) return options.slice(0, 30);
                  return options.filter(opt => {
                    const str = `${opt.model || ''} ${opt.brand || ''} ${opt.category || ''} ${opt.subCategory || ''} ${opt.productDescriptions || ''}`.toUpperCase();
                    return str.includes(input);
                  }).slice(0, 50);
                }}
                renderOption={(props, option) => (
                  <li {...props} key={option._id || option.model}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', py: 0.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Typography variant="body2" fontWeight={800} sx={{ color: '#0f2b48' }}>
                          {option.model}
                        </Typography>
                        <Chip
                          label={option.brand || 'COLOR ON'}
                          size="small"
                          sx={{ fontSize: '10px', height: '20px', fontWeight: 700, backgroundColor: '#f1f5f9' }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {option.productDescriptions || `${option.category || ''} ${option.subCategory ? `• ${option.subCategory}` : ''}`}
                      </Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="⚡ Quick Select / Search Product from DB (Auto-Fills All Specs)"
                    size="small"
                    placeholder="Search 85+ models from API (e.g. CO-I-4DFDML, SHD-NB501L, PoE...)"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingProducts ? <CircularProgress color="inherit" size={18} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Box>

            {/* All 5 Input Fields Horizontally Spanning 100% Full Width Evenly */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' }, width: '100%', alignItems: 'center' }}>
              {/* Product Type */}
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1.2 1 0' }, minWidth: 0 }}>
                <TextField
                  label="Product Type"
                  size="small"
                  fullWidth
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  placeholder="e.g. IP BULLET CAMERA"
                />
              </Box>

              {/* Resolution */}
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '0.9 1 0' }, minWidth: 0 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Resolution</InputLabel>
                  <Select
                    value={resolution}
                    label="Resolution"
                    onChange={(e) => setResolution(e.target.value)}
                  >
                    <MenuItem value="2MP">2MP</MenuItem>
                    <MenuItem value="3MP">3MP</MenuItem>
                    <MenuItem value="4MP">4MP</MenuItem>
                    <MenuItem value="5MP">5MP</MenuItem>
                    <MenuItem value="6MP">6MP</MenuItem>
                    <MenuItem value="8MP">8MP</MenuItem>
                    <MenuItem value="16MP">16MP</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Model Number */}
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1.2 1 0' }, minWidth: 0 }}>
                <TextField
                  label="Model No"
                  size="small"
                  fullWidth
                  value={modelNo}
                  onChange={(e) => setModelNo(e.target.value)}
                  placeholder="e.g. CO-I-2BFDML(V)"
                />
              </Box>

              {/* Lens */}
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' }, minWidth: 0 }}>
                <TextField
                  label="Lens Specification"
                  size="small"
                  fullWidth
                  value={lens}
                  onChange={(e) => setLens(e.target.value)}
                  placeholder="e.g. 3.6mm"
                />
              </Box>

              {/* Ideal No. (from Purchase Orders) */}
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1.2 1 0' }, minWidth: 0 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Ideal No. (Purchase Order)</InputLabel>
                  <Select
                    value={idealNo}
                    label="Ideal No. (Purchase Order)"
                    onChange={(e) => setIdealNo(e.target.value)}
                  >
                    <MenuItem value="None">None (No Badge)</MenuItem>
                    {idealNoOptions.map(opt => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Features Checkboxes — HIDDEN (display:none) */}
            <Box sx={{ display: 'none' }}>
              <Typography variant="caption" fontWeight={700} sx={{ color: '#475569', display: 'block', mb: 1 }}>
                Lighting &amp; Hardware Feature Badges:
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc' }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={features.dualLight}
                          onChange={() => handleFeatureToggle('dualLight')}
                          color="primary"
                        />
                      }
                      label={<Typography variant="body2" fontWeight={600}>☑ Dual Light</Typography>}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={features.fullColor}
                          onChange={() => handleFeatureToggle('fullColor')}
                        />
                      }
                      label={<Typography variant="body2">☐ Full Color</Typography>}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={features.ir}
                          onChange={() => handleFeatureToggle('ir')}
                        />
                      }
                      label={<Typography variant="body2">☐ IR Night Vision</Typography>}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={features.audio}
                          onChange={() => handleFeatureToggle('audio')}
                        />
                      }
                      label={<Typography variant="body2">☐ Built-in Mic</Typography>}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            {/* Print & Encode S/N Options — HIDDEN (display:none) */}
            <Box sx={{ display: 'none' }}>
              <Stack spacing={0.5}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={showSnPrefix}
                      onChange={(e) => setShowSnPrefix(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={<Typography variant="body2" fontWeight={700} sx={{ color: '#0f2b48' }}>Print "S/N:" text label below barcode</Typography>}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={encodeSnInBarcode}
                      onChange={(e) => setEncodeSnInBarcode(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={<Typography variant="body2" fontWeight={700} sx={{ color: '#0369a1' }}>Encode "S/N:" inside Barcode Lines (Types "S/N: CO-I-2BFDML(V)..." when scanned into Notepad/Excel)</Typography>}
                />
              </Stack>
            </Box>
          </Paper>

          {/* Barcode Number Structure & Sequence Generator */}
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f2b48', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Scan size={18} color="#0f2b48" /> Barcode & S/N Generation
            </Typography>

            <Grid container spacing={2}>
              {/* Production Date (Defaults to Today's Current Date) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Production Date"
                  type="date"
                  size="small"
                  fullWidth
                  value={prodDate}
                  onChange={(e) => setProdDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText={`Date Code (YYDDMM): ${dateCode}`}
                />
              </Grid>

              {/* Starting Count (e.g. 1, 35000, 50000) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Start Count (Seq No)"
                  type="number"
                  size="small"
                  fullWidth
                  value={startCount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setStartCount('');
                    } else {
                      const parsed = parseInt(val, 10);
                      if (!isNaN(parsed) && parsed >= 0) {
                        setStartCount(parsed);
                      }
                    }
                  }}
                  onBlur={() => {
                    if (!startCount || startCount < 1) setStartCount(1);
                  }}
                  placeholder="e.g. 1, 500, 35000"
                  helperText={`Formatted: ${formattedCountStr}`}
                />
              </Grid>

              {/* Barcode Breakdown Visual Box */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f0f9ff', borderColor: '#bae6fd', borderRadius: 2 }}>
                  <Typography variant="caption" fontWeight={800} sx={{ color: '#0369a1', display: 'block', mb: 1, letterSpacing: 0.5 }}>
                    BARCODE FORMAT STRUCTURE: Model + YY + DD + MM + Count
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                    <Chip label={`Model: ${modelNo}`} size="small" sx={{ fontWeight: 700, backgroundColor: '#e0f2fe', color: '#0369a1' }} />
                    <Chip label={`Year: ${yy}`} size="small" sx={{ fontWeight: 700, backgroundColor: '#dbeafe', color: '#1e40af' }} />
                    <Chip label={`Date: ${dd}`} size="small" sx={{ fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d' }} />
                    <Chip label={`Month: ${mm}`} size="small" sx={{ fontWeight: 700, backgroundColor: '#fef3c7', color: '#b45309' }} />
                    <Chip label={`Count: ${formattedCountStr}`} size="small" sx={{ fontWeight: 800, backgroundColor: '#f3e8ff', color: '#6b21a8' }} />
                  </Box>
                  <Typography variant="body2" fontWeight={800} sx={{ fontFamily: 'monospace', color: '#0f2b48', fontSize: '14px' }}>
                    Constructed Barcode (S/N): <span style={{ color: '#2563eb' }}>{constructedBarcode}</span>
                  </Typography>
                </Paper>
              </Grid>

              {/* Option A Continuous Sequence Status */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f0fdf4', borderColor: '#86efac', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="caption" fontWeight={800} sx={{ color: '#166534', letterSpacing: 0.3 }}>
                      CONTINUOUS MODEL COUNTER (Option A: Never resets across dates)
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      startIcon={<RefreshCw size={14} />}
                      onClick={handleResetSequence}
                      sx={{ textTransform: 'none', fontWeight: 700, fontSize: '11px', py: 0.2, px: 1 }}
                    >
                      Reset Count to 1
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip label={`Model: ${modelNo}`} size="small" sx={{ fontWeight: 800, backgroundColor: '#e0f2fe', color: '#0369a1' }} />
                    <Chip label={`Last Count: ${lastCount}`} size="small" sx={{ fontWeight: 700, backgroundColor: '#e2e8f0', color: '#334155' }} />
                    <Chip label={`Next Start: ${startCount || 1}`} size="small" sx={{ fontWeight: 800, backgroundColor: '#dcfce7', color: '#15803d' }} />
                    <Chip label={`Batch Range: ${startCount || 1} → ${(parseInt(startCount, 10) || 1) + totalQtyNum - 1}`} size="small" sx={{ fontWeight: 800, backgroundColor: '#fef3c7', color: '#b45309' }} />
                  </Box>
                  <Typography variant="caption" sx={{ color: '#15803d', display: 'block', fontWeight: 600 }}>
                    When you save/generate this batch, the next batch for {modelNo} will automatically continue from {(parseInt(startCount, 10) || 1) + totalQtyNum}.
                  </Typography>
                </Paper>
              </Grid>

              {/* Quantity */}
              <Grid item xs={12}>
                <TextField
                  label="Total Quantity to Generate (e.g. 10, 1000, 50000)"
                  size="small"
                  fullWidth
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setQuantity('');
                    } else {
                      const parsed = parseInt(val, 10);
                      if (!isNaN(parsed) && parsed >= 0) {
                        setQuantity(parsed);
                        setCurrentBatchPage(1);
                      }
                    }
                  }}
                  onBlur={() => {
                    if (!quantity || quantity < 1) setQuantity(1);
                  }}
                  placeholder="e.g. 10, 1000, 50000"
                  helperText="Generates continuous sequential barcode labels for this exact quantity"
                />
              </Grid>
            </Grid>

            {/* Generated Sequence Output Summary */}
            <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <Typography variant="caption" fontWeight={700} sx={{ color: '#1e40af', display: 'block' }}>
                Total Sequence Range ({Number(rangeInfo.totalCount).toLocaleString()} Labels):
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#1e3a8a', display: 'block', mt: 0.5, wordBreak: 'break-all', fontWeight: 700 }}>
                {encodeSnInBarcode || showSnPrefix ? 'S/N: ' : ''}{rangeInfo.startCode} &nbsp;→&nbsp; {encodeSnInBarcode || showSnPrefix ? 'S/N: ' : ''}{rangeInfo.endCode}
              </Typography>
            </Box>
          </Paper>

          {/* Physical Label Dimensions & Footer Info */}
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f2b48', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Maximize2 size={18} color="#0f2b48" /> Physical Label Dimensions & Company Footer
            </Typography>

            {/* Row 1: Print Layout, Orientation, Full Width Toggle, and Color Mode */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: '100%', alignItems: 'center', mb: 2 }}>
              {/* Print Layout / Paper Size */}
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1.4 1 0' }, minWidth: 0 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Print Layout / Paper Size</InputLabel>
                  <Select
                    value={labelDimension}
                    label="Print Layout / Paper Size"
                    onChange={(e) => handleDimensionChange(e.target.value)}
                  >
                    <MenuItem value="zebra_100x50">Zebra ZD420 - 100mm × 50mm (4" × 2") Roll [Standard]</MenuItem>
                    <MenuItem value="zebra_100x60">Zebra ZD420 - 100mm × 60mm (4" × 2.4") Roll [Camera Box]</MenuItem>
                    <MenuItem value="zebra_100x75">Zebra ZD420 - 100mm × 75mm (4" × 3") Roll [Large Label]</MenuItem>
                    <MenuItem value="zebra_100x150">Zebra ZD420 - 100mm × 150mm (4" × 6") Roll [Large Box / Shipping]</MenuItem>
                    <MenuItem value="zebra_2up">Zebra ZD420 - 50mm × 25mm 2-Up Roll [2 Columns Across]</MenuItem>
                    <MenuItem value="zebra_50x25">Zebra ZD420 - 50mm × 25mm (2" × 1") Single Roll</MenuItem>
                    <MenuItem value="a4_grid">A4 Sheet (2 Columns: Left & Right Stickers - 8/10 per Page)</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Print Orientation Selector */}
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' }, minWidth: 0 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Print Orientation</InputLabel>
                  <Select
                    value={printOrientation}
                    label="Print Orientation"
                    onChange={(e) => setPrintOrientation(e.target.value)}
                  >
                    <MenuItem value="landscape">Horizontal (Landscape - Best for 100×50mm)</MenuItem>
                    <MenuItem value="portrait">Vertical (Portrait - Best for 4"×6")</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Full Width Edge-to-Edge Toggle */}
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' }, minWidth: 0 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Label Fit / Margins</InputLabel>
                  <Select
                    value={fitFullWidth ? 'full' : 'standard'}
                    label="Label Fit / Margins"
                    onChange={(e) => setFitFullWidth(e.target.value === 'full')}
                  >
                    <MenuItem value="full">⚡ 100% Full Width (Edge-to-Edge, Zero Margin)</MenuItem>
                    <MenuItem value="standard">Standard Box (With Card Padding)</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Color Mode Selector */}
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1.2 1 0' }, minWidth: 0 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Color Printing Mode</InputLabel>
                  <Select
                    value={colorMode}
                    label="Color Printing Mode"
                    onChange={(e) => setColorMode(e.target.value)}
                  >
                    <MenuItem value="full_color">🎨 Full Color (Vivid Red & Green COLOR ON Logo)</MenuItem>
                    <MenuItem value="mono_300dpi">🖨️ Zebra Monochrome 300 DPI (Solid Black, No Dithering)</MenuItem>
                    <MenuItem value="preprinted">🏷️ Pre-Printed Label Roll (Hide Logo)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Row 2: Company Header & Origin */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' }, width: '100%', alignItems: 'center', mb: 2 }}>
              {/* Country of Origin */}
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '0.8 1 0' }, minWidth: 0 }}>
                <TextField
                  label="Country of Origin"
                  size="small"
                  fullWidth
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </Box>

              {/* Company Header Name */}
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1.2 1 0' }, minWidth: 0 }}>
                <TextField
                  label="Company Header Name"
                  size="small"
                  fullWidth
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </Box>

              {/* Address Line 1 */}
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' }, minWidth: 0 }}>
                <TextField
                  label="Address Line 1"
                  size="small"
                  fullWidth
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                />
              </Box>

              {/* Address Line 2 */}
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 0' }, minWidth: 0 }}>
                <TextField
                  label="Address Line 2"
                  size="small"
                  fullWidth
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                />
              </Box>
            </Box>

            {/* Zebra ZD420 & Zero Empty Space Print Guide Banner */}
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2.5,
                border: '1.5px solid #38bdf8',
                backgroundColor: '#f0f9ff',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5
              }}
            >
              <Box sx={{ color: '#0284c7', mt: 0.2 }}>
                <Printer size={22} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" fontWeight={900} sx={{ color: '#0369a1', display: 'block', fontSize: '12.5px', letterSpacing: '0.2px' }}>
                  🎯 HOW TO REMOVE ALL EMPTY SPACE IN CHROME PRINT PREVIEW:
                </Typography>
                <Typography variant="caption" sx={{ color: '#075985', display: 'block', mt: 0.7, lineHeight: 1.6, fontSize: '11.5px' }}>
                  • <strong>1. Layout:</strong> Set to <strong>"Landscape"</strong> (Stickers are 100mm wide × 50mm high. Choosing Landscape completely removes the large empty bottom space shown in Portrait mode!).<br />
                  • <strong>2. Margins:</strong> Set to <strong>"None"</strong> (Removes default 10mm white borders around edges for 100% full-width printing).<br />
                  • <strong>3. Scale:</strong> Set to <strong>100%</strong> or <strong>"Fit to printable area"</strong> (Do not shrink to 92% which leaves blank borders).<br />
                  • <strong>4. Options:</strong> <strong>Uncheck "Headers and footers"</strong> (Stops browser from adding date/URL headers that push labels down).<br />
                  • <strong>Direct Thermal Ribbon:</strong> Choose <strong>"Zebra Monochrome 300 DPI"</strong> for razor-sharp pitch-black barcodes.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Live Printable Sticker Sheet Preview (2 Columns: Left & Right) */}
        <Grid item xs={12} lg={7}>
          <Paper className="preview-paper-container" sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Eye size={20} color="#0f2b48" />
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f2b48' }}>
                  Live Printable Sticker Preview
                </Typography>
              </Box>
              <Chip
                label={`Total: ${totalQtyNum.toLocaleString()} Labels (${activePreset.shortName})`}
                size="small"
                sx={{ fontWeight: 800, backgroundColor: '#0f2b48', color: '#ffffff' }}
              />
            </Box>

            {/* Print Batch Controller for Large Quantities (Prevents browser OOM crashes) */}
            {totalQtyNum > BATCH_SIZE && (
              <Paper className="no-print" variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2, backgroundColor: '#f0fdf4', borderColor: '#86efac' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={800} sx={{ color: '#166534' }}>
                      Showing Batch {activeBatchPage} of {totalBatches.toLocaleString()} (Labels #{batchStartNum.toLocaleString()} to #{batchEndNum.toLocaleString()})
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#15803d' }}>
                      Displaying {displayedBarcodes.length} stickers in this view/print batch.
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ChevronLeft size={16} />}
                      disabled={activeBatchPage <= 1}
                      onClick={() => setCurrentBatchPage(prev => Math.max(1, prev - 1))}
                      sx={{ textTransform: 'none', borderColor: '#166534', color: '#166534' }}
                    >
                      Prev Batch
                    </Button>

                    <Chip
                      label={`Batch ${activeBatchPage} / ${totalBatches.toLocaleString()}`}
                      size="small"
                      sx={{ fontWeight: 700, backgroundColor: '#dcfce7', color: '#14532d' }}
                    />

                    <Button
                      size="small"
                      variant="outlined"
                      endIcon={<ChevronRight size={16} />}
                      disabled={activeBatchPage >= totalBatches}
                      onClick={() => setCurrentBatchPage(prev => Math.min(totalBatches, prev + 1))}
                      sx={{ textTransform: 'none', borderColor: '#166534', color: '#166534' }}
                    >
                      Next Batch
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* Sticker Grid / Roll Container */}
            <Box
              id="printable-barcode-sheet"
              sx={{
                p: 2,
                backgroundColor: '#f1f5f9',
                borderRadius: 2.5,
                border: '1px solid #cbd5e1',
                display: 'grid',
                gridTemplateColumns: activePreset.columns === 2 ? { xs: '1fr', sm: 'repeat(2, 1fr)' } : '1fr',
                gap: 2,
                maxHeight: 760,
                overflowY: 'auto'
              }}
            >
              {displayedBarcodes.map((codeVal, idx) => {
                const encodedBarcodeText = encodeSnInBarcode ? `S/N: ${codeVal}` : codeVal;
                const printedLabelText = showSnPrefix ? `S/N: ${codeVal}` : codeVal;
                const isCompact = activePreset.heightMm <= 30;
                const isStandardZebra = activePreset.heightMm <= 52 && !isCompact;

                return (
                  <div
                    key={idx}
                    className="sticker-card"
                    style={{
                      width: '100%',
                      maxWidth: activePreset.columns === 1 ? (fitFullWidth ? '100%' : '520px') : '100%',
                      minHeight: isCompact ? '130px' : isStandardZebra ? '205px' : '230px',
                      padding: isCompact ? '6px 8px' : isStandardZebra ? '8px 12px' : '10px 14px',
                      borderRadius: fitFullWidth ? '4px' : '8px',
                      border: '1.5px solid #000000',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxSizing: 'border-box',
                      fontFamily: 'Arial, sans-serif',
                      margin: fitFullWidth ? '0' : '0 auto',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {/* Top Header Row: COLOR ON Logo (Left) & Resolution / Lens (Right) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px', width: '100%' }}>
                      {/* Color On Brand Logo Component with ColorMode Support */}
                      <ColorOnBrandLogo
                        colorMode={colorMode}
                        height={isCompact ? 18 : isStandardZebra ? 23 : 27}
                      />

                      {/* Right Side: Resolution & Lens and SMART HYBRID Graphic */}
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <span
                            style={{
                              fontFamily: 'Arial Black, Arial, sans-serif',
                              fontWeight: 900,
                              fontSize: isCompact ? '12px' : isStandardZebra ? '14px' : '16px',
                              color: colorMode === 'full_color' ? '#dc2626' : '#000000',
                              lineHeight: 1
                            }}
                          >
                            {resolution}
                          </span>
                          <span
                            style={{
                              fontFamily: 'Arial, sans-serif',
                              fontWeight: 700,
                              fontSize: isCompact ? '9.5px' : isStandardZebra ? '11px' : '13px',
                              color: '#000000',
                              lineHeight: 1
                            }}
                          >
                            {lens}
                          </span>
                        </div>
                        <div style={{ marginTop: '2px' }}>
                          {features.smartHybrid !== false && (
                            <SmartHybridLogo height={isCompact ? 16 : isStandardZebra ? 20 : 23} />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Product Title & Model Row with DUAL LIGHT Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2px 0', width: '100%' }}>
                      <div style={{ minWidth: 0, paddingRight: '6px' }}>
                        <span
                          style={{
                            fontFamily: 'Arial, sans-serif',
                            fontWeight: 800,
                            fontSize: isCompact ? '9.5px' : isStandardZebra ? '10.5px' : '12px',
                            color: '#000000',
                            display: 'block',
                            textTransform: 'uppercase',
                            letterSpacing: '0.2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {productType}
                        </span>

                        <span
                          style={{
                            fontFamily: 'Arial, sans-serif',
                            fontWeight: 800,
                            fontSize: isCompact ? '9.5px' : isStandardZebra ? '10.5px' : '12px',
                            color: '#000000',
                            display: 'block',
                            marginTop: '1px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          Model:&nbsp;&nbsp;<span style={{ fontWeight: 800 }}>{modelNo}</span>
                        </span>
                      </div>

                      {/* Exact Vector SVG DUAL LIGHT Badge Graphic */}
                      {features.dualLight && (
                        <DualLightBadge
                          height={isCompact ? 13 : isStandardZebra ? 15 : 17}
                          colorMode={colorMode}
                        />
                      )}
                    </div>

                    {/* 100% Hardware Scanner Compatible Code128 Barcode Graphic */}
                    <div style={{ textAlign: 'center', margin: isCompact ? '-4px 0' : isStandardZebra ? '-4px 0' : '-6px 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                      <Code128Svg
                        code={encodedBarcodeText}
                        height={isCompact ? 20 : isStandardZebra ? 30 : 38}
                        width={isCompact ? 1.0 : isStandardZebra ? 1.25 : 1.4}
                      />
                    </div>

                    {/* Barcode Value Printed Below Barcode with S/N: Prefix */}
                    <div
                      style={{
                        fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                        fontWeight: 700,
                        fontSize: isCompact ? '10px' : isStandardZebra ? '11.5px' : '13px',
                        color: '#000000',
                        textAlign: 'center',
                        display: 'block',
                        letterSpacing: '0.6px',
                        margin: '1px 0',
                        width: '100%'
                      }}
                    >
                      {printedLabelText}
                    </div>

                    {/* Bottom Row: MADE IN INDIA & CE FC Logos */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px', width: '100%' }}>
                      <span
                        style={{
                          fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                          fontWeight: 750,
                          fontSize: isCompact ? '8.5px' : isStandardZebra ? '9.5px' : '11px',
                          color: '#000000',
                          letterSpacing: '0.3px'
                        }}
                      >
                        {country}
                      </span>

                      {/* Exact Official CE & FCC Compliance Icons */}
                      <CeFcLogos height={isCompact ? 12 : isStandardZebra ? 14 : 17} />
                    </div>

                    {/* Footer Address Block with Ideal No. Badge at Bottom-Right */}
                    <div style={{ position: 'relative', paddingTop: '3px', borderTop: '0.5px solid #cbd5e1', width: '100%' }}>
                      <span
                        style={{
                          fontFamily: 'Arial, sans-serif',
                          fontWeight: 800,
                          fontSize: isCompact ? '7.5px' : isStandardZebra ? '8.5px' : '9.5px',
                          color: '#000000',
                          display: 'block',
                          lineHeight: 1.15,
                          paddingRight: idealNo !== 'None' ? '30px' : 0
                        }}
                      >
                        {companyName}
                      </span>
                      <span
                        style={{
                          fontFamily: 'Arial, sans-serif',
                          fontWeight: 600,
                          fontSize: isCompact ? '7px' : isStandardZebra ? '8px' : '9px',
                          color: '#000000',
                          display: 'block',
                          lineHeight: 1.1,
                          paddingRight: idealNo !== 'None' ? '30px' : 0
                        }}
                      >
                        {addressLine1}
                      </span>
                      <span
                        style={{
                          fontFamily: 'Arial, sans-serif',
                          fontWeight: 600,
                          fontSize: isCompact ? '7px' : isStandardZebra ? '8px' : '9px',
                          color: '#000000',
                          display: 'block',
                          lineHeight: 1.1,
                          paddingRight: idealNo !== 'None' ? '30px' : 0
                        }}
                      >
                        {addressLine2}
                      </span>

                      {/* Ideal No. Rounded Circle Badge — Bottom-Right */}
                      {idealNo !== 'None' && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: isCompact ? '22px' : isStandardZebra ? '25px' : '28px',
                            height: isCompact ? '22px' : isStandardZebra ? '25px' : '28px',
                            borderRadius: '50%',
                            border: '1.5px solid #000000',
                            backgroundColor: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'Arial Black, sans-serif',
                              fontWeight: 900,
                              fontSize: idealNo.length > 2 ? '7px' : '8px',
                              color: '#000000',
                              lineHeight: 1,
                              textAlign: 'center',
                              letterSpacing: 0
                            }}
                          >
                            {idealNo}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4500}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })} sx={{ width: '100%', fontWeight: 600 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
