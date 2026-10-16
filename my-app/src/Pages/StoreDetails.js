import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Package, TrendingUp, Triangle, Minus, Search, RotateCcw } from 'lucide-react';
import PhoneIcon from '@mui/icons-material/Phone';
import './InventoryDashboard.css';
import StoreIcon from '@mui/icons-material/Store';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const API = 'https://coloroninventoy.onrender.com/api';

const InventoryDashboard = () => {
  const [selectedStore, setSelectedStore] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [warehouseList, setWarehouseList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [dispatch, setDispatch] = useState([]);
  const [stockInward, setStockInward] = useState([]);
  const [stockInwardLoading, setStockInwardLoading] = useState(false);
  const [stockInwardError, setStockInwardError] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [stockInwardCurrentPage, setStockInwardCurrentPage] = useState(1);
  const stockInwardItemsPerPage = 5;
  const [isOutwardOpen, setIsOutwardOpen] = useState(false);
  const [outwardItem, setOutwardItem] = useState(null);
  const [outQty, setOutQty] = useState('');
  const [outReason, setOutReason] = useState('');
  const [outRef, setOutRef] = useState('');
  const [formErr, setFormErr] = useState('');
  const [stockInwardSearch, setStockInwardSearch] = useState('');
  const [detailFromDate, setDetailFromDate] = useState('');
  const [detailToDate, setDetailToDate] = useState('');

  // Helper: Format currency
  const inr = (n) => `₹ ${Number(n || 0).toLocaleString('en-IN')}`;

  // Helper: Convert to number
  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // Helper: Prefer the first valid number
  const preferNum = (...vals) => {
    for (const v of vals) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return 0;
  };

  // Helper: Normalize string
  const norm = (s) =>
    (s ?? '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');

  // Helper: Tokenize string
  const tokens = (s) =>
    norm(s)
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(' ')
      .filter(Boolean);

  // Helper: Calculate overlap score
  const overlapScore = (a, b) => {
    const A = new Set(tokens(a));
    const B = new Set(tokens(b));
    if (A.size === 0 || B.size === 0) return 0;
    let inter = 0;
    for (const t of A) if (B.has(t)) inter++;
    return inter / Math.max(A.size, B.size);
  };

  // Helper: Get quantity of an item
  const qtyOf = (it) => {
    const candidates = ['quantity', 'qty', 'stock', 'availableQty', 'available', 'reorderQty'];
    for (const k of candidates) {
      const n = num(it?.[k]);
      if (n) return n;
    }
    return 0;
  };

  // Helper: Match store names
  const matchesStore = (itemStoreName, selectedStoreName) => {
    return norm(itemStoreName) === norm(selectedStoreName);
  };

  // Helper: Get transaction/record date
  const getRecordDate = (rec) => {
    const raw = rec?.createdAt || rec?.updatedAt || rec?.date || rec?.dispatchDate;
    const d = raw ? new Date(raw) : null;
    return d && !isNaN(d.getTime()) ? d : null;
  };

  // Build a quick lookup map for product pricing by model
  const productsByModel = useMemo(() => {
    const map = {};
    for (const p of products) {
      const key = (p.modelNo || p.model || '').toString().trim();
      if (!key) continue;
      map[key] = p;
    }
    return map;
  }, [products]);

  // Resolve per-unit price for any row
  const unitPriceOf = (it) => {
    const perUnit = preferNum(
      it?._unitPrice,
      it?.unitPrice,
      it?.price,
      it?.rate,
      it?.mrp,
      it?.dealerPrice
    );
    if (perUnit) return perUnit;
    const q = qtyOf(it);
    const total = preferNum(
      it?.value,
      it?.amount,
      it?.totalValue,
      it?.lineTotal,
      it?.priceTotal,
      it?.total
    );
    if (q > 0 && total) return total / q;
    const modelKey = (it?.modelNo || it?.model || '').toString().trim();
    const prod = productsByModel[modelKey];
    return preferNum(prod?.mrp, prod?.dealerPrice, 0);
  };

  // Calculate row value
  const rowValue = (it) => {
    const total = preferNum(
      it?.value,
      it?.amount,
      it?.totalValue,
      it?.lineTotal,
      it?.priceTotal,
      it?.total,
      it?._rowTotal
    );
    if (total) return total;
    return unitPriceOf(it) * qtyOf(it);
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const [customersRes, productsRes, inventoryRes, usersRes, whRes] = await Promise.all([
          fetch(`${API}/customers`),
          fetch(`${API}/products`),
          fetch(`${API}/inventory`),
          fetch(`${API}/users`).catch(() => ({ ok: false })),
          fetch(`${API}/warehouses`).catch(() => ({ ok: false })),
        ]);
        if (!customersRes.ok || !productsRes.ok || !inventoryRes.ok) {
          throw new Error('Failed to load initial data');
        }
        setCustomers(await customersRes.json());
        setProducts(await productsRes.json());
        setInventory(await inventoryRes.json());

        if (usersRes.ok) {
          const uData = await usersRes.json();
          setUsersList(uData?.users || (Array.isArray(uData) ? uData : []));
        }
        if (whRes.ok) {
          const wData = await whRes.json();
          setWarehouseList(Array.isArray(wData) ? wData : []);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  // Filter out any Store that belongs to a Warehouse account or facility
  const nonWarehouseCustomers = useMemo(() => {
    const warehouseIdentifiers = new Set();

    // 1. User accounts with role === 'Warehouse'
    usersList.forEach((u) => {
      const r = (u.role || '').trim().toLowerCase();
      if (r === 'warehouse') {
        if (u.warehouseName) warehouseIdentifiers.add(norm(u.warehouseName));
        if (u.assignedLocation) warehouseIdentifiers.add(norm(u.assignedLocation));
        if (u.locationTag) warehouseIdentifiers.add(norm(u.locationTag));
        if (u.name) warehouseIdentifiers.add(norm(u.name));
        if (u.email) warehouseIdentifiers.add(norm(u.email));
      }
    });

    // 2. Warehouses collection
    warehouseList.forEach((w) => {
      if (w.warehouse) warehouseIdentifiers.add(norm(w.warehouse));
      if (w.name) warehouseIdentifiers.add(norm(w.name));
      if (w.city) warehouseIdentifiers.add(norm(w.city));
    });

    return customers.filter((c) => {
      if (norm(c.role) === 'warehouse' || norm(c.type) === 'warehouse') return false;

      const sName = norm(c.storeName);
      const cName = norm(c.customerName);
      const addr = norm(c.address);
      const city = norm(c.city);
      const email = norm(c.email);

      // Check if store matches warehouse user account or warehouse location
      for (const wid of warehouseIdentifiers) {
        if (!wid) continue;
        if (
          sName === wid ||
          cName === wid ||
          addr === wid ||
          city === wid ||
          email === wid ||
          (wid.length > 3 && (sName.includes(wid) || cName.includes(wid)))
        ) {
          return false;
        }
      }

      return true;
    });
  }, [customers, usersList, warehouseList]);

  // Check if an inventory item belongs to a store
  const belongsToStore = (inv, store) => {
    const sId = store?._id ? String(store._id) : null;
    const invIds = [
      inv.storeId,
      inv.customerId,
      inv.store?._id,
      inv.customer?._id,
    ]
      .filter(Boolean)
      .map((x) => String(x));
    if (sId && invIds.includes(sId)) return true;
    const invNames = [inv.storeName, inv.location, inv.customerName, inv.store?.name]
      .filter(Boolean)
      .map(norm);
    const storeNames = [store.storeName, store.address, store.customerName]
      .filter(Boolean)
      .map(norm);
    for (const a of invNames) {
      if (!a) continue;
      for (const b of storeNames) {
        if (a && b && a === b) return true;
      }
    }
    for (const a of invNames) {
      for (const b of storeNames) {
        if (overlapScore(a, b) >= 0.75) return true;
      }
    }
    for (const a of invNames) {
      for (const b of storeNames) {
        if (!a || !b) continue;
        if (a.includes(b) || b.includes(a)) return true;
      }
    }
    return false;
  };

  // Aggregate data for a store
  const aggregateForStore = (invRows, store) => {
    const seen = new Set();
    let totalPrice = 0;
    let productLines = 0;
    let lowStockAlerts = 0;
    for (const inv of invRows) {
      if (!belongsToStore(inv, store)) continue;
      const qty = qtyOf(inv);
      const price = preferNum(inv.mrp, inv.dealerPrice);
      totalPrice += price * qty;
      const modelKey = inv.modelNo || inv.model || inv._id || '';
      if (!seen.has(modelKey)) {
        seen.add(modelKey);
        productLines += 1;
      }
      if (qty > 0 && qty <= 5) lowStockAlerts += 1;
    }
    return { totalPrice, productLines, lowStockAlerts };
  };

  // Handle store click
  const handleStoreClick = async (store) => {
    setSelectedStore(store);
    setSearchTerm('');
    setDetailFromDate('');
    setDetailToDate('');
    setCurrentPage(1);
    setStockInwardCurrentPage(1);
    setLoading(true);
    setError(null);
    setStockInwardLoading(true);
    setStockInwardError(null);
    try {
      // Fetch dispatch data
      const dispatchRes = await fetch(`${API}/dispatch?storeName=${encodeURIComponent(store.storeName)}`);
      if (!dispatchRes.ok) throw new Error(`Failed to fetch store dispatch data: ${dispatchRes.statusText}`);
      const dispatchData = await dispatchRes.json();
      const onceSorted = [...dispatchData].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const normalized = onceSorted.map((d) => {
        const q = qtyOf(d);
        const u = unitPriceOf(d);
        const v = q ? u * q : preferNum(d?.value, d?.amount, d?.totalValue);
        return { ...d, _unitPrice: u, _rowTotal: v };
      });
      setDispatch(normalized);

      // Fetch all stock inward data
      const stockInwardRes = await fetch(`https://coloroninventoy.onrender.com/api/store-inward`);
      if (!stockInwardRes.ok) throw new Error(`Failed to fetch stock inward data: ${stockInwardRes.statusText}`);
      const allStockInwardData = await stockInwardRes.json();

      // Filter for this specific store
      const storeStockInwardData = allStockInwardData.filter(item =>
        matchesStore(item.storeName, store.storeName)
      );
      setStockInward(storeStockInwardData);

      // Fetch recent transactions
      const recentTxRes = await fetch(`${API}/transactions?storeName=${encodeURIComponent(store.storeName)}`);
      if (!recentTxRes.ok) throw new Error(`Failed to fetch recent transactions: ${recentTxRes.statusText}`);
      const recentTxData = await recentTxRes.json();
      setRecentTx(recentTxData);
    } catch (e) {
      console.error('Error fetching data:', e);
      setError(e.message);
      setStockInwardError(e.message);
    } finally {
      setLoading(false);
      setStockInwardLoading(false);
    }
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    setSelectedStore(null);
    setDispatch([]);
    setStockInward([]);
    setRecentTx([]);
    setSearchTerm('');
    setDetailFromDate('');
    setDetailToDate('');
    setCurrentPage(1);
    setStockInwardCurrentPage(1);
    setStockInwardSearch('');
  };

  // Top cards data
  const totalProductValue = useMemo(
    () =>
      inventory.reduce(
        (sum, it) => sum + preferNum(it?.mrp, it?.dealerPrice) * qtyOf(it),
        0
      ),
    [inventory]
  );
  const totalStockUnits = useMemo(() => inventory.reduce((sum, it) => sum + qtyOf(it), 0), [inventory]);
  const totalLowStock = useMemo(() => inventory.filter((it) => {
    const q = qtyOf(it);
    return q > 0 && q <= 5;
  }).length, [inventory]);
  const cardData = [
    { title: 'Active Stores', value: nonWarehouseCustomers.filter((c) => Boolean(c.status)).length, icon: <StoreIcon style={{ color: '#005899' }} />, bg: 'kpi-bg-blue' },
    { title: 'Total Products', value: inr(totalProductValue), icon: <Inventory2Icon style={{ color: '#005b00' }} />, bg: 'kpi-bg-green' },
    { title: 'Total Stock', value: totalStockUnits, icon: <WarehouseIcon style={{ color: '#005700' }} />, bg: 'kpi-bg-green' },
    { title: 'Low Stock Alerts', value: totalLowStock, icon: <WarningAmberIcon style={{ color: '#9d0017' }} />, bg: 'kpi-bg-red', danger: true },
  ];

  // Pagination component
  const Pagination = ({ currentPage, totalPages, setCurrentPage }) => {
    const prev = () => setCurrentPage((p) => Math.max(p - 1, 1));
    const next = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
    return (
      <div className="inv-pagination">
        <button onClick={prev} disabled={currentPage === 1} className="inv-btn inv-btn-outline">
          Previous
        </button>
        <span className="inv-pagination__info">Page {currentPage} of {totalPages || 1}</span>
        <button onClick={next} disabled={currentPage === totalPages || totalPages === 0} className="inv-btn inv-btn-outline">
          Next
        </button>
      </div>
    );
  };

  // Outward Modal component
  const OutwardModal = ({ open, onClose, item, store }) => {
    if (!open || !item) return null;
    const onSubmit = async () => {
      setFormErr('');
      const q = num(outQty);
      if (!q) return setFormErr('Quantity is required.');
      if (q < 1) return setFormErr('Quantity must be at least 1.');
      const currentStock = qtyOf(item);
      if (q > currentStock) return setFormErr(`Only ${currentStock} units available.`);
      try {
        const transactionResponse = await fetch(`${API}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeName: store.storeName,
            customerName: store.customerName,
            modelNo: item.modelNo,
            quantity: q,
            unitPrice: unitPriceOf(item),
            value: unitPriceOf(item) * q,
            reason: outReason,
            reference: outRef,
            type: 'outward',
          }),
        });
        if (!transactionResponse.ok) {
          throw new Error('Failed to save transaction');
        }
        const dispatchResponse = await fetch(`${API}/dispatch/${item._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quantity: currentStock - q,
          }),
        });
        if (!dispatchResponse.ok) {
          throw new Error('Failed to update dispatch data');
        }
        setDispatch((prev) => {
          const idKey = item._id ?? item.id ?? null;
          return prev.map((d) => {
            const isMatch = idKey ? (d._id === idKey || d.id === idKey) : (d.modelNo === item.modelNo);
            if (!isMatch) return d;
            const newQty = Math.max(0, qtyOf(d) - q);
            const next = { ...d, quantity: newQty, _unitPrice: unitPriceOf(d) };
            if (typeof d.stock !== 'undefined') next.stock = Math.max(0, num(d.stock) - q);
            next._rowTotal = unitPriceOf(next) * qtyOf(next);
            return next;
          });
        });
        const tx = {
          customerName: store.customerName,
          storeName: store.storeName,
          location: store.location,
          modelNo: item.modelNo,
          quantity: q,
          reason: outReason,
          reference: outRef,
          type: 'outward',
          productName: item.productName || item.model || item.modelNo,
          createdAt: new Date().toISOString(),
        };
        setRecentTx((prev) => [tx, ...prev].slice(0, 50));
        setOutQty('');
        setOutReason('');
        setOutRef('');
        onClose();
      } catch (error) {
        setError(error.message);
      }
    };
    return (
      <div className="inv-modal__backdrop" onClick={onClose}>
        <div className="inv-modal__card" onClick={(e) => e.stopPropagation()}>
          <div className="inv-modal__header">
            <div className="inv-modal__title">
              <span className="inv-modal__icon">
                <Triangle size={18} />
              </span>
              Stock Outward
            </div>
            <button onClick={onClose} className="inv-btn inv-btn-link inv-modal__close">
              ×
            </button>
          </div>
          <div className="inv-modal__product">
            <div className="inv-modal__product-icon">
              <Package size={22} />
            </div>
            <div>
              <div className="inv-modal__product-name">{item.productName || item.model || item.modelNo}</div>
              <div className="inv-text-muted">SKU: {item.modelNo}</div>
              <div className="inv-text-muted">Current Stock: {qtyOf(item)} units</div>
              <div className="inv-text-muted">Unit Price: {inr(unitPriceOf(item))}</div>
            </div>
          </div>
          <label className="inv-form__label">Quantity</label>
          <input
            className="inv-input"
            type="number"
            min={1}
            value={outQty}
            onChange={(e) => setOutQty(e.target.value)}
            placeholder="Enter quantity"
          />
          {formErr && <div className="inv-form__error">{formErr}</div>}
          <label className="inv-form__label">Reason (Optional)</label>
          <input
            className="inv-input"
            value={outReason}
            onChange={(e) => setOutReason(e.target.value)}
            placeholder="e.g., Damaged items, Transfer, etc."
          />
          <label className="inv-form__label">Reference (Optional)</label>
          <input
            className="inv-input"
            value={outRef}
            onChange={(e) => setOutRef(e.target.value)}
            placeholder="e.g., PO-12345, Invoice #"
          />
          <div className="inv-modal__actions">
            <button onClick={onSubmit} className="inv-btn inv-btn-danger">
              Remove Stock
            </button>
            <button onClick={onClose} className="inv-btn">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Store Card component
  const StoreCard = ({ store, inventoryRows }) => {
    const agg = useMemo(
      () => aggregateForStore(inventoryRows, store),
      [inventoryRows, store]
    );
    const initials = (store.customerName || store.storeName || '?')
      .split(' ')
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    return (
      <div className="store-card" onClick={() => handleStoreClick(store)}>
        <div className="store-card__header">
          <div>
            <h3 className="store-card__name">{store.storeName}</h3>
            <p className="store-card__location">{store.address}</p>
          </div>
          <span className={`status-badge ${store.status ? 'status-badge--active' : 'status-badge--inactive'}`}>
            • {store.status ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="store-card__manager">
          <div className="store-card__avatar">
            {store.profilePicture ? (
              <img src={`${API.replace('/api', '')}/${store.profilePicture}`} alt="Profile" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div>
            <p className="store-card__manager-name">{store.customerName}</p>
            <p className="store-card__manager-title">{store.storeHandle}</p>
          </div>
        </div>
        <div className="store-card__phone">
          <p>
            <PhoneIcon style={{ fontSize: 14, verticalAlign: 'text-bottom' }} /> {store.phoneNo}
          </p>
        </div>
      </div>
    );
  };

  // Selected store calculations (only if selectedStore is set)
  const filteredDispatch = useMemo(() => {
    if (!selectedStore) return [];
    return dispatch.filter((d) => {
      const matchesSearch = (d.modelNo || '').toString().toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      const dDate = getRecordDate(d);
      if (detailFromDate && dDate) {
        const start = new Date(detailFromDate);
        start.setHours(0, 0, 0, 0);
        if (dDate < start) return false;
      }
      if (detailToDate && dDate) {
        const end = new Date(detailToDate);
        end.setHours(23, 59, 59, 999);
        if (dDate > end) return false;
      }
      return true;
    });
  }, [dispatch, selectedStore, searchTerm, detailFromDate, detailToDate]);

  const { totalItems, totalPrice, productLines, lowStockAlerts } = useMemo(() => {
    if (!selectedStore) return { totalItems: 0, totalPrice: 0, productLines: 0, lowStockAlerts: 0 };
    const totalItems = filteredDispatch.reduce((sum, r) => sum + qtyOf(r), 0);
    const totalPrice = filteredDispatch.reduce((sum, r) => sum + rowValue(r), 0);
    const productLines = filteredDispatch.length;
    const lowStockAlerts = filteredDispatch.filter((r) => {
      const q = qtyOf(r);
      return q > 0 && q <= 5;
    }).length;
    return { totalItems, totalPrice, productLines, lowStockAlerts };
  }, [filteredDispatch, selectedStore]);

  const totalPages = Math.ceil(filteredDispatch.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDispatch.slice(indexOfFirstItem, indexOfLastItem);

  // Stock Inward Pagination
  const filteredStockInward = useMemo(() => {
    if (!selectedStore) return [];
    return stockInward.filter((item) => {
      const matchesSearch = (item.modelNo || '').toString().toLowerCase().includes(stockInwardSearch.toLowerCase()) ||
        (item.scannedBarcode || '').toString().toLowerCase().includes(stockInwardSearch.toLowerCase());
      if (!matchesSearch) return false;

      const iDate = getRecordDate(item);
      if (detailFromDate && iDate) {
        const start = new Date(detailFromDate);
        start.setHours(0, 0, 0, 0);
        if (iDate < start) return false;
      }
      if (detailToDate && iDate) {
        const end = new Date(detailToDate);
        end.setHours(23, 59, 59, 999);
        if (iDate > end) return false;
      }
      return true;
    });
  }, [stockInward, selectedStore, stockInwardSearch, detailFromDate, detailToDate]);

  const stockInwardTotalPages = Math.ceil(filteredStockInward.length / stockInwardItemsPerPage);
  const stockInwardIndexOfLastItem = stockInwardCurrentPage * stockInwardItemsPerPage;
  const stockInwardIndexOfFirstItem = stockInwardIndexOfLastItem - stockInwardItemsPerPage;
  const stockInwardCurrentItems = filteredStockInward.slice(stockInwardIndexOfFirstItem, stockInwardIndexOfLastItem);

  const filteredRecentTx = useMemo(() => {
    if (!selectedStore) return [];
    return recentTx.filter((tx) => {
      const txDate = getRecordDate(tx);
      if (detailFromDate && txDate) {
        const start = new Date(detailFromDate);
        start.setHours(0, 0, 0, 0);
        if (txDate < start) return false;
      }
      if (detailToDate && txDate) {
        const end = new Date(detailToDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return false;
      }
      return true;
    });
  }, [recentTx, selectedStore, detailFromDate, detailToDate]);

  // Main render
  if (selectedStore) {
    const store = selectedStore;
    return (
      <div className="detail">
        <div className="detail__header">
          <div className="detail__header-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div className="detail__header-left">
              <button onClick={handleBackToDashboard} className="inv-btn inv-btn-link back-btn">
                <ArrowLeft size={18} />
                <span>Back to Dashboard</span>
              </button>
              <div className="detail__store">
                <div className="avatar avatar--lg">
                  {(store.customerName || store.storeName || '?')
                    .split(' ')
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div>
                  <h1 className="detail__title">{store.storeName}</h1>
                  <div className="detail__subtitle">
                    <span>{store.address}</span>
                    <span className="dot">•</span>
                    <span>{store.customerName}</span>
                    <span className={`status-badge ${store.status ? 'status-badge--active' : 'status-badge--inactive'}`}>
                      • {store.status ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>From Date</label>
                <input
                  type="date"
                  value={detailFromDate}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setStockInwardCurrentPage(1);
                    setDetailFromDate(e.target.value);
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-2)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>To Date</label>
                <input
                  type="date"
                  value={detailToDate}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setStockInwardCurrentPage(1);
                    setDetailToDate(e.target.value);
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-2)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
              {(detailFromDate || detailToDate) && (
                <button
                  onClick={() => {
                    setCurrentPage(1);
                    setStockInwardCurrentPage(1);
                    setDetailFromDate('');
                    setDetailToDate('');
                  }}
                  style={{
                    alignSelf: 'end',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-2)',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="container">
          <div className="summary-grid">
            <div className="summary-card summary-card--blue">
              <div className="summary-card__content">
                <div>
                  <p className="summary-card__label summary-card__label--blue">Total Items</p>
                  <p className="summary-card__value summary-card__value--blue">{totalItems}</p>
                  <p className="summary-card__desc summary-card__desc--blue">Units in table</p>
                </div>
                <Package size={32} style={{ color: '#1e40af' }} />
              </div>
            </div>
            <div className="summary-card summary-card--green">
              <div className="summary-card__content">
                <div>
                  <p className="summary-card__label summary-card__label--green">Total Price</p>
                  <p className="summary-card__value summary-card__value--green">{inr(totalPrice)}</p>
                  <p className="summary-card__desc summary-card__desc--green">Sum of Value column</p>
                </div>
                <TrendingUp size={32} style={{ color: '#15803d' }} />
              </div>
            </div>
            <div className="summary-card summary-card--purple">
              <div className="summary-card__content">
                <div>
                  <p className="summary-card__label summary-card__label--purple">Product Lines</p>
                  <p className="summary-card__value summary-card__value--purple">{productLines}</p>
                  <p className="summary-card__desc summary-card__desc--purple">Rows in table</p>
                </div>
                <Package size={32} style={{ color: '#7c3aed' }} />
              </div>
            </div>
            <div className="summary-card summary-card--red">
              <div className="summary-card__content">
                <div>
                  <p className="summary-card__label summary-card__label--red">Low Stock Alerts</p>
                  <p className="summary-card__value summary-card__value--red">{lowStockAlerts}</p>
                </div>
                <Triangle size={32} style={{ color: '#b91c1c' }} />
              </div>
            </div>
          </div>
          <div className="content-grid">
            <div className="inventory">
              <div className="inventory__header">
                <h2 className="inventory__title">Dispatch Data</h2>
                <div className="search">
                  <Search size={16} className="search__icon" />
                  <input
                    className="search__input"
                    type="text"
                    placeholder="Search by Model No..."
                    value={searchTerm}
                    onChange={(e) => {
                      setCurrentPage(1);
                      setSearchTerm(e.target.value);
                    }}
                  />
                </div>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead className="table__head">
                    <tr>
                      <th>Model No</th>
                      <th>Quantity</th>
                      <th>Value</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item, idx) => {
                      const qty = qtyOf(item);
                      const price = rowValue(item);
                      return (
                        <tr key={String(item._id ?? item.id ?? item.modelNo ?? idx)} className="table__row">
                          <td>
                            <div className="product">
                              <div className="product__name">{item.modelNo}</div>
                              <div className="product__meta">{item.category || ''}</div>
                            </div>
                          </td>
                          <td>
                            <div className="qty">
                              <span className={`qty__value ${qty <= 5 ? 'qty__value--low' : ''}`}>{qty}</span>
                              {qty <= 5 && <Triangle size={14} className="qty__warn" />}
                            </div>
                          </td>
                          <td>{inr(price)}</td>
                          <td>
                            <div className="actions">
                              <button
                                className="inv-icon-btn inv-icon-btn--danger"
                                onClick={() => {
                                  setOutwardItem(item);
                                  setIsOutwardOpen(true);
                                }}
                                title="Remove stock"
                              >
                                <Minus size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredDispatch.length === 0 && !loading && (
                      <tr>
                        <td colSpan={4} className="empty">No dispatch data to show.</td>
                      </tr>
                    )}
                    {loading && (
                      <tr>
                        <td colSpan={4} className="empty">Loading…</td>
                      </tr>
                    )}
                    {error && !loading && (
                      <tr>
                        <td colSpan={4} className="empty error">Error: {error}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={4}>
                        <Pagination currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <aside className="sidebar">
              <div className="sidebar__header">
                <h3 className="sidebar__title">Recent Transactions</h3>
                <RotateCcw size={18} className="muted" />
              </div>
              <ul className="tx-list">
                {filteredRecentTx.slice(0, 20).map((tx, i) => (
                  <li key={i} className="tx">
                    <div className="tx__icon">
                      <Triangle size={14} style={{ color: '#ae0000' }} />
                    </div>
                    <div className="tx__body">
                      <div className="tx__name">{tx.productName || tx.modelNo}</div>
                      <div className="tx__meta">
                        {(tx.type || 'outward')} • {num(tx.quantity)} units
                      </div>
                    </div>
                    <div className="tx__date">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ''}</div>
                  </li>
                ))}
                {filteredRecentTx.length === 0 && !loading && <li className="empty">No recent transactions.</li>}
              </ul>
            </aside>
            <div className="inventory">
              <div className="inventory__header">
                <h2 className="inventory__title">Stock Inward Data</h2>
                <div className="search">
                  <Search size={16} className="search__icon" />
                  <input
                    className="search__input"
                    type="text"
                    placeholder="Search Model No or Barcode..."
                    value={stockInwardSearch}
                    onChange={(e) => {
                      setStockInwardCurrentPage(1);
                      setStockInwardSearch(e.target.value);
                    }}
                  />
                </div>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead className="table__head">
                    <tr>
                      <th>Model No</th>
                      <th>Quantity</th>
                      <th>Store Name</th>
                      <th>Scanned Codes</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockInwardLoading ? (
                      <tr>
                        <td colSpan={5} className="empty">Loading stock inward data...</td>
                      </tr>
                    ) : stockInwardError ? (
                      <tr>
                        <td colSpan={5} className="empty error">Error: {stockInwardError}</td>
                      </tr>
                    ) : stockInwardCurrentItems.length > 0 ? (
                      stockInwardCurrentItems.map((item, idx) => (
                        <tr key={String(item._id ?? item.id ?? idx)} className="table__row">
                          <td>
                            <div className="product">
                              <div className="product__name">{item.modelNo}</div>
                              <div className="product__meta">{item.category || ''}</div>
                            </div>
                          </td>
                          <td>
                            <div className="qty">
                              <span className="qty__value">{item.quantity}</span>
                            </div>
                          </td>
                          <td>{item.storeName}</td>
                           <td style={{ wordBreak: 'break-all' }}>
                             {(() => {
                               const val = item.scannedBarcode;
                               if (!val) return 'N/A';
                               if (Array.isArray(val)) {
                                 return val.map(v => typeof v === 'string' ? v.trim() : String(v)).join(', ');
                               }
                               const str = String(val).trim();
                               if (str.includes(',') || str.includes(' ')) return str;
                               return str.split(/(?=[A-Z]{2,}[-_])/).filter(Boolean).join(', ');
                             })()}
                           </td>
                          <td>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="empty">No stock inward data to show.</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={5}>
                        <Pagination
                          currentPage={stockInwardCurrentPage}
                          totalPages={stockInwardTotalPages}
                          setCurrentPage={setStockInwardCurrentPage}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <OutwardModal open={isOutwardOpen} onClose={() => setIsOutwardOpen(false)} item={outwardItem} store={selectedStore} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <header className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #bfdbfe',
                color: '#2563eb',
              }}
            >
              <StoreIcon style={{ fontSize: 26 }} />
            </div>
            <div>
              <h1 className="header__title" style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: '#0f172a' }}>
                Customer Store Details
              </h1>
              <p className="header__subtitle" style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                Manage your inventory across all customer retail locations
              </p>
            </div>
          </div>
        </header>
        <div className="kpis">
          {cardData.map((c, i) => (
            <div key={i} className={`kpi ${c.bg}`}>
              <div className="kpi__content">
                <p className="kpi__title">{c.title}</p>
                <h2 className={`kpi__value ${c.danger ? 'kpi__value--danger' : ''}`}>{c.value}</h2>
              </div>
              <div className="kpi__icon">{c.icon}</div>
            </div>
          ))}
        </div>
        <div className="stores-grid">
          {nonWarehouseCustomers.map((store) => (
            <StoreCard key={String(store._id ?? store.id)} store={store} inventoryRows={inventory} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;
