import React, { useState } from 'react';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const Y_AXIS_LABELS = ['18 Am', '16 Pm', '14 Pm', '12 Am', '10 Am', '8 Am', '6 Am', '4 Am', '2 Am'];
const X_AXIS_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Grid matrix [9 rows x 7 cols] where 1 = vibrant orange, 0 = light pastel cream
const GRID_PRESETS = {
  'Weekly': [
    [0, 0, 0, 0, 0, 1, 1], // 18 Am (Sat, Sun active)
    [0, 0, 0, 0, 1, 0, 0], // 16 Pm (Fri active)
    [0, 0, 0, 0, 0, 0, 0], // 14 Pm
    [0, 0, 0, 0, 0, 0, 0], // 12 Am
    [1, 1, 1, 0, 0, 0, 0], // 10 Am (Mon, Tue, Wed active)
    [0, 0, 0, 0, 0, 1, 1], // 8 Am  (Sat, Sun active)
    [0, 0, 0, 0, 0, 0, 0], // 6 Am
    [1, 1, 1, 1, 0, 0, 0], // 4 Am  (Mon, Tue, Wed, Thu active)
    [1, 1, 1, 0, 0, 0, 0], // 2 Am  (Mon, Tue, Wed active)
  ],
  'Today': [
    [0, 0, 0, 0, 0, 0, 1],
    [0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0],
  ],
  'Monthly': [
    [1, 1, 0, 0, 0, 1, 1],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0],
    [1, 1, 0, 0, 0, 1, 1],
    [1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1],
    [0, 0, 1, 1, 0, 0, 0],
    [1, 1, 1, 1, 1, 0, 0],
    [1, 1, 1, 0, 0, 1, 1],
  ],
  'All Time': [
    [1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1],
    [1, 1, 0, 0, 1, 1, 1],
    [0, 1, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 0],
  ]
};

const OrderStatistics = () => {
  const [period, setPeriod] = useState('Weekly');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const activeGrid = GRID_PRESETS[period] || GRID_PRESETS['Weekly'];

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: '#F5F3FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Inventory2Icon style={{ color: '#7C3AED', fontSize: '20px' }} />
          </div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>
            Order Statistics
          </h3>
        </div>

        {/* Interactive Dropdown Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFFFF',
              color: '#4B5563',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.15s ease'
            }}
          >
            <CalendarTodayIcon style={{ fontSize: '14px', color: '#6B7280' }} />
            {period}
            <KeyboardArrowDownIcon style={{ fontSize: '16px', color: '#6B7280' }} />
          </button>

          {/* Timeframe Menu */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '6px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
              border: '1px solid #F3F4F6',
              padding: '6px 0',
              zIndex: 50,
              minWidth: '110px'
            }}>
              {['Today', 'Weekly', 'Monthly', 'All Time'].map((option) => (
                <div
                  key={option}
                  onClick={() => {
                    setPeriod(option);
                    setDropdownOpen(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: period === option ? '700' : '400',
                    color: period === option ? '#7C3AED' : '#4B5563',
                    backgroundColor: period === option ? '#F5F3FF' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (period !== option) e.currentTarget.style.backgroundColor = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    if (period !== option) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid Heatmap */}
      <div style={{ display: 'flex', width: '100%' }}>
        {/* Y-Axis Labels Column */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingRight: '12px',
          height: '270px',
          fontSize: '12px',
          color: '#64748B',
          fontWeight: '500',
          textAlign: 'right',
          flexShrink: 0
        }}>
          {Y_AXIS_LABELS.map((label, idx) => (
            <div key={idx} style={{ height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              {label}
            </div>
          ))}
        </div>

        {/* Heatmap Grid Container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* 9 Rows Grid */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            height: '270px'
          }}>
            {activeGrid.map((row, rIdx) => (
              <div
                key={rIdx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '4px',
                  height: '26px'
                }}
              >
                {row.map((val, cIdx) => (
                  <div
                    key={cIdx}
                    style={{
                      backgroundColor: val === 1 ? '#FF8A3D' : '#FFEAD2',
                      borderRadius: '4px',
                      height: '100%',
                      transition: 'background-color 0.25s ease'
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* X-Axis Days Labels Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            marginTop: '12px',
            textAlign: 'center'
          }}>
            {X_AXIS_DAYS.map((day, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#475569'
                }}
              >
                {day}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatistics;
