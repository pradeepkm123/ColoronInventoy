const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/serviceRequestController');
const rmaController = require('../controllers/rmaController');

// ================= SERVICE REQUESTS ROUTES =================
// 1. Create Service Request (Raise Service)
router.post('/service/requests', serviceRequestController.createServiceRequest);

// 2. Get All Service Requests (Filtered / Scoped by Store)
router.get('/service/requests', serviceRequestController.getAllServiceRequests);

// 3. Scan Serial Barcode & Auto Warranty Lookup
router.get('/service/warranty-lookup/:serialNumber', serviceRequestController.validateSerialAndWarranty);

// 4. Product Check-In (Validates Serial & Generates RMA + Inventory +1)
router.post('/service/requests/:id/check-in', serviceRequestController.checkInProduct);


// ================= RMA LIFECYCLE ROUTES =================
// 5. Get All RMAs
router.get('/rma', rmaController.getAllRMAs);

// 6. Service Person Performance & Workload Hub Analytics (Static route must precede :id)
router.get('/rma/service-person-performance', rmaController.getServicePersonPerformance);

// 7. Failure Code Catalog
router.get('/rma-masters/failure-codes', rmaController.getFailureCodes);

// 8. Real-Time Service & RMA Dashboard Live Metrics
router.get('/service/dashboard-stats', rmaController.getServiceDashboardStats);

// 9. Service Details & Exact Work Breakdown
router.get('/rma/:id/service-details', rmaController.getRMAServiceDetails);

// 10. Get Single RMA 360° Profile & Audit History
router.get('/rma/:id', rmaController.getRMADetails);

// 11. Controlled Status Transition
router.put('/rma/:id/status', rmaController.updateRMAStatus);

// 12. Initial Inspection
router.post('/rma/:id/inspection', rmaController.recordInitialInspection);

// 13. Engineer Assignment & Allocation by Super Admin
router.post('/rma/:id/assign', rmaController.assignServiceToEngineer);

// 14. Service Person Accept Assignment
router.post('/rma/:id/accept', rmaController.acceptServiceAssignment);

// 15. Start Service Action by Service Person
router.post('/rma/:id/start-service', rmaController.startService);

// 16. Engineer Diagnosis
router.post('/rma/:id/diagnosis', rmaController.assignEngineerAndDiagnosis);

// 17. Record Exact Work Performed, Spares & QC
router.post('/rma/:id/work-details', rmaController.recordServiceWorkDetails);

// 18. Chargeable Estimate & Customer Approval
router.post('/rma/:id/estimate', rmaController.updateEstimateAndApproval);

// 19. Repair Lifecycle Action (Start / Pause / Resume / Complete)
router.post('/rma/:id/repair', rmaController.updateRepairAction);

// 20. Quality Control & Burn-In Testing
router.post('/rma/:id/qc', rmaController.recordQCResult);

// 21. Dispatch RMA (Stock Ledger -1 & Customer Notification)
router.post('/rma/:id/dispatch', rmaController.dispatchRMA);

// 22. Request Dispatch Approval (Service Person -> Super Admin)
router.post('/rma/:id/request-dispatch-approval', rmaController.requestDispatchApproval);

// 23. Approve / Reject Dispatch Permission (Super Admin -> Service Person)
router.post('/rma/:id/approve-dispatch', rmaController.approveDispatchPermission);

module.exports = router;
