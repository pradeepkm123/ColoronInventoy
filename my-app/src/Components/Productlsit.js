import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera, Video, Radio, HardDrive, MonitorPlay,
  AlertTriangle, XCircle, ChevronLeft, ChevronRight,
  Battery, ToggleLeft, Network, Server, Wifi, Tag, Shield, Box as BoxIcon
} from 'lucide-react';
import axios from 'axios';
import NoProduct from '../assets/img/No-Product.png';

// Smart icon and color mapping for any category name
const getCategoryIconAndBg = (name = '') => {
  const n = (name || '').trim().toLowerCase();
  if (n.includes('ip camera') || (n.includes('ip') && n.includes('cam'))) {
    return { icon: MonitorPlay, iconBg: '#D1FAE5', color: '#059669' };
  }
  if (n.includes('hd') || n.includes('dome') || n.includes('bullet')) {
    return { icon: Video, iconBg: '#FEF3C7', color: '#D97706' };
  }
  if (n.includes('ptz')) {
    return { icon: Radio, iconBg: '#FCE7F3', color: '#DB2777' };
  }
  if (n.includes('dvr')) {
    return { icon: HardDrive, iconBg: '#DBEAFE', color: '#2563EB' };
  }
  if (n.includes('nvr')) {
    return { icon: HardDrive, iconBg: '#F3E8FF', color: '#9333EA' };
  }
  if (n.includes('xvr')) {
    return { icon: MonitorPlay, iconBg: '#F3E8FF', color: '#7C3AED' };
  }
  if (n.includes('power') || n.includes('smps') || n.includes('supply') || n.includes('battery')) {
    return { icon: Battery, iconBg: '#FEF3C7', color: '#D97706' };
  }
  if (n.includes('poe')) {
    return { icon: Network, iconBg: '#D1FAE5', color: '#10B981' };
  }
  if (n.includes('switch')) {
    return { icon: ToggleLeft, iconBg: '#EEF2FF', color: '#4F46E5' };
  }
  if (n.includes('router') || n.includes('wifi')) {
    return { icon: Wifi, iconBg: '#E0F2FE', color: '#0284C7' };
  }
  if (n.includes('rack')) {
    return { icon: Server, iconBg: '#EDE9FE', color: '#6D28D9' };
  }
  if (n.includes('vdp') || n.includes('door') || n.includes('video door')) {
    return { icon: Video, iconBg: '#FFE4E6', color: '#E11D48' };
  }
  if (n.includes('cctv') || n.includes('camera') || n.includes('cam')) {
    return { icon: Camera, iconBg: '#FEF9C3', color: '#CA8A04' };
  }
  if (n.includes('access') || n.includes('biometric') || n.includes('lock')) {
    return { icon: Shield, iconBg: '#ECFDF5', color: '#059669' };
  }
  if (n.includes('cable') || n.includes('wire')) {
    return { icon: Network, iconBg: '#F1F5F9', color: '#475569' };
  }
  if (n.includes('spares') || n.includes('spare') || n.includes('accessor')) {
    return { icon: BoxIcon, iconBg: '#F1F5F9', color: '#475569' };
  }
  return { icon: Tag, iconBg: '#F1F5F9', color: '#475569' };
};

// ------------------- Stat Card -------------------
const StatCard = ({ icon: Icon, title, iconBg, count, onClick, isSelected, stats, image }) => {
  const styles = {
    card: {
      backgroundColor: isSelected ? '#0f2b48' : '#FFFFFF',
      borderRadius: '12px',
      padding: '16px',
      minWidth: '130px',
      flex: 1,
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s',
      border: isSelected ? '2px solid #0f2b48' : '2px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    iconContainer: {
      width: '44px',
      height: '44px',
      borderRadius: '10px',
      backgroundColor: isSelected ? '#FFFFFF' : iconBg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 10px',
      overflow: 'hidden'
    },
    title: {
      fontSize: '13px',
      color: isSelected ? '#FFFFFF' : '#1e293b',
      fontWeight: '700',
      marginBottom: '4px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '120px'
    },
    count: {
      fontSize: '20px',
      fontWeight: '800',
      color: isSelected ? '#38bdf8' : '#0f2b48',
    },
    statsContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '8px',
      paddingTop: '8px',
      borderTop: isSelected ? '1px solid rgba(255,255,255,0.2)' : '1px solid #f1f5f9',
    },
    statItem: {
      fontSize: '11px',
      fontWeight: '600',
      color: isSelected ? '#cbd5e1' : '#64748b',
    },
  };

  return (
    <div
      style={styles.card}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
        }
      }}
    >
      <div style={styles.iconContainer}>
        {image ? (
          <img
            src={`http://localhost:5002/${image.replace(/\\/g, '/')}`}
            alt={title}
            style={{ width: '28px', height: '28px', objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <Icon size={22} color={isSelected ? '#0f2b48' : '#2563eb'} strokeWidth={2.5} />
        )}
      </div>
      <div style={styles.title} title={title}>{title}</div>
      <div style={styles.count}>{count}</div>
      <div style={styles.statsContainer}>
        <div style={styles.statItem}>In Stock: {stats.inStock}</div>
        <div style={styles.statItem}>Low: {stats.lowStock}</div>
        <div style={styles.statItem}>Out: {stats.outOfStock}</div>
      </div>
    </div>
  );
};

// ------------------- Product Cards -------------------
const ProductCards = ({ products, category }) => {
  const styles = {
    container: {
      marginTop: '24px',
    },
    header: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1F2937',
      marginBottom: '16px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '16px',
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '2px solid #E5E7EB',
      transition: 'all 0.3s',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px',
    },
    modelNo: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#1F2937',
      marginBottom: '4px',
    },
    productName: {
      fontSize: '13px',
      color: '#6B7280',
      lineHeight: '1.4',
    },
    statusBadge: (status) => ({
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      backgroundColor: status === 'Out of Stock' ? '#FEE2E2' : '#FEF3C7',
      color: status === 'Out of Stock' ? '#DC2626' : '#D97706',
    }),
    quantitySection: {
      marginTop: '12px',
      paddingTop: '12px',
      borderTop: '1px solid #E5E7EB',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    quantityLabel: {
      fontSize: '12px',
      color: '#6B7280',
      fontWeight: '500',
    },
    quantityValue: (qty) => ({
      fontSize: '18px',
      fontWeight: '700',
      color: qty === 0 ? '#DC2626' : '#D97706',
    }),
  };

  const filteredProducts = category === 'ALL'
    ? products
    : products.filter(p => (p.category || '').trim().toLowerCase() === category.trim().toLowerCase());

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Stock Status - {category === 'ALL' ? 'All Products' : category}</h2>
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>
          <img
            src={NoProduct}
            alt="No products found"
            style={{ width: '100px', marginBottom: '16px' }}
          />
          <p>No products found in this category.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredProducts.map((product, index) => (
            <div
              key={index}
              style={styles.card}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
                e.currentTarget.style.borderColor = '#4F46E5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
            >
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.modelNo}>{product.model || 'No Model'}</div>
                  <div style={styles.productName}>{product.brand || 'No Brand'}</div>
                </div>
                <span style={styles.statusBadge(product.stockStatus)}>
                  {product.stockStatus === 'Out of Stock' ? (
                    <XCircle size={14} />
                  ) : (
                    <AlertTriangle size={14} />
                  )}
                  {product.stockStatus}
                </span>
              </div>
              <div style={styles.quantitySection}>
                <span style={styles.quantityLabel}>Stock Quantity</span>
                <span style={styles.quantityValue(product.reorderLevel)}>{product.reorderLevel ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ------------------- Main Productlist -------------------
export default function Productlist({ setSelectedCategory, products = [], categories: externalCategories }) {
  const [dbCategories, setDbCategories] = useState(externalCategories || []);
  const [selectedCategory, setSelectedCategoryLocal] = useState('All Products');
  const scrollContainerRef = useRef(null);

  const fetchCategoriesFromApi = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5002/api/categories');
      if (Array.isArray(res.data)) {
        setDbCategories(res.data);
      }
    } catch (e) {
      console.warn('Error loading categories:', e);
    }
  }, []);

  useEffect(() => {
    if (externalCategories && Array.isArray(externalCategories) && externalCategories.length > 0) {
      setDbCategories(externalCategories);
    } else {
      fetchCategoriesFromApi();
    }
  }, [externalCategories, fetchCategoriesFromApi]);

  // Listen to global custom event for instant category sync
  useEffect(() => {
    const handleUpdate = () => fetchCategoriesFromApi();
    window.addEventListener('app_categories_updated', handleUpdate);
    return () => window.removeEventListener('app_categories_updated', handleUpdate);
  }, [fetchCategoriesFromApi]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleCategorySelect = (categoryName) => {
    if (categoryName === 'All Products' || selectedCategory === categoryName) {
      setSelectedCategoryLocal('All Products');
      if (setSelectedCategory) setSelectedCategory(null);
    } else {
      setSelectedCategoryLocal(categoryName);
      if (setSelectedCategory) setSelectedCategory(categoryName);
    }
  };

  // 1. All Products Card
  const allInStock = products.filter(p => p.stockStatus === 'In Stock').length;
  const allLowStock = products.filter(p => p.stockStatus === 'Low Stock').length;
  const allOutOfStock = products.filter(p => p.stockStatus === 'Out of Stock').length;

  const allProductsCard = {
    name: 'All Products',
    icon: Camera,
    iconBg: '#EEF2FF',
    count: products.length,
    stats: {
      total: products.length,
      inStock: allInStock,
      lowStock: allLowStock,
      outOfStock: allOutOfStock
    }
  };

  // 2. Build Category cards dynamically from DB categories
  const dbCategoryCards = (dbCategories || []).map((cat) => {
    const catName = cat.name || '';
    const { icon, iconBg } = getCategoryIconAndBg(catName);

    // Filter products matching this category (case-insensitive)
    const matchingProds = products.filter(
      p => (p.category || '').trim().toLowerCase() === catName.trim().toLowerCase()
    );

    return {
      name: catName,
      icon,
      iconBg,
      image: cat.image,
      count: matchingProds.length,
      stats: {
        total: matchingProds.length,
        inStock: matchingProds.filter(p => p.stockStatus === 'In Stock').length,
        lowStock: matchingProds.filter(p => p.stockStatus === 'Low Stock').length,
        outOfStock: matchingProds.filter(p => p.stockStatus === 'Out of Stock').length
      }
    };
  });

  // 3. Also include any product categories from products that might not be in DB yet
  const existingNamesLower = new Set(dbCategoryCards.map(c => c.name.trim().toLowerCase()));
  const extraCategoryCards = [];
  products.forEach(p => {
    const pCat = (p.category || '').trim();
    if (pCat && !existingNamesLower.has(pCat.toLowerCase())) {
      existingNamesLower.add(pCat.toLowerCase());
      const matchingProds = products.filter(
        item => (item.category || '').trim().toLowerCase() === pCat.toLowerCase()
      );
      const { icon, iconBg } = getCategoryIconAndBg(pCat);
      extraCategoryCards.push({
        name: pCat,
        icon,
        iconBg,
        count: matchingProds.length,
        stats: {
          total: matchingProds.length,
          inStock: matchingProds.filter(item => item.stockStatus === 'In Stock').length,
          lowStock: matchingProds.filter(item => item.stockStatus === 'Low Stock').length,
          outOfStock: matchingProds.filter(item => item.stockStatus === 'Out of Stock').length
        }
      });
    }
  });

  const categories = [allProductsCard, ...dbCategoryCards, ...extraCategoryCards];

  const styles = {
    container: {
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      backgroundColor: '#F8FAFC',
      maxWidth: '100%',
      overflowX: 'hidden',
      borderRadius: '15px',
      marginTop: '10px',
      border: '1px solid #E2E8F0'
    },
    header: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1F2937',
      marginBottom: '20px',
    },
    scrollWrapper: {
      position: 'relative',
      marginBottom: '10px',
    },
    scrollContainer: {
      display: 'flex',
      gap: '16px',
      overflowX: 'auto',
      scrollBehavior: 'smooth',
      paddingBottom: '10px',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    },
    scrollButton: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      backgroundColor: '#FFFFFF',
      border: '2px solid #D1D5DB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 10,
      transition: 'all 0.3s',
    },
    leftButton: {
      left: '5px',
    },
    rightButton: {
      right: '5px',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>List of Category</h1>
      <div style={styles.scrollWrapper}>
        <button
          style={{ ...styles.scrollButton, ...styles.leftButton }}
          onClick={() => scroll('left')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4F46E5';
            e.currentTarget.style.borderColor = '#4F46E5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.borderColor = '#D1D5DB';
          }}
        >
          <ChevronLeft size={20} color="#1F2937" />
        </button>
        <div
          ref={scrollContainerRef}
          style={styles.scrollContainer}
        >
          {categories.map((category) => (
            <div key={category.name} style={{ minWidth: '140px' }}>
              <StatCard
                icon={category.icon}
                title={category.name}
                iconBg={category.iconBg}
                image={category.image}
                count={category.count}
                stats={category.stats}
                onClick={() => handleCategorySelect(category.name)}
                isSelected={selectedCategory === category.name}
              />
            </div>
          ))}
        </div>
        <button
          style={{ ...styles.scrollButton, ...styles.rightButton }}
          onClick={() => scroll('right')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4F46E5';
            e.currentTarget.style.borderColor = '#4F46E5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.borderColor = '#D1D5DB';
          }}
        >
          <ChevronRight size={20} color="#1F2937" />
        </button>
      </div>

      {/* Render internal filtered cards only when standalone (not inside Master.js) */}
      {!setSelectedCategory && selectedCategory && selectedCategory !== 'All Products' && (
        <ProductCards
          products={products}
          category={selectedCategory}
        />
      )}
    </div>
  );
}
