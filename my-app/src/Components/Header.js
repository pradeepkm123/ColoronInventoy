// components/Header.js
import React from 'react';

const Header = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '600', color: '#1a1a1a' }}>
          Welcome, Admin
        </h1>
        <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
          Your Portal: CRM, Clients, Today
        </p>
      </div>
      <div style={{ color: '#999', fontSize: '12px' }}>
        📅 07/08/2025 - 07/30/2025
      </div>
    </div>
  );
};

export default Header;
