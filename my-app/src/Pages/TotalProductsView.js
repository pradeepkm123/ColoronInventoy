import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Breadcrumbs,
  Link,
  CircularProgress,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Icons for the cards (matching wireframe)
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import VideocamIcon from '@mui/icons-material/Videocam';
import RouterIcon from '@mui/icons-material/Router';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import SettingsInputAntennaIcon from '@mui/icons-material/SettingsInputAntenna';
import InventoryIcon from '@mui/icons-material/Inventory';

const API_BASE = 'http://localhost:5002/api';

export default function TotalProductsView({ onNavigateHome }) {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [inwards, setInwards] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default to 'overall' on page load / reload
  const [selectedAccount, setSelectedAccount] = useState('overall');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, invRes, inwRes, whRes, userRes] = await Promise.all([
          fetch(`${API_BASE}/products`).catch(() => ({ json: () => [] })),
          fetch(`${API_BASE}/inventory`).catch(() => ({ json: () => [] })),
          fetch(`${API_BASE}/store-inward`).catch(() => ({ json: () => ({ movements: [] }) })),
          fetch(`${API_BASE}/warehouses`).catch(() => ({ json: () => [] })),
          fetch(`${API_BASE}/users`).catch(() => ({ json: () => ({ users: [] }) })),
        ]);

        const [prodData, invData, inwData, whData, userData] = await Promise.all([
          prodRes.json().catch(() => []),
          invRes.json().catch(() => []),
          inwRes.json().catch(() => ({ movements: [] })),
          whRes.json().catch(() => []),
          userRes.json().catch(() => ({ users: [] })),
        ]);

        setProducts(Array.isArray(prodData) ? prodData : []);
        setInventory(Array.isArray(invData) ? invData : []);
        setInwards(inwData?.movements || (Array.isArray(inwData) ? inwData : []));
        setWarehouses(Array.isArray(whData) ? whData : []);
        setUsers(userData?.users || (Array.isArray(userData) ? userData : []));
      } catch (error) {
        console.error('Error fetching data for TotalProductsView:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Product catalog lookup map for categories & subcategories
  const productCatalogMap = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const k = (p.model || p.modelNo || '').toString().trim().toLowerCase();
      if (k) map[k] = p;
    });
    return map;
  }, [products]);

  // Extract ONLY Warehouse Accounts (Users with role 'Warehouse' + Warehouses)
  const warehouseAccounts = useMemo(() => {
    const list = [];
    const seenFacilityNames = new Set();

    // 1. User accounts strictly where role === 'Warehouse'
    const whUsers = users.filter((u) => {
      const r = (u.role || '').trim().toLowerCase();
      return r === 'warehouse';
    });

    whUsers.forEach((u) => {
      const facilityName = (u.warehouseName || u.assignedLocation || u.locationTag || u.name || 'Warehouse').trim();
      const accountManager = u.name || 'Warehouse Manager';
      const key = facilityName.toLowerCase();
      seenFacilityNames.add(key);

      list.push({
        id: `user-${u._id}`,
        name: `${facilityName.toUpperCase()}${accountManager ? ` (${accountManager})` : ''}`,
        shortName: facilityName.toUpperCase(),
        facilityName: facilityName,
        contactPerson: accountManager,
        email: u.email || '',
        city: u.assignedLocation || u.warehouseName || '',
        type: 'user',
        raw: u,
      });
    });

    // 2. Warehouses from /api/warehouses (matching warehouse accounts)
    warehouses.forEach((w) => {
      const whName = (w.warehouse || w.name || '').trim();
      if (!whName) return;
      const key = whName.toLowerCase();

      // If already added via a warehouse user account, enrich it
      const existing = list.find((item) => item.facilityName && item.facilityName.toLowerCase() === key);
      if (existing) {
        if (!existing.contactPerson && w.contactPerson) existing.contactPerson = w.contactPerson;
        if (!existing.city && w.city) existing.city = w.city;
        if (!existing.address && w.address) existing.address = w.address;
        return;
      }

      list.push({
        id: `wh-${w._id}`,
        name: `${whName.toUpperCase()}${w.contactPerson ? ` (${w.contactPerson})` : ''}`,
        shortName: whName.toUpperCase(),
        facilityName: whName,
        contactPerson: w.contactPerson || '',
        city: w.city || '',
        address: w.address || '',
        email: w.email || '',
        type: 'warehouse',
        raw: w,
      });
    });

    return list;
  }, [users, warehouses]);

  // Selected warehouse account object
  const selectedWhAccount = useMemo(() => {
    if (!selectedAccount || selectedAccount === 'overall') return null;
    return warehouseAccounts.find((a) => a.id === selectedAccount) || null;
  }, [selectedAccount, warehouseAccounts]);

  const getProductStockQty = (p) => {
    const directQty = Number(p.quantity ?? p.qty ?? p.stock ?? p.currentStock ?? 0);
    if (directQty > 0) return directQty;
    const fallbackQty = Number(p.reorderLevel ?? p.openingStock ?? 0);
    return fallbackQty > 0 ? fallbackQty : 0;
  };

  // Group by Category / SubCategory for Overall Inventory (Default)
  const overallStockDetails = useMemo(() => {
    const groupMap = {};

    products.forEach((p) => {
      let cat = p.category || 'General';
      let subCat = p.subCategory || p.subcategory || p.sub_category || cat;

      // Clean up string formatting
      cat = cat.trim().toUpperCase();
      subCat = subCat.trim().toUpperCase();

      // Determine label: prefer SubCategory, fallback to Category
      let label = subCat !== 'GENERAL' && subCat !== '-' && subCat ? subCat : cat;

      // Exclude specific generic categories as requested
      if (label === 'HD CAMERA' || label === 'IP CAMERA' || label === 'CAMERA') {
        return;
      }

      if (!groupMap[label]) {
        groupMap[label] = 0;
      }
      groupMap[label] += getProductStockQty(p);
    });

    return Object.entries(groupMap)
      .map(([label, qty]) => ({ label, qty }))
      .sort((a, b) => b.qty - a.qty);
  }, [products]);

  // Group by Category / SubCategory for Selected Warehouse Account (Matching StoreHome.js logic)
  const accountStockDetails = useMemo(() => {
    if (!selectedWhAccount) return [];

    const norm = (s) => (s ?? '').toString().trim().toLowerCase();
    const whName = norm(selectedWhAccount.facilityName || selectedWhAccount.shortName);
    const locationKey = whName.replace(/warehouse|\(|\)|store|headoffice/gi, '').trim();

    // Filter store-inward movements for this warehouse
    let targetItems = inwards.filter((item) => {
      const store = norm(item.storeName || item.toStore || '');
      if (!store) return false;
      return (
        store === whName ||
        store.includes(whName) ||
        whName.includes(store) ||
        (locationKey && (store.includes(locationKey) || locationKey.includes(store)))
      );
    });

    // Fallback to inventory collection if store-inward has no records for this location (e.g. Head Office / Chennai)
    if (targetItems.length === 0) {
      targetItems = inventory.filter((item) => {
        const loc = norm(item.location || item.storeName || '');
        if (!loc) return false;
        return (
          loc === whName ||
          loc.includes(whName) ||
          whName.includes(loc) ||
          (locationKey && (loc.includes(locationKey) || locationKey.includes(loc))) ||
          ((whName.includes('head office') || whName.includes('ho')) && (loc.includes('chennai') || loc.includes('nandanam')))
        );
      });
    }

    const catStats = {
      'hd (non-color)': 0,
      'hd (color)': 0,
      'dvr': 0,
      'xvr': 0,
      'ip (non-color)': 0,
      'ip (color)': 0,
      'nvr': 0,
      'ptz': 0,
      'anpr camera': 0,
    };

    targetItems.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const cat = (item.category || '').trim().toLowerCase();
      const subCat = (item.subCategory || '').trim().toLowerCase();
      const combined = `${cat} ${subCat}`;
      const combinedNorm = combined.replace(/[-_()]/gi, ' ');

      // Exact HD Non-Color matching (requires explicit non-color or non color)
      const isHdNonColor =
        (cat.includes('hd') || subCat.includes('hd')) &&
        (subCat.includes('non-color') || subCat.includes('non color') || cat.includes('non-color') || cat.includes('non color') || combinedNorm.includes('hd non color'));

      // Exact HD Color matching
      const isHdColor =
        !isHdNonColor &&
        (cat.includes('hd') || subCat.includes('hd')) &&
        (subCat.includes('color') || cat.includes('color') || combinedNorm.includes('hd color')) &&
        !subCat.includes('non') &&
        !cat.includes('non');

      // Exact IP Non-Color matching (requires explicit non-color or non color)
      const isIpNonColor =
        (cat.includes('ip') || subCat.includes('ip')) &&
        (subCat.includes('non-color') || subCat.includes('non color') || cat.includes('non-color') || cat.includes('non color') || combinedNorm.includes('ip non color'));

      // Exact IP Color matching
      const isIpColor =
        !isIpNonColor &&
        (cat.includes('ip') || subCat.includes('ip')) &&
        (subCat.includes('color') || cat.includes('color') || combinedNorm.includes('ip color')) &&
        !subCat.includes('non') &&
        !cat.includes('non');

      if (isHdNonColor) {
        catStats['hd (non-color)'] += qty;
      } else if (isHdColor) {
        catStats['hd (color)'] += qty;
      } else if (isIpNonColor) {
        catStats['ip (non-color)'] += qty;
      } else if (isIpColor) {
        catStats['ip (color)'] += qty;
      } else if (combinedNorm.includes('dvr')) {
        catStats['dvr'] += qty;
      } else if (combinedNorm.includes('xvr')) {
        catStats['xvr'] += qty;
      } else if (combinedNorm.includes('nvr')) {
        catStats['nvr'] += qty;
      } else if (combinedNorm.includes('ptz')) {
        catStats['ptz'] += qty;
      } else if (combinedNorm.includes('anpr')) {
        catStats['anpr camera'] += qty;
      }
    });

    const CATEGORIES_CONFIG = [
      { label: 'HD (NON-COLOR)', key: 'hd (non-color)' },
      { label: 'HD (COLOR)', key: 'hd (color)' },
      { label: 'DVR', key: 'dvr' },
      { label: 'XVR', key: 'xvr' },
      { label: 'IP (NON-COLOR)', key: 'ip (non-color)' },
      { label: 'IP (COLOR)', key: 'ip (color)' },
      { label: 'NVR', key: 'nvr' },
      { label: 'PTZ', key: 'ptz' },
      { label: 'ANPR', key: 'anpr camera' },
    ];

    return CATEGORIES_CONFIG.map((c) => ({
      label: c.label,
      qty: catStats[c.key] || 0,
    }));
  }, [selectedWhAccount, inwards, inventory]);

  // Active items to display depending on selection
  const displayedStockDetails = selectedWhAccount ? accountStockDetails : overallStockDetails;

  // Helper to pick a dynamic icon & color based on label name
  const getIconForLabel = (label) => {
    const l = label.toLowerCase();
    if (l.includes('hd')) return { icon: <CameraAltIcon sx={{ fontSize: 18 }} />, color: '#64748B' }; // Slate
    if (l.includes('dvr')) return { icon: <InventoryIcon sx={{ fontSize: 18 }} />, color: '#10B981' }; // Emerald
    if (l.includes('xvr')) return { icon: <ViewInArIcon sx={{ fontSize: 18 }} />, color: '#F59E0B' }; // Amber
    if (l.includes('ip')) return { icon: <RouterIcon sx={{ fontSize: 18 }} />, color: '#3B82F6' }; // Blue
    if (l.includes('nvr')) return { icon: <InventoryIcon sx={{ fontSize: 18 }} />, color: '#06B6D4' }; // Cyan
    if (l.includes('ptz')) return { icon: <VideocamIcon sx={{ fontSize: 18 }} />, color: '#EC4899' }; // Pink
    if (l.includes('anpr')) return { icon: <CameraAltIcon sx={{ fontSize: 18 }} />, color: '#06B6D4' }; // Cyan
    return { icon: <ViewInArIcon sx={{ fontSize: 18 }} />, color: '#F59E0B' }; // Amber
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#6c757d' }}
          onClick={onNavigateHome}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>Stock Details</Typography>
      </Breadcrumbs>

      {/* Header & Right Side End Warehouse Account Select */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 4,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={onNavigateHome} sx={{ color: '#112a46', '&:hover': { backgroundColor: 'rgba(17, 42, 70, 0.1)' } }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
              Stock Details (Overall Inventory)
            </Typography>
            {selectedWhAccount && (
              <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 600, display: 'block' }}>
                Showing stock for Warehouse Account: {selectedWhAccount.name}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Right Side End Select Option - Only Warehouse Accounts */}
        <Box sx={{ minWidth: { xs: '100%', sm: 300 } }}>
          <FormControl
            size="small"
            fullWidth
            sx={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                '& fieldset': {
                  borderColor: '#D1D5DB',
                },
                '&:hover fieldset': {
                  borderColor: '#0284c7',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0284c7',
                },
              },
            }}
          >
            <InputLabel id="warehouse-account-select-label" sx={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
              Select Warehouse Account
            </InputLabel>
            <Select
              labelId="warehouse-account-select-label"
              id="warehouse-account-select"
              value={selectedAccount}
              label="Select Warehouse Account"
              onChange={(e) => setSelectedAccount(e.target.value)}
              renderValue={(val) => {
                if (!val || val === 'overall') {
                  return (
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      Stock Details (Overall Inventory)
                    </Typography>
                  );
                }
                const acc = warehouseAccounts.find((a) => a.id === val);
                return (
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {acc ? acc.name : val}
                  </Typography>
                );
              }}
            >
              <MenuItem value="overall" sx={{ py: 1.2 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    Stock Details (Overall Inventory)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Default view • Total company product stock
                  </Typography>
                </Box>
              </MenuItem>
              {warehouseAccounts.map((acc) => (
                <MenuItem key={acc.id} value={acc.id} sx={{ py: 1.2 }}>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {acc.name}
                    </Typography>
                    {acc.contactPerson && (
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        Account: {acc.contactPerson} {acc.city ? `• ${acc.city}` : ''}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        /* Main Card Container mapping to wireframe */
        <Paper elevation={0} sx={{
          p: 3,
          borderRadius: '16px',
          backgroundColor: '#F3F4F6',
          border: '1px solid #E5E7EB'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#374151' }}>
              {selectedWhAccount ? `Stock Details (${selectedWhAccount.name})` : 'Stock Details (Overall Inventory)'}
            </Typography>
            {selectedWhAccount && (
              <Chip
                label={`Warehouse: ${selectedWhAccount.shortName}`}
                size="small"
                onDelete={() => setSelectedAccount('overall')}
                sx={{
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  fontWeight: 700,
                  fontSize: '12px',
                  '& .MuiChip-deleteIcon': {
                    color: '#0369a1',
                    '&:hover': { color: '#075985' }
                  }
                }}
              />
            )}
          </Box>

          {displayedStockDetails.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" sx={{ color: '#475569', fontWeight: 700 }}>
                No Product Quantities Available
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                {selectedWhAccount
                  ? `There are currently no recorded product quantities in ${selectedWhAccount.name}.`
                  : 'No inventory stock records found.'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
              gap: 2
            }}>
              {displayedStockDetails.map((item, index) => {
                const { icon, color } = getIconForLabel(item.label);

                return (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ color: color, display: 'flex', alignItems: 'center' }}>
                        {icon}
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {item.label}
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', m: 0, lineHeight: 1 }}>
                      {item.qty.toLocaleString('en-IN')}
                    </Typography>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}
