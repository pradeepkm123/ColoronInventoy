// import React, { useState, useEffect, useMemo } from 'react';
// import TrendingUpIcon from '@mui/icons-material/TrendingUp';
// import TrendingDownIcon from '@mui/icons-material/TrendingDown';
// import ReactDatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
// import TablePagination from '@mui/material/TablePagination';
// import * as XLSX from 'xlsx';

// const Reports = () => {
//   const [activeTab, setActiveTab] = useState('inward');
//   const [fromDate, setFromDate] = useState(null);
//   const [toDate, setToDate] = useState(null);
//   const [selectedProduct, setSelectedProduct] = useState('All Products');
//   const [selectedCategory, setSelectedCategory] = useState('All Categories');
//   const [transactions, setTransactions] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [brands, setBrands] = useState([]);
//   const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
//   const [page, setPage] = useState(0);
//   const [rowsPerPage, setRowsPerPage] = useState(5);
//   const [metrics, setMetrics] = useState([
//     {
//       id: 1,    
//       title: 'Total Transactions',
//       value: '0',
//       iconColor: '#10b981',
//       borderColor: '#10b981',
//       backgroundColor: '#ecfdf5',
//       icon: (
//         <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
//           <path d="M4 2h16v20l-4-2-4 2-4-2-4 2V2z" />
//           <line x1="8" y1="6" x2="16" y2="6" />
//           <line x1="8" y1="10" x2="16" y2="10" />
//           <line x1="8" y1="14" x2="12" y2="14" />
//         </svg>
//       ),
//     },
//     {
//       id: 2,
//       title: 'Total Quantity',
//       value: '0',
//       iconColor: '#3b82f6',
//       borderColor: '#3b82f6',
//       backgroundColor: '#eff6ff',
//       icon: (
//         <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
//           <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z" />
//           <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
//           <line x1="12" y1="22.08" x2="12" y2="12" />
//         </svg>
//       ),
//     },
//     {
//       id: 3,
//       title: 'Total Value',
//       value: '0',
//       iconColor: '#f97316',
//       borderColor: '#f97316',
//       backgroundColor: '#fff7ed',
//       icon: (
//         <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
//           <path d="M6 3h12" />
//           <path d="M6 8h12" />
//           <path d="M6 13l8.5 8" />
//           <path d="M6 13h3a6 6 0 0 0 6-6V3" />
//         </svg>
//       ),
//     },
//   ]);

//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const response = await fetch('http://localhost:5002/api/categories');
//         if (!response.ok) {
//           throw new Error('Network response was not ok');
//         }
//         const data = await response.json();
//         setCategories(data);
//       } catch (error) {
//         console.error('Error fetching categories:', error);
//       }
//     };

//     const fetchBrands = async () => {
//       try {
//         const response = await fetch('http://localhost:5002/api/brands');
//         if (!response.ok) {
//           throw new Error('Network response was not ok');
//         }
//         const data = await response.json();
//         setBrands(data);
//       } catch (error) {
//         console.error('Error fetching brands:', error);
//       }
//     };

//     fetchCategories();
//     fetchBrands();
//   }, []);

//   useEffect(() => {
//     const fetchData = async () => {
//       const endpoint = activeTab === 'inward' ? 'http://localhost:5002/api/inventory' : 'http://localhost:5002/api/dispatch';
//       try {
//         const response = await fetch(endpoint);
//         if (!response.ok) {
//           throw new Error('Network response was not ok');
//         }
//         const data = await response.json();
//         setTransactions(data);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//       }
//     };

//     fetchData();
//   }, [activeTab]);

//   const calculateInwardTotals = (transactions) => {
//     const totalTransactions = transactions.length;
//     const totalQuantity = transactions.reduce((sum, transaction) => sum + transaction.quantity, 0);
//     const totalValue = transactions.reduce((sum, transaction) => sum + (transaction.quantity * transaction.dealerPrice), 0);

//     return {
//       totalTransactions,
//       totalQuantity,
//       totalValue,
//     };
//   };

//   const calculateOutwardTotals = (transactions) => {
//     const totalTransactions = transactions.length;
//     const totalQuantity = transactions.reduce((sum, transaction) => sum + transaction.quantity, 0);
//     const totalValue = transactions.reduce((sum, transaction) => sum + (transaction.quantity * transaction.price), 0);

//     return {
//       totalTransactions,
//       totalQuantity,
//       totalValue,
//     };
//   };

//   const filteredTransactions = transactions.filter((transaction) => {
//     const transactionDate = new Date(transaction.date);
//     const from = fromDate ? new Date(fromDate) : null;
//     const to = toDate ? new Date(toDate) : null;
//     if (from && transactionDate < from) {
//       return false;
//     }
//     if (to && transactionDate > to) {
//       return false;
//     }
//     if (selectedProduct !== 'All Products' && transaction.product !== selectedProduct) {
//       return false;
//     }
//     if (selectedCategory !== 'All Categories' && transaction.category !== selectedCategory) {
//       return false;
//     }
//     return true;
//   });

//   const sortedTransactions = useMemo(() => {
//     let sortableTransactions = [...filteredTransactions];
//     if (sortConfig.key) {
//       sortableTransactions.sort((a, b) => {
//         if (a[sortConfig.key] < b[sortConfig.key]) {
//           return sortConfig.direction === 'asc' ? -1 : 1;
//         }
//         if (a[sortConfig.key] > b[sortConfig.key]) {
//           return sortConfig.direction === 'asc' ? 1 : -1;
//         }
//         return 0;
//       });
//     }
//     return sortableTransactions;
//   }, [filteredTransactions, sortConfig]);

//   useEffect(() => {
//     if (activeTab === 'inward') {
//       const { totalTransactions, totalQuantity, totalValue } = calculateInwardTotals(sortedTransactions);
//       setMetrics([
//         {
//           id: 1,
//           title: 'Total Transactions',
//           value: totalTransactions,
//           iconColor: '#10b981',
//           borderColor: '#10b981',
//           backgroundColor: '#ecfdf5',
//           icon: (
//             <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
//               <path d="M4 2h16v20l-4-2-4 2-4-2-4 2V2z" />
//               <line x1="8" y1="6" x2="16" y2="6" />
//               <line x1="8" y1="10" x2="16" y2="10" />
//               <line x1="8" y1="14" x2="12" y2="14" />
//             </svg>
//           ),
//         },
//         {
//           id: 2,
//           title: 'Total Quantity',
//           value: totalQuantity,
//           iconColor: '#3b82f6',
//           borderColor: '#3b82f6',
//           backgroundColor: '#eff6ff',
//           icon: (
//             <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
//               <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z" />
//               <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
//               <line x1="12" y1="22.08" x2="12" y2="12" />
//             </svg>
//           ),
//         },
//         {
//           id: 3,
//           title: 'Total Value',
//           value: totalValue,
//           iconColor: '#f97316',
//           borderColor: '#f97316',
//           backgroundColor: '#fff7ed',
//           icon: (
//             <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
//               <path d="M6 3h12" />
//               <path d="M6 8h12" />
//               <path d="M6 13l8.5 8" />
//               <path d="M6 13h3a6 6 0 0 0 6-6V3" />
//             </svg>
//           ),
//         },
//       ]);
//     } else {
//       const { totalTransactions, totalQuantity, totalValue } = calculateOutwardTotals(sortedTransactions);
//       setMetrics([
//         {
//           id: 1,
//           title: 'Total Transactions',
//           value: totalTransactions,
//           iconColor: '#10b981',
//           borderColor: '#10b981',
//           backgroundColor: '#ecfdf5',
//           icon: (
//             <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
//               <path d="M4 2h16v20l-4-2-4 2-4-2-4 2V2z" />
//               <line x1="8" y1="6" x2="16" y2="6" />
//               <line x1="8" y1="10" x2="16" y2="10" />
//               <line x1="8" y1="14" x2="12" y2="14" />
//             </svg>
//           ),
//         },
//         {
//           id: 2,
//           title: 'Total Quantity',
//           value: totalQuantity,
//           iconColor: '#3b82f6',
//           borderColor: '#3b82f6',
//           backgroundColor: '#eff6ff',
//           icon: (
//             <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
//               <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z" />
//               <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
//               <line x1="12" y1="22.08" x2="12" y2="12" />
//             </svg>
//           ),
//         },
//         {
//           id: 3,
//           title: 'Total Value',
//           value: totalValue,
//           iconColor: '#f97316',
//           borderColor: '#f97316',
//           backgroundColor: '#fff7ed',
//           icon: (
//             <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
//               <path d="M6 3h12" />
//               <path d="M6 8h12" />
//               <path d="M6 13l8.5 8" />
//               <path d="M6 13h3a6 6 0 0 0 6-6V3" />
//             </svg>
//           ),
//         },
//       ]);
//     }
//   }, [activeTab, sortedTransactions]);

//   const handleExportCSV = () => {
//     const headers = activeTab === 'inward' ? inwardHeaders : outwardHeaders;
//     const dataToExport = sortedTransactions.map(transaction => {
//       if (activeTab === 'inward') {
//         return {
//           'DATE/TIME': transaction.date,
//           'LOCATION': transaction.location,
//           'BRAND': transaction.brand,
//           'PRODUCT MODEL': transaction.modelNo,
//           'CATEGORY': transaction.category,
//           'QUANTITY': transaction.quantity,
//           'STOCK': transaction.currentStock,
//           'SUB CATEGORY': transaction.subCategory,
//           'SINGLE PIC PRICE': transaction.dealerPrice
//         };
//       } else {
//         return {
//           'DATE/TIME': transaction.createdAt,
//           'INVOICE NO': transaction.invoiceNumber,
//           'CUSTOMER NAME': transaction.customerName,
//           'MAIL ID': transaction.mailId,
//           'PHONE NO': transaction.phoneNumber,
//           'SALES PERSON': transaction.salePerson,
//           'QUANTITY': transaction.quantity,
//           'MODEL NO': transaction.modelNo,
//           'SINGLE PIC PRICE': transaction.price
//         };
//       }
//     });
//     const worksheet = XLSX.utils.json_to_sheet(dataToExport);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
//     XLSX.writeFile(workbook, 'Transactions.xlsx');
//   };

//   const handleClearFilters = () => {
//     setFromDate(null);
//     setToDate(null);
//     setSelectedProduct('All Products');
//     setSelectedCategory('All Categories');
//   };

//   const requestSort = (key) => {
//     let direction = 'asc';
//     if (sortConfig.key === key && sortConfig.direction === 'asc') {
//       direction = 'desc';
//     }
//     setSortConfig({ key, direction });
//   };

//   const handleChangePage = (event, newPage) => {
//     setPage(newPage);
//   };

//   const handleChangeRowsPerPage = (event) => {
//     setRowsPerPage(parseInt(event.target.value, 10));
//     setPage(0);
//   };

//   const inwardHeaders = [
//     'DATE/TIME', 'LOCATION', 'BRAND', 'PRODUCT MODEL', 'CATEGORY', 'QUANTITY', 'STOCK', 'SUB CATEGORY', 'SINGLE PIC PRICE'
//   ];

//   const outwardHeaders = [
//     'DATE/TIME', 'INVOICE NO', 'CUSTOMER NAME', 'MAIL ID', 'PHONE NO', 'SALES PERSON', 'QUANTITY', 'MODEL NO', 'SINGLE PIC PRICE'
//   ];

//   const renderTableHeaders = () => {
//     const headers = activeTab === 'inward' ? inwardHeaders : outwardHeaders;
//     return headers.map((header, index) => {
//       const key = header.toLowerCase().replace(/\s+/g, '');
//       return (
//         <th key={index} style={styles.tableHeader} onClick={() => requestSort(key)}>
//           {header} {sortConfig.key === key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
//         </th>
//       );
//     });
//   };

//   const renderTableRows = () => {
//     const emptyRows = rowsPerPage - Math.min(rowsPerPage, sortedTransactions.length - page * rowsPerPage);
//     if (sortedTransactions.length === 0) {
//       return (
//         <tr>
//           <td colSpan={activeTab === 'inward' ? inwardHeaders.length : outwardHeaders.length} style={{ textAlign: 'center', padding: '20px' }}>
//             No data available
//           </td>
//         </tr>
//       );
//     }
//     return (
//       <>
//         {sortedTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((transaction, index) => (
//           <tr key={index} style={styles.tableRow}>
//             {activeTab === 'inward' ? (
//               <>
//                 <td style={styles.tableCell}>{transaction.createdAt}</td>
//                 <td style={styles.tableCell}>{transaction.location}</td>
//                 <td style={styles.tableCell}>{transaction.brand}</td>
//                 <td style={styles.tableCell}>{transaction.modelNo}</td>
//                 <td style={styles.tableCell}>{transaction.category}</td>
//                 <td style={styles.tableCell}>{transaction.quantity}</td>
//                 <td style={styles.tableCell}>{transaction.currentStock}</td>
//                 <td style={styles.tableCell}>{transaction.subCategory}</td>
//                 <td style={styles.tableCell}>{transaction.dealerPrice}</td>
//               </>
//             ) : (
//               <>
//                 <td style={styles.tableCell}>{transaction.createdAt}</td>
//                 <td style={styles.tableCell}>{transaction.invoiceNumber}</td>
//                 <td style={styles.tableCell}>{transaction.customerName}</td>
//                 <td style={styles.tableCell}>{transaction.mailId}</td>
//                 <td style={styles.tableCell}>{transaction.phoneNumber}</td>
//                 <td style={styles.tableCell}>{transaction.salePerson}</td>
//                 <td style={styles.tableCell}>{transaction.quantity}</td>
//                 <td style={styles.tableCell}>{transaction.modelNo}</td>
//                 <td style={styles.tableCell}>{transaction.price}</td>
//               </>
//             )}
//           </tr>
//         ))}
//         {emptyRows > 0 && (
//           <tr style={{ height: 53 * emptyRows }}>
//             <td colSpan={activeTab === 'inward' ? inwardHeaders.length : outwardHeaders.length} />
//           </tr>
//         )}
//       </>
//     );
//   };

//   return (
//     <div style={styles.container}>
//       <div style={styles.header}>
//         <div>
//           <h1 style={styles.title}>Reports</h1>
//           <p style={styles.subtitle}>Transaction history and analytics</p>
//         </div>
//         <button style={styles.exportButton} onClick={handleExportCSV}>
//           <svg style={styles.downloadIcon} viewBox="0 0 16 16" fill="currentColor">
//             <path d="M8.5 1.5V11L11 8.5l.5.75L8 12.75 4.5 9.25 5 8.5 7.5 11V1.5h1z" />
//             <path d="M3.5 13.5v1h9v-1h1v2h-11v-2h1z" />
//           </svg>
//           Export CSV
//         </button>
//       </div>
//       <div style={styles.tabContainer}>
//         <div style={styles.tabWrapper}>
//           <button style={{ ...styles.tab, ...(activeTab === 'inward' ? styles.activeInwardTab : styles.inactiveTab) }} onClick={() => setActiveTab('inward')}>
//             <TrendingUpIcon />
//             Inward Transactions
//           </button>
//           <button style={{ ...styles.tab, ...(activeTab === 'outward' ? styles.activeOutwardTab : styles.inactiveTab) }} onClick={() => setActiveTab('outward')}>
//             <TrendingDownIcon />
//             Outward Transactions
//           </button>
//         </div>
//       </div>
//       <div style={styles.cardGrid}>
//         {metrics.map((metric) => (
//           <div key={metric.id} style={{ ...styles.card, borderColor: metric.borderColor, backgroundColor: metric.backgroundColor }}>
//             <div style={styles.cardContent}>
//               <div style={{ ...styles.iconWrapper, backgroundColor: metric.iconColor }}>
//                 <div style={{ color: 'white' }}>{metric.icon}</div>
//               </div>
//               <div style={styles.textContent}>
//                 <div style={styles.title}>{metric.title}</div>
//                 <div style={styles.value}>{metric.value}</div>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//       {activeTab === 'inward' && (
//         <div style={styles.filtersSection}>
//           <div style={styles.filtersRow}>
//             <div style={styles.filterGroup}>
//               <label style={styles.filterLabel}>From Date</label>
//               <div style={styles.dateInputWrapper}>
//                 <ReactDatePicker
//                   selected={fromDate}
//                   onChange={(date) => setFromDate(date)}
//                   dateFormat="dd/MM/yyyy"
//                   placeholderText="dd/mm/yyyy"
//                   customInput={<input style={styles.dateInput} />}
//                 />
//                 <svg style={styles.calendarIcon} viewBox="0 0 16 16" fill="currentColor">
//                   <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
//                 </svg>
//               </div>
//             </div>
//             <div style={styles.filterGroup}>
//               <label style={styles.filterLabel}>To Date</label>
//               <div style={styles.dateInputWrapper}>
//                 <ReactDatePicker
//                   selected={toDate}
//                   onChange={(date) => setToDate(date)}
//                   dateFormat="dd/MM/yyyy"
//                   placeholderText="dd/mm/yyyy"
//                   customInput={<input style={styles.dateInput} />}
//                 />
//                 <svg style={styles.calendarIcon} viewBox="0 0 16 16" fill="currentColor">
//                   <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
//                 </svg>
//               </div>
//             </div>
//             <div style={styles.filterGroup}>
//               <label style={styles.filterLabel}>Brand</label>
//               <div style={styles.selectWrapper}>
//                 <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} style={styles.select}>
//                   <option value="All Brands">All Brands</option>
//                   {brands.map((brand) => (
//                     <option key={brand._id} value={brand.name}>{brand.name}</option>
//                   ))}
//                 </select>
//                 <svg style={styles.selectIcon} viewBox="0 0 16 16" fill="currentColor">
//                   <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
//                 </svg>
//               </div>
//             </div>
//             <div style={styles.filterGroup}>
//               <label style={styles.filterLabel}>Category</label>
//               <div style={styles.selectWrapper}>
//                 <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={styles.select}>
//                   <option value="All Categories">All Categories</option>
//                   {categories.map((category) => (
//                     <option key={category._id} value={category.name}>{category.name}</option>
//                   ))}
//                 </select>
//                 <svg style={styles.selectIcon} viewBox="0 0 16 16" fill="currentColor">
//                   <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
//                 </svg>
//               </div>
//             </div>
//             <button
//               style={styles.clearButton}
//               onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
//               onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
//               onClick={handleClearFilters}
//             >
//               Clear Filters
//             </button>
//           </div>
//         </div>
//       )}
//       <div style={styles.tableContainer}>
//         <table style={styles.table}>
//           <thead>
//             <tr>
//               {renderTableHeaders()}
//             </tr>
//           </thead>
//           <tbody>
//             {renderTableRows()}
//           </tbody>
//         </table>
//         <TablePagination
//           component="div"
//           count={sortedTransactions.length}
//           page={page}
//           onPageChange={handleChangePage}
//           rowsPerPage={rowsPerPage}
//           onRowsPerPageChange={handleChangeRowsPerPage}
//         />
//       </div>
//     </div>
//   );
// };

// const styles = {
//   container: {
//     backgroundColor: '#ffffff',
//     marginBottom: '2%',
//     fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
//     padding: '24px 32px',
//   },
//   cardGrid: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
//     gap: '20px',
//     margin: '0 auto',
//     marginBottom: '2%',
//   },
//   card: {
//     backgroundColor: 'white',
//     borderRadius: '12px',
//     border: '2px solid',
//     padding: '20px',
//     transition: 'all 0.2s ease-in-out',
//     cursor: 'pointer',
//     boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
//   },
//   cardContent: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '16px',
//   },
//   iconWrapper: {
//     width: '48px',
//     height: '48px',
//     borderRadius: '8px',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     flexShrink: 0,
//   },
//   textContent: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '4px',
//     flex: 1,
//   },
//   title: {
//     fontWeight: '500',
//     color: 'rgb(0 15 46)',
//     lineHeight: '1.4',
//   },
//   value: {
//     fontSize: '24px',
//     fontWeight: '700',
//     color: '#111827',
//     lineHeight: '1.2',
//   },
//   header: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: '32px',
//   },
//   subtitle: {
//     fontSize: '14px',
//     color: '#6b7280',
//     margin: 0,
//     fontWeight: '400',
//   },
//   exportButton: {
//     backgroundColor: '#10b981',
//     color: 'white',
//     border: 'none',
//     borderRadius: '6px',
//     padding: '10px 16px',
//     fontSize: '14px',
//     fontWeight: '500',
//     cursor: 'pointer',
//     display: 'flex',
//     alignItems: 'center',
//     gap: '8px',
//     transition: 'background-color 0.2s',
//   },
//   downloadIcon: {
//     width: '16px',
//     height: '16px',
//   },
//   tabContainer: {
//     borderBottom: '1px solid #e5e7eb',
//     marginBottom: '32px',
//   },
//   tabWrapper: {
//     display: 'flex',
//     gap: '0',
//   },
//   tab: {
//     backgroundColor: 'transparent',
//     border: 'none',
//     padding: '12px 16px',
//     fontSize: '14px',
//     fontWeight: '500',
//     cursor: 'pointer',
//     display: 'flex',
//     alignItems: 'center',
//     gap: '8px',
//     borderBottom: '2px solid transparent',
//     transition: 'all 0.2s',
//     position: 'relative',
//   },
//   tabIcon: {
//     width: '16px',
//     height: '16px',
//   },
//   activeInwardTab: {
//     color: '#10b981',
//     borderBottomColor: '#10b981',
//   },
//   activeOutwardTab: {
//     color: '#dc2626',
//     borderBottomColor: '#dc2626',
//   },
//   inactiveTab: {
//     color: '#6b7280',
//   },
//   filtersSection: {
//     marginBottom: '32px',
//     border: '1px solid #efefef',
//     padding: '25px',
//     borderRadius: '5px',
//     boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
//   },
//   filtersRow: {
//     display: 'flex',
//     gap: '24px',
//     alignItems: 'end',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   filterGroup: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '8px',
//     minWidth: '160px',
//   },
//   filterLabel: {
//     fontSize: '14px',
//     fontWeight: '500',
//     color: '#374151',
//   },
//   dateInputWrapper: {
//     position: 'relative',
//   },
//   dateInput: {
//     width: '100%',
//     padding: '10px 36px 10px 12px',
//     border: '1px solid #d1d5db',
//     borderRadius: '6px',
//     fontSize: '14px',
//     backgroundColor: 'white',
//     outline: 'none',
//     boxSizing: 'border-box',
//   },
//   calendarIcon: {
//     position: 'absolute',
//     right: '12px',
//     top: '50%',
//     transform: 'translateY(-50%)',
//     width: '16px',
//     height: '16px',
//     color: '#9ca3af',
//     pointerEvents: 'none',
//   },
//   selectWrapper: {
//     position: 'relative',
//   },
//   select: {
//     width: '100%',
//     padding: '10px 36px 10px 12px',
//     border: '1px solid #d1d5db',
//     borderRadius: '6px',
//     fontSize: '14px',
//     backgroundColor: 'white',
//     cursor: 'pointer',
//     outline: 'none',
//     appearance: 'none',
//     boxSizing: 'border-box',
//   },
//   selectIcon: {
//     position: 'absolute',
//     right: '12px',
//     top: '50%',
//     transform: 'translateY(-50%)',
//     width: '12px',
//     height: '12px',
//     color: '#9ca3af',
//     pointerEvents: 'none',
//   },
//   clearButton: {
//     backgroundColor: '#f3f4f6',
//     color: '#374151',
//     border: '1px solid #d1d5db',
//     borderRadius: '6px',
//     padding: '10px 16px',
//     fontSize: '14px',
//     fontWeight: '500',
//     cursor: 'pointer',
//     transition: 'background-color 0.2s',
//   },
//   tableContainer: {
//     backgroundColor: 'white',
//     borderRadius: '8px',
//     overflow: 'hidden',
//     border: '1px solid #e5e7eb',
//   },
//   table: {
//     width: '100%',
//     borderCollapse: 'collapse',
//     textAlign: 'center',
//   },
//   tableHeader: {
//     backgroundColor: '#f9fafb',
//     padding: '16px 20px',
//     fontSize: '11px',
//     fontWeight: '600',
//     color: '#6b7280',
//     textTransform: 'uppercase',
//     letterSpacing: '0.5px',
//     borderBottom: '1px solid #e5e7eb',
//     cursor: 'pointer',
//   },
//   tableRow: {
//     borderBottom: '1px solid #f3f4f6',
//   },
//   tableCell: {
//     padding: '20px',
//     fontSize: '14px',
//     color: '#111827',
//     verticalAlign: 'top',
//     lineHeight: '1.5',
//   },
// };

// export default Reports;







import React, { useState, useEffect, useMemo } from 'react';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TablePagination from '@mui/material/TablePagination';
import * as XLSX from 'xlsx';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('inward');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  // NOTE: Your dropdown is "Brand" but state name was "selectedProduct".
  // Keeping it same variable name to avoid breaking other places.
  const [selectedProduct, setSelectedProduct] = useState('All Brands');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const [inwardTransactions, setInwardTransactions] = useState([]);
  const [outwardTransactions, setOutwardTransactions] = useState([]);
  const [loadingInward, setLoadingInward] = useState(false);
  const [loadingOutward, setLoadingOutward] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const transactions = useMemo(() => {
    return activeTab === 'inward' ? inwardTransactions : outwardTransactions;
  }, [activeTab, inwardTransactions, outwardTransactions]);

  const isLoading = activeTab === 'inward' ? loadingInward : loadingOutward;

  const [metrics, setMetrics] = useState([
    {
      id: 1,
      title: 'Total Transactions',
      value: '0',
      iconColor: '#10b981',
      borderColor: '#10b981',
      backgroundColor: '#ecfdf5',
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M4 2h16v20l-4-2-4 2-4-2-4 2V2z" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="10" x2="16" y2="10" />
          <line x1="8" y1="14" x2="12" y2="14" />
        </svg>
      ),
    },
    {
      id: 2,
      title: 'Total Quantity',
      value: '0',
      iconColor: '#3b82f6',
      borderColor: '#3b82f6',
      backgroundColor: '#eff6ff',
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      id: 3,
      title: 'Total Value',
      value: '0',
      iconColor: '#f97316',
      borderColor: '#f97316',
      backgroundColor: '#fff7ed',
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M6 3h12" />
          <path d="M6 8h12" />
          <path d="M6 13l8.5 8" />
          <path d="M6 13h3a6 6 0 0 0 6-6V3" />
        </svg>
      ),
    },
  ]);

  /* ------------------------- Helpers ------------------------- */

  const getTxDate = (tx) => {
    const raw = tx?.dispatchDate || tx?.date || tx?.createdAt || tx?.updatedAt;
    const d = raw ? new Date(raw) : null;
    return d && !isNaN(d.getTime()) ? d : null;
  };

  const formatDisplayDate = (val) => {
    if (!val) return '-';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toISOString().replace('T', ' ').substring(0, 19);
    } catch (e) {
      return String(val);
    }
  };

  const calculateInwardTotals = (list) => {
    const totalTransactions = list.length;
    const totalQuantity = list.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);
    const totalValue = list.reduce(
      (sum, t) => sum + (Number(t.quantity) || 0) * (Number(t.dealerPrice ?? t.price) || 0),
      0
    );
    return { totalTransactions, totalQuantity, totalValue };
  };

  const calculateOutwardTotals = (list) => {
    const totalTransactions = list.length;
    const totalQuantity = list.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);
    const totalValue = list.reduce(
      (sum, t) => sum + (Number(t.quantity) || 0) * (Number(t.price ?? t.dealerPrice) || 0),
      0
    );
    return { totalTransactions, totalQuantity, totalValue };
  };

  /* ------------------------- Fetch Categories & Brands ------------------------- */

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5002/api/categories');
        if (!response.ok) throw new Error('Failed categories fetch');
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }
    };

    const fetchBrands = async () => {
      try {
        const response = await fetch('http://localhost:5002/api/brands');
        if (!response.ok) throw new Error('Failed brands fetch');
        const data = await response.json();
        setBrands(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching brands:', error);
        setBrands([]);
      }
    };

    fetchCategories();
    fetchBrands();
  }, []);

  /* ------------------------- Fetch Transactions Concurrently ------------------------- */

  useEffect(() => {
    let isMounted = true;

    const fetchInward = async () => {
      setLoadingInward(true);
      try {
        const response = await fetch('http://localhost:5002/api/inventory');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        if (isMounted) setInwardTransactions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching inward data:', error);
        if (isMounted) setInwardTransactions([]);
      } finally {
        if (isMounted) setLoadingInward(false);
      }
    };

    const fetchOutward = async () => {
      setLoadingOutward(true);
      try {
        const response = await fetch('http://localhost:5002/api/dispatch');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        if (isMounted) setOutwardTransactions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching outward data:', error);
        if (isMounted) setOutwardTransactions([]);
      } finally {
        if (isMounted) setLoadingOutward(false);
      }
    };

    fetchInward();
    fetchOutward();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setPage(0);
  }, [activeTab, fromDate, toDate, selectedProduct, selectedCategory]);

  const uniqueCustomers = useMemo(() => {
    const names = new Set();
    outwardTransactions.forEach((tx) => {
      const name = tx.customerName || tx.storeName;
      if (name && typeof name === 'string' && name.trim()) {
        names.add(name.trim());
      }
    });
    return Array.from(names).sort();
  }, [outwardTransactions]);

  const uniqueSalesPersons = useMemo(() => {
    const names = new Set();
    outwardTransactions.forEach((tx) => {
      const sp = tx.salePerson || tx.salesPerson || tx.salesperson;
      if (sp && typeof sp === 'string' && sp.trim()) {
        names.add(sp.trim());
      }
    });
    return Array.from(names).sort();
  }, [outwardTransactions]);

  useEffect(() => {
    if (activeTab === 'inward') {
      setSelectedProduct('All Brands');
      setSelectedCategory('All Categories');
    } else {
      setSelectedProduct('All Customers');
      setSelectedCategory('All Sales Persons');
    }
  }, [activeTab]);

  /* ------------------------- Filtering ------------------------- */

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = getTxDate(tx);
      
      if (fromDate && txDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        if (txDate < start) return false;
      }
      
      if (toDate && txDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return false;
      }

      if (activeTab === 'inward') {
        // Brand filter (state is selectedProduct)
        if (selectedProduct !== 'All Brands') {
          if ((tx.brand || '').toLowerCase() !== selectedProduct.toLowerCase()) return false;
        }

        // Category filter (only if exists)
        if (selectedCategory !== 'All Categories') {
          if ((tx.category || '').toLowerCase() !== selectedCategory.toLowerCase()) return false;
        }
      } else {
        // Customer Name filter
        if (selectedProduct !== 'All Customers') {
          const cust = (tx.customerName || tx.storeName || '').trim().toLowerCase();
          if (cust !== selectedProduct.trim().toLowerCase()) return false;
        }

        // Sales Person filter
        if (selectedCategory !== 'All Sales Persons') {
          const sp = (tx.salePerson || tx.salesPerson || tx.salesperson || '').trim().toLowerCase();
          if (sp !== selectedCategory.trim().toLowerCase()) return false;
        }
      }

      return true;
    });
  }, [transactions, fromDate, toDate, selectedProduct, selectedCategory, activeTab]);

  /* ------------------------- Sorting ------------------------- */

  const sortedTransactions = useMemo(() => {
    const list = [...filteredTransactions];
    if (!sortConfig.key) return list;

    const { key, direction } = sortConfig;
    const dir = direction === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      const va = a?.[key];
      const vb = b?.[key];

      // Date sorting
      if (key === 'createdAt' || key === 'date' || key === 'dispatchDate') {
        const da = getTxDate(a)?.getTime() || 0;
        const db = getTxDate(b)?.getTime() || 0;
        return (da - db) * dir;
      }

      // Numeric sorting
      const na = Number(va);
      const nb = Number(vb);
      const bothNumbers = !isNaN(na) && !isNaN(nb);
      if (bothNumbers) return (na - nb) * dir;

      // String sorting
      const sa = (va ?? '').toString().toLowerCase();
      const sb = (vb ?? '').toString().toLowerCase();
      if (sa < sb) return -1 * dir;
      if (sa > sb) return 1 * dir;
      return 0;
    });

    return list;
  }, [filteredTransactions, sortConfig]);

  /* ------------------------- Metrics ------------------------- */

  useEffect(() => {
    if (activeTab === 'inward') {
      const { totalTransactions, totalQuantity, totalValue } = calculateInwardTotals(sortedTransactions);
      setMetrics((prev) => [
        { ...prev[0], value: totalTransactions.toLocaleString() },
        { ...prev[1], value: totalQuantity.toLocaleString() },
        { ...prev[2], value: `₹${Number(totalValue).toLocaleString('en-IN')}` },
      ]);
    } else {
      const { totalTransactions, totalQuantity, totalValue } = calculateOutwardTotals(sortedTransactions);
      setMetrics((prev) => [
        { ...prev[0], value: totalTransactions.toLocaleString() },
        { ...prev[1], value: totalQuantity.toLocaleString() },
        { ...prev[2], value: `₹${Number(totalValue).toLocaleString('en-IN')}` },
      ]);
    }
  }, [activeTab, sortedTransactions]);

  /* ------------------------- Export ------------------------- */

  const handleExportCSV = () => {
    const dataToExport = sortedTransactions.map((transaction) => {
      if (activeTab === 'inward') {
        return {
          'DATE/TIME': formatDisplayDate(transaction.createdAt || transaction.date),
          LOCATION: transaction.location || '-',
          BRAND: transaction.brand || '-',
          'PRODUCT MODEL': transaction.modelNo || transaction.model || '-',
          CATEGORY: transaction.category || '-',
          QUANTITY: transaction.quantity ?? 0,
          STOCK: transaction.currentStock ?? transaction.quantity ?? 0,
          'SUB CATEGORY': transaction.subCategory || '-',
          'SINGLE PIC PRICE': transaction.dealerPrice ?? transaction.price ?? 0,
        };
      }
      return {
        'DATE/TIME': formatDisplayDate(transaction.dispatchDate || transaction.createdAt || transaction.date),
        'INVOICE NO': transaction.invoiceNumber || transaction.invoiceNo || transaction.dispatchNo || transaction.reference || '-',
        'CUSTOMER NAME': transaction.customerName || transaction.storeName || '-',
        'MAIL ID': transaction.mailId || transaction.email || '-',
        'PHONE NO': transaction.phoneNumber || transaction.customerMobile || transaction.phone || '-',
        'SALES PERSON': transaction.salePerson || transaction.salesPerson || transaction.salesperson || '-',
        QUANTITY: transaction.quantity ?? 0,
        'MODEL NO': transaction.modelNo || transaction.model || '-',
        'SINGLE PIC PRICE': transaction.price ?? transaction.dealerPrice ?? 0,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeTab === 'inward' ? 'Inward_Transactions' : 'Outward_Transactions');
    XLSX.writeFile(workbook, `${activeTab === 'inward' ? 'Inward' : 'Outward'}_Transactions.xlsx`);
  };

  const handleClearFilters = () => {
    setFromDate(null);
    setToDate(null);
    if (activeTab === 'inward') {
      setSelectedProduct('All Brands');
      setSelectedCategory('All Categories');
    } else {
      setSelectedProduct('All Customers');
      setSelectedCategory('All Sales Persons');
    }
  };

  const requestSort = (key) => {
    setSortConfig((prev) => {
      let direction = 'asc';
      if (prev.key === key && prev.direction === 'asc') direction = 'desc';
      return { key, direction };
    });
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  /* ------------------------- Header Config ------------------------- */

  const inwardColumns = [
    { label: 'DATE/TIME', key: 'createdAt' },
    { label: 'LOCATION', key: 'location' },
    { label: 'BRAND', key: 'brand' },
    { label: 'PRODUCT MODEL', key: 'modelNo' },
    { label: 'CATEGORY', key: 'category' },
    { label: 'QUANTITY', key: 'quantity' },
    { label: 'STOCK', key: 'currentStock' },
    { label: 'SUB CATEGORY', key: 'subCategory' },
    { label: 'SINGLE PIC PRICE', key: 'dealerPrice' },
  ];

  const outwardColumns = [
    { label: 'DATE/TIME', key: 'dispatchDate' },
    { label: 'INVOICE NO', key: 'invoiceNumber' },
    { label: 'CUSTOMER NAME', key: 'customerName' },
    { label: 'MAIL ID', key: 'mailId' },
    { label: 'PHONE NO', key: 'phoneNumber' },
    { label: 'SALES PERSON', key: 'salePerson' },
    { label: 'QUANTITY', key: 'quantity' },
    { label: 'MODEL NO', key: 'modelNo' },
    { label: 'SINGLE PIC PRICE', key: 'price' },
  ];

  const renderTableHeaders = () => {
    const cols = activeTab === 'inward' ? inwardColumns : outwardColumns;
    return cols.map((col, index) => (
      <th
        key={index}
        style={styles.tableHeader}
        onClick={() => requestSort(col.key)}
        title="Click to sort"
      >
        {col.label}{' '}
        {sortConfig.key === col.key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
      </th>
    ));
  };

  const renderTableRows = () => {
    const cols = activeTab === 'inward' ? inwardColumns : outwardColumns;

    if (isLoading) {
      return (
        <tr>
          <td
            colSpan={cols.length}
            style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #e5e7eb',
                  borderTopColor: activeTab === 'inward' ? '#10b981' : '#ef4444',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                Loading {activeTab === 'inward' ? 'Inward' : 'Outward'} Transactions...
              </span>
            </div>
          </td>
        </tr>
      );
    }

    if (sortedTransactions.length === 0) {
      return (
        <tr>
          <td
            colSpan={cols.length}
            style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}
          >
            No {activeTab === 'inward' ? 'inward' : 'outward'} data available
          </td>
        </tr>
      );
    }

    const emptyRows =
      rowsPerPage - Math.min(rowsPerPage, sortedTransactions.length - page * rowsPerPage);

    return (
      <>
        {sortedTransactions
          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          .map((tx, index) => (
            <tr key={tx._id || index} style={styles.tableRow}>
              {activeTab === 'inward' ? (
                <>
                  <td style={styles.tableCell}>{formatDisplayDate(tx.createdAt || tx.date)}</td>
                  <td style={styles.tableCell}>{tx.location || '-'}</td>
                  <td style={styles.tableCell}>{tx.brand || '-'}</td>
                  <td style={styles.tableCell}>{tx.modelNo || tx.model || '-'}</td>
                  <td style={styles.tableCell}>{tx.category || '-'}</td>
                  <td style={styles.tableCell}>{tx.quantity ?? 0}</td>
                  <td style={styles.tableCell}>{tx.currentStock ?? tx.quantity ?? 0}</td>
                  <td style={styles.tableCell}>{tx.subCategory || '-'}</td>
                  <td style={styles.tableCell}>{tx.dealerPrice ?? tx.price ?? 0}</td>
                </>
              ) : (
                <>
                  <td style={styles.tableCell}>{formatDisplayDate(tx.dispatchDate || tx.createdAt || tx.date)}</td>
                  <td style={styles.tableCell}>{tx.invoiceNumber || tx.invoiceNo || tx.dispatchNo || tx.reference || '-'}</td>
                  <td style={styles.tableCell}>{tx.customerName || tx.storeName || '-'}</td>
                  <td style={styles.tableCell}>{tx.mailId || tx.email || '-'}</td>
                  <td style={styles.tableCell}>{tx.phoneNumber || tx.customerMobile || tx.phone || '-'}</td>
                  <td style={styles.tableCell}>{tx.salePerson || tx.salesPerson || tx.salesperson || '-'}</td>
                  <td style={styles.tableCell}>{tx.quantity ?? 0}</td>
                  <td style={styles.tableCell}>{tx.modelNo || tx.model || '-'}</td>
                  <td style={styles.tableCell}>{tx.price ?? tx.dealerPrice ?? 0}</td>
                </>
              )}
            </tr>
          ))}

        {emptyRows > 0 && (
          <tr style={{ height: 53 * emptyRows }}>
            <td colSpan={cols.length} />
          </tr>
        )}
      </>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Reports</h1>
          <p style={styles.subtitle}>Transaction history and analytics</p>
        </div>
        <button style={styles.exportButton} onClick={handleExportCSV}>
          <svg style={styles.downloadIcon} viewBox="0 0 16 16" fill="currentColor">
            <path d="M8.5 1.5V11L11 8.5l.5.75L8 12.75 4.5 9.25 5 8.5 7.5 11V1.5h1z" />
            <path d="M3.5 13.5v1h9v-1h1v2h-11v-2h1z" />
          </svg>
          Export CSV
        </button>
      </div>

      <div style={styles.tabContainer}>
        <div style={styles.tabWrapper}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'inward' ? styles.activeInwardTab : styles.inactiveTab),
            }}
            onClick={() => setActiveTab('inward')}
          >
            <TrendingUpIcon />
            Inward Transactions
          </button>

          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'outward' ? styles.activeOutwardTab : styles.inactiveTab),
            }}
            onClick={() => setActiveTab('outward')}
          >
            <TrendingDownIcon />
            Outward Transactions
          </button>
        </div>
      </div>

      <div style={styles.cardGrid}>
        {metrics.map((metric) => (
          <div
            key={metric.id}
            style={{
              ...styles.card,
              borderColor: metric.borderColor,
              backgroundColor: metric.backgroundColor,
            }}
          >
            <div style={styles.cardContent}>
              <div style={{ ...styles.iconWrapper, backgroundColor: metric.iconColor }}>
                <div style={{ color: 'white' }}>{metric.icon}</div>
              </div>
              <div style={styles.textContent}>
                <div style={styles.title}>{metric.title}</div>
                <div style={styles.value}>{metric.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      
        <div style={styles.filtersSection}>
          <div style={styles.filtersRow}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>From Date</label>
              <div style={styles.dateInputWrapper}>
                <ReactDatePicker
                  selected={fromDate}
                  onChange={(date) => setFromDate(date)}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="dd/mm/yyyy"
                  customInput={<input style={styles.dateInput} />}
                />
                <svg style={styles.calendarIcon} viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
                </svg>
              </div>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>To Date</label>
              <div style={styles.dateInputWrapper}>
                <ReactDatePicker
                  selected={toDate}
                  onChange={(date) => setToDate(date)}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="dd/mm/yyyy"
                  customInput={<input style={styles.dateInput} />}
                />
                <svg style={styles.calendarIcon} viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
                </svg>
              </div>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>
                {activeTab === 'inward' ? 'Brand' : 'Customer Name'}
              </label>
              <div style={styles.selectWrapper}>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  style={styles.select}
                >
                  {activeTab === 'inward' ? (
                    <>
                      <option value="All Brands">All Brands</option>
                      {brands.map((brand) => {
                        const brandVal = brand.brand || brand.name || '';
                        return (
                          <option key={brand._id} value={brandVal}>
                            {brandVal}
                          </option>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      <option value="All Customers">All Customers</option>
                      {uniqueCustomers.map((cust, idx) => (
                        <option key={idx} value={cust}>
                          {cust}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <svg style={styles.selectIcon} viewBox="0 0 16 16" fill="currentColor">
                  <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
                </svg>
              </div>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>
                {activeTab === 'inward' ? 'Category' : 'Sales Person'}
              </label>
              <div style={styles.selectWrapper}>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={styles.select}
                >
                  {activeTab === 'inward' ? (
                    <>
                      <option value="All Categories">All Categories</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </>
                  ) : (
                    <>
                      <option value="All Sales Persons">All Sales Persons</option>
                      {uniqueSalesPersons.map((sp, idx) => (
                        <option key={idx} value={sp}>
                          {sp}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <svg style={styles.selectIcon} viewBox="0 0 16 16" fill="currentColor">
                  <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
                </svg>
              </div>
            </div>

            <button
              style={styles.clearButton}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>{renderTableHeaders()}</tr>
          </thead>
          <tbody>{renderTableRows()}</tbody>
        </table>

        <TablePagination
          component="div"
          count={sortedTransactions.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#ffffff',
    marginBottom: '2%',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    padding: '24px 32px',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    margin: '0 auto',
    marginBottom: '2%',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '2px solid',
    padding: '20px',
    transition: 'all 0.2s ease-in-out',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  cardContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  title: {
    fontWeight: '500',
    color: 'rgb(0 15 46)',
    lineHeight: '1.4',
  },
  value: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    lineHeight: '1.2',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    fontWeight: '400',
  },
  exportButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background-color 0.2s',
  },
  downloadIcon: {
    width: '16px',
    height: '16px',
  },
  tabContainer: {
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '32px',
  },
  tabWrapper: {
    display: 'flex',
    gap: '0',
  },
  tab: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s',
    position: 'relative',
  },
  activeInwardTab: {
    color: '#10b981',
    borderBottomColor: '#10b981',
  },
  activeOutwardTab: {
    color: '#dc2626',
    borderBottomColor: '#dc2626',
  },
  inactiveTab: {
    color: '#6b7280',
  },
  filtersSection: {
    marginBottom: '32px',
    border: '1px solid #efefef',
    padding: '25px',
    borderRadius: '5px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  },
  filtersRow: {
    display: 'flex',
    gap: '24px',
    alignItems: 'end',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '160px',
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  dateInputWrapper: {
    position: 'relative',
  },
  dateInput: {
    width: '100%',
    padding: '10px 36px 10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    outline: 'none',
    boxSizing: 'border-box',
  },
  calendarIcon: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '16px',
    height: '16px',
    color: '#9ca3af',
    pointerEvents: 'none',
  },
  selectWrapper: {
    position: 'relative',
  },
  select: {
    width: '100%',
    padding: '10px 36px 10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    boxSizing: 'border-box',
  },
  selectIcon: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '12px',
    height: '12px',
    color: '#9ca3af',
    pointerEvents: 'none',
  },
  clearButton: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'center',
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    padding: '16px 20px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #e5e7eb',
    cursor: 'pointer',
    userSelect: 'none',
  },
  tableRow: {
    borderBottom: '1px solid #f3f4f6',
  },
  tableCell: {
    padding: '20px',
    fontSize: '14px',
    color: '#111827',
    verticalAlign: 'top',
    lineHeight: '1.5',
  },
};

export default Reports;
