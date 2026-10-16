import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  format,
  subDays,
  subMonths,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from 'date-fns';

const PERIODS = [
  { key: '1D', label: '1D', title: 'Today' },
  { key: '1W', label: '1W', title: 'Last 7 Days' },
  { key: '1M', label: '1M', title: 'Last 30 Days' },
  { key: '3M', label: '3M', title: 'Last 3 Months' },
  { key: '6M', label: '6M', title: 'Last 6 Months' },
  { key: '1Y', label: '1Y', title: 'Last 1 Year' },
];

const SalesPurchaseChart = () => {
  const [allInward, setAllInward] = useState([]);
  const [allOutward, setAllOutward] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [totals, setTotals] = useState({ inward: 0, outward: 0 });
  const [selectedPeriod, setSelectedPeriod] = useState('1W');
  const [loading, setLoading] = useState(true);

  // Fetch raw data once
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inwardRes, outwardRes] = await Promise.all([
          fetch('http://localhost:5002/api/inventory'),
          fetch('http://localhost:5002/api/dispatch'),
        ]);
        const inwardData = await inwardRes.json();
        const outwardData = await outwardRes.json();
        setAllInward(Array.isArray(inwardData) ? inwardData : []);
        setAllOutward(Array.isArray(outwardData) ? outwardData : []);
      } catch (err) {
        console.error('Error fetching stock movement data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Recompute chart data when period or raw data changes
  const computeChartData = useCallback(() => {
    const now = new Date();
    let intervals = [];
    let labelFormat = 'MMM dd';
    let groupBy = 'day'; // 'hour' | 'day' | 'week' | 'month'
    let startDate;

    switch (selectedPeriod) {
      case '1D':
        startDate = startOfDay(now);
        // 24 hours
        intervals = Array.from({ length: 24 }, (_, i) => ({
          key: `${String(i).padStart(2, '0')}:00`,
          name: `${i === 0 ? '12 am' : i < 12 ? `${i} am` : i === 12 ? '12 pm' : `${i - 12} pm`}`,
          inward: 0,
          outward: 0,
        }));
        groupBy = 'hour';
        break;

      case '1W':
        startDate = subDays(now, 6);
        eachDayOfInterval({ start: startDate, end: now }).forEach(date => {
          intervals.push({ key: format(date, 'yyyy-MM-dd'), name: format(date, 'MMM dd'), inward: 0, outward: 0 });
        });
        groupBy = 'day';
        break;

      case '1M':
        startDate = subDays(now, 29);
        eachDayOfInterval({ start: startDate, end: now }).forEach(date => {
          intervals.push({ key: format(date, 'yyyy-MM-dd'), name: format(date, 'MMM dd'), inward: 0, outward: 0 });
        });
        groupBy = 'day';
        break;

      case '3M':
        startDate = subMonths(now, 3);
        eachWeekOfInterval({ start: startDate, end: now }, { weekStartsOn: 1 }).forEach(weekStart => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          intervals.push({ key: format(weekStart, 'yyyy-MM-dd'), name: format(weekStart, 'MMM dd'), inward: 0, outward: 0, start: weekStart, end: weekEnd });
        });
        groupBy = 'week';
        break;

      case '6M':
        startDate = subMonths(now, 6);
        eachMonthOfInterval({ start: startDate, end: now }).forEach(monthStart => {
          const monthEnd = endOfMonth(monthStart);
          intervals.push({ key: format(monthStart, 'yyyy-MM'), name: format(monthStart, 'MMM yy'), inward: 0, outward: 0, start: monthStart, end: monthEnd });
        });
        groupBy = 'month';
        break;

      case '1Y':
        startDate = subMonths(now, 12);
        eachMonthOfInterval({ start: startDate, end: now }).forEach(monthStart => {
          const monthEnd = endOfMonth(monthStart);
          intervals.push({ key: format(monthStart, 'yyyy-MM'), name: format(monthStart, 'MMM yy'), inward: 0, outward: 0, start: monthStart, end: monthEnd });
        });
        groupBy = 'month';
        break;

      default:
        break;
    }

    const map = {};
    intervals.forEach(iv => { map[iv.key] = iv; });

    // Aggregate inward
    allInward.forEach(item => {
      try {
        const date = new Date(item.createdAt);
        const qty = Number(item.quantity) || 0;
        if (groupBy === 'hour') {
          if (isWithinInterval(date, { start: startOfDay(now), end: endOfDay(now) })) {
            const key = `${String(date.getHours()).padStart(2, '0')}:00`;
            if (map[key]) map[key].inward += qty;
          }
        } else if (groupBy === 'day') {
          const key = format(date, 'yyyy-MM-dd');
          if (map[key]) map[key].inward += qty;
        } else if (groupBy === 'week') {
          const wkStart = startOfWeek(date, { weekStartsOn: 1 });
          const key = format(wkStart, 'yyyy-MM-dd');
          if (map[key]) map[key].inward += qty;
        } else if (groupBy === 'month') {
          const key = format(date, 'yyyy-MM');
          if (map[key]) map[key].inward += qty;
        }
      } catch (_) {}
    });

    // Aggregate outward
    allOutward.forEach(item => {
      try {
        const date = new Date(item.dispatchDate || item.createdAt);
        const qty = Number(item.quantity) || 0;
        if (groupBy === 'hour') {
          if (isWithinInterval(date, { start: startOfDay(now), end: endOfDay(now) })) {
            const key = `${String(date.getHours()).padStart(2, '0')}:00`;
            if (map[key]) map[key].outward += qty;
          }
        } else if (groupBy === 'day') {
          const key = format(date, 'yyyy-MM-dd');
          if (map[key]) map[key].outward += qty;
        } else if (groupBy === 'week') {
          const wkStart = startOfWeek(date, { weekStartsOn: 1 });
          const key = format(wkStart, 'yyyy-MM-dd');
          if (map[key]) map[key].outward += qty;
        } else if (groupBy === 'month') {
          const key = format(date, 'yyyy-MM');
          if (map[key]) map[key].outward += qty;
        }
      } catch (_) {}
    });

    const finalData = intervals.map(iv => map[iv.key] || iv);

    const totalIn = finalData.reduce((sum, d) => sum + d.inward, 0);
    const totalOut = finalData.reduce((sum, d) => sum + d.outward, 0);

    setSalesData(finalData);
    setTotals({ inward: totalIn, outward: totalOut });
  }, [selectedPeriod, allInward, allOutward]);

  useEffect(() => {
    if (allInward.length > 0 || allOutward.length > 0) {
      computeChartData();
    }
  }, [computeChartData, allInward, allOutward]);

  const formatK = (value) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#fff',
          padding: '10px 14px',
          border: '1px solid #f0f0f0',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          fontSize: '13px',
        }}>
          <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#374151' }}>{label}</p>
          <p style={{ margin: '0 0 2px 0', color: '#d4a574' }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FDECD8', border: '1px solid #e0c4a8', marginRight: 6 }}></span>
            Inward: {payload.find(p => p.dataKey === 'inward')?.value || 0}
          </p>
          <p style={{ margin: 0, color: '#FF6B35' }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FF6B35', marginRight: 6 }}></span>
            Outward: {payload.find(p => p.dataKey === 'outward')?.value || 0}
          </p>
        </div>
      );
    }
    return null;
  };

  const periodTitle = PERIODS.find(p => p.key === selectedPeriod)?.title || '';

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#FF6B35', fontSize: '18px' }}>🏷️</span>
          <span style={{ fontWeight: 700, fontSize: '16px', color: '#111827' }}>
            Stock Movement ({periodTitle})
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {PERIODS.map((period) => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: selectedPeriod === period.key ? '#FF6B35' : 'transparent',
                color: selectedPeriod === period.key ? '#fff' : '#9ca3af',
                transition: 'all 0.15s ease',
              }}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Totals */}
      <div style={{ display: 'flex', gap: '32px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FDECD8', display: 'inline-block', border: '1px solid #e0c4a8' }}></span>
            Total Inward
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>{loading ? '...' : formatK(totals.inward)}</div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FF6B35', display: 'inline-block' }}></span>
            Total Outward
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>{loading ? '...' : formatK(totals.outward)}</div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '260px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={salesData}
            margin={{ top: 20, right: 10, left: -15, bottom: 0 }}
            barCategoryGap="35%"
            barGap={4}
          >
            <CartesianGrid vertical={false} stroke="#f3f4f6" strokeDasharray="4 4" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <YAxis 
              domain={[0, (dataMax) => (dataMax > 0 ? Math.ceil(dataMax * 1.2) : 10)]}
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#9ca3af' }} 
              tickFormatter={formatK} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 6 }} />
            <Bar dataKey="inward" name="Inward" fill="#FDECD8" radius={[6, 6, 0, 0]} />
            <Bar dataKey="outward" name="Outward" fill="#FF6B35" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesPurchaseChart;
