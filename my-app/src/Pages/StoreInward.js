import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Spinner from '../Components/Spinner';
import { useUser } from './UserContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  Typography,
  MenuItem,
  Grid,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Box,
  Chip,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Card,
  CardContent,
  InputAdornment,
} from '@mui/material';

import {
  ArrowDownToLine,
  ArrowUpRight,
  Package,
  AlertTriangle,
  AlertCircle,
  Layers,
  Cpu,
  Search,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  X,
  Store,
  Check,
  Copy,
  Save,
  ArrowRightLeft,
  Tag,
} from 'lucide-react';

const API_BASE = 'http://localhost:5002/api';

const makeEmptyLine = () => ({
  modelNo: '',
  salePerson: '',
  quantity: 0,
  price: 0,
  shd: '',
  scannedCodes: '',
  scannedList: [],
  isQuantityManual: false,
  lowStockWarning: '',
  category: '',
  subCategory: '',
  owner: '',
  availableBarcodes: [],
});

const sanitize = (s) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const capForLine = (ln) => {
  const q = Number(ln.quantity);
  if (ln.isQuantityManual && Number.isFinite(q) && q > 0) return q;
  return Infinity;
};

const remainingForLine = (ln) => {
  const cap = capForLine(ln);
  if (cap === Infinity) return Infinity;
  return Math.max(0, cap - (ln.scannedList?.length || 0));
};

const qtyForLine = (ln) => {
  const manual = Number(ln.quantity);
  if (!Number.isNaN(manual) && manual > 0) return manual;
  return ln.scannedList?.length || 0;
};

// Helper: split combined scanner strings
const splitBarcodes = (raw, modelNo) => {
  if (!raw) return [];
  const initialSegments = raw.split(/[,;\s\t\n]+/).map((s) => s.trim()).filter(Boolean);

  const finalCodes = [];
  for (const seg of initialSegments) {
    const matches = seg.match(/[A-Z]{2}-[A-Z0-9-_]+?\d{5,}/gi);
    if (matches && matches.length > 0) {
      finalCodes.push(...matches);
      continue;
    }

    let repeatPrefix = null;
    for (let len = 8; len >= 3; len--) {
      if (seg.length < len * 2) continue;
      const cand = seg.substring(0, len);
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
      const subSegs = seg.split(regex).map((s) => s.trim()).filter(Boolean);
      finalCodes.push(...subSegs);
    } else {
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
        subSegs = seg.split(regex).map((s) => s.trim()).filter(Boolean);
      } else if (/(?=([A-Z0-9]{2,4}-[A-Z0-9]{1,4}-))/i.test(seg)) {
        subSegs = seg.split(/(?=[A-Z0-9]{2,4}-[A-Z0-9]{1,4}-)/i).map((s) => s.trim()).filter(Boolean);
      }
      finalCodes.push(...subSegs);
    }
  }
  return finalCodes.filter((code) => code.length >= 8);
};

const AlertDialog = ({ open, onClose, title, message, actions }) => (
  <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
    <DialogTitle sx={{ fontWeight: 700, fontSize: '18px', color: '#0f2b48' }}>{title}</DialogTitle>
    <DialogContent>
      <Typography sx={{ color: '#475569', fontSize: '14px', whiteSpace: 'pre-line' }}>{message}</Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      {actions || (
        <Button onClick={onClose} variant="contained" sx={{ bgcolor: '#0f2b48', '&:hover': { bgcolor: '#1e3a8a' }, borderRadius: 2 }} autoFocus>
          OK
        </Button>
      )}
    </DialogActions>
  </Dialog>
);

function StoreInward() {
  const { user } = useUser();

  const [stockMovements, setStockMovements] = useState([]);
  const [filteredMovements, setFilteredMovements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [deleteLoading, setDeleteLoading] = useState(null);

  // Pagination (0-indexed for MUI TablePagination)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Outward dialog
  const [showOutwardDialog, setShowOutwardDialog] = useState(false);
  const [outwardError, setOutwardError] = useState('');

  // Inward dialog
  const [showInwardDialog, setShowInwardDialog] = useState(false);
  const [inwardError, setInwardError] = useState('');
  const [isAccessory, setIsAccessory] = useState(false);
  const [existingBarcodesMap, setExistingBarcodesMap] = useState({});
  const [productList, setProductList] = useState([]);
  const [lines, setLines] = useState([makeEmptyLine()]);
  const [lineErrors, setLineErrors] = useState({});
  const [globalScanned, setGlobalScanned] = useState(new Set());

  // Customers & Models for outward
  const [customerNames, setCustomerNames] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [availableModels, setAvailableModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Edit & Transfer
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  const [transferFormData, setTransferFormData] = useState({
    inwardId: '',
    modelNo: '',
    fromOwner: '',
    toOwner: '',
    quantity: 0,
    transferMethod: '',
    description: '',
    category: '',
    subCategory: '',
    productPrice: 0,
    scannedList: [],
    scannedBarcode: '',
    availableBarcodes: [],
  });

  const [editFormData, setEditFormData] = useState({
    id: '',
    modelNo: '',
    quantity: 0,
    scannedBarcode: '',
    category: '',
    subCategory: '',
    owner: '',
  });

  const [outwardFormData, setOutwardFormData] = useState({
    customerName: '',
    selectedCustomer: null,
  });

  // Alert popup
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertActions, setAlertActions] = useState(null);

  // Filters / Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategoryQuery, setSearchCategoryQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');

  // Search model popup
  const [searchResult, setSearchResult] = useState(null);
  const [showSearchDialog, setShowSearchDialog] = useState(false);

  // Categories
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  // Copied barcode feedback
  const [copiedCode, setCopiedCode] = useState('');

  // Scanner buffers
  const shdRefs = useRef({});
  const scannerBuffers = useRef({});
  const scannerTimers = useRef({});
  const transferScannerBuffer = useRef('');
  const transferScannerTimer = useRef(null);
  const linesRef = useRef(lines);
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  const showAlert = (title, message, actions = null) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertActions(actions);
    setAlertOpen(true);
  };

  const showConfirm = (title, message, onConfirm) => {
    showAlert(
      title,
      message,
      <Stack direction="row" spacing={1}>
        <Button onClick={() => setAlertOpen(false)} sx={{ color: '#64748b' }}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            setAlertOpen(false);
            onConfirm();
          }}
          variant="contained"
          color="error"
          sx={{ borderRadius: 2 }}
          autoFocus
        >
          Confirm Delete
        </Button>
      </Stack>
    );
  };

  // ===== API Calls =====
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories`);
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching categories:', e);
      setCategories([]);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/subcategories`);
      const data = await response.json();
      setSubCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching subcategories:', e);
      setSubCategories([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products`);
      const data = await response.json();
      setProductList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching products:', e);
      setProductList([]);
    }
  };

  const fetchStockMovements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const inwardResponse = await fetch(`${API_BASE}/store-inward`);
      if (!inwardResponse.ok) {
        throw new Error(`HTTP error! status: ${inwardResponse.status}`);
      }

      const inwardData = await inwardResponse.json();
      const inwardMovements = Array.isArray(inwardData)
        ? inwardData
        : inwardData?.movements || inwardData?.data || [];

      const allMovements = inwardMovements.map((m) => ({ ...m, type: 'inward' }));
      setStockMovements(allMovements);
    } catch (err) {
      setError(err?.message || 'Failed to fetch stock inward');
      console.error('Error fetching stock movements:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableModels = async () => {
    if (!user?.role) return;

    setLoadingModels(true);
    try {
      let modelsData = stockMovements;

      if (!modelsData || modelsData.length === 0) {
        const response = await fetch(`${API_BASE}/store-inward`);
        if (!response.ok) throw new Error('Failed to fetch models');
        const data = await response.json();
        modelsData = Array.isArray(data) ? data : data?.movements || data?.data || [];
      }

      let filtered = modelsData;
      if (user?.role && user?.role !== 'admin') {
        filtered = modelsData.filter(
          (m) => m.storeName?.toLowerCase() === user.role?.toLowerCase()
        );
      }

      const modelMap = new Map();

      filtered.forEach((movement) => {
        const modelNo = movement.product || movement.modelNo;
        if (!modelNo) return;

        const currentBarcodes = Array.isArray(movement.scannedBarcode)
          ? movement.scannedBarcode.map((b) => String(b).trim()).filter(Boolean)
          : typeof movement.scannedBarcode === 'string'
          ? movement.scannedBarcode.split(',').map((b) => b.trim()).filter(Boolean)
          : [];

        if (!modelMap.has(modelNo)) {
          modelMap.set(modelNo, {
            modelNo,
            price: movement.pricePerUnit || movement.price || 0,
            quantity: Number(movement.quantity) || 0,
            storeName: movement.storeName || '',
            inwardId: movement._id,
            category: movement.category || '',
            subCategory: movement.subCategory || '',
            scannedBarcode: [...currentBarcodes],
          });
        } else {
          const existing = modelMap.get(modelNo);
          existing.quantity += Number(movement.quantity) || 0;
          existing.scannedBarcode = Array.from(new Set([...existing.scannedBarcode, ...currentBarcodes]));
        }
      });

      setAvailableModels(Array.from(modelMap.values()));
    } catch (e) {
      console.error('Error fetching models:', e);
      setAvailableModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  // Initial Load
  useEffect(() => {
    if (user?._id || user?.id || user?.role) {
      fetchStockMovements();
      fetchCategories();
      fetchSubCategories();
      fetchProducts();
    }
  }, [user?._id, user?.id, user?.role, fetchStockMovements]);

  // Filter Logic
  useEffect(() => {
    if (!stockMovements) return;

    let filtered = [...stockMovements];

    const activeStore = (
      user?.assignedLocation ||
      user?.warehouseName ||
      user?.serviceCenter ||
      user?.staffLocation ||
      user?.customerStore ||
      user?.role ||
      ''
    ).toLowerCase().trim();

    const isSuperAdmin = ['admin', 'super admin', 'manager'].includes(
      (user?.role || '').toLowerCase().trim()
    );

    if (
      user?.role &&
      (!isSuperAdmin || (activeStore && !['admin', 'super admin', 'manager'].includes(activeStore)))
    ) {
      filtered = filtered.filter((mv) => {
        const store = (mv.storeName || '').toLowerCase().trim();
        return (
          store === activeStore ||
          store.includes(activeStore) ||
          activeStore.includes(store) ||
          store === (user?.role || '').toLowerCase().trim()
        );
      });
    }

    // Model Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((m) =>
        (m.product || m.modelNo || '').toLowerCase().includes(q)
      );
    }

    // Category & Sub Category Search
    if (searchCategoryQuery) {
      const q = searchCategoryQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (m) =>
          (m.category || '').toLowerCase().includes(q) ||
          (m.subCategory || '').toLowerCase().includes(q)
      );
    }

    // Owner Filter
    if (ownerFilter) {
      const q = ownerFilter.toLowerCase().trim();
      filtered = filtered.filter((m) => (m.owner || '').toLowerCase().includes(q));
    }

    // Remove products with 0 quantity from the Active Inward Table
    filtered = filtered.filter((mv) => (Number(mv.quantity) || 0) > 0);

    setFilteredMovements(filtered);
    setPage(0);
  }, [stockMovements, searchQuery, searchCategoryQuery, ownerFilter, user?.role]);

  // Customers Load
  useEffect(() => {
    const fetchCustomerNames = async () => {
      if (!user?.role) return;

      setLoadingCustomers(true);
      try {
        const response = await fetch(
          `${API_BASE}/storecustomers?storeName=${encodeURIComponent(user.role)}`
        );
        const data = await response.json();
        setCustomerNames(data?.data || []);
      } catch (e) {
        console.error('Error fetching customer data:', e);
        setCustomerNames([]);
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomerNames();
  }, [user?.role]);

  // Refresh models when outward dialog opens
  useEffect(() => {
    if (showOutwardDialog) fetchAvailableModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOutwardDialog]);

  // Stats Calculation
  const stats = useMemo(() => {
    const productMap = new Map();
    filteredMovements.forEach((item) => {
      const model = item.product || item.modelNo;
      if (!model) return;
      const qty = Number(item.quantity) || 0;
      productMap.set(model, (productMap.get(model) || 0) + qty);
    });

    let totalItems = 0;
    let lowStock = 0;
    let outOfStock = 0;
    const totalProducts = productMap.size;

    for (const qty of productMap.values()) {
      totalItems += qty;
      if (qty === 0) outOfStock++;
      else if (qty <= 5) lowStock++;
    }

    return { totalItems, totalProducts, lowStock, outOfStock };
  }, [filteredMovements]);

  // Inward Dialog Actions
  const handleInwardDialogOpen = async () => {
    setShowInwardDialog(true);
    setIsAccessory(false);
    setLines([makeEmptyLine()]);
    setLineErrors({});
    setGlobalScanned(new Set());
    setExistingBarcodesMap({});

    try {
      const currentStore = user?.role ? user.role.toLowerCase().trim() : '';

      const [dispatchRes, storeInwardRes] = await Promise.all([
        fetch(`${API_BASE}/dispatch`).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE}/store-inward`).then((r) => r.json()).catch(() => []),
      ]);

      const map = {};

      if (Array.isArray(dispatchRes)) {
        dispatchRes.forEach((disp) => {
          const matchesStore =
            currentStore && disp.storeName && disp.storeName.toLowerCase().trim() === currentStore;
          if (matchesStore && disp.barcodes) {
            const codes = Array.isArray(disp.barcodes)
              ? disp.barcodes
              : typeof disp.barcodes === 'string'
              ? disp.barcodes.split(',').map((b) => b.trim()).filter(Boolean)
              : [];
            codes.forEach((code) => {
              map[code] = disp.modelNo;
            });
          }
        });
      }

      const storeInwardMovements = Array.isArray(storeInwardRes)
        ? storeInwardRes
        : storeInwardRes?.movements || storeInwardRes?.data || [];
      if (Array.isArray(storeInwardMovements)) {
        storeInwardMovements.forEach((storeInv) => {
          const matchesStore =
            currentStore && storeInv.storeName && storeInv.storeName.toLowerCase().trim() === currentStore;
          if (matchesStore && storeInv.scannedBarcode) {
            const codes = Array.isArray(storeInv.scannedBarcode)
              ? storeInv.scannedBarcode
              : typeof storeInv.scannedBarcode === 'string'
              ? storeInv.scannedBarcode.split(',').map((b) => b.trim()).filter(Boolean)
              : [];
            codes.forEach((code) => {
              map[code] = storeInv.modelNo;
            });
          }
        });
      }

      setExistingBarcodesMap(map);
    } catch (err) {
      console.error('Error fetching existing inventory barcodes:', err);
    }
  };

  const handleInwardDialogClose = () => {
    setShowInwardDialog(false);
    setInwardError('');
  };

  // Outward Dialog Actions
  const handleOutwardDialogOpen = () => {
    setShowOutwardDialog(true);
    setLines([makeEmptyLine()]);
    setLineErrors({});
    setGlobalScanned(new Set());
    setOutwardError('');
    setOutwardFormData({ customerName: '', selectedCustomer: null });
  };

  const handleOutwardDialogClose = () => {
    setShowOutwardDialog(false);
    setOutwardError('');
  };

  // Line Handlers
  const setLineValue = (idx, field, value) => {
    setLines((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
    const key = `l${idx}_${field}`;
    if (lineErrors[key]) setLineErrors((e) => ({ ...e, [key]: '' }));
  };

  const addLine = () => {
    setLines((prev) => [...prev, makeEmptyLine()]);
  };

  const removeLine = (idx) => {
    setLines((prev) => {
      const target = prev[idx];
      if (target?.scannedList?.length) {
        setGlobalScanned((gs) => {
          const ns = new Set(gs);
          target.scannedList.forEach((c) => ns.delete(c));
          return ns;
        });
      }
      const next = prev.slice(0, idx).concat(prev.slice(idx + 1));
      return next.length ? next : [makeEmptyLine()];
    });
  };

  const recomputeLowStock = (idx, modelName) => {
    const normalizedModel = (modelName || '').toLowerCase().trim();

    const p = productList.find((m) => (m.model || '').toLowerCase().trim() === normalizedModel);
    const invItem = stockMovements.find(
      (item) => (item.modelNo || item.product || '').toLowerCase().trim() === normalizedModel
    );

    const foundCategory = p?.category || invItem?.category || '';
    const foundSubCategory = p?.subCategory || invItem?.subCategory || '';
    setLineValue(idx, 'category', foundCategory);
    setLineValue(idx, 'subCategory', foundSubCategory);

    const stock = p?.reorderLevel ?? 0;
    const text = stock <= 5 ? `Low stock: ${stock}` : '';
    setLineValue(idx, 'lowStockWarning', text);
  };

  // Barcode Processing for Inward
  const handleInwardScanKeyDown = (e, idx) => {
    if (!scannerBuffers.current[idx]) scannerBuffers.current[idx] = '';
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = scannerBuffers.current[idx] || e.target.value;
      if (code) {
        setLineValue(idx, 'shd', code);
        processInwardBarcode(idx, code);
      }
      scannerBuffers.current[idx] = '';
      return;
    }
    if (e.key.length === 1) {
      scannerBuffers.current[idx] += e.key;
    }
    clearTimeout(scannerTimers.current[idx]);
    scannerTimers.current[idx] = setTimeout(() => {
      const code = scannerBuffers.current[idx] || e.target.value;
      if (code) {
        setLineValue(idx, 'shd', code);
        processInwardBarcode(idx, code);
      }
      scannerBuffers.current[idx] = '';
    }, 200);
  };

  const processInwardBarcode = (idx, overrideRaw) => {
    const ln = linesRef.current[idx];
    if (!ln) return;
    const rawInput = (overrideRaw || ln?.shd || '').trim();
    if (!rawInput) return;
    if (!ln.modelNo) {
      showAlert('Error', 'Enter Model No for this row first');
      setLineErrors((e) => ({ ...e, [`l${idx}_modelNo`]: 'Model No is required' }));
      return;
    }

    const barcodes = splitBarcodes(rawInput, ln.modelNo);
    if (barcodes.length === 0) return;

    setLines((prev) => {
      const arr = [...prev];
      const L = { ...arr[idx] };
      const currentList = L.scannedList || [];
      const nextList = [...currentList];
      const cap = capForLine(L);

      let addedCount = 0;
      const duplicateBarcodes = [];
      const dbExistBarcodes = [];

      for (const code of barcodes) {
        if (cap !== Infinity && nextList.length >= cap) {
          break;
        }

        if (existingBarcodesMap[code]) {
          dbExistBarcodes.push({ code, modelNo: existingBarcodesMap[code] });
          continue;
        }

        if (globalScanned.has(code) || nextList.includes(code)) {
          duplicateBarcodes.push(code);
          continue;
        }

        nextList.push(code);
        addedCount++;

        setGlobalScanned((prevSet) => {
          const ns = new Set(prevSet);
          ns.add(code);
          return ns;
        });
      }

      if (dbExistBarcodes.length > 0) {
        setTimeout(() => {
          const msg = `This Serial Number already exists in ${dbExistBarcodes[0].modelNo}`;
          setLineErrors((e) => ({ ...e, [`l${idx}_shd`]: msg }));
          dbExistBarcodes.forEach(({ code, modelNo }) => {
            showAlert('Error', `Barcode ${code} already exists in model ${modelNo}`);
          });
        }, 0);
      } else if (duplicateBarcodes.length > 0) {
        setTimeout(() => {
          showAlert('Error', `Duplicate barcodes ignored: ${duplicateBarcodes.join(', ')}`);
        }, 0);
      }

      L.scannedList = nextList;
      L.scannedCodes = nextList.join(', ');
      if (!L.isQuantityManual) L.quantity = nextList.length;
      L.shd = '';
      arr[idx] = L;
      return arr;
    });

    setLineErrors((e) => {
      const next = { ...e };
      delete next[`l${idx}_shd`];
      return next;
    });
  };

  const validateInwardForm = () => {
    const eLine = {};
    let ok = true;

    if (lines.length === 0) {
      showAlert('Error', 'Add at least one model row');
      return false;
    }

    lines.forEach((ln, i) => {
      const key = (f) => `l${i}_${f}`;

      if (!ln.modelNo) {
        eLine[key('modelNo')] = 'Model No is required';
        ok = false;
      }

      if (!ln.category) {
        eLine[key('category')] = 'Category is required';
        ok = false;
      }

      const qty = qtyForLine(ln);
      if (qty <= 0) {
        eLine[key('quantity')] = 'Quantity must be greater than 0';
        ok = false;
      }

      if (!ln.price || Number(ln.price) <= 0) {
        eLine[key('price')] = 'Price per Unit is required and must be > 0';
        ok = false;
      }

      if (user?.role === 'CCTV Shoppee Avadi' && !ln.owner) {
        eLine[key('owner')] = 'Owner is required';
        ok = false;
      }

      if (!ln.scannedList || ln.scannedList.length === 0) {
        eLine[key('shd')] = 'At least one barcode must be scanned';
        ok = false;
      } else if (ln.scannedList.length !== qty) {
        eLine[key('scannedCodes')] = `Scanned count (${ln.scannedList.length}) must match Quantity (${qty})`;
        ok = false;
      }
    });

    setLineErrors(eLine);
    return ok;
  };

  const handleInwardSubmit = async () => {
    if (!validateInwardForm()) {
      showAlert('Error', 'Please fix the errors before submitting!');
      return;
    }

    try {
      setLoading(true);

      for (const ln of lines) {
        if (!ln.modelNo || qtyForLine(ln) <= 0) continue;

        const qty = qtyForLine(ln);
        const product = productList.find((p) => p.model === ln.modelNo);

        const inwardPayload = {
          modelNo: ln.modelNo,
          quantity: qty,
          pricePerUnit: Number(ln.price) || 0,
          storeName: user?.role || 'JAIPUR',
          userId: user?.id || user?._id || 'unknown-user',
          scannedBarcode: Array.isArray(ln.scannedList)
            ? ln.scannedList
            : ln.scannedCodes
            ? ln.scannedCodes.split(',')
            : [],
          brand: product?.brand || '',
          category: isAccessory ? 'Accessories' : ln.category || product?.category || '',
          subCategory: isAccessory ? 'Accessories' : ln.subCategory || product?.subCategory || '',
          mrp: product?.mrp || 0,
          dealerPrice: product?.dealerPrice || 0,
          owner: ln.owner || '',
          isAccessory: !!isAccessory,
        };

        const response = await fetch(`${API_BASE}/store-inward`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inwardPayload),
        });

        const resData = await response.json();
        if (!resData.success) {
          showAlert('Error', `Failed to save ${ln.modelNo}: ${resData.error || 'Unknown error'}`);
        }
      }

      showAlert('Success', 'Stock inward recorded successfully!');
      handleInwardDialogClose();
      await fetchStockMovements();
    } catch (err) {
      console.error('Inward Error:', err);
      showAlert('Error', 'Failed to submit stock inward!');
    } finally {
      setLoading(false);
    }
  };

  // Outward Logic
  const handleModelSelect = (idx, selectedModelNo) => {
    const selectedModel = availableModels.find((m) => m.modelNo === selectedModelNo);

    setLines((prev) => {
      const next = [...prev];
      if (selectedModel) {
        const availableBarcodes = Array.isArray(selectedModel.scannedBarcode)
          ? selectedModel.scannedBarcode.map((b) => String(b).trim()).filter(Boolean)
          : typeof selectedModel.scannedBarcode === 'string'
          ? selectedModel.scannedBarcode.split(',').map((b) => b.trim()).filter(Boolean)
          : [];

        next[idx] = {
          ...next[idx],
          modelNo: selectedModel.modelNo,
          price: selectedModel.price,
          quantity: selectedModel.quantity,
          category: selectedModel.category,
          subCategory: selectedModel.subCategory,
          isQuantityManual: true,
          availableBarcodes,
        };
      } else {
        next[idx] = { ...next[idx], modelNo: selectedModelNo, isQuantityManual: true };
      }
      return next;
    });
  };

  const handleScanKeyDown = (e, idx) => {
    if (!scannerBuffers.current[idx]) scannerBuffers.current[idx] = '';

    if (e.key === 'Enter') {
      e.preventDefault();
      const code = scannerBuffers.current[idx] || e.target.value;
      scannerBuffers.current[idx] = '';
      clearTimeout(scannerTimers.current[idx]);
      if (code) processBarcode(idx, code);
      return;
    }

    if (e.key.length === 1) {
      scannerBuffers.current[idx] += e.key;
    }

    clearTimeout(scannerTimers.current[idx]);
    scannerTimers.current[idx] = setTimeout(() => {
      const code = scannerBuffers.current[idx];
      scannerBuffers.current[idx] = '';
      if (code) processBarcode(idx, code);
    }, 300);
  };

  const processBarcode = (idx, overrideRaw) => {
    const ln = linesRef.current[idx];
    if (!ln) return;

    const raw = (overrideRaw || ln?.shd || '').trim();
    if (!raw) return;

    if (!ln.modelNo) {
      setLineErrors((e) => ({ ...e, [`l${idx}_modelNo`]: 'Model No is required' }));
      return;
    }

    // 1. Strict S/N Verification: Check if scanned barcode belongs to the selected Model No
    const selectedModel = availableModels.find((m) => m.modelNo === ln.modelNo);
    const validModelBarcodes = (selectedModel?.scannedBarcode || ln.availableBarcodes || []).map((b) =>
      String(b).trim().toLowerCase()
    );

    if (validModelBarcodes.length > 0) {
      const isMatch = validModelBarcodes.includes(raw.toLowerCase());
      if (!isMatch) {
        // Check if it belongs to another model in inventory
        const otherModel = availableModels.find((m) =>
          (m.scannedBarcode || []).some((b) => String(b).trim().toLowerCase() === raw.toLowerCase())
        );

        const errorMsg = otherModel
          ? `Scanned S/N "${raw}" belongs to Model "${otherModel.modelNo}", NOT "${ln.modelNo}"!`
          : `Scanned S/N "${raw}" does NOT match any available serial number for Model "${ln.modelNo}"!`;

        setLineErrors((e) => ({ ...e, [`l${idx}_shd`]: errorMsg }));
        setLineValue(idx, 'shd', '');
        return;
      }
    } else {
      // If selected model has no barcodes, check if this barcode belongs to another model in store
      const otherModel = availableModels.find(
        (m) =>
          m.modelNo !== ln.modelNo &&
          (m.scannedBarcode || []).some((b) => String(b).trim().toLowerCase() === raw.toLowerCase())
      );
      if (otherModel) {
        const errorMsg = `Scanned S/N "${raw}" belongs to Model "${otherModel.modelNo}", NOT "${ln.modelNo}"!` ;
        setLineErrors((e) => ({ ...e, [`l${idx}_shd`]: errorMsg }));
        setLineValue(idx, 'shd', '');
        return;
      }
    }

    // 2. Check duplicates in this row
    if (ln.scannedList?.some((s) => s.trim().toLowerCase() === raw.toLowerCase())) {
      setLineErrors((e) => ({ ...e, [`l${idx}_shd`]: 'This barcode is already scanned in this row' }));
      setLineValue(idx, 'shd', '');
      return;
    }

    // 3. Check duplicates across other rows
    if (globalScanned.has(raw)) {
      setLineErrors((e) => ({ ...e, [`l${idx}_shd`]: 'Already scanned in another row' }));
      setLineValue(idx, 'shd', '');
      return;
    }

    setGlobalScanned((gs) => {
      const ns = new Set(gs);
      ns.add(raw);
      return ns;
    });

    const cap = capForLine(ln);
    if (cap !== Infinity && (ln.scannedList?.length || 0) >= cap) {
      setLineErrors((e) => ({ ...e, [`l${idx}_shd`]: `Target quantity of ${cap} already reached for this row` }));
      setLineValue(idx, 'shd', '');
      return;
    }

    setLines((prev) => {
      const arr = [...prev];
      const L = { ...arr[idx] };
      const _cap = capForLine(L);
      const currentLen = L.scannedList?.length || 0;
      if (_cap !== Infinity && currentLen >= _cap) return arr;

      const nextList = [...(L.scannedList || []), raw];
      if (_cap !== Infinity && nextList.length > _cap) return arr;

      L.scannedList = nextList;
      L.scannedCodes = nextList.join(', ');
      if (!L.isQuantityManual) L.quantity = nextList.length;
      L.shd = '';
      arr[idx] = L;
      return arr;
    });

    setLineErrors((e) => {
      const next = { ...e };
      delete next[`l${idx}_shd`];
      return next;
    });
  };

  const validateOutwardForm = () => {
    const eLine = {};
    let ok = true;

    if (lines.length === 0) {
      showAlert('Error', 'Add at least one model row');
      return false;
    }

    lines.forEach((ln, i) => {
      const key = (f) => `l${i}_${f}`;

      if (!ln.modelNo) {
        eLine[key('modelNo')] = 'Model No is required';
        ok = false;
      }

      const qty = qtyForLine(ln);
      if (qty <= 0) {
        eLine[key('quantity')] = 'Enter a quantity > 0 or scan at least one code';
        ok = false;
      }

      if (!ln.price || Number(ln.price) <= 0) {
        eLine[key('price')] = 'Price is required';
        ok = false;
      }

      if (!ln.salePerson || !ln.salePerson.trim()) {
        eLine[key('salePerson')] = 'Sale Person is required';
        ok = false;
      }

      if (!ln.scannedList || ln.scannedList.length === 0) {
        eLine[key('shd')] = 'At least one barcode must be scanned';
        ok = false;
      } else if ((ln.scannedList?.length || 0) !== qty) {
        eLine[key('scannedCodes')] = `Scanned count (${ln.scannedList?.length || 0}) must match Quantity (${qty})`;
        ok = false;
      }
    });

    setLineErrors(eLine);
    return ok;
  };

  const updateStockInwardAfterOutward = async (modelNo, outwardQuantity, scannedBarcodes) => {
    const storeFilter = user?.role && user?.role !== 'admin' ? user.role.toLowerCase().trim() : null;

    const inwardRecords = stockMovements.filter((movement) => {
      const movementModelNo = movement.product || movement.modelNo;
      const storeMatch = storeFilter
        ? (movement.storeName || '').toLowerCase().trim() === storeFilter
        : true;
      return (
        movementModelNo &&
        movementModelNo.toLowerCase().trim() === (modelNo || '').toLowerCase().trim() &&
        storeMatch
      );
    });

    if (inwardRecords.length === 0) return;

    let remainingQuantity = Number(outwardQuantity) || 0;
    const barcodesToRemove = new Set((scannedBarcodes || []).map((b) => String(b).trim().toLowerCase()));
    const sorted = inwardRecords.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    for (const record of sorted) {
      if (remainingQuantity <= 0 && barcodesToRemove.size === 0) break;

      const currentQuantity = Number(record.quantity) || 0;

      let currentBarcodes = [];
      if (record.scannedBarcode) {
        if (Array.isArray(record.scannedBarcode)) currentBarcodes = [...record.scannedBarcode];
        else if (typeof record.scannedBarcode === 'string') {
          currentBarcodes = record.scannedBarcode.split(',').map((b) => b.trim()).filter(Boolean);
        }
      }

      let updatedQuantity = currentQuantity;
      let updatedBarcodes = [...currentBarcodes];

      if (barcodesToRemove.size > 0 && currentBarcodes.length > 0) {
        const before = updatedBarcodes.length;
        updatedBarcodes = updatedBarcodes.filter(
          (b) => !barcodesToRemove.has(String(b).trim().toLowerCase())
        );
        const removed = before - updatedBarcodes.length;

        if (removed > 0) {
          updatedQuantity = Math.max(0, updatedQuantity - removed);
          remainingQuantity = Math.max(0, remainingQuantity - removed);
        }
      }

      if (remainingQuantity > 0 && updatedQuantity > 0) {
        const reduce = Math.min(remainingQuantity, updatedQuantity);
        updatedQuantity -= reduce;
        remainingQuantity -= reduce;
      }

      if (updatedQuantity <= 0) {
        // Quantity is 0 -> delete this Store Inward record completely
        try {
          await fetch(`${API_BASE}/store-inward/${record._id}`, {
            method: 'DELETE',
          });
        } catch (delErr) {
          console.error('Error deleting 0-quantity Store Inward record:', delErr);
        }
      } else {
        const updateData = {
          quantity: updatedQuantity,
          scannedBarcode: updatedBarcodes,
        };

        try {
          await fetch(`${API_BASE}/store-inward/stock-inward/${record._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          });
        } catch (putErr) {
          console.error('Error updating Store Inward record:', putErr);
        }
      }
    }
  };

  const handleOutwardSubmit = async () => {
    if (!validateOutwardForm()) {
      showAlert('Error', 'Please fix the errors before submitting!');
      return;
    }

    if (!outwardFormData.customerName || !outwardFormData.selectedCustomer) {
      showAlert('Error', 'Please select a customer!');
      return;
    }

    try {
      setLoading(true);
      const results = [];
      const inwardUpdates = [];

      for (const ln of lines) {
        if (!ln.modelNo || qtyForLine(ln) <= 0) continue;

        const outwardQuantity = qtyForLine(ln);
        const scannedBarcodes = ln.scannedList || [];

        const outwardData = {
          modelNo: ln.modelNo,
          quantity: outwardQuantity,
          reason: 'Store Inward',
          userId: user?._id || user?.id || 'unknown-user',
          storeName: user?.role || 'ADMIN',
          customerName: outwardFormData.customerName,
          customerMobile: outwardFormData.selectedCustomer?.phoneNo || '',
          customerAddress: outwardFormData.selectedCustomer?.address || '',
          scannedCodes: ln.scannedCodes || '',
          scannedList: ln.scannedList || [],
          price: Number(ln.price) || 0,
          salePerson: ln.salePerson || '',
          category: ln.category || '',
          subCategory: ln.subCategory || '',
        };

        const response = await fetch(`${API_BASE}/stores-outward`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(outwardData),
        });

        const result = await response.json();
        results.push(result);

        if (result?.success) {
          inwardUpdates.push({
            modelNo: ln.modelNo,
            quantity: outwardQuantity,
            scannedBarcodes,
          });
        }
      }

      const allSuccess = results.every((r) => r?.success);
      if (allSuccess) {
        for (const update of inwardUpdates) {
          await updateStockInwardAfterOutward(update.modelNo, update.quantity, update.scannedBarcodes);
        }
        showAlert('Success', 'Stock outward successful! Stock inward records updated.');
        handleOutwardDialogClose();
        await fetchStockMovements();
      } else {
        const errors = results.filter((r) => !r?.success).map((r) => r?.error).filter(Boolean);
        setOutwardError(`Some items failed: ${errors.join(', ')}`);
        showAlert('Error', `Some items failed to save: ${errors.join(', ')}`);
      }
    } catch (err) {
      console.error('Error submitting stock outward:', err);
      setOutwardError(err?.message || 'Submit failed');
      showAlert('Error', `Error submitting stock outward: ${err?.message || 'Submit failed'}`);
    } finally {
      setLoading(false);
    }
  };

  // Edit Dialog Handlers
  const handleEditOpen = (movement) => {
    setEditFormData({
      id: movement._id,
      modelNo: movement.product || movement.modelNo || '',
      quantity: movement.quantity || 0,
      scannedBarcode: Array.isArray(movement.scannedBarcode)
        ? movement.scannedBarcode.join(', ')
        : movement.scannedBarcode || '',
      category: movement.category || '',
      subCategory: movement.subCategory || 'None',
      owner: movement.owner || '',
    });
    setShowEditDialog(true);
  };

  const handleEditClose = () => {
    setShowEditDialog(false);
    setEditFormData({ id: '', modelNo: '', quantity: 0, scannedBarcode: '', category: '', subCategory: '', owner: '' });
  };

  const handleEditSubmit = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/store-inward/stock-inward/${editFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: Number(editFormData.quantity),
          scannedBarcode: editFormData.scannedBarcode,
          category: editFormData.category,
          subCategory: editFormData.subCategory,
          owner: editFormData.owner,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (result?.success) {
        showAlert('Success', 'Stock inward record updated successfully!');
        handleEditClose();
        fetchStockMovements();
      } else {
        throw new Error(result?.error || 'Failed to update record');
      }
    } catch (err) {
      console.error('Error updating stock movement:', err);
      showAlert('Error', `Error updating record: ${err?.message || 'Update failed'}`);
    } finally {
      setLoading(false);
    }
  };

  // Self Transfer Handlers
  const handleTransferOpen = (movement) => {
    const availableBarcodes = Array.isArray(movement.scannedBarcode)
      ? movement.scannedBarcode.map((b) => String(b).trim()).filter(Boolean)
      : typeof movement.scannedBarcode === 'string'
      ? movement.scannedBarcode.split(',').map((b) => b.trim()).filter(Boolean)
      : [];

    setTransferFormData({
      inwardId: movement._id,
      modelNo: movement.product || movement.modelNo || '',
      fromOwner: movement.owner || 'N/A',
      toOwner: '',
      quantity: movement.quantity || 0,
      transferMethod: 'In Hand',
      description: '',
      category: movement.category || '',
      subCategory: movement.subCategory || '',
      productPrice: movement.pricePerUnit || 0,
      scannedList: [],
      scannedBarcode: '',
      availableBarcodes,
    });

    setShowTransferDialog(true);
  };

  const handleTransferClose = () => setShowTransferDialog(false);

  const processTransferBarcode = (overrideRaw) => {
    const raw = (overrideRaw || transferFormData.scannedBarcode || '').trim();
    if (!raw) return;

    if (!transferFormData.modelNo) {
      showAlert('Error', 'Model No is missing');
      return;
    }

    if (transferFormData.scannedList.includes(raw)) {
      showAlert('Error', 'This barcode is already scanned');
      setTransferFormData((p) => ({ ...p, scannedBarcode: '' }));
      return;
    }

    const limit = Number(transferFormData.quantity);
    if (limit > 0 && transferFormData.scannedList.length >= limit) {
      showAlert('Info', `Quantity limit reached: ${limit}`);
      setTransferFormData((p) => ({ ...p, scannedBarcode: '' }));
      return;
    }

    if (transferFormData.availableBarcodes.length > 0) {
      if (!transferFormData.availableBarcodes.includes(raw)) {
        showAlert('Error', 'Scanned barcode not found in this stock record');
        setTransferFormData((p) => ({ ...p, scannedBarcode: '' }));
        return;
      }
    }

    setTransferFormData((prev) => ({
      ...prev,
      scannedList: [...prev.scannedList, raw],
      scannedBarcode: '',
    }));
  };

  const handleTransferScanKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = transferScannerBuffer.current;
      if (code) processTransferBarcode(code);
      transferScannerBuffer.current = '';
      return;
    }

    if (e.key.length === 1) transferScannerBuffer.current += e.key;

    clearTimeout(transferScannerTimer.current);
    transferScannerTimer.current = setTimeout(() => {
      const code = transferScannerBuffer.current;
      if (code) processTransferBarcode(code);
      transferScannerBuffer.current = '';
    }, 200);
  };

  const handleTransferSubmit = async () => {
    if (!transferFormData.toOwner || !transferFormData.quantity || !transferFormData.transferMethod) {
      showAlert('Error', 'Please fill all required fields');
      return;
    }

    const q = Number(transferFormData.quantity) || 0;
    if (q > 0 && transferFormData.scannedList.length !== q) {
      showAlert('Error', `Scanned count (${transferFormData.scannedList.length}) must match Quantity (${q})`);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...transferFormData,
        scannedBarcode: transferFormData.scannedList,
        userId: user?._id || user?.id || 'system',
        storeName: user?.role || 'Admin',
      };

      const response = await fetch(`${API_BASE}/self-transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (result?.success) {
        showAlert('Success', 'Stock transferred successfully! Original inward record updated.');
        handleTransferClose();
        fetchStockMovements();
      } else {
        throw new Error(result?.error || 'Failed to transfer stock');
      }
    } catch (err) {
      console.error('Error during self transfer:', err);
      showAlert('Error', `Transfer failed: ${err?.message || 'Transfer failed'}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete Handlers
  const handleDelete = async (movement) => {
    showConfirm(
      'Confirm Delete',
      `Are you sure you want to delete this stock inward record?\n\nModel: ${movement.modelNo || movement.product}\nQuantity: ${movement.quantity}\nStore: ${movement.storeName}`,
      async () => {
        try {
          setDeleteLoading(movement._id);

          const response = await fetch(`${API_BASE}/store-inward/${movement._id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

          const result = await response.json();
          if (result?.success) {
            setFilteredMovements((prev) => prev.filter((item) => item._id !== movement._id));
            setStockMovements((prev) => prev.filter((item) => item._id !== movement._id));
            showAlert('Success', 'Stock inward record deleted successfully!');
          } else {
            throw new Error(result?.error || 'Failed to delete record');
          }
        } catch (err) {
          console.error('Error deleting stock movement:', err);
          showAlert('Error', `Error deleting record: ${err?.message || 'Delete failed'}`);
        } finally {
          setDeleteLoading(null);
        }
      }
    );
  };

  // Search Model Modal
  const handleSearchModel = () => {
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim().toLowerCase();

    const matches = filteredMovements.filter((item) => {
      const p = (item.product || item.modelNo || '').toLowerCase();
      return p === query;
    });

    const totalQty = matches.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    setSearchResult({
      model: searchQuery,
      count: matches.length,
      totalQuantity: totalQty,
    });
    setShowSearchDialog(true);
  };

  // Copy to clipboard helper
  const handleCopyBarcode = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // UI States
  if (loading && stockMovements.length === 0) {
    return (
      <Box sx={{ p: 4, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
        <Spinner message="Loading stock inward details..." />
      </Box>
    );
  }

  if (error && stockMovements.length === 0) {
    return (
      <Box sx={{ p: 4, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #fee2e2', bgcolor: '#ffffff', textAlign: 'center', maxWidth: 450 }}>
          <AlertCircle size={48} color="#dc2626" style={{ margin: '0 auto 16px' }} />
          <Typography variant="h6" fontWeight={700} color="#1f2937">Failed to Load Data</Typography>
          <Typography variant="body2" color="#64748b" sx={{ mt: 1, mb: 3 }}>{error}</Typography>
          <Button variant="contained" onClick={fetchStockMovements} startIcon={<RefreshCw size={16} />} sx={{ bgcolor: '#0f2b48' }}>
            Retry
          </Button>
        </Paper>
      </Box>
    );
  }

  // Pagination Slice
  const currentItems = filteredMovements.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      <AlertDialog
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        title={alertTitle}
        message={alertMessage}
        actions={alertActions}
      />

      {/* 1. Header & Quick Actions Toolbar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', lg: 'center' },
          gap: 2.5,
          mb: 3.5,
        }}
      >
        {/* Left: Title & Store context */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2.5,
              backgroundColor: '#0f2b48',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(15, 43, 72, 0.25)',
              flexShrink: 0,
            }}
          >
            <ArrowDownToLine size={24} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Stock Inward Details
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mt: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#10b981',
                  boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)',
                }}
              />
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>
                {user?.role === 'admin'
                  ? 'Showing all store inward inventory'
                  : `Showing stock inward inventory for ${user?.role || 'Current Store'}`}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right: Actions, Filters, Searches */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems="center"
          flexWrap="wrap"
          sx={{ width: { xs: '100%', lg: 'auto' } }}
        >
          {/* Stock Inward Button */}
          <Button
            variant="contained"
            onClick={handleInwardDialogOpen}
            startIcon={<ArrowDownToLine size={17} />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '13.5px',
              backgroundColor: '#0f2b48',
              px: 2.4,
              py: 1,
              '&:hover': { backgroundColor: '#1e3a8a' },
              boxShadow: '0 4px 12px rgba(15, 43, 72, 0.2)',
            }}
          >
            Stock Inward
          </Button>

          {/* Stock Outward Button */}
          <Button
            variant="contained"
            color="error"
            onClick={handleOutwardDialogOpen}
            startIcon={<ArrowUpRight size={17} />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '13.5px',
              backgroundColor: '#dc2626',
              px: 2.4,
              py: 1,
              '&:hover': { backgroundColor: '#b91c1c' },
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
            }}
          >
            Stock Outward
          </Button>

          {/* Owner Filter (Role-specific) */}
          {user?.role === 'CCTV Shoppee Avadi' && (
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel id="owner-filter-label" sx={{ fontSize: '13px' }}>Filter by Owner</InputLabel>
              <Select
                labelId="owner-filter-label"
                value={ownerFilter}
                label="Filter by Owner"
                onChange={(e) => setOwnerFilter(e.target.value)}
                sx={{ borderRadius: 2, backgroundColor: '#ffffff', fontSize: '13px', height: 40 }}
              >
                <MenuItem value=""><em>All Owners</em></MenuItem>
                <MenuItem value="CCTV Shoppee Avadi">CCTV Shoppee Avadi</MenuItem>
                <MenuItem value="Lookman CCTV Avadi">Lookman CCTV Avadi</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Category / Sub-Category Search */}
          <TextField
            size="small"
            placeholder="Category / Sub-Category..."
            value={searchCategoryQuery}
            onChange={(e) => setSearchCategoryQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} color="#94a3b8" />
                </InputAdornment>
              ),
              endAdornment: searchCategoryQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchCategoryQuery('')}>
                    <X size={14} />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: { borderRadius: 2, backgroundColor: '#ffffff', height: 40, fontSize: '13px', width: { sm: 190, md: 220 } },
            }}
          />

          {/* Model No Search */}
          <TextField
            size="small"
            placeholder="Search Model No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchModel();
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Tag size={16} color="#94a3b8" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {searchQuery && (
                    <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ mr: 0.5 }}>
                      <X size={14} />
                    </IconButton>
                  )}
                  <IconButton size="small" onClick={handleSearchModel} color="primary">
                    <Search size={16} />
                  </IconButton>
                </InputAdornment>
              ),
              sx: { borderRadius: 2, backgroundColor: '#ffffff', height: 40, fontSize: '13px', width: { sm: 180, md: 200 } },
            }}
          />

          {/* Refresh Button */}
          <Tooltip title="Refresh stock movements">
            <IconButton
              onClick={fetchStockMovements}
              sx={{
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                p: 1.1,
                color: '#64748b',
                '&:hover': { bgcolor: '#f1f5f9', color: '#0f2b48' },
              }}
            >
              <RefreshCw size={17} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* 2. KPI Summary Cards (Full Width 4 Equal Columns) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 2.5,
          mb: 3.5,
          width: '100%',
        }}
      >
        {/* Total Items */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
            transition: 'all 0.2s ease',
            width: '100%',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.06)' },
          }}
        >
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, fontSize: '13px' }}>
                Total Items
              </Typography>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#eff6ff', color: '#2563eb' }}>
                <Package size={20} />
              </Box>
            </Box>
            <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', letterSpacing: '-0.03em' }}>
              {stats.totalItems.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, display: 'block', fontSize: '12px' }}>
              Units across all models in store
            </Typography>
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
            transition: 'all 0.2s ease',
            width: '100%',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.06)' },
          }}
        >
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, fontSize: '13px' }}>
                Low Stock
              </Typography>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#fffbeb', color: '#d97706' }}>
                <AlertTriangle size={20} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
              <Typography variant="h4" fontWeight={800} sx={{ color: stats.lowStock > 0 ? '#d97706' : '#0f172a', letterSpacing: '-0.03em' }}>
                {stats.lowStock}
              </Typography>
              {stats.lowStock > 0 && (
                <Chip label="Needs Reorder" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700, fontSize: '10.5px', height: 20 }} />
              )}
            </Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, display: 'block', fontSize: '12px' }}>
              Models with stock &le; 5 units
            </Typography>
          </CardContent>
        </Card>

        {/* Products */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
            transition: 'all 0.2s ease',
            width: '100%',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.06)' },
          }}
        >
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, fontSize: '13px' }}>
                Unique Products
              </Typography>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#f5f3ff', color: '#7c3aed' }}>
                <Layers size={20} />
              </Box>
            </Box>
            <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', letterSpacing: '-0.03em' }}>
              {stats.totalProducts}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, display: 'block', fontSize: '12px' }}>
              Distinct active model lines
            </Typography>
          </CardContent>
        </Card>

        {/* Out of Stock */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
            transition: 'all 0.2s ease',
            width: '100%',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.06)' },
          }}
        >
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, fontSize: '13px' }}>
                Out of Stock
              </Typography>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#fef2f2', color: '#dc2626' }}>
                <AlertCircle size={20} />
              </Box>
            </Box>
            <Typography variant="h4" fontWeight={800} sx={{ color: stats.outOfStock > 0 ? '#dc2626' : '#0f172a', letterSpacing: '-0.03em' }}>
              {stats.outOfStock}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, display: 'block', fontSize: '12px' }}>
              Models with zero stock remaining
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 3. Main Stock Inward Table Card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3.5,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Table Header Bar */}
        <Box
          sx={{
            p: 2.5,
            px: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', fontSize: '16.5px' }}>
              Stock Inward Records
            </Typography>
            <Chip
              label={`${filteredMovements.length} records`}
              size="small"
              sx={{
                bgcolor: '#f1f5f9',
                color: '#475569',
                fontWeight: 700,
                fontSize: '11.5px',
                borderRadius: '8px',
                height: 24,
              }}
            />
          </Box>

          {/* Quick Active Filters Badge */}
          {(searchQuery || searchCategoryQuery || ownerFilter) && (
            <Button
              size="small"
              onClick={() => {
                setSearchQuery('');
                setSearchCategoryQuery('');
                setOwnerFilter('');
              }}
              startIcon={<X size={14} />}
              sx={{ color: '#dc2626', textTransform: 'none', fontWeight: 600, fontSize: '12px' }}
            >
              Clear Filters
            </Button>
          )}
        </Box>

        {/* Table View */}
        {filteredMovements.length > 0 ? (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 380px)', minHeight: 350 }}>
              <Table stickyHeader size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.8 }}>
                      #
                    </TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.8 }}>
                      User / Ref
                    </TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.8 }}>
                      Model No
                    </TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.8 }}>
                      Category
                    </TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.8 }}>
                      Sub-Category
                    </TableCell>
                    {user?.role === 'CCTV Shoppee Avadi' && (
                      <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.8 }}>
                        Owner
                      </TableCell>
                    )}
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.8 }}>
                      Quantity
                    </TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.8 }}>
                      Store Name
                    </TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.8 }}>
                      Barcodes / Serial No
                    </TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.8 }}>
                      Price / Unit
                    </TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.8 }}>
                      Inward Date
                    </TableCell>
                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.8 }}>
                      Activity
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.8 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {currentItems.map((movement, index) => {
                    const rowNum = page * rowsPerPage + index + 1;
                    const modelName = movement.product || movement.modelNo || 'N/A';
                    const unitPrice = Number(movement.pricePerUnit ?? movement.price ?? 0);

                    // Formatted barcode strings
                    const rawBarcode = movement.scannedBarcode;
                    let barcodeArray = [];
                    if (Array.isArray(rawBarcode)) {
                      barcodeArray = rawBarcode.filter(Boolean);
                    } else if (typeof rawBarcode === 'string' && rawBarcode.trim()) {
                      barcodeArray = rawBarcode.split(',').map((b) => b.trim()).filter(Boolean);
                    }

                    return (
                      <TableRow
                        key={movement._id || index}
                        hover
                        sx={{
                          '&:hover': { backgroundColor: '#f8fafc' },
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        {/* Index */}
                        <TableCell sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '12.5px' }}>
                          {rowNum}
                        </TableCell>

                        {/* User / ID */}
                        <TableCell sx={{ maxWidth: 140 }}>
                          <Tooltip title={movement.userId || 'N/A'}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#64748b',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {movement.userId || 'N/A'}
                            </Typography>
                          </Tooltip>
                        </TableCell>

                        {/* Model No */}
                        <TableCell sx={{ minWidth: 160 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: 1.5,
                                bgcolor: '#eff6ff',
                                color: '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Tag size={14} />
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a', fontSize: '13.5px' }}>
                                {modelName}
                              </Typography>
                              {movement.brand && (
                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px', display: 'block' }}>
                                  {movement.brand}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          <Chip
                            label={movement.category || 'General'}
                            size="small"
                            sx={{
                              bgcolor: '#f1f5f9',
                              color: '#334155',
                              fontWeight: 600,
                              fontSize: '11.5px',
                              borderRadius: '6px',
                              height: 24,
                            }}
                          />
                        </TableCell>

                        {/* Sub-Category */}
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#475569', fontSize: '13px' }}>
                            {movement.subCategory || '-'}
                          </Typography>
                        </TableCell>

                        {/* Owner (if Avadi role) */}
                        {user?.role === 'CCTV Shoppee Avadi' && (
                          <TableCell>
                            <Chip
                              label={movement.owner || 'N/A'}
                              size="small"
                              sx={{
                                bgcolor: movement.owner?.includes('Lookman') ? '#fdf4ff' : '#f0fdf4',
                                color: movement.owner?.includes('Lookman') ? '#9333ea' : '#15803d',
                                border: movement.owner?.includes('Lookman') ? '1px solid #f0abfc' : '1px solid #bbf7d0',
                                fontWeight: 700,
                                fontSize: '11px',
                                height: 24,
                                borderRadius: '6px',
                              }}
                            />
                          </TableCell>
                        )}

                        {/* Quantity */}
                        <TableCell>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              px: 1.5,
                              py: 0.4,
                              borderRadius: '6px',
                              bgcolor: '#ecfdf5',
                              color: '#047857',
                              fontWeight: 800,
                              fontSize: '13px',
                              border: '1px solid #a7f3d0',
                            }}
                          >
                            {movement.quantity ?? 0} units
                          </Box>
                        </TableCell>

                        {/* Store Name */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#475569' }}>
                            <Store size={14} color="#64748b" />
                            <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500 }}>
                              {movement.storeName || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Barcodes / Serials */}
                        <TableCell sx={{ maxWidth: 220 }}>
                          {barcodeArray.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, alignItems: 'center' }}>
                              <Chip
                                label={barcodeArray[0]}
                                size="small"
                                onClick={() => handleCopyBarcode(barcodeArray[0])}
                                icon={copiedCode === barcodeArray[0] ? <Check size={12} color="#16a34a" /> : <Copy size={12} color="#64748b" />}
                                sx={{
                                  fontFamily: 'monospace',
                                  fontSize: '11px',
                                  bgcolor: '#f8fafc',
                                  border: '1px solid #cbd5e1',
                                  cursor: 'pointer',
                                  height: 22,
                                  '&:hover': { bgcolor: '#f1f5f9' },
                                }}
                              />
                              {barcodeArray.length > 1 && (
                                <Tooltip
                                  title={
                                    <Box sx={{ p: 0.5, maxHeight: 200, overflowY: 'auto' }}>
                                      {barcodeArray.map((code, ci) => (
                                        <Typography key={ci} variant="caption" sx={{ display: 'block', fontFamily: 'monospace', py: 0.2 }}>
                                          {ci + 1}. {code}
                                        </Typography>
                                      ))}
                                    </Box>
                                  }
                                >
                                  <Chip
                                    label={`+${barcodeArray.length - 1} more`}
                                    size="small"
                                    sx={{
                                      fontSize: '10.5px',
                                      fontWeight: 700,
                                      bgcolor: '#eff6ff',
                                      color: '#2563eb',
                                      height: 22,
                                      cursor: 'pointer',
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          ) : (
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              None
                            </Typography>
                          )}
                        </TableCell>

                        {/* Price */}
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} sx={{ color: '#15803d', fontSize: '13.5px' }}>
                            ₹{unitPrice.toLocaleString('en-IN')}
                          </Typography>
                        </TableCell>

                        {/* Date */}
                        <TableCell sx={{ minWidth: 140 }}>
                          <Typography variant="body2" sx={{ color: '#334155', fontSize: '12.5px', fontWeight: 500 }}>
                            {movement.createdAt ? new Date(movement.createdAt).toLocaleDateString('en-GB') : '-'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>
                            {movement.createdAt ? new Date(movement.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </Typography>
                        </TableCell>

                        {/* Activity Badge */}
                        <TableCell>
                          <Box
                            sx={{
                              px: 1.2,
                              py: 0.4,
                              borderRadius: '6px',
                              bgcolor: '#f0fdf4',
                              color: '#166534',
                              fontWeight: 800,
                              fontSize: '11px',
                              letterSpacing: '0.04em',
                              display: 'inline-block',
                              border: '1px solid #bbf7d0',
                            }}
                          >
                            STORE INWARD
                          </Box>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            {/* Self Transfer (For multi-owner stores) */}
                            {user?.role === 'CCTV Shoppee Avadi' && (
                              <Tooltip title="Stock Transfer">
                                <IconButton
                                  size="small"
                                  onClick={() => handleTransferOpen(movement)}
                                  sx={{
                                    color: '#0284c7',
                                    borderRadius: 1.5,
                                    p: 0.8,
                                    '&:hover': { bgcolor: '#e0f2fe' },
                                  }}
                                >
                                  <ArrowRightLeft size={16} />
                                </IconButton>
                              </Tooltip>
                            )}

                            {/* Edit */}
                            <Tooltip title="Edit Record">
                              <IconButton
                                size="small"
                                onClick={() => handleEditOpen(movement)}
                                sx={{
                                  color: '#2563eb',
                                  borderRadius: 1.5,
                                  p: 0.8,
                                  '&:hover': { bgcolor: '#eff6ff' },
                                }}
                              >
                                <Edit2 size={16} />
                              </IconButton>
                            </Tooltip>

                            {/* Delete */}
                            <Tooltip title="Delete Record">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(movement)}
                                disabled={deleteLoading === movement._id}
                                sx={{
                                  color: '#dc2626',
                                  borderRadius: 1.5,
                                  p: 0.8,
                                  '&:hover': { bgcolor: '#fee2e2' },
                                }}
                              >
                                {deleteLoading === movement._id ? (
                                  <CircularProgress size={16} color="inherit" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Controls */}
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredMovements.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              sx={{
                borderTop: '1px solid #f1f5f9',
                backgroundColor: '#ffffff',
                px: 2,
              }}
            />
          </>
        ) : (
          /* Empty State */
          <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: '#f1f5f9',
                color: '#94a3b8',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <Package size={32} />
            </Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b' }}>
              No Stock Inward Records Found
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, mb: 3, maxWidth: 400, mx: 'auto' }}>
              {searchQuery || searchCategoryQuery || ownerFilter
                ? 'No inward stock matching your search query or filter criteria.'
                : 'No stock has been inwarded into this store location yet.'}
            </Typography>
            <Button
              variant="contained"
              onClick={handleInwardDialogOpen}
              startIcon={<Plus size={16} />}
              sx={{ bgcolor: '#0f2b48', textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Inward Stock Now
            </Button>
          </Box>
        )}
      </Paper>

      {/* ===== 4. Store Inward Dialog ===== */}
      <Dialog
        open={showInwardDialog}
        onClose={(event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        }}
        fullWidth
        maxWidth="lg"
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            p: { xs: 1, md: 2 },
            maxWidth: 1260,
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          },
        }}
      >
        {/* Header */}
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 2.5, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowDownToLine size={22} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                Inward Stock to Store
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '13px', display: 'block', mt: 0.3 }}>
                Add models and scan individual unit serial barcodes
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Plus size={16} />}
            onClick={addLine}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '13px',
              borderColor: '#cbd5e1',
              color: '#0f172a',
              px: 2,
              py: 0.8,
              '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
            }}
          >
            Add Model
          </Button>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 1 }}>
          {/* Accessories Checkbox */}
          <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isAccessory}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsAccessory(checked);
                    if (checked) {
                      setLines((prev) =>
                        prev.map((l) => ({ ...l, category: 'Accessories', subCategory: 'Accessories' }))
                      );
                    }
                  }}
                  size="small"
                  sx={{
                    color: '#334155',
                    borderRadius: '4px',
                    '&.Mui-checked': { color: '#9333ea' },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Cpu size={18} color="#9333ea" />
                  <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a', fontSize: '14px' }}>
                    Accessories Inventory
                  </Typography>
                </Box>
              }
            />
          </Box>

          {/* Model Rows */}
          <Stack spacing={2.5}>
            {lines.map((ln, idx) => {
              const product = productList.find((p) => p.model === ln.modelNo);
              const currentStock = product?.reorderLevel ?? 0;
              const incomingQty = qtyForLine(ln);
              const afterStock = currentStock + incomingQty;
              const remaining = remainingForLine(ln);
              const cap = capForLine(ln);

              return (
                <Paper
                  key={idx}
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    position: 'relative',
                  }}
                >
                  {/* Card Top Row: Badge & Delete */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
                    <Box
                      sx={{
                        px: 1.6,
                        py: 0.5,
                        borderRadius: '8px',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        fontWeight: 700,
                        fontSize: '12.5px',
                      }}
                    >
                      {isAccessory ? `Accessory #${idx + 1}` : `Model #${idx + 1}`}
                    </Box>

                    <Tooltip title="Remove Model Row">
                      <span>
                        <IconButton
                          onClick={() => removeLine(idx)}
                          disabled={lines.length === 1}
                          size="small"
                          sx={{
                            color: '#94a3b8',
                            '&:hover': { color: '#ef4444', bgcolor: 'transparent' },
                            p: 0.5,
                          }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>

                  {/* Row 1: 5 Columns across */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(5, 1fr)',
                      },
                      gap: 2,
                      alignItems: 'start',
                    }}
                  >
                    {/* 1. Model No */}
                    <Box>
                      <TextField
                        label="Model No *"
                        size="small"
                        value={ln.modelNo || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLineValue(idx, 'modelNo', val);
                          recomputeLowStock(idx, val);
                          const selectedProduct = productList.find((p) => p.model === val);
                          if (selectedProduct) {
                            const priceVal =
                              selectedProduct.dealerPrice !== undefined &&
                              selectedProduct.dealerPrice !== null &&
                              selectedProduct.dealerPrice !== ''
                                ? Number(selectedProduct.dealerPrice)
                                : Number(selectedProduct.mrp) || Number(selectedProduct.price) || 0;
                            setLineValue(idx, 'price', priceVal);
                          }
                        }}
                        fullWidth
                        error={!!lineErrors[`l${idx}_modelNo`]}
                        helperText={lineErrors[`l${idx}_modelNo`]}
                        InputProps={{ sx: { borderRadius: 1.5 } }}
                      />
                      <Typography variant="caption" sx={{ mt: 0.5, color: '#64748b', fontSize: '12px', display: 'block' }}>
                        Current Stock: <strong style={{ color: '#0f172a' }}>{currentStock}</strong>
                      </Typography>
                    </Box>

                    {/* 2. Category */}
                    <Box>
                      <FormControl fullWidth size="small" error={!!lineErrors[`l${idx}_category`]}>
                        <InputLabel id={`cat-label-${idx}`}>Category *</InputLabel>
                        <Select
                          labelId={`cat-label-${idx}`}
                          label="Category *"
                          value={ln.category || ''}
                          onChange={(e) => setLineValue(idx, 'category', e.target.value)}
                          sx={{ borderRadius: 1.5 }}
                        >
                          {categories.map((cat) => (
                            <MenuItem key={cat._id} value={cat.name}>
                              {cat.name}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>{lineErrors[`l${idx}_category`]}</FormHelperText>
                      </FormControl>
                    </Box>

                    {/* 3. Sub Category */}
                    <Box>
                      <FormControl fullWidth size="small" error={!!lineErrors[`l${idx}_subCategory`]}>
                        <InputLabel id={`subcat-label-${idx}`}>Sub Category</InputLabel>
                        <Select
                          labelId={`subcat-label-${idx}`}
                          label="Sub Category"
                          value={ln.subCategory || 'None'}
                          onChange={(e) => setLineValue(idx, 'subCategory', e.target.value)}
                          sx={{ borderRadius: 1.5 }}
                        >
                          <MenuItem value="None">None</MenuItem>
                          {subCategories.map((sub) => (
                            <MenuItem key={sub._id} value={sub.name}>
                              {sub.name}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>{lineErrors[`l${idx}_subCategory`]}</FormHelperText>
                      </FormControl>
                    </Box>

                    {/* 4. Quantity */}
                    <Box>
                      <TextField
                        label="Quantity *"
                        type="number"
                        size="small"
                        fullWidth
                        value={ln.quantity}
                        onChange={(e) => {
                          setLineValue(idx, 'isQuantityManual', true);
                          setLineValue(idx, 'quantity', e.target.value);
                        }}
                        error={!!lineErrors[`l${idx}_quantity`]}
                        helperText={lineErrors[`l${idx}_quantity`]}
                        InputProps={{ sx: { borderRadius: 1.5 } }}
                      />
                      <Typography variant="caption" sx={{ mt: 0.5, color: '#64748b', fontSize: '12px', display: 'block' }}>
                        Typed quantity caps scanned items
                      </Typography>
                      <Typography variant="caption" sx={{ mt: 0.3, color: '#64748b', fontSize: '12px', display: 'block' }}>
                        After Inward: <strong style={{ color: '#16a34a' }}>{afterStock}</strong>
                      </Typography>
                    </Box>

                    {/* 5. Price per Unit */}
                    <Box>
                      <TextField
                        label="Price per Unit *"
                        type="number"
                        size="small"
                        fullWidth
                        value={ln.price || ''}
                        placeholder="Price per Unit *"
                        onChange={(e) => setLineValue(idx, 'price', e.target.value)}
                        error={!!lineErrors[`l${idx}_price`]}
                        helperText={lineErrors[`l${idx}_price`]}
                        InputProps={{ sx: { borderRadius: 1.5 } }}
                      />
                    </Box>
                  </Box>

                  {/* Row 2: Owner, Scan Barcode, Scanned Barcodes */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: (user?.role === 'CCTV Shoppee Avadi' || !user?.role || user?.role === 'admin')
                          ? '1fr 1.3fr 1.3fr'
                          : '1.5fr 1.5fr',
                      },
                      gap: 2,
                      mt: 2.5,
                      alignItems: 'start',
                    }}
                  >
                    {/* Owner */}
                    {(user?.role === 'CCTV Shoppee Avadi' || !user?.role || user?.role === 'admin') && (
                      <Box>
                        <FormControl fullWidth size="small" error={!!lineErrors[`l${idx}_owner`]}>
                          <InputLabel id={`owner-label-${idx}`}>Owner *</InputLabel>
                          <Select
                            labelId={`owner-label-${idx}`}
                            label="Owner *"
                            value={
                              ln.owner
                                ? (ln.owner.endsWith('.') ? ln.owner : `${ln.owner}.`)
                                : ''
                            }
                            onChange={(e) => setLineValue(idx, 'owner', e.target.value)}
                            sx={{ borderRadius: 1.5 }}
                          >
                            <MenuItem value="CCTV Shoppee Avadi.">CCTV Shoppee Avadi.</MenuItem>
                            <MenuItem value="Lookman CCTV Avadi.">Lookman CCTV Avadi.</MenuItem>
                          </Select>
                          <FormHelperText>{lineErrors[`l${idx}_owner`]}</FormHelperText>
                        </FormControl>
                      </Box>
                    )}

                    {/* Scan Input */}
                    <Box>
                      <TextField
                        label="Scan Barcode / Serial No *"
                        size="small"
                        fullWidth
                        value={ln.shd}
                        onChange={(e) => setLineValue(idx, 'shd', e.target.value)}
                        onKeyDown={(e) => handleInwardScanKeyDown(e, idx)}
                        error={!!lineErrors[`l${idx}_shd`]}
                        helperText={
                          lineErrors[`l${idx}_shd`] ||
                          (cap === Infinity ? 'Press Enter after scan' : `Allowed up to ${cap} scans for this row`)
                        }
                        inputRef={(el) => (shdRefs.current[idx] = el)}
                        disabled={remaining === 0}
                        InputProps={{ sx: { borderRadius: 1.5 } }}
                      />
                    </Box>

                    {/* Scanned Codes */}
                    <Box>
                      <Tooltip
                        title={
                          ln.scannedCodes
                            ? `Scanned (${ln.scannedList.length}): ${ln.scannedCodes}`
                            : 'No barcodes scanned yet'
                        }
                      >
                        <Box
                          sx={{
                            height: 40,
                            border: '1px solid #cbd5e1',
                            borderRadius: 1.5,
                            backgroundColor: '#f8fafc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            px: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: ln.scannedCodes ? '#0f172a' : '#64748b',
                            fontSize: '13.5px',
                            fontWeight: ln.scannedCodes ? 600 : 500,
                            cursor: ln.scannedCodes ? 'pointer' : 'default',
                          }}
                        >
                          {ln.scannedCodes || 'Scanned Barcodes'}
                        </Box>
                      </Tooltip>
                      <Box sx={{ mt: 0.6, fontSize: '12px', color: '#64748b' }}>
                        Total Scanned: <strong style={{ color: '#2563eb' }}>{ln.scannedList.length}</strong>{' '}
                        {cap === Infinity ? 'No scan limit' : `Remaining: ${remaining}`}
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ pb: 3, px: 3, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button
            onClick={handleInwardDialogClose}
            sx={{
              color: '#475569',
              fontWeight: 700,
              fontSize: '13px',
              textTransform: 'uppercase',
              borderRadius: 2,
              px: 2,
              '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' },
            }}
          >
            CANCEL
          </Button>
          <Button
            onClick={handleInwardSubmit}
            variant="contained"
            startIcon={<Save size={16} />}
            disabled={loading}
            sx={{
              bgcolor: '#0f2b48',
              '&:hover': { bgcolor: '#1e3a8a' },
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 700,
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              boxShadow: '0 4px 12px rgba(15, 43, 72, 0.25)',
            }}
          >
            {loading ? 'SUBMITTING...' : 'SUBMIT INWARD'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== 5. Stock Outward Dialog ===== */}
      <Dialog
        open={showOutwardDialog}
        onClose={(event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
          handleOutwardDialogClose();
        }}
        fullWidth
        maxWidth="lg"
        disableEscapeKeyDown
        PaperProps={{ sx: { borderRadius: 3.5, p: 0.5 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={20} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#0f2b48">
                Stock Outward &amp; Dispatch
              </Typography>
              <Typography variant="caption" color="#64748b">
                Dispatch inventory from store to customers
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={handleOutwardDialogClose}
            sx={{ color: '#94a3b8', '&:hover': { bgcolor: '#f1f5f9', color: '#0f2b48' } }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: '#f1f5f9' }}>
          <Stack spacing={2.5}>
            {/* Customer Selection */}
            <FormControl fullWidth size="small">
              <InputLabel>Customer Name *</InputLabel>
              <Select
                value={outwardFormData.customerName}
                onChange={(e) => {
                  const selectedCustomer = customerNames.find((c) => c.customerName === e.target.value);
                  setOutwardFormData({
                    customerName: e.target.value,
                    selectedCustomer: selectedCustomer || null,
                  });
                }}
                label="Customer Name *"
                disabled={loadingCustomers}
                sx={{ borderRadius: 2 }}
              >
                {loadingCustomers ? (
                  <MenuItem disabled>Loading customers...</MenuItem>
                ) : customerNames.length > 0 ? (
                  customerNames.map((customer, index) => (
                    <MenuItem key={index} value={customer.customerName}>
                      {customer.customerName} ({customer.phoneNo})
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No customers found</MenuItem>
                )}
              </Select>
            </FormControl>

            {outwardFormData.selectedCustomer && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
                <Typography variant="subtitle2" fontWeight={700} color="#0f2b48">
                  Customer Information
                </Typography>
                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="#64748b">Mobile:</Typography>{' '}
                    <Typography variant="body2" fontWeight={600} display="inline">{outwardFormData.selectedCustomer.phoneNo || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="#64748b">Address:</Typography>{' '}
                    <Typography variant="body2" fontWeight={600} display="inline">{outwardFormData.selectedCustomer.address || '-'}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Model Lines */}
            {lines.map((ln, idx) => (
              <Paper key={idx} variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, width: '100%' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography fontWeight={700} color="#0f2b48" fontSize="15px">
                    Model #{idx + 1}
                  </Typography>
                  <IconButton color="error" size="small" onClick={() => removeLine(idx)} disabled={lines.length === 1}>
                    <Trash2 size={16} />
                  </IconButton>
                </Stack>

                {/* Row 1: Model No | Sales Person | Quantity | Price */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: '1.4fr 2.6fr 1.5fr 1.5fr',
                    },
                    gap: 2,
                    alignItems: 'start',
                    width: '100%',
                    mb: 2,
                  }}
                >
                  <FormControl fullWidth size="small" error={!!lineErrors[`l${idx}_modelNo`]}>
                    <InputLabel>Model No *</InputLabel>
                    <Select
                      value={ln.modelNo || ''}
                      onChange={(e) => handleModelSelect(idx, e.target.value)}
                      label="Model No *"
                      disabled={loadingModels}
                      sx={{ borderRadius: 1.5 }}
                    >
                      {loadingModels ? (
                        <MenuItem disabled>Loading models...</MenuItem>
                      ) : availableModels.length > 0 ? (
                        availableModels.map((model, i) => (
                          <MenuItem key={i} value={model.modelNo}>
                            {model.modelNo} {model.quantity > 0 && `(Qty: ${model.quantity})`}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No models available</MenuItem>
                      )}
                    </Select>
                    {lineErrors[`l${idx}_modelNo`] && (
                      <FormHelperText>{lineErrors[`l${idx}_modelNo`]}</FormHelperText>
                    )}
                  </FormControl>

                  <TextField
                    label="Sales Person *"
                    size="small"
                    fullWidth
                    value={ln.salePerson || ''}
                    onChange={(e) => setLineValue(idx, 'salePerson', e.target.value)}
                    error={!!lineErrors[`l${idx}_salePerson`]}
                    helperText={lineErrors[`l${idx}_salePerson`]}
                    InputProps={{ sx: { borderRadius: 1.5 } }}
                  />

                  <TextField
                    label="Quantity *"
                    type="number"
                    size="small"
                    fullWidth
                    value={ln.quantity}
                    onChange={(e) => {
                      setLineValue(idx, 'isQuantityManual', true);
                      setLineValue(idx, 'quantity', e.target.value);
                    }}
                    error={!!lineErrors[`l${idx}_quantity`]}
                    helperText={lineErrors[`l${idx}_quantity`]}
                    InputProps={{ sx: { borderRadius: 1.5 } }}
                  />

                  <TextField
                    label="Price *"
                    type="number"
                    size="small"
                    fullWidth
                    value={ln.price || ''}
                    onChange={(e) => setLineValue(idx, 'price', e.target.value)}
                    error={!!lineErrors[`l${idx}_price`]}
                    helperText={lineErrors[`l${idx}_price`]}
                    InputProps={{ sx: { borderRadius: 1.5 } }}
                  />
                </Box>

                {/* Row 2: Scan Barcode | Scanned Codes */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: '1fr 1fr',
                    },
                    gap: 2,
                    alignItems: 'start',
                    width: '100%',
                  }}
                >
                  <TextField
                    label="Scan Barcode *"
                    size="small"
                    fullWidth
                    value={ln.shd}
                    onChange={(e) => setLineValue(idx, 'shd', e.target.value)}
                    onKeyDown={(e) => handleScanKeyDown(e, idx)}
                    error={!!lineErrors[`l${idx}_shd`]}
                    helperText={lineErrors[`l${idx}_shd`] || 'Scan unit barcode and press Enter'}
                    inputRef={(el) => (shdRefs.current[idx] = el)}
                    disabled={remainingForLine(ln) === 0}
                    InputProps={{ sx: { borderRadius: 1.5 } }}
                  />

                  <Box sx={{ width: '100%' }}>
                    <TextField
                      label="Scanned Codes"
                      fullWidth
                      size="small"
                      multiline
                      rows={1}
                      value={ln.scannedCodes}
                      InputProps={{
                        readOnly: true,
                        sx: { borderRadius: 1.5, backgroundColor: '#f8fafc', fontSize: '12px' },
                      }}
                    />
                    <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: '#64748b' }}>
                      Total Scanned: {ln.scannedList.length} | Remaining: {remainingForLine(ln) === Infinity ? '∞' : remainingForLine(ln)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ))}

            <Button variant="outlined" startIcon={<Plus size={16} />} onClick={addLine} sx={{ borderRadius: 2 }}>
              Add Model Line
            </Button>

            {outwardError && (
              <Typography color="error" variant="body2">{outwardError}</Typography>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ pb: 2.5, px: 3 }}>
          <Button onClick={handleOutwardDialogClose} color="inherit">Cancel</Button>
          <Button onClick={handleOutwardSubmit} variant="contained" color="error" disabled={loading} sx={{ borderRadius: 2, px: 3 }}>
            {loading ? 'Processing...' : 'Submit Outward'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== 6. Edit Inward Dialog ===== */}
      <Dialog open={showEditDialog} onClose={handleEditClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3.5, p: 0.5 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#0f2b48' }}>Edit Stock Inward Record</DialogTitle>
        <DialogContent dividers sx={{ borderColor: '#f1f5f9' }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Model No" fullWidth value={editFormData.modelNo} InputProps={{ readOnly: true }} variant="filled" />

            <TextField
              label="Quantity"
              type="number"
              fullWidth
              value={editFormData.quantity}
              onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
            />

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={editFormData.category}
                label="Category"
                onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat._id} value={cat.name}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Sub Category</InputLabel>
              <Select
                value={editFormData.subCategory}
                label="Sub Category"
                onChange={(e) => setEditFormData({ ...editFormData, subCategory: e.target.value })}
              >
                <MenuItem value="None">None</MenuItem>
                {subCategories.map((sub) => (
                  <MenuItem key={sub._id} value={sub.name}>{sub.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {user?.role === 'CCTV Shoppee Avadi' && (
              <FormControl fullWidth>
                <InputLabel>Owner</InputLabel>
                <Select
                  value={editFormData.owner}
                  label="Owner"
                  onChange={(e) => setEditFormData({ ...editFormData, owner: e.target.value })}
                >
                  <MenuItem value="CCTV Shoppee Avadi.">CCTV Shoppee Avadi.</MenuItem>
                  <MenuItem value="Lookman CCTV Avadi.">Lookman CCTV Avadi.</MenuItem>
                </Select>
              </FormControl>
            )}

            <TextField
              label="Barcodes (comma separated)"
              fullWidth
              multiline
              rows={4}
              value={editFormData.scannedBarcode}
              onChange={(e) => setEditFormData({ ...editFormData, scannedBarcode: e.target.value })}
              helperText="Edit barcodes list for this model"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ pb: 2.5, px: 3 }}>
          <Button onClick={handleEditClose} color="inherit">Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained" sx={{ bgcolor: '#0f2b48', borderRadius: 2 }} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== 7. Self Transfer Dialog ===== */}
      <Dialog open={showTransferDialog} onClose={handleTransferClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3.5, p: 0.5 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#0f2b48', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ArrowRightLeft size={20} color="#0284c7" /> Self Stock Transfer
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: '#f1f5f9' }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Model No" fullWidth value={transferFormData.modelNo} InputProps={{ readOnly: true }} variant="filled" />
              </Grid>
              <Grid item xs={6}>
                <TextField label="From Owner" fullWidth value={transferFormData.fromOwner} InputProps={{ readOnly: true }} variant="filled" />
              </Grid>
            </Grid>

            <FormControl fullWidth required>
              <InputLabel>To Owner</InputLabel>
              <Select
                value={transferFormData.toOwner}
                label="To Owner"
                onChange={(e) => setTransferFormData({ ...transferFormData, toOwner: e.target.value })}
              >
                <MenuItem value="CCTV Shoppee Avadi.">CCTV Shoppee Avadi.</MenuItem>
                <MenuItem value="Lookman CCTV Avadi.">Lookman CCTV Avadi.</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Quantity to Transfer"
              type="number"
              fullWidth
              required
              value={transferFormData.quantity}
              onChange={(e) =>
                setTransferFormData({ ...transferFormData, quantity: Math.min(Number(e.target.value), 999999) })
              }
              helperText="Set quantity, then scan same number of barcodes"
            />

            <FormControl fullWidth required>
              <InputLabel>Transfer Method</InputLabel>
              <Select
                value={transferFormData.transferMethod}
                label="Transfer Method"
                onChange={(e) => setTransferFormData({ ...transferFormData, transferMethod: e.target.value })}
              >
                <MenuItem value="In Hand">In Hand</MenuItem>
                <MenuItem value="Courier">Courier</MenuItem>
                <MenuItem value="Others">Others</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={transferFormData.description}
              onChange={(e) => setTransferFormData({ ...transferFormData, description: e.target.value })}
              placeholder="Add any transfer notes..."
            />

            <TextField
              label="Scan Barcode"
              fullWidth
              value={transferFormData.scannedBarcode}
              onChange={(e) => setTransferFormData({ ...transferFormData, scannedBarcode: e.target.value })}
              onKeyDown={handleTransferScanKeyDown}
              helperText="Scan barcode and press Enter"
            />

            <TextField
              label="Scanned Codes"
              fullWidth
              multiline
              rows={3}
              value={transferFormData.scannedList.join(', ')}
              InputProps={{ readOnly: true, sx: { backgroundColor: '#f8fafc', fontSize: '12px' } }}
              helperText={`Total scanned: ${transferFormData.scannedList.length}`}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ pb: 2.5, px: 3 }}>
          <Button onClick={handleTransferClose} color="inherit">Cancel</Button>
          <Button onClick={handleTransferSubmit} variant="contained" color="success" disabled={loading} sx={{ borderRadius: 2 }}>
            {loading ? 'Processing...' : 'Submit Transfer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== 8. Search Model Quick Dialog ===== */}
      <Dialog open={showSearchDialog} onClose={() => setShowSearchDialog(false)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#0f2b48' }}>Model Search Result</DialogTitle>
        <DialogContent>
          {searchResult && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={700} color="#0f2b48">
                {searchResult.model}
              </Typography>
              <Typography variant="h3" fontWeight={800} color="#2563eb" sx={{ my: 1.5 }}>
                {searchResult.totalQuantity}
              </Typography>
              <Typography variant="body2" color="#64748b">
                Total units available across {searchResult.count} active record{searchResult.count !== 1 ? 's' : ''}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button onClick={() => setShowSearchDialog(false)} variant="contained" sx={{ bgcolor: '#0f2b48', borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default StoreInward;
