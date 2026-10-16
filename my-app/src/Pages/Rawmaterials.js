// // import { useState } from 'react';
// // import { Calendar, Edit, Trash2, Upload, Plus, X } from 'lucide-react';

// // const RawMaterialsInventory = () => {
// //   const [isModalOpen, setIsModalOpen] = useState(false);
// //   const [currentPage, setCurrentPage] = useState(1);

// //   const rawMaterials = [
// //     {
// //       id: 1,
// //       name: 'Steel Sheets',
// //       units: 200,
// //       addedDate: 'Jan 15, 2024',
// //       image: 'https://images.unsplash.com/photo-1565951120843-e73b7fb6de3b?w=400&h=300&fit=crop'
// //     },
// //     {
// //       id: 2,
// //       name: 'Aluminum Rods',
// //       units: 75,
// //       addedDate: 'Jan 14, 2024',
// //       image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop'
// //     },
// //     {
// //       id: 3,
// //       name: 'Copper Wire',
// //       units: 150,
// //       addedDate: 'Jan 13, 2024',
// //       image: 'https://images.unsplash.com/photo-1518153956478-148bdaeb3eae?w=400&h=300&fit=crop'
// //     },
// //     {
// //       id: 4,
// //       name: 'Plastic Pellets',
// //       units: 300,
// //       addedDate: 'Jan 12, 2024',
// //       image: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=400&h=300&fit=crop'
// //     },
// //     {
// //       id: 5,
// //       name: 'Rubber Sheets',
// //       units: 90,
// //       addedDate: 'Jan 11, 2024',
// //       image: 'https://images.unsplash.com/photo-1565951120843-e73b7fb6de3b?w=400&h=300&fit=crop'
// //     },
// //     {
// //       id: 6,
// //       name: 'Glass Panels',
// //       units: 45,
// //       addedDate: 'Jan 10, 2024',
// //       image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop'
// //     }
// //   ];

// //   const handleAddItem = () => {
// //     setIsModalOpen(false);
// //     // Handle form submission logic here
// //   };

// //   const Modal = ({ isOpen, onClose }) => {
// //     if (!isOpen) return null;

// //     return (
// //       <div style={styles.modalOverlay}>
// //         <div style={styles.modalContent}>
// //           <div style={styles.modalHeader}>
// //             <h2 style={styles.modalTitle}>Add Raw Material</h2>
// //             <button 
// //               onClick={onClose} 
// //               style={styles.closeButton}
// //               onMouseEnter={e => e.target.style.backgroundColor = '#f3f4f6'}
// //               onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
// //             >
// //               <X size={20} />
// //             </button>
// //           </div>
// //           <div style={styles.modalBody}>
// //             <div style={styles.formGroup}>
// //               <label style={styles.label}>Product Name</label>
// //               <input 
// //                 type="text" 
// //                 placeholder="Enter product name"
// //                 style={styles.input}
// //               />
// //             </div>
// //             <div style={styles.formGroup}>
// //               <label style={styles.label}>Product Quantity</label>
// //               <input 
// //                 type="text" 
// //                 placeholder="Enter quantity"
// //                 style={styles.input}
// //               />
// //             </div>
// //             <div style={styles.formGroup}>
// //               <label style={styles.label}>Product Image</label>
// //               <div style={styles.uploadArea}>
// //                 <Upload size={20} style={styles.uploadIcon} />
// //                 <span style={styles.uploadText}>Upload image</span>
// //               </div>
// //             </div>
// //           </div>
// //           <div style={styles.modalFooter}>
// //             <button 
// //               onClick={onClose}
// //               style={styles.cancelButton}
// //               onMouseEnter={e => e.target.style.backgroundColor = '#f9fafb'}
// //               onMouseLeave={e => e.target.style.backgroundColor = 'white'}
// //             >
// //               Cancel
// //             </button>
// //             <button 
// //               onClick={handleAddItem}
// //               style={styles.addButton}
// //               onMouseEnter={e => e.target.style.backgroundColor = '#1d4ed8'}
// //               onMouseLeave={e => e.target.style.backgroundColor = '#2563eb'}
// //             >
// //               Add Item
// //             </button>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   };

// //   const ItemCard = ({ item }) => (
// //     <div style={styles.card}>
// //       <div style={styles.cardImageContainer}>
// //         <div style={styles.unitsBadge}>
// //           {item.units} units
// //         </div>
// //         <img 
// //           src={item.image} 
// //           alt={item.name}
// //           style={styles.cardImage}
// //         />
// //       </div>
// //       <div style={styles.cardContent}>
// //         <h3 style={styles.cardTitle}>{item.name}</h3>
// //         <div style={styles.cardDate}>
// //           <Calendar size={14} style={styles.calendarIcon} />
// //           <span>Added {item.addedDate}</span>
// //         </div>
// //         <div style={styles.cardActions}>
// //           <button 
// //             style={styles.actionButton}
// //             onMouseEnter={e => e.target.style.backgroundColor = '#f3f4f6'}
// //             onMouseLeave={e => e.target.style.backgroundColor = 'white'}
// //           >
// //             <Edit size={16} />
// //             Edit
// //           </button>
// //           <button 
// //             style={styles.actionButton}
// //             onMouseEnter={e => e.target.style.backgroundColor = '#f3f4f6'}
// //             onMouseLeave={e => e.target.style.backgroundColor = 'white'}
// //           >
// //             <Trash2 size={16} />
// //             Delete
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );

// //   const styles = {
// //     container: {
// //       padding: '24px',
// //       backgroundColor: '#ffffff',
// //       minHeight: '100vh',
// //       fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
// //     },
// //     header: {
// //       display: 'flex',
// //       justifyContent: 'space-between',
// //       alignItems: 'flex-start',
// //       marginBottom: '32px',
// //       flexWrap: 'wrap',
// //       gap: '16px'
// //     },
// //     headerLeft: {
// //       flex: '1',
// //       minWidth: '200px'
// //     },
// //     title: {
// //       fontSize: '28px',
// //       fontWeight: '700',
// //       color: '#1f2937',
// //       margin: '0 0 8px 0'
// //     },
// //     subtitle: {
// //       fontSize: '16px',
// //       color: '#6b7280',
// //       margin: '0'
// //     },
// //     addButton: {
// //       display: 'flex',
// //       alignItems: 'center',
// //       gap: '8px',
// //       backgroundColor: '#2563eb',
// //       color: 'white',
// //       border: 'none',
// //       borderRadius: '8px',
// //       padding: '12px 20px',
// //       fontSize: '14px',
// //       fontWeight: '500',
// //       cursor: 'pointer',
// //       transition: 'all 0.2s ease'
// //     },
// //     grid: {
// //       display: 'grid',
// //       gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
// //       gap: '24px',
// //       marginBottom: '40px'
// //     },
// //     card: {
// //       backgroundColor: '#ffffff',
// //       borderRadius: '16px',
// //       border: '1px solid #e5e7eb',
// //       overflow: 'hidden',
// //       transition: 'all 0.2s ease',
// //       boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
// //     },
// //     cardImageContainer: {
// //       position: 'relative',
// //       height: '200px',
// //       overflow: 'hidden'
// //     },
// //     cardImage: {
// //       width: '100%',
// //       height: '100%',
// //       objectFit: 'cover'
// //     },
// //     unitsBadge: {
// //       position: 'absolute',
// //       top: '12px',
// //       right: '12px',
// //       backgroundColor: 'rgba(0, 0, 0, 0.75)',
// //       color: 'white',
// //       padding: '6px 12px',
// //       borderRadius: '20px',
// //       fontSize: '12px',
// //       fontWeight: '500',
// //       backdropFilter: 'blur(8px)'
// //     },
// //     cardContent: {
// //       padding: '20px'
// //     },
// //     cardTitle: {
// //       fontSize: '18px',
// //       fontWeight: '600',
// //       color: '#1f2937',
// //       margin: '0 0 12px 0'
// //     },
// //     cardDate: {
// //       display: 'flex',
// //       alignItems: 'center',
// //       gap: '6px',
// //       color: '#6b7280',
// //       fontSize: '14px',
// //       marginBottom: '20px'
// //     },
// //     calendarIcon: {
// //       color: '#9ca3af'
// //     },
// //     cardActions: {
// //       display: 'flex',
// //       gap: '12px'
// //     },
// //     actionButton: {
// //       display: 'flex',
// //       alignItems: 'center',
// //       gap: '6px',
// //       backgroundColor: 'white',
// //       border: '1px solid #d1d5db',
// //       borderRadius: '6px',
// //       padding: '8px 12px',
// //       fontSize: '14px',
// //       color: '#374151',
// //       cursor: 'pointer',
// //       transition: 'all 0.2s ease'
// //     },
// //     pagination: {
// //       display: 'flex',
// //       justifyContent: 'space-between',
// //       alignItems: 'center',
// //       flexWrap: 'wrap',
// //       gap: '16px',
// //       border: '1px solid rgb(229, 231, 235)',
// //       backgroundColor: 'rgb(255, 255, 255)',
// //       boxShadow:'rgba(0, 0, 0, 0.1) 0px 1px 3px',
// //       padding:'25px',
// //       borderRadius:'15px'
// //     },
// //     paginationInfo: {
// //       color: '#6b7280',
// //       fontSize: '14px'
// //     },
// //     paginationButtons: {
// //       display: 'flex',
// //       gap: '8px'
// //     },
// //     paginationButton: {
// //       padding: '8px 12px',
// //       border: '1px solid #d1d5db',
// //       backgroundColor: 'white',
// //       borderRadius: '6px',
// //       cursor: 'pointer',
// //       fontSize: '14px',
// //       color: '#374151',
// //       transition: 'all 0.2s ease'
// //     },
// //     paginationButtonActive: {
// //       padding: '8px 12px',
// //       border: '1px solid #2563eb',
// //       backgroundColor: '#2563eb',
// //       borderRadius: '6px',
// //       cursor: 'pointer',
// //       fontSize: '14px',
// //       color: 'white'
// //     },
// //     modalOverlay: {
// //       position: 'fixed',
// //       top: '0',
// //       left: '0',
// //       right: '0',
// //       bottom: '0',
// //       backgroundColor: 'rgba(0, 0, 0, 0.5)',
// //       display: 'flex',
// //       alignItems: 'center',
// //       justifyContent: 'center',
// //       zIndex: '1000',
// //       padding: '20px'
// //     },
// //     modalContent: {
// //       backgroundColor: 'white',
// //       borderRadius: '12px',
// //       width: '100%',
// //       maxWidth: '500px',
// //       maxHeight: '90vh',
// //       overflow: 'auto'
// //     },
// //     modalHeader: {
// //       display: 'flex',
// //       justifyContent: 'space-between',
// //       alignItems: 'center',
// //       padding: '24px 24px 0 24px'
// //     },
// //     modalTitle: {
// //       fontSize: '20px',
// //       fontWeight: '600',
// //       color: '#1f2937',
// //       margin: '0'
// //     },
// //     closeButton: {
// //       background: 'none',
// //       border: 'none',
// //       cursor: 'pointer',
// //       padding: '8px',
// //       borderRadius: '6px',
// //       color: '#6b7280',
// //       transition: 'all 0.2s ease'
// //     },
// //     modalBody: {
// //       padding: '24px'
// //     },
// //     formGroup: {
// //       marginBottom: '20px'
// //     },
// //     label: {
// //       display: 'block',
// //       fontSize: '14px',
// //       fontWeight: '500',
// //       color: '#374151',
// //       marginBottom: '8px'
// //     },
// //     input: {
// //       width: '100%',
// //       padding: '12px',
// //       border: '1px solid #d1d5db',
// //       borderRadius: '8px',
// //       fontSize: '14px',
// //       outline: 'none',
// //       transition: 'border-color 0.2s ease',
// //       boxSizing: 'border-box'
// //     },
// //     uploadArea: {
// //       border: '2px dashed #d1d5db',
// //       borderRadius: '8px',
// //       padding: '40px 20px',
// //       textAlign: 'center',
// //       cursor: 'pointer',
// //       transition: 'all 0.2s ease',
// //       backgroundColor: '#fafafa'
// //     },
// //     uploadIcon: {
// //       color: '#9ca3af',
// //       marginBottom: '8px'
// //     },
// //     uploadText: {
// //       color: '#6b7280',
// //       fontSize: '14px'
// //     },
// //     modalFooter: {
// //       display: 'flex',
// //       justifyContent: 'flex-end',
// //       gap: '12px',
// //       padding: '0 24px 24px 24px'
// //     },
// //     cancelButton: {
// //       padding: '10px 20px',
// //       border: '1px solid #d1d5db',
// //       backgroundColor: 'white',
// //       borderRadius: '8px',
// //       fontSize: '14px',
// //       fontWeight: '500',
// //       color: '#374151',
// //       cursor: 'pointer',
// //       transition: 'all 0.2s ease'
// //     }
// //   };

// //   // Responsive styles based on screen width
// //   const getResponsiveStyles = () => {
// //     const isMobile = window.innerWidth <= 640;
// //     const isTablet = window.innerWidth <= 768;
    
// //     return {
// //       ...styles,
// //       container: {
// //         ...styles.container,
// //         padding: isMobile ? '16px' : '24px'
// //       },
// //       grid: {
// //         ...styles.grid,
// //         gridTemplateColumns: isMobile 
// //           ? '1fr' 
// //           : isTablet 
// //             ? 'repeat(auto-fill, minmax(280px, 1fr))'
// //             : 'repeat(auto-fill, minmax(320px, 1fr))',
// //         gap: isMobile ? '16px' : '24px'
// //       },
// //       header: {
// //         ...styles.header,
// //         flexDirection: isMobile ? 'column' : 'row',
// //         alignItems: isMobile ? 'stretch' : 'flex-start'
// //       },
// //       addButton: {
// //         ...styles.addButton,
// //         width: isMobile ? '100%' : 'auto',
// //         justifyContent: isMobile ? 'center' : 'flex-start'
// //       },
// //       pagination: {
// //         ...styles.pagination,
// //         flexDirection: isMobile ? 'column' : 'row',
// //         textAlign: isMobile ? 'center' : 'left'
// //       },
// //       cardActions: {
// //         ...styles.cardActions,
// //         flexDirection: isMobile ? 'column' : 'row',
// //         gap: isMobile ? '8px' : '12px'
// //       },
// //       actionButton: {
// //         ...styles.actionButton,
// //         width: isMobile ? '100%' : 'auto',
// //         justifyContent: isMobile ? 'center' : 'flex-start'
// //       }
// //     };
// //   };

// //   const responsiveStyles = getResponsiveStyles();

// //   return (
// //     <div style={responsiveStyles.container}>
// //       <div style={responsiveStyles.header}>
// //         <div style={responsiveStyles.headerLeft}>
// //           <h1 style={responsiveStyles.title}>Raw Materials</h1>
// //           <p style={responsiveStyles.subtitle}>Manage your raw materials inventory (7 items)</p>
// //         </div>
// //         <button 
// //           onClick={() => setIsModalOpen(true)}
// //           style={responsiveStyles.addButton}
// //           onMouseEnter={e => e.target.style.backgroundColor = '#1d4ed8'}
// //           onMouseLeave={e => e.target.style.backgroundColor = '#2563eb'}
// //         >
// //           <Plus size={20} />
// //           Add Raw Material
// //         </button>
// //       </div>

// //       <div style={responsiveStyles.grid}>
// //         {rawMaterials.map(item => (
// //           <ItemCard key={item.id} item={item} />
// //         ))}
// //       </div>

// //       <div style={responsiveStyles.pagination}>
// //         <div style={responsiveStyles.paginationInfo}>
// //           Showing 1 to 6 of 7 results
// //         </div>
// //         <div style={responsiveStyles.paginationButtons}>
// //           <button 
// //             style={responsiveStyles.paginationButton}
// //             onMouseEnter={e => e.target.style.backgroundColor = '#f9fafb'}
// //             onMouseLeave={e => e.target.style.backgroundColor = 'white'}
// //           >
// //             Previous
// //           </button>
// //           <button style={responsiveStyles.paginationButtonActive}>1</button>
// //           <button 
// //             style={responsiveStyles.paginationButton}
// //             onMouseEnter={e => e.target.style.backgroundColor = '#f9fafb'}
// //             onMouseLeave={e => e.target.style.backgroundColor = 'white'}
// //           >
// //             2
// //           </button>
// //           <button 
// //             style={responsiveStyles.paginationButton}
// //             onMouseEnter={e => e.target.style.backgroundColor = '#f9fafb'}
// //             onMouseLeave={e => e.target.style.backgroundColor = 'white'}
// //           >
// //             Next
// //           </button>
// //         </div>
// //       </div>

// //       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
// //     </div>
// //   );
// // };

// // export default RawMaterialsInventory;




















// import { useState, useEffect, useRef } from 'react';
// import { Calendar, Edit, Trash2, Upload, Plus, X } from 'lucide-react';

// const RawMaterialsInventory = () => {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rawMaterials, setRawMaterials] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [selectedItem, setSelectedItem] = useState(null);
//   const [itemToDelete, setItemToDelete] = useState(null);
//   const fileInputRef = useRef(null);
//   const itemsPerPage = 6;

//   // Fetch raw materials from backend
//   useEffect(() => {
//     const fetchRawMaterials = async () => {
//       try {
//         const response = await fetch('https://coloroninventoy.onrender.com/api/raw-materials');
//         if (!response.ok) throw new Error('Failed to fetch raw materials');
//         const data = await response.json();
//         setRawMaterials(data);
//       } catch (err) {
//         console.error('Error fetching raw materials:', err);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchRawMaterials();
//   }, []);

//   const handleAddItem = async (formData) => {
//     try {
//       const response = await fetch('https://coloroninventoy.onrender.com/api/raw-materials', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(formData),
//       });
//       if (!response.ok) throw new Error('Failed to add raw material');
//       const newItem = await response.json();
//       setRawMaterials([...rawMaterials, newItem]);
//       setIsModalOpen(false);
//     } catch (err) {
//       console.error('Error adding raw material:', err);
//     }
//   };

//   const handleEditItem = async (id, updatedItem) => {
//     try {
//       const response = await fetch(`https://coloroninventoy.onrender.com/api/raw-materials/${id}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(updatedItem),
//       });
//       if (!response.ok) throw new Error('Failed to update raw material');
//       const data = await response.json();
//       setRawMaterials(rawMaterials.map((item) => (item._id === id ? data : item)));
//       setIsEditModalOpen(false);
//     } catch (err) {
//       console.error('Error updating raw material:', err);
//     }
//   };

//   const handleDeleteItem = async (id) => {
//     try {
//       const response = await fetch(`https://coloroninventoy.onrender.com/api/raw-materials/${id}`, {
//         method: 'DELETE',
//       });
//       if (!response.ok) throw new Error('Failed to delete raw material');
//       setRawMaterials(rawMaterials.filter((item) => item._id !== id));
//       setIsDeleteConfirmOpen(false);
//     } catch (err) {
//       console.error('Error deleting raw material:', err);
//     }
//   };

//   const totalPages = Math.ceil(rawMaterials.length / itemsPerPage);
//   const paginatedItems = rawMaterials.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   // Add Raw Material Modal
//   const AddRawMaterialModal = ({ isOpen, onClose, onAddItem }) => {
//     const [formData, setFormData] = useState({
//       name: '',
//       units: '',
//       image: null,
//     });

//     const handleChange = (e) => {
//       const { name, value } = e.target;
//       setFormData((prev) => ({ ...prev, [name]: value }));
//     };

//     const handleImageUpload = (e) => {
//       const file = e.target.files[0];
//       if (file) {
//         const reader = new FileReader();
//         reader.onloadend = () => {
//           setFormData((prev) => ({ ...prev, image: reader.result }));
//         };
//         reader.readAsDataURL(file);
//       }
//     };

//     const handleSubmit = (e) => {
//       e.preventDefault();
//       onAddItem(formData);
//       setFormData({ name: '', units: '', image: null });
//     };

//     if (!isOpen) return null;

//     return (
//       <div style={styles.modalOverlay}>
//         <div style={styles.modalContent}>
//           <div style={styles.modalHeader}>
//             <h2 style={styles.modalTitle}>Add Raw Material</h2>
//             <button
//               onClick={onClose}
//               style={styles.closeButton}
//               onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
//               onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
//             >
//               <X size={20} />
//             </button>
//           </div>
//           <div style={styles.modalBody}>
//             <form onSubmit={handleSubmit}>
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Product Name</label>
//                 <input
//                   type="text"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleChange}
//                   placeholder="Enter product name"
//                   style={styles.input}
//                   required
//                 />
//               </div>
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Product Quantity</label>
//                 <input
//                   type="number"
//                   name="units"
//                   value={formData.units}
//                   onChange={handleChange}
//                   placeholder="Enter quantity"
//                   style={styles.input}
//                   required
//                 />
//               </div>
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Product Image</label>
//                 <input
//                   type="file"
//                   ref={fileInputRef}
//                   onChange={handleImageUpload}
//                   style={{ display: 'none' }}
//                   accept="image/*"
//                 />
//                 <div
//                   style={styles.uploadArea}
//                   onClick={() => fileInputRef.current.click()}
//                 >
//                   <Upload size={20} style={styles.uploadIcon} />
//                   <span style={styles.uploadText}>
//                     {formData.image ? 'Change image' : 'Upload image'}
//                   </span>
//                 </div>
//                 {formData.image && (
//                   <div style={styles.imagePreview}>
//                     <img
//                       src={formData.image}
//                       alt="Preview"
//                       style={styles.previewImage}
//                     />
//                   </div>
//                 )}
//               </div>
//             </form>
//           </div>
//           <div style={styles.modalFooter}>
//             <button
//               onClick={onClose}
//               style={styles.cancelButton}
//               onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9fafb')}
//               onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleSubmit}
//               style={styles.addButton}
//               onMouseEnter={(e) => (e.target.style.backgroundColor = '#1d4ed8')}
//               onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563eb')}
//             >
//               Add Item
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Edit Raw Material Modal
//   const EditRawMaterialModal = ({ isOpen, onClose, item, onEditItem }) => {
//     const [formData, setFormData] = useState({
//       name: item?.name || '',
//       units: item?.units || '',
//       image: item?.image || null,
//     });

//     useEffect(() => {
//       if (item) {
//         setFormData({
//           name: item.name,
//           units: item.units,
//           image: item.image,
//         });
//       }
//     }, [item]);

//     const handleChange = (e) => {
//       const { name, value } = e.target;
//       setFormData((prev) => ({ ...prev, [name]: value }));
//     };

//     const handleImageUpload = (e) => {
//       const file = e.target.files[0];
//       if (file) {
//         const reader = new FileReader();
//         reader.onloadend = () => {
//           setFormData((prev) => ({ ...prev, image: reader.result }));
//         };
//         reader.readAsDataURL(file);
//       }
//     };

//     const handleSubmit = (e) => {
//       e.preventDefault();
//       onEditItem(item._id, formData);
//     };

//     if (!isOpen || !item) return null;

//     return (
//       <div style={styles.modalOverlay}>
//         <div style={styles.modalContent}>
//           <div style={styles.modalHeader}>
//             <h2 style={styles.modalTitle}>Edit Raw Material</h2>
//             <button
//               onClick={onClose}
//               style={styles.closeButton}
//               onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
//               onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
//             >
//               <X size={20} />
//             </button>
//           </div>
//           <div style={styles.modalBody}>
//             <form onSubmit={handleSubmit}>
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Product Name</label>
//                 <input
//                   type="text"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleChange}
//                   placeholder="Enter product name"
//                   style={styles.input}
//                   required
//                 />
//               </div>
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Product Quantity</label>
//                 <input
//                   type="number"
//                   name="units"
//                   value={formData.units}
//                   onChange={handleChange}
//                   placeholder="Enter quantity"
//                   style={styles.input}
//                   required
//                 />
//               </div>
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Product Image</label>
//                 <input
//                   type="file"
//                   ref={fileInputRef}
//                   onChange={handleImageUpload}
//                   style={{ display: 'none' }}
//                   accept="image/*"
//                 />
//                 <div
//                   style={styles.uploadArea}
//                   onClick={() => fileInputRef.current.click()}
//                 >
//                   <Upload size={20} style={styles.uploadIcon} />
//                   <span style={styles.uploadText}>
//                     {formData.image ? 'Change image' : 'Upload image'}
//                   </span>
//                 </div>
//                 {formData.image && (
//                   <div style={styles.imagePreview}>
//                     <img
//                       src={formData.image}
//                       alt="Preview"
//                       style={styles.previewImage}
//                     />
//                   </div>
//                 )}
//               </div>
//             </form>
//           </div>
//           <div style={styles.modalFooter}>
//             <button
//               onClick={onClose}
//               style={styles.cancelButton}
//               onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9fafb')}
//               onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleSubmit}
//               style={styles.addButton}
//               onMouseEnter={(e) => (e.target.style.backgroundColor = '#1d4ed8')}
//               onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563eb')}
//             >
//               Update Item
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Delete Confirmation Modal
//   const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemName }) => {
//     if (!isOpen) return null;

//     return (
//       <div style={styles.modalOverlay}>
//         <div style={styles.modalContent}>
//           <div style={styles.modalHeader}>
//             <h2 style={styles.modalTitle}>Confirm Deletion</h2>
//             <button
//               onClick={onClose}
//               style={styles.closeButton}
//               onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
//               onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
//             >
//               <X size={20} />
//             </button>
//           </div>
//           <div style={styles.modalBody}>
//             <p style={styles.confirmText}>
//               Are you sure you want to delete "{itemName}"? This action cannot be undone.
//             </p>
//           </div>
//           <div style={styles.modalFooter}>
//             <button
//               onClick={onClose}
//               style={styles.cancelButton}
//               onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9fafb')}
//               onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
//             >
//               Cancel
//             </button>
//             <button
//               onClick={onConfirm}
//               style={styles.deleteButton}
//               onMouseEnter={(e) => (e.target.style.backgroundColor = '#b91c1c')}
//               onMouseLeave={(e) => (e.target.style.backgroundColor = '#dc2626')}
//             >
//               Delete
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const ItemCard = ({ item, onEdit, onDelete }) => (
//     <div style={styles.card}>
//       <div style={styles.cardImageContainer}>
//         <div style={styles.unitsBadge}>{item.units} units</div>
//         {item.image ? (
//           <img src={item.image} alt={item.name} style={styles.cardImage} />
//         ) : (
//           <div style={styles.placeholderImage}>
//             <div style={styles.placeholderIcon}>
//               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
//                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
//                 <circle cx="8.5" cy="8.5" r="1.5" />
//                 <polyline points="21,15 16,10 5,21" />
//               </svg>
//             </div>
//           </div>
//         )}
//       </div>
//       <div style={styles.cardContent}>
//         <h3 style={styles.cardTitle}>{item.name}</h3>
//         <div style={styles.cardDate}>
//           <Calendar size={14} style={styles.calendarIcon} />
//           <span>Added {new Date(item.addedDate).toLocaleDateString()}</span>
//         </div>
//         <div style={styles.cardActions}>
//           <button
//             style={styles.actionButton}
//             onClick={() => onEdit(item)}
//             onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
//             onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
//           >
//             <Edit size={16} />
//             Edit
//           </button>
//           <button
//             style={styles.actionButton}
//             onClick={() => onDelete(item)}
//             onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
//             onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
//           >
//             <Trash2 size={16} />
//             Delete
//           </button>
//         </div>
//       </div>
//     </div>
//   );

//   const styles = {
//     container: {
//       padding: '24px',
//       backgroundColor: '#ffffff',
//       minHeight: '100vh',
//       fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
//     },
//     header: {
//       display: 'flex',
//       justifyContent: 'space-between',
//       alignItems: 'flex-start',
//       marginBottom: '32px',
//       flexWrap: 'wrap',
//       gap: '16px',
//     },
//     headerLeft: {
//       flex: '1',
//       minWidth: '200px',
//     },
//     title: {
//       fontSize: '28px',
//       fontWeight: '700',
//       color: '#1f2937',
//       margin: '0 0 8px 0',
//     },
//     subtitle: {
//       fontSize: '16px',
//       color: '#6b7280',
//       margin: '0',
//     },
//     addButton: {
//       display: 'flex',
//       alignItems: 'center',
//       gap: '8px',
//       backgroundColor: '#2563eb',
//       color: 'white',
//       border: 'none',
//       borderRadius: '8px',
//       padding: '12px 20px',
//       fontSize: '14px',
//       fontWeight: '500',
//       cursor: 'pointer',
//       transition: 'all 0.2s ease',
//     },
//     grid: {
//       display: 'grid',
//       gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
//       gap: '24px',
//       marginBottom: '40px',
//     },
//     noData: {
//       textAlign: 'center',
//       padding: '40px',
//       color: '#6b7280',
//       fontSize: '16px',
//       gridColumn: '1 / -1',
//     },
//     card: {
//       backgroundColor: '#ffffff',
//       borderRadius: '16px',
//       border: '1px solid #e5e7eb',
//       overflow: 'hidden',
//       transition: 'all 0.2s ease',
//       boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
//     },
//     cardImageContainer: {
//       position: 'relative',
//       height: '200px',
//       overflow: 'hidden',
//     },
//     cardImage: {
//       width: '100%',
//       height: '100%',
//       objectFit: 'cover',
//     },
//     placeholderImage: {
//       width: '100%',
//       height: '100%',
//       backgroundColor: '#f3f4f6',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//     },
//     placeholderIcon: {
//       opacity: '0.5',
//     },
//     unitsBadge: {
//       position: 'absolute',
//       top: '12px',
//       right: '12px',
//       backgroundColor: 'rgba(0, 0, 0, 0.75)',
//       color: 'white',
//       padding: '6px 12px',
//       borderRadius: '20px',
//       fontSize: '12px',
//       fontWeight: '500',
//       backdropFilter: 'blur(8px)',
//     },
//     cardContent: {
//       padding: '20px',
//     },
//     cardTitle: {
//       fontSize: '18px',
//       fontWeight: '600',
//       color: '#1f2937',
//       margin: '0 0 12px 0',
//     },
//     cardDate: {
//       display: 'flex',
//       alignItems: 'center',
//       gap: '6px',
//       color: '#6b7280',
//       fontSize: '14px',
//       marginBottom: '20px',
//     },
//     calendarIcon: {
//       color: '#9ca3af',
//     },
//     cardActions: {
//       display: 'flex',
//       gap: '12px',
//     },
//     actionButton: {
//       display: 'flex',
//       alignItems: 'center',
//       gap: '6px',
//       backgroundColor: 'white',
//       border: '1px solid #d1d5db',
//       borderRadius: '6px',
//       padding: '8px 12px',
//       fontSize: '14px',
//       color: '#374151',
//       cursor: 'pointer',
//       transition: 'all 0.2s ease',
//     },
//     pagination: {
//       display: 'flex',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//       flexWrap: 'wrap',
//       gap: '16px',
//       border: '1px solid rgb(229, 231, 235)',
//       backgroundColor: 'rgb(255, 255, 255)',
//       boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px',
//       padding: '25px',
//       borderRadius: '15px',
//     },
//     paginationInfo: {
//       color: '#6b7280',
//       fontSize: '14px',
//     },
//     paginationButtons: {
//       display: 'flex',
//       gap: '8px',
//     },
//     paginationButton: {
//       padding: '8px 12px',
//       border: '1px solid #d1d5db',
//       backgroundColor: 'white',
//       borderRadius: '6px',
//       cursor: 'pointer',
//       fontSize: '14px',
//       color: '#374151',
//       transition: 'all 0.2s ease',
//     },
//     paginationButtonActive: {
//       padding: '8px 12px',
//       border: '1px solid #2563eb',
//       backgroundColor: '#2563eb',
//       borderRadius: '6px',
//       cursor: 'pointer',
//       fontSize: '14px',
//       color: 'white',
//     },
//     modalOverlay: {
//       position: 'fixed',
//       top: '0',
//       left: '0',
//       right: '0',
//       bottom: '0',
//       backgroundColor: 'rgba(0, 0, 0, 0.5)',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       zIndex: '1000',
//       padding: '20px',
//     },
//     modalContent: {
//       backgroundColor: 'white',
//       borderRadius: '12px',
//       width: '100%',
//       maxWidth: '500px',
//       maxHeight: '90vh',
//       overflow: 'auto',
//     },
//     modalHeader: {
//       display: 'flex',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//       padding: '24px 24px 0 24px',
//     },
//     modalTitle: {
//       fontSize: '20px',
//       fontWeight: '600',
//       color: '#1f2937',
//       margin: '0',
//     },
//     closeButton: {
//       background: 'none',
//       border: 'none',
//       cursor: 'pointer',
//       padding: '8px',
//       borderRadius: '6px',
//       color: '#6b7280',
//       transition: 'all 0.2s ease',
//     },
//     modalBody: {
//       padding: '24px',
//     },
//     formGroup: {
//       marginBottom: '20px',
//     },
//     label: {
//       display: 'block',
//       fontSize: '14px',
//       fontWeight: '500',
//       color: '#374151',
//       marginBottom: '8px',
//     },
//     input: {
//       width: '100%',
//       padding: '12px',
//       border: '1px solid #d1d5db',
//       borderRadius: '8px',
//       fontSize: '14px',
//       outline: 'none',
//       transition: 'border-color 0.2s ease',
//       boxSizing: 'border-box',
//     },
//     uploadArea: {
//       border: '2px dashed #d1d5db',
//       borderRadius: '8px',
//       padding: '40px 20px',
//       textAlign: 'center',
//       cursor: 'pointer',
//       transition: 'all 0.2s ease',
//       backgroundColor: '#fafafa',
//     },
//     uploadIcon: {
//       color: '#9ca3af',
//       marginBottom: '8px',
//     },
//     uploadText: {
//       color: '#6b7280',
//       fontSize: '14px',
//     },
//     imagePreview: {
//       marginTop: '16px',
//       textAlign: 'center',
//     },
//     previewImage: {
//       maxWidth: '100%',
//       maxHeight: '200px',
//       borderRadius: '8px',
//     },
//     modalFooter: {
//       display: 'flex',
//       justifyContent: 'flex-end',
//       gap: '12px',
//       padding: '0 24px 24px 24px',
//     },
//     cancelButton: {
//       padding: '10px 20px',
//       border: '1px solid #d1d5db',
//       backgroundColor: 'white',
//       borderRadius: '8px',
//       fontSize: '14px',
//       fontWeight: '500',
//       color: '#374151',
//       cursor: 'pointer',
//       transition: 'all 0.2s ease',
//     },
//     addButton: {
//       padding: '10px 20px',
//       border: 'none',
//       backgroundColor: '#2563eb',
//       color: 'white',
//       borderRadius: '8px',
//       fontSize: '14px',
//       fontWeight: '500',
//       cursor: 'pointer',
//       transition: 'all 0.2s ease',
//     },
//     deleteButton: {
//       padding: '10px 20px',
//       border: 'none',
//       backgroundColor: '#dc2626',
//       color: 'white',
//       borderRadius: '8px',
//       fontSize: '14px',
//       fontWeight: '500',
//       cursor: 'pointer',
//       transition: 'all 0.2s ease',
//     },
//     confirmText: {
//       color: '#374151',
//       fontSize: '16px',
//       margin: '0',
//     },
//   };

//   // Responsive styles based on screen width
//   const getResponsiveStyles = () => {
//     const isMobile = window.innerWidth <= 640;
//     const isTablet = window.innerWidth <= 768;

//     return {
//       ...styles,
//       container: {
//         ...styles.container,
//         padding: isMobile ? '16px' : '24px',
//       },
//       grid: {
//         ...styles.grid,
//         gridTemplateColumns: isMobile
//           ? '1fr'
//           : isTablet
//             ? 'repeat(auto-fill, minmax(280px, 1fr))'
//             : 'repeat(auto-fill, minmax(320px, 1fr))',
//         gap: isMobile ? '16px' : '24px',
//       },
//       header: {
//         ...styles.header,
//         flexDirection: isMobile ? 'column' : 'row',
//         alignItems: isMobile ? 'stretch' : 'flex-start',
//       },
//       addButton: {
//         ...styles.addButton,
//         width: isMobile ? '100%' : 'auto',
//         justifyContent: isMobile ? 'center' : 'flex-start',
//       },
//       pagination: {
//         ...styles.pagination,
//         flexDirection: isMobile ? 'column' : 'row',
//         textAlign: isMobile ? 'center' : 'left',
//       },
//       cardActions: {
//         ...styles.cardActions,
//         flexDirection: isMobile ? 'column' : 'row',
//         gap: isMobile ? '8px' : '12px',
//       },
//       actionButton: {
//         ...styles.actionButton,
//         width: isMobile ? '100%' : 'auto',
//         justifyContent: isMobile ? 'center' : 'flex-start',
//       },
//     };
//   };

//   const responsiveStyles = getResponsiveStyles();

//   return (
//     <div style={responsiveStyles.container}>
//       <div style={responsiveStyles.header}>
//         <div style={responsiveStyles.headerLeft}>
//           <h1 style={responsiveStyles.title}>Raw Materials</h1>
//           <p style={responsiveStyles.subtitle}>
//             Manage your raw materials inventory ({rawMaterials.length} items)
//           </p>
//         </div>
//         <button
//           onClick={() => setIsModalOpen(true)}
//           style={responsiveStyles.addButton}
//           onMouseEnter={(e) => (e.target.style.backgroundColor = '#1d4ed8')}
//           onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563eb')}
//         >
//           <Plus size={20} />
//           Add Raw Material
//         </button>
//       </div>
//       <div style={responsiveStyles.grid}>
//         {isLoading ? (
//           <div style={styles.noData}>Loading...</div>
//         ) : paginatedItems.length > 0 ? (
//           paginatedItems.map((item) => (
//             <ItemCard
//               key={item._id}
//               item={item}
//               onEdit={(editedItem) => {
//                 setSelectedItem(editedItem);
//                 setIsEditModalOpen(true);
//               }}
//               onDelete={(deletedItem) => {
//                 setItemToDelete(deletedItem);
//                 setIsDeleteConfirmOpen(true);
//               }}
//             />
//           ))
//         ) : (
//           <div style={styles.noData}>No data available</div>
//         )}
//       </div>
//       {totalPages > 1 && (
//         <div style={responsiveStyles.pagination}>
//           <div style={responsiveStyles.paginationInfo}>
//             Showing {currentPage} to {totalPages} of {rawMaterials.length} results
//           </div>
//           <div style={responsiveStyles.paginationButtons}>
//             <button
//               style={responsiveStyles.paginationButton}
//               onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//               disabled={currentPage === 1}
//               onMouseEnter={(e) =>
//                 !e.target.disabled && (e.target.style.backgroundColor = '#f9fafb')
//               }
//               onMouseLeave={(e) =>
//                 !e.target.disabled && (e.target.style.backgroundColor = 'white')
//               }
//             >
//               Previous
//             </button>
//             {[...Array(totalPages)].map((_, i) => (
//               <button
//                 key={i + 1}
//                 style={
//                   currentPage === i + 1
//                     ? responsiveStyles.paginationButtonActive
//                     : responsiveStyles.paginationButton
//                 }
//                 onClick={() => setCurrentPage(i + 1)}
//                 onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9fafb')}
//                 onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
//               >
//                 {i + 1}
//               </button>
//             ))}
//             <button
//               style={responsiveStyles.paginationButton}
//               onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
//               disabled={currentPage === totalPages}
//               onMouseEnter={(e) =>
//                 !e.target.disabled && (e.target.style.backgroundColor = '#f9fafb')
//               }
//               onMouseLeave={(e) =>
//                 !e.target.disabled && (e.target.style.backgroundColor = 'white')
//               }
//             >
//               Next
//             </button>
//           </div>
//         </div>
//       )}
//       <AddRawMaterialModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onAddItem={handleAddItem}
//       />
//       <EditRawMaterialModal
//         isOpen={isEditModalOpen}
//         onClose={() => setIsEditModalOpen(false)}
//         item={selectedItem}
//         onEditItem={handleEditItem}
//       />
//       <DeleteConfirmModal
//         isOpen={isDeleteConfirmOpen}
//         onClose={() => setIsDeleteConfirmOpen(false)}
//         onConfirm={() => handleDeleteItem(itemToDelete?._id)}
//         itemName={itemToDelete?.name}
//       />
//     </div>
//   );
// };

// export default RawMaterialsInventory;











import { useState, useEffect, useRef } from 'react';
import { Calendar, Edit, Trash2, Upload, Plus, X } from 'lucide-react';

const RawMaterialsInventory = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const itemsPerPage = 6;
  const API_BASE_URL =
    process.env.REACT_APP_API_URL || 'https://coloroninventoy.onrender.com/api';

  // ✅ Fetch raw materials from backend
  useEffect(() => {
    const fetchRawMaterials = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/raw-materials`);
        if (!response.ok) throw new Error('Failed to fetch raw materials');
        const data = await response.json();
        setRawMaterials(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching raw materials:', err);
        setRawMaterials([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRawMaterials();
  }, [API_BASE_URL]);

  const handleAddItem = async (formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/raw-materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to add raw material');
      const newItem = await response.json();
      setRawMaterials((prev) => [...prev, newItem]);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error adding raw material:', err);
    }
  };

  const handleEditItem = async (id, updatedItem) => {
    try {
      const response = await fetch(`${API_BASE_URL}/raw-materials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      });
      if (!response.ok) throw new Error('Failed to update raw material');
      const data = await response.json();
      setRawMaterials((prev) => prev.map((item) => (item._id === id ? data : item)));
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error updating raw material:', err);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/raw-materials/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete raw material');
      setRawMaterials((prev) => prev.filter((item) => item._id !== id));
      setIsDeleteConfirmOpen(false);
    } catch (err) {
      console.error('Error deleting raw material:', err);
    }
  };

  const totalPages = Math.max(1, Math.ceil(rawMaterials.length / itemsPerPage));
  const paginatedItems = rawMaterials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ✅ Add Raw Material Modal
  const AddRawMaterialModal = ({ isOpen, onClose, onAddItem }) => {
    const [formData, setFormData] = useState({
      name: '',
      units: '',
      image: null,
    });

    const handleChange = (e) => {
      const { name, value, type } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value,
      }));
    };

    const handleImageUpload = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => setFormData((prev) => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      onAddItem(formData);
      setFormData({ name: '', units: '', image: null });
    };

    const handleClose = () => {
      setFormData({ name: '', units: '', image: null });
      onClose();
    };

    if (!isOpen) return null;

    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>Add Raw Material</h2>
            <button
              onClick={handleClose}
              style={styles.closeButton}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
            >
              <X size={20} />
            </button>
          </div>

          <div style={styles.modalBody}>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Product Quantity</label>
                <input
                  type="number"
                  name="units"
                  value={formData.units}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                  style={styles.input}
                  required
                  min="0"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Product Image</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                <div style={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
                  <Upload size={20} style={styles.uploadIcon} />
                  <span style={styles.uploadText}>
                    {formData.image ? 'Change image' : 'Upload image'}
                  </span>
                </div>

                {formData.image && (
                  <div style={styles.imagePreview}>
                    <img src={formData.image} alt="Preview" style={styles.previewImage} />
                  </div>
                )}
              </div>
            </form>
          </div>

          <div style={styles.modalFooter}>
            <button
              onClick={handleClose}
              style={styles.cancelButton}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9fafb')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              style={styles.modalPrimaryButton}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#1d4ed8')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563eb')}
            >
              Add Item
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ✅ Edit Raw Material Modal
  const EditRawMaterialModal = ({ isOpen, onClose, item, onEditItem }) => {
    const [formData, setFormData] = useState({
      name: '',
      units: '',
      image: null,
    });

    useEffect(() => {
      if (item) {
        setFormData({
          name: item.name || '',
          units: item.units ?? '',
          image: item.image || null,
        });
      }
    }, [item]);

    const handleChange = (e) => {
      const { name, value, type } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value,
      }));
    };

    const handleImageUpload = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => setFormData((prev) => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!item?._id) return;
      onEditItem(item._id, formData);
    };

    if (!isOpen || !item) return null;

    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>Edit Raw Material</h2>
            <button
              onClick={onClose}
              style={styles.closeButton}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
            >
              <X size={20} />
            </button>
          </div>

          <div style={styles.modalBody}>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Product Quantity</label>
                <input
                  type="number"
                  name="units"
                  value={formData.units}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                  style={styles.input}
                  required
                  min="0"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Product Image</label>
                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                <div style={styles.uploadArea} onClick={() => editFileInputRef.current?.click()}>
                  <Upload size={20} style={styles.uploadIcon} />
                  <span style={styles.uploadText}>
                    {formData.image ? 'Change image' : 'Upload image'}
                  </span>
                </div>

                {formData.image && (
                  <div style={styles.imagePreview}>
                    <img src={formData.image} alt="Preview" style={styles.previewImage} />
                  </div>
                )}
              </div>
            </form>
          </div>

          <div style={styles.modalFooter}>
            <button
              onClick={onClose}
              style={styles.cancelButton}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9fafb')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              style={styles.modalPrimaryButton}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#1d4ed8')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563eb')}
            >
              Update Item
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ✅ Delete Confirmation Modal
  const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemName }) => {
    if (!isOpen) return null;

    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>Confirm Deletion</h2>
            <button
              onClick={onClose}
              style={styles.closeButton}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
            >
              <X size={20} />
            </button>
          </div>

          <div style={styles.modalBody}>
            <p style={styles.confirmText}>
              Are you sure you want to delete "{itemName}"? This action cannot be undone.
            </p>
          </div>

          <div style={styles.modalFooter}>
            <button
              onClick={onClose}
              style={styles.cancelButton}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9fafb')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={styles.deleteButton}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#b91c1c')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#dc2626')}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ItemCard = ({ item, onEdit, onDelete }) => (
    <div style={styles.card}>
      <div style={styles.cardImageContainer}>
        <div style={styles.unitsBadge}>{item.units} units</div>
        {item.image ? (
          <img src={item.image} alt={item.name} style={styles.cardImage} />
        ) : (
          <div style={styles.placeholderImage}>
            <div style={styles.placeholderIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div style={styles.cardContent}>
        <h3 style={styles.cardTitle}>{item.name}</h3>
        <div style={styles.cardDate}>
          <Calendar size={14} style={styles.calendarIcon} />
          <span>Added {item.addedDate ? new Date(item.addedDate).toLocaleDateString() : '-'}</span>
        </div>

        <div style={styles.cardActions}>
          <button
            style={styles.actionButton}
            onClick={() => onEdit(item)}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
          >
            <Edit size={16} />
            Edit
          </button>
          <button
            style={styles.actionButton}
            onClick={() => onDelete(item)}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  const styles = {
    container: {
      padding: '24px',
      backgroundColor: '#ffffff',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '32px',
      flexWrap: 'wrap',
      gap: '16px',
    },
    headerLeft: {
      flex: '1',
      minWidth: '200px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937',
      margin: '0 0 8px 0',
    },
    subtitle: {
      fontSize: '16px',
      color: '#6b7280',
      margin: '0',
    },

    // ✅ Header button (keep name)
    addButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },

    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '24px',
      marginBottom: '40px',
    },
    noData: {
      textAlign: 'center',
      padding: '40px',
      color: '#6b7280',
      fontSize: '16px',
      gridColumn: '1 / -1',
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    cardImageContainer: {
      position: 'relative',
      height: '200px',
      overflow: 'hidden',
    },
    cardImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    placeholderImage: {
      width: '100%',
      height: '100%',
      backgroundColor: '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderIcon: {
      opacity: '0.5',
    },
    unitsBadge: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      color: 'white',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      backdropFilter: 'blur(8px)',
    },
    cardContent: {
      padding: '20px',
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f2937',
      margin: '0 0 12px 0',
    },
    cardDate: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: '#6b7280',
      fontSize: '14px',
      marginBottom: '20px',
    },
    calendarIcon: {
      color: '#9ca3af',
    },
    cardActions: {
      display: 'flex',
      gap: '12px',
    },
    actionButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      padding: '8px 12px',
      fontSize: '14px',
      color: '#374151',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },

    pagination: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px',
      border: '1px solid rgb(229, 231, 235)',
      backgroundColor: 'rgb(255, 255, 255)',
      boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px',
      padding: '25px',
      borderRadius: '15px',
    },
    paginationInfo: {
      color: '#6b7280',
      fontSize: '14px',
    },
    paginationButtons: {
      display: 'flex',
      gap: '8px',
    },
    paginationButton: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      backgroundColor: 'white',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#374151',
      transition: 'all 0.2s ease',
    },
    paginationButtonActive: {
      padding: '8px 12px',
      border: '1px solid #2563eb',
      backgroundColor: '#2563eb',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      color: 'white',
    },

    modalOverlay: {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '1000',
      padding: '20px',
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '12px',
      width: '100%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflow: 'auto',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '24px 24px 0 24px',
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1f2937',
      margin: '0',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '6px',
      color: '#6b7280',
      transition: 'all 0.2s ease',
    },
    modalBody: {
      padding: '24px',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '8px',
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s ease',
      boxSizing: 'border-box',
    },
    uploadArea: {
      border: '2px dashed #d1d5db',
      borderRadius: '8px',
      padding: '40px 20px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: '#fafafa',
    },
    uploadIcon: {
      color: '#9ca3af',
      marginBottom: '8px',
    },
    uploadText: {
      color: '#6b7280',
      fontSize: '14px',
    },
    imagePreview: {
      marginTop: '16px',
      textAlign: 'center',
    },
    previewImage: {
      maxWidth: '100%',
      maxHeight: '200px',
      borderRadius: '8px',
    },
    modalFooter: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      padding: '0 24px 24px 24px',
    },
    cancelButton: {
      padding: '10px 20px',
      border: '1px solid #d1d5db',
      backgroundColor: 'white',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },

    // ✅ Modal primary button (renamed to avoid duplicate key)
    modalPrimaryButton: {
      padding: '10px 20px',
      border: 'none',
      backgroundColor: '#2563eb',
      color: 'white',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },

    deleteButton: {
      padding: '10px 20px',
      border: 'none',
      backgroundColor: '#dc2626',
      color: 'white',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    confirmText: {
      color: '#374151',
      fontSize: '16px',
      margin: '0',
    },
  };

  // ✅ Responsive styles (no duplicate keys)
  const getResponsiveStyles = () => {
    const isMobile = window.innerWidth <= 640;
    const isTablet = window.innerWidth <= 768;

    return {
      ...styles,
      container: {
        ...styles.container,
        padding: isMobile ? '16px' : '24px',
      },
      grid: {
        ...styles.grid,
        gridTemplateColumns: isMobile
          ? '1fr'
          : isTablet
            ? 'repeat(auto-fill, minmax(280px, 1fr))'
            : 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: isMobile ? '16px' : '24px',
      },
      header: {
        ...styles.header,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'flex-start',
      },
      addButton: {
        ...styles.addButton,
        width: isMobile ? '100%' : 'auto',
        justifyContent: isMobile ? 'center' : 'flex-start',
      },
      pagination: {
        ...styles.pagination,
        flexDirection: isMobile ? 'column' : 'row',
        textAlign: isMobile ? 'center' : 'left',
      },
      cardActions: {
        ...styles.cardActions,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '8px' : '12px',
      },
      actionButton: {
        ...styles.actionButton,
        width: isMobile ? '100%' : 'auto',
        justifyContent: isMobile ? 'center' : 'flex-start',
      },
    };
  };

  const responsiveStyles = getResponsiveStyles();

  return (
    <div style={responsiveStyles.container}>
      <div style={responsiveStyles.header}>
        <div style={responsiveStyles.headerLeft}>
          <h1 style={responsiveStyles.title}>Raw Materials</h1>
          <p style={responsiveStyles.subtitle}>
            Manage your raw materials inventory ({rawMaterials.length} items)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={responsiveStyles.addButton}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#1d4ed8')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563eb')}
        >
          <Plus size={20} />
          Add Raw Material
        </button>
      </div>

      <div style={responsiveStyles.grid}>
        {isLoading ? (
          <div style={styles.noData}>Loading...</div>
        ) : paginatedItems.length > 0 ? (
          paginatedItems.map((item) => (
            <ItemCard
              key={item._id}
              item={item}
              onEdit={(editedItem) => {
                setSelectedItem(editedItem);
                setIsEditModalOpen(true);
              }}
              onDelete={(deletedItem) => {
                setItemToDelete(deletedItem);
                setIsDeleteConfirmOpen(true);
              }}
            />
          ))
        ) : (
          <div style={styles.noData}>No data available</div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={responsiveStyles.pagination}>
          <div style={responsiveStyles.paginationInfo}>
            Showing {currentPage} to {totalPages} of {rawMaterials.length} results
          </div>

          <div style={responsiveStyles.paginationButtons}>
            <button
              style={responsiveStyles.paginationButton}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              onMouseEnter={(e) =>
                !e.target.disabled && (e.target.style.backgroundColor = '#f9fafb')
              }
              onMouseLeave={(e) =>
                !e.target.disabled && (e.target.style.backgroundColor = 'white')
              }
            >
              Previous
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                style={
                  currentPage === i + 1
                    ? responsiveStyles.paginationButtonActive
                    : responsiveStyles.paginationButton
                }
                onClick={() => setCurrentPage(i + 1)}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9fafb')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
              >
                {i + 1}
              </button>
            ))}

            <button
              style={responsiveStyles.paginationButton}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              onMouseEnter={(e) =>
                !e.target.disabled && (e.target.style.backgroundColor = '#f9fafb')
              }
              onMouseLeave={(e) =>
                !e.target.disabled && (e.target.style.backgroundColor = 'white')}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <AddRawMaterialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddItem={handleAddItem}
      />
      <EditRawMaterialModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={selectedItem}
        onEditItem={handleEditItem}
      />
      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => handleDeleteItem(itemToDelete?._id)}
        itemName={itemToDelete?.name}
      />
    </div>
  );
};

export default RawMaterialsInventory;
