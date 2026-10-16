import React, { useEffect, useState } from 'react';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';

const RecentTransactions = ({ onViewAll }) => {
  const [inwardData, setInwardData] = useState([]);

  useEffect(() => {
    const fetchInward = async () => {
      try {
        const res = await fetch('http://localhost:5002/api/inventory');
        const data = await res.json();
        const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setInwardData(sorted.slice(0, 5)); // Latest 5
      } catch (err) {
        console.error('Error fetching inward data:', err);
      }
    };

    fetchInward();
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
            backgroundColor: '#ECFDF5', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <MoveToInboxIcon style={{ color: '#10b981', fontSize: '20px' }} />
          </div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>Recent Inwards</h3>
        </div>
        <span onClick={onViewAll} style={{ fontSize: '12px', color: '#666', cursor: 'pointer' }}>View All</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '400px', overflowY: 'auto', paddingRight: '8px' }}>
        {inwardData.length === 0 ? (
          <div style={{ fontSize: '14px', color: '#888' }}>No records</div>
        ) : (
          inwardData.map((item, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.modelNo}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  {item.location || 'Warehouse'}
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
                  ₹{(Number(item.dealerPrice) || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '500', color: '#4B5563' }}>
                  Qty: {item.quantity}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
