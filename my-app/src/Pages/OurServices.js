// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useUser } from "./UserContext";
// import { styles } from "../assets/css/ServiceManagementSystem.styles";
// import Dialog from '@mui/material/Dialog';
// import DialogActions from '@mui/material/DialogActions';
// import DialogContent from '@mui/material/DialogContent';
// import DialogContentText from '@mui/material/DialogContentText';
// import DialogTitle from '@mui/material/DialogTitle';
// import Button from '@mui/material/Button';
// import Pagination from '@mui/material/Pagination';
// import MenuItem from '@mui/material/MenuItem';
// import Select from '@mui/material/Select';
// import FormControl from '@mui/material/FormControl';
// import InputLabel from '@mui/material/InputLabel';

// const API_BASE = "http://localhost:5002/api";

// const ServiceManagementSystem = () => {
//   const { user } = useUser();
//   const [showAddServiceDialog, setShowAddServiceDialog] = useState(false);
//   const [showDetailsDialog, setShowDetailsDialog] = useState(false);
//   const [currentStep, setCurrentStep] = useState(1);
//   const [services, setServices] = useState([]);
//   const [selectedService, setSelectedService] = useState(null);
//   const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
//   const [serviceToDelete, setServiceToDelete] = useState(null);
//   const [formData, setFormData] = useState({
//     serialNo: "",
//     modelNo: "",
//     warrantyStatus: "Under Warranty",
//     receivedDate: "",
//     customerName: "",
//     customerPhone: "",
//     customerAddress: "",
//     problemDescription: "",
//     productImage: null,
//   });
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(10);
//   const [statusFilter, setStatusFilter] = useState("All");

//   useEffect(() => {
//     fetchServices();
//   }, [user?.role]);

//   const fetchServices = async () => {
//     try {
//       const res = await axios.get(`${API_BASE}/services`);
//       let data = res.data;
//       if (user?.role) {
//         data = data.filter(
//           (s) => s.storeName && s.storeName.toLowerCase() === user.role.toLowerCase()
//         );
//       }
//       setServices(data);
//     } catch (err) {
//       console.error("Error fetching services:", err);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleImageUpload = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setFormData((prev) => ({
//         ...prev,
//         productImage: file,
//       }));
//     }
//   };

//   const handleNextStep = () => {
//     if (
//       !formData.serialNo ||
//       !formData.modelNo ||
//       !formData.customerName ||
//       !formData.customerPhone ||
//       !formData.customerAddress ||
//       !formData.problemDescription ||
//       !formData.receivedDate
//     ) {
//       alert("Please fill in all required fields");
//       return;
//     }
//     setCurrentStep(2);
//   };

//   const handleBack = () => {
//     setCurrentStep(1);
//   };

//   const handleSubmit = async () => {
//     try {
//       const payload = new FormData();
//       Object.entries(formData).forEach(([key, value]) => {
//         if (value) payload.append(key, value);
//       });
//       if (selectedService) {
//         await axios.put(`${API_BASE}/services/${selectedService._id}`, payload, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//         alert("✅ Service updated successfully!");
//       } else {
//         payload.append("serviceId", `SRV${Math.floor(Math.random() * 10000)}`);
//         payload.append("status", "PENDING");
//         payload.append("storeName", user?.role || "N/A");
//         payload.append("createdBy", user?.name || "Unknown");
//         await axios.post(`${API_BASE}/services`, payload, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//         alert("✅ Service submitted successfully!");
//       }
//       setShowAddServiceDialog(false);
//       setCurrentStep(1);
//       setFormData({
//         serialNo: "",
//         modelNo: "",
//         warrantyStatus: "Under Warranty",
//         receivedDate: "",
//         customerName: "",
//         customerPhone: "",
//         customerAddress: "",
//         problemDescription: "",
//         productImage: null,
//       });
//       setSelectedService(null);
//       fetchServices();
//     } catch (err) {
//       console.error("Error submitting service:", err);
//       alert("❌ Failed to submit service");
//     }
//   };

//   const handleCloseDialog = () => {
//     setShowAddServiceDialog(false);
//     setCurrentStep(1);
//     setSelectedService(null);
//   };

//   const handleViewDetails = (service) => {
//     setSelectedService(service);
//     setShowDetailsDialog(true);
//   };

//   const handleEditService = (service) => {
//     setFormData({
//       serialNo: service.serialNo,
//       modelNo: service.modelNo,
//       warrantyStatus: service.warrantyStatus,
//       receivedDate: new Date(service.receivedDate).toISOString().split('T')[0],
//       customerName: service.customerName,
//       customerPhone: service.customerPhone,
//       customerAddress: service.customerAddress,
//       problemDescription: service.problemDescription,
//       productImage: null,
//     });
//     setSelectedService(service);
//     setShowAddServiceDialog(true);
//     setCurrentStep(2);
//   };

//   const handleDeleteService = (id) => {
//     setServiceToDelete(id);
//     setOpenDeleteDialog(true);
//   };

//   const handleConfirmDelete = async () => {
//     try {
//       await axios.delete(`${API_BASE}/services/${serviceToDelete}`);
//       alert("Service deleted successfully!");
//       fetchServices();
//     } catch (err) {
//       console.error("Error deleting service:", err);
//       alert("Failed to delete service");
//     } finally {
//       setOpenDeleteDialog(false);
//       setServiceToDelete(null);
//     }
//   };

//   const handleCancelDelete = () => {
//     setOpenDeleteDialog(false);
//     setServiceToDelete(null);
//   };

//   const handlePageChange = (event, value) => {
//     setCurrentPage(value);
//   };

//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const filteredServices = services.filter((s) =>
//     statusFilter === "All" ? true : s.status === statusFilter
//   );
//   const currentServices = filteredServices.slice(indexOfFirstItem, indexOfLastItem);
//   const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

//   return (
//     <div style={styles.container}>
//       {/* HEADER */}
//       <div style={styles.header}>
//         <div style={styles.headerLeft}>
//           <svg
//             style={styles.boxIcon}
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//           >
//             <path
//               d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
//               strokeWidth="2"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//             />
//           </svg>
//           <h1 style={styles.headerH1}>Our Services</h1>
//              <FormControl style={{ marginRight: '16px', minWidth: 150 }}>
//           <InputLabel>Status</InputLabel>
//           <Select
//             value={statusFilter}
//             onChange={(e) => {
//               setStatusFilter(e.target.value);
//               setCurrentPage(1);
//             }}
//             label="Status"
//           >
//             <MenuItem value="All">All Status</MenuItem>
//             <MenuItem value="PENDING">Pending</MenuItem>
//             <MenuItem value="PAYMENT_PROCESSED">Payment Processed</MenuItem>
//             <MenuItem value="COMPLETED">Completed</MenuItem>
//           </Select>
//         </FormControl>
//         </div>
//         <button
//           style={styles.btnAddService}
//           onClick={() => {
//             setSelectedService(null);
//             setShowAddServiceDialog(true);
//           }}
//         >
//           <span style={styles.plusIcon}>+</span>
//           Add Service
//         </button>
//       </div>
//       {/* TABLE */}
//       <div style={styles.tableWrapper}>
//         <table style={styles.servicesTable}>
//           <thead style={styles.tableHead}>
//             <tr>
//               <th style={styles.tableHeaderCell}>Serial No</th>
//               <th style={styles.tableHeaderCell}>Customer Name</th>
//               <th style={styles.tableHeaderCell}>Model No</th>
//               <th style={styles.tableHeaderCell}>Received Date</th>
//               <th style={styles.tableHeaderCell}>Amount</th>
//               <th style={styles.tableHeaderCell}>Product Image</th>
//               <th style={styles.tableHeaderCell}>Store</th>
//               <th style={styles.tableHeaderCell}>Status</th>
//               <th style={styles.tableHeaderCell}>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {currentServices.map((s) => (
//               <tr key={s._id}>
//                 <td style={styles.tableCell}>{s.serviceId}</td>
//                 <td style={styles.tableCell}>{s.customerName}</td>
//                 <td style={styles.tableCell}>{s.modelNo}</td>
//                 <td style={styles.tableCell}>
//                   {new Date(s.receivedDate).toLocaleDateString()}
//                 </td>
//                 <td style={styles.tableCell}>
//                   {s.paymentAmount !== 'Not Processed' ? `₹ ${s.paymentAmount}` : 'Not Processed'}
//                 </td>
//                 <td style={styles.tableCell}>
//                   {s.productImage ? (
//                     <img
//                       src={`http://localhost:5002/uploads/${s.productImage}`}
//                       alt="Product"
//                       style={{
//                         width: '60px',
//                         height: '60px',
//                         objectFit: 'cover',
//                         borderRadius: '8px',
//                         border: '1px solid #ddd',
//                       }}
//                       onError={(e) => {
//                         e.target.onerror = null;
//                         e.target.src = 'https://via.placeholder.com/60?text=No+Image';
//                       }}
//                     />
//                   ) : (
//                     <span style={{ color: '#999' }}>No Image</span>
//                   )}
//                 </td>
//                 <td style={styles.tableCell}>{s.storeName || "N/A"}</td>
//                 <td style={styles.tableCell}>
//                   <span style={{
//                     ...styles.statusBadge, color: '#ffff', padding: '6px', borderRadius: '4px',
//                     backgroundColor: s.status === 'COMPLETED' ? '#10b981' : s.status === 'PAYMENT_PROCESSED' ? '#f59e0b' : '#ef4444'
//                   }}>
//                     {s.status}
//                   </span>
//                 </td>
//                 <td style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', marginTop:'12%' }}>
//                   <button
//                     style={styles.btnViewDetails}
//                     onClick={() => handleViewDetails(s)}
//                   >
//                     <svg style={styles.eyeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
//                       <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2" />
//                       <circle cx="12" cy="12" r="3" strokeWidth="2" />
//                     </svg>
//                   </button>
//                   <button
//                     style={styles.btnEdit}
//                     onClick={() => handleEditService(s)}
//                   >
//                     <svg style={styles.editIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
//                       <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2" />
//                       <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" />
//                     </svg>
//                   </button>
//                   <button
//                     style={styles.btnDelete}
//                     onClick={() => handleDeleteService(s._id)}
//                   >
//                     <svg style={styles.deleteIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
//                       <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2" />
//                     </svg>
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//         {/* Pagination */}
//         <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px',marginBottom:'20px' }}>   
//           <Pagination
//             count={totalPages}
//             page={currentPage}
//             onChange={handlePageChange}
//             color="primary"
//             shape="rounded"
//           />
//         </div>
//       </div>
//       {/* ADD SERVICE DIALOG */}
//       {showAddServiceDialog && (
//         <div style={styles.dialogOverlay} onClick={handleCloseDialog}>
//           <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
//             <div style={styles.dialogHeader}>
//               <h2 style={styles.dialogHeaderH2}>
//                 {selectedService ? "Edit Service" : "Add New Service"} - Step {currentStep}/2
//               </h2>
//               <button style={styles.btnClose} onClick={handleCloseDialog}>
//                 ×
//               </button>
//             </div>
//             <div style={styles.dialogBody}>
//               {currentStep === 1 ? (
//                 <>
//                   {/* FORM FIELDS */}
//                   {[
//                     ["serialNo", "Serial No", "Enter serial number"],
//                     ["modelNo", "Model No", "Enter model number"],
//                     ["customerName", "Customer Name", "Enter customer name"],
//                     ["customerPhone", "Customer Phone", "Enter phone number"],
//                     ["customerAddress", "Customer Address", "Enter full address"],
//                   ].map(([name, label, placeholder]) => (
//                     <div key={name} style={styles.formGroup}>
//                       <label style={styles.formGroupLabel}>
//                         {label} <span style={styles.required}>*</span>
//                       </label>
//                       <input
//                         type="text"
//                         name={name}
//                         placeholder={placeholder}
//                         value={formData[name]}
//                         onChange={handleInputChange}
//                         style={styles.formGroupInput}
//                       />
//                     </div>
//                   ))}
//                   {/* Warranty + Date */}
//                   <div style={styles.formGroup}>
//                     <label style={styles.formGroupLabel}>Warranty Status</label>
//                     <select
//                       name="warrantyStatus"
//                       value={formData.warrantyStatus}
//                       onChange={handleInputChange}
//                       style={styles.formGroupInput}
//                     >
//                       <option value="Under Warranty">Under Warranty</option>
//                       <option value="Out of Warranty">Out of Warranty</option>
//                       <option value="Extended Warranty">Extended Warranty</option>
//                     </select>
//                   </div>
//                   <div style={styles.formGroup}>
//                     <label style={styles.formGroupLabel}>Received Date</label>
//                     <input
//                       type="date"
//                       name="receivedDate"
//                       value={formData.receivedDate}
//                       onChange={handleInputChange}
//                       style={styles.formGroupInput}
//                     />
//                   </div>
//                   {/* Problem Description */}
//                   <div style={styles.formGroup}>
//                     <label style={styles.formGroupLabel}>Problem Description</label>
//                     <textarea
//                       name="problemDescription"
//                       placeholder="Describe the issue..."
//                       rows="3"
//                       value={formData.problemDescription}
//                       onChange={handleInputChange}
//                       style={{
//                         ...styles.formGroupInput,
//                         ...styles.formGroupTextarea,
//                       }}
//                     />
//                   </div>
//                   {/* Upload Image */}
//                   <div style={styles.formGroup}>
//                     <label style={styles.formGroupLabel}>Product Image</label>
//                     <div
//                       style={styles.uploadArea}
//                       onClick={() =>
//                         document.getElementById("imageInput").click()
//                       }
//                     >
//                       <svg
//                         style={styles.cameraIcon}
//                         viewBox="0 0 24 24"
//                         fill="none"
//                         stroke="currentColor"
//                       >
//                         <path
//                           d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
//                           strokeWidth="2"
//                         />
//                         <circle cx="12" cy="13" r="4" strokeWidth="2" />
//                       </svg>
//                       <span style={styles.uploadAreaSpan}>
//                         {formData.productImage
//                           ? formData.productImage.name
//                           : "Upload Image"}
//                       </span>
//                     </div>
//                     <input
//                       id="imageInput"
//                       type="file"
//                       accept="image/*"
//                       onChange={handleImageUpload}
//                       style={{ display: "none" }}
//                     />
//                   </div>
//                   <div style={styles.dialogFooter}>
//                     <button style={styles.btnNext} onClick={handleNextStep}>
//                       Next Step
//                     </button>
//                   </div>
//                 </>
//               ) : (
//                 <>
//                   {/* REVIEW SECTION */}
//                   <div style={styles.reviewSection}>
//                     <div style={styles.reviewHeader}>
//                       <h3 style={styles.reviewHeaderH3}>
//                         Review Your Service Request
//                       </h3>
//                       <p style={styles.reviewHeaderP}>
//                         Please review details before submitting
//                       </p>
//                     </div>
//                     <div style={styles.reviewGrid}>
//                       <div style={styles.reviewItem}>
//                         <label style={styles.reviewItemLabel}>Customer</label>
//                         <p style={styles.reviewItemP}>{formData.customerName}</p>
//                       </div>
//                       <div style={styles.reviewItem}>
//                         <label style={styles.reviewItemLabel}>Model</label>
//                         <p style={styles.reviewItemP}>{formData.modelNo}</p>
//                       </div>
//                       <div style={styles.reviewItem}>
//                         <label style={styles.reviewItemLabel}>Serial No</label>
//                         <p style={styles.reviewItemP}>{formData.serialNo}</p>
//                       </div>
//                       <div style={styles.reviewItem}>
//                         <label style={styles.reviewItemLabel}>Warranty</label>
//                         <p
//                           style={{
//                             ...styles.reviewItemP,
//                             ...styles.warrantyBadge,
//                           }}
//                         >
//                           {formData.warrantyStatus}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                   <div style={styles.dialogFooterStep2}>
//                     <button style={styles.btnBack} onClick={handleBack}>
//                       Back
//                     </button>
//                     <button style={styles.btnSubmit} onClick={handleSubmit}>
//                       {selectedService ? "Update Service" : "Submit Service"}
//                     </button>
//                   </div>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//       {/* VIEW DETAILS DIALOG */}
//       {showDetailsDialog && selectedService && (
//         <div style={styles.dialogOverlay} onClick={() => setShowDetailsDialog(false)}>
//           <div style={{ ...styles.dialog, ...styles.dialogDetails }} onClick={(e) => e.stopPropagation()}>
//             <div style={{ ...styles.dialogHeader, background: "#2563eb" }}>
//               <h2 style={styles.dialogHeaderH2}>
//                 Service Details - {selectedService.serviceId}
//               </h2>
//               <button style={styles.btnClose} onClick={() => setShowDetailsDialog(false)}>
//                 ×
//               </button>
//             </div>
//             <div style={styles.dialogBody}>
//               <p><b>Serial Number:</b> {selectedService.serialNo}</p>
//               <p><b>Model Number:</b> {selectedService.modelNo}</p>
//               <p><b>Customer:</b> {selectedService.customerName}</p>
//               <p><b>Phone:</b> {selectedService.customerPhone}</p>
//               <p><b>Address:</b> {selectedService.customerAddress}</p>
//               <p><b>Problem:</b> {selectedService.problemDescription}</p>
//               <p><b>Store:</b> {selectedService.storeName}</p>
//               <p><b>Status:</b> {selectedService.status}</p>
//               <p><b>Payment Amount:</b> {selectedService.paymentAmount || 'Not Processed'}</p>
//               <p><b>Dispatch Status:</b> {selectedService.dispatchStatus || 'Not Dispatched'}</p>
//             </div>
//           </div>
//         </div>
//       )}
//       {/* DELETE CONFIRMATION DIALOG */}
//       <Dialog
//         open={openDeleteDialog}
//         onClose={handleCancelDelete}
//         aria-labelledby="alert-dialog-title"
//         aria-describedby="alert-dialog-description"
//       >
//         <DialogTitle id="alert-dialog-title">
//           {"Confirm Deletion"}
//         </DialogTitle>
//         <DialogContent>
//           <DialogContentText id="alert-dialog-description">
//             Are you sure you want to delete this service? This action cannot be undone.
//           </DialogContentText>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleCancelDelete}>Cancel</Button>
//           <Button onClick={handleConfirmDelete} autoFocus color="error">
//             Delete
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </div>
//   );
// };

// export default ServiceManagementSystem;


















import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useUser } from "./UserContext";
import { styles } from "../assets/css/ServiceManagementSystem.styles";

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';

import Pagination from '@mui/material/Pagination';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

const API_BASE = "http://localhost:5002/api";

const ServiceManagementSystem = () => {
  const { user } = useUser();

  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  const [formData, setFormData] = useState({
    serialNo: "",
    modelNo: "",
    quantity: "",
    warrantyStatus: "Under Warranty",
    receivedDate: "",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    problemDescription: "",
    productImage: null,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchServices = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/services`);
      let data = res.data;

      const activeStore = (
        user?.assignedLocation ||
        user?.warehouseName ||
        user?.serviceCenter ||
        user?.staffLocation ||
        user?.customerStore ||
        user?.role ||
        ''
      ).toLowerCase().trim();

      const isSuperAdmin = ['admin', 'super admin', 'manager'].includes(
        (user?.role || '').toLowerCase().trim()
      );

      if (
        user?.role &&
        (!isSuperAdmin ||
          (activeStore &&
            !['admin', 'super admin', 'manager'].includes(activeStore)))
      ) {
        data = (data || []).filter((s) => {
          const store = (s.storeName || '').toLowerCase().trim();
          return (
            store === activeStore ||
            store.includes(activeStore) ||
            activeStore.includes(store) ||
            store === (user?.role || '').toLowerCase().trim()
          );
        });
      }
      setServices(data);
    } catch (err) {
      console.error("Error fetching services:", err);
    }
  }, [user]);

  // ✅ ESLint safe
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, productImage: file }));
    }
  };

  const handleNextStep = () => {
    if (
      !formData.serialNo ||
      !formData.modelNo ||
      !formData.quantity ||
      !formData.customerName ||
      !formData.customerPhone ||
      !formData.customerAddress ||
      !formData.problemDescription ||
      !formData.receivedDate
    ) {
      alert("Please fill in all required fields");
      return;
    }
    setCurrentStep(2);
  };

  const handleBack = () => setCurrentStep(1);

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      serialNo: "",
      modelNo: "",
      quantity: "",
      warrantyStatus: "Under Warranty",
      receivedDate: "",
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      problemDescription: "",
      productImage: null,
    });
  };

  const handleSubmit = async () => {
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") payload.append(key, value);
      });

      if (selectedService) {
        await axios.put(`${API_BASE}/services/${selectedService._id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("✅ Service updated successfully!");
      } else {
        payload.append("serviceId", `SRV${Math.floor(Math.random() * 10000)}`);
        payload.append("status", "PENDING");
        payload.append("storeName", user?.role || "N/A");
        payload.append("createdBy", user?.name || "Unknown");

        await axios.post(`${API_BASE}/services`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("✅ Service submitted successfully!");
      }

      setShowAddServiceDialog(false);
      setSelectedService(null);
      resetForm();
      fetchServices();
    } catch (err) {
      console.error("Error submitting service:", err);
      alert("❌ Failed to submit service");
    }
  };

  const handleCloseDialog = () => {
    setShowAddServiceDialog(false);
    setSelectedService(null);
    resetForm();
  };

  const handleViewDetails = (service) => {
    setSelectedService(service);
    setShowDetailsDialog(true);
  };

  const handleEditService = (service) => {
    setFormData({
      serialNo: service.serialNo || "",
      modelNo: service.modelNo || "",
      quantity: service.quantity || "",
      warrantyStatus: service.warrantyStatus || "Under Warranty",
      receivedDate: service.receivedDate ? new Date(service.receivedDate).toISOString().split('T')[0] : "",
      customerName: service.customerName || "",
      customerPhone: service.customerPhone || "",
      customerAddress: service.customerAddress || "",
      problemDescription: service.problemDescription || "",
      productImage: null,
    });
    setSelectedService(service);
    setShowAddServiceDialog(true);
    setCurrentStep(2);
  };

  const handleDeleteService = (id) => {
    setServiceToDelete(id);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/services/${serviceToDelete}`);
      alert("Service deleted successfully!");
      fetchServices();
    } catch (err) {
      console.error("Error deleting service:", err);
      alert("Failed to delete service");
    } finally {
      setOpenDeleteDialog(false);
      setServiceToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
    setServiceToDelete(null);
  };

  const handlePageChange = (_event, value) => {
    setCurrentPage(value);
  };

  const filteredServices = services.filter((s) =>
    statusFilter === "All" ? true : s.status === statusFilter
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentServices = filteredServices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <svg style={styles.boxIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <h1 style={styles.headerH1}>Our Services</h1>

          <FormControl style={{ marginRight: '16px', minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              label="Status"
            >
              <MenuItem value="All">All Status</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="PAYMENT_PROCESSED">Payment Processed</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
            </Select>
          </FormControl>
        </div>

        <button
          style={styles.btnAddService}
          onClick={() => {
            setSelectedService(null);
            resetForm();
            setShowAddServiceDialog(true);
          }}
        >
          <span style={styles.plusIcon}>+</span>
          Add Service
        </button>
      </div>

      {/* TABLE */}
      <div style={styles.tableWrapper}>
        <table style={styles.servicesTable}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.tableHeaderCell}>Serial No</th>
              <th style={styles.tableHeaderCell}>Customer Name</th>
              <th style={styles.tableHeaderCell}>Model No</th>
              <th style={styles.tableHeaderCell}>Quantity</th>
              <th style={styles.tableHeaderCell}>Received Date</th>
              <th style={styles.tableHeaderCell}>Amount</th>
              <th style={styles.tableHeaderCell}>Product Image</th>
              <th style={styles.tableHeaderCell}>Store</th>
              <th style={styles.tableHeaderCell}>Status</th>
              <th style={styles.tableHeaderCell}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {currentServices.map((s) => (
              <tr key={s._id}>
                <td style={styles.tableCell}>{s.serviceId}</td>
                <td style={styles.tableCell}>{s.customerName}</td>
                <td style={styles.tableCell}>{s.modelNo}</td>
                <td style={styles.tableCell}>{s.quantity}</td>
                <td style={styles.tableCell}>{new Date(s.receivedDate).toLocaleDateString()}</td>
                <td style={styles.tableCell}>
                  {s.paymentAmount !== 'Not Processed' ? `₹ ${s.paymentAmount}` : 'Not Processed'}
                </td>

                <td style={styles.tableCell}>
                  {s.productImage ? (
                    <img
                      src={`http://localhost:5002/uploads/${s.productImage}`}
                      alt="Product"
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/60?text=No+Image';
                      }}
                    />
                  ) : (
                    <span style={{ color: '#999' }}>No Image</span>
                  )}
                </td>

                <td style={styles.tableCell}>{s.storeName || "N/A"}</td>

                <td style={styles.tableCell}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      color: '#fff',
                      padding: '6px',
                      borderRadius: '4px',
                      backgroundColor:
                        s.status === 'COMPLETED'
                          ? '#10b981'
                          : s.status === 'PAYMENT_PROCESSED'
                            ? '#f59e0b'
                            : '#ef4444',
                    }}
                  >
                    {s.status}
                  </span>
                </td>

                <td style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', marginTop: '12%' }}>
                  <button style={styles.btnViewDetails} onClick={() => handleViewDetails(s)}>
                    <svg style={styles.eyeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2" />
                      <circle cx="12" cy="12" r="3" strokeWidth="2" />
                    </svg>
                  </button>

                  <button style={styles.btnEdit} onClick={() => handleEditService(s)}>
                    <svg style={styles.editIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" />
                    </svg>
                  </button>

                  <button style={styles.btnDelete} onClick={() => handleDeleteService(s._id)}>
                    <svg style={styles.deleteIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', marginBottom: '20px' }}>
          <Pagination
            count={totalPages || 1}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
          />
        </div>
      </div>

      {/* ADD SERVICE DIALOG */}
      {showAddServiceDialog && (
        <div style={styles.dialogOverlay} onClick={handleCloseDialog}>
          <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <div style={styles.dialogHeader}>
              <h2 style={styles.dialogHeaderH2}>
                {selectedService ? "Edit Service" : "Add New Service"} - Step {currentStep}/2
              </h2>
              <button style={styles.btnClose} onClick={handleCloseDialog}>×</button>
            </div>

            <div style={styles.dialogBody}>
              {currentStep === 1 ? (
                <>
                  {[
                    ["serialNo", "Serial No", "Enter serial number", "text"],
                    ["modelNo", "Model No", "Enter model number", "text"],
                    ["quantity", "Quantity", "Enter quantity", "number"],
                    ["customerName", "Customer Name", "Enter customer name", "text"],
                    ["customerPhone", "Customer Phone", "Enter phone number", "text"],
                    ["customerAddress", "Customer Address", "Enter full address", "text"],
                  ].map(([name, label, placeholder, type]) => (
                    <div key={name} style={styles.formGroup}>
                      <label style={styles.formGroupLabel}>
                        {label} <span style={styles.required}>*</span>
                      </label>
                      <input
                        type={type}
                        name={name}
                        placeholder={placeholder}
                        value={formData[name]}
                        onChange={handleInputChange}
                        style={styles.formGroupInput}
                      />
                    </div>
                  ))}

                  <div style={styles.formGroup}>
                    <label style={styles.formGroupLabel}>Warranty Status</label>
                    <select
                      name="warrantyStatus"
                      value={formData.warrantyStatus}
                      onChange={handleInputChange}
                      style={styles.formGroupInput}
                    >
                      <option value="Under Warranty">Under Warranty</option>
                      <option value="Out of Warranty">Out of Warranty</option>
                      <option value="Extended Warranty">Extended Warranty</option>
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formGroupLabel}>Received Date</label>
                    <input
                      type="date"
                      name="receivedDate"
                      value={formData.receivedDate}
                      onChange={handleInputChange}
                      style={styles.formGroupInput}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formGroupLabel}>Problem Description</label>
                    <textarea
                      name="problemDescription"
                      placeholder="Describe the issue..."
                      rows="3"
                      value={formData.problemDescription}
                      onChange={handleInputChange}
                      style={{ ...styles.formGroupInput, ...styles.formGroupTextarea }}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formGroupLabel}>Product Image</label>
                    <div
                      style={styles.uploadArea}
                      onClick={() => document.getElementById("imageInput")?.click()}
                    >
                      <svg style={styles.cameraIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                          strokeWidth="2"
                        />
                        <circle cx="12" cy="13" r="4" strokeWidth="2" />
                      </svg>
                      <span style={styles.uploadAreaSpan}>
                        {formData.productImage ? formData.productImage.name : "Upload Image"}
                      </span>
                    </div>

                    <input
                      id="imageInput"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: "none" }}
                    />
                  </div>

                  <div style={styles.dialogFooter}>
                    <button style={styles.btnNext} onClick={handleNextStep}>Next Step</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={styles.reviewSection}>
                    <div style={styles.reviewHeader}>
                      <h3 style={styles.reviewHeaderH3}>Review Your Service Request</h3>
                      <p style={styles.reviewHeaderP}>Please review details before submitting</p>
                    </div>

                    <div style={styles.reviewGrid}>
                      <div style={styles.reviewItem}>
                        <label style={styles.reviewItemLabel}>Customer</label>
                        <p style={styles.reviewItemP}>{formData.customerName}</p>
                      </div>

                      <div style={styles.reviewItem}>
                        <label style={styles.reviewItemLabel}>Model</label>
                        <p style={styles.reviewItemP}>{formData.modelNo}</p>
                      </div>

                      <div style={styles.reviewItem}>
                        <label style={styles.reviewItemLabel}>Quantity</label>
                        <p style={styles.reviewItemP}>{formData.quantity}</p>
                      </div>

                      <div style={styles.reviewItem}>
                        <label style={styles.reviewItemLabel}>Serial No</label>
                        <p style={styles.reviewItemP}>{formData.serialNo}</p>
                      </div>

                      <div style={styles.reviewItem}>
                        <label style={styles.reviewItemLabel}>Warranty</label>
                        <p style={{ ...styles.reviewItemP, ...styles.warrantyBadge }}>
                          {formData.warrantyStatus}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={styles.dialogFooterStep2}>
                    <button style={styles.btnBack} onClick={handleBack}>Back</button>
                    <button style={styles.btnSubmit} onClick={handleSubmit}>
                      {selectedService ? "Update Service" : "Submit Service"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS DIALOG */}
      {showDetailsDialog && selectedService && (
        <div style={styles.dialogOverlay} onClick={() => setShowDetailsDialog(false)}>
          <div style={{ ...styles.dialog, ...styles.dialogDetails }} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...styles.dialogHeader, background: "#2563eb" }}>
              <h2 style={styles.dialogHeaderH2}>Service Details - {selectedService.serviceId}</h2>
              <button style={styles.btnClose} onClick={() => setShowDetailsDialog(false)}>×</button>
            </div>

            <div style={styles.dialogBody}>
              <p><b>Serial Number:</b> {selectedService.serialNo}</p>
              <p><b>Model Number:</b> {selectedService.modelNo}</p>
              <p><b>Quantity:</b> {selectedService.quantity}</p>
              <p><b>Customer:</b> {selectedService.customerName}</p>
              <p><b>Phone:</b> {selectedService.customerPhone}</p>
              <p><b>Address:</b> {selectedService.customerAddress}</p>
              <p><b>Problem:</b> {selectedService.problemDescription}</p>
              <p><b>Store:</b> {selectedService.storeName}</p>
              <p><b>Status:</b> {selectedService.status}</p>
              <p><b>Payment Amount:</b> {selectedService.paymentAmount || 'Not Processed'}</p>
              <p><b>Dispatch Status:</b> {selectedService.dispatchStatus || 'Not Dispatched'}</p>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this service? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} autoFocus color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ServiceManagementSystem;
