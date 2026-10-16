import React, { useState, useEffect } from 'react';
import LayersIcon from '@mui/icons-material/Layers';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import './StatsCards.css';

const StatsCards = ({ 
  onNavigateToDispatchValue, 
  onNavigateToTotalProducts,
  onNavigateToRecentInwards,
  onNavigateToRecentOutward
}) => {
  const [stats, setStats] = useState({
    totalProducts: { value: 0, description: 'Low Stock' },
    totalOutwardValue: { value: 0, description: 'Total Dispatch Amount' },
    todaysInward: { value: 0, description: 'items received' },
    todaysOutward: { value: 0, description: 'items dispatched' },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, inventoryRes, inwardRes, dispatchRes] = await Promise.all([
          fetch('https://coloroninventoy.onrender.com/api/products'),
          fetch('https://coloroninventoy.onrender.com/api/inventory/total-value'),
          fetch('https://coloroninventoy.onrender.com/api/inventory/today-inward'),
          fetch('https://coloroninventoy.onrender.com/api/dispatch'),
        ]);

        const productsData = await productsRes.json();
        const inventoryValueData = await inventoryRes.json();
        const inwardData = await inwardRes.json();
        const dispatchData = await dispatchRes.json();

        const today = new Date().toISOString().split('T')[0];

        const todaysOutward = Array.isArray(dispatchData) ? dispatchData.filter(item => {
          const dispatchDate = new Date(item.dispatchDate || item.createdAt).toISOString().split('T')[0];
          return dispatchDate === today;
        }) : [];

        // Total outward monetary value sum (matching Reports.js calculateOutwardTotals)
        const totalOutwardValueSum = Array.isArray(dispatchData)
          ? dispatchData.reduce((sum, item) => {
              const qty = Number(item.quantity ?? item.qty ?? 0);
              const price = Number(item.price ?? item.singlePicPrice ?? item.unitPrice ?? 0);
              return sum + (qty * price);
            }, 0)
          : 0;

        // Total products and low stock count
        const totalProductsCount = Array.isArray(productsData) ? productsData.length : 0;
        const lowStockCount = Array.isArray(productsData)
          ? productsData.filter(p => Number(p.reorderLevel) <= 5).length
          : 0;

        setStats({
          totalProducts: {
            value: totalProductsCount,
            description: `${lowStockCount} product${lowStockCount !== 1 ? 's' : ''} in Low Stock`,
          },
          totalOutwardValue: {
            value: totalOutwardValueSum,
            description: 'Total Dispatch Amount',
          },
          todaysInward: {
            value: inwardData.count || 0,
            description: 'items received',
          },
          todaysOutward: {
            value: todaysOutward.length,
            description: 'items dispatched',
          },
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchData();
  }, []);

  const formatNumber = (value) =>
    typeof value === 'number' ? value.toLocaleString() : '0';

  return (
    <div className="stats-cards-container">
      <div className="stats-cards-header">
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '10px',
          backgroundColor: '#EFF6FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <AnalyticsIcon style={{ color: '#3b82f6', fontSize: '20px' }} />
        </div>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: '700',
          color: '#111827',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
        }}>
          Inventory Analytics
        </h2>
      </div>

      <div className="stats-cards-grid">
        {/* Card 1: Total Products (Orange Card - Tilt/Rotate Icon) */}
        <div 
          className="stats-card card-1"
          onClick={onNavigateToTotalProducts}
        >
          <div className="card-header-row">
            <div className="icon-badge">
              <span className="animated-icon">
                <LayersIcon fontSize="medium" />
              </span>
            </div>
            <span className="card-title">Total Products</span>
          </div>
          <div className="card-value">
            {formatNumber(stats.totalProducts.value)}
          </div>
          <div className="card-desc">
            {stats.totalProducts.description}
          </div>
        </div>

        {/* Card 2: Total Dispatch Value (Blue Card - Vertical Float Icon) */}
        <div
          className="stats-card card-2"
          onClick={onNavigateToDispatchValue}
        >
          <div className="card-header-row">
            <div className="icon-badge">
              <span className="animated-icon">
                <CurrencyRupeeIcon fontSize="medium" />
              </span>
            </div>
            <span className="card-title">Total Dispatch Value</span>
          </div>
          <div className="card-value">
            ₹{formatNumber(stats.totalOutwardValue.value)}
          </div>
          <div className="card-desc">
            {stats.totalOutwardValue.description}
          </div>
        </div>

        {/* Card 3: Today's Inward (Green Card - Pulse/Glow Icon) */}
        <div 
          className="stats-card card-3"
          onClick={onNavigateToRecentInwards}
        >
          <div className="card-header-row">
            <div className="icon-badge">
              <span className="animated-icon">
                <TrendingUpIcon fontSize="medium" />
              </span>
            </div>
            <span className="card-title">Today's Inward</span>
          </div>
          <div className="card-value">
            {formatNumber(stats.todaysInward.value)}
          </div>
          <div className="card-desc">
            {stats.todaysInward.description}
          </div>
        </div>

        {/* Card 4: Today's Outward (Purple Card - Horizontal Float Icon) */}
        <div 
          className="stats-card card-4"
          onClick={onNavigateToRecentOutward}
        >
          <div className="card-header-row">
            <div className="icon-badge">
              <span className="animated-icon">
                <TrendingDownIcon fontSize="medium" />
              </span>
            </div>
            <span className="card-title">Today's Outward</span>
          </div>
          <div className="card-value">
            {formatNumber(stats.todaysOutward.value)}
          </div>
          <div className="card-desc">
            {stats.todaysOutward.description}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
