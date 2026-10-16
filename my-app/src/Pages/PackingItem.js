// // src/Pages/PackingItem.js (or PackagingInventory.js)
// import React, { useState, useEffect, useRef, useMemo } from 'react';
// import { Calendar, Edit, Trash2, Upload, Plus, X } from 'lucide-react';
// import { useUser } from './UserContext';

// const API_BASE = 'https://coloroninventoy.onrender.com/api';

// function useWindowWidth() {
//   const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
//   useEffect(() => {
//     const onResize = () => setW(window.innerWidth);
//     window.addEventListener('resize', onResize);
//     return () => window.removeEventListener('resize', onResize);
//   }, []);
//   return w;
// }

// const PackagingInventory = () => {
//   const { user } = useUser();
//   const width = useWindowWidth();

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

//   const [currentPage, setCurrentPage] = useState(1);
//   const [packagingItems, setPackagingItems] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);

//   const [selectedItem, setSelectedItem] = useState(null);
//   const [itemToDelete, setItemToDelete] = useState(null);

//   const fileInputRef = useRef(null);
//   const itemsPerPage = 6;

//   // Fetch items
//   useEffect(() => {
//     const fetchItems = async () => {
//       try {
//         setIsLoading(true);
//         const response = await fetch(`${API_BASE}/packaging`);
//         if (!response.ok) throw new Error('Failed to fetch items');
//         const data = await response.json();
//         setPackagingItems(Array.isArray(data) ? data : []);
//       } catch (err) {
//         console.error('Error fetching items:', err);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchItems();
//   }, []);

//   const handleAddItem = async (formData) => {
//     try {
//       const response = await fetch(`${API_BASE}/packaging`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           ...formData,
//           storeName: user?.role || 'UNKNOWN',
//           addedBy: user?.id || 'unknown-user',
//         }),
//       });
//       if (!response.ok) throw new Error('Failed to add item');
//       const newItem = await response.json();
//       setPackagingItems((prev) => [...prev, newItem]);
//       setIsModalOpen(false);
//     } catch (err) {
//       console.error('Error adding item:', err);
//     }
//   };

//   const handleEditItem = async (id, updatedItem) => {
//     try {
//       const response = await fetch(`${API_BASE}/packaging/${id}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           ...updatedItem,
//           updatedBy: user?.id || 'unknown-user',
//         }),
//       });
//       if (!response.ok) throw new Error('Failed to update item');
//       const data = await response.json();
//       setPackagingItems((prev) => prev.map((it) => (it._id === id ? data : it)));
//       setIsEditModalOpen(false);
//       setSelectedItem(null);
//     } catch (err) {
//       console.error('Error updating item:', err);
//     }
//   };

//   const handleDeleteItem = async (id) => {
//     try {
//       const response = await fetch(`${API_BASE}/packaging/${id}`, { method: 'DELETE' });
//       if (!response.ok) throw new Error('Failed to delete item');
//       setPackagingItems((prev) => prev.filter((it) => it._id !== id));
//       setIsDeleteConfirmOpen(false);
//       setItemToDelete(null);
//     } catch (err) {
//       console.error('Error deleting item:', err);
//     }
//   };

//   // Filter by store role
//   const filteredItems = useMemo(() => {
//     if (!user?.role) return packagingItems;
//     return packagingItems.filter(
//       (item) => !item.storeName || item.storeName.toLowerCase() === user.role.toLowerCase()
//     );
//   }, [packagingItems, user?.role]);

//   const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
//   const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   // Close page overflow if list shrinks
//   useEffect(() => {
//     if (currentPage > totalPages) setCurrentPage(totalPages);
//   }, [currentPage, totalPages]);

//   // ---------- Styles (NO duplicate keys now) ----------
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

//     // ✅ ONLY ONE addButton definition
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
//       borderRadius: '12px',
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
//     unitsBadge: {
//       position: 'absolute',
//       top: '12px',
//       right: '12px',
//       backgroundColor: 'rgba(0, 0, 0, 0.7)',
//       color: 'white',
//       padding: '6px 12px',
//       borderRadius: '20px',
//       fontSize: '12px',
//       fontWeight: '500',
//     },
//     cardContent: { padding: '20px' },
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
//       marginBottom: '12px',
//     },
//     cardStore: { color: '#6b7280', fontSize: '14px', marginBottom: '20px' },
//     cardActions: { display: 'flex', gap: '12px' },
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
//     paginationInfo: { color: '#6b7280', fontSize: '14px' },
//     paginationButtons: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
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
//       top: 0,
//       left: 0,
//       right: 0,
//       bottom: 0,
//       backgroundColor: 'rgba(0, 0, 0, 0.5)',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       zIndex: 1000,
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
//     modalTitle: { fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 },
//     closeButton: {
//       background: 'none',
//       border: 'none',
//       cursor: 'pointer',
//       padding: '8px',
//       borderRadius: '6px',
//       color: '#6b7280',
//       transition: 'all 0.2s ease',
//     },
//     modalBody: { padding: '24px' },
//     formGroup: { marginBottom: '20px' },
//     label: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' },
//     input: {
//       width: '100%',
//       padding: '12px',
//       border: '1px solid #d1d5db',
//       borderRadius: '8px',
//       fontSize: '14px',
//       outline: 'none',
//       boxSizing: 'border-box',
//     },
//     uploadArea: {
//       border: '2px dashed #d1d5db',
//       borderRadius: '8px',
//       padding: '40px 20px',
//       textAlign: 'center',
//       cursor: 'pointer',
//       backgroundColor: '#fafafa',
//     },
//     uploadText: { color: '#6b7280', fontSize: '14px' },
//     imagePreview: { marginTop: '16px', textAlign: 'center' },
//     previewImage: { maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' },
//     modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '0 24px 24px 24px' },
//     cancelButton: {
//       padding: '10px 20px',
//       border: '1px solid #d1d5db',
//       backgroundColor: 'white',
//       borderRadius: '8px',
//       fontSize: '14px',
//       fontWeight: '500',
//       color: '#374151',
//       cursor: 'pointer',
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
//     },
//     confirmText: { color: '#374151', fontSize: '16px', margin: 0 },
//   };

//   // Responsive computed styles
//   const responsive = useMemo(() => {
//     const isSm = width <= 640;
//     const isMd = width <= 768;

//     return {
//       ...styles,
//       container: { ...styles.container, padding: isSm ? '16px' : '24px' },
//       grid: {
//         ...styles.grid,
//         gridTemplateColumns: isSm ? '1fr' : isMd ? 'repeat(auto-fill, minmax(280px, 1fr))' : 'repeat(auto-fill, minmax(320px, 1fr))',
//         gap: isSm ? '16px' : '24px',
//       },
//       header: {
//         ...styles.header,
//         flexDirection: isSm ? 'column' : 'row',
//         alignItems: isSm ? 'stretch' : 'flex-start',
//       },
//       pagination: {
//         ...styles.pagination,
//         flexDirection: isSm ? 'column' : 'row',
//         textAlign: isSm ? 'center' : 'left',
//       },
//     };
//   }, [width]);

//   // ---------- Modals ----------
//   const AddItemModal = ({ isOpen, onClose, onAddItem }) => {
//     const [formData, setFormData] = useState({ name: '', units: '', image: null });

//     const handleChange = (e) => {
//       const { name, value } = e.target;
//       setFormData((prev) => ({ ...prev, [name]: value }));
//     };

//     const handleImageUpload = (e) => {
//       const file = e.target.files?.[0];
//       if (!file) return;
//       const reader = new FileReader();
//       reader.onloadend = () => setFormData((prev) => ({ ...prev, image: reader.result }));
//       reader.readAsDataURL(file);
//     };

//     const handleSubmit = (e) => {
//       e?.preventDefault?.();
//       onAddItem(formData);
//       setFormData({ name: '', units: '', image: null });
//     };

//     if (!isOpen) return null;
//     return (
//       <div style={responsive.modalOverlay}>
//         <div style={responsive.modalContent}>
//           <div style={responsive.modalHeader}>
//             <h2 style={responsive.modalTitle}>Add Packaging Item</h2>
//             <button onClick={onClose} style={responsive.closeButton}>
//               <X size={20} />
//             </button>
//           </div>

//           <div style={responsive.modalBody}>
//             <form onSubmit={handleSubmit}>
//               <div style={responsive.formGroup}>
//                 <label style={responsive.label}>Packing Item</label>
//                 <input
//                   type="text"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleChange}
//                   placeholder="Enter packing item name"
//                   style={responsive.input}
//                   required
//                 />
//               </div>

//               <div style={responsive.formGroup}>
//                 <label style={responsive.label}>Packing Image</label>
//                 <input
//                   type="file"
//                   ref={fileInputRef}
//                   onChange={handleImageUpload}
//                   style={{ display: 'none' }}
//                   accept="image/*"
//                 />
//                 <div style={responsive.uploadArea} onClick={() => fileInputRef.current?.click?.()}>
//                   <Upload size={20} />
//                   <div style={{ marginTop: 8 }}>
//                     <span style={responsive.uploadText}>{formData.image ? 'Change image' : 'Upload image'}</span>
//                   </div>
//                 </div>

//                 {formData.image && (
//                   <div style={responsive.imagePreview}>
//                     <img src={formData.image} alt="Preview" style={responsive.previewImage} />
//                   </div>
//                 )}
//               </div>

//               <div style={responsive.formGroup}>
//                 <label style={responsive.label}>Item Quantity</label>
//                 <input
//                   type="number"
//                   name="units"
//                   value={formData.units}
//                   onChange={handleChange}
//                   placeholder="Enter quantity"
//                   style={responsive.input}
//                   required
//                 />
//               </div>
//             </form>
//           </div>

//           <div style={responsive.modalFooter}>
//             <button onClick={onClose} style={responsive.cancelButton}>Cancel</button>
//             <button onClick={handleSubmit} style={responsive.addButton}>Add Item</button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const EditItemModal = ({ isOpen, onClose, item, onEditItem }) => {
//     const [formData, setFormData] = useState({ name: '', units: '', image: null });

//     useEffect(() => {
//       if (!item) return;
//       setFormData({ name: item.name || '', units: item.units || '', image: item.image || null });
//     }, [item]);

//     const handleChange = (e) => {
//       const { name, value } = e.target;
//       setFormData((prev) => ({ ...prev, [name]: value }));
//     };

//     const handleImageUpload = (e) => {
//       const file = e.target.files?.[0];
//       if (!file) return;
//       const reader = new FileReader();
//       reader.onloadend = () => setFormData((prev) => ({ ...prev, image: reader.result }));
//       reader.readAsDataURL(file);
//     };

//     const handleSubmit = (e) => {
//       e?.preventDefault?.();
//       if (!item?._id) return;
//       onEditItem(item._id, formData);
//     };

//     if (!isOpen || !item) return null;
//     return (
//       <div style={responsive.modalOverlay}>
//         <div style={responsive.modalContent}>
//           <div style={responsive.modalHeader}>
//             <h2 style={responsive.modalTitle}>Edit Packaging Item</h2>
//             <button onClick={onClose} style={responsive.closeButton}>
//               <X size={20} />
//             </button>
//           </div>

//           <div style={responsive.modalBody}>
//             <form onSubmit={handleSubmit}>
//               <div style={responsive.formGroup}>
//                 <label style={responsive.label}>Packing Item</label>
//                 <input
//                   type="text"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleChange}
//                   placeholder="Enter packing item name"
//                   style={responsive.input}
//                   required
//                 />
//               </div>

//               <div style={responsive.formGroup}>
//                 <label style={responsive.label}>Packing Image</label>
//                 <input
//                   type="file"
//                   ref={fileInputRef}
//                   onChange={handleImageUpload}
//                   style={{ display: 'none' }}
//                   accept="image/*"
//                 />
//                 <div style={responsive.uploadArea} onClick={() => fileInputRef.current?.click?.()}>
//                   <Upload size={20} />
//                   <div style={{ marginTop: 8 }}>
//                     <span style={responsive.uploadText}>{formData.image ? 'Change image' : 'Upload image'}</span>
//                   </div>
//                 </div>

//                 {formData.image && (
//                   <div style={responsive.imagePreview}>
//                     <img src={formData.image} alt="Preview" style={responsive.previewImage} />
//                   </div>
//                 )}
//               </div>

//               <div style={responsive.formGroup}>
//                 <label style={responsive.label}>Item Quantity</label>
//                 <input
//                   type="number"
//                   name="units"
//                   value={formData.units}
//                   onChange={handleChange}
//                   placeholder="Enter quantity"
//                   style={responsive.input}
//                   required
//                 />
//               </div>
//             </form>
//           </div>

//           <div style={responsive.modalFooter}>
//             <button onClick={onClose} style={responsive.cancelButton}>Cancel</button>
//             <button onClick={handleSubmit} style={responsive.addButton}>Update Item</button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemName }) => {
//     if (!isOpen) return null;
//     return (
//       <div style={responsive.modalOverlay}>
//         <div style={responsive.modalContent}>
//           <div style={responsive.modalHeader}>
//             <h2 style={responsive.modalTitle}>Confirm Deletion</h2>
//             <button onClick={onClose} style={responsive.closeButton}>
//               <X size={20} />
//             </button>
//           </div>
//           <div style={responsive.modalBody}>
//             <p style={responsive.confirmText}>
//               Are you sure you want to delete "{itemName}"? This action cannot be undone.
//             </p>
//           </div>
//           <div style={responsive.modalFooter}>
//             <button onClick={onClose} style={responsive.cancelButton}>Cancel</button>
//             <button onClick={onConfirm} style={responsive.deleteButton}>Delete</button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const ItemCard = ({ item }) => (
//     <div style={responsive.card}>
//       <div style={responsive.cardImageContainer}>
//         <div style={responsive.unitsBadge}>{item.units} units</div>
//         {item.image ? (
//           <img src={item.image} alt={item.name} style={responsive.cardImage} />
//         ) : (
//           <div style={responsive.placeholderImage}>
//             <div>
//               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
//                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
//                 <circle cx="8.5" cy="8.5" r="1.5" />
//                 <polyline points="21,15 16,10 5,21" />
//               </svg>
//             </div>
//           </div>
//         )}
//       </div>

//       <div style={responsive.cardContent}>
//         <h3 style={responsive.cardTitle}>{item.name}</h3>

//         <div style={responsive.cardDate}>
//           <Calendar size={14} />
//           <span>Added {new Date(item.addedDate || item.createdAt || Date.now()).toLocaleDateString()}</span>
//         </div>

//         {user?.role && <div style={responsive.cardStore}><span>{item.storeName || user.role}</span></div>}

//         <div style={responsive.cardActions}>
//           <button
//             style={responsive.actionButton}
//             onClick={() => {
//               setSelectedItem(item);
//               setIsEditModalOpen(true);
//             }}
//           >
//             <Edit size={16} /> Edit
//           </button>

//           <button
//             style={responsive.actionButton}
//             onClick={() => {
//               setItemToDelete(item);
//               setIsDeleteConfirmOpen(true);
//             }}
//           >
//             <Trash2 size={16} /> Delete
//           </button>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div style={responsive.container}>
//       <div style={responsive.header}>
//         <div style={responsive.headerLeft}>
//           <h1 style={responsive.title}>Packaging Items {user?.role ? `for ${user.role}` : ''}</h1>
//           <p style={responsive.subtitle}>Manage your packaging items inventory ({filteredItems.length} items)</p>
//         </div>

//         <button
//           onClick={() => setIsModalOpen(true)}
//           style={responsive.addButton}
//           onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
//           onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
//         >
//           <Plus size={20} />
//           Add Packaging Item
//         </button>
//       </div>

//       <div style={responsive.grid}>
//         {isLoading ? (
//           <div style={responsive.noData}>Loading...</div>
//         ) : paginatedItems.length > 0 ? (
//           paginatedItems.map((item) => <ItemCard key={item._id} item={item} />)
//         ) : (
//           <div style={responsive.noData}>No data available</div>
//         )}
//       </div>

//       {totalPages > 1 && (
//         <div style={responsive.pagination}>
//           <div style={responsive.paginationInfo}>
//             Page {currentPage} of {totalPages} — Total {filteredItems.length} items
//           </div>

//           <div style={responsive.paginationButtons}>
//             <button
//               style={responsive.paginationButton}
//               onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
//               disabled={currentPage === 1}
//             >
//               Previous
//             </button>

//             {Array.from({ length: totalPages }).map((_, i) => {
//               const p = i + 1;
//               return (
//                 <button
//                   key={p}
//                   style={currentPage === p ? responsive.paginationButtonActive : responsive.paginationButton}
//                   onClick={() => setCurrentPage(p)}
//                 >
//                   {p}
//                 </button>
//               );
//             })}

//             <button
//               style={responsive.paginationButton}
//               onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
//               disabled={currentPage === totalPages}
//             >
//               Next
//             </button>
//           </div>
//         </div>
//       )}

//       <AddItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddItem={handleAddItem} />

//       <EditItemModal
//         isOpen={isEditModalOpen}
//         onClose={() => {
//           setIsEditModalOpen(false);
//           setSelectedItem(null);
//         }}
//         item={selectedItem}
//         onEditItem={handleEditItem}
//       />

//       <DeleteConfirmModal
//         isOpen={isDeleteConfirmOpen}
//         onClose={() => {
//           setIsDeleteConfirmOpen(false);
//           setItemToDelete(null);
//         }}
//         onConfirm={() => handleDeleteItem(itemToDelete?._id)}
//         itemName={itemToDelete?.name}
//       />
//     </div>
//   );
// };

// export default PackagingInventory;










// src/Pages/PackingItem.js (or PackagingInventory.js)
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, Edit, Trash2, Upload, Plus, X } from 'lucide-react';
import { useUser } from './UserContext';

const API_BASE = 'https://coloroninventoy.onrender.com/api';

function useWindowWidth() {
  const [w, setW] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return w;
}

// ✅ Move styles OUTSIDE component so it's stable (fixes useMemo dependency warning)
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
    borderRadius: '12px',
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
  unitsBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  cardContent: { padding: '20px' },
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
    marginBottom: '12px',
  },
  cardStore: { color: '#6b7280', fontSize: '14px', marginBottom: '20px' },
  cardActions: { display: 'flex', gap: '12px' },
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
  paginationInfo: { color: '#6b7280', fontSize: '14px' },
  paginationButtons: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
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
  modalTitle: { fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '6px',
    color: '#6b7280',
    transition: 'all 0.2s ease',
  },
  modalBody: { padding: '24px' },
  formGroup: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  uploadArea: {
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    padding: '40px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: '#fafafa',
  },
  uploadText: { color: '#6b7280', fontSize: '14px' },
  imagePreview: { marginTop: '16px', textAlign: 'center' },
  previewImage: { maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '0 24px 24px 24px' },
  cancelButton: {
    padding: '10px 20px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    cursor: 'pointer',
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
  },
  confirmText: { color: '#374151', fontSize: '16px', margin: 0 },
};

const PackagingInventory = () => {
  const { user } = useUser();
  const width = useWindowWidth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [packagingItems, setPackagingItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fileInputRef = useRef(null);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/packaging`);
        if (!response.ok) throw new Error('Failed to fetch items');
        const data = await response.json();
        setPackagingItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching items:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleAddItem = async (formData) => {
    try {
      const response = await fetch(`${API_BASE}/packaging`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          storeName: user?.role || 'UNKNOWN',
          addedBy: user?.id || 'unknown-user',
        }),
      });
      if (!response.ok) throw new Error('Failed to add item');
      const newItem = await response.json();
      setPackagingItems((prev) => [...prev, newItem]);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  const handleEditItem = async (id, updatedItem) => {
    try {
      const response = await fetch(`${API_BASE}/packaging/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedItem,
          updatedBy: user?.id || 'unknown-user',
        }),
      });
      if (!response.ok) throw new Error('Failed to update item');
      const data = await response.json();
      setPackagingItems((prev) => prev.map((it) => (it._id === id ? data : it)));
      setIsEditModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/packaging/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete item');
      setPackagingItems((prev) => prev.filter((it) => it._id !== id));
      setIsDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const filteredItems = useMemo(() => {
    if (!user?.role) return packagingItems;
    return packagingItems.filter(
      (item) => !item.storeName || item.storeName.toLowerCase() === user.role.toLowerCase()
    );
  }, [packagingItems, user?.role]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // ✅ now no lint warning because styles is stable global const
  const responsive = useMemo(() => {
    const isSm = width <= 640;
    const isMd = width <= 768;

    return {
      ...styles,
      container: { ...styles.container, padding: isSm ? '16px' : '24px' },
      grid: {
        ...styles.grid,
        gridTemplateColumns: isSm
          ? '1fr'
          : isMd
          ? 'repeat(auto-fill, minmax(280px, 1fr))'
          : 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: isSm ? '16px' : '24px',
      },
      header: {
        ...styles.header,
        flexDirection: isSm ? 'column' : 'row',
        alignItems: isSm ? 'stretch' : 'flex-start',
      },
      pagination: {
        ...styles.pagination,
        flexDirection: isSm ? 'column' : 'row',
        textAlign: isSm ? 'center' : 'left',
      },
    };
  }, [width]);

  // ---------- Modals ----------
  const AddItemModal = ({ isOpen, onClose, onAddItem }) => {
    const [formData, setFormData] = useState({ name: '', units: '', image: null });

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => setFormData((prev) => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    };

    const handleSubmit = (e) => {
      e?.preventDefault?.();
      onAddItem(formData);
      setFormData({ name: '', units: '', image: null });
    };

    if (!isOpen) return null;

    return (
      <div style={responsive.modalOverlay}>
        <div style={responsive.modalContent}>
          <div style={responsive.modalHeader}>
            <h2 style={responsive.modalTitle}>Add Packaging Item</h2>
            <button onClick={onClose} style={responsive.closeButton}>
              <X size={20} />
            </button>
          </div>

          <div style={responsive.modalBody}>
            <form onSubmit={handleSubmit}>
              <div style={responsive.formGroup}>
                <label style={responsive.label}>Packing Item</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter packing item name"
                  style={responsive.input}
                  required
                />
              </div>

              <div style={responsive.formGroup}>
                <label style={responsive.label}>Packing Image</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                <div
                  style={responsive.uploadArea}
                  onClick={() => fileInputRef.current?.click?.()}
                >
                  <Upload size={20} />
                  <div style={{ marginTop: 8 }}>
                    <span style={responsive.uploadText}>
                      {formData.image ? 'Change image' : 'Upload image'}
                    </span>
                  </div>
                </div>

                {formData.image && (
                  <div style={responsive.imagePreview}>
                    <img src={formData.image} alt="Preview" style={responsive.previewImage} />
                  </div>
                )}
              </div>

              <div style={responsive.formGroup}>
                <label style={responsive.label}>Item Quantity</label>
                <input
                  type="number"
                  name="units"
                  value={formData.units}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                  style={responsive.input}
                  required
                />
              </div>
            </form>
          </div>

          <div style={responsive.modalFooter}>
            <button onClick={onClose} style={responsive.cancelButton}>
              Cancel
            </button>
            <button onClick={handleSubmit} style={responsive.addButton}>
              Add Item
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EditItemModal = ({ isOpen, onClose, item, onEditItem }) => {
    const [formData, setFormData] = useState({ name: '', units: '', image: null });

    useEffect(() => {
      if (!item) return;
      setFormData({ name: item.name || '', units: item.units || '', image: item.image || null });
    }, [item]);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => setFormData((prev) => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    };

    const handleSubmit = (e) => {
      e?.preventDefault?.();
      if (!item?._id) return;
      onEditItem(item._id, formData);
    };

    if (!isOpen || !item) return null;

    return (
      <div style={responsive.modalOverlay}>
        <div style={responsive.modalContent}>
          <div style={responsive.modalHeader}>
            <h2 style={responsive.modalTitle}>Edit Packaging Item</h2>
            <button onClick={onClose} style={responsive.closeButton}>
              <X size={20} />
            </button>
          </div>

          <div style={responsive.modalBody}>
            <form onSubmit={handleSubmit}>
              <div style={responsive.formGroup}>
                <label style={responsive.label}>Packing Item</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter packing item name"
                  style={responsive.input}
                  required
                />
              </div>

              <div style={responsive.formGroup}>
                <label style={responsive.label}>Packing Image</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                <div
                  style={responsive.uploadArea}
                  onClick={() => fileInputRef.current?.click?.()}
                >
                  <Upload size={20} />
                  <div style={{ marginTop: 8 }}>
                    <span style={responsive.uploadText}>
                      {formData.image ? 'Change image' : 'Upload image'}
                    </span>
                  </div>
                </div>

                {formData.image && (
                  <div style={responsive.imagePreview}>
                    <img src={formData.image} alt="Preview" style={responsive.previewImage} />
                  </div>
                )}
              </div>

              <div style={responsive.formGroup}>
                <label style={responsive.label}>Item Quantity</label>
                <input
                  type="number"
                  name="units"
                  value={formData.units}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                  style={responsive.input}
                  required
                />
              </div>
            </form>
          </div>

          <div style={responsive.modalFooter}>
            <button onClick={onClose} style={responsive.cancelButton}>
              Cancel
            </button>
            <button onClick={handleSubmit} style={responsive.addButton}>
              Update Item
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemName }) => {
    if (!isOpen) return null;
    return (
      <div style={responsive.modalOverlay}>
        <div style={responsive.modalContent}>
          <div style={responsive.modalHeader}>
            <h2 style={responsive.modalTitle}>Confirm Deletion</h2>
            <button onClick={onClose} style={responsive.closeButton}>
              <X size={20} />
            </button>
          </div>
          <div style={responsive.modalBody}>
            <p style={responsive.confirmText}>
              Are you sure you want to delete "{itemName}"? This action cannot be undone.
            </p>
          </div>
          <div style={responsive.modalFooter}>
            <button onClick={onClose} style={responsive.cancelButton}>
              Cancel
            </button>
            <button onClick={onConfirm} style={responsive.deleteButton}>
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ItemCard = ({ item }) => (
    <div style={responsive.card}>
      <div style={responsive.cardImageContainer}>
        <div style={responsive.unitsBadge}>{item.units} units</div>
        {item.image ? (
          <img src={item.image} alt={item.name} style={responsive.cardImage} />
        ) : (
          <div style={responsive.placeholderImage}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21,15 16,10 5,21" />
            </svg>
          </div>
        )}
      </div>

      <div style={responsive.cardContent}>
        <h3 style={responsive.cardTitle}>{item.name}</h3>

        <div style={responsive.cardDate}>
          <Calendar size={14} />
          <span>
            Added {new Date(item.addedDate || item.createdAt || Date.now()).toLocaleDateString()}
          </span>
        </div>

        {user?.role && <div style={responsive.cardStore}>{item.storeName || user.role}</div>}

        <div style={responsive.cardActions}>
          <button
            style={responsive.actionButton}
            onClick={() => {
              setSelectedItem(item);
              setIsEditModalOpen(true);
            }}
          >
            <Edit size={16} /> Edit
          </button>

          <button
            style={responsive.actionButton}
            onClick={() => {
              setItemToDelete(item);
              setIsDeleteConfirmOpen(true);
            }}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </div>
  );

  // Filter by role
  const filteredItemsMemo = filteredItems;

  const totalPagesMemo = totalPages;

  return (
    <div style={responsive.container}>
      <div style={responsive.header}>
        <div style={responsive.headerLeft}>
          <h1 style={responsive.title}>Packaging Items {user?.role ? `for ${user.role}` : ''}</h1>
          <p style={responsive.subtitle}>
            Manage your packaging items inventory ({filteredItemsMemo.length} items)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={responsive.addButton}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
        >
          <Plus size={20} />
          Add Packaging Item
        </button>
      </div>

      <div style={responsive.grid}>
        {isLoading ? (
          <div style={responsive.noData}>Loading...</div>
        ) : paginatedItems.length > 0 ? (
          paginatedItems.map((item) => <ItemCard key={item._id} item={item} />)
        ) : (
          <div style={responsive.noData}>No data available</div>
        )}
      </div>

      {totalPagesMemo > 1 && (
        <div style={responsive.pagination}>
          <div style={responsive.paginationInfo}>
            Page {currentPage} of {totalPagesMemo} — Total {filteredItemsMemo.length} items
          </div>

          <div style={responsive.paginationButtons}>
            <button
              style={responsive.paginationButton}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            {Array.from({ length: totalPagesMemo }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  style={currentPage === p ? responsive.paginationButtonActive : responsive.paginationButton}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              );
            })}

            <button
              style={responsive.paginationButton}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPagesMemo))}
              disabled={currentPage === totalPagesMemo}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddItem={handleAddItem}
      />

      <EditItemModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onEditItem={handleEditItem}
      />

      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={() => handleDeleteItem(itemToDelete?._id)}
        itemName={itemToDelete?.name}
      />
    </div>
  );
};

export default PackagingInventory;
