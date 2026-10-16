import React, { useState, useEffect, useRef } from 'react';
import Spinner from '../Components/Spinner';
import { useUser } from './UserContext';
import {
  TablePagination,
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
  // Divider,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  // Chip,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Cancel as CancelIcon, Save as SaveIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import axios from 'axios';
// import Box from '@mui/material/Box';

const FILE_HOST = 'http://localhost:5002';
const API_BASE = 'http://localhost:5002/api';

// Helper functions
const makeEmptyLine = () => ({
  modelNo: '',
  category: '',
  subCategory: 'None',
  salePerson: '',
  quantity: 0,
  price: 0,
  shd: '',
  scannedCodes: '',
  scannedList: [],
  isQuantityManual: false,
  lowStockWarning: '',
  owner: '',
});

const sanitize = (s) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const findModelMatchInBarcode = (model, barcode) => {
  const m = sanitize(model);
  const b = sanitize(barcode);
  if (!m || !b) return null;
  const lengths = [5, 4];
  for (const L of lengths) {
    if (m.length < L) continue;
    for (let i = 0; i <= m.length - L; i++) {
      const sub = m.slice(i, i + L);
      if (b.includes(sub)) return sub;
    }
  }
  return null;
};

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

const statusForQty = (qty) => {
  if (qty <= 0) return 'Out of Stock';
  if (qty > 0 && qty <= 5) return 'Low Stock';
  return 'In Stock';
};

const aggregateInventory = (data) => {
  const map = {};
  data.forEach(item => {
    const key = `${item.modelNo}_${item.storeName}`;
    if (!map[key]) {
      map[key] = { ...item };
      map[key].barcodes = Array.isArray(item.barcodes)
        ? [...item.barcodes]
        : (item.barcodes ? item.barcodes.split(',').map(b => b.trim()).filter(Boolean) : []);
    } else {
      map[key].quantity += (Number(item.quantity) || 0);
      const itemBarcodes = Array.isArray(item.barcodes)
        ? item.barcodes
        : (item.barcodes ? item.barcodes.split(',').map(b => b.trim()).filter(Boolean) : []);
      map[key].barcodes = [...new Set([...map[key].barcodes, ...itemBarcodes])];
    }
  });
  return Object.values(map);
};

const Storemanagement = () => {
  const { user } = useUser();
  const [inventoryData, setInventoryData] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showOutwardDialog, setShowOutwardDialog] = useState(false);
  const [showInwardDialog, setShowInwardDialog] = useState(false);
  const [outwardError, setOutwardError] = useState('');
  const [inwardError, setInwardError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [inwardFormData, setInwardFormData] = useState({ location: '' });
  const [productList, setProductList] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [salePersons, setSalePersons] = useState([]);
  const [lines, setLines] = useState([makeEmptyLine()]);
  const [lineErrors, setLineErrors] = useState({});
  const [globalScanned, setGlobalScanned] = useState(new Set());
  const [existingBarcodesMap, setExistingBarcodesMap] = useState({});
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [tableCategoryFilter, setTableCategoryFilter] = useState('All');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [mobileNumbers, setMobileNumbers] = useState([]);
  const [customerNames, setCustomerNames] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [outwardFormData, setOutwardFormData] = useState({
    customerName: '',
    selectedCustomer: null,
    modelNo: '',
    quantity: 0,
    shd: '',
    scannedCodes: '',
    scannedList: [],
    price: 0,
    salePerson: '',
  });

  const shdRefs = useRef({});
  const scannerBuffers = useRef({});
  const scannerTimers = useRef({});
  const { enqueueSnackbar } = useSnackbar();

  // Fetch inventory data
  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/dispatch`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setInventoryData(data);
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

        if (user?.role) {
          let filtered = data;
          if (!isSuperAdmin || (activeStore && activeStore !== 'admin' && activeStore !== 'super admin' && activeStore !== 'manager')) {
            filtered = data.filter((item) => {
              const store = (item.storeName || '').toLowerCase().trim();
              return (
                store === activeStore ||
                store.includes(activeStore) ||
                activeStore.includes(store) ||
                store === (user?.role || '').toLowerCase().trim()
              );
            });
          }
          setFilteredInventory(aggregateInventory(filtered));
        } else {
          setFilteredInventory(aggregateInventory(data));
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching inventory data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventoryData();
    fetchProducts();
    fetchLocations();
    fetchSalePersons();
    fetchCategories();
    fetchSubCategories();
  }, [user?.role]);

  // Fetch customer names
  useEffect(() => {
    const fetchCustomerNames = async () => {
      if (!user?.role) return;
      setLoadingCustomers(true);
      try {
        const response = await axios.get(`${API_BASE}/storecustomers`, {
          params: { storeName: user.role }
        });
        const customerData = response.data.data || [];
        setCustomerNames(customerData);
      } catch (error) {
        console.error('Error fetching customer data:', error);
        enqueueSnackbar('Error fetching customer data!', { variant: 'error' });
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomerNames();
  }, [user?.role]);

  // Fetch mobile numbers
  useEffect(() => {
    if (filteredInventory.length > 0) {
      const uniqueMobileNumbers = [...new Set(filteredInventory.map(item => item.customerMobile))].filter(Boolean);
      setMobileNumbers(uniqueMobileNumbers);
    }
  }, [filteredInventory]);

  // Fetch products
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/products`);
      setProductList(res.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      enqueueSnackbar('Error fetching products!', { variant: 'error' });
    }
  };

  // Fetch locations
  const fetchLocations = async () => {
    try {
      const res = await axios.get(`${API_BASE}/locations`);
      setLocationOptions(res.data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      enqueueSnackbar('Error fetching locations!', { variant: 'error' });
    }
  };

  // Fetch sale persons
  const fetchSalePersons = async () => {
    try {
      const res = await axios.get(`${API_BASE}/salesPersons`);
      setSalePersons(res.data || []);
    } catch (error) {
      console.error('Error fetching sales persons:', error);
      enqueueSnackbar('Error fetching sales persons!', { variant: 'error' });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/categories`);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/subcategories`);
      setSubCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };


  // Status styling
  const getStatusStyle = (quantity) => {
    if (quantity >= 15) {
      return { backgroundColor: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', textAlign: 'center', minWidth: '80px', display: 'inline-block' };
    } else if (quantity >= 5) {
      return { backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', textAlign: 'center', minWidth: '80px', display: 'inline-block' };
    } else {
      return { backgroundColor: '#fecaca', color: '#991b1b', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', textAlign: 'center', minWidth: '80px', display: 'inline-block' };
    }
  };

  // Status text
  const getStatusText = (quantity) => {
    if (quantity >= 15) return 'In Stock';
    if (quantity >= 5) return 'Medium';
    return 'Low Stock';
  };

  // Inventory Calculation
  const displayedInventory = filteredInventory.filter(item =>
    tableCategoryFilter === 'All' ? true : item.category === tableCategoryFilter
  );

  const totalItems = displayedInventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalProducts = displayedInventory.length;
  const lowStockItems = displayedInventory.filter(item => item.quantity < 5).length;
  const outOfStockItems = displayedInventory.filter(item => item.quantity === 0).length;

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Delete product handlers
  const handleOpenDeleteDialog = (product) => {
    setProductToDelete(product);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setProductToDelete(null);
  };

  const handleDeleteProduct = async () => {
    try {
      setLoading(true);
      const storeNameForMatch = user?.role || "JAIPUR";
      const recordsToDelete = (inventoryData || []).filter(item =>
        item.modelNo === productToDelete.modelNo &&
        item.storeName?.toLowerCase() === storeNameForMatch.toLowerCase()
      );

      for (const record of recordsToDelete) {
        await fetch(`${API_BASE}/dispatch/${record._id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const updatedData = await fetch(`${API_BASE}/dispatch`).then(res => res.json());
      setInventoryData(updatedData);
      if (user?.role) {
        const filtered = updatedData.filter(item => item.storeName?.toLowerCase() === user.role?.toLowerCase());
        setFilteredInventory(aggregateInventory(filtered));
      } else {
        setFilteredInventory(aggregateInventory(updatedData));
      }
      enqueueSnackbar('Product deleted successfully!', { variant: 'success' });
    } catch (err) {
      setError(err.message);
      enqueueSnackbar('Failed to delete product!', { variant: 'error' });
    } finally {
      setLoading(false);
      handleCloseDeleteDialog();
    }
  };

  // Dialog handlers
  const handleInwardDialogOpen = async () => {
    setShowInwardDialog(true);
    setLines([makeEmptyLine()]);
    setLineErrors({});
    setGlobalScanned(new Set());
    setExistingBarcodesMap({});

    try {
      const currentStore = user?.role ? user.role.toLowerCase().trim() : '';

      const [dispatchRes, storeInwardRes] = await Promise.all([
        axios.get(`${API_BASE}/dispatch`),
        axios.get(`${API_BASE}/store-inward`)
      ]);

      const map = {};

      // 1. Process Admin Dispatch to this particular store
      if (dispatchRes.data) {
        dispatchRes.data.forEach((disp) => {
          const matchesStore = currentStore && disp.storeName && disp.storeName.toLowerCase().trim() === currentStore;
          if (matchesStore && disp.barcodes) {
            const codes = Array.isArray(disp.barcodes)
              ? disp.barcodes
              : (typeof disp.barcodes === 'string' ? disp.barcodes.split(',').map(b => b.trim()).filter(Boolean) : []);
            codes.forEach((code) => {
              map[code] = disp.modelNo;
            });
          }
        });
      }

      // 2. Process Store Inwards for this particular store
      if (storeInwardRes.data) {
        storeInwardRes.data.forEach((storeInv) => {
          const matchesStore = currentStore && storeInv.storeName && storeInv.storeName.toLowerCase().trim() === currentStore;
          if (matchesStore && storeInv.scannedBarcode) {
            const codes = Array.isArray(storeInv.scannedBarcode)
              ? storeInv.scannedBarcode
              : (typeof storeInv.scannedBarcode === 'string' ? storeInv.scannedBarcode.split(',').map(b => b.trim()).filter(Boolean) : []);
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

  const handleOutwardDialogOpen = () => {
    setShowOutwardDialog(true);
    setLines([makeEmptyLine()]);
    setLineErrors({});
    setGlobalScanned(new Set());
    setOutwardFormData({
      customerName: '',
      selectedCustomer: null,
      modelNo: '',
      quantity: 0,
      shd: '',
      scannedCodes: '',
      scannedList: [],
      price: 0,
      salePerson: '',
    });
  };

  const handleOutwardDialogClose = () => {
    setShowOutwardDialog(false);
    setOutwardError('');
  };

  // Line value setter
  const setLineValue = (idx, field, value) => {
    setLines((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
    const key = `l${idx}_${field}`;
    if (lineErrors[key]) setLineErrors((e) => ({ ...e, [key]: '' }));
  };

  // Recompute low stock warning
  // Recompute low stock warning and auto-fill category
  const recomputeLowStock = (idx, modelName) => {
    const normalizedModel = (modelName || '').toLowerCase();

    // 1. Try master product list for category and master stock status
    const p = productList.find((m) => (m.model || '').toLowerCase() === normalizedModel);

    // 2. Try current store inventory for specific store stock price/category
    const invItem = filteredInventory.find(item => (item.modelNo || '').toLowerCase() === normalizedModel);

    // Set Category and Sub Category
    const foundCategory = p?.category || invItem?.category || '';
    const foundSubCategory = p?.subCategory || invItem?.subCategory || '';
    setLineValue(idx, 'category', foundCategory);
    setLineValue(idx, 'subCategory', foundSubCategory);

    // Set Low Stock Warning
    const stock = p?.reorderLevel ?? 0;
    const text = stock <= 5 ? `Low stock: ${stock}` : '';
    setLineValue(idx, 'lowStockWarning', text);
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

  // Scan barcode handler
  const handleScanKeyDown = (e, idx) => {
    if (!scannerBuffers.current[idx]) scannerBuffers.current[idx] = '';
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = scannerBuffers.current[idx] || e.target.value;
      if (code) {
        setLineValue(idx, 'shd', code);
        processBarcode(idx, code);
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
        processBarcode(idx, code);
      }
      scannerBuffers.current[idx] = '';
    }, 200);
  };

  // Process barcode
  const processBarcode = (idx, overrideRaw) => {
    const ln = lines[idx];
    if (!ln) return;
    const rawInput = (overrideRaw || ln?.shd || '').trim();
    if (!rawInput) return;
    if (!ln.modelNo) {
      enqueueSnackbar('Enter Model No for this row first', { variant: 'error' });
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
      let capReached = false;

      for (const code of barcodes) {
        if (cap !== Infinity && nextList.length >= cap) {
          capReached = true;
          break;
        }

        // Check if barcode already exists in database
        if (existingBarcodesMap[code]) {
          dbExistBarcodes.push({ code, modelNo: existingBarcodesMap[code] });
          continue;
        }

        // Duplicate check (both in current session and globally in this form)
        if (globalScanned.has(code) || nextList.includes(code)) {
          duplicateBarcodes.push(code);
          continue;
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

      if (dbExistBarcodes.length > 0) {
        setTimeout(() => {
          const msg = `This Serial Number is Already Exist in ${dbExistBarcodes[0].modelNo}`;
          setLineErrors((e) => ({ ...e, [`l${idx}_shd`]: msg }));
          dbExistBarcodes.forEach(({ code, modelNo }) => {
            enqueueSnackbar(`Already exists in ${modelNo}: ${code}`, { variant: 'error' });
          });
        }, 0);
      } else if (duplicateBarcodes.length > 0) {
        setTimeout(() => {
          setLineErrors((e) => ({ ...e, [`l${idx}_shd`]: 'This barcode is already scanned' }));
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
        L.scannedList = nextList;
        L.scannedCodes = nextList.join(', ');
        if (!L.isQuantityManual) L.quantity = nextList.length;
        L.shd = '';
        arr[idx] = L;

        const left = remainingForLine(L);
        setTimeout(() => {
          enqueueSnackbar(
            left === Infinity ? `Accepted ${addedCount} barcode(s) for ${L.modelNo}` : `Accepted ${addedCount} barcode(s) (${L.modelNo}). Remaining: ${left}`,
            { variant: 'success' }
          );
        }, 0);
      } else {
        L.shd = '';
        arr[idx] = L;
      }
      return arr;
    });
  };

  // Form validation
  const validateForm = () => {
    const eLine = {};
    let ok = true;
    if (lines.length === 0) {
      enqueueSnackbar('Add at least one model row', { variant: 'error' });
      ok = false;
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

      if (!ln.price || Number(ln.price) <= 0) {
        eLine[key('price')] = 'Price per Unit is required and must be > 0';
        ok = false;
      }
      if (user?.role === 'CCTV Shoppee Avadi' && !ln.owner) {
        eLine[key('owner')] = 'Owner is required';
        ok = false;
      }
      const requestedQty = Number(ln.quantity);
      const scannedCount = ln.scannedList?.length || 0;

      if (scannedCount === 0) {
        eLine[key('shd')] = 'Barcode scanning is mandatory';
        enqueueSnackbar(`Row #${i + 1}: Please scan at least one barcode`, { variant: 'error' });
        ok = false;
      } else if (requestedQty > 0 && scannedCount !== requestedQty) {
        eLine[key('shd')] = `Scan mismatch: ${scannedCount}/${requestedQty} scanned`;
        enqueueSnackbar(`Row #${i + 1}: Scan count (${scannedCount}) does not match entered quantity (${requestedQty})`, { variant: 'error' });
        ok = false;
      }

      if (requestedQty <= 0 && scannedCount <= 0) {
        eLine[key('quantity')] = 'Quantity must be greater than 0';
        ok = false;
      }
    });
    setLineErrors(eLine);
    return ok;
  };

  // Inward submit handler
  const handleInwardSubmit = async () => {
    if (!validateForm()) {
      enqueueSnackbar('Please fix the errors before submitting!', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);

      for (const ln of lines) {
        if (!ln.modelNo || qtyForLine(ln) <= 0) continue;

        const qty = qtyForLine(ln);
        const product = productList.find((p) => p.model === ln.modelNo);
        const updatedReorder = (product?.reorderLevel || 0) + qty;
        const newStatus = statusForQty(updatedReorder);



        // ✅ 2️⃣ Save Stock Inward record
        const inwardPayload = {
          modelNo: ln.modelNo,
          quantity: qty,
          pricePerUnit: Number(ln.price) || 0,
          storeName: user?.role || "JAIPUR",
          userId: user?.id || "unknown-user",
          scannedBarcode: Array.isArray(ln.scannedList) ? ln.scannedList : (ln.scannedCodes ? ln.scannedCodes.split(',') : []),
          brand: product?.brand || "",
          category: ln.category || product?.category || "",
          subCategory: ln.subCategory || product?.subCategory || "",
          mrp: product?.mrp || 0,
          dealerPrice: product?.dealerPrice || 0,
          owner: ln.owner || "",
        };

        console.log("📦 Sending Inward Payload:", inwardPayload);
        const response = await axios.post(`${API_BASE}/store-inward`, inwardPayload);

        if (!response.data.success) {
          console.error("❌ Failed inward:", response.data);
          enqueueSnackbar(`Failed to save ${ln.modelNo}: ${response.data.error || 'Unknown error'}`, { variant: 'error' });
        } else {
          console.log("✅ Saved inward:", response.data);
        }
      }

      enqueueSnackbar('Stock inward recorded and stocks updated successfully!', { variant: 'success' });
      handleInwardDialogClose();

      // ✅ Refresh data
      const res = await axios.get(`${API_BASE}/dispatch`);
      const updatedData = res.data;
      setInventoryData(updatedData);
      if (user?.role) {
        const filtered = updatedData.filter(item =>
          item.storeName?.toLowerCase() === user.role?.toLowerCase()
        );
        setFilteredInventory(aggregateInventory(filtered));
      } else {
        setFilteredInventory(aggregateInventory(updatedData));
      }
    } catch (err) {
      console.error("❌ Inward Error:", err.response?.data || err.message);
      enqueueSnackbar('Failed to submit stock inward!', { variant: 'error' });
    } finally {
      setLoading(false);
    }
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
    return products[0]?.model || '';
  };

  // Add line
  const addLine = () => {
    setLines((prev) => {
      const newIdx = prev.length;
      const nextLine = makeEmptyLine();
      const autoModel = getNextModelForNewLine(prev, productList);
      if (autoModel) {
        nextLine.modelNo = autoModel;
        const prod = productList.find((p) => p.model === autoModel);
        const stock = prod?.reorderLevel ?? 0;
        nextLine.lowStockWarning = stock <= 5 ? `Low stock: ${stock}` : '';
        if (prod?.category) {
          nextLine.category = prod.category;
        }
        if (prod?.subCategory) {
          nextLine.subCategory = prod.subCategory;
        }
      }
      const next = [...prev, nextLine];
      setTimeout(() => {
        if (shdRefs.current[newIdx]) {
          shdRefs.current[newIdx].focus();
        }
      }, 0);
      return next;
    });
  };

  // Remove line
  const removeLine = (idx) => {
    setLines((prev) => {
      const target = prev[idx];
      if (target?.scannedList?.length) {
        const ns = new Set(globalScanned);
        target.scannedList.forEach((c) => ns.delete(c));
        setGlobalScanned(ns);
      }
      const next = prev.slice(0, idx).concat(prev.slice(idx + 1));
      return next.length ? next : [makeEmptyLine()];
    });
  };

  // Updated Outward submit handler with proper inventory reduction
  const handleOutwardSubmit = async () => {
    if (!validateForm()) {
      enqueueSnackbar('Please fix the errors before submitting!', { variant: 'error' });
      return;
    }
    if (!outwardFormData.customerName || !outwardFormData.selectedCustomer) {
      enqueueSnackbar('Please select a customer!', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      const results = [];

      for (const ln of lines) {
        if (!ln.modelNo || qtyForLine(ln) <= 0) continue;

        console.log("Submitting line price:", ln.price);
        const outwardData = {
          modelNo: ln.modelNo,
          quantity: qtyForLine(ln),
          reason: "Stock Outward",
          userId: user?.id || "unknown-user",
          storeName: user?.role || "JAIPUR",
          customerName: outwardFormData.customerName,
          customerMobile: outwardFormData.selectedCustomer?.phoneNo || "",
          customerAddress: outwardFormData.selectedCustomer?.address || "",
          scannedCodes: ln.scannedCodes || "",
          scannedList: ln.scannedList || [],
          price: ln.price || 0,
          salePerson: ln.salePerson || "",
          category: ln.category || "",
          subCategory: ln.subCategory || "",
          owner: ln.owner || "",
        };

        console.log("Sending outward data:", outwardData);
        const response = await axios.post(`${API_BASE}/stock-outward`, outwardData);
        console.log("Backend response:", response.data);
        results.push(response.data);

        // Update dispatch inventory in the database
        if (response.data.success) {
          const storeNameForMatch = user?.role || "JAIPUR";
          const matchingRecords = (inventoryData || [])
            .filter(item =>
              item.modelNo === ln.modelNo &&
              item.storeName?.toLowerCase() === storeNameForMatch.toLowerCase()
            )
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

          let remainingToOutward = qtyForLine(ln);
          let barcodesToOutward = Array.isArray(ln.scannedList) ? [...ln.scannedList] : [];

          for (const record of matchingRecords) {
            if (remainingToOutward <= 0) break;
            const qtyInRecord = Number(record.quantity) || 0;
            const take = Math.min(qtyInRecord, remainingToOutward);
            const newQty = Math.max(0, qtyInRecord - take);
            remainingToOutward -= take;

            let recordBarcodes = Array.isArray(record.barcodes)
              ? record.barcodes
              : (record.barcodes ? record.barcodes.split(',').map(b => b.trim()).filter(Boolean) : []);

            const barcodesTaken = barcodesToOutward.filter(b => recordBarcodes.includes(b));
            const barcodesRemainingInRecord = recordBarcodes.filter(b => !barcodesTaken.includes(b));
            barcodesToOutward = barcodesToOutward.filter(b => !barcodesTaken.includes(b));

            await axios.put(`${API_BASE}/dispatch/${record._id}`, {
              quantity: newQty,
              barcodes: barcodesRemainingInRecord
            });
          }

          // Update product stock levels in products table
          const fresh = await axios.get(`${API_BASE}/products`);
          const products = fresh.data || [];
          const product = products.find((p) => p.model === ln.modelNo);
          if (product) {
            const qty = qtyForLine(ln);
            const updatedReorder = Math.max(0, (product.reorderLevel || 0) - qty);
            const newStatus = statusForQty(updatedReorder);
            await axios.put(`${API_BASE}/products/${product._id}`, {
              reorderLevel: updatedReorder,
              stockStatus: newStatus,
            });
          }
        }
      }

      // Refresh inventory data after all updates
      const updatedDataResponse = await axios.get(`${API_BASE}/dispatch`);
      const updatedData = updatedDataResponse.data;
      setInventoryData(updatedData);

      if (user?.role) {
        const filtered = updatedData.filter(item =>
          item.storeName?.toLowerCase() === user.role?.toLowerCase()
        );
        setFilteredInventory(aggregateInventory(filtered));
      } else {
        setFilteredInventory(aggregateInventory(updatedData));
      }

      // Check if all operations were successful
      const allSuccess = results.every(result => result.success);
      if (allSuccess) {
        enqueueSnackbar('Stock outward successful! Inventory updated.', { variant: 'success' });
        handleOutwardDialogClose();
      } else {
        const errors = results.filter(result => !result.success).map(r => r.error);
        setOutwardError(`Some items failed: ${errors.join(', ')}`);
      }
    } catch (err) {
      console.error("Error details:", err);
      console.error("Error response:", err.response?.data);
      setOutwardError(err.response?.data?.error || err.message || 'Server error');
      enqueueSnackbar('Failed to submit stock outward', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Render
  if (loading) return <Spinner message="Loading inventory data..." />;
  if (error) return <div style={{ textAlign: 'center', padding: '20px', fontSize: '18px', color: '#dc2626' }}>Error: {error}</div>;

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px' }}>
      {/* Dashboard Overview */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', margin: '0 0 8px 0' }}>{user?.role || 'All Stores'} - Dashboard Overview</h1>
        <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>Monitor your inventory levels and stock movements</p>
      </div>

      {/* Error Alerts */}
      {outwardError && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px', marginBottom: '24px', color: '#dc2626' }}>
          <strong>Error:</strong> {outwardError}
          <button onClick={() => setOutwardError('')} style={{ float: 'right', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>×</button>
        </div>
      )}
      {inwardError && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px', marginBottom: '24px', color: '#dc2626' }}>
          <strong>Error:</strong> {inwardError}
          <button onClick={() => setInwardError('')} style={{ float: 'right', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Dashboard Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <svg style={{ width: '24px', height: '24px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <h3 style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', margin: 0 }}>Total Items</h3>
          </div>
          <p style={{ fontSize: '36px', fontWeight: '700', color: '#1f2937', margin: 0 }}>{totalItems}</p>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="#dc2626" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.598 0L3.34 16.5c-.77.833.192 2.5 1.742 2.5z" />
            </svg>
            <h3 style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', margin: 0 }}>Low Stock</h3>
          </div>
          <p style={{ fontSize: '36px', fontWeight: '700', color: '#1f2937', margin: 0 }}>{lowStockItems}</p>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', margin: 0 }}>Products</h3>
          </div>
          <p style={{ fontSize: '36px', fontWeight: '700', color: '#1f2937', margin: 0 }}>{totalProducts}</p>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <svg style={{ width: '24px', height: '24px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 7h8M8 11h8M12 11v6l-3-2" />
            </svg>
            <h3 style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', margin: 0 }}>Out of Stock</h3>
          </div>
          <p style={{ fontSize: '36px', fontWeight: '700', color: '#1f2937', margin: 0 }}>{outOfStockItems}</p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card full-width-on-mobile" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#fafafa', padding: '20px', borderRadius: '5px', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            Current Inventory {user?.role && `for ${user.role}`}
          </h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200, backgroundColor: 'white' }}>
              <InputLabel>Category Filter</InputLabel>
              <Select
                value={tableCategoryFilter}
                label="Category Filter"
                onChange={(e) => {
                  setTableCategoryFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="All">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat._id} value={cat.name}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="error"
              startIcon={<AddIcon />}
              onClick={handleOutwardDialogOpen}
            >
              Store Outward
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleInwardDialogOpen}
            >
              Store Inward
            </Button>
          </div>
        </div>

        {filteredInventory.length > 0 ? (
          displayedInventory.length > 0 ? (
            <>
              <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                  <thead style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <tr>
                      <th style={{ padding: '12px 0', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model No</th>
                      <th style={{ padding: '12px 0', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                      <th style={{ padding: '12px 0', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sub Category</th>
                      <th style={{ padding: '12px 0', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer Name</th>
                      <th style={{ padding: '12px 0', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', width: '50%' }}>Barcode</th>
                      <th style={{ padding: '12px 0', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity</th>
                      <th style={{ padding: '12px 0', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price per Unit</th>
                      <th style={{ padding: '12px 0', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sale Person</th>
                      <th style={{ padding: '12px 0', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Store Name</th>
                      <th style={{ padding: '12px 0', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STATUS</th>
                      {!user?.role && <th style={{ padding: '12px 0', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STORE</th>}
                      <th style={{ padding: '12px 0', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DELETE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedInventory
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((item, index) => (
                        <tr key={index}>
                          <td style={{ padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}><h4 style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', margin: '0 0 4px 0' }}>{item.modelNo}</h4></td>
                          <td style={{ padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}><span style={{ fontSize: '14px', color: '#374151' }}>{item.category || '-'}</span></td>
                          <td style={{ padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}><span style={{ fontSize: '14px', color: '#374151' }}>{item.subCategory || '-'}</span></td>
                          <td style={{ padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}><span style={{ fontSize: '14px', color: '#374151' }}>{item.customerName}</span></td>
                          <td style={{ padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}>
                            <span style={{ fontSize: '14px', color: '#374151' }}>
                              {Array.isArray(item.barcodes)
                                ? (item.barcodes.length > 0 ? item.barcodes.join(', ') : 'NA')
                                : (item.barcodes ? item.barcodes : 'NA')}
                            </span>
                          </td>

                          <td style={{ padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}><span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{item.quantity}</span></td>
                          <td style={{ padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}><span style={{ fontSize: '14px', color: '#374151' }}>{item.price}</span></td>
                          <td style={{ padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}><span style={{ fontSize: '14px', color: '#374151' }}>{item.salePerson}</span></td>
                          <td style={{ padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}><span style={{ fontSize: '14px', color: '#374151' }}>{item.storeName}</span></td>
                          <td style={{ padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}><span style={getStatusStyle(item.quantity)}>{getStatusText(item.quantity)}</span></td>
                          {!user?.role && <td style={{ padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}><span>{item.storeName}</span></td>}
                          <td style={{ padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}>
                            <IconButton
                              onClick={() => handleOpenDeleteDialog(item)}
                              style={{ color: '#ef4444' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={displayedInventory.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                style={{ marginTop: '20px' }}
              />
            </>
          ) : (
            <p style={{ textAlign: 'center', margin: '40px 0', color: '#6b7280', fontSize: '16px', fontWeight: '500' }}>No Data in this Category</p>
          )
        ) : (
          <p>No inventory data available{user?.role && ` for ${user.role}`}.</p>
        )}
      </div>

      {/* Low Stock Alert */}
      {
        lowStockItems > 0 && (
          <div style={{ backgroundColor: '#fef2f2', borderRadius: '12px', padding: '20px', border: '1px solid #fecaca' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <svg style={{ width: '20px', height: '20px', color: '#dc2626' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#dc2626', margin: 0 }}>Low Stock Alert</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#7f1d1d', margin: 0 }}>
              {filteredInventory
                .filter(item => item.quantity < 5 && item.quantity > 0)
                .map(item => `${item.modelNo} - Only ${item.quantity} units left`)
                .join(', ')}
            </p>
          </div>
        )
      }

      {/* Out of Stock Alert */}
      {
        outOfStockItems > 0 && (
          <div style={{ backgroundColor: '#fffbeb', borderRadius: '12px', padding: '20px', border: '1px solid #fcd34d', marginBottom: '24px', marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <svg style={{ width: '20px', height: '20px', color: '#d97706' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm0-9a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#d97706', margin: 0 }}>Out of Stock Items</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>
              {filteredInventory
                .filter(item => item.quantity === 0)
                .map(item => item.modelNo)
                .join(', ')}
            </p>
          </div>
        )
      }

      {/* Inward Dialog */}
      <Dialog open={showInwardDialog} onClose={handleInwardDialogClose} fullWidth maxWidth="lg">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Stock Inward
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addLine}
            color="primary"
          >
            Add Model
          </Button>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {lines.map((ln, idx) => {
              const product = productList.find((p) => p.model === ln.modelNo);
              const currentStock = product?.reorderLevel ?? 0;
              const incomingQty = qtyForLine(ln);
              const afterStock = currentStock + incomingQty;
              const remaining = remainingForLine(ln);
              const cap = capForLine(ln);
              return (
                <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography fontWeight={600}>Model #{idx + 1}</Typography>
                    <IconButton color="error" onClick={() => removeLine(idx)} disabled={lines.length === 1}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="Model No *"
                        value={ln.modelNo || ''}
                        onChange={(e) => {
                          setLineValue(idx, 'modelNo', e.target.value);
                          recomputeLowStock(idx, e.target.value);
                          // Set the price from the selected product
                          const selectedProduct = productList.find((p) => p.model === e.target.value);
                          if (selectedProduct) {
                            setLineValue(idx, 'price', selectedProduct.price || 0);
                          }
                        }}
                        fullWidth
                        error={!!lineErrors[`l${idx}_modelNo`]}
                        helperText={lineErrors[`l${idx}_modelNo`]}
                      />
                      <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                        Current stock: {currentStock}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth error={!!lineErrors[`l${idx}_category`]}>
                        <InputLabel>Category *</InputLabel>
                        <Select
                          label="Category *"
                          value={ln.category || ''}
                          onChange={(e) => setLineValue(idx, 'category', e.target.value)}
                        >
                          {categories.map((cat) => (
                            <MenuItem key={cat._id} value={cat.name}>
                              {cat.name}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>{lineErrors[`l${idx}_category`]}</FormHelperText>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth error={!!lineErrors[`l${idx}_subCategory`]}>
                        <InputLabel>Sub Category</InputLabel>
                        <Select
                          label="Sub Category"
                          value={ln.subCategory || 'None'}
                          onChange={(e) => setLineValue(idx, 'subCategory', e.target.value)}
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
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="Quantity *"
                        type="number"
                        fullWidth
                        value={ln.quantity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setLineValue(idx, 'isQuantityManual', true);
                          setLineValue(idx, 'quantity', e.target.value);
                        }}
                        error={!!lineErrors[`l${idx}_quantity`]}
                        helperText={lineErrors[`l${idx}_quantity`] || 'Typed value caps how many barcodes you can scan for this row'}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                          After inward: {afterStock} {incomingQty > 0 ? `( +${incomingQty} )` : ''}
                        </Typography>
                        <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                          {cap === Infinity ? 'No scan limit' : `Remaining scans allowed: ${remaining}`}
                        </Typography>
                      </div>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="Price per Unit *"
                        type="number"
                        fullWidth
                        value={ln.price || ''}
                        onChange={(e) => setLineValue(idx, 'price', e.target.value)}
                        error={!!lineErrors[`l${idx}_price`]}
                        helperText={lineErrors[`l${idx}_price`]}
                      />
                    </Grid>
                    {user?.role === 'CCTV Shoppee Avadi' && (
                      <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth error={!!lineErrors[`l${idx}_owner`]}>
                          <InputLabel>Owner *</InputLabel>
                          <Select
                            label="Owner *"
                            value={ln.owner || ''}
                            onChange={(e) => setLineValue(idx, 'owner', e.target.value)}
                          >
                            <MenuItem value="CCTV Shoppee Avadi.">CCTV Shoppee Avadi.</MenuItem>
                            <MenuItem value="Lookman CCTV Avadi.">Lookman CCTV Avadi.</MenuItem>
                          </Select>
                          <FormHelperText>{lineErrors[`l${idx}_owner`]}</FormHelperText>
                        </FormControl>
                      </Grid>
                    )}
                    <Grid item xs={12} md={8}>
                      <TextField
                        label="Scan barcode"
                        fullWidth
                        value={ln.shd}
                        onChange={(e) => setLineValue(idx, 'shd', e.target.value)}
                        onKeyDown={(e) => handleScanKeyDown(e, idx)}
                        error={!!lineErrors[`l${idx}_shd`]}
                        helperText={
                          lineErrors[`l${idx}_shd`] ||
                          (cap === Infinity
                            ? 'Scan any barcode'
                            : `Allowed up to ${cap} scans for this row`)
                        }
                        inputRef={(el) => (shdRefs.current[idx] = el)}
                        disabled={remaining === 0}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Scanned Codes"
                        fullWidth
                        multiline
                        rows={3}
                        value={ln.scannedCodes}
                        InputProps={{ readOnly: true }}
                        required
                      />
                      <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                        Total scanned: {ln.scannedList.length}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleInwardDialogClose} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button onClick={handleInwardSubmit} startIcon={<SaveIcon />} color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Outward Dialog */}
      <Dialog open={showOutwardDialog} onClose={handleOutwardDialogClose} fullWidth maxWidth="md">
        <DialogTitle>Store Outward</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Customer Name *</InputLabel>
              <Select
                value={outwardFormData.customerName}
                onChange={(e) => {
                  const selectedCustomer = customerNames.find(c => c.customerName === e.target.value);
                  setOutwardFormData({
                    ...outwardFormData,
                    customerName: e.target.value,
                    selectedCustomer: selectedCustomer || null,
                  });
                }}
                label="Customer Name *"
                disabled={loadingCustomers}
              >
                {loadingCustomers ? (
                  <MenuItem disabled>Loading customers...</MenuItem>
                ) : customerNames.length > 0 ? (
                  customerNames.map((customer, index) => (
                    <MenuItem key={index} value={customer.customerName}>
                      {customer.customerName} ({customer.customerMobile})
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No customers found</MenuItem>
                )}
              </Select>
            </FormControl>

            {outwardFormData.selectedCustomer && (
              <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Customer Details
                </Typography>
                <Typography variant="body2">
                  <strong>Mobile:</strong> {outwardFormData.selectedCustomer.phoneNo}
                </Typography>
                <Typography variant="body2">
                  <strong>Address:</strong> {outwardFormData.selectedCustomer.address}
                </Typography>
              </Paper>
            )}

            {lines.map((ln, idx) => {
              const selectedProduct = filteredInventory.find(item => item.modelNo === ln.modelNo);
              const currentStock = selectedProduct?.quantity ?? 0;
              const price = selectedProduct?.price ?? 0;
              const incomingQty = qtyForLine(ln);
              const afterStock = Math.max(0, currentStock - incomingQty);
              const remaining = remainingForLine(ln);
              const cap = capForLine(ln);

              return (
                <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography fontWeight={600}>Model #{idx + 1}</Typography>
                    <IconButton color="error" onClick={() => removeLine(idx)} disabled={lines.length === 1}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth error={!!lineErrors[`l${idx}_modelNo`]}>
                        <InputLabel>Model No *</InputLabel>
                        <Select
                          label="Model No *"
                          value={ln.modelNo}
                          onChange={(e) => {
                            setLineValue(idx, 'modelNo', e.target.value);
                            recomputeLowStock(idx, e.target.value);
                            // Set the price from the selected product or master product
                            const selectedProduct = filteredInventory.find(item => item.modelNo === e.target.value);
                            const masterProduct = productList.find(p => p.model === e.target.value);

                            if (selectedProduct || masterProduct) {
                              setLineValue(idx, 'price', selectedProduct?.price || masterProduct?.dealerPrice || 0);
                            }
                          }}
                        >
                          {filteredInventory.map((item, index) => (
                            <MenuItem key={index} value={item.modelNo}>{item.modelNo}</MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>{lineErrors[`l${idx}_modelNo`]}</FormHelperText>
                      </FormControl>
                      {ln.modelNo && (
                        <>
                          <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                            Current stock: {currentStock}
                          </Typography>
                          <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                            Price: {price}
                          </Typography>
                        </>
                      )}
                    </Grid>
                    {ln.modelNo && (
                      <>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            label="Category"
                            fullWidth
                            value={ln.category}
                            onChange={(e) => setLineValue(idx, 'category', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            label="Sub Category"
                            fullWidth
                            value={ln.subCategory}
                            onChange={(e) => setLineValue(idx, 'subCategory', e.target.value)}
                          />
                        </Grid>
                      </>
                    )}
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="Quantity *"
                        type="number"
                        fullWidth
                        value={ln.quantity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setLineValue(idx, 'isQuantityManual', true);
                          setLineValue(idx, 'quantity', e.target.value);
                        }}
                        error={!!lineErrors[`l${idx}_quantity`]}
                        helperText={
                          lineErrors[`l${idx}_quantity`] ||
                          'Typed value caps how many barcodes you can scan for this row'
                        }
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                          After outward: {afterStock} {incomingQty > 0 ? `( -${incomingQty} )` : ''}
                        </Typography>
                        <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                          {cap === Infinity ? 'No scan limit' : `Remaining scans allowed: ${remaining}`}
                        </Typography>
                      </div>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="Price *"
                        type="number"
                        fullWidth
                        value={ln.price || price}
                        onChange={(e) => setLineValue(idx, 'price', e.target.value)}
                        error={!!lineErrors[`l${idx}_price`]}
                        helperText={lineErrors[`l${idx}_price`]}
                      />
                    </Grid>
                    {user?.role === 'CCTV Shoppee Avadi' && (
                      <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth error={!!lineErrors[`l${idx}_owner`]}>
                          <InputLabel>Owner *</InputLabel>
                          <Select
                            label="Owner *"
                            value={ln.owner || ''}
                            onChange={(e) => setLineValue(idx, 'owner', e.target.value)}
                          >
                            <MenuItem value="CCTV Shoppee Avadi.">CCTV Shoppee Avadi.</MenuItem>
                            <MenuItem value="Lookman CCTV Avadi.">Lookman CCTV Avadi.</MenuItem>
                          </Select>
                          <FormHelperText>{lineErrors[`l${idx}_owner`]}</FormHelperText>
                        </FormControl>
                      </Grid>
                    )}
                    <Grid item xs={12} md={8}>
                      <TextField
                        label="Scan barcode"
                        fullWidth
                        value={ln.shd}
                        onChange={(e) => setLineValue(idx, 'shd', e.target.value)}
                        onKeyDown={(e) => handleScanKeyDown(e, idx)}
                        error={!!lineErrors[`l${idx}_shd`]}
                        helperText={
                          lineErrors[`l${idx}_shd`] ||
                          (cap === Infinity
                            ? 'Barcode must include any continuous 5 or 4 chars from Model No'
                            : `Allowed up to ${cap} scans for this row`)
                        }
                        inputRef={(el) => (shdRefs.current[idx] = el)}
                        disabled={remaining === 0}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Scanned Codes"
                        fullWidth
                        multiline
                        rows={3}
                        value={ln.scannedCodes}
                        InputProps={{ readOnly: true }}
                      />
                      <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                        Total scanned: {ln.scannedList.length}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleOutwardDialogClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleOutwardSubmit}
            color="primary"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete {productToDelete?.modelNo}?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteProduct} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Alert */}
      <Dialog open={showSuccessAlert} onClose={() => setShowSuccessAlert(false)}>
        <DialogContent>
          <Alert severity="success" onClose={() => setShowSuccessAlert(false)}>
            Stock inward recorded and stocks updated successfully!
          </Alert>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default Storemanagement;


