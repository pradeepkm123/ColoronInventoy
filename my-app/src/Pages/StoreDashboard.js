import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, Triangle, Search, Filter } from 'lucide-react';

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '8px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  maxWidthContainer: {
    margin: '0 auto',
    padding: '20px'
  },
  dashboardHeader: {
    marginBottom: '48px'
  },
  dashboardTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '8px'
  },
  dashboardSubtitle: {
    fontSize: '16px',
    color: '#6b7280'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px'
  },
  storeCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s ease-in-out',
    width: '100%'
  },
  storeCardHover: {
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  storeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  storeName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '4px'
  },
  storeLocation: {
    fontSize: '14px',
    color: '#6b7280'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '500'
  },
  statusActive: {
    backgroundColor: '#dcfce7',
    color: '#166534'
  },
  statusInactive: {
    backgroundColor: '#f3f4f6',
    color: '#374151'
  },
  managerSection: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px'
  },
  managerAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '500',
    marginRight: '12px',
    flexShrink: 0
  },
  managerName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#111827'
  },
  managerTitle: {
    fontSize: '12px',
    color: '#6b7280'
  },
  metricsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  metricRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  metricLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#6b7280'
  },
  metricDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginRight: '8px',
    flexShrink: 0
  },
  metricValue: {
    fontWeight: '600',
    fontSize: '16px'
  },
  phoneSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #f3f4f6',
    fontSize: '14px',
    color: '#6b7280'
  }
};

const StoreDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const navigate = useNavigate();

  const stores = [
    {
      id: 1,
      name: 'Downtown Store',
      location: 'New York, NY',
      manager: { name: 'John Doe', initials: 'JD' },
      status: 'Active',
      totalInventory: 341,
      productLines: 5,
      phone: '+1-555-0101',
      lowStockAlert: null,
      totalItems: 204,
      inventoryValue: 10703.96,
      lowStockAlerts: 3,
      inventory: [
        { name: 'Wireless Headphones', category: 'Electronics', sku: 'WH-001', stock: 10, value: 999.90, isLowStock: true },
        { name: 'Smartphone Case', category: 'Accessories', sku: 'SC-002', stock: 18, value: 449.82, isLowStock: true },
        { name: 'Bluetooth Speaker', category: 'Electronics', sku: 'BS-003', stock: 67, value: 5359.33, isLowStock: false },
        { name: 'Power Bank', category: 'Electronics', sku: 'PB-004', stock: 67, value: 3349.33, isLowStock: false },
        { name: 'USB Cable', category: 'Accessories', sku: 'UC-005', stock: 42, value: 545.58, isLowStock: true }
      ]
    },
    {
      id: 2,
      name: 'Mall Branch',
      location: 'Los Angeles, CA',
      manager: { name: 'Jane Smith', initials: 'JS' },
      status: 'Active',
      totalInventory: 273,
      productLines: 5,
      phone: '+1-555-0102',
      lowStockAlert: { count: 2, text: '2 items' },
      totalItems: 180,
      inventoryValue: 9200.50,
      lowStockAlerts: 2,
      inventory: [
        { name: 'Laptop', category: 'Electronics', sku: 'LP-001', stock: 5, value: 4999.99, isLowStock: true },
        { name: 'Mouse', category: 'Accessories', sku: 'MS-002', stock: 20, value: 199.90, isLowStock: false },
        { name: 'Keyboard', category: 'Accessories', sku: 'KB-003', stock: 15, value: 499.99, isLowStock: true },
        { name: 'Monitor', category: 'Electronics', sku: 'MN-004', stock: 10, value: 1999.99, isLowStock: true },
        { name: 'Headset', category: 'Accessories', sku: 'HS-005', stock: 25, value: 299.99, isLowStock: false }
      ]
    },
    {
      id: 3,
      name: 'Suburban Outlet',
      location: 'Chicago, IL',
      manager: { name: 'Mike Johnson', initials: 'MJ' },
      status: 'Active',
      totalInventory: 245,
      productLines: 5,
      phone: '+1-555-0103',
      lowStockAlert: { count: 2, text: '2 items' },
      totalItems: 150,
      inventoryValue: 7500.75,
      lowStockAlerts: 2,
      inventory: [
        { name: 'Tablet', category: 'Electronics', sku: 'TB-001', stock: 8, value: 1299.99, isLowStock: true },
        { name: 'Charger', category: 'Accessories', sku: 'CH-002', stock: 30, value: 29.99, isLowStock: false },
        { name: 'Smartwatch', category: 'Electronics', sku: 'SW-003', stock: 12, value: 999.99, isLowStock: true },
        { name: 'Earbuds', category: 'Accessories', sku: 'EB-004', stock: 20, value: 199.99, isLowStock: false },
        { name: 'Phone Stand', category: 'Accessories', sku: 'PS-005', stock: 15, value: 19.99, isLowStock: false }
      ]
    },
    {
      id: 4,
      name: 'Airport Location',
      location: 'Miami, FL',
      manager: { name: 'Sarah Wilson', initials: 'SW' },
      status: 'Inactive',
      totalInventory: 262,
      productLines: 5,
      phone: '+1-555-0104',
      lowStockAlert: null,
      totalItems: 220,
      inventoryValue: 11000.00,
      lowStockAlerts: 0,
      inventory: [
        { name: 'Camera', category: 'Electronics', sku: 'CM-001', stock: 7, value: 2999.99, isLowStock: true },
        { name: 'Memory Card', category: 'Accessories', sku: 'MC-002', stock: 25, value: 49.99, isLowStock: false },
        { name: 'Drone', category: 'Electronics', sku: 'DR-003', stock: 5, value: 5999.99, isLowStock: true },
        { name: 'Tripod', category: 'Accessories', sku: 'TP-004', stock: 10, value: 149.99, isLowStock: false },
        { name: 'Microphone', category: 'Electronics', sku: 'MC-005', stock: 8, value: 299.99, isLowStock: true }
      ]
    }
  ];

  const handleStoreClick = (store) => {
    navigate(`/store/${store.id}`, { state: { store } });
  };

  return (
    <div style={styles.container}>
      <div style={styles.maxWidthContainer}>
        <div style={styles.dashboardHeader}>
          <h1 style={styles.dashboardTitle}>Store Dashboard</h1>
          <p style={styles.dashboardSubtitle}>Manage your inventory across all locations</p>
        </div>
        <div style={styles.grid}>
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} onClick={() => handleStoreClick(store)} />
          ))}
        </div>
      </div>
    </div>
  );
};

const StoreCard = ({ store, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        ...styles.storeCard,
        ...(isHovered ? styles.storeCardHover : {})
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.storeHeader}>
        <div>
          <h3 style={styles.storeName}>{store.name}</h3>
          <p style={styles.storeLocation}>{store.location}</p>
        </div>
        <span style={{
          ...styles.statusBadge,
          ...(store.status === 'Active' ? styles.statusActive : styles.statusInactive)
        }}>
          • {store.status}
        </span>
      </div>
      <div style={styles.managerSection}>
        <div style={styles.managerAvatar}>
          {store.manager.initials}
        </div>
        <div>
          <p style={styles.managerName}>{store.manager.name}</p>
          <p style={styles.managerTitle}>Store Manager</p>
        </div>
      </div>
      <div style={styles.metricsSection}>
        <div style={styles.metricRow}>
          <div style={styles.metricLabel}>
            <div style={{...styles.metricDot, backgroundColor: '#3b82f6'}}></div>
            <span>Total Inventory</span>
          </div>
          <span style={styles.metricValue}>{store.totalInventory}</span>
        </div>
        <div style={styles.metricRow}>
          <div style={styles.metricLabel}>
            <div style={{...styles.metricDot, backgroundColor: '#8b5cf6'}}></div>
            <span>Product Lines</span>
          </div>
          <span style={styles.metricValue}>{store.productLines}</span>
        </div>
        {store.lowStockAlert && (
          <div style={styles.metricRow}>
            <div style={{...styles.metricLabel, color: '#dc2626'}}>
              <div style={{...styles.metricDot, backgroundColor: '#dc2626'}}></div>
              <span>Low Stock Alert</span>
            </div>
            <span style={{...styles.metricValue, color: '#dc2626'}}>{store.lowStockAlert.text}</span>
          </div>
        )}
      </div>
      <div style={styles.phoneSection}>
        <p>{store.phone}</p>
      </div>
    </div>
  );
};

export default StoreDashboard;
