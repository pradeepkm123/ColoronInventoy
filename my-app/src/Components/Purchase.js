import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import '../Pages/Home.css';

function Purchase() {
  const salesChartRef = useRef(null);
  const donutChartRef = useRef(null);

  useEffect(() => {
    const salesCtx = document.getElementById('salesChart');
    const donutCtx = document.getElementById('donutChart');

    // Destroy previous chart instances if they exist
    if (salesChartRef.current !== null) {
      salesChartRef.current.destroy();
    }
    if (donutChartRef.current !== null) {
      donutChartRef.current.destroy();
    }

    // Sales & Purchase Bar Chart
    salesChartRef.current = new Chart(salesCtx, {
      type: 'bar',
      data: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June'],
        datasets: [
          {
            label: 'Sales',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
          {
            label: 'Purchases',
            data: [5, 10, 7, 15, 8, 12],
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    // Donut Chart
    donutChartRef.current = new Chart(donutCtx, {
      type: 'doughnut',
      data: {
        labels: ['New Customers', 'Returning Customers'],
        datasets: [{
          data: [800, 500],
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
          ],
          borderWidth: 1,
        }],
      },
    });

    // Cleanup function to destroy chart instances
    return () => {
      if (salesChartRef.current !== null) {
        salesChartRef.current.destroy();
      }
      if (donutChartRef.current !== null) {
        donutChartRef.current.destroy();
      }
    };
  }, []);

  return (
    <div>
      <div className="content-grid">
        {/* Sales Chart */}
        <div className="chart-section">
          <div className="section-header">
            <div className="section-title">📈 Sales & Purchase</div>
            <a href="#" className="view-all">View All</a>
          </div>
          <div className="time-filter">
            <button className="time-btn">1D</button>
            <button className="time-btn">1W</button>
            <button className="time-btn">1M</button>
            <button className="time-btn">3M</button>
            <button className="time-btn">6M</button>
            <button className="time-btn active">1Y</button>
          </div>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Purchase</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>3K</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Sales</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>1K</div>
            </div>
          </div>
          <div className="chart-container" style={{width:'800px'}}>
            <canvas id="salesChart"></canvas>
          </div>
        </div>
        {/* Overall Information */}
        <div className="chart-section">
          <div className="section-header">
            <div className="section-title">ℹ️ Overall Information</div>
          </div>
          <div className="overview-stats">
            <div className="stat-item">
              <div className="stat-value">6987</div>
              <div className="stat-label">Reports</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">4896</div>
              <div className="stat-label">Customers</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">487</div>
              <div className="stat-label">Orders</div>
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Customers Overview</div>
            <div className="customer-overview">
              <div className="customer-count">5.5K</div>
              <div className="customer-growth">+2.5%</div>
            </div>
            <div className="customer-overview">
              <div className="customer-count">3.5K</div>
              <div className="customer-growth">+1.2%</div>
            </div>
          </div>
          <div style={{ width: '150px', height: '150px', margin: '0 auto' }}>
            <canvas id="donutChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Purchase;
