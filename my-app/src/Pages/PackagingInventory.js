
// <<<<<<< HEAD
// =======
// // import { useState, useEffect, useRef } from 'react';
// // import { Calendar, Edit, Trash2, Upload, Plus, X } from 'lucide-react';
// // import { useUser } from './UserContext';

// // const PackagingInventory = () => {
// //   const { user } = useUser();
// //   const [isModalOpen, setIsModalOpen] = useState(false);
// //   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
// //   const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
// //   const [currentPage, setCurrentPage] = useState(1);
// //   const [packagingItems, setPackagingItems] = useState([]);
// //   const [isLoading, setIsLoading] = useState(true);
// //   const [selectedItem, setSelectedItem] = useState(null);
// //   const [itemToDelete, setItemToDelete] = useState(null);
// //   const fileInputRef = useRef(null);
// //   const itemsPerPage = 6;

// //   // Fetch items from backend
// //   useEffect(() => {
// //     const fetchItems = async () => {
// //       try {
// //         setIsLoading(true);
// //         const response = await fetch('https://coloroninventoy.onrender.com/api/items');
// //         if (!response.ok) throw new Error('Failed to fetch items');
// //         const data = await response.json();
// //         setPackagingItems(data);
// //       } catch (err) {
// //         console.error('Error fetching items:', err);
// //       } finally {
// //         setIsLoading(false);
// //       }
// //     };
// //     fetchItems();
// //   }, []);

// //   const handleAddItem = async (formData) => {
// //     try {
// //       const response = await fetch('https://coloroninventoy.onrender.com/api/packaging', {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type': 'application/json',
// //         },
// //         body: JSON.stringify({
// //           ...formData,
// //           storeName: user?.role || "UNKNOWN",
// //           addedBy: user?.id || "unknown-user"
// //         }),
// //       });
// //       if (!response.ok) throw new Error('Failed to add item');
// //       const newItem = await response.json();
// //       setPackagingItems([...packagingItems, newItem]);
// //       setIsModalOpen(false);
// //     } catch (err) {
// //       console.error('Error adding item:', err);
// //     }
// //   };

// //   const handleEditItem = async (id, updatedItem) => {
// //     try {
// //       const response = await fetch(`https://coloroninventoy.onrender.com/api/packaging/${id}`, {
// //         method: 'PUT',
// //         headers: {
// //           'Content-Type': 'application/json',
// //         },
// //         body: JSON.stringify({
// //           ...updatedItem,
// //           updatedBy: user?.id || "unknown-user"
// //         }),
// //       });
// //       if (!response.ok) throw new Error('Failed to update item');
// //       const data = await response.json();
// //       setPackagingItems(packagingItems.map((item) => (item._id === id ? data : item)));
// //       setIsEditModalOpen(false);
// //     } catch (err) {
// //       console.error('Error updating item:', err);
// //     }
// //   };

// //   const handleDeleteItem = async (id) => {
// //     try {
// //       const response = await fetch(`https://coloroninventoy.onrender.com/api/packaging/${id}`, {
// //         method: 'DELETE',
// //       });
// //       if (!response.ok) throw new Error('Failed to delete item');
// //       setPackagingItems(packagingItems.filter((item) => item._id !== id));
// //       setIsDeleteConfirmOpen(false);
// //     } catch (err) {
// //       console.error('Error deleting item:', err);
// //     }
// //   };

// //   // Filter items based on user role if needed
// //   const filteredItems = user?.role
// //     ? packagingItems.filter(item => !item.storeName || item.storeName.toLowerCase() === user.role.toLowerCase())
// //     : packagingItems;

// //   const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
// //   const paginatedItems = filteredItems.slice(
// //     (currentPage - 1) * itemsPerPage,
// //     currentPage * itemsPerPage
// //   );

// //   // Add Item Modal
// //   const AddItemModal = ({ isOpen, onClose, onAddItem }) => {
// //     const [formData, setFormData] = useState({
// //       name: '',
// //       units: '',
// //       image: null,
// //     });

// //     const handleChange = (e) => {
// //       const { name, value } = e.target;
// //       setFormData((prev) => ({ ...prev, [name]: value }));
// //     };

// //     const handleImageUpload = (e) => {
// //       const file = e.target.files[0];
// //       if (file) {
// //         const reader = new FileReader();
// //         reader.onloadend = () => {
// //           setFormData((prev) => ({ ...prev, image: reader.result }));
// //         };
// //         reader.readAsDataURL(file);
// //       }
// //     };

// //     const handleSubmit = (e) => {
// //       e.preventDefault();
// //       onAddItem(formData);
// //       setFormData({ name: '', units: '', image: null });
// //     };

// //     if (!isOpen) return null;

// //     return (
// //       <div style={styles.modalOverlay}>
// //         <div style={styles.modalContent}>
// //           <div style={styles.modalHeader}>
// //             <h2 style={styles.modalTitle}>Add Packaging Item</h2>
// //             <button
// //               onClick={onClose}
// //               style={styles.closeButton}
// //               onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
// //               onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
// //             >
// //               <X size={20} />
// //             </button>
// //           </div>
// //           <div style={styles.modalBody}>
// //             <form onSubmit={handleSubmit}>
// //               <div style={styles.formGroup}>
// //                 <label style={styles.label}>Packing Item</label>
// //                 <input
// //                   type="text"
// //                   name="name"
// //                   value={formData.name}
// //                   onChange={handleChange}
// //                   placeholder="Enter packing item name"
// //                   style={styles.input}
// //                   required
// //                 />
// //               </div>
// //               <div style={styles.formGroup}>
// //                 <label style={styles.label}>Packing Image</label>
// //                 <input
// //                   type="file"
// //                   ref={fileInputRef}
// //                   onChange={handleImageUpload}
// //                   style={{ display: 'none' }}
// //                   accept="image/*"
// //                 />
// //                 <div
// //                   style={styles.uploadArea}
// //                   onClick={() => fileInputRef.current.click()}
// //                 >
// //                   <Upload size={20} style={styles.uploadIcon} />
// //                   <span style={styles.uploadText}>
// //                     {formData.image ? 'Change image' : 'Upload image'}
// //                   </span>
// //                 </div>
// //                 {formData.image && (
// //                   <div style={styles.imagePreview}>
// //                     <img
// //                       src={formData.image}
// //                       alt="Preview"
// //                       style={styles.previewImage}
// //                     />
// //                   </div>
// //                 )}
// //               </div>
// //               <div style={styles.formGroup}>
// //                 <label style={styles.label}>Item Quantity</label>
// //                 <input
// //                   type="number"
// //                   name="units"
// //                   value={formData.units}
// //                   onChange={handleChange}
// //                   placeholder="Enter quantity"
// //                   style={styles.input}
// //                   required
// //                 />
// //               </div>
// //             </form>
// //           </div>
// //           <div style={styles.modalFooter}>
// //             <button
// //               onClick={onClose}
// //               style={styles.cancelButton}
// //               onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9fafb')}
// //               onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
// //             >
// //               Cancel
// //             </button>
// //             <button
// //               onClick={handleSubmit}
// //               style={styles.addButton}
// //               onMouseEnter={(e) => (e.target.style.backgroundColor = '#1d4ed8')}
// //               onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563eb')}
// //             >
// //               Add Item
// //             </button>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   };

// //   // Edit Item Modal
// //   const EditItemModal = ({ isOpen, onClose, item, onEditItem }) => {
// //     const [formData, setFormData] = useState({
// //       name: item?.name || '',
// //       units: item?.units || '',
// //       image: item?.image || null,
// //     });

// //     useEffect(() => {
// //       if (item) {
// //         setFormData({
// //           name: item.name,
// //           units: item.units,
// //           image: item.image,
// //         });
// //       }
// //     }, [item]);

// //     const handleChange = (e) => {
// //       const { name, value } = e.target;
// //       setFormData((prev) => ({ ...prev, [name]: value }));
// //     };

// //     const handleImageUpload = (e) => {
// //       const file = e.target.files[0];
// //       if (file) {
// //         const reader = new FileReader();
// //         reader.onloadend = () => {
// //           setFormData((prev) => ({ ...prev, image: reader.result }));
// //         };
// //         reader.readAsDataURL(file);
// //       }
// //     };

// //     const handleSubmit = (e) => {
// //       e.preventDefault();
// //       onEditItem(item._id, formData);
// //     };

// //     if (!isOpen || !item) return null;

// //     return (
// //       <div style={styles.modalOverlay}>
// //         <div style={styles.modalContent}>
// //           <div style={styles.modalHeader}>
// //             <h2 style={styles.modalTitle}>Edit Packaging Item</h2>
// //             <button
// //               onClick={onClose}
// //               style={styles.closeButton}
// //               onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
// //               onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
// //             >
// //               <X size={20} />
// //             </button>
// //           </div>
// //           <div style={styles.modalBody}>
// //             <form onSubmit={handleSubmit}>
// //               <div style={styles.formGroup}>
// //                 <label style={styles.label}>Packing Item</label>
// //                 <input
// //                   type="text"
// //                   name="name"
// //                   value={formData.name}
// //                   onChange={handleChange}
// //                   placeholder="Enter packing item name"
// //                   style={styles.input}
// //                   required
// //                 />
// //               </div>
// //               <div style={styles.formGroup}>
// //                 <label style={styles.label}>Packing Image</label>
// //                 <input
// //                   type="file"
// //                   ref={fileInputRef}
// //                   onChange={handleImageUpload}
// //                   style={{ display: 'none' }}
// //                   accept="image/*"
// //                 />
// //                 <div
// //                   style={styles.uploadArea}
// //                   onClick={() => fileInputRef.current.click()}
// //                 >
// //                   <Upload size={20} style={styles.uploadIcon} />
// //                   <span style={styles.uploadText}>
// //                     {formData.image ? 'Change image' : 'Upload image'}
// //                   </span>
// //                 </div>
// //                 {formData.image && (
// //                   <div style={styles.imagePreview}>
// //                     <img
// //                       src={formData.image}
// //                       alt="Preview"
// //                       style={styles.previewImage}
// //                     />
// //                   </div>
// //                 )}
// //               </div>
// //               <div style={styles.formGroup}>
// //                 <label style={styles.label}>Item Quantity</label>
// //                 <input
// //                   type="number"
// //                   name="units"
// //                   value={formData.units}
// //                   onChange={handleChange}
// //                   placeholder="Enter quantity"
// //                   style={styles.input}
// //                   required
// //                 />
// //               </div>
// //             </form>
// //           </div>
// //           <div style={styles.modalFooter}>
// //             <button
// //               onClick={onClose}
// //               style={styles.cancelButton}
// //               onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9fafb')}
// //               onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
// //             >
// //               Cancel
// //             </button>
// //             <button
// //               onClick={handleSubmit}
// //               style={styles.addButton}
// //               onMouseEnter={(e) => (e.target.style.backgroundColor = '#1d4ed8')}
// //               onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563eb')}
// //             >
// //               Update Item
// //             </button>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   };

// //   // Delete Confirmation Modal
// //   const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemName }) => {
// //     if (!isOpen) return null;

// //     return (
// //       <div style={styles.modalOverlay}>
// //         <div style={styles.modalContent}>
// //           <div style={styles.modalHeader}>
// //             <h2 style={styles.modalTitle}>Confirm Deletion</h2>
// //             <button
// //               onClick={onClose}
// //               style={styles.closeButton}
// //               onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
// //               onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
// //             >
// //               <X size={20} />
// //             </button>
// //           </div>
// //           <div style={styles.modalBody}>
// //             <p style={styles.confirmText}>
// //               Are you sure you want to delete "{itemName}"? This action cannot be undone.
// //             </p>
// //           </div>
// //           <div style={styles.modalFooter}>
// //             <button
// //               onClick={onClose}
// //               style={styles.cancelButton}
// //               onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9fafb')}
// //               onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
// //             >
// //               Cancel
// //             </button>
// //             <button
// //               onClick={onConfirm}
// //               style={styles.deleteButton}
// //               onMouseEnter={(e) => (e.target.style.backgroundColor = '#b91c1c')}
// //               onMouseLeave={(e) => (e.target.style.backgroundColor = '#dc2626')}
// //             >
// //               Delete
// //             </button>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   };

// //   // ItemCard component
// //   const ItemCard = ({ item, onEdit, onDelete }) => (
// //     <div style={styles.card}>
// //       <div style={styles.cardImageContainer}>
// //         <div style={styles.unitsBadge}>{item.units} units</div>
// //         {item.image ? (
// //           <img src={item.image} alt={item.name} style={styles.cardImage} />
// //         ) : (
// //           <div style={styles.placeholderImage}>
// //             <div style={styles.placeholderIcon}>
// //               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
// //                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
// //                 <circle cx="8.5" cy="8.5" r="1.5" />
// //                 <polyline points="21,15 16,10 5,21" />
// //               </svg>
// //             </div>
// //           </div>
// //         )}
// //       </div>
// //       <div style={styles.cardContent}>
// //         <h3 style={styles.cardTitle}>{item.name}</h3>
// //         <div style={styles.cardDate}>
// //           <Calendar size={14} style={styles.calendarIcon} />
// //           <span>Added {new Date(item.addedDate).toLocaleDateString()}</span>
// //         </div>
// //         {user?.role && (
// //           <div style={styles.cardStore}>
// //             <span>{item.storeName || user.role}</span>
// //           </div>
// //         )}
// //         <div style={styles.cardActions}>
// //           <button
// //             style={styles.actionButton}
// //             onClick={() => {
// //               setSelectedItem(item);
// //               setIsEditModalOpen(true);
// //             }}
// //             onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
// //             onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
// //           >
// //             <Edit size={16} />
// //             Edit
// //           </button>
// //           <button
// //             style={styles.actionButton}
// //             onClick={() => {
// //               setItemToDelete(item);
// //               setIsDeleteConfirmOpen(true);
// //             }}
// //             onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
// //             onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
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
// //       fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
// //     },
// //     header: {
// //       display: 'flex',
// //       justifyContent: 'space-between',
// //       alignItems: 'flex-start',
// //       marginBottom: '32px',
// //       flexWrap: 'wrap',
// //       gap: '16px',
// //     },
// //     headerLeft: {
// //       flex: '1',
// //       minWidth: '200px',
// //     },
// //     title: {
// //       fontSize: '28px',
// //       fontWeight: '700',
// //       color: '#1f2937',
// //       margin: '0 0 8px 0',
// //     },
// //     subtitle: {
// //       fontSize: '16px',
// //       color: '#6b7280',
// //       margin: '0',
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
// //       transition: 'all 0.2s ease',
// //     },
// //     grid: {
// //       display: 'grid',
// //       gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
// //       gap: '24px',
// //       marginBottom: '40px',
// //     },
// //     noData: {
// //       textAlign: 'center',
// //       padding: '40px',
// //       color: '#6b7280',
// //       fontSize: '16px',
// //       gridColumn: '1 / -1',
// //     },
// //     card: {
// //       backgroundColor: '#ffffff',
// //       borderRadius: '12px',
// //       border: '1px solid #e5e7eb',
// //       overflow: 'hidden',
// //       transition: 'all 0.2s ease',
// //       boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
// //     },
// //     cardImageContainer: {
// //       position: 'relative',
// //       height: '200px',
// //       overflow: 'hidden',
// //     },
// //     cardImage: {
// //       width: '100%',
// //       height: '100%',
// //       objectFit: 'cover',
// //     },
// //     placeholderImage: {
// //       width: '100%',
// //       height: '100%',
// //       backgroundColor: '#f3f4f6',
// //       display: 'flex',
// //       alignItems: 'center',
// //       justifyContent: 'center',
// //     },
// //     placeholderIcon: {
// //       opacity: '0.5',
// //     },
// //     unitsBadge: {
// //       position: 'absolute',
// //       top: '12px',
// //       right: '12px',
// //       backgroundColor: 'rgba(0, 0, 0, 0.7)',
// //       color: 'white',
// //       padding: '6px 12px',
// //       borderRadius: '20px',
// //       fontSize: '12px',
// //       fontWeight: '500',
// //     },
// //     cardContent: {
// //       padding: '20px',
// //     },
// //     cardTitle: {
// //       fontSize: '18px',
// //       fontWeight: '600',
// //       color: '#1f2937',
// //       margin: '0 0 12px 0',
// //     },
// //     cardDate: {
// //       display: 'flex',
// //       alignItems: 'center',
// //       gap: '6px',
// //       color: '#6b7280',
// //       fontSize: '14px',
// //       marginBottom: '12px',
// //     },
// //     cardStore: {
// //       color: '#6b7280',
// //       fontSize: '14px',
// //       marginBottom: '20px',
// //     },
// //     calendarIcon: {
// //       color: '#9ca3af',
// //     },
// //     cardActions: {
// //       display: 'flex',
// //       gap: '12px',
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
// //       transition: 'all 0.2s ease',
// //     },
// //     pagination: {
// //       display: 'flex',
// //       justifyContent: 'space-between',
// //       alignItems: 'center',
// //       flexWrap: 'wrap',
// //       gap: '16px',
// //       border: '1px solid rgb(229, 231, 235)',
// //       backgroundColor: 'rgb(255, 255, 255)',
// //       boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px',
// //       padding: '25px',
// //       borderRadius: '15px',
// //     },
// //     paginationInfo: {
// //       color: '#6b7280',
// //       fontSize: '14px',
// //     },
// //     paginationButtons: {
// //       display: 'flex',
// //       gap: '8px',
// //     },
// //     paginationButton: {
// //       padding: '8px 12px',
// //       border: '1px solid #d1d5db',
// //       backgroundColor: 'white',
// //       borderRadius: '6px',
// //       cursor: 'pointer',
// //       fontSize: '14px',
// //       color: '#374151',
// //       transition: 'all 0.2s ease',
// //     },
// //     paginationButtonActive: {
// //       padding: '8px 12px',
// //       border: '1px solid #2563eb',
// //       backgroundColor: '#2563eb',
// //       borderRadius: '6px',
// //       cursor: 'pointer',
// //       fontSize: '14px',
// //       color: 'white',
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
// //       padding: '20px',
// //     },
// //     modalContent: {
// //       backgroundColor: 'white',
// //       borderRadius: '12px',
// //       width: '100%',
// //       maxWidth: '500px',
// //       maxHeight: '90vh',
// //       overflow: 'auto',
// //     },
// //     modalHeader: {
// //       display: 'flex',
// //       justifyContent: 'space-between',
// //       alignItems: 'center',
// //       padding: '24px 24px 0 24px',
// //     },
// //     modalTitle: {
// //       fontSize: '20px',
// //       fontWeight: '600',
// //       color: '#1f2937',
// //       margin: '0',
// //     },
// //     closeButton: {
// //       background: 'none',
// //       border: 'none',
// //       cursor: 'pointer',
// //       padding: '8px',
// //       borderRadius: '6px',
// //       color: '#6b7280',
// //       transition: 'all 0.2s ease',
// //     },
// //     modalBody: {
// //       padding: '24px',
// //     },
// //     formGroup: {
// //       marginBottom: '20px',
// //     },
// //     label: {
// //       display: 'block',
// //       fontSize: '14px',
// //       fontWeight: '500',
// //       color: '#374151',
// //       marginBottom: '8px',
// //     },
// //     input: {
// //       width: '100%',
// //       padding: '12px',
// //       border: '1px solid #d1d5db',
// //       borderRadius: '8px',
// //       fontSize: '14px',
// //       outline: 'none',
// //       transition: 'border-color 0.2s ease',
// //       boxSizing: 'border-box',
// //     },
// //     uploadArea: {
// //       border: '2px dashed #d1d5db',
// //       borderRadius: '8px',
// //       padding: '40px 20px',
// //       textAlign: 'center',
// //       cursor: 'pointer',
// //       transition: 'all 0.2s ease',
// //       backgroundColor: '#fafafa',
// //     },
// //     uploadIcon: {
// //       color: '#9ca3af',
// //       marginBottom: '8px',
// //     },
// //     uploadText: {
// //       color: '#6b7280',
// //       fontSize: '14px',
// //     },
// //     imagePreview: {
// //       marginTop: '16px',
// //       textAlign: 'center',
// //     },
// //     previewImage: {
// //       maxWidth: '100%',
// //       maxHeight: '200px',
// //       borderRadius: '8px',
// //     },
// //     modalFooter: {
// //       display: 'flex',
// //       justifyContent: 'flex-end',
// //       gap: '12px',
// //       padding: '0 24px 24px 24px',
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
// //       transition: 'all 0.2s ease',
// //     },
// //     addButton: {
// //       padding: '10px 20px',
// //       border: 'none',
// //       backgroundColor: '#2563eb',
// //       color: 'white',
// //       borderRadius: '8px',
// //       fontSize: '14px',
// //       fontWeight: '500',
// //       cursor: 'pointer',
// //       transition: 'all 0.2s ease',
// //     },
// //     deleteButton: {
// //       padding: '10px 20px',
// //       border: 'none',
// //       backgroundColor: '#dc2626',
// //       color: 'white',
// //       borderRadius: '8px',
// //       fontSize: '14px',
// //       fontWeight: '500',
// //       cursor: 'pointer',
// //       transition: 'all 0.2s ease',
// //     },
// //     confirmText: {
// //       color: '#374151',
// //       fontSize: '16px',
// //       margin: '0',
// //     },
// //   };

// //   const responsiveStyles = {
// //     ...styles,
// //     container: {
// //       ...styles.container,
// //       padding: window.innerWidth <= 640 ? '16px' : '24px',
// //     },
// //     grid: {
// //       ...styles.grid,
// //       gridTemplateColumns:
// //         window.innerWidth <= 640
// //           ? '1fr'
// //           : window.innerWidth <= 768
// //           ? 'repeat(auto-fill, minmax(280px, 1fr))'
// //           : 'repeat(auto-fill, minmax(320px, 1fr))',
// //       gap: window.innerWidth <= 640 ? '16px' : '24px',
// //     },
// //     header: {
// //       ...styles.header,
// //       flexDirection: window.innerWidth <= 640 ? 'column' : 'row',
// //       alignItems: window.innerWidth <= 640 ? 'stretch' : 'flex-start',
// //     },
// //     pagination: {
// //       ...styles.pagination,
// //       flexDirection: window.innerWidth <= 640 ? 'column' : 'row',
// //       textAlign: window.innerWidth <= 640 ? 'center' : 'left',
// //     },
// //   };

// //   return (
// //     <div style={responsiveStyles.container}>
// //       <div style={responsiveStyles.header}>
// //         <div style={responsiveStyles.headerLeft}>
// //           <h1 style={responsiveStyles.title}>Packaging Items {user?.role ? `for ${user.role}` : ''}</h1>
// //           <p style={responsiveStyles.subtitle}>
// //             Manage your packaging items inventory ({filteredItems.length} items)
// //           </p>
// //         </div>
// //         <button
// //           onClick={() => setIsModalOpen(true)}
// //           style={responsiveStyles.addButton}
// //           onMouseEnter={(e) => (e.target.style.backgroundColor = '#1d4ed8')}
// //           onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563eb')}
// //         >
// //           <Plus size={20} />
// //           Add Packaging Item
// //         </button>
// //       </div>
// //       <div style={responsiveStyles.grid}>
// //         {isLoading ? (
// //           <div style={styles.noData}>Loading...</div>
// //         ) : paginatedItems.length > 0 ? (
// //           paginatedItems.map((item) => (
// //             <ItemCard
// //               key={item._id}
// //               item={item}
// //               onEdit={(updatedItem) => {
// //                 setSelectedItem(item);
// //                 setIsEditModalOpen(true);
// //               }}
// //               onDelete={() => {
// //                 setItemToDelete(item);
// //                 setIsDeleteConfirmOpen(true);
// //               }}
// //             />
// //           ))
// //         ) : (
// //           <div style={styles.noData}>No data available</div>
// //         )}
// //       </div>
// //       {totalPages > 1 && (
// //         <div style={responsiveStyles.pagination}>
// //           <div style={responsiveStyles.paginationInfo}>
// //             Showing {currentPage} to {totalPages} of {filteredItems.length} results
// //           </div>
// //           <div style={responsiveStyles.paginationButtons}>
// //             <button
// //               style={responsiveStyles.paginationButton}
// //               onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
// //               disabled={currentPage === 1}
// //               onMouseEnter={(e) =>
// //                 !e.target.disabled && (e.target.style.backgroundColor = '#f9fafb')
// //               }
// //               onMouseLeave={(e) =>
// //                 !e.target.disabled && (e.target.style.backgroundColor = 'white')
// //               }
// //             >
// //               Previous
// //             </button>
// //             {[...Array(totalPages)].map((_, i) => (
// //               <button
// //                 key={i + 1}
// //                 style={
// //                   currentPage === i + 1
// //                     ? responsiveStyles.paginationButtonActive
// //                     : responsiveStyles.paginationButton
// //                 }
// //                 onClick={() => setCurrentPage(i + 1)}
// //                 onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9fafb')}
// //                 onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
// //               >
// //                 {i + 1}
// //               </button>
// //             ))}
// //             <button
// //               style={responsiveStyles.paginationButton}
// //               onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
// //               disabled={currentPage === totalPages}
// //               onMouseEnter={(e) =>
// //                 !e.target.disabled && (e.target.style.backgroundColor = '#f9fafb')
// //               }
// //               onMouseLeave={(e) =>
// //                 !e.target.disabled && (e.target.style.backgroundColor = 'white')
// //               }
// //             >
// //               Next
// //             </button>
// //           </div>
// //         </div>
// //       )}
// //       <AddItemModal
// //         isOpen={isModalOpen}
// //         onClose={() => setIsModalOpen(false)}
// //         onAddItem={handleAddItem}
// //       />
// //       <EditItemModal
// //         isOpen={isEditModalOpen}
// //         onClose={() => setIsEditModalOpen(false)}
// //         item={selectedItem}
// //         onEditItem={handleEditItem}
// //       />
// //       <DeleteConfirmModal
// //         isOpen={isDeleteConfirmOpen}
// //         onClose={() => setIsDeleteConfirmOpen(false)}
// //         onConfirm={() => handleDeleteItem(itemToDelete?._id)}
// //         itemName={itemToDelete?.name}
// //       />
// //     </div>
// //   );
// // };

// // export default PackagingInventory;

// import { useState, useEffect, useRef } from 'react';
// import { Calendar, Edit, Trash2, Upload, Plus, X } from 'lucide-react';
// import { useUser } from './UserContext';

// const PackagingInventory = () => {
//   const { user } = useUser();
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

//   // Hardcoded API URL
//   const API_BASE_URL =
//     process.env.REACT_APP_API_URL || 'https://coloroninventoy.onrender.com/api';

// // const API_BASE_URL =
// //   process.env.REACT_APP_API_URL || 'https://coloroninventoy.onrender.com/api';


//   // Get token from localStorage
//   const getAuthHeaders = () => {
//     const token = localStorage.getItem('authToken');
//     if (!token) {
//       console.warn('⚠️ No token found in localStorage');
//       return {};
//     }
//     return {
//       Authorization: `Bearer ${token}`,
//       'Content-Type': 'application/json',
//     };
//   };

//   // Fetch items from backend - filtered by user role
//   useEffect(() => {
//     const fetchItems = async () => {
//       try {
//         setIsLoading(true);
//         const token = localStorage.getItem('authToken');
//         if (!token) {
//           console.error('❌ No auth token found. Please log in again.');
//           setPackagingItems([]);
//           return;
//         }
//         let url = `${API_BASE_URL}/items`;
//         if (user?.role) {
//           url += `?storeName=${user.role}`;
//         }
//         const response = await fetch(url, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         if (response.status === 401) {
//           console.error('❌ Unauthorized - Invalid or expired token');
//           setPackagingItems([]);
//           return;
//         }
//         if (!response.ok) throw new Error('Failed to fetch items');
//         const data = await response.json();
//         setPackagingItems(data);
//       } catch (err) {
//         console.error('Error fetching items:', err);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     if (user) {
//       fetchItems();
//     }
//   }, [user]); // Re-fetch when user changes

//   const handleAddItem = async (formData) => {
//     try {
//       const headers = getAuthHeaders();
//       const response = await fetch(`${API_BASE_URL}/items`, {
//         method: 'POST',
//         headers,
//         body: JSON.stringify({
//           ...formData,
//           storeName: user?.role || 'UNKNOWN',
//           addedBy: user?.id || 'unknown-user',
//         }),
//       });
//       if (response.status === 401) {
//         alert('Session expired. Please log in again.');
//         return;
//       }
//       if (!response.ok) throw new Error('Failed to add item');
//       const newItem = await response.json();
//       setPackagingItems([...packagingItems, newItem]);
//       setIsModalOpen(false);
//     } catch (err) {
//       console.error('Error adding item:', err);
//     }
//   };

//   const handleEditItem = async (id, updatedItem) => {
//     try {
//       const headers = getAuthHeaders();
//       const response = await fetch(`${API_BASE_URL}/items/${id}`, {
//         method: 'PUT',
//         headers,
//         body: JSON.stringify({
//           ...updatedItem,
//           updatedBy: user?.id || 'unknown-user',
//         }),
//       });
//       if (response.status === 401) {
//         alert('Session expired. Please log in again.');
//         return;
//       }
//       if (!response.ok) throw new Error('Failed to update item');
//       const data = await response.json();
//       setPackagingItems(packagingItems.map((item) => (item._id === id ? data : item)));
//       setIsEditModalOpen(false);
//     } catch (err) {
//       console.error('Error updating item:', err);
//     }
//   };

//   const handleDeleteItem = async (id) => {
//     try {
//       const headers = getAuthHeaders();
//       const response = await fetch(`${API_BASE_URL}/items/${id}`, {
//         method: 'DELETE',
//         headers,
//       });
//       if (response.status === 401) {
//         alert('Session expired. Please log in again.');
//         return;
//       }
//       if (!response.ok) throw new Error('Failed to delete item');
//       setPackagingItems(packagingItems.filter((item) => item._id !== id));
//       setIsDeleteConfirmOpen(false);
//     } catch (err) {
//       console.error('Error deleting item:', err);
//     }
//   };

//   // Filter items based on user role (client-side fallback)
//   const filteredItems = user?.role
//     ? packagingItems.filter(
// <<<<<<< HEAD
//       (item) =>
//         item.storeName &&
//         item.storeName.toLowerCase() === user.role.toLowerCase()
//     )
// =======
//         (item) =>
//           item.storeName &&
//           item.storeName.toLowerCase() === user.role.toLowerCase()
//       )
// >>>>>>> 31d76e31ea2ed9e2fc722a7f9133118915ac4b07
//     : packagingItems;

// const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
// const paginatedItems = filteredItems.slice(
//   (currentPage - 1) * itemsPerPage,
//   currentPage * itemsPerPage
// );

// // Add Item Modal
// const AddItemModal = ({ isOpen, onClose, onAddItem }) => {
//   const [formData, setFormData] = useState({
//     name: '',
//     units: '',
//     image: null,
//   });
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };
//   const handleImageUpload = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setFormData((prev) => ({ ...prev, image: reader.result }));
//       };
//       reader.readAsDataURL(file);
//     }
//   };
//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onAddItem(formData);
//     setFormData({ name: '', units: '', image: null });
//   };
//   if (!isOpen) return null;
//   return (
//     <div style={styles.modalOverlay}>
//       <div style={styles.modalContent}>
//         <div style={styles.modalHeader}>
//           <h2 style={styles.modalTitle}>Add Packaging Item</h2>
//           <button
//             onClick={onClose}
//             style={styles.closeButton}
//             onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
//             onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
//           >
//             <X size={20} />
//           </button>
//         </div>
//         <div style={styles.modalBody}>
//           <form onSubmit={handleSubmit}>
//             <div style={styles.formGroup}>
//               <label style={styles.label}>Packing Item</label>
//               <input
//                 type="text"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 placeholder="Enter packing item name"
//                 style={styles.input}
//                 required
//               />
//             </div>
//             <div style={styles.formGroup}>
//               <label style={styles.label}>Packing Image</label>
//               <input
//                 type="file"
//                 ref={fileInputRef}
//                 onChange={handleImageUpload}
//                 style={{ display: 'none' }}
//                 accept="image/*"
//               />
//               <div
//                 style={styles.uploadArea}
//                 onClick={() => fileInputRef.current.click()}
//               >
//                 <Upload size={20} style={styles.uploadIcon} />
//                 <span style={styles.uploadText}>
//                   {formData.image ? 'Change image' : 'Upload image'}
//                 </span>
//               </div>
//               {formData.image && (
//                 <div style={styles.imagePreview}>
//                   <img
//                     src={formData.image}
//                     alt="Preview"
//                     style={styles.previewImage}
//                   />
//                 </div>
//               )}
//             </div>
//             <div style={styles.formGroup}>
//               <label style={styles.label}>Item Quantity</label>
//               <input
//                 type="number"
//                 name="units"
//                 value={formData.units}
//                 onChange={handleChange}
//                 placeholder="Enter quantity"
//                 style={styles.input}
//                 required
//               />
//             </div>
//           </form>
//         </div>
//         <div style={styles.modalFooter}>
//           <button
//             onClick={onClose}
//             style={styles.cancelButton}
//             onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9fafb')}
//             onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSubmit}
//             style={styles.addButton}
//             onMouseEnter={(e) => (e.target.style.backgroundColor = '#1d4ed8')}
//             onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563eb')}
//           >
//             Add Item
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Edit Item Modal
// const EditItemModal = ({ isOpen, onClose, item, onEditItem }) => {
//   const [formData, setFormData] = useState({
//     name: item?.name || '',
//     units: item?.units || '',
//     image: item?.image || null,
//   });
//   useEffect(() => {
//     if (item) {
//       setFormData({
//         name: item.name,
//         units: item.units,
//         image: item.image,
//       });
//     }
//   }, [item]);
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };
//   const handleImageUpload = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setFormData((prev) => ({ ...prev, image: reader.result }));
//       };
//       reader.readAsDataURL(file);
//     }
//   };
//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onEditItem(item._id, formData);
//   };
//   if (!isOpen || !item) return null;
//   return (
//     <div style={styles.modalOverlay}>
//       <div style={styles.modalContent}>
//         <div style={styles.modalHeader}>
//           <h2 style={styles.modalTitle}>Edit Packaging Item</h2>
//           <button
//             onClick={onClose}
//             style={styles.closeButton}
//             onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
//             onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
//           >
//             <X size={20} />
//           </button>
//         </div>
//         <div style={styles.modalBody}>
//           <form onSubmit={handleSubmit}>
//             <div style={styles.formGroup}>
//               <label style={styles.label}>Packing Item</label>
//               <input
//                 type="text"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 placeholder="Enter packing item name"
//                 style={styles.input}
//                 required
//               />
//             </div>
//             <div style={styles.formGroup}>
//               <label style={styles.label}>Packing Image</label>
//               <input
//                 type="file"
//                 ref={fileInputRef}
//                 onChange={handleImageUpload}
//                 style={{ display: 'none' }}
//                 accept="image/*"
//               />
//               <div
//                 style={styles.uploadArea}
//                 onClick={() => fileInputRef.current.click()}
//               >
//                 <Upload size={20} style={styles.uploadIcon} />
//                 <span style={styles.uploadText}>
//                   {formData.image ? 'Change image' : 'Upload image'}
//                 </span>
//               </div>
//               {formData.image && (
//                 <div style={styles.imagePreview}>
//                   <img
//                     src={formData.image}
//                     alt="Preview"
//                     style={styles.previewImage}
//                   />
//                 </div>
//               )}
//             </div>
//             <div style={styles.formGroup}>
//               <label style={styles.label}>Item Quantity</label>
//               <input
//                 type="number"
//                 name="units"
//                 value={formData.units}
//                 onChange={handleChange}
//                 placeholder="Enter quantity"
//                 style={styles.input}
//                 required
//               />
//             </div>
//           </form>
//         </div>
//         <div style={styles.modalFooter}>
//           <button
//             onClick={onClose}
//             style={styles.cancelButton}
//             onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9fafb')}
//             onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSubmit}
//             style={styles.addButton}
//             onMouseEnter={(e) => (e.target.style.backgroundColor = '#1d4ed8')}
//             onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563eb')}
//           >
//             Update Item
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Delete Confirmation Modal
// const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemName }) => {
//   if (!isOpen) return null;
//   return (
//     <div style={styles.modalOverlay}>
//       <div style={styles.modalContent}>
//         <div style={styles.modalHeader}>
//           <h2 style={styles.modalTitle}>Confirm Deletion</h2>
//           <button
//             onClick={onClose}
//             style={styles.closeButton}
//             onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
//             onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
//           >
//             <X size={20} />
//           </button>
//         </div>
//         <div style={styles.modalBody}>
//           <p style={styles.confirmText}>
//             Are you sure you want to delete "{itemName}"? This action cannot be undone.
//           </p>
//         </div>
//         <div style={styles.modalFooter}>
//           <button
//             onClick={onClose}
//             style={styles.cancelButton}
//             onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9fafb')}
//             onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={onConfirm}
//             style={styles.deleteButton}
//             onMouseEnter={(e) => (e.target.style.backgroundColor = '#b91c1c')}
//             onMouseLeave={(e) => (e.target.style.backgroundColor = '#dc2626')}
//           >
//             Delete
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // ItemCard component
// const ItemCard = ({ item, onEdit, onDelete }) => (
//   <div style={styles.card}>
//     <div style={styles.cardImageContainer}>
//       <div style={styles.unitsBadge}>{item.units} units</div>
//       {item.image ? (
//         <img src={item.image} alt={item.name} style={styles.cardImage} />
//       ) : (
//         <div style={styles.placeholderImage}>
//           <div style={styles.placeholderIcon}>
//             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
//               <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
//               <circle cx="8.5" cy="8.5" r="1.5" />
//               <polyline points="21,15 16,10 5,21" />
//             </svg>
//           </div>
//         </div>
//       )}
//     </div>
//     <div style={styles.cardContent}>
//       <h3 style={styles.cardTitle}>{item.name}</h3>
//       <div style={styles.cardDate}>
//         <Calendar size={14} style={styles.calendarIcon} />
//         <span>Added {new Date(item.addedDate).toLocaleDateString()}</span>
//       </div>
//       {user?.role && (
//         <div style={styles.cardStore}>
//           <span>{item.storeName || user.role}</span>
//         </div>
//       )}
//       <div style={styles.cardActions}>
//         <button
//           style={styles.actionButton}
//           onClick={() => {
//             setSelectedItem(item);
//             setIsEditModalOpen(true);
//           }}
//           onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
//           onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
//         >
//           <Edit size={16} />
//           Edit
//         </button>
//         <button
//           style={styles.actionButton}
//           onClick={() => {
//             setItemToDelete(item);
//             setIsDeleteConfirmOpen(true);
//           }}
//           onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
//           onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
//         >
//           <Trash2 size={16} />
//           Delete
//         </button>
//       </div>
//     </div>
//   </div>
// );

// const styles = {
//   container: {
//     padding: '24px',
//     backgroundColor: '#ffffff',
//     minHeight: '100vh',
//     fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
//   },
//   header: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: '32px',
//     flexWrap: 'wrap',
//     gap: '16px',
//   },
//   headerLeft: {
//     flex: '1',
//     minWidth: '200px',
//   },
//   title: {
//     fontSize: '28px',
//     fontWeight: '700',
//     color: '#1f2937',
//     margin: '0 0 8px 0',
//   },
//   subtitle: {
//     fontSize: '16px',
//     color: '#6b7280',
//     margin: '0',
//   },
//   addButton: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '8px',
//     backgroundColor: '#2563eb',
//     color: 'white',
//     border: 'none',
//     borderRadius: '8px',
//     padding: '12px 20px',
//     fontSize: '14px',
//     fontWeight: '500',
//     cursor: 'pointer',
//     transition: 'all 0.2s ease',
//   },
//   grid: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
//     gap: '24px',
//     marginBottom: '40px',
//   },
//   noData: {
//     textAlign: 'center',
//     padding: '40px',
//     color: '#6b7280',
//     fontSize: '16px',
//     gridColumn: '1 / -1',
//   },
//   card: {
//     backgroundColor: '#ffffff',
//     borderRadius: '12px',
//     border: '1px solid #e5e7eb',
//     overflow: 'hidden',
//     transition: 'all 0.2s ease',
//     boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
//   },
//   cardImageContainer: {
//     position: 'relative',
//     height: '200px',
//     overflow: 'hidden',
//   },
//   cardImage: {
//     width: '100%',
//     height: '100%',
//     objectFit: 'cover',
//   },
//   placeholderImage: {
//     width: '100%',
//     height: '100%',
//     backgroundColor: '#f3f4f6',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   placeholderIcon: {
//     opacity: '0.5',
//   },
//   unitsBadge: {
//     position: 'absolute',
//     top: '12px',
//     right: '12px',
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     color: 'white',
//     padding: '6px 12px',
//     borderRadius: '20px',
//     fontSize: '12px',
//     fontWeight: '500',
//   },
//   cardContent: {
//     padding: '20px',
//   },
//   cardTitle: {
//     fontSize: '18px',
//     fontWeight: '600',
//     color: '#1f2937',
//     margin: '0 0 12px 0',
//   },
//   cardDate: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '6px',
//     color: '#6b7280',
//     fontSize: '14px',
//     marginBottom: '12px',
//   },
//   cardStore: {
//     color: '#6b7280',
//     fontSize: '14px',
//     marginBottom: '20px',
//   },
//   calendarIcon: {
//     color: '#9ca3af',
//   },
//   cardActions: {
//     display: 'flex',
//     gap: '12px',
//   },
//   actionButton: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '6px',
//     backgroundColor: 'white',
//     border: '1px solid #d1d5db',
//     borderRadius: '6px',
//     padding: '8px 12px',
//     fontSize: '14px',
//     color: '#374151',
//     cursor: 'pointer',
//     transition: 'all 0.2s ease',
//   },
//   pagination: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     flexWrap: 'wrap',
//     gap: '16px',
//     border: '1px solid rgb(229, 231, 235)',
//     backgroundColor: 'rgb(255, 255, 255)',
//     boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px',
//     padding: '25px',
//     borderRadius: '15px',
//   },
//   paginationInfo: {
//     color: '#6b7280',
//     fontSize: '14px',
//   },
//   paginationButtons: {
//     display: 'flex',
//     gap: '8px',
//   },
//   paginationButton: {
//     padding: '8px 12px',
//     border: '1px solid #d1d5db',
//     backgroundColor: 'white',
//     borderRadius: '6px',
//     cursor: 'pointer',
//     fontSize: '14px',
//     color: '#374151',
//     transition: 'all 0.2s ease',
//   },
//   paginationButtonActive: {
//     padding: '8px 12px',
//     border: '1px solid #2563eb',
//     backgroundColor: '#2563eb',
//     borderRadius: '6px',
//     cursor: 'pointer',
//     fontSize: '14px',
//     color: 'white',
//   },
//   modalOverlay: {
//     position: 'fixed',
//     top: '0',
//     left: '0',
//     right: '0',
//     bottom: '0',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     zIndex: '1000',
//     padding: '20px',
//   },
//   modalContent: {
//     backgroundColor: 'white',
//     borderRadius: '12px',
//     width: '100%',
//     maxWidth: '500px',
//     maxHeight: '90vh',
//     overflow: 'auto',
//   },
//   modalHeader: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: '24px 24px 0 24px',
//   },
//   modalTitle: {
//     fontSize: '20px',
//     fontWeight: '600',
//     color: '#1f2937',
//     margin: '0',
//   },
//   closeButton: {
//     background: 'none',
//     border: 'none',
//     cursor: 'pointer',
//     padding: '8px',
//     borderRadius: '6px',
//     color: '#6b7280',
//     transition: 'all 0.2s ease',
//   },
//   modalBody: {
//     padding: '24px',
//   },
//   formGroup: {
//     marginBottom: '20px',
//   },
//   label: {
//     display: 'block',
//     fontSize: '14px',
//     fontWeight: '500',
//     color: '#374151',
//     marginBottom: '8px',
//   },
//   input: {
//     width: '100%',
//     padding: '12px',
//     border: '1px solid #d1d5db',
//     borderRadius: '8px',
//     fontSize: '14px',
//     outline: 'none',
//     transition: 'border-color 0.2s ease',
//     boxSizing: 'border-box',
//   },
//   uploadArea: {
//     border: '2px dashed #d1d5db',
//     borderRadius: '8px',
//     padding: '40px 20px',
//     textAlign: 'center',
//     cursor: 'pointer',
//     transition: 'all 0.2s ease',
//     backgroundColor: '#fafafa',
//   },
//   uploadIcon: {
//     color: '#9ca3af',
//     marginBottom: '8px',
//   },
//   uploadText: {
//     color: '#6b7280',
//     fontSize: '14px',
//   },
//   imagePreview: {
//     marginTop: '16px',
//     textAlign: 'center',
//   },
//   previewImage: {
//     maxWidth: '100%',
//     maxHeight: '200px',
//     borderRadius: '8px',
//   },
//   modalFooter: {
//     display: 'flex',
//     justifyContent: 'flex-end',
//     gap: '12px',
//     padding: '0 24px 24px 24px',
//   },
//   cancelButton: {
//     padding: '10px 20px',
//     border: '1px solid #d1d5db',
//     backgroundColor: 'white',
//     borderRadius: '8px',
//     fontSize: '14px',
//     fontWeight: '500',
//     color: '#374151',
//     cursor: 'pointer',
//     transition: 'all 0.2s ease',
//   },
//   addButton: {
//     padding: '10px 20px',
//     border: 'none',
//     backgroundColor: '#2563eb',
//     color: 'white',
//     borderRadius: '8px',
//     fontSize: '14px',
//     fontWeight: '500',
//     cursor: 'pointer',
//     transition: 'all 0.2s ease',
//   },
//   deleteButton: {
//     padding: '10px 20px',
//     border: 'none',
//     backgroundColor: '#dc2626',
//     color: 'white',
//     borderRadius: '8px',
//     fontSize: '14px',
//     fontWeight: '500',
//     cursor: 'pointer',
//     transition: 'all 0.2s ease',
//   },
//   confirmText: {
//     color: '#374151',
//     fontSize: '16px',
//     margin: '0',
//   },
// };

// const responsiveStyles = {
//   ...styles,
//   container: {
//     ...styles.container,
//     padding: window.innerWidth <= 640 ? '16px' : '24px',
//   },
//   grid: {
//     ...styles.grid,
//     gridTemplateColumns:
//       window.innerWidth <= 640
//         ? '1fr'
//         : window.innerWidth <= 768
// <<<<<<< HEAD
//           ? 'repeat(auto-fill, minmax(280px, 1fr))'
//           : 'repeat(auto-fill, minmax(320px, 1fr))',
// =======
//           ? 'repeat(auto-fill, minmax(280px, 1fr))'
//           : 'repeat(auto-fill, minmax(320px, 1fr))',
// >>>>>>> 31d76e31ea2ed9e2fc722a7f9133118915ac4b07
//     gap: window.innerWidth <= 640 ? '16px' : '24px',
//   },
//   header: {
//     ...styles.header,
//     flexDirection: window.innerWidth <= 640 ? 'column' : 'row',
//     alignItems: window.innerWidth <= 640 ? 'stretch' : 'flex-start',
//   },
//   pagination: {
//     ...styles.pagination,
//     flexDirection: window.innerWidth <= 640 ? 'column' : 'row',
//     textAlign: window.innerWidth <= 640 ? 'center' : 'left',
//   },
// };

// return (
//   <div style={responsiveStyles.container}>
//     <div style={responsiveStyles.header}>
//       <div style={responsiveStyles.headerLeft}>
//         <h1 style={responsiveStyles.title}>Packaging Items {user?.role ? `for ${user.role}` : ''}</h1>
//         <p style={responsiveStyles.subtitle}>
//           Manage your packaging items inventory ({filteredItems.length} items)
//         </p>
//       </div>
//       <button
//         onClick={() => setIsModalOpen(true)}
//         style={responsiveStyles.addButton}
//         onMouseEnter={(e) => (e.target.style.backgroundColor = '#1d4ed8')}
//         onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563eb')}
//       >
//         <Plus size={20} />
//         Add Packaging Item
//       </button>
//     </div>
//     <div style={responsiveStyles.grid}>
//       {isLoading ? (
//         <div style={styles.noData}>Loading...</div>
//       ) : paginatedItems.length > 0 ? (
//         paginatedItems.map((item) => (
//           <ItemCard
//             key={item._id}
//             item={item}
//             onEdit={(updatedItem) => {
//               setSelectedItem(item);
//               setIsEditModalOpen(true);
//             }}
//             onDelete={() => {
//               setItemToDelete(item);
//               setIsDeleteConfirmOpen(true);
//             }}
//           />
//         ))
//       ) : (
//         <div style={styles.noData}>No data available</div>
//       )}
//     </div>
//     {totalPages > 1 && (
//       <div style={responsiveStyles.pagination}>
//         <div style={responsiveStyles.paginationInfo}>
//           Showing {currentPage} to {totalPages} of {filteredItems.length} results
//         </div>
//         <div style={responsiveStyles.paginationButtons}>
//           <button
//             style={responsiveStyles.paginationButton}
//             onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//             disabled={currentPage === 1}
//             onMouseEnter={(e) =>
//               !e.target.disabled && (e.target.style.backgroundColor = '#f9fafb')
//             }
//             onMouseLeave={(e) =>
//               !e.target.disabled && (e.target.style.backgroundColor = 'white')
//             }
//           >
//             Previous
//           </button>
//           {[...Array(totalPages)].map((_, i) => (
//             <button
//               key={i + 1}
//               style={
//                 currentPage === i + 1
//                   ? responsiveStyles.paginationButtonActive
//                   : responsiveStyles.paginationButton
//               }
//               onClick={() => setCurrentPage(i + 1)}
//               onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9fafb')}
//               onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
//             >
//               {i + 1}
//             </button>
//           ))}
//           <button
//             style={responsiveStyles.paginationButton}
//             onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
//             disabled={currentPage === totalPages}
//             onMouseEnter={(e) =>
//               !e.target.disabled && (e.target.style.backgroundColor = '#f9fafb')
//             }
//             onMouseLeave={(e) =>
//               !e.target.disabled && (e.target.style.backgroundColor = 'white')
//             }
//           >
//             Next
//           </button>
//         </div>
//       </div>
//     )}
//     <AddItemModal
//       isOpen={isModalOpen}
//       onClose={() => setIsModalOpen(false)}
//       onAddItem={handleAddItem}
//     />
//     <EditItemModal
//       isOpen={isEditModalOpen}
//       onClose={() => setIsEditModalOpen(false)}
//       item={selectedItem}
//       onEditItem={handleEditItem}
//     />
//     <DeleteConfirmModal
//       isOpen={isDeleteConfirmOpen}
//       onClose={() => setIsDeleteConfirmOpen(false)}
//       onConfirm={() => handleDeleteItem(itemToDelete?._id)}
//       itemName={itemToDelete?.name}
//     />
//   </div>
// );
// };

// export default PackagingInventory;





import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, Edit, Trash2, Upload, Plus, X } from 'lucide-react';
import { useUser } from './UserContext';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'https://coloroninventoy.onrender.com/api';

const PackagingInventory = () => {
  const { user } = useUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [packagingItems, setPackagingItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // ✅ parent-controlled edit form (no nested useEffect needed)
  const [editForm, setEditForm] = useState({ name: '', units: '', image: '' });

  const fileInputRef = useRef(null);
  const itemsPerPage = 6;

  /* ===================== AUTH ===================== */
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return {};
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  /* ===================== FETCH ITEMS ===================== */
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setIsLoading(true);

        const token = localStorage.getItem('authToken');
        if (!token) {
          setPackagingItems([]);
          return;
        }

        let url = `${API_BASE_URL}/items`;
        if (user?.role) url += `?storeName=${encodeURIComponent(user.role)}`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch');

        const data = await res.json();
        setPackagingItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Fetch error:', err);
        setPackagingItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchItems();
  }, [user]);

  /* ===================== CRUD ===================== */
  const handleAddItem = async (formData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          storeName: user?.role || 'UNKNOWN',
          addedBy: user?.id || user?._id || 'unknown',
        }),
      });

      if (!res.ok) throw new Error('Add failed');
      const newItem = await res.json();

      setPackagingItems((prev) => [...prev, newItem]);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Add error:', err);
    }
  };

  const handleEditItem = async (id, updatedItem) => {
    try {
      const res = await fetch(`${API_BASE_URL}/items/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedItem),
      });

      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();

      setPackagingItems((prev) => prev.map((i) => (i._id === id ? updated : i)));
      setIsEditModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/items/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error('Delete failed');

      setPackagingItems((prev) => prev.filter((i) => i._id !== id));
      setIsDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  /* ===================== FILTER + PAGINATION ===================== */
  const filteredItems = useMemo(() => {
    if (!user?.role) return packagingItems;
    return packagingItems.filter(
      (i) => (i.storeName || '').toLowerCase() === user.role.toLowerCase()
    );
  }, [packagingItems, user?.role]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* ===================== STYLES ===================== */
  const styles = {
    container: { padding: '24px', backgroundColor: '#fff', minHeight: '100vh' },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '24px',
      gap: '12px',
      flexWrap: 'wrap',
    },
    title: { fontSize: '26px', fontWeight: '700', margin: 0 },
    subtitle: { color: '#6b7280', margin: '6px 0 0 0' },

    addButton: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      background: '#2563eb',
      color: '#fff',
      padding: '10px 18px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
    },

    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))',
      gap: '16px',
    },

    card: {
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      overflow: 'hidden',
      padding: '14px',
    },

    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },

    pill: {
      background: '#111827',
      color: '#fff',
      padding: '4px 10px',
      borderRadius: '999px',
      fontSize: '12px',
    },

    iconBtn: {
      border: '1px solid #e5e7eb',
      background: '#fff',
      borderRadius: '8px',
      padding: '8px',
      cursor: 'pointer',
    },

    modalOverlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '16px',
    },

    modalContent: {
      background: '#fff',
      borderRadius: '12px',
      width: '100%',
      maxWidth: '520px',
      padding: '18px',
    },

    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontSize: '18px', fontWeight: '700', margin: 0 },

    input: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: '10px',
      border: '1px solid #e5e7eb',
      outline: 'none',
    },

    uploadBox: {
      border: '2px dashed #d1d5db',
      borderRadius: '12px',
      padding: '18px',
      cursor: 'pointer',
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6b7280',
      marginTop: '10px',
    },

    preview: {
      width: '100%',
      maxHeight: 220,
      objectFit: 'cover',
      borderRadius: 12,
      marginTop: 10,
    },

    actions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 },

    primaryButton: {
      padding: '10px 16px',
      backgroundColor: '#2563eb',
      color: '#fff',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
    },

    dangerButton: {
      padding: '10px 16px',
      backgroundColor: '#dc2626',
      color: '#fff',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
    },

    ghostButton: {
      padding: '10px 16px',
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      cursor: 'pointer',
    },

    pagination: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 18,
      paddingTop: 12,
      borderTop: '1px solid #e5e7eb',
      flexWrap: 'wrap',
      gap: 10,
    },

    pageBtn: {
      border: '1px solid #e5e7eb',
      background: '#fff',
      borderRadius: 10,
      padding: '8px 12px',
      cursor: 'pointer',
    },

    pageBtnActive: {
      border: '1px solid #2563eb',
      background: '#2563eb',
      color: '#fff',
      borderRadius: 10,
      padding: '8px 12px',
      cursor: 'pointer',
    },
  };

  /* ===================== MODALS ===================== */

  const AddModal = () => {
    const [name, setName] = useState('');
    const [units, setUnits] = useState('');
    const [image, setImage] = useState('');

    const onPickFile = () => fileInputRef.current?.click();

    const onFileChange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => setImage(String(reader.result || ''));
      reader.readAsDataURL(file);
    };

    const submit = () => {
      if (!name.trim() || !units) return;
      handleAddItem({ name: name.trim(), units: Number(units), image });
    };

    if (!isModalOpen) return null;

    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>Add Packaging Item</h3>
            <button style={styles.iconBtn} onClick={() => setIsModalOpen(false)} title="Close">
              <X size={16} />
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Item Name</label>
            <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Units</label>
            <input style={styles.input} type="number" value={units} onChange={(e) => setUnits(e.target.value)} />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />

          <div style={styles.uploadBox} onClick={onPickFile}>
            <Upload size={18} />
            <span>{image ? 'Change image' : 'Upload image'}</span>
          </div>

          {image ? <img alt="preview" src={image} style={styles.preview} /> : null}

          <div style={styles.actions}>
            <button style={styles.ghostButton} onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button style={styles.primaryButton} onClick={submit}>Add</button>
          </div>
        </div>
      </div>
    );
  };

  const EditModal = () => {
    const onPickFile = () => fileInputRef.current?.click();

    const onFileChange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => setEditForm((p) => ({ ...p, image: String(reader.result || '') }));
      reader.readAsDataURL(file);
    };

    const submit = () => {
      if (!selectedItem?._id) return;
      if (!editForm.name.trim() || !editForm.units) return;
      handleEditItem(selectedItem._id, { name: editForm.name.trim(), units: Number(editForm.units), image: editForm.image });
    };

    if (!isEditModalOpen || !selectedItem) return null;

    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>Edit Packaging Item</h3>
            <button
              style={styles.iconBtn}
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedItem(null);
              }}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Item Name</label>
            <input
              style={styles.input}
              value={editForm.name}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Units</label>
            <input
              style={styles.input}
              type="number"
              value={editForm.units}
              onChange={(e) => setEditForm((p) => ({ ...p, units: e.target.value }))}
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />

          <div style={styles.uploadBox} onClick={onPickFile}>
            <Upload size={18} />
            <span>{editForm.image ? 'Change image' : 'Upload image'}</span>
          </div>

          {editForm.image ? <img alt="preview" src={editForm.image} style={styles.preview} /> : null}

          <div style={styles.actions}>
            <button
              style={styles.ghostButton}
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedItem(null);
              }}
            >
              Cancel
            </button>
            <button style={styles.primaryButton} onClick={submit}>Update</button>
          </div>
        </div>
      </div>
    );
  };

  const DeleteConfirm = () => {
    if (!isDeleteConfirmOpen) return null;

    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>Confirm Delete</h3>
            <button style={styles.iconBtn} onClick={() => setIsDeleteConfirmOpen(false)} title="Close">
              <X size={16} />
            </button>
          </div>

          <p style={{ marginTop: 12 }}>
            Delete <b>{itemToDelete?.name}</b>? This cannot be undone.
          </p>

          <div style={styles.actions}>
            <button style={styles.ghostButton} onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</button>
            <button style={styles.dangerButton} onClick={() => handleDeleteItem(itemToDelete?._id)}>Delete</button>
          </div>
        </div>
      </div>
    );
  };

  /* ===================== UI ===================== */
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Packaging Items</h1>
          <p style={styles.subtitle}>Manage packaging inventory ({filteredItems.length})</p>
        </div>

        <button
          style={styles.addButton}
          onClick={() => {
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} /> Add Item
        </button>
      </div>

      <div style={styles.grid}>
        {isLoading ? (
          <p>Loading...</p>
        ) : paginatedItems.length ? (
          paginatedItems.map((item) => (
            <div key={item._id} style={styles.card}>
              <div style={styles.row}>
                <h3 style={{ margin: 0 }}>{item.name}</h3>
                <span style={styles.pill}>{item.units} units</span>
              </div>

              <div style={{ marginTop: 8, color: '#6b7280', display: 'flex', gap: 8, alignItems: 'center' }}>
                <Calendar size={14} />
                <span>{new Date(item.addedDate || item.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>

              {item.image ? (
                <img
                  alt={item.name}
                  src={item.image}
                  style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12, marginTop: 12 }}
                />
              ) : null}

              <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                <button
                  style={styles.iconBtn}
                  onClick={() => {
                    setSelectedItem(item);
                    setEditForm({
                      name: item.name || '',
                      units: String(item.units ?? ''),
                      image: item.image || '',
                    });
                    setIsEditModalOpen(true);
                  }}
                  title="Edit"
                >
                  <Edit size={16} />
                </button>

                <button
                  style={styles.iconBtn}
                  onClick={() => {
                    setItemToDelete(item);
                    setIsDeleteConfirmOpen(true);
                  }}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No items found</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <div style={{ color: '#6b7280' }}>
            Page {currentPage} of {totalPages}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              style={styles.pageBtn}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  style={currentPage === p ? styles.pageBtnActive : styles.pageBtn}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              );
            })}

            <button
              style={styles.pageBtn}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddModal />
      <EditModal />
      <DeleteConfirm />
    </div>
  );
};

export default PackagingInventory;
