
// <<<<<<< HEAD
// import React, { useState, useEffect } from 'react';
// import { useUser } from './UserContext';
// import StatsCards from '../Components/StatsCards';
// import SalesPurchaseChart from '../Components/SalesPurchaseChart';
// import OverallInformation from '../Components/OverallInformation';
// import RecentTransactions from '../Components/RecentTransactions';
// import LowStockProducts from '../Components/LowStockProducts';
// import RecentSales from '../Components/RecentSales';
// import {
//   Users,
//   Package,
//   TrendingUp,
//   AlertTriangle,
//   ArrowRight,
//   Plus,
//   ArrowUpRight,
//   Box,
//   LayoutDashboard
// } from 'lucide-react';

// const Home = () => {
//   const { user } = useUser();
//   const [greeting, setGreeting] = useState('');

//   useEffect(() => {
//     const hour = new Date().getHours();
//     if (hour < 12) setGreeting('Good Morning');
//     else if (hour < 18) setGreeting('Good Afternoon');
//     else setGreeting('Good Evening');
//   }, []);

//   const styles = {
//     container: {
//       padding: '24px',
//       backgroundColor: '#f8fafc',
//       minHeight: '100vh',
//       fontFamily: "'Inter', sans-serif",
//     },
//     hero: {
//       marginBottom: '32px',
//       background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
//       padding: '40px',
//       borderRadius: '24px',
//       color: 'white',
//       position: 'relative',
//       overflow: 'hidden',
//       boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.3)',
//     },
//     heroContent: {
//       position: 'relative',
//       zIndex: 1,
//     },
//     heroTitle: {
//       fontSize: '36px',
//       fontWeight: '800',
//       marginBottom: '8px',
//       letterSpacing: '-0.02em',
//     },
//     heroSubtitle: {
//       fontSize: '18px',
//       opacity: 0.9,
//       fontWeight: '400',
//     },
//     heroPattern: {
//       position: 'absolute',
//       top: '-20%',
//       right: '-10%',
//       width: '400px',
//       height: '400px',
//       background: 'rgba(255, 255, 255, 0.1)',
//       borderRadius: '50%',
//       filter: 'blur(80px)',
//     },
//     sectionTitle: {
//       fontSize: '20px',
//       fontWeight: '700',
//       color: '#1e293b',
//       marginBottom: '20px',
//       display: 'flex',
//       alignItems: 'center',
//       gap: '8px',
//     },
//     grid: {
//       display: 'grid',
//       gridTemplateColumns: 'repeat(12, 1fr)',
//       gap: '24px',
//     },
//     chartContainer: {
//       gridColumn: 'span 8',
//       '@media (max-width: 1200px)': {
//         gridColumn: 'span 12',
//       },
//     },
//     statsContainer: {
//       gridColumn: 'span 4',
//       '@media (max-width: 1200px)': {
//         gridColumn: 'span 12',
//       },
//     },
//     fullWidth: {
//       gridColumn: 'span 12',
//     },
//     cardWrapper: {
//       background: 'white',
//       borderRadius: '20px',
//       padding: '24px',
//       boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
//       border: '1px solid #e2e8f0',
//       transition: 'transform 0.2s ease, box-shadow 0.2s ease',
//       cursor: 'pointer',
//       '&:hover': {
//         transform: 'translateY(-4px)',
//         boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
//       }
//     },
//     quickActionGrid: {
//       display: 'grid',
//       gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
//       gap: '16px',
//       marginBottom: '32px'
//     },
//     quickActionCard: {
//       display: 'flex',
//       alignItems: 'center',
//       padding: '20px',
//       backgroundColor: 'white',
//       borderRadius: '16px',
//       border: '1px solid #e2e8f0',
//       textDecoration: 'none',
//       color: '#1e293b',
//       transition: 'all 0.2s ease',
//       cursor: 'pointer'
//     },
//     iconBox: {
//       width: '48px',
//       height: '48px',
//       borderRadius: '12px',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       marginRight: '16px',
//     }
// =======
// import React from 'react';
// import Header from '../Components/Header';
// import AlertBanner from '../Components/AlertBanner';
// import StatsCards from '../Components/StatsCards';
// import SalesPurchaseChart from '../Components/SalesPurchaseChart';
// import OverallInformation from '../Components/OverallInformation';
// import TopSellingProducts from '../Components/TopSellingProducts';
// import LowStockProducts from '../Components/LowStockProducts';
// import RecentSales from '../Components/RecentSales';
// import SalesStatistics from '../Components/SalesStatistics';
// import RecentTransactions from '../Components/RecentTransactions';
// import TopCustomers from '../Components/TopCustomers';
// import TopCategories from '../Components/TopCategories';

// const Dashboard = () => {
//   const salesData = [
//     { name: '1 Jan', sales: 80, purchase: 40 },
//     { name: '4 Jan', sales: 90, purchase: 35 },
//     { name: '8 Jan', sales: 70, purchase: 30 },
//     { name: '8 Jan', sales: 85, purchase: 45 },
//     { name: '10 Jan', sales: 95, purchase: 50 },
//     { name: '12 Jan', sales: 85, purchase: 40 },
//     { name: '14 Jan', sales: 75, purchase: 35 },
//     { name: '16 Jan', sales: 80, purchase: 40 },
//     { name: '18 Jan', sales: 100, purchase: 55 },
//     { name: '20 Jan', sales: 90, purchase: 45 },
//     { name: '22 Jan', sales: 85, purchase: 40 },
//     { name: '24 Jan', sales: 75, purchase: 35 }
//   ];

//   const categoryData = [
//     { name: 'Electronics', value: 35, color: '#FF6B35' },
//     { name: 'Fashion', value: 30, color: '#F7931E' },
//     { name: 'Home', value: 20, color: '#FFD23F' },
//     { name: 'Books', value: 15, color: '#4ECDC4' }
//   ];

//   const styles = {
//     container: {
//       backgroundColor: '#f8f9fa',
//       minHeight: '100vh',
//       fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
//       padding: '20px',
//     },
//     gridContainer: {
//       display: 'grid',
//       gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
//       gap: '20px',
//       marginBottom: '30px',
//     },
//     twoColumnGrid: {
//       display: 'grid',
//       gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
//       gap: '20px',
//       marginBottom: '30px',
//     },
// >>>>>>> 31d76e31ea2ed9e2fc722a7f9133118915ac4b07
//   };

//   return (
//     <div style={styles.container}>
// <<<<<<< HEAD
//   {/* Quick Stats Summary (Using existing component but wrapped) */ }
//   <div style={{ marginBottom: '32px' }}>
//     <h2 style={styles.sectionTitle}><LayoutDashboard size={20} /> Dashboard Overview</h2>
//     <StatsCards />
//   </div>

//   {/* Main Content Grid */ }
//       <div style={styles.grid}>
//         {/* Charts & Analytical Section */}
//         <div style={styles.chartContainer}>
//           <div style={{ marginBottom: '24px' }}>
//             <SalesPurchaseChart />
//           </div>
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
//             <RecentSales />
//             <LowStockProducts />
//           </div>
//         </div>

//         {/* Side Info Panel */}
//         <div style={styles.statsContainer}>
//           <div style={{ marginBottom: '24px' }}>
//             <OverallInformation />
//           </div>
//           <div>
//             <RecentTransactions />
//           </div>
//         </div>

//         {/* Recent Activity or Quick Links could go here if needed */}
//       </div>

//       <style>
//         {`
//           @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

//           .custom-scrollbar::-webkit-scrollbar {
//             width: 6px;
//           }
//           .custom-scrollbar::-webkit-scrollbar-track {
//             background: #f1f5f9;
//           }
//           .custom-scrollbar::-webkit-scrollbar-thumb {
//             background: #cbd5e1;
//             border-radius: 10px;
//           }
//           .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//             background: #94a3b8;
//           }
//         `}
//       </style>
// =======
//       {/* <Header /> */}
//       {/* <AlertBanner /> */}
//       <StatsCards />
//       <div style={styles.twoColumnGrid}>
//         <SalesPurchaseChart salesData={salesData} />
//         <OverallInformation categoryData={categoryData} />
//       </div>
//       <div style={styles.gridContainer}>
//         <RecentTransactions />
//         <LowStockProducts />
//         <RecentSales />
//       </div>
//       {/* <div style={styles.gridContainer}>
//         <SalesStatistics />
//         <TopSellingProducts />
//         <TopCustomers />
//         <TopCategories />
//       </div> */}
// >>>>>>> 31d76e31ea2ed9e2fc722a7f9133118915ac4b07
//     </div >
//   );
// };

// <<<<<<< HEAD
// export default Home;
// =======
// export default Dashboard;
// >>>>>>> 31d76e31ea2ed9e2fc722a7f9133118915ac4b07

// // import React, { useState, useEffect } from 'react';
// // import { useUser } from './UserContext';
// // import StatsCards from '../Components/StatsCards';
// // import SalesPurchaseChart from '../Components/SalesPurchaseChart';
// // import OverallInformation from '../Components/OverallInformation';
// // import RecentTransactions from '../Components/RecentTransactions';
// // import LowStockProducts from '../Components/LowStockProducts';
// // import RecentSales from '../Components/RecentSales';
// // import {
// //   Users,
// //   Package,
// //   TrendingUp,
// //   AlertTriangle,
// //   ArrowRight,
// //   Plus,
// //   ArrowUpRight,
// //   Box,
// //   LayoutDashboard
// // } from 'lucide-react';
// // import Header from '../Components/Header';
// // import AlertBanner from '../Components/AlertBanner';
// // // import SalesPurchaseChart from '../Components/SalesPurchaseChart';
// // // import OverallInformation from '../Components/OverallInformation';
// // import TopSellingProducts from '../Components/TopSellingProducts';
// // // import LowStockProducts from '../Components/LowStockProducts';
// // // import RecentSales from '../Components/RecentSales';
// // import SalesStatistics from '../Components/SalesStatistics';
// // // import RecentTransactions from '../Components/RecentTransactions';
// // import TopCustomers from '../Components/TopCustomers';
// // import TopCategories from '../Components/TopCategories';

// // const Home = () => {
// //   const { user } = useUser();
// //   const [greeting, setGreeting] = useState('');

// //   useEffect(() => {
// //     const hour = new Date().getHours();
// //     if (hour < 12) setGreeting('Good Morning');
// //     else if (hour < 18) setGreeting('Good Afternoon');
// //     else setGreeting('Good Evening');
// //   }, []);

// //   const styles = {
// //     container: {
// //       padding: '24px',
// //       backgroundColor: '#f8fafc',
// //       minHeight: '100vh',
// //       fontFamily: "'Inter', sans-serif",
// //     },
// //     hero: {
// //       marginBottom: '32px',
// //       background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
// //       padding: '40px',
// //       borderRadius: '24px',
// //       color: 'white',
// //       position: 'relative',
// //       overflow: 'hidden',
// //       boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.3)',
// //     },
// //     heroContent: {
// //       position: 'relative',
// //       zIndex: 1,
// //     },
// //     heroTitle: {
// //       fontSize: '36px',
// //       fontWeight: '800',
// //       marginBottom: '8px',
// //       letterSpacing: '-0.02em',
// //     },
// //     heroSubtitle: {
// //       fontSize: '18px',
// //       opacity: 0.9,
// //       fontWeight: '400',
// //     },
// //     heroPattern: {
// //       position: 'absolute',
// //       top: '-20%',
// //       right: '-10%',
// //       width: '400px',
// //       height: '400px',
// //       background: 'rgba(255, 255, 255, 0.1)',
// //       borderRadius: '50%',
// //       filter: 'blur(80px)',
// //     },
// //     sectionTitle: {
// //       fontSize: '20px',
// //       fontWeight: '700',
// //       color: '#1e293b',
// //       marginBottom: '20px',
// //       display: 'flex',
// //       alignItems: 'center',
// //       gap: '8px',
// //     },
// //     grid: {
// //       display: 'grid',
// //       gridTemplateColumns: 'repeat(12, 1fr)',
// //       gap: '24px',
// //     },
// //     chartContainer: {
// //       gridColumn: 'span 8',
// //       '@media (max-width: 1200px)': {
// //         gridColumn: 'span 12',
// //       },
// //     },
// //     statsContainer: {
// //       gridColumn: 'span 4',
// //       '@media (max-width: 1200px)': {
// //         gridColumn: 'span 12',
// //       },
// //     },
// //     fullWidth: {
// //       gridColumn: 'span 12',
// //     },
// //     cardWrapper: {
// //       background: 'white',
// //       borderRadius: '20px',
// //       padding: '24px',
// //       boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
// //       border: '1px solid #e2e8f0',
// //       transition: 'transform 0.2s ease, box-shadow 0.2s ease',
// //       cursor: 'pointer',
// //       '&:hover': {
// //         transform: 'translateY(-4px)',
// //         boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
// //       }
// //     },
// //     quickActionGrid: {
// //       display: 'grid',
// //       gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
// //       gap: '16px',
// //       marginBottom: '32px'
// //     },
// //     quickActionCard: {
// //       display: 'flex',
// //       alignItems: 'center',
// //       padding: '20px',
// //       backgroundColor: 'white',
// //       borderRadius: '16px',
// //       border: '1px solid #e2e8f0',
// //       textDecoration: 'none',
// //       color: '#1e293b',
// //       transition: 'all 0.2s ease',
// //       cursor: 'pointer'
// //     },
// //     iconBox: {
// //       width: '48px',
// //       height: '48px',
// //       borderRadius: '12px',
// //       display: 'flex',
// //       alignItems: 'center',
// //       justifyContent: 'center',
// //       marginRight: '16px',
// //     }
// // // import React from 'react';


// // const Dashboard = () => {
// //   const salesData = [
// //     { name: '1 Jan', sales: 80, purchase: 40 },
// //     { name: '4 Jan', sales: 90, purchase: 35 },
// //     { name: '8 Jan', sales: 70, purchase: 30 },
// //     { name: '8 Jan', sales: 85, purchase: 45 },
// //     { name: '10 Jan', sales: 95, purchase: 50 },
// //     { name: '12 Jan', sales: 85, purchase: 40 },
// //     { name: '14 Jan', sales: 75, purchase: 35 },
// //     { name: '16 Jan', sales: 80, purchase: 40 },
// //     { name: '18 Jan', sales: 100, purchase: 55 },
// //     { name: '20 Jan', sales: 90, purchase: 45 },
// //     { name: '22 Jan', sales: 85, purchase: 40 },
// //     { name: '24 Jan', sales: 75, purchase: 35 }
// //   ];

// //   const categoryData = [
// //     { name: 'Electronics', value: 35, color: '#FF6B35' },
// //     { name: 'Fashion', value: 30, color: '#F7931E' },
// //     { name: 'Home', value: 20, color: '#FFD23F' },
// //     { name: 'Books', value: 15, color: '#4ECDC4' }
// //   ];

// //   const styles = {
// //     container: {
// //       backgroundColor: '#f8f9fa',
// //       minHeight: '100vh',
// //       fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
// //       padding: '20px',
// //     },
// //     gridContainer: {
// //       display: 'grid',
// //       gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
// //       gap: '20px',
// //       marginBottom: '30px',
// //     },
// //     twoColumnGrid: {
// //       display: 'grid',
// //       gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
// //       gap: '20px',
// //       marginBottom: '30px',
// //     },
// //   };

// //   return (
// //     <div style={styles.container}>
// //       {/* Quick Stats Summary (Using existing component but wrapped) */}
// //       <div style={{ marginBottom: '32px' }}>
// //         <h2 style={styles.sectionTitle}><LayoutDashboard size={20} /> Dashboard Overview</h2>
// //         <StatsCards />
// //       </div>

// //       {/* Main Content Grid */}
// //       <div style={styles.grid}>
// //         {/* Charts & Analytical Section */}
// //         <div style={styles.chartContainer}>
// //           <div style={{ marginBottom: '24px' }}>
// //             <SalesPurchaseChart />
// //           </div>
// //           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
// //             <RecentSales />
// //             <LowStockProducts />
// //           </div>
// //         </div>

// //         {/* Side Info Panel */}
// //         <div style={styles.statsContainer}>
// //           <div style={{ marginBottom: '24px' }}>
// //             <OverallInformation />
// //           </div>
// //           <div>
// //             <RecentTransactions />
// //           </div>
// //         </div>

// //         {/* Recent Activity or Quick Links could go here if needed */}
// //       </div>

// //       <style>
// //         {`
// //           @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

// //           .custom-scrollbar::-webkit-scrollbar {
// //             width: 6px;
// //           }
// //           .custom-scrollbar::-webkit-scrollbar-track {
// //             background: #f1f5f9;
// //           }
// //           .custom-scrollbar::-webkit-scrollbar-thumb {
// //             background: #cbd5e1;
// //             border-radius: 10px;
// //           }
// //           .custom-scrollbar::-webkit-scrollbar-thumb:hover {
// //             background: #94a3b8;
// //           }
// //         `}
// //       </style>
// //       {/* <Header /> */}
// //       {/* <AlertBanner /> */}
// //       <StatsCards />
// //       <div style={styles.twoColumnGrid}>
// //         <SalesPurchaseChart salesData={salesData} />
// //         <OverallInformation categoryData={categoryData} />
// //       </div>
// //       <div style={styles.gridContainer}>
// //         <RecentTransactions />
// //         <LowStockProducts />
// //         <RecentSales />
// //       </div>
// //       {/* <div style={styles.gridContainer}>
// //         <SalesStatistics />
// //         <TopSellingProducts />
// //         <TopCustomers />
// //         <TopCategories />
// //       </div> */}
// //     </div>
// //   );
// // };
// // export default Home;
// // export default Dashboard;























// import React from 'react';
// import Header from '../Components/Header';
// import AlertBanner from '../Components/AlertBanner';
// import StatsCards from '../Components/StatsCards';
// import SalesPurchaseChart from '../Components/SalesPurchaseChart';
// import OverallInformation from '../Components/OverallInformation';
// import TopSellingProducts from '../Components/TopSellingProducts';
// import LowStockProducts from '../Components/LowStockProducts';
// import RecentSales from '../Components/RecentSales';
// import SalesStatistics from '../Components/SalesStatistics';
// import RecentTransactions from '../Components/RecentTransactions';
// import TopCustomers from '../Components/TopCustomers';
// import TopCategories from '../Components/TopCategories';

// const Dashboard = () => {
//   const salesData = [
//     { name: '1 Jan', sales: 80, purchase: 40 },
//     { name: '4 Jan', sales: 90, purchase: 35 },
//     { name: '8 Jan', sales: 70, purchase: 30 },
//     { name: '8 Jan', sales: 85, purchase: 45 },
//     { name: '10 Jan', sales: 95, purchase: 50 },
//     { name: '12 Jan', sales: 85, purchase: 40 },
//     { name: '14 Jan', sales: 75, purchase: 35 },
//     { name: '16 Jan', sales: 80, purchase: 40 },
//     { name: '18 Jan', sales: 100, purchase: 55 },
//     { name: '20 Jan', sales: 90, purchase: 45 },
//     { name: '22 Jan', sales: 85, purchase: 40 },
//     { name: '24 Jan', sales: 75, purchase: 35 }
//   ];

//   const categoryData = [
//     { name: 'Electronics', value: 35, color: '#FF6B35' },
//     { name: 'Fashion', value: 30, color: '#F7931E' },
//     { name: 'Home', value: 20, color: '#FFD23F' },
//     { name: 'Books', value: 15, color: '#4ECDC4' }
//   ];

//   const styles = {
//     container: {
//       backgroundColor: '#f8f9fa',
//       minHeight: '100vh',
//       fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
//       padding: '20px',
//     },
//     gridContainer: {
//       display: 'grid',
//       gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
//       gap: '20px',
//       marginBottom: '30px',
//     },
//     twoColumnGrid: {
//       display: 'grid',
//       gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
//       gap: '20px',
//       marginBottom: '30px',
//     },
//   };

//   return (
//     <div style={styles.container}>
//       {/* <Header /> */}
//       {/* <AlertBanner /> */}
//       <StatsCards />
//       <div style={styles.twoColumnGrid}>
//         <SalesPurchaseChart salesData={salesData} />
//         <OverallInformation categoryData={categoryData} />
//       </div>
//       <div style={styles.gridContainer}>
//         <RecentTransactions />
//         <LowStockProducts />
//         <RecentSales />
//       </div>
//       {/* <div style={styles.gridContainer}>
//         <SalesStatistics />
//         <TopSellingProducts />
//         <TopCustomers />
//         <TopCategories />
//       </div> */}
//     </div>
//   );
// };

// export default Dashboard;


import React from 'react';

// ❌ Removed unused imports
// import Header from '../Components/Header';
// import AlertBanner from '../Components/AlertBanner';
// import SalesStatistics from '../Components/SalesStatistics';
// import TopSellingProducts from '../Components/TopSellingProducts';
// import TopCustomers from '../Components/TopCustomers';
// import TopCategories from '../Components/TopCategories';

import StatsCards from '../Components/StatsCards';
import SalesPurchaseChart from '../Components/SalesPurchaseChart';
import OverallInformation from '../Components/OverallInformation';
import LowStockProducts from '../Components/LowStockProducts';
import RecentSales from '../Components/RecentSales';
import RecentTransactions from '../Components/RecentTransactions';
import TopSellingProducts from '../Components/TopSellingProducts';
import TopCustomers from '../Components/TopCustomers';
import TopCategories from '../Components/TopCategories';
import OrderStatistics from '../Components/OrderStatistics';
import SalesStatistics from '../Components/SalesStatistics';
import TabbedRecentTransactions from '../Components/TabbedRecentTransactions';

const Dashboard = ({ 
  onNavigateToLowStock, 
  onNavigateToRecentInwards, 
  onNavigateToRecentOutward, 
  onNavigateToDispatchValue, 
  onNavigateToTotalProducts,
  onNavigateToTopSelling,
  onNavigateToTopCustomers
}) => {
  const salesData = [
    { name: '1 Jan', sales: 80, purchase: 40 },
    { name: '4 Jan', sales: 90, purchase: 35 },
    { name: '8 Jan', sales: 70, purchase: 30 },
    { name: '9 Jan', sales: 85, purchase: 45 },
    { name: '10 Jan', sales: 95, purchase: 50 },
    { name: '12 Jan', sales: 85, purchase: 40 },
    { name: '14 Jan', sales: 75, purchase: 35 },
    { name: '16 Jan', sales: 80, purchase: 40 },
    { name: '18 Jan', sales: 100, purchase: 55 },
    { name: '20 Jan', sales: 90, purchase: 45 },
    { name: '22 Jan', sales: 85, purchase: 40 },
    { name: '24 Jan', sales: 75, purchase: 35 },
  ];

  const categoryData = [
    { name: 'Electronics', value: 35, color: '#FF6B35' },
    { name: 'Fashion', value: 30, color: '#F7931E' },
    { name: 'Home', value: 20, color: '#FFD23F' },
    { name: 'Books', value: 15, color: '#4ECDC4' },
  ];

  const styles = {
    container: {
      backgroundColor: 'white',
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '20px',
    },
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
    threeColumnGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
    twoColumnGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
  };

  return (
    <div style={styles.container}>
      <StatsCards 
        onNavigateToDispatchValue={onNavigateToDispatchValue} 
        onNavigateToTotalProducts={onNavigateToTotalProducts}
        onNavigateToRecentInwards={onNavigateToRecentInwards}
        onNavigateToRecentOutward={onNavigateToRecentOutward}
      />

      {/* Row 1: Sales Statistics (Left) | Overall Information (Right) */}
      <div style={styles.twoColumnGrid}>
        <SalesStatistics />
        <OverallInformation categoryData={categoryData} />
      </div>

      {/* Row 2: Stock Movement (Last 7 Days) (Left) | Top Selling Products (Right) */}
      <div style={styles.twoColumnGrid}>
        <SalesPurchaseChart salesData={salesData} />
        <TopSellingProducts onViewAll={onNavigateToTopSelling} />
      </div>

      {/* Row 3: Low Stock Products (Left) | Recent Outward Sales (Right) */}
      <div style={styles.twoColumnGrid}>
        <LowStockProducts onViewAll={onNavigateToLowStock} />
        <RecentSales onViewAll={onNavigateToRecentOutward} />
      </div>

      {/* Row 4: Top Customers | Top Categories | Order Statistics */}
      <div style={styles.threeColumnGrid}>
        <TopCustomers onViewAll={onNavigateToTopCustomers} />
        <TopCategories />
        <OrderStatistics />
      </div>
    </div>
  );
};

export default Dashboard;
