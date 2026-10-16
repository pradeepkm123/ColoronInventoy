import React from 'react';

const Spinner = ({ message = "Loading..." }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      width: '100%',
      backgroundColor: '#f8fafc',
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ position: 'relative', width: '50px', height: '50px' }}>
        {/* Soft background track */}
        <svg width="50" height="50" viewBox="0 0 50 50" style={{ position: 'absolute', top: 0, left: 0 }}>
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="#ffeedb"
            strokeWidth="4"
          />
        </svg>
        {/* Rotating orange arc */}
        <svg
          width="50"
          height="50"
          viewBox="0 0 50 50"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            animation: 'spin 0.8s linear infinite',
            transformOrigin: 'center',
          }}
        >
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="#f97316"
            strokeWidth="4"
            strokeDasharray="60 150"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {message && (
        <p style={{
          marginTop: '16px',
          fontSize: '16px',
          fontWeight: '500',
          color: '#6b7280',
          fontFamily: 'sans-serif'
        }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default Spinner;
