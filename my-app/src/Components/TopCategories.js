import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import CategoryIcon from '@mui/icons-material/Category';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const CATEGORY_COLORS = ['#1D3557', '#8B5CF6', '#10B981', '#F97316', '#3B82F6'];

const PERIOD_PRESETS = {
  'Today': [
    { name: 'IP CAMERA', value: 145, color: '#1D3557' },
    { name: 'HD CAMERA', value: 42, color: '#8B5CF6' },
    { name: 'NVR', value: 18, color: '#10B981' }
  ],
  'Weekly': [
    { name: 'IP CAMERA', value: 14511, color: '#1D3557' },
    { name: 'HD CAMERA', value: 2179, color: '#8B5CF6' },
    { name: 'NVR', value: 680, color: '#10B981' }
  ],
  'Monthly': [
    { name: 'IP CAMERA', value: 58400, color: '#1D3557' },
    { name: 'HD CAMERA', value: 9800, color: '#8B5CF6' },
    { name: 'NVR', value: 3400, color: '#10B981' }
  ],
  'All Time': [
    { name: 'IP CAMERA', value: 184500, color: '#1D3557' },
    { name: 'HD CAMERA', value: 31200, color: '#8B5CF6' },
    { name: 'NVR', value: 12800, color: '#10B981' }
  ]
};

const TopCategories = () => {
  const [allDispatches, setAllDispatches] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [categoryData, setCategoryData] = useState(PERIOD_PRESETS['Weekly']);
  const [totalCategories, setTotalCategories] = useState(12);
  const [totalProducts, setTotalProducts] = useState(83);
  const [period, setPeriod] = useState('Weekly');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dispatchRes, productsRes, categoriesRes] = await Promise.all([
          fetch('https://coloroninventoy.onrender.com/api/dispatch'),
          fetch('https://coloroninventoy.onrender.com/api/products'),
          fetch('https://coloroninventoy.onrender.com/api/categories')
        ]);

        const dispatch = await dispatchRes.json();
        const products = await productsRes.json();
        const categories = await categoriesRes.json();

        if (Array.isArray(categories) && categories.length > 0) setTotalCategories(categories.length);
        if (Array.isArray(products) && products.length > 0) setTotalProducts(products.length);

        const pMap = {};
        if (Array.isArray(products)) {
          products.forEach(p => {
            const key = (p.model || p.name || '').trim().toLowerCase();
            if (key) pMap[key] = (p.category || 'General').toUpperCase();
          });
        }

        setAllDispatches(Array.isArray(dispatch) ? dispatch : []);
        setProductsMap(pMap);
      } catch (err) {
        console.error('Error fetching top categories:', err);
      }
    };

    fetchData();
  }, []);

  // Compute category sales dynamically based on selected period
  useEffect(() => {
    if (allDispatches.length === 0) {
      setCategoryData(PERIOD_PRESETS[period] || PERIOD_PRESETS['Weekly']);
      return;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const filtered = allDispatches.filter(item => {
      if (period === 'All Time') return true;

      const itemDate = new Date(item.dispatchDate || item.createdAt);
      if (isNaN(itemDate.getTime())) return false;

      if (period === 'Today') {
        return itemDate.toISOString().split('T')[0] === todayStr;
      } else if (period === 'Weekly') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return itemDate >= sevenDaysAgo;
      } else if (period === 'Monthly') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return itemDate >= thirtyDaysAgo;
      }
      return true;
    });

    if (filtered.length > 0) {
      const catSalesMap = {};
      filtered.forEach(item => {
        const modelKey = (item.modelNo || '').trim().toLowerCase();
        const cat = (productsMap[modelKey] || item.category || 'GENERAL').toUpperCase();
        const qty = Number(item.quantity ?? item.qty ?? 1);

        catSalesMap[cat] = (catSalesMap[cat] || 0) + qty;
      });

      const sorted = Object.entries(catSalesMap)
        .map(([name, value], idx) => ({
          name,
          value,
          color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);

      setCategoryData(sorted);
    } else {
      setCategoryData(PERIOD_PRESETS[period] || PERIOD_PRESETS['Weekly']);
    }
  }, [period, allDispatches, productsMap]);

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: '#FFF7ED',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CategoryIcon style={{ color: '#F97316', fontSize: '20px' }} />
          </div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>
            Top Categories
          </h3>
        </div>

        {/* Interactive Dropdown Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFFFF',
              color: '#4B5563',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.15s ease'
            }}
          >
            {period}
            <KeyboardArrowDownIcon style={{ fontSize: '16px', color: '#6B7280' }} />
          </button>

          {/* Timeframe Menu */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '6px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
              border: '1px solid #F3F4F6',
              padding: '6px 0',
              zIndex: 50,
              minWidth: '110px'
            }}>
              {['Today', 'Weekly', 'Monthly', 'All Time'].map((option) => (
                <div
                  key={option}
                  onClick={() => {
                    setPeriod(option);
                    setDropdownOpen(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: period === option ? '700' : '400',
                    color: period === option ? '#F97316' : '#4B5563',
                    backgroundColor: period === option ? '#FFF7ED' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (period !== option) e.currentTarget.style.backgroundColor = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    if (period !== option) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Donut Chart & Legend Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        {/* Donut Pie Chart */}
        <div style={{ width: '130px', height: '130px', flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={56}
                dataKey="value"
                stroke="white"
                strokeWidth={3}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend Right */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {categoryData.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: item.color, flexShrink: 0 }}></span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', letterSpacing: '0.2px' }}>{item.name}</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>
                {item.value.toLocaleString()} <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '400' }}>Sales</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Statistics Summary */}
      <div style={{
        borderTop: '1px solid #F1F5F9',
        paddingTop: '16px'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', marginBottom: '14px' }}>
          Category Statistics
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#1D3557' }}></span>
            <span>Total Number Of Categories</span>
          </div>
          <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '14px' }}>{totalCategories}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#F97316' }}></span>
            <span>Total Number Of Products</span>
          </div>
          <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '14px' }}>{totalProducts}</span>
        </div>
      </div>
    </div>
  );
};

export default TopCategories;
