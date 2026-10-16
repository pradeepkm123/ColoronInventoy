import React, { useEffect, useState } from 'react';
import OutboxIcon from '@mui/icons-material/Outbox';
import Inventory2Icon from '@mui/icons-material/Inventory2';

const RecentSales = ({ onViewAll }) => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dispatchRes, productRes] = await Promise.all([
          fetch('http://localhost:5002/api/dispatch'),
          fetch('http://localhost:5002/api/products')
        ]);

        const dispatchData = await dispatchRes.json();
        const productData = await productRes.json();

        const sorted = dispatchData.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setSales(sorted.slice(0, 5));
        setProducts(productData);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  const getProductImage = (modelNo) => {
    if (!modelNo) return '';
    const product = products.find(p =>
      (p.model || p.modelNo || p.name || '').trim().toLowerCase() === modelNo.trim().toLowerCase()
    );
    console.log(`Product for modelNo "${modelNo}":`, product);
    return product?.productImage || '';
  };

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
            backgroundColor: '#EFF6FF', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <OutboxIcon style={{ color: '#3b82f6', fontSize: '20px' }} />
          </div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>Recent Outward</h3>
        </div>
        <span onClick={onViewAll} style={{ fontSize: '12px', color: '#666', cursor: 'pointer' }}>View All</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '400px', overflowY: 'auto', paddingRight: '8px' }}>
        {sales.length === 0 ? (
          <div style={{ fontSize: '14px', color: '#888' }}>No recent outward records</div>
        ) : (
          sales.map((sale, index) => {
            const productImage = getProductImage(sale.modelNo);

            const formattedPrice = typeof sale.price === 'number'
              ? sale.price.toLocaleString()
              : (Number(sale.price) || 0).toLocaleString();

            return (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #F0EFF0', paddingBottom: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {productImage ? (
                    <img
                      src={`http://localhost:5002/uploads/${productImage}`}
                      alt={sale.modelNo}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div style={{ display: productImage ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                    <Inventory2Icon style={{ fontSize: '20px' }} />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sale.modelNo} <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '400' }}>• INV: {sale.invoiceNumber}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {new Date(sale.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    backgroundColor: '#ECFDF5',
                    color: '#059669',
                    border: '1px solid #A7F3D0'
                  }}>
                    ₹{formattedPrice}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#4B5563', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sale.customerName || sale.storeName || '-'}
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

export default RecentSales;
