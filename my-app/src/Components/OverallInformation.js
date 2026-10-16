import React, { useEffect, useState } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const COLORS = ['#3174a3', '#fe6d33', '#18a384'];

const OverallInformation = () => {
  const [counts, setCounts] = useState({
    salesPersons: 0,
    customers: 0,
    brands: 0,
  });

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [salesRes, customersRes, brandsRes] = await Promise.all([
          fetch('https://coloroninventoy.onrender.com/api/salesPersons'),
          fetch('https://coloroninventoy.onrender.com/api/customers'),
          fetch('https://coloroninventoy.onrender.com/api/brands'),
        ]);

        const salesData = await salesRes.json();
        const customersData = await customersRes.json();
        const brandsData = await brandsRes.json();

        const salesCount = Array.isArray(salesData) ? salesData.length : 0;
        const customerCount = Array.isArray(customersData) ? customersData.length : 0;
        const brandCount = Array.isArray(brandsData) ? brandsData.length : 0;

        setCounts({
          salesPersons: salesCount,
          customers: customerCount,
          brands: brandCount,
        });

        setChartData([
          { id: 0, value: salesCount, label: `Sales Persons (${salesCount})`, color: COLORS[0] },
          { id: 1, value: customerCount, label: `Customers (${customerCount})`, color: COLORS[1] },
          { id: 2, value: brandCount, label: `Brands (${brandCount})`, color: COLORS[2] },
        ]);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchCounts();
  }, []);

  const valueFormatter = (value, context) => {
    const label = context?.data?.label || '';
    return `${label}`;
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px 0' }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '8px',
          backgroundColor: '#EFF6FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <InfoOutlinedIcon style={{ color: '#3b82f6', fontSize: '20px' }} />
        </div>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>Overall Information</h3>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Sales Persons */}
        <div style={{
          textAlign: 'center',
          padding: '10px',
          borderRadius: '7px',
          backgroundColor: '#f9f9f9',
          border: '1px solid #e9e9e9'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '5px', color: '#3174a3' }}><AccessibilityNewIcon /></div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#333' }}>{counts.salesPersons}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Sales Person</div>
        </div>

        {/* Customers */}
        <div style={{
          textAlign: 'center',
          padding: '10px',
          borderRadius: '7px',
          backgroundColor: '#f9f9f9',
          border: '1px solid #e9e9e9'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '5px', color: '#fe6d33' }}><PeopleIcon /></div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#333' }}>{counts.customers}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Customers</div>
        </div>

        {/* Brands */}
        <div style={{
          textAlign: 'center',
          padding: '10px',
          borderRadius: '7px',
          backgroundColor: '#f9f9f9',
          border: '1px solid #e9e9e9'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '5px', color: '#18a384' }}><ShoppingBagIcon /></div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#333' }}>{counts.brands}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Brands</div>
        </div>
      </div>

      {/* MUI X PieChart with value labels */}
      <div>
        <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Overview Chart</h4>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <PieChart
            series={[
              {
                data: chartData,
                highlightScope: { fade: 'global', highlight: 'item' },
                faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                valueFormatter,
                // arcLabel: (item) => `${item.value}`,
                arcLabelMinAngle: 10,
                innerRadius: 30,
                outerRadius: 80,
              },
            ]}
            width={350}
            height={250}
          />
        </div>
      </div>
    </div>
  );
};

export default OverallInformation;
