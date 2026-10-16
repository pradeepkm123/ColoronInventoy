import React, { useEffect, useState } from 'react';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Inventory2Icon from '@mui/icons-material/Inventory2';

const LowStockProducts = ({ onViewAll }) => {
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const res = await fetch('https://coloroninventoy.onrender.com/api/products');
        const data = await res.json();

        const filtered = data.filter(
          product => Number(product.reorderLevel) <= 5
        );

        setLowStockProducts(filtered);
      } catch (error) {
        console.error('Error fetching low stock products:', error);
      }
    };

    fetchLowStock();
  }, []);

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '8px',
            backgroundColor: '#FFF7ED', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <WarningAmberIcon style={{ color: '#f97316', fontSize: '20px' }} />
          </div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>Low Stock Products</h3>
        </div>
        <span onClick={onViewAll} style={{ fontSize: '12px', color: '#666', cursor: 'pointer' }}>View All</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '400px', overflowY: 'auto', paddingRight: '8px' }}>
        {lowStockProducts.length === 0 ? (
          <div style={{ fontSize: '14px', color: '#888' }}>No low stock products</div>
        ) : (
          lowStockProducts.map((product, index) => {
            const stockCount = Number(product.reorderLevel) || 0;
            const isZero = stockCount === 0;

            return (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {product.productImage ? (
                    <img
                      src={`https://coloroninventoy.onrender.com/uploads/${product.productImage}`}
                      alt={product.model || 'Product'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{ display: product.productImage ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                    <Inventory2Icon style={{ fontSize: '20px' }} />
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {product.model || product.name || 'Unnamed Product'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {product.brand || product.category || 'General'}
                  </div>
                </div>

                <div style={{ flexShrink: 0 }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    backgroundColor: isZero ? '#FEF2F2' : '#FFFBEB',
                    color: isZero ? '#DC2626' : '#D97706',
                    border: `1px solid ${isZero ? '#FCA5A5' : '#FDE68A'}`
                  }}>
                    {stockCount} in stock
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LowStockProducts;
