// components/AlertBanner.js
import React from 'react';

const AlertBanner = () => {
  return (
    <div style={{
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '8px',
      padding: '12px 16px',
      marginBottom: '25px',
      fontSize: '14px',
      color: '#856404'
    }}>
      ⚠️ Your Product sales achieve 85% of monthly sales target (Target: Add about)
    </div>
  );
};

export default AlertBanner;
