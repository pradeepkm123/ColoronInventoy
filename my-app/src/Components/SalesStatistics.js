import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import SouthEastIcon from '@mui/icons-material/SouthEast';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatYTick = (val) => {
  if (val === 0) return '0';
  const abs = Math.abs(val);
  if (abs >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `${(val / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return `${val}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const rev = payload.find(p => p.dataKey === 'revenue')?.value || 0;
    const exp = Math.abs(payload.find(p => p.dataKey === 'expense')?.value || 0);
    return (
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #E5E7EB',
        padding: '10px 14px',
        borderRadius: '10px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        fontSize: '13px'
      }}>
        <p style={{ margin: '0 0 6px 0', fontWeight: '700', color: '#111827' }}>{label}</p>
        <p style={{ margin: '0 0 3px 0', color: '#10B981', fontWeight: '700' }}>
          Revenue: ₹{rev.toLocaleString()}
        </p>
        <p style={{ margin: 0, color: '#FF6B35', fontWeight: '700' }}>
          Expense: ₹{exp.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const SalesStatistics = () => {
  const [selectedYear, setSelectedYear] = useState('');
  const [availableYears, setAvailableYears] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [databaseByYear, setDatabaseByYear] = useState({});

  // Fetch 100% real dispatch & inventory records from backend database
  useEffect(() => {
    const fetchDatabaseRecords = async () => {
      try {
        const [dispatchRes, inventoryRes] = await Promise.all([
          fetch('http://localhost:5002/api/dispatch'),
          fetch('http://localhost:5002/api/inventory')
        ]);

        const dispatches = await dispatchRes.json();
        const inventory = await inventoryRes.json();

        const yearMap = {};

        // 1. Process Dispatch records (Revenue)
        if (Array.isArray(dispatches)) {
          dispatches.forEach(item => {
            const rawDate = item.dispatchDate || item.createdAt || item.date;
            if (!rawDate) return;
            const dateObj = new Date(rawDate);
            if (isNaN(dateObj.getTime())) return;

            const yr = String(dateObj.getFullYear());
            const mIdx = dateObj.getMonth();

            const qty = Number(item.quantity ?? item.qty ?? 0);
            const price = Number(item.price ?? item.singlePicPrice ?? item.unitPrice ?? 0);
            const rev = qty * price;

            if (!yearMap[yr]) {
              yearMap[yr] = {
                totalRevenue: 0,
                totalExpense: 0,
                monthly: MONTH_NAMES.map(m => ({ month: m, revenue: 0, expense: 0 }))
              };
            }

            yearMap[yr].totalRevenue += rev;
            yearMap[yr].monthly[mIdx].revenue += rev;
          });
        }

        // 2. Process Inventory records (Expense)
        if (Array.isArray(inventory)) {
          inventory.forEach(item => {
            const rawDate = item.createdAt || item.date || item.inwardDate || item.updatedAt;
            if (!rawDate) return;
            const dateObj = new Date(rawDate);
            if (isNaN(dateObj.getTime())) return;

            const yr = String(dateObj.getFullYear());
            const mIdx = dateObj.getMonth();

            const qty = Number(item.quantity ?? item.qty ?? 0);
            const dealerCost = Number(item.dealerPrice ?? item.mrp ?? item.price ?? 0);
            const exp = qty * dealerCost;

            if (!yearMap[yr]) {
              yearMap[yr] = {
                totalRevenue: 0,
                totalExpense: 0,
                monthly: MONTH_NAMES.map(m => ({ month: m, revenue: 0, expense: 0 }))
              };
            }

            yearMap[yr].totalExpense += exp;
            yearMap[yr].monthly[mIdx].expense -= exp;
          });
        }

        setDatabaseByYear(yearMap);

        // Dynamically extract ONLY the years present in backend database
        const realYears = Object.keys(yearMap).sort((a, b) => b - a);

        if (realYears.length > 0) {
          setAvailableYears(realYears);
          setSelectedYear(realYears[0]); // Auto-select latest real database year
        } else {
          // If database is completely empty
          const currentYr = String(new Date().getFullYear());
          setAvailableYears([currentYr]);
          setSelectedYear(currentYr);
        }
      } catch (err) {
        console.error('Error fetching real database statistics:', err);
      }
    };

    fetchDatabaseRecords();
  }, []);

  // Compute active dataset strictly from raw database records
  const activeDataset = useMemo(() => {
    const realData = databaseByYear[selectedYear] || {
      totalRevenue: 0,
      totalExpense: 0,
      monthly: MONTH_NAMES.map(m => ({ month: m, revenue: 0, expense: 0 }))
    };

    const maxVal = Math.max(
      ...realData.monthly.map(m => Math.max(m.revenue, Math.abs(m.expense))),
      1000
    );

    const yMax = Math.ceil(maxVal * 1.15);

    return {
      totalRevenue: realData.totalRevenue,
      totalExpense: realData.totalExpense,
      monthly: realData.monthly,
      yDomain: [-yMax, yMax]
    };
  }, [selectedYear, databaseByYear]);

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
            backgroundColor: '#FEF2F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <WarningAmberIcon style={{ color: '#EF4444', fontSize: '20px' }} />
          </div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>
            Sales Statics
          </h3>
        </div>

        {/* Dynamic Real Database Year Dropdown (ONLY Real DB Years) */}
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
            <CalendarTodayIcon style={{ fontSize: '14px', color: '#6B7280' }} />
            {selectedYear || 'Year'}
            <KeyboardArrowDownIcon style={{ fontSize: '16px', color: '#6B7280' }} />
          </button>

          {/* Year Menu (Contains ONLY real database years) */}
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
              {availableYears.map((yr) => (
                <div
                  key={yr}
                  onClick={() => {
                    setSelectedYear(yr);
                    setDropdownOpen(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: selectedYear === yr ? '700' : '400',
                    color: selectedYear === yr ? '#F97316' : '#4B5563',
                    backgroundColor: selectedYear === yr ? '#FFF7ED' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedYear !== yr) e.currentTarget.style.backgroundColor = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedYear !== yr) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {yr}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Row (Revenue vs Expense) */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        {/* Revenue Box */}
        <div style={{
          backgroundColor: '#F9FAFB',
          border: '1px solid #F3F4F6',
          borderRadius: '12px',
          padding: '12px 16px',
          flex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#111827' }}>
              ₹{activeDataset.totalRevenue.toLocaleString()}
            </span>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 6px',
              borderRadius: '12px',
              backgroundColor: '#ECFDF5',
              color: '#059669',
              border: '1px solid #A7F3D0'
            }}>
              <NorthEastIcon style={{ fontSize: '12px' }} /> Revenue
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>Total Sales Volume</div>
        </div>

        {/* Expense Box */}
        <div style={{
          backgroundColor: '#F9FAFB',
          border: '1px solid #F3F4F6',
          borderRadius: '12px',
          padding: '12px 16px',
          flex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#111827' }}>
              ₹{activeDataset.totalExpense.toLocaleString()}
            </span>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 6px',
              borderRadius: '12px',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FCA5A5'
            }}>
              <SouthEastIcon style={{ fontSize: '12px' }} /> Expense
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>Total Inward Cost</div>
        </div>
      </div>

      {/* Bi-directional Bar Chart */}
      <div style={{ height: '220px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={activeDataset.monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={14}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickFormatter={formatYTick}
              domain={activeDataset.yDomain}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            <ReferenceLine y={0} stroke="#E5E7EB" strokeWidth={1.5} />
            <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#FF6B35" radius={[0, 0, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesStatistics;
