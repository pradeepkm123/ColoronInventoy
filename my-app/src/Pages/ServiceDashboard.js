import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from './UserContext';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Snackbar,
  Avatar,
  Tooltip,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Wrench,
  Layers,
  Inbox,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
  Barcode,
  Activity,
  ShieldCheck,
  Search,
  X,
  AlertCircle,
  Zap,
  Flame,
  UserCheck,
  User,
  UserX,
  Calendar,
  Bell,
  Play,
  Send,
  Eye,
  Check,
  FileText,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Plus,
  Trash2,
  CheckSquare,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

const API_BASE = 'https://coloroninventoy.onrender.com/api';

export default function ServiceDashboard() {
  const { user } = useUser();

  const roleLower = (user?.role || '').toLowerCase().trim();
  const isSuperAdmin = ['admin', 'super admin', 'manager', 'headoffice'].includes(roleLower) || roleLower.includes('admin');
  const isServicePerson = !isSuperAdmin && (
    roleLower === 'service person' ||
    roleLower === 'service engineer' ||
    roleLower === 'technician' ||
    roleLower === 'engineer' ||
    (roleLower.includes('service') && !roleLower.includes('center') && !roleLower.includes('shoppee') && !roleLower.includes('shop') && !roleLower.includes('store') && !roleLower.includes('customer'))
  );
  const isOtherLogin = !isSuperAdmin && !isServicePerson; // Store, Dealer, Customer, Warehouse, etc.

  const activeStore = (
    user?.assignedLocation ||
    user?.warehouseName ||
    user?.serviceCenter ||
    user?.staffLocation ||
    user?.customerStore ||
    user?.role ||
    ''
  );

  // Time Range Filter for Super Admin Performance Hub
  const [timeRange, setTimeRange] = useState('THIS_MONTH'); // 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Performance Data State (from /api/rma/service-person-performance)
  const [perfData, setPerfData] = useState({
    totalRma: 0,
    allocated: 0,
    accepted: 0,
    inProcess: 0,
    waitingForSpare: 0,
    qcTesting: 0,
    completed: 0,
    overdue: 0,
    servicePersons: []
  });
  const [perfLoading, setPerfLoading] = useState(false);

  // Legacy/Live stats state for technician action queue
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalRMAs: 0,
    newAssignments: 0,
    pendingRMAs: 0,
    activeServices: 0,
    completedRMAs: 0,
    waitingProduct: 0,
    underRepair: 0,
    inQC: 0,
    readyDispatch: 0,
    dispatchedClosed: 0,
    unassignedCount: 0,
    urgentCount: 0,
    urgentAssignments: [],
    recentRMAs: [],
    recentHistory: []
  });
  const [loading, setLoading] = useState(true);

  // Pagination & Search
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'NEW' | 'URGENT' | 'ACTIVE' | 'DONE'

  // Selected Service Person for Drilldown (Super Admin)
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [technicianModalOpen, setTechnicianModalOpen] = useState(false);

  // Exact Service Details Modal State (360° Work Details)
  const [serviceDetailsModalOpen, setServiceDetailsModalOpen] = useState(false);
  const [selectedRmaServiceDetails, setSelectedRmaServiceDetails] = useState(null);
  const [loadingServiceDetails, setLoadingServiceDetails] = useState(false);

  // Modern In-App Notification / Toast State
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const showToast = (message, severity = 'info') => {
    setToast({ open: true, message, severity });
  };
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Starting & Accepting state
  const [startingRmaId, setStartingRmaId] = useState(null);
  const [acceptingRmaId, setAcceptingRmaId] = useState(null);

  // Super Admin Allocation Dialog State
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [targetRMA, setTargetRMA] = useState(null);
  const [servicePersonsList, setServicePersonsList] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignForm, setAssignForm] = useState({
    engineerId: '',
    engineerName: '',
    engineerEmail: '',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    assignmentNotes: ''
  });

  // Service Person "Update Work Details" Modal State
  const [workDetailsModalOpen, setWorkDetailsModalOpen] = useState(false);
  const [workDetailsTargetRMA, setWorkDetailsTargetRMA] = useState(null);
  const [savingWorkDetails, setSavingWorkDetails] = useState(false);
  const [workDetailsForm, setWorkDetailsForm] = useState({
    workPerformed: '',
    serviceRemarks: '',
    sparesUsed: [],
    qcResult: 'PASSED',
    qcNotes: '',
    markCompleted: false,
    diagnosisUpdate: {
      observedFault: '',
      rootCause: '',
      failureCode: '',
      needSpare: false
    }
  });

  // Spare item temporary row for adding spares
  const [newSpareItem, setNewSpareItem] = useState({ name: '', partCode: '', quantity: 1, unitCost: 0 });
  const [compatibleSparesList, setCompatibleSparesList] = useState([]);
  const [loadingCompatibleSpares, setLoadingCompatibleSpares] = useState(false);

  // Requirement Selection & Spares Inventory Product Replacement State
  const [enablePartRequirement, setEnablePartRequirement] = useState(false);
  const [needSparePart, setNeedSparePart] = useState(false);
  const [needProductReplacement, setNeedProductReplacement] = useState(false);
  const [replacementProduct, setReplacementProduct] = useState({
    inventoryId: '',
    modelNo: '',
    serialNumber: '',
    location: '',
    dealerPrice: 0,
    availableCodes: []
  });
  const [sparesInventoryList, setSparesInventoryList] = useState([]);
  const [loadingSparesInventory, setLoadingSparesInventory] = useState(false);

  // Audit timeline row selection
  const [selectedRmaId, setSelectedRmaId] = useState(null);
  const [selectedRmaNo, setSelectedRmaNo] = useState('');
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch registered Service Persons / Engineers from DB for allocation dropdown
  const fetchServicePersons = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (res.ok) {
        const data = await res.json();
        const users = data.users || [];
        const filtered = users.filter((u) => {
          const r = (u.role || '').toLowerCase().trim();
          return r.includes('service') || r.includes('engineer') || r.includes('technician') || r === 'staff';
        });
        setServicePersonsList(filtered);
      }
    } catch (e) {
      console.warn('Failed to fetch service persons list:', e);
    }
  }, []);

  // Fetch Performance Analytics Data (Super Admin Hub)
  const fetchPerformanceData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setPerfLoading(true);
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);
      if (timeRange === 'CUSTOM' && customStartDate) {
        params.append('startDate', customStartDate);
        if (customEndDate) params.append('endDate', customEndDate);
      }
      if (activeStore && !isSuperAdmin) {
        params.append('storeName', activeStore);
      }
      const res = await fetch(`${API_BASE}/rma/service-person-performance?${params.toString()}`);
      const result = await res.json();
      if (result.success) {
        setPerfData(result);
        setSelectedTechnician((prev) => {
          if (!prev) return null;
          const updated = (result.servicePersons || []).find(
            (sp) => sp.name.toLowerCase() === prev.name.toLowerCase()
          );
          return updated || prev;
        });
      }
    } catch (err) {
      console.error('Fetch performance error:', err);
    } finally {
      if (showLoading) setPerfLoading(false);
    }
  }, [timeRange, customStartDate, customEndDate, activeStore, isSuperAdmin]);

  // Fetch Live Dashboard Stats
  const fetchDashboardData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const params = new URLSearchParams();
      if (!isSuperAdmin && !isServicePerson && activeStore) params.append('storeName', activeStore);
      if (user?.role) params.append('userRole', user.role);
      if (user?.name) params.append('userName', user.name);
      if (user?._id || user?.id) params.append('userId', user._id || user.id);

      const res = await fetch(`${API_BASE}/service/dashboard-stats?${params.toString()}`);
      const result = await res.json();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Fetch dashboard stats error:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [activeStore, isSuperAdmin, isServicePerson, user?.role, user?.name, user?._id, user?.id]);

  useEffect(() => {
    fetchDashboardData(true);
    fetchPerformanceData(true);
    fetchServicePersons();

    // ⚡ Silent Background Auto Sync (smooth, flicker-free background refresh every 10 seconds)
    const interval = setInterval(() => {
      fetchDashboardData(false);
      fetchPerformanceData(false);
    }, 10000);

    const handleFocus = () => {
      fetchDashboardData(false);
      fetchPerformanceData(false);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchDashboardData, fetchPerformanceData, fetchServicePersons]);

  // Specific RMA History Fetch
  useEffect(() => {
    if (!selectedRmaId) {
      setSelectedHistory([]);
      return;
    }
    const fetchSpecificHistory = async () => {
      try {
        setLoadingHistory(true);
        const res = await fetch(`${API_BASE}/rma/${selectedRmaId}`);
        const result = await res.json();
        if (result.success && result.data && Array.isArray(result.data.history)) {
          setSelectedHistory(result.data.history);
        }
      } catch (err) {
        console.error('Error fetching specific RMA history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchSpecificHistory();
  }, [selectedRmaId]);

  // Open Allocation Dialog
  const handleOpenAllocateModal = (rma) => {
    if (!isSuperAdmin) {
      showToast('Access Denied: Only Super Admin can allocate service to technicians.', 'warning');
      return;
    }
    const isCompleted = ['REPAIR_COMPLETED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CLOSED', 'REPLACED', 'CANCELLED'].includes(rma.currentStatus) || Boolean(rma.repair?.completedAt);
    if (isCompleted) {
      showToast(`RMA #${rma.rmaNo} service is already completed (${rma.currentStatus ? rma.currentStatus.replace(/_/g, ' ') : 'Done'}). Completed service products cannot be reassigned.`, 'info');
      return;
    }
    if (rma.assignedEngineer?.name) {
      showToast(`RMA #${rma.rmaNo} is already allocated to ${rma.assignedEngineer.name}. Reassignment is disabled.`, 'warning');
      return;
    }
    setTargetRMA(rma);
    setAssignForm({
      engineerId: rma.assignedEngineer?.engineerId || '',
      engineerName: rma.assignedEngineer?.name || '',
      engineerEmail: rma.assignedEngineer?.email || '',
      priority: rma.priority || 'HIGH',
      dueDate: rma.dueDate
        ? new Date(rma.dueDate).toISOString().split('T')[0]
        : new Date(Date.now() + 86400000).toISOString().split('T')[0],
      assignmentNotes: rma.assignedEngineer?.notes || ''
    });
    setAllocateModalOpen(true);
  };

  // Submit Allocation
  const handleAssignSubmit = async () => {
    if (!targetRMA) return;
    if (!assignForm.engineerName) {
      showToast('Please select a Service Person', 'warning');
      return;
    }
    try {
      setAssignLoading(true);
      const res = await fetch(`${API_BASE}/rma/${targetRMA._id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...assignForm,
          assignedBy: user?.name || 'Super Admin'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`RMA #${targetRMA.rmaNo} allocated to ${assignForm.engineerName} with ${assignForm.priority} priority!`, 'success');
        setAllocateModalOpen(false);
        setTargetRMA(null);
        await fetchDashboardData();
        await fetchPerformanceData();
      } else {
        showToast(data.message || 'Failed to allocate service', 'error');
      }
    } catch (e) {
      console.error('Assign submit error:', e);
      showToast('Network error while assigning service', 'error');
    } finally {
      setAssignLoading(false);
    }
  };

  // Service Person "Accept Assignment" Action
  const handleAcceptAssignment = async (rmaId, rmaNo) => {
    try {
      setAcceptingRmaId(rmaId);
      const res = await fetch(`${API_BASE}/rma/${rmaId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianName: user?.name || 'Service Person',
          technicianId: user?._id || user?.id || ''
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Assignment accepted for RMA #${rmaNo}! You can now start diagnostic service.`, 'success');
        await fetchDashboardData();
        await fetchPerformanceData();
      } else {
        showToast(data.message || 'Failed to accept assignment', 'error');
      }
    } catch (err) {
      console.error('Accept error:', err);
      showToast('Error accepting assignment', 'error');
    } finally {
      setAcceptingRmaId(null);
    }
  };

  // Service Person "Start Service" Action
  const handleStartService = async (rmaId, rmaNo) => {
    try {
      setStartingRmaId(rmaId);
      const res = await fetch(`${API_BASE}/rma/${rmaId}/start-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          performedBy: user?.name || 'Service Person',
          userRole: user?.role || 'Service Person'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Service started on RMA #${rmaNo}! Status moved to Under Repair.`, 'success');
        await fetchDashboardData();
        await fetchPerformanceData();
      } else {
        showToast(data.message || 'Failed to start service', 'error');
      }
    } catch (err) {
      console.error('Start service error:', err);
      showToast('Error starting service', 'error');
    } finally {
      setStartingRmaId(null);
    }
  };

  // Open Exact 360° Service Details Modal
  const handleOpenServiceDetails = async (rmaIdOrNo) => {
    try {
      setLoadingServiceDetails(true);
      setTechnicianModalOpen(false); // Close Technician Hub Dialog cleanly
      setServiceDetailsModalOpen(true);
      const res = await fetch(`${API_BASE}/rma/${rmaIdOrNo}/service-details`);
      const result = await res.json();
      if (result.success && result.data) {
        setSelectedRmaServiceDetails(result.data);
      } else {
        showToast('Could not load service details', 'error');
      }
    } catch (err) {
      console.error('Fetch service details error:', err);
      showToast('Error fetching service details', 'error');
    } finally {
      setLoadingServiceDetails(false);
    }
  };

  // Open Service Person "Update Work Details" Modal
  const handleOpenWorkDetailsModal = async (rma) => {
    const myName = (user?.name || '').trim().toLowerCase();
    const myId = user?._id || user?.id;
    const assignedEngName = (rma.assignedEngineer?.name || '').trim().toLowerCase();
    const assignedEngId = rma.assignedEngineer?.engineerId;
    const isAssignedToMe = isServicePerson && (
      (assignedEngName && assignedEngName === myName) ||
      (myId && assignedEngId && assignedEngId === myId)
    );

    if (assignedEngName) {
      if (!isServicePerson || !isAssignedToMe) {
        showToast(`Access Denied: RMA #${rma.rmaNo} is assigned to ${rma.assignedEngineer?.name}. Only ${rma.assignedEngineer?.name} can perform diagnosis, repair, and update work records.`, 'warning');
        return;
      }
    } else {
      if (!isSuperAdmin && (!isServicePerson || !isAssignedToMe)) {
        showToast('Access Denied: Only Super Admin and the assigned Service Person can update work details.', 'warning');
        return;
      }
    }

    const isRepairStarted = Boolean(rma.repair?.startedAt) || ['UNDER_REPAIR', 'WAITING_SPARE', 'QC_TESTING', 'BURN_IN_TESTING', 'REPAIR_COMPLETED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CLOSED'].includes(rma.currentStatus);
    if (!isRepairStarted && !isSuperAdmin) {
      showToast(`Cannot update work: RMA #${rma.rmaNo} has not started repair yet. Please go to RMA Control Hub, complete Engineer Diagnosis & Failure Code, and click 'Start Repair' first.`, 'warning');
      return;
    }

    setWorkDetailsTargetRMA(rma);
    const hasSpares = (Array.isArray(rma.spares) && rma.spares.length > 0) || Boolean(rma.diagnosis?.needSpare);
    const hasReplacement = Boolean(rma.replacement?.isReplaced) || rma.resolutionType === 'REPLACEMENT';

    setEnablePartRequirement(hasSpares || hasReplacement);
    setNeedSparePart(hasSpares);
    setNeedProductReplacement(hasReplacement);
    setReplacementProduct(
      rma.replacement
        ? {
            inventoryId: rma.replacement.replacementInventoryId || '',
            modelNo: rma.replacement.replacementModel || rma.modelNo || '',
            serialNumber: rma.replacement.replacementSerial || '',
            location: rma.replacement.replacementLocation || 'Main Warehouse',
            dealerPrice: 0,
            availableCodes: rma.replacement.replacementSerial ? [rma.replacement.replacementSerial] : []
          }
        : { inventoryId: '', modelNo: '', serialNumber: '', location: '', dealerPrice: 0, availableCodes: [] }
    );

    setWorkDetailsForm({
      workPerformed: rma.repair?.actionsTaken || '',
      serviceRemarks: rma.repair?.engineerNotes || '',
      sparesUsed: Array.isArray(rma.spares) ? [...rma.spares] : [],
      qcResult: rma.qc?.passed ? 'PASSED' : 'PASSED',
      qcNotes: rma.qc?.notes || '',
      markCompleted: false,
      diagnosisUpdate: {
        observedFault: rma.diagnosis?.observedFault || '',
        rootCause: rma.diagnosis?.rootCause || '',
        failureCode: rma.diagnosis?.failureCode || '',
        needSpare: hasSpares
      }
    });
    setNewSpareItem({ name: '', partCode: '', quantity: 1, unitCost: 0, trackingType: 'SERIALIZED', serialNumber: '', availableSerials: [] });

    // Dynamically load compatible spare parts based on the RMA product model & category
    try {
      setLoadingCompatibleSpares(true);
      const res = await fetch(`${API_BASE}/spare-parts/compatible-with-product?model=${encodeURIComponent(rma.modelNo || '')}&category=${encodeURIComponent(rma.category || '')}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setCompatibleSparesList(data.data);
      } else {
        // Fallback to all registered spare parts catalog if category specific has 0 parts
        const allRes = await fetch(`${API_BASE}/spare-parts`);
        const allData = await allRes.json();
        const allList = Array.isArray(allData.data) ? allData.data : (allData.spareParts || []);
        setCompatibleSparesList(allList);
      }
    } catch (e) {
      console.warn('Failed to load compatible spare parts:', e);
    } finally {
      setLoadingCompatibleSpares(false);
    }

    // Load Spares Inventory products (2% warranty replacements)
    try {
      setLoadingSparesInventory(true);
      const invRes = await fetch(`${API_BASE}/inventory`);
      const invData = await invRes.json();
      const invList = Array.isArray(invData) ? invData : (invData.inventory || []);
      const sparesOnly = invList.filter(
        (inv) => (inv.isSpare || inv.category === 'Spares' || inv.subCategory === 'Spares Inventory' || inv.subCategory === 'Spares' || (inv.location && inv.location.toLowerCase().includes('spare'))) && ((Number(inv.quantity) || 0) > 0) && (inv.active !== false)
      );
      setSparesInventoryList(sparesOnly);
    } catch (invErr) {
      console.warn('Failed to load spares inventory:', invErr);
    } finally {
      setLoadingSparesInventory(false);
    }

    setWorkDetailsModalOpen(true);
  };

  // Add Spare Part Row to Form
  const handleAddSpareItem = () => {
    if (!newSpareItem.name) return;
    if (newSpareItem.trackingType === 'SERIALIZED' && newSpareItem.availableSerials?.length > 0 && !newSpareItem.serialNumber) {
      showToast('Please select a Serial Number (S/N) for this serialized component.', 'warning');
      return;
    }
    setWorkDetailsForm({
      ...workDetailsForm,
      sparesUsed: [
        ...workDetailsForm.sparesUsed,
        {
          name: newSpareItem.name.trim(),
          partCode: newSpareItem.partCode || '',
          trackingType: newSpareItem.trackingType || 'SERIALIZED',
          serialNumber: newSpareItem.serialNumber || '',
          quantity: Number(newSpareItem.quantity) || 1,
          unitCost: Number(newSpareItem.unitCost) || 0
        }
      ]
    });
    setNewSpareItem({ name: '', partCode: '', quantity: 1, unitCost: 0, trackingType: 'SERIALIZED', serialNumber: '', availableSerials: [] });
  };

  const handleRemoveSpareItem = (index) => {
    const updated = [...workDetailsForm.sparesUsed];
    updated.splice(index, 1);
    setWorkDetailsForm({ ...workDetailsForm, sparesUsed: updated });
  };

  // Submit Work Details
  const handleSaveWorkDetails = async () => {
    if (!workDetailsTargetRMA) return;
    try {
      setSavingWorkDetails(true);
      const actualNeedSparePart = enablePartRequirement ? needSparePart : false;
      const actualNeedProductReplacement = enablePartRequirement ? needProductReplacement : false;

      const res = await fetch(`${API_BASE}/rma/${workDetailsTargetRMA._id}/work-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...workDetailsForm,
          needSparePart: actualNeedSparePart,
          needProductReplacement: actualNeedProductReplacement,
          replacementProduct: actualNeedProductReplacement ? replacementProduct : null,
          performedBy: user?.name || 'Service Person'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Work details saved for RMA #${workDetailsTargetRMA.rmaNo}!`, 'success');
        setWorkDetailsModalOpen(false);
        await fetchDashboardData();
        await fetchPerformanceData();
      } else {
        showToast(data.message || 'Failed to save work details', 'error');
      }
    } catch (err) {
      console.error('Save work details error:', err);
      showToast('Error saving work details', 'error');
    } finally {
      setSavingWorkDetails(false);
    }
  };

  // Filtered RMAs for the list
  const filteredRMAs = useMemo(() => {
    let list = stats.recentRMAs || [];

    // Privacy allocation filter for Service Person:
    // Only show RMAs explicitly allocated to THIS Service Person by Super Admin!
    if (isServicePerson && !isSuperAdmin) {
      const myName = (user?.name || '').trim().toLowerCase();
      const myId = user?._id || user?.id;
      list = list.filter((r) => {
        const engName = (r.assignedEngineer?.name || '').trim().toLowerCase();
        const engId = r.assignedEngineer?.engineerId;
        return (engName && engName === myName) || (myId && engId && engId === myId);
      });
    }

    if (filterTab === 'NEW') {
      list = list.filter((r) => r.currentStatus === 'ENGINEER_ASSIGNED' || !r.assignedEngineer?.acceptedAt);
    } else if (filterTab === 'URGENT') {
      list = list.filter((r) => ['URGENT', 'HIGH'].includes((r.priority || '').toUpperCase()));
    } else if (filterTab === 'ACTIVE') {
      list = list.filter((r) => ['UNDER_REPAIR', 'QC_TESTING', 'BURN_IN_TESTING'].includes(r.currentStatus));
    } else if (filterTab === 'DONE') {
      list = list.filter((r) => ['REPAIR_COMPLETED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CLOSED'].includes(r.currentStatus));
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((r) =>
      (r.rmaNo || '').toLowerCase().includes(q) ||
      (r.ticketNo || '').toLowerCase().includes(q) ||
      (r.modelNo || '').toLowerCase().includes(q) ||
      (r.serialNumber || '').toLowerCase().includes(q) ||
      (r.customerSnapshot?.name || '').toLowerCase().includes(q) ||
      (r.customerSnapshot?.mobile || '').toLowerCase().includes(q) ||
      (r.storeName || '').toLowerCase().includes(q) ||
      (r.assignedEngineer?.name || '').toLowerCase().includes(q) ||
      (r.priority || '').toLowerCase().includes(q) ||
      (r.currentStatus || '').toLowerCase().includes(q)
    );
  }, [stats.recentRMAs, searchQuery, filterTab, isServicePerson, isSuperAdmin, user]);

  // Priority Badge Helper
  const getPriorityBadge = (priority) => {
    const p = (priority || 'NORMAL').toUpperCase();
    if (p === 'URGENT') {
      return (
        <Chip
          icon={<Flame size={12} color="#dc2626" />}
          label="URGENT"
          size="small"
          sx={{
            fontWeight: 900,
            fontSize: '10.5px',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fca5a5',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.75 },
            },
          }}
        />
      );
    }
    if (p === 'HIGH') {
      return (
        <Chip
          icon={<Zap size={12} color="#ea580c" />}
          label="HIGH"
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: '10.5px',
            backgroundColor: '#ffedd5',
            color: '#c2410c',
            border: '1px solid #fdba74',
          }}
        />
      );
    }
    if (p === 'LOW') {
      return (
        <Chip
          label="LOW"
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: '10.5px',
            backgroundColor: '#f1f5f9',
            color: '#64748b',
          }}
        />
      );
    }
    return (
      <Chip
        label="NORMAL"
        size="small"
        sx={{
          fontWeight: 700,
          fontSize: '10.5px',
          backgroundColor: '#e0f2fe',
          color: '#0369a1',
        }}
      />
    );
  };

  // Avatar & Color Helpers
  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarStyle = (name) => {
    if (!name) return { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
    const palette = [
      { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }, // blue
      { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' }, // purple
      { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' }, // emerald
      { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' }, // rose
      { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' }, // teal
      { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' }, // orange
      { bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe' }, // indigo
      { bg: '#fdf4ff', color: '#a21caf', border: '#f5d0fe' }, // fuchsia
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  };

  // Status Chip Helper
  const getStatusChip = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <Chip
            icon={<Check size={12} color="#0284c7" />}
            label="Accepted / Taken"
            size="small"
            sx={{ fontWeight: 800, backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '11px' }}
          />
        );
      case 'ENGINEER_ASSIGNED':
      case 'ALLOCATED':
        return (
          <Chip
            icon={<AlertCircle size={12} color="#dc2626" />}
            label="Allocated / New"
            size="small"
            sx={{
              fontWeight: 800,
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              fontSize: '11px',
              border: '1px solid #f87171'
            }}
          />
        );
      case 'PRODUCT_RECEIVED':
        return <Chip label="Product Received" size="small" sx={{ fontWeight: 800, backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '11px' }} />;
      case 'FAULT_CONFIRMED':
      case 'UNDER_INITIAL_INSPECTION':
        return <Chip label="Inspection Done" size="small" sx={{ fontWeight: 800, backgroundColor: '#fef3c7', color: '#b45309', fontSize: '11px' }} />;
      case 'READY_FOR_REPAIR':
      case 'UNDER_DIAGNOSIS':
        return <Chip label="Diagnosed" size="small" sx={{ fontWeight: 800, backgroundColor: '#f3e8ff', color: '#7c3aed', fontSize: '11px' }} />;
      case 'WAITING_SPARE':
        return <Chip label="Waiting Spare" size="small" sx={{ fontWeight: 800, backgroundColor: '#fef3c7', color: '#b45309', fontSize: '11px' }} />;
      case 'UNDER_REPAIR':
        return (
          <Chip
            icon={<Wrench size={12} color="#c2410c" />}
            label="In Process (Repair)"
            size="small"
            sx={{ fontWeight: 800, backgroundColor: '#ffedd5', color: '#c2410c', fontSize: '11px' }}
          />
        );
      case 'REPAIR_COMPLETED':
        return <Chip label="Repair Completed" size="small" sx={{ fontWeight: 800, backgroundColor: '#dcfce7', color: '#15803d', fontSize: '11px' }} />;
      case 'QC_TESTING':
        return <Chip label="QC Testing" size="small" sx={{ fontWeight: 800, backgroundColor: '#e0e7ff', color: '#4338ca', fontSize: '11px' }} />;
      case 'READY_FOR_DISPATCH':
        return <Chip label="Ready Dispatch" size="small" sx={{ fontWeight: 800, backgroundColor: '#dcfce7', color: '#15803d', fontSize: '11px' }} />;
      case 'DISPATCHED':
      case 'DELIVERED':
      case 'CLOSED':
        return <Chip label="Dispatched / Closed" size="small" sx={{ fontWeight: 800, backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px' }} />;
      default:
        return <Chip label={status ? status.replace(/_/g, ' ') : 'N/A'} size="small" sx={{ fontWeight: 800, fontSize: '11px' }} />;
    }
  };

  const urgentAssignmentsList = stats.urgentAssignments || [];

  return (
    <Box sx={{ width: '100%', minWidth: '100%', boxSizing: 'border-box' }}>
      {/* Top Success Alert Toast */}
      {actionSuccessMsg && (
        <Alert
          severity="success"
          icon={<CheckCircle2 size={20} />}
          onClose={() => setActionSuccessMsg('')}
          sx={{ mb: 2.5, borderRadius: 2.5, fontWeight: 700, boxShadow: '0 4px 14px rgba(34, 197, 94, 0.2)' }}
        >
          {actionSuccessMsg}
        </Alert>
      )}

      {/* Header Banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 3, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe', flexShrink: 0 }}>
            <Wrench size={26} color="#2563eb" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
              {isSuperAdmin ? 'Service Person Performance & Workload' : 'Service & RMA Analytics Dashboard'}
              {isServicePerson && (
                <Chip label="Service Person Hub" size="small" sx={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 800, fontSize: '11px' }} />
              )}
              {isOtherLogin && (
                <Chip label="Service Tracking" size="small" sx={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 800, fontSize: '11px' }} />
              )}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {isSuperAdmin
                ? 'Monitor service assignments, technician workload, progress, completion, and detailed repair records.'
                : isServicePerson
                ? `Logged in as ${user?.name || 'Service Person'} (${user?.serviceCenter || user?.assignedLocation || 'Service Center'}) • Action queue & repair tasks`
                : `Logged in as ${user?.name || 'Store'} • Real-time service tracking & repair status monitor`}
            </Typography>
          </Box>
        </Box>

        {/* Time Filters for Super Admin */}
        {isSuperAdmin && (
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Box sx={{ backgroundColor: '#f1f5f9', p: 0.5, borderRadius: 2.5, display: 'flex', gap: 0.5 }}>
              {[
                { id: 'TODAY', label: 'Today' },
                { id: 'THIS_WEEK', label: 'This Week' },
                { id: 'THIS_MONTH', label: 'This Month' },
                { id: 'LAST_MONTH', label: 'Last Month' },
                { id: 'CUSTOM', label: 'Custom' }
              ].map((t) => (
                <Button
                  key={t.id}
                  size="small"
                  onClick={() => setTimeRange(t.id)}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: timeRange === t.id ? 800 : 600,
                    fontSize: '12px',
                    px: 1.5,
                    py: 0.4,
                    backgroundColor: timeRange === t.id ? '#ffffff' : 'transparent',
                    color: timeRange === t.id ? '#1d4ed8' : '#64748b',
                    boxShadow: timeRange === t.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    '&:hover': { backgroundColor: timeRange === t.id ? '#ffffff' : '#e2e8f0' }
                  }}
                >
                  {t.label}
                </Button>
              ))}
            </Box>

            <Button
              variant="outlined"
              startIcon={<RotateCcw size={15} />}
              onClick={() => {
                fetchPerformanceData(true);
                fetchDashboardData(true);
              }}
              disabled={perfLoading || loading}
              sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b', borderColor: '#cbd5e1', fontWeight: 600 }}
            >
              Refresh
            </Button>
          </Stack>
        )}
      </Box>

      {/* Custom Date Range Picker bar (when CUSTOM is active) */}
      {isSuperAdmin && timeRange === 'CUSTOM' && (
        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2.5, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" fontWeight={700} color="#334155">Custom Date Range:</Typography>
          <TextField
            size="small"
            type="date"
            label="From Date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ backgroundColor: '#ffffff' }}
          />
          <TextField
            size="small"
            type="date"
            label="To Date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ backgroundColor: '#ffffff' }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={fetchPerformanceData}
            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, px: 2 }}
          >
            Apply Filter
          </Button>
        </Paper>
      )}

      {/* ========================================================================= */}
      {/* 🔴 PROMINENT NEW SERVICE ASSIGNMENTS BANNER (Service Persons Only) */}
      {/* ========================================================================= */}
      {isServicePerson && urgentAssignmentsList.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            mb: 3.5,
            p: 2.5,
            borderRadius: 3.5,
            backgroundColor: '#ffffff',
            border: '2px solid #ef4444',
            boxShadow: '0 8px 30px rgba(239, 68, 68, 0.12)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              backgroundColor: '#ef4444',
              backgroundImage: 'linear-gradient(90deg, #ef4444, #f97316, #ef4444)'
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' },
                    '70%': { transform: 'scale(1.05)', boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)' },
                    '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' }
                  }
                }}
              >
                <Flame size={20} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={900} sx={{ color: '#991b1b', letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
                  🔴 NEW SERVICE ASSIGNMENTS & URGENT WORK ORDERS ({urgentAssignmentsList.length})
                </Typography>
                <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 600 }}>
                  Immediate service action required. Review instructions, accept assignment, and initiate repair.
                </Typography>
              </Box>
            </Box>

            <Chip
              label="Action Required Immediately"
              size="small"
              sx={{ backgroundColor: '#ef4444', color: '#ffffff', fontWeight: 800, fontSize: '11px' }}
            />
          </Box>

          <Grid container spacing={2}>
            {urgentAssignmentsList.map((rma) => {
              const isStarting = startingRmaId === rma._id;
              const isAccepting = acceptingRmaId === rma._id;
              const isAccepted = Boolean(rma.assignedEngineer?.acceptedAt) || rma.currentStatus === 'ACCEPTED' || Boolean(rma.repair?.startedAt);
              const isStarted = Boolean(rma.repair?.startedAt) || ['UNDER_REPAIR', 'QC_TESTING', 'REPAIR_COMPLETED', 'READY_FOR_DISPATCH'].includes(rma.currentStatus);
              const priority = (rma.priority || 'NORMAL').toUpperCase();
              const isUrgent = priority === 'URGENT' || priority === 'HIGH';

              return (
                <Grid item xs={12} lg={6} key={rma._id}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      border: isUrgent ? '2px solid #f87171' : '1px solid #e2e8f0',
                      backgroundColor: isUrgent ? '#fffaf8' : '#ffffff',
                      p: 2.2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      transition: 'all 0.2s',
                      boxShadow: isUrgent ? '0 4px 16px rgba(239, 68, 68, 0.08)' : '0 2px 8px rgba(0,0,0,0.03)',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(239, 68, 68, 0.15)' }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle2" fontWeight={900} sx={{ color: '#1d4ed8', fontFamily: 'monospace', fontSize: '14.5px' }}>
                            {rma.rmaNo}
                          </Typography>
                          {getPriorityBadge(rma.priority)}
                        </Stack>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Ticket: <strong>{rma.ticketNo}</strong> • From: <strong>{rma.storeName}</strong>
                        </Typography>
                      </Box>

                      <Chip
                        icon={<Calendar size={12} />}
                        label={
                          rma.dueDate
                            ? `Due: ${new Date(rma.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                            : 'Due: Immediate'
                        }
                        size="small"
                        sx={{
                          fontWeight: 800,
                          backgroundColor: isUrgent ? '#fee2e2' : '#f1f5f9',
                          color: isUrgent ? '#dc2626' : '#475569',
                          fontSize: '11px'
                        }}
                      />
                    </Box>

                    <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <Grid container spacing={1}>
                        <Grid item xs={7}>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>Product Model</Typography>
                          <Typography variant="body2" fontWeight={800} sx={{ color: '#0f172a' }}>{rma.modelNo}</Typography>
                          <Chip icon={<Barcode size={10} />} label={rma.serialNumber} size="small" sx={{ fontFamily: 'monospace', fontSize: '10px', height: 18, mt: 0.3 }} />
                        </Grid>
                        <Grid item xs={5}>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>Customer Contact</Typography>
                          <Typography variant="body2" fontWeight={700} sx={{ color: '#334155' }}>{rma.customerSnapshot?.name || 'Customer'}</Typography>
                          <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 800 }}>{rma.customerSnapshot?.mobile || '—'}</Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#475569', fontSize: '12px' }}>
                      <UserCheck size={14} color="#2563eb" />
                      <Typography variant="caption" sx={{ color: '#475569' }}>
                        Allocated by: <strong>{rma.assignedEngineer?.assignedBy || 'Super Admin'}</strong>
                        {rma.assignedEngineer?.notes ? ` • Note: "${rma.assignedEngineer.notes}"` : ''}
                      </Typography>
                    </Box>

                    {/* Service Person Action Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FileText size={14} />}
                        onClick={() => handleOpenServiceDetails(rma._id)}
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: '11px', borderRadius: 1.5 }}
                      >
                        View Details
                      </Button>

                      <Stack direction="row" spacing={1}>
                        {!isStarted && !isAccepted && (
                          <Button
                            variant="outlined"
                            size="small"
                            color="primary"
                            disabled={isAccepting}
                            onClick={() => handleAcceptAssignment(rma._id, rma.rmaNo)}
                            startIcon={isAccepting ? <CircularProgress size={14} /> : <Check size={14} />}
                            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 800, fontSize: '11px' }}
                          >
                            {isAccepting ? 'Accepting...' : 'ACCEPT'}
                          </Button>
                        )}
                        {!isStarted ? (
                          <Button
                            variant="contained"
                            size="small"
                            disabled={isStarting}
                            onClick={() => handleStartService(rma._id, rma.rmaNo)}
                            startIcon={isStarting ? <CircularProgress size={14} color="inherit" /> : <Play size={14} />}
                            sx={{
                              borderRadius: 1.5,
                              textTransform: 'none',
                              fontWeight: 800,
                              fontSize: '11.5px',
                              backgroundColor: '#dc2626',
                              color: '#ffffff',
                              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)',
                              '&:hover': { backgroundColor: '#b91c1c' },
                              px: 2
                            }}
                          >
                            {isStarting ? 'Starting...' : 'START SERVICE NOW'}
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleOpenWorkDetailsModal(rma)}
                            startIcon={<Wrench size={14} />}
                            sx={{
                              borderRadius: 1.5,
                              textTransform: 'none',
                              fontWeight: 800,
                              fontSize: '11.5px',
                              backgroundColor: '#16a34a',
                              color: '#ffffff',
                              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
                              '&:hover': { backgroundColor: '#15803d' },
                              px: 2
                            }}
                          >
                            UPDATE WORK
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      )}

      {/* ========================================================================= */}
      {/* 7 KPI METRIC CARDS (Super Admin View) or 4 Dedicated Workload Cards (Service Person) */}
      {/* ========================================================================= */}
      {isSuperAdmin ? (
        <Box sx={{ mb: 3.5 }}>
          {/* Row 1: 4 Cards */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 2,
            mb: 2,
            width: '100%'
          }}>
            {/* 1. TOTAL RMA */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px' }}>TOTAL RMA</Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', mt: 0.3 }}>
                      {perfLoading ? <CircularProgress size={18} /> : perfData.totalRma || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Total service units in period</Typography>
                  </Box>
                  <Box sx={{ width: 42, height: 42, borderRadius: 2.5, backgroundColor: '#f1f5f9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={20} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* 2. ALLOCATED */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #bfdbfe', backgroundColor: '#eff6ff' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px' }}>ALLOCATED</Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#1e40af', mt: 0.3 }}>
                      {perfLoading ? <CircularProgress size={18} /> : perfData.allocated || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#3b82f6' }}>Assigned to technicians</Typography>
                  </Box>
                  <Box sx={{ width: 42, height: 42, borderRadius: 2.5, backgroundColor: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck size={20} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* 3. IN PROCESS */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #fed7aa', backgroundColor: '#fff7ed' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#c2410c', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px' }}>IN PROCESS</Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#9a3412', mt: 0.3 }}>
                      {perfLoading ? <CircularProgress size={18} /> : perfData.inProcess || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#ea580c' }}>Active repair & diagnosis</Typography>
                  </Box>
                  <Box sx={{ width: 42, height: 42, borderRadius: 2.5, backgroundColor: '#ffedd5', color: '#c2410c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={20} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* 4. WAITING SPARE */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #fde68a', backgroundColor: '#fefce8' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px' }}>WAITING SPARE</Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#854d0e', mt: 0.3 }}>
                      {perfLoading ? <CircularProgress size={18} /> : perfData.waitingForSpare || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#d97706' }}>Parts pending / reserved</Typography>
                  </Box>
                  <Box sx={{ width: 42, height: 42, borderRadius: 2.5, backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={20} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Row 2: 3 Cards */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 2,
            width: '100%'
          }}>
            {/* 5. QC TESTING */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #c7d2fe', backgroundColor: '#eef2ff' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#4338ca', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px' }}>QC TESTING</Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#3730a3', mt: 0.3 }}>
                      {perfLoading ? <CircularProgress size={18} /> : perfData.qcTesting || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6366f1' }}>Burn-in & validation</Typography>
                  </Box>
                  <Box sx={{ width: 42, height: 42, borderRadius: 2.5, backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={20} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* 6. COMPLETED */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px' }}>COMPLETED</Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#166534', mt: 0.3 }}>
                      {perfLoading ? <CircularProgress size={18} /> : perfData.completed || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#22c55e' }}>Repaired, passed QC & ready</Typography>
                  </Box>
                  <Box sx={{ width: 42, height: 42, borderRadius: 2.5, backgroundColor: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={20} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* 7. OVERDUE */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px' }}>OVERDUE</Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#991b1b', mt: 0.3 }}>
                      {perfLoading ? <CircularProgress size={18} /> : perfData.overdue || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#ef4444' }}>Target due date passed</Typography>
                  </Box>
                  <Box sx={{ width: 42, height: 42, borderRadius: 2.5, backgroundColor: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle size={20} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      ) : isServicePerson ? (
        // Service Person 4 Dedicated Cards
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2.2,
          mb: 3,
          width: '100%'
        }}>
          <Card elevation={0} onClick={() => setFilterTab(filterTab === 'NEW' ? 'ALL' : 'NEW')} sx={{ borderRadius: 3, border: filterTab === 'NEW' ? '2px solid #ef4444' : '1px solid #e2e8f0', backgroundColor: '#ffffff', cursor: 'pointer' }}>
            <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px' }}>New Assignments</Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ color: '#991b1b', mt: 0.5 }}>
                    {loading ? <CircularProgress size={18} /> : stats.newAssignments || stats.urgentAssignments?.length || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Allocated & awaiting start</Typography>
                </Box>
                <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={22} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={0} onClick={() => setFilterTab(filterTab === 'URGENT' ? 'ALL' : 'URGENT')} sx={{ borderRadius: 3, border: filterTab === 'URGENT' ? '2px solid #f97316' : '1px solid #e2e8f0', backgroundColor: '#ffffff', cursor: 'pointer' }}>
            <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#c2410c', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px' }}>Pending Work Orders</Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ color: '#ea580c', mt: 0.5 }}>
                    {loading ? <CircularProgress size={18} /> : stats.pendingRMAs || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Diagnosed / waiting spares</Typography>
                </Box>
                <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={22} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={0} onClick={() => setFilterTab(filterTab === 'ACTIVE' ? 'ALL' : 'ACTIVE')} sx={{ borderRadius: 3, border: filterTab === 'ACTIVE' ? '2px solid #2563eb' : '1px solid #e2e8f0', backgroundColor: '#ffffff', cursor: 'pointer' }}>
            <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px' }}>Active In-Repair</Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ color: '#1e40af', mt: 0.5 }}>
                    {loading ? <CircularProgress size={18} /> : stats.activeServices || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Under active repair & testing</Typography>
                </Box>
                <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={22} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={0} onClick={() => setFilterTab(filterTab === 'DONE' ? 'ALL' : 'DONE')} sx={{ borderRadius: 3, border: filterTab === 'DONE' ? '2px solid #16a34a' : '1px solid #e2e8f0', backgroundColor: '#ffffff', cursor: 'pointer' }}>
            <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px' }}>Completed Units</Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ color: '#166534', mt: 0.5 }}>
                    {loading ? <CircularProgress size={18} /> : stats.completedRMAs || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>QC passed & completed</Typography>
                </Box>
                <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={22} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      ) : (
        // Store / Customer / Other Login 4 Tracking Cards
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2.2,
          mb: 3,
          width: '100%'
        }}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px' }}>Total Service Units</Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ color: '#1d4ed8', mt: 0.5 }}>
                    {loading ? <CircularProgress size={18} /> : stats.totalRMAs || stats.totalRequests || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Registered for service</Typography>
                </Box>
                <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={22} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #fed7aa', backgroundColor: '#fff7ed' }}>
            <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#c2410c', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px' }}>Under Service / Repair</Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ color: '#ea580c', mt: 0.5 }}>
                    {loading ? <CircularProgress size={18} /> : stats.activeServices || stats.pendingRMAs || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Being diagnosed / repaired</Typography>
                </Box>
                <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={22} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4' }}>
            <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px' }}>Ready for Dispatch</Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ color: '#166534', mt: 0.5 }}>
                    {loading ? <CircularProgress size={18} /> : stats.readyDispatch || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>QC passed & packed</Typography>
                </Box>
                <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={22} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#475569', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px' }}>Dispatched / Closed</Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', mt: 0.5 }}>
                    {loading ? <CircularProgress size={18} /> : stats.dispatchedClosed || stats.completedRMAs || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Delivered back to store</Typography>
                </Box>
                <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: '#f1f5f9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={22} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ========================================================================= */}
      {/* SUPER ADMIN: SERVICE PERSON WORKLOAD & PERFORMANCE TABLE */}
      {/* ========================================================================= */}
      {isSuperAdmin && (
        <Paper elevation={0} sx={{ borderRadius: 3.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', overflow: 'hidden', mb: 3.5 }}>
          <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h6" fontWeight={900} sx={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                Service Person Workload & Performance
              </Typography>
              <Typography variant="caption" color="#64748b">
                Click <strong>Details</strong> to drill down into a technician's specific work orders and exact repair records.
              </Typography>
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.5 }}>Person</TableCell>
                  <TableCell align="center" sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.5 }}>Assigned</TableCell>
                  <TableCell align="center" sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.5 }}>Accepted / Taken</TableCell>
                  <TableCell align="center" sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.5 }}>Started</TableCell>
                  <TableCell align="center" sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.5 }}>In Process</TableCell>
                  <TableCell align="center" sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.5 }}>Waiting Spare</TableCell>
                  <TableCell align="center" sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.5 }}>Completed</TableCell>
                  <TableCell align="center" sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.5 }}>Overdue</TableCell>
                  <TableCell align="right" sx={{ color: '#475569', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', py: 1.5, pr: 3 }}>Action</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {perfLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={24} />
                      <Typography variant="body2" color="#64748b" sx={{ mt: 1 }}>Loading technician performance metrics...</Typography>
                    </TableCell>
                  </TableRow>
                ) : (perfData.servicePersons || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                      <Typography variant="body2" color="#64748b">No technician assignments found for this period.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  (perfData.servicePersons || []).map((sp) => {
                    const isSelected = selectedTechnician?.name.toLowerCase() === sp.name.toLowerCase();
                    return (
                      <TableRow
                        key={sp.id || sp.name}
                        hover
                        sx={{
                          backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                          '&:hover': { backgroundColor: isSelected ? '#dbeafe' : '#f8fafc' }
                        }}
                      >
                        {/* Person Info */}
                        <TableCell sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 34, height: 34, backgroundColor: isSelected ? '#2563eb' : '#e2e8f0', color: isSelected ? '#ffffff' : '#334155', fontWeight: 800, fontSize: '13px' }}>
                              {sp.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={800} color="#0f172a">{sp.name}</Typography>
                              <Typography variant="caption" color="#64748b">
                                {sp.serviceCenter || sp.email || 'Service Engineer'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Assigned */}
                        <TableCell align="center" sx={{ py: 1.5 }}>
                          <Chip label={sp.assigned} size="small" sx={{ fontWeight: 800, backgroundColor: '#f1f5f9', color: '#334155' }} />
                        </TableCell>

                        {/* Accepted */}
                        <TableCell align="center" sx={{ py: 1.5 }}>
                          <Chip label={sp.accepted} size="small" sx={{ fontWeight: 800, backgroundColor: '#e0f2fe', color: '#0369a1' }} />
                        </TableCell>

                        {/* Started */}
                        <TableCell align="center" sx={{ py: 1.5 }}>
                          <Chip label={sp.started} size="small" sx={{ fontWeight: 800, backgroundColor: '#ede9fe', color: '#6d28d9' }} />
                        </TableCell>

                        {/* In Process */}
                        <TableCell align="center" sx={{ py: 1.5 }}>
                          <Chip label={sp.inProcess} size="small" sx={{ fontWeight: 800, backgroundColor: '#ffedd5', color: '#c2410c' }} />
                        </TableCell>

                        {/* Spare */}
                        <TableCell align="center" sx={{ py: 1.5 }}>
                          <Chip label={sp.waitingSpare} size="small" sx={{ fontWeight: 800, backgroundColor: '#fef3c7', color: '#b45309' }} />
                        </TableCell>

                        {/* Completed */}
                        <TableCell align="center" sx={{ py: 1.5 }}>
                          <Chip label={sp.completed} size="small" sx={{ fontWeight: 800, backgroundColor: '#dcfce7', color: '#15803d' }} />
                        </TableCell>

                        {/* Overdue */}
                        <TableCell align="center" sx={{ py: 1.5 }}>
                          {sp.overdue > 0 ? (
                            <Chip label={sp.overdue} size="small" sx={{ fontWeight: 900, backgroundColor: '#fee2e2', color: '#b91c1c' }} />
                          ) : (
                            <Typography variant="caption" color="#94a3b8">0</Typography>
                          )}
                        </TableCell>

                        {/* Action: Details Drilldown */}
                        <TableCell align="right" sx={{ py: 1.5, pr: 3 }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              setSelectedTechnician(sp);
                              setTechnicianModalOpen(true);
                            }}
                            endIcon={<ChevronRight size={14} />}
                            sx={{
                              backgroundColor: '#2563eb',
                              textTransform: 'none',
                              fontWeight: 800,
                              fontSize: '11px',
                              borderRadius: 1.5,
                              px: 1.8,
                              py: 0.4,
                              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                              '&:hover': { backgroundColor: '#1d4ed8' }
                            }}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ========================================================================= */}
      {/* ACTIVE WORKLOAD QUEUE & TIMELINE FEED */}
      {/* ========================================================================= */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1fr 340px' },
        gap: 3,
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Left Column: Workload Table */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
          <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#0f172a' }}>
                {isServicePerson ? 'My Assigned Services & Work Orders' : 'Active Service Workload Queue'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Real-time status tracking and service lifecycle actions
              </Typography>
            </Box>

            <TextField
              size="small"
              placeholder="Search RMA, Serial, Model, Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color="#64748b" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}><X size={14} /></IconButton>
                  </InputAdornment>
                ) : null
              }}
              sx={{ width: { xs: '100%', sm: 280 } }}
            />
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', py: 1.5 }}>Unit & Ticket</TableCell>
                  <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', py: 1.5 }}>Product & Serial</TableCell>
                  <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', py: 1.5 }}>Priority</TableCell>
                  <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', py: 1.5 }}>Assigned To</TableCell>
                  <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', py: 1.5 }}>Status</TableCell>
                  <TableCell align="center" sx={{ color: '#475569', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', py: 1.5 }}>Action</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={24} />
                      <Typography variant="body2" color="#64748b" sx={{ mt: 1 }}>Loading service workload queue...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredRMAs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 7 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            backgroundColor: '#f8fafc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#94a3b8',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <Inbox size={26} strokeWidth={1.75} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#334155', fontSize: '14px' }}>
                            No Active Store Records Found
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.3, fontSize: '12px' }}>
                            {searchQuery ? 'No service requests match your search criteria.' : 'There are currently no active service requests in this store queue.'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRMAs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((r) => {
                    const isSelected = selectedRmaId === r._id;
                    const isCompleted = ['REPAIR_COMPLETED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CLOSED', 'REPLACED', 'CANCELLED'].includes(r.currentStatus) || Boolean(r.repair?.completedAt);
                    const isRepairStarted = Boolean(r.repair?.startedAt) || ['UNDER_REPAIR', 'WAITING_SPARE', 'QC_TESTING', 'BURN_IN_TESTING', 'REPAIR_COMPLETED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CLOSED'].includes(r.currentStatus);

                    const myName = (user?.name || '').trim().toLowerCase();
                    const myId = user?._id || user?.id;
                    const assignedEngName = (r.assignedEngineer?.name || '').trim().toLowerCase();
                    const assignedEngId = r.assignedEngineer?.engineerId;

                    // Strictly check if assigned to the logged-in service person
                    const isAssignedToMe = isServicePerson && (
                      (assignedEngName && assignedEngName === myName) ||
                      (myId && assignedEngId && assignedEngId === myId)
                    );

                    return (
                      <TableRow
                        key={r._id}
                        hover
                        onClick={() => {
                          setSelectedRmaId(r._id);
                          setSelectedRmaNo(r.rmaNo);
                        }}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                          '&:hover': { backgroundColor: isSelected ? '#dbeafe' : '#f8fafc' }
                        }}
                      >
                        {/* Unit & Ticket */}
                        <TableCell sx={{ py: 1.3 }}>
                          <Typography variant="body2" fontWeight={800} sx={{ color: '#1d4ed8', fontFamily: 'monospace' }}>
                            {r.rmaNo}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '10px' }}>
                            Ticket: {r.ticketNo}
                          </Typography>
                        </TableCell>

                        {/* Product & Serial */}
                        <TableCell sx={{ py: 1.3 }}>
                          <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                            {r.modelNo}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace', fontSize: '10.5px' }}>
                            {r.serialNumber}
                          </Typography>
                        </TableCell>

                        {/* Priority */}
                        <TableCell sx={{ py: 1.3 }}>
                          {getPriorityBadge(r.priority)}
                        </TableCell>

                        {/* Assigned To */}
                        <TableCell sx={{ py: 1.3 }}>
                          {r.assignedEngineer?.name ? (
                            (() => {
                              const avatarStyle = getAvatarStyle(r.assignedEngineer.name);
                              return (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      fontSize: '11px',
                                      fontWeight: 800,
                                      backgroundColor: avatarStyle.bg,
                                      color: avatarStyle.color,
                                      border: `1.5px solid ${avatarStyle.border}`,
                                    }}
                                  >
                                    {getInitials(r.assignedEngineer.name)}
                                  </Avatar>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '12px', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                                      {r.assignedEngineer.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>
                                      Engineer
                                    </Typography>
                                  </Box>
                                </Box>
                              );
                            })()
                          ) : (
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 1.5, backgroundColor: '#fef2f2', border: '1px dashed #fca5a5' }}>
                              <UserX size={11} color="#ef4444" />
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#dc2626', fontSize: '10.5px' }}>
                                Unassigned
                              </Typography>
                            </Box>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell sx={{ py: 1.3 }}>
                          {getStatusChip(r.currentStatus)}
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="center" sx={{ py: 1.3 }} onClick={(e) => e.stopPropagation()}>
                          <Stack direction="row" spacing={0.8} justifyContent="center">
                            {isSuperAdmin ? (
                              <>
                                {!isCompleted && !r.assignedEngineer?.name && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleOpenAllocateModal(r)}
                                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '10.5px', py: 0.2, px: 1, borderRadius: 1.5 }}
                                  >
                                    + Allocate
                                  </Button>
                                )}
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleOpenServiceDetails(r._id)}
                                  startIcon={<Eye size={12} />}
                                  sx={{ textTransform: 'none', fontWeight: 800, fontSize: '10.5px', py: 0.2, px: 1, borderRadius: 1.5, backgroundColor: '#2563eb' }}
                                >
                                  Details
                                </Button>
                              </>
                            ) : isServicePerson && isAssignedToMe ? (
                              <>
                                {!isCompleted && (
                                  <Tooltip
                                    title={
                                      !isRepairStarted
                                        ? "Complete Engineer Diagnosis & click 'Start Repair' in RMA Control Hub to enable Update Work"
                                        : ""
                                    }
                                  >
                                    <span>
                                      <Button
                                        size="small"
                                        variant="contained"
                                        disabled={!isRepairStarted}
                                        onClick={() => handleOpenWorkDetailsModal(r)}
                                        startIcon={<CheckSquare size={11} />}
                                        sx={{
                                          textTransform: 'none',
                                          fontWeight: 800,
                                          fontSize: '10.5px',
                                          py: 0.2,
                                          px: 1,
                                          borderRadius: 1.5,
                                          backgroundColor: isRepairStarted ? '#16a34a' : '#cbd5e1',
                                          color: isRepairStarted ? '#ffffff' : '#94a3b8',
                                          '&:hover': { backgroundColor: isRepairStarted ? '#15803d' : '#cbd5e1' },
                                          '&.Mui-disabled': {
                                            backgroundColor: '#f1f5f9',
                                            color: '#94a3b8',
                                            border: '1px solid #e2e8f0',
                                            cursor: 'not-allowed'
                                          }
                                        }}
                                      >
                                        Update Work
                                      </Button>
                                    </span>
                                  </Tooltip>
                                )}
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleOpenServiceDetails(r._id)}
                                  startIcon={<Eye size={12} />}
                                  sx={{ textTransform: 'none', fontWeight: 700, fontSize: '11px', py: 0.2, px: 1.2, borderRadius: 1.5, color: '#334155', borderColor: '#cbd5e1' }}
                                >
                                  View Details
                                </Button>
                              </>
                            ) : (
                              // Other Logins (Store, Customer, Dealer, Warehouse, or other non-assigned technicians)
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleOpenServiceDetails(r._id)}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  fontSize: '11px',
                                  py: 0.3,
                                  px: 1.5,
                                  borderRadius: 1.5,
                                  color: '#475569',
                                  borderColor: '#cbd5e1'
                                }}
                              >
                                View Status
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredRMAs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>

        {/* Right Column: Live Event Audit History Feed */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', p: 2.5, width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2, width: '100%' }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 2, backgroundColor: selectedRmaNo ? '#eff6ff' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedRmaNo ? '#3b82f6' : '#64748b' }}>
              <Clock size={18} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#0f172a', lineHeight: 1.2 }}>
                {selectedRmaNo ? `Timeline: ${selectedRmaNo}` : 'Audit Timeline'}
              </Typography>
              {selectedRmaNo && (
                <Typography variant="caption" color="#64748b" sx={{ fontSize: '10px' }}>
                  Events for selected unit
                </Typography>
              )}
            </Box>
            {selectedRmaNo && (
              <Chip
                label="Clear"
                size="small"
                onClick={() => {
                  setSelectedRmaId(null);
                  setSelectedRmaNo('');
                }}
                sx={{ fontWeight: 800, fontSize: '10px', backgroundColor: '#f1f5f9', cursor: 'pointer' }}
              />
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{
            maxHeight: 460,
            overflowY: 'auto',
            pr: 1,
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { backgroundColor: '#f1f5f9', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#94a3b8' }
          }}>
            <Stack spacing={1.8}>
              {loadingHistory ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress size={22} /></Box>
              ) : selectedRmaId ? (
                selectedHistory.length === 0 ? (
                  <Typography variant="caption" color="#64748b" sx={{ textAlign: 'center', display: 'block', py: 4 }}>
                    No audit history found for this RMA.
                  </Typography>
                ) : (
                  selectedHistory.map((h, i) => (
                    <Box key={h._id || i} sx={{ p: 1.5, borderLeft: '3px solid #3b82f6', backgroundColor: '#f0f9ff', borderRadius: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" fontWeight={800} color="#0369a1">{h.action}</Typography>
                        <Typography variant="caption" color="#94a3b8" sx={{ fontSize: '10px' }}>
                          {new Date(h.createdAt || h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.3, fontSize: '11px' }}>
                        {h.notes}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 600, display: 'block', mt: 0.3, fontSize: '10px' }}>
                        By: {h.userName}
                      </Typography>
                    </Box>
                  ))
                )
              ) : (
                <Box sx={{ textAlign: 'center', py: 10, px: 2 }}>
                  <Clock size={32} style={{ opacity: 0.6, color: '#94a3b8', marginBottom: 8 }} />
                  <Typography variant="body2" color="#64748b" fontWeight={700} mb={0.5}>
                    No Unit Selected
                  </Typography>
                  <Typography variant="caption" color="#94a3b8" display="block">
                    Click any service row in the queue to inspect its complete timestamped audit timeline.
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Paper>
      </Box>

      {/* ========================================================================= */}
      {/* EXACT 360° SERVICE WORK DETAILS MODAL (Super Admin & Service Person) */}
      {/* ========================================================================= */}
      <Dialog
        open={serviceDetailsModalOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setServiceDetailsModalOpen(false);
          }
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 42, height: 42, borderRadius: 2.5, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <FileText size={22} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" fontWeight={900} color="#0f172a">
                  {selectedRmaServiceDetails?.rmaNo || 'Service Details'}
                </Typography>
                {selectedRmaServiceDetails && getStatusChip(selectedRmaServiceDetails.currentStatus)}
                {selectedRmaServiceDetails && getPriorityBadge(selectedRmaServiceDetails.priority)}
              </Box>
              <Typography variant="caption" color="#64748b">
                Ticket: <strong>{selectedRmaServiceDetails?.ticketNo}</strong> • From: <strong>{selectedRmaServiceDetails?.storeName}</strong>
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setServiceDetailsModalOpen(false)}><X size={20} /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          {loadingServiceDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
          ) : selectedRmaServiceDetails && (
            <Stack spacing={3}>
              {/* Product & Customer Details Card */}
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="#64748b">Customer Name</Typography>
                    <Typography variant="body2" fontWeight={800} color="#0f172a">{selectedRmaServiceDetails.customerSnapshot?.name}</Typography>
                    <Typography variant="caption" color="#16a34a" fontWeight={700}>{selectedRmaServiceDetails.customerSnapshot?.mobile}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="#64748b">Product Model & Serial</Typography>
                    <Typography variant="body2" fontWeight={800} color="#0f172a">{selectedRmaServiceDetails.modelNo}</Typography>
                    <Chip icon={<Barcode size={11} />} label={selectedRmaServiceDetails.serialNumber} size="small" sx={{ fontFamily: 'monospace', fontSize: '10.5px', height: 19, mt: 0.3 }} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="#64748b">Service Engineer</Typography>
                    <Typography variant="body2" fontWeight={800} color="#1d4ed8">
                      {selectedRmaServiceDetails.assignedEngineer?.name || 'Unassigned'}
                    </Typography>
                    <Typography variant="caption" color="#64748b">
                      Due: {selectedRmaServiceDetails.dueDate ? new Date(selectedRmaServiceDetails.dueDate).toLocaleDateString('en-IN') : 'Standard'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Customer Complaint */}
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  CUSTOMER COMPLAINT
                </Typography>
                <Paper elevation={0} sx={{ p: 2, mt: 0.8, borderRadius: 2, backgroundColor: '#fef2f2', border: '1px solid #fee2e2' }}>
                  <Typography variant="subtitle2" fontWeight={800} color="#991b1b">
                    {selectedRmaServiceDetails.customerComplaint?.category || 'Complaint Reported'}
                  </Typography>
                  <Typography variant="body2" color="#7f1d1d" sx={{ mt: 0.3 }}>
                    {selectedRmaServiceDetails.customerComplaint?.description || 'Customer reported device failure.'}
                  </Typography>
                </Paper>
              </Box>

              {/* Diagnosis */}
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  DIAGNOSIS & ROOT CAUSE
                </Typography>
                <Paper elevation={0} sx={{ p: 2, mt: 0.8, borderRadius: 2, backgroundColor: '#f5f3ff', border: '1px solid #ede9fe' }}>
                  <Typography variant="subtitle2" fontWeight={800} color="#5b21b6">
                    {selectedRmaServiceDetails.diagnosis?.rootCause || selectedRmaServiceDetails.diagnosis?.failureDesc || 'Inspection completed.'}
                  </Typography>
                  {selectedRmaServiceDetails.diagnosis?.observedFault && (
                    <Typography variant="caption" color="#6d28d9" sx={{ display: 'block', mt: 0.5 }}>
                      Observed Fault: <strong>{selectedRmaServiceDetails.diagnosis.observedFault}</strong>
                    </Typography>
                  )}
                  {selectedRmaServiceDetails.diagnosis?.techNotes && (
                    <Typography variant="body2" color="#4c1d95" sx={{ mt: 0.5 }}>
                      Notes: {selectedRmaServiceDetails.diagnosis.techNotes}
                    </Typography>
                  )}
                </Paper>
              </Box>

              {/* Product Replacement (2% Spares Inventory) */}
              {(selectedRmaServiceDetails.replacement?.isReplaced || selectedRmaServiceDetails.resolutionType === 'REPLACEMENT') && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                    <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      PRODUCT REPLACEMENT (2% SPARES INVENTORY)
                    </Typography>
                    <Chip label="✓ PRODUCT REPLACED" size="small" sx={{ fontWeight: 800, backgroundColor: '#dcfce7', color: '#15803d', fontSize: '10px' }} />
                  </Box>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, backgroundColor: '#f0fdf4', border: '1.5px solid #86efac' }}>
                    <Grid container spacing={2} alignItems="center">
                      {/* Defective Original Unit */}
                      <Grid item xs={12} sm={5}>
                        <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#ffffff', border: '1px solid #fecaca' }}>
                          <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>
                            🔴 Defective Original Unit
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ mt: 0.3 }}>
                            {selectedRmaServiceDetails.replacement?.defectiveModel || selectedRmaServiceDetails.modelNo}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#475569', fontFamily: 'monospace', fontWeight: 700, display: 'block' }}>
                            S/N: {selectedRmaServiceDetails.replacement?.defectiveSerialNumber || selectedRmaServiceDetails.replacement?.oldSerialNumber || selectedRmaServiceDetails.serialNumber || '—'}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Transition indicator */}
                      <Grid item xs={12} sm={2} sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <ArrowRight size={22} color="#16a34a" />
                          <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 800, fontSize: '9px', letterSpacing: '0.05em' }}>
                            REPLACED WITH
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Replacement Unit */}
                      <Grid item xs={12} sm={5}>
                        <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#ffffff', border: '1.5px solid #86efac' }}>
                          <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>
                            🟢 Replacement Unit (Spares Stock)
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={800} color="#15803d" sx={{ mt: 0.3 }}>
                            {selectedRmaServiceDetails.replacement?.replacementModel || selectedRmaServiceDetails.modelNo}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#166534', fontFamily: 'monospace', fontWeight: 800, display: 'block' }}>
                            S/N: {selectedRmaServiceDetails.replacement?.replacementSerial || selectedRmaServiceDetails.replacement?.newSerialNumber || '—'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 1.5, borderColor: '#bbf7d0' }} />

                    <Grid container spacing={1.5}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="#64748b">Source</Typography>
                        <Typography variant="body2" fontWeight={700} color="#0f172a">
                          {selectedRmaServiceDetails.replacement?.inventorySource || '2% Warranty Spares'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="#64748b">Location</Typography>
                        <Typography variant="body2" fontWeight={700} color="#0f172a">
                          {selectedRmaServiceDetails.replacement?.replacementLocation || 'Main Warehouse'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="#64748b">QC Verification</Typography>
                        <Typography variant="body2" fontWeight={800} color="#16a34a">
                          ✓ {selectedRmaServiceDetails.replacement?.qcResult || 'PASSED'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="#64748b">Replaced By</Typography>
                        <Typography variant="body2" fontWeight={700} color="#0f172a">
                          {selectedRmaServiceDetails.replacement?.replacedBy || selectedRmaServiceDetails.assignedEngineer?.name || 'Service Engineer'}
                        </Typography>
                      </Grid>
                      {selectedRmaServiceDetails.replacement?.reason && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="#64748b">Replacement Reason:</Typography>
                          <Typography variant="body2" color="#1e293b" fontWeight={600}>
                            {selectedRmaServiceDetails.replacement.reason}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Box>
              )}

              {/* Work Performed */}
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  EXACT WORK PERFORMED
                </Typography>
                <Paper elevation={0} sx={{ p: 2, mt: 0.8, borderRadius: 2, backgroundColor: '#f0fdf4', border: '1px solid #dcfce7' }}>
                  {selectedRmaServiceDetails.repair?.actionsTaken ? (
                    <Stack spacing={0.8}>
                      {selectedRmaServiceDetails.repair.actionsTaken.split('\n').filter(Boolean).map((line, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <CheckCircle2 size={16} color="#16a34a" style={{ marginTop: 2, flexShrink: 0 }} />
                          <Typography variant="body2" color="#14532d" fontWeight={600}>{line}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="#15803d" fontStyle="italic">
                      Detailed repair actions pending or standard service in progress.
                    </Typography>
                  )}
                </Paper>
              </Box>

              {/* Spare Parts Used */}
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  SPARE PARTS CONSUMED
                </Typography>
                <Paper elevation={0} sx={{ p: 2, mt: 0.8, borderRadius: 2, backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                  {(selectedRmaServiceDetails.spares || []).length > 0 ? (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: '11px' }}>Part Name & Code</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontSize: '11px' }}>Quantity</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '11px' }}>Unit Cost (₹)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '11px' }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedRmaServiceDetails.spares.map((sp, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ fontWeight: 700 }}>
                              <Typography variant="body2" fontWeight={800} color="#0f172a">
                                {sp.partName || sp.name}
                              </Typography>
                              {sp.partCode && (
                                <Chip
                                  label={sp.partCode}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '10px',
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    backgroundColor: '#f1f5f9',
                                    color: '#334155',
                                    mt: 0.3,
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell align="center">{sp.issuedQty || sp.requestedQty || sp.quantity || 1}</TableCell>
                            <TableCell align="right">₹{sp.unitCost || 0}</TableCell>
                            <TableCell align="right">
                              <Chip label={sp.status || 'ISSUED'} size="small" sx={{ fontWeight: 800, fontSize: '10px', backgroundColor: '#dcfce7', color: '#15803d' }} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Typography variant="body2" color="#64748b" fontStyle="italic">
                      No replacement spares required for this service unit.
                    </Typography>
                  )}
                </Paper>
              </Box>

              {/* Service Times & Duration */}
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  SERVICE TIME & TURNAROUND
                </Typography>
                <Paper elevation={0} sx={{ p: 2, mt: 0.8, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="#64748b">Allocated</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedRmaServiceDetails.assignedEngineer?.assignedAt ? new Date(selectedRmaServiceDetails.assignedEngineer.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="#64748b">Accepted</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedRmaServiceDetails.assignedEngineer?.acceptedAt ? new Date(selectedRmaServiceDetails.assignedEngineer.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="#64748b">Started</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedRmaServiceDetails.repair?.startedAt ? new Date(selectedRmaServiceDetails.repair.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="#64748b">Total Duration</Typography>
                      <Typography variant="body2" fontWeight={900} color="#2563eb">
                        {selectedRmaServiceDetails.serviceDurationFormatted || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>

              {/* QC Results */}
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  QUALITY CONTROL (QC) VALIDATION
                </Typography>
                <Paper elevation={0} sx={{ p: 2, mt: 0.8, borderRadius: 2, backgroundColor: selectedRmaServiceDetails.qc?.passed ? '#f0fdf4' : '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ShieldCheck size={18} color={selectedRmaServiceDetails.qc?.passed ? '#16a34a' : '#64748b'} />
                    <Typography variant="subtitle2" fontWeight={800} color={selectedRmaServiceDetails.qc?.passed ? '#15803d' : '#334155'}>
                      QC Result: {selectedRmaServiceDetails.qc?.passed ? '✓ PASSED ALL QUALITY CHECKS' : 'Pending Quality Testing'}
                    </Typography>
                  </Box>
                  {selectedRmaServiceDetails.qc?.notes && (
                    <Typography variant="body2" color="#475569" sx={{ mt: 0.5 }}>
                      Remarks: {selectedRmaServiceDetails.qc.notes}
                    </Typography>
                  )}
                </Paper>
              </Box>

              {/* Audit Timeline */}
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  SERVICE AUDIT TIMELINE
                </Typography>
                <Paper elevation={0} sx={{ p: 2, mt: 0.8, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Stack spacing={1.5}>
                    {(selectedRmaServiceDetails.auditTimeline || []).map((step, idx) => (
                      <Box key={step._id || idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#2563eb', mt: 0.7, flexShrink: 0 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" fontWeight={800} color="#0f172a">{step.action}</Typography>
                            <Typography variant="caption" color="#94a3b8" sx={{ fontSize: '10px' }}>
                              {new Date(step.createdAt || step.timestamp).toLocaleString()}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="#475569" sx={{ display: 'block' }}>{step.notes}</Typography>
                          <Typography variant="caption" color="#2563eb" sx={{ fontWeight: 600, fontSize: '10px' }}>
                            By: {step.userName} ({step.userRole})
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {isSuperAdmin && selectedTechnician ? (
            <Button
              startIcon={<ChevronLeft size={16} />}
              onClick={() => {
                setServiceDetailsModalOpen(false);
                setTechnicianModalOpen(true);
              }}
              sx={{ fontWeight: 800, textTransform: 'none', color: '#2563eb' }}
            >
              Back to {selectedTechnician.name}'s Workload Hub
            </Button>
          ) : <Box />}
          <Button
            variant="outlined"
            onClick={() => setServiceDetailsModalOpen(false)}
            sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* SERVICE PERSON: UPDATE WORK DETAILS & QC DIALOG */}
      {/* ========================================================================= */}
      <Dialog
        open={workDetailsModalOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setWorkDetailsModalOpen(false);
          }
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.2, pb: 1 }}>
          <CheckSquare size={22} color="#16a34a" />
          <Typography variant="h6" fontWeight={800}>
            Record Service Work Details & Spares — {workDetailsTargetRMA?.rmaNo}
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          <Stack spacing={2.5}>
            {/* 1. Diagnosis / Root Cause Update with Select Dropdown */}
            <Box>
              <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase">
                1. Diagnosis & Root Cause
              </Typography>
              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select / Choose Root Cause</InputLabel>
                    <Select
                      value={
                        [
                          'Power Adapter / Supply Failure',
                          'Burnt Diode / Resistor on PCB',
                          'Main Board / Chipset Short Circuit',
                          'Lens / Optical Image Sensor Fault',
                          'IR LED / Night Vision Board Malfunction',
                          'Network RJ45 Port / POE Damage',
                          'BNC Video Connector / Cable Fault',
                          'Firmware / Flash OS Corruption',
                          'Water Ingress / Moisture Corrosion',
                          'Physical Casing / Housing Broken',
                          'No Hardware Defect (Config / Reset Issue)'
                        ].includes(workDetailsForm.diagnosisUpdate.rootCause)
                          ? workDetailsForm.diagnosisUpdate.rootCause
                          : workDetailsForm.diagnosisUpdate.rootCause
                          ? 'CUSTOM'
                          : ''
                      }
                      label="Select / Choose Root Cause"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== 'CUSTOM') {
                          setWorkDetailsForm({
                            ...workDetailsForm,
                            diagnosisUpdate: { ...workDetailsForm.diagnosisUpdate, rootCause: val }
                          });
                        }
                      }}
                    >
                      <MenuItem value="" disabled>-- Select Root Cause --</MenuItem>
                      <MenuItem value="Power Adapter / Supply Failure">🔌 Power Adapter / Supply Failure</MenuItem>
                      <MenuItem value="Burnt Diode / Resistor on PCB">⚡ Burnt Diode / Resistor on PCB</MenuItem>
                      <MenuItem value="Main Board / Chipset Short Circuit">💻 Main Board / Chipset Short Circuit</MenuItem>
                      <MenuItem value="Lens / Optical Image Sensor Fault">📷 Lens / Optical Image Sensor Fault</MenuItem>
                      <MenuItem value="IR LED / Night Vision Board Malfunction">🌙 IR LED / Night Vision Board Malfunction</MenuItem>
                      <MenuItem value="Network RJ45 Port / POE Damage">🌐 Network RJ45 Port / POE Damage</MenuItem>
                      <MenuItem value="BNC Video Connector / Cable Fault">🔌 BNC Video Connector / Cable Fault</MenuItem>
                      <MenuItem value="Firmware / Flash OS Corruption">💾 Firmware / Flash OS Corruption</MenuItem>
                      <MenuItem value="Water Ingress / Moisture Corrosion">💧 Water Ingress / Moisture Corrosion</MenuItem>
                      <MenuItem value="Physical Casing / Housing Broken">🔨 Physical Casing / Housing Broken</MenuItem>
                      <MenuItem value="No Hardware Defect (Config / Reset Issue)">✅ No Hardware Defect (Config / Reset Issue)</MenuItem>
                      <MenuItem value="CUSTOM">✏️ Custom Root Cause (Type below)</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    size="small"
                    label="Root Cause Details"
                    placeholder="e.g. Power adapter failure / burnt diode"
                    value={workDetailsForm.diagnosisUpdate.rootCause}
                    onChange={(e) => setWorkDetailsForm({
                      ...workDetailsForm,
                      diagnosisUpdate: { ...workDetailsForm.diagnosisUpdate, rootCause: e.target.value }
                    })}
                    sx={{ mt: 1 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select / Choose Observed Fault</InputLabel>
                    <Select
                      value={
                        [
                          'Camera Not Powering ON (Dead)',
                          'No Video Output / Black Screen',
                          'Blurry / Distorted Video / Color Cast',
                          'Night Vision IR Dim / Not Working',
                          'Network Offline / Not Connecting to NVR',
                          'Continuous Rebooting / Beeping',
                          'PTZ Motor Not Rotating / Jammed',
                          'Physical Housing / Lens Scratched',
                          'Intermittent Power / Video Loss'
                        ].includes(workDetailsForm.diagnosisUpdate.observedFault)
                          ? workDetailsForm.diagnosisUpdate.observedFault
                          : workDetailsForm.diagnosisUpdate.observedFault
                          ? 'CUSTOM'
                          : ''
                      }
                      label="Select / Choose Observed Fault"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== 'CUSTOM') {
                          setWorkDetailsForm({
                            ...workDetailsForm,
                            diagnosisUpdate: { ...workDetailsForm.diagnosisUpdate, observedFault: val }
                          });
                        }
                      }}
                    >
                      <MenuItem value="" disabled>-- Select Observed Fault --</MenuItem>
                      <MenuItem value="Camera Not Powering ON (Dead)">🔴 Camera Not Powering ON (Dead)</MenuItem>
                      <MenuItem value="No Video Output / Black Screen">⬛ No Video Output / Black Screen</MenuItem>
                      <MenuItem value="Blurry / Distorted Video / Color Cast">📺 Blurry / Distorted Video / Color Cast</MenuItem>
                      <MenuItem value="Night Vision IR Dim / Not Working">🌙 Night Vision IR Dim / Not Working</MenuItem>
                      <MenuItem value="Network Offline / Not Connecting to NVR">🌐 Network Offline / Not Connecting to NVR</MenuItem>
                      <MenuItem value="Continuous Rebooting / Beeping">🔄 Continuous Rebooting / Beeping</MenuItem>
                      <MenuItem value="PTZ Motor Not Rotating / Jammed">⚙️ PTZ Motor Not Rotating / Jammed</MenuItem>
                      <MenuItem value="Physical Housing / Lens Scratched">🔨 Physical Housing / Lens Scratched</MenuItem>
                      <MenuItem value="Intermittent Power / Video Loss">⚠️ Intermittent Power / Video Loss</MenuItem>
                      <MenuItem value="CUSTOM">✏️ Custom Observed Fault (Type below)</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    size="small"
                    label="Observed Fault Details"
                    placeholder="e.g. Camera not powering ON"
                    value={workDetailsForm.diagnosisUpdate.observedFault}
                    onChange={(e) => setWorkDetailsForm({
                      ...workDetailsForm,
                      diagnosisUpdate: { ...workDetailsForm.diagnosisUpdate, observedFault: e.target.value }
                    })}
                    sx={{ mt: 1 }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* 2. Work Performed (Enter each action on a new line) */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase">
                  2. Work Performed (Enter each action on a new line)
                </Typography>
                <Typography variant="caption" color="#64748b" sx={{ fontSize: '11px' }}>
                  💡 Click quick chips to append actions
                </Typography>
              </Box>

              {/* Quick Action Chips */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 1 }}>
                {[
                  'Checked power supply & voltage',
                  'Tested & replaced power adapter',
                  'Cleaned PCB board & contacts',
                  'Replaced burnt diode / capacitor',
                  'Replaced IR LED board',
                  'Updated & flashed firmware',
                  'Calibrated lens focus & zoom',
                  '30-min burn-in video & load testing'
                ].map((actionText, idx) => (
                  <Chip
                    key={idx}
                    size="small"
                    label={`+ ${actionText}`}
                    onClick={() => {
                      const current = workDetailsForm.workPerformed || '';
                      const line = `✓ ${actionText}`;
                      if (!current.includes(line)) {
                        const updated = current ? `${current.trim()}\n${line}` : line;
                        setWorkDetailsForm({ ...workDetailsForm, workPerformed: updated });
                      }
                    }}
                    sx={{
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: '#f1f5f9',
                      color: '#334155',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#e2e8f0', color: '#0f172a' }
                    }}
                  />
                ))}
              </Box>

              <TextField
                fullWidth
                multiline
                rows={3.5}
                size="small"
                placeholder="✓ Checked power supply&#10;✓ Adapter tested&#10;✓ Camera board tested&#10;✓ Replaced faulty adapter&#10;✓ Camera tested for 30 mins"
                value={workDetailsForm.workPerformed}
                onChange={(e) => setWorkDetailsForm({ ...workDetailsForm, workPerformed: e.target.value })}
              />
            </Box>

            {/* 3. Service Part Requirement Selection (Optional Master Toggle) */}
            <Box>
              <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" sx={{ mb: 1, display: 'block' }}>
                3. Service Part Requirement
              </Typography>

              {/* Master Checkbox: Toggle Service Part Requirement */}
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  border: enablePartRequirement ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: enablePartRequirement ? '#eff6ff' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  mb: enablePartRequirement ? 1.5 : 0,
                  '&:hover': { borderColor: '#2563eb' }
                }}
                onClick={() => {
                  const next = !enablePartRequirement;
                  setEnablePartRequirement(next);
                  if (!next) {
                    setNeedSparePart(false);
                    setNeedProductReplacement(false);
                  }
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={enablePartRequirement}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setEnablePartRequirement(checked);
                        if (!checked) {
                          setNeedSparePart(false);
                          setNeedProductReplacement(false);
                        }
                      }}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={800} color="#0f172a">
                        ⚙️ Service Part Requirement
                      </Typography>
                      <Typography variant="caption" color="#64748b">
                        Tick this checkbox ONLY if this service requires component spare parts or unit replacement from spares inventory.
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0, width: '100%' }}
                />
              </Paper>

              {/* Requirement Checkboxes Row - ONLY shown when enablePartRequirement is true */}
              {enablePartRequirement && (
                <Grid container spacing={2} sx={{ mb: 1.5 }}>
                  {/* Checkbox 1: Spare Part Required */}
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: needSparePart ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        backgroundColor: needSparePart ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: '#2563eb' }
                      }}
                      onClick={() => setNeedSparePart(!needSparePart)}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={needSparePart}
                            onChange={(e) => setNeedSparePart(e.target.checked)}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight={800} color="#0f172a">
                              🔧 Need Spare Part
                            </Typography>
                            <Typography variant="caption" color="#64748b">
                              Replace specific components (e.g. Diode, IC, Cable, Board)
                            </Typography>
                          </Box>
                        }
                        sx={{ m: 0, width: '100%' }}
                      />
                    </Paper>
                  </Grid>

                  {/* Checkbox 2: Spares Inventory Product Replacement */}
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: needProductReplacement ? '2px solid #16a34a' : '1px solid #cbd5e1',
                        backgroundColor: needProductReplacement ? '#f0fdf4' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: '#16a34a' }
                      }}
                      onClick={() => setNeedProductReplacement(!needProductReplacement)}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={needProductReplacement}
                            onChange={(e) => setNeedProductReplacement(e.target.checked)}
                            color="success"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight={800} color="#0f172a">
                              📦 Replace Product (Spares Inventory)
                            </Typography>
                            <Typography variant="caption" color="#64748b">
                              Swap with whole replacement unit from 2% Spares Inventory
                            </Typography>
                          </Box>
                        }
                        sx={{ m: 0, width: '100%' }}
                      />
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* 3A: SPARE PARTS SELECTION (Active when needSparePart is checked) */}
              {needSparePart && (
                <Box sx={{ p: 2, mb: 2, borderRadius: 2.5, backgroundColor: '#f8fafc', border: '1px solid #c7d2fe' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={800} color="#1e40af">
                      🔧 Component Spare Parts Required ({workDetailsTargetRMA?.modelNo || 'Unit'})
                    </Typography>
                    {loadingCompatibleSpares ? (
                      <Typography variant="caption" color="#2563eb">Loading spare parts catalog...</Typography>
                    ) : (
                      <Typography variant="caption" color="#64748b">
                        {compatibleSparesList.length} part(s) available
                      </Typography>
                    )}
                  </Box>

                  <Grid container spacing={1.5} alignItems="center">
                    {/* Select Spare Part Dropdown */}
                    <Grid item xs={12} sm={newSpareItem.trackingType === 'SERIALIZED' ? 6 : 12}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Select Spare Part</InputLabel>
                        <Select
                          value={newSpareItem.partCode || ''}
                          label="Select Spare Part"
                          onChange={async (e) => {
                            const selCode = e.target.value;
                            const matched = compatibleSparesList.find((p) => p.code === selCode);
                            if (matched) {
                              let serials = Array.isArray(matched.availableSerials) ? [...matched.availableSerials] : [];
                              const isSer = (matched.trackingType || 'SERIALIZED') === 'SERIALIZED';

                              setNewSpareItem({
                                name: matched.name,
                                partCode: matched.code,
                                trackingType: matched.trackingType || 'SERIALIZED',
                                quantity: 1,
                                unitCost: matched.sellingPrice || matched.purchaseCost || 0,
                                availableSerials: serials,
                                serialNumber: serials.length > 0 ? serials[0] : ''
                              });

                              // If serialized and serials list was empty, fetch live from backend API
                              if (isSer && serials.length === 0) {
                                try {
                                  const sRes = await fetch(`${API_BASE}/spare-parts/${matched._id || matched.code}/serials?status=AVAILABLE`);
                                  const sData = await sRes.json();
                                  if (sData.success && Array.isArray(sData.data) && sData.data.length > 0) {
                                    const fetchedSerials = sData.data.map((s) => s.serialNumber || s).filter(Boolean);
                                    setNewSpareItem((prev) => ({
                                      ...prev,
                                      availableSerials: fetchedSerials,
                                      serialNumber: prev.serialNumber || fetchedSerials[0] || ''
                                    }));
                                  }
                                } catch (err) {
                                  console.warn('Failed to fetch available serials for spare:', err);
                                }
                              }
                            }
                          }}
                        >
                          <MenuItem value="" disabled>-- Choose Spare Part --</MenuItem>
                          {compatibleSparesList.length === 0 ? (
                            <MenuItem value="" disabled>No spare parts registered (Add parts in Spare Parts Management)</MenuItem>
                          ) : (
                            compatibleSparesList.map((sp) => (
                              <MenuItem key={sp.code} value={sp.code} disabled={sp.availableStock <= 0}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 2 }}>
                                  <Typography variant="body2" fontWeight={700}>
                                    {sp.name} <Typography component="span" variant="caption" sx={{ fontFamily: 'monospace', color: '#64748b' }}>({sp.code})</Typography>
                                    <Chip label={sp.category || 'General'} size="small" sx={{ ml: 0.8, height: 16, fontSize: '9px', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#475569' }} />
                                    {sp.trackingType === 'SERIALIZED' && (
                                      <Chip label="S/N" size="small" sx={{ ml: 0.5, height: 16, fontSize: '9px', fontWeight: 800, backgroundColor: '#e0e7ff', color: '#4338ca' }} />
                                    )}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: sp.availableStock > 0 ? '#16a34a' : '#dc2626', fontWeight: 800 }}>
                                    {sp.availableStock > 0 ? `🟢 ${sp.availableStock} Avail (₹${sp.sellingPrice || sp.purchaseCost})` : '🔴 Out of Stock'}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))
                          )}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* S/N Selection for Serialized Parts */}
                    {newSpareItem.trackingType === 'SERIALIZED' && (
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Select Serial Number (S/N) *</InputLabel>
                          <Select
                            value={newSpareItem.serialNumber || ''}
                            label="Select Serial Number (S/N) *"
                            onChange={(e) => setNewSpareItem({ ...newSpareItem, serialNumber: e.target.value })}
                          >
                            {(newSpareItem.availableSerials || []).length === 0 ? (
                              <MenuItem value="" disabled>No available serial numbers found</MenuItem>
                            ) : (
                              newSpareItem.availableSerials.map((sn) => (
                                <MenuItem key={sn} value={sn} sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                  🏷️ {sn}
                                </MenuItem>
                              ))
                            )}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}

                    {/* Quantity, Unit Cost, and Add Button */}
                    <Grid item xs={6} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Quantity"
                        value={newSpareItem.quantity}
                        disabled={newSpareItem.trackingType === 'SERIALIZED' && Boolean(newSpareItem.serialNumber)}
                        onChange={(e) => setNewSpareItem({ ...newSpareItem, quantity: Number(e.target.value) || 1 })}
                      />
                    </Grid>

                    <Grid item xs={6} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Unit Cost (₹)"
                        value={newSpareItem.unitCost}
                        onChange={(e) => setNewSpareItem({ ...newSpareItem, unitCost: Number(e.target.value) || 0 })}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        startIcon={<Plus size={16} />}
                        onClick={handleAddSpareItem}
                        disabled={!newSpareItem.name}
                        sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.5, py: 0.9, backgroundColor: '#2563eb' }}
                      >
                        + Add to Repair
                      </Button>
                    </Grid>
                  </Grid>

                  {workDetailsForm.sparesUsed.length > 0 && (
                    <Paper elevation={0} sx={{ p: 1.5, mt: 1.5, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                      <Stack spacing={0.8}>
                        {workDetailsForm.sparesUsed.map((sp, idx) => (
                          <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight={700}>
                                {sp.name || sp.partName} {sp.partCode ? `[${sp.partCode}]` : ''} × {sp.quantity || sp.issuedQty || 1} {sp.unitCost ? `(₹${sp.unitCost} each)` : ''}
                              </Typography>
                              {sp.serialNumber && (
                                <Chip label={`S/N: ${sp.serialNumber}`} size="small" sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '10.5px', backgroundColor: '#eef2ff', color: '#4338ca' }} />
                              )}
                            </Box>
                            <IconButton size="small" color="error" onClick={() => handleRemoveSpareItem(idx)}>
                              <Trash2 size={14} />
                            </IconButton>
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  )}
                </Box>
              )}

              {/* 3B: PRODUCT REPLACEMENT FROM SPARES INVENTORY (Active when needProductReplacement is checked) */}
              {needProductReplacement && (
                <Box sx={{ p: 2, mb: 1.5, borderRadius: 2.5, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                    <Typography variant="subtitle2" fontWeight={800} color="#166534">
                      📦 Product Replacement from Spares Inventory (2% Warranty Stock)
                    </Typography>
                    {loadingSparesInventory && (
                      <Typography variant="caption" color="#16a34a">Loading spares inventory...</Typography>
                    )}
                  </Box>

                  <Grid container spacing={1.5} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Select Replacement Unit from Spares Inventory</InputLabel>
                        <Select
                          value={replacementProduct.inventoryId || ''}
                          label="Select Replacement Unit from Spares Inventory"
                          onChange={(e) => {
                            const invId = e.target.value;
                            const matched = sparesInventoryList.find(item => item._id === invId);
                            if (matched) {
                              const codes = (matched.scannedCodes || '').split('\n').map(c => c.trim()).filter(Boolean);
                              setReplacementProduct({
                                inventoryId: matched._id,
                                modelNo: matched.modelNo || matched.model || '',
                                location: matched.location || 'Main Warehouse',
                                dealerPrice: matched.dealerPrice || 0,
                                availableCodes: codes,
                                serialNumber: codes.length > 0 ? codes[0] : '',
                                quantity: 1
                              });
                            }
                          }}
                        >
                          <MenuItem value="" disabled>-- Choose Spares Inventory Product --</MenuItem>
                          {sparesInventoryList.length === 0 ? (
                            <MenuItem value="" disabled>No products available in Spares Inventory</MenuItem>
                          ) : (
                            sparesInventoryList.map((inv) => (
                              <MenuItem key={inv._id} value={inv._id} disabled={(inv.quantity || 0) <= 0}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                  <Typography variant="body2" fontWeight={700}>
                                    {inv.modelNo || inv.model} <Typography component="span" variant="caption" color="#64748b">({inv.location || 'Warehouse'})</Typography>
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: (inv.quantity || 0) > 0 ? '#16a34a' : '#dc2626', fontWeight: 800 }}>
                                    {(inv.quantity || 0) > 0 ? `🟢 ${inv.quantity} Available` : '🔴 0 Available'}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))
                          )}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* S/N Barcode selection if scannedCodes exist */}
                    {replacementProduct.availableCodes && replacementProduct.availableCodes.length > 0 && (
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Replacement S/N Barcode</InputLabel>
                          <Select
                            value={replacementProduct.serialNumber || ''}
                            label="Replacement S/N Barcode"
                            onChange={(e) => setReplacementProduct({ ...replacementProduct, serialNumber: e.target.value })}
                          >
                            {replacementProduct.availableCodes.map((code) => (
                              <MenuItem key={code} value={code} sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                🏷️ {code}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}

                    <Grid item xs={12} sm={replacementProduct.availableCodes?.length > 0 ? 2 : 6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Location"
                        disabled
                        value={replacementProduct.location || 'Main Warehouse'}
                      />
                    </Grid>
                  </Grid>

                  {replacementProduct.inventoryId && (
                    <Paper elevation={0} sx={{ p: 1.2, mt: 1.2, backgroundColor: '#ffffff', border: '1px solid #86efac', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RotateCcw size={16} color="#16a34a" />
                        <Typography variant="body2" fontWeight={800} color="#15803d">
                          Replacing defective unit with: <strong>{replacementProduct.modelNo}</strong>
                        </Typography>
                        {replacementProduct.serialNumber && (
                          <Chip label={`S/N: ${replacementProduct.serialNumber}`} size="small" sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '10.5px', backgroundColor: '#dcfce7', color: '#15803d' }} />
                        )}
                      </Box>
                      <IconButton size="small" color="error" onClick={() => setReplacementProduct({ inventoryId: '', modelNo: '', serialNumber: '', location: '', dealerPrice: 0, availableCodes: [] })}>
                        <X size={14} />
                      </IconButton>
                    </Paper>
                  )}
                </Box>
              )}
            </Box>

            {/* 4. Quality Control & Service Remarks (Dynamic based on Replacement vs Repair) */}
            <Box>
              <Typography variant="caption" fontWeight={800} color={enablePartRequirement && needProductReplacement ? '#166534' : '#334155'} textTransform="uppercase">
                {enablePartRequirement && needProductReplacement
                  ? '4. Replacement Verification & Quality Control'
                  : '4. Quality Control & Service Remarks'}
              </Typography>
              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{enablePartRequirement && needProductReplacement ? 'Replacement QC' : 'QC Result'}</InputLabel>
                    <Select
                      value={workDetailsForm.qcResult}
                      label={enablePartRequirement && needProductReplacement ? 'Replacement QC' : 'QC Result'}
                      onChange={(e) => setWorkDetailsForm({ ...workDetailsForm, qcResult: e.target.value })}
                    >
                      <MenuItem value="PASSED">✓ PASSED</MenuItem>
                      <MenuItem value="FAILED">✗ FAILED</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    size="small"
                    label={enablePartRequirement && needProductReplacement ? 'Replacement Verification Notes' : 'Inspector Notes / Burn-in'}
                    placeholder={
                      enablePartRequirement && needProductReplacement
                        ? 'e.g. Verified replacement S/N, power-on test passed, video clear.'
                        : 'Inspector notes / burn-in test results...'
                    }
                    value={workDetailsForm.qcNotes}
                    onChange={(e) => setWorkDetailsForm({ ...workDetailsForm, qcNotes: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    label="Service Person Final Remarks"
                    placeholder={
                      enablePartRequirement && needProductReplacement
                        ? 'e.g. Defective unit replaced with Spares Inventory stock. Verified and ready for customer dispatch.'
                        : 'e.g. Unit tested for 30 minutes, video feed clean, IR LEDs functional.'
                    }
                    value={workDetailsForm.serviceRemarks}
                    onChange={(e) => setWorkDetailsForm({ ...workDetailsForm, serviceRemarks: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Mark as Completed */}
            <Paper elevation={0} sx={{ p: 1.5, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={workDetailsForm.markCompleted}
                    onChange={(e) => setWorkDetailsForm({ ...workDetailsForm, markCompleted: e.target.checked })}
                    color="success"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={800} color="#15803d">
                      {enablePartRequirement && needProductReplacement
                        ? '✅ Complete Product Replacement & Submit for Dispatch'
                        : 'Complete Repair & Submit for QC / Dispatch'}
                    </Typography>
                    <Typography variant="caption" color="#166534">
                      {enablePartRequirement && needProductReplacement
                        ? 'Confirms the replacement unit has passed verification, deducts the selected unit from Spares Inventory, records the replacement serial number, and sends the RMA for dispatch.'
                        : 'Sets status to REPAIR COMPLETED, stops duration timer, and notifies Super Admin.'}
                    </Typography>
                  </Box>
                }
              />
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setWorkDetailsModalOpen(false)} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveWorkDetails}
            disabled={savingWorkDetails}
            startIcon={savingWorkDetails ? <CircularProgress size={16} color="inherit" /> : <Check size={16} />}
            sx={{
              backgroundColor: '#16a34a',
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: 2,
              px: 2.5,
              '&:hover': { backgroundColor: '#15803d' }
            }}
          >
            {savingWorkDetails ? 'Saving...' : workDetailsForm.markCompleted ? 'COMPLETE SERVICE' : 'SAVE PROGRESS'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* SUPER ADMIN ALLOCATION MODAL DIALOG */}
      {/* ========================================================================= */}
      <Dialog
        open={allocateModalOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setAllocateModalOpen(false);
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 0,
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.2, px: 3, py: 2 }}>
          <UserCheck size={22} color="#2563eb" style={{ flexShrink: 0 }} />
          <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', fontSize: '18px', lineHeight: 1.2 }}>
            Allocate RMA Service to Technician
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5, boxSizing: 'border-box' }}>
          {targetRMA && (
            <Box
              sx={{
                width: '100%',
                boxSizing: 'border-box',
                mb: 2.5,
                p: 2,
                borderRadius: 2,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontWeight: 600 }}>
                Target RMA Work Order
              </Typography>
              <Typography variant="subtitle2" fontWeight={800} color="#1d4ed8" sx={{ fontFamily: 'monospace', fontSize: '14px', my: 0.3 }}>
                {targetRMA.rmaNo} • {targetRMA.modelNo}
              </Typography>
              <Typography variant="caption" color="#475569" sx={{ display: 'block' }}>
                Customer: <strong>{targetRMA.customerSnapshot?.name || 'Walk-in'}</strong> • From: <strong>{targetRMA.storeName}</strong>
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8, width: '100%' }}>
            {/* ROW 1: Service Person (1fr) & Priority Level (1.6fr) */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1.6fr' },
                gap: '12px',
                width: '100%'
              }}
            >
              <FormControl fullWidth size="small" required sx={{ minWidth: 0 }}>
                <InputLabel>Service Person *</InputLabel>
                <Select
                  value={assignForm.engineerName}
                  label="Service Person *"
                  onChange={(e) => {
                    const selName = e.target.value;
                    const matched = servicePersonsList.find((u) => u.name === selName);
                    setAssignForm({
                      ...assignForm,
                      engineerName: selName,
                      engineerId: matched?._id || matched?.id || '',
                      engineerEmail: matched?.email || ''
                    });
                  }}
                  sx={{ minWidth: 0, height: 40 }}
                >
                  <MenuItem value="" disabled>-- Choose Service Person --</MenuItem>
                  {servicePersonsList.length === 0 ? (
                    <MenuItem value="" disabled>No registered Service Persons</MenuItem>
                  ) : (
                    servicePersonsList.map((u) => (
                      <MenuItem key={u._id || u.email} value={u.name}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={700}>{u.name}</Typography>
                          <Typography variant="caption" color="#64748b">
                            {u.serviceCenter || u.assignedLocation || u.role}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={{ minWidth: 0 }}>
                <InputLabel>Priority Level</InputLabel>
                <Select
                  value={assignForm.priority}
                  label="Priority Level"
                  onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}
                  sx={{ minWidth: 0, height: 40 }}
                >
                  <MenuItem value="URGENT">🔴 URGENT (Critical / Same Day)</MenuItem>
                  <MenuItem value="HIGH">🔴 HIGH (Priority Service)</MenuItem>
                  <MenuItem value="NORMAL">🟠 NORMAL (Standard Turnaround)</MenuItem>
                  <MenuItem value="LOW">🟢 LOW (Routine / General)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* ROW 2: Target Due Date (1fr) & Instructions (1.6fr) */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1.6fr' },
                gap: '12px',
                width: '100%',
                alignItems: 'start'
              }}
            >
              <TextField
                fullWidth
                size="small"
                label="Target Due Date"
                type="date"
                value={assignForm.dueDate}
                onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  minWidth: 0,
                  '& .MuiInputBase-root': { height: 40 }
                }}
              />

              <TextField
                fullWidth
                size="small"
                multiline
                rows={2.8}
                label="Instructions / Special Notes"
                placeholder="e.g. Inspect mainboard power rail immediately..."
                value={assignForm.assignmentNotes}
                onChange={(e) => setAssignForm({ ...assignForm, assignmentNotes: e.target.value })}
                sx={{ minWidth: 0 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button
            onClick={() => setAllocateModalOpen(false)}
            sx={{ color: '#64748b', textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignSubmit}
            disabled={assignLoading || !assignForm.engineerName}
            startIcon={assignLoading ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
            sx={{
              backgroundColor: '#2563eb',
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: 2,
              px: 3,
              py: 1,
              minWidth: '150px',
              '&:hover': { backgroundColor: '#1d4ed8' }
            }}
          >
            {assignLoading ? 'Allocating...' : 'ASSIGN SERVICE'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* SUPER ADMIN: DEDICATED TECHNICIAN WORKLOAD & PERFORMANCE BREAKDOWN MODAL */}
      {/* ========================================================================= */}
      <Dialog
        open={technicianModalOpen}
        onClose={() => setTechnicianModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 0.5 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 46, height: 46, backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 900, fontSize: '18px' }}>
              {selectedTechnician?.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={900} color="#0f172a">
                {selectedTechnician?.name} — Performance & Workload Hub
              </Typography>
              <Typography variant="caption" color="#64748b">
                Service Person: <strong>{selectedTechnician?.name}</strong> • Location: <strong>{selectedTechnician?.serviceCenter || 'Service Center'}</strong> • Contact: {selectedTechnician?.email || 'N/A'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setTechnicianModalOpen(false)} sx={{ color: '#94a3b8' }}>
            <X size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {selectedTechnician && (
            <Stack spacing={3}>
              {/* 8 Performance KPI Cards */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)', lg: 'repeat(8, 1fr)' },
                gap: 1.5,
                width: '100%'
              }}>
                <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', borderRadius: 2.5, backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" color="#475569" fontWeight={800} fontSize="10px">ASSIGNED</Typography>
                  <Typography variant="h5" fontWeight={900} color="#0f172a">{selectedTechnician.assigned || 0}</Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', borderRadius: 2.5, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <Typography variant="caption" color="#0369a1" fontWeight={800} fontSize="10px">ACCEPTED</Typography>
                  <Typography variant="h5" fontWeight={900} color="#0284c7">{selectedTechnician.accepted || 0}</Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', borderRadius: 2.5, backgroundColor: '#faf5ff', border: '1px solid #e9d5ff' }}>
                  <Typography variant="caption" color="#7c3aed" fontWeight={800} fontSize="10px">STARTED</Typography>
                  <Typography variant="h5" fontWeight={900} color="#6d28d9">{selectedTechnician.started || 0}</Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', borderRadius: 2.5, backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <Typography variant="caption" color="#c2410c" fontWeight={800} fontSize="10px">IN PROCESS</Typography>
                  <Typography variant="h5" fontWeight={900} color="#ea580c">{selectedTechnician.inProcess || 0}</Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', borderRadius: 2.5, backgroundColor: '#fefce8', border: '1px solid #fde68a' }}>
                  <Typography variant="caption" color="#b45309" fontWeight={800} fontSize="10px">WAITING SPARE</Typography>
                  <Typography variant="h5" fontWeight={900} color="#854d0e">{selectedTechnician.waitingSpare || 0}</Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', borderRadius: 2.5, backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' }}>
                  <Typography variant="caption" color="#4338ca" fontWeight={800} fontSize="10px">QC TESTING</Typography>
                  <Typography variant="h5" fontWeight={900} color="#3730a3">{selectedTechnician.qcTesting || 0}</Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', borderRadius: 2.5, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <Typography variant="caption" color="#15803d" fontWeight={800} fontSize="10px">COMPLETED</Typography>
                  <Typography variant="h5" fontWeight={900} color="#166534">{selectedTechnician.completed || 0}</Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', borderRadius: 2.5, backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                  <Typography variant="caption" color="#b91c1c" fontWeight={800} fontSize="10px">OVERDUE</Typography>
                  <Typography variant="h5" fontWeight={900} color="#991b1b">{selectedTechnician.overdue || 0}</Typography>
                </Paper>
              </Box>

              {/* Work Orders Table */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Layers size={16} color="#2563eb" />
                    All Assigned Service Work Orders ({selectedTechnician.recentRMAs?.length || 0})
                  </Typography>
                  <Typography variant="caption" color="#64748b">
                    Click <strong>View Work Details</strong> on any unit to see the exact repair checklist, diagnosis, spares, and QC record.
                  </Typography>
                </Box>

                <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5 }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', py: 1.3 }}>Unit RMA No</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', py: 1.3 }}>Customer</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', py: 1.3 }}>Product & Serial</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', py: 1.3 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', py: 1.3 }}>Priority</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', py: 1.3 }}>Target Due Date</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', py: 1.3, pr: 2 }}>Exact Work Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(!selectedTechnician.recentRMAs || selectedTechnician.recentRMAs.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="#64748b">No active service records found for this technician.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedTechnician.recentRMAs.map((r) => (
                          <TableRow key={r._id} hover>
                            <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace', color: '#1d4ed8' }}>
                              {r.rmaNo}
                              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontSize: '9.5px' }}>Ticket: {r.ticketNo}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={700} color="#0f172a">{r.customerName || 'Customer'}</Typography>
                              <Typography variant="caption" color="#64748b">{r.customerMobile}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={700} color="#0f172a">{r.modelNo}</Typography>
                              <Typography variant="caption" color="#64748b" sx={{ fontFamily: 'monospace' }}>{r.serialNumber}</Typography>
                            </TableCell>
                            <TableCell>{getStatusChip(r.currentStatus)}</TableCell>
                            <TableCell>{getPriorityBadge(r.priority)}</TableCell>
                            <TableCell>
                              {r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-IN') : '—'}
                            </TableCell>
                            <TableCell align="right" sx={{ pr: 2 }}>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<Eye size={12} />}
                                onClick={() => {
                                  setTechnicianModalOpen(false);
                                  handleOpenServiceDetails(r._id);
                                }}
                                sx={{
                                  backgroundColor: '#2563eb',
                                  textTransform: 'none',
                                  fontWeight: 800,
                                  fontSize: '11px',
                                  borderRadius: 1.5,
                                  py: 0.4,
                                  px: 1.8,
                                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                                  '&:hover': { backgroundColor: '#1d4ed8' }
                                }}
                              >
                                View Work Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3, justifyContent: 'space-between' }}>
          <Typography variant="caption" color="#64748b">
            Avg Turnaround Time: <strong>{selectedTechnician?.avgCompletionHours ? `${selectedTechnician.avgCompletionHours} hours` : 'Not recorded yet'}</strong>
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setTechnicianModalOpen(false)}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modern In-App Notification / Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: 999999 }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{
            width: '100%',
            minWidth: '340px',
            maxWidth: '680px',
            fontWeight: 700,
            fontSize: '0.92rem',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
