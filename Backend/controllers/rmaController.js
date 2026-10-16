const RMA = require('../models/RMA');
const RMAHistory = require('../models/RMAHistory');
const ServiceRequest = require('../models/ServiceRequest');
const ServiceInventoryTransaction = require('../models/ServiceInventoryTransaction');
const FailureCodeMaster = require('../models/FailureCodeMaster');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const Warranty = require('../models/Warranty');
const { validateTransition } = require('../services/rmaWorkflowValidator');
const { notifyServiceStatusChange } = require('../services/notificationService');
const { notifyServiceAssigned, notifyServiceStageProgress } = require('../services/serviceNotificationHelper');

// 1. Get All RMAs
const getAllRMAs = async (req, res) => {
  try {
    const { storeName, status, engineerId, search, userRole, userName, userId, page = 1, limit = 50 } = req.query;
    const query = {};

    const roleLower = (userRole || req.user?.role || '').toLowerCase().trim();
    const isSuperAdmin = ['admin', 'super admin', 'manager', 'warehouse', 'headoffice'].includes(roleLower) || roleLower.includes('admin');
    const isServicePerson = roleLower.includes('service') || roleLower === 'engineer' || roleLower === 'technician';
    const currentUserName = (userName || req.user?.name || '').trim();
    const currentUserId = (userId || req.user?._id || req.user?.id || '').toString().trim();

    if (!isSuperAdmin && !isServicePerson && storeName) {
      query.storeName = { $regex: new RegExp(`^${storeName}$`, 'i') };
    }

    // Role-based visibility for Service Persons:
    // Only show RMAs explicitly allocated to THIS Service Person by Super Admin!
    // Unallocated service products are hidden from Service Persons until allocated by Super Admin.
    if (isServicePerson && !isSuperAdmin && currentUserName) {
      const userRegex = new RegExp(`^${currentUserName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      query.$or = [
        { 'assignedEngineer.name': { $regex: userRegex } },
        ...(currentUserId ? [{ 'assignedEngineer.engineerId': currentUserId }] : [])
      ];
    } else if (engineerId) {
      query['assignedEngineer.engineerId'] = engineerId;
    }

    if (status && status !== 'ALL') {
      query.currentStatus = status;
    }

    if (search) {
      const searchConditions = [
        { rmaNo: { $regex: search, $options: 'i' } },
        { ticketNo: { $regex: search, $options: 'i' } },
        { modelNo: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.mobile': { $regex: search, $options: 'i' } },
      ];
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: searchConditions }
        ];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      RMA.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      RMA.countDocuments(query),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems: total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('Get RMAs Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Get Single RMA 360° Profile
const getRMADetails = async (req, res) => {
  try {
    const { id } = req.params;
    const rma = await RMA.findById(id);
    if (!rma) {
      return res.status(404).json({ success: false, message: 'RMA record not found' });
    }

    const [history, transactions, serviceRequest] = await Promise.all([
      RMAHistory.find({ rmaId: rma._id }).sort({ createdAt: -1 }),
      ServiceInventoryTransaction.find({ rmaId: rma._id }).sort({ createdAt: -1 }),
      ServiceRequest.findById(rma.serviceRequestId),
    ]);

    res.json({
      success: true,
      data: {
        rma,
        serviceRequest,
        history,
        transactions,
      },
    });
  } catch (err) {
    console.error('Get RMA Details Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Controlled Status Transition
const updateRMAStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus, notes, performedBy, userRole, overrideReason } = req.body;

    const rma = await RMA.findById(id);
    if (!rma) {
      return res.status(404).json({ success: false, message: 'RMA not found' });
    }

    const isSuperAdmin = ['admin', 'super admin', 'manager'].includes((userRole || '').toLowerCase());
    const validation = validateTransition(rma.currentStatus, newStatus, isSuperAdmin && !!overrideReason);

    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const fromStatus = rma.currentStatus;
    rma.currentStatus = newStatus;

    if (overrideReason) {
      rma.override = {
        isOverridden: true,
        previousDecision: fromStatus,
        newDecision: newStatus,
        reason: overrideReason,
        approvedBy: performedBy || 'Admin',
        overrideDate: new Date(),
      };
    }

    if (newStatus === 'CLOSED') {
      rma.closedAt = new Date();
      rma.closedBy = performedBy || 'Store User';
      const durationMs = new Date() - new Date(rma.receivedAt || rma.createdAt);
      rma.tatHours = Math.round(durationMs / (1000 * 60 * 60));
    }

    await rma.save();

    // Log audit history
    await RMAHistory.create({
      rmaId: rma._id,
      rmaNo: rma.rmaNo,
      serviceRequestId: rma.serviceRequestId,
      ticketNo: rma.ticketNo,
      action: 'STATUS_CHANGED',
      fromStatus,
      toStatus: newStatus,
      userName: performedBy || 'System',
      userRole: userRole || 'STORE_USER',
      notes: notes || `Status transitioned from ${fromStatus} to ${newStatus}`,
      metadata: { overrideReason },
    });

    // Check if notification event is needed
    if (['REPAIR_COMPLETED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED'].includes(newStatus)) {
      await notifyServiceStatusChange({
        event: newStatus,
        rma,
      });
    }

    res.json({
      success: true,
      message: `RMA #${rma.rmaNo} status updated to ${newStatus}`,
      data: rma,
    });
  } catch (err) {
    console.error('Update RMA Status Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Initial Inspection
const recordInitialInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      physicalCondition,
      waterDamage,
      sealBroken,
      powerTest,
      visibleBurn,
      accessoriesReceived,
      complaintReproduced,
      photos,
      result, // 'NO_FAULT_FOUND' or 'FAULT_CONFIRMED'
      notes,
      inspectedBy,
    } = req.body;

    const rma = await RMA.findById(id);
    if (!rma) return res.status(404).json({ success: false, message: 'RMA not found' });

    rma.initialInspection = {
      physicalCondition: physicalCondition || 'Good',
      waterDamage: Boolean(waterDamage),
      sealBroken: Boolean(sealBroken),
      powerTest: powerTest || 'Pass',
      visibleBurn: Boolean(visibleBurn),
      accessoriesReceived: accessoriesReceived || [],
      complaintReproduced: Boolean(complaintReproduced),
      photos: photos || [],
      result: result || 'FAULT_CONFIRMED',
      notes: notes || '',
      inspectedBy: inspectedBy || 'Store User',
      inspectedAt: new Date(),
    };

    // Auto branch status
    const newStatus = result === 'NO_FAULT_FOUND' ? 'NO_FAULT_FOUND' : 'FAULT_CONFIRMED';
    const fromStatus = rma.currentStatus;
    rma.currentStatus = newStatus;
    await rma.save();

    await RMAHistory.create({
      rmaId: rma._id,
      rmaNo: rma.rmaNo,
      serviceRequestId: rma.serviceRequestId,
      ticketNo: rma.ticketNo,
      action: 'INITIAL_INSPECTION',
      fromStatus,
      toStatus: newStatus,
      userName: inspectedBy || 'Store User',
      notes: `Inspection completed: ${result}. ${notes || ''}`,
    });

    if (newStatus === 'FAULT_CONFIRMED') {
      await notifyServiceStatusChange({
        event: 'FAULT_CONFIRMED',
        rma,
        extraData: { notes: notes || 'No power / video fault replicated' },
      });
    }

    res.json({
      success: true,
      message: `Initial inspection recorded. RMA status updated to ${newStatus}`,
      data: rma,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Engineer Assignment & Diagnosis
const assignEngineerAndDiagnosis = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      engineerId,
      engineerName,
      observedFault,
      rootCause,
      failureCode,
      failureDesc,
      repairCode,
      repairPossible,
      needSpare,
      physicalDamageFound,
      techNotes,
      performedBy,
    } = req.body;

    const rma = await RMA.findById(id);
    if (!rma) return res.status(404).json({ success: false, message: 'RMA not found' });

    const assignedName = (rma.assignedEngineer?.name || '').trim().toLowerCase();
    const callerName = (performedBy || req.user?.name || '').trim().toLowerCase();
    if (assignedName && callerName && assignedName !== callerName) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: RMA #${rma.rmaNo} is allocated to ${rma.assignedEngineer.name}. Only ${rma.assignedEngineer.name} can record diagnosis.`
      });
    }

    if (engineerName) {
      rma.assignedEngineer = {
        engineerId: engineerId || 'ENG01',
        name: engineerName,
        assignedAt: new Date(),
      };
    }

    rma.diagnosis = {
      observedFault,
      rootCause,
      failureCode,
      failureDesc,
      repairCode,
      repairPossible: repairPossible !== false,
      needSpare: Boolean(needSpare),
      physicalDamageFound: Boolean(physicalDamageFound),
      techNotes,
      diagnosedBy: performedBy || engineerName || 'Engineer',
      diagnosedAt: new Date(),
    };

    // Determine Warranty Decision:
    // Warranty = YES & Physical Damage = NO -> WARRANTY REPAIR (Free)
    // Warranty = NO or Physical Damage = YES -> CHARGEABLE
    if (rma.warrantyStatus === 'IN_WARRANTY' && !physicalDamageFound) {
      rma.repairType = 'WARRANTY_REPAIR';
      rma.chargeable = false;
    } else {
      rma.repairType = 'CHARGEABLE_REPAIR';
      rma.chargeable = true;
    }

    const fromStatus = rma.currentStatus;
    const newStatus = rma.chargeable ? 'WAITING_CUSTOMER_APPROVAL' : 'READY_FOR_REPAIR';
    rma.currentStatus = newStatus;
    await rma.save();

    await RMAHistory.create({
      rmaId: rma._id,
      rmaNo: rma.rmaNo,
      ticketNo: rma.ticketNo,
      action: 'DIAGNOSIS_RECORDED',
      fromStatus,
      toStatus: newStatus,
      userName: performedBy || 'Engineer',
      userRole: 'ENGINEER',
      notes: `Failure Code: ${failureCode || 'N/A'} - ${failureDesc || 'N/A'}. Decision: ${rma.repairType}. Status: ${newStatus}`,
    });

    await notifyServiceStatusChange({
      event: 'DIAGNOSIS_RECORDED',
      rma,
      extraData: {
        failureCode: failureCode || 'N/A',
        failureDesc: failureDesc || observedFault || 'N/A',
        suggestedRepair: rootCause || 'Standard component repair',
        techNotes: techNotes || 'N/A',
      },
    });

    try {
      await notifyServiceStageProgress({
        rma,
        stageKey: 'DIAGNOSIS_RECORDED',
        stageTitle: '🔍 Diagnosis Completed',
        stageDetails: `Failure: ${failureDesc || observedFault || failureCode || 'N/A'}. Decision: ${rma.repairType}. Status: ${newStatus}`,
        performedBy: performedBy || engineerName || 'Engineer',
      });
    } catch (notifErr) {
      console.warn('Diagnosis notification error:', notifErr.message);
    }

    res.json({
      success: true,
      message: `Diagnosis saved. RMA routed to ${newStatus}`,
      data: rma,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 6. Chargeable Estimate & Customer Approval
const updateEstimateAndApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { partsCost = 0, labourCost = 0, tax = 0, approvalStatus, approvalChannel, performedBy } = req.body;

    const rma = await RMA.findById(id);
    if (!rma) return res.status(404).json({ success: false, message: 'RMA not found' });

    const totalAmount = Number(partsCost) + Number(labourCost) + Number(tax);
    rma.estimate = {
      partsCost: Number(partsCost),
      labourCost: Number(labourCost),
      tax: Number(tax),
      totalAmount,
      status: approvalStatus || (totalAmount > 0 ? 'PENDING_APPROVAL' : 'NOT_REQUIRED'),
      approvedAmount: approvalStatus === 'APPROVED' ? totalAmount : 0,
      approvedAt: approvalStatus === 'APPROVED' ? new Date() : null,
      approvalChannel: approvalChannel || 'WHATSAPP',
    };

    let newStatus = rma.currentStatus;
    if (approvalStatus === 'APPROVED') {
      newStatus = 'READY_FOR_REPAIR';
    } else if (approvalStatus === 'REJECTED') {
      newStatus = 'CUSTOMER_REJECTED';
    }

    const fromStatus = rma.currentStatus;
    rma.currentStatus = newStatus;
    await rma.save();

    await RMAHistory.create({
      rmaId: rma._id,
      rmaNo: rma.rmaNo,
      ticketNo: rma.ticketNo,
      action: 'ESTIMATE_UPDATED',
      fromStatus,
      toStatus: newStatus,
      userName: performedBy || 'Store User',
      notes: `Estimate total ₹${totalAmount}. Customer status: ${approvalStatus || 'PENDING'}.`,
    });

    res.json({
      success: true,
      message: `Estimate and approval status recorded`,
      data: rma,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 7. Repair Lifecycle Management (Start / Pause / Complete)
const updateRepairAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes, actionsTaken, durationMinutes, performedBy } = req.body;

    const rma = await RMA.findById(id);
    if (!rma) return res.status(404).json({ success: false, message: 'RMA not found' });

    const assignedName = (rma.assignedEngineer?.name || '').trim().toLowerCase();
    const callerName = (performedBy || req.user?.name || '').trim().toLowerCase();
    if (assignedName && callerName && assignedName !== callerName) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: RMA #${rma.rmaNo} is allocated to ${rma.assignedEngineer.name}. Only ${rma.assignedEngineer.name} can perform repair actions on this unit.`
      });
    }

    const fromStatus = rma.currentStatus;
    let toStatus = fromStatus;

    if (action === 'START') {
      rma.repair.startedAt = new Date();
      toStatus = 'UNDER_REPAIR';
    } else if (action === 'PAUSE') {
      rma.repair.pausedAt = new Date();
      toStatus = 'WAITING_SPARE';
    } else if (action === 'RESUME') {
      rma.repair.resumedAt = new Date();
      if (rma.repair.pausedAt) {
        const pausedMins = Math.round((new Date(rma.repair.resumedAt) - new Date(rma.repair.pausedAt)) / (1000 * 60));
        rma.repair.pausedDurationMinutes = (rma.repair.pausedDurationMinutes || 0) + Math.max(0, pausedMins);
      }
      toStatus = 'UNDER_REPAIR';
    } else if (action === 'COMPLETE') {
      rma.repair.completedAt = new Date();
      rma.repair.actionsTaken = actionsTaken || 'Component repair / replacement';
      rma.repair.engineerNotes = notes || '';

      let rawDiff = Math.round((new Date(rma.repair.completedAt) - new Date(rma.repair.startedAt || rma.repair.completedAt)) / (1000 * 60));
      let netDiff = Math.max(1, rawDiff - (rma.repair.pausedDurationMinutes || 0));
      rma.repair.repairDurationMinutes = netDiff;
      toStatus = 'REPAIR_COMPLETED';
    }

    rma.currentStatus = toStatus;
    await rma.save();

    await RMAHistory.create({
      rmaId: rma._id,
      rmaNo: rma.rmaNo,
      ticketNo: rma.ticketNo,
      action: `REPAIR_${action}`,
      fromStatus,
      toStatus,
      userName: performedBy || 'Engineer',
      userRole: 'ENGINEER',
      notes: notes || `Repair action: ${action}`,
    });

    if (action === 'START' || action === 'RESUME') {
      await notifyServiceStatusChange({
        event: 'UNDER_REPAIR',
        rma,
      });
      try {
        const { logServiceActivity } = require('../routes/serviceActivityRoutes');
        await logServiceActivity({
          servicePersonName: performedBy || rma.assignedEngineer?.name || 'Service Person',
          storeLocation: rma.storeName || 'Service Center',
          actionType: 'REPAIR_STARTED',
          rmaNo: rma.rmaNo,
          ticketNo: rma.ticketNo,
          serialNumber: rma.serialNumber,
          modelNo: rma.modelNo,
          details: `Repair ${action.toLowerCase()}ed on ${rma.modelNo} (${rma.serialNumber})`,
        });
      } catch (e) { }

      try {
        await notifyServiceStageProgress({
          rma,
          stageKey: action === 'START' ? 'REPAIR_STARTED' : 'REPAIR_RESUMED',
          stageTitle: action === 'START' ? '🔧 Repair Started' : '▶️ Repair Resumed',
          stageDetails: `Repair ${action.toLowerCase()}ed by ${performedBy || rma.assignedEngineer?.name || 'Service Person'}. Status: Under Repair.`,
          performedBy: performedBy || rma.assignedEngineer?.name || 'Service Person',
        });
      } catch (notifErr) {
        console.warn('Repair action notification error:', notifErr.message);
      }
    } else if (action === 'PAUSE') {
      await notifyServiceStatusChange({
        event: 'WAITING_SPARE',
        rma,
      });
      try {
        const { logServiceActivity } = require('../routes/serviceActivityRoutes');
        await logServiceActivity({
          servicePersonName: performedBy || rma.assignedEngineer?.name || 'Service Person',
          storeLocation: rma.storeName || 'Service Center',
          actionType: 'SPARE_REQUESTED',
          rmaNo: rma.rmaNo,
          ticketNo: rma.ticketNo,
          serialNumber: rma.serialNumber,
          modelNo: rma.modelNo,
          details: `Repair paused - spare requested: ${notes || 'Waiting for spare part'}`,
        });
      } catch (e) { }

      try {
        await notifyServiceStageProgress({
          rma,
          stageKey: 'WAITING_SPARE',
          stageTitle: '⏸️ Repair Paused (Waiting Spare)',
          stageDetails: `Repair paused by ${performedBy || rma.assignedEngineer?.name || 'Service Person'}: ${notes || 'Waiting for spare part'}`,
          performedBy: performedBy || rma.assignedEngineer?.name || 'Service Person',
        });
      } catch (notifErr) {
        console.warn('Repair pause notification error:', notifErr.message);
      }
    } else if (action === 'COMPLETE') {
      await notifyServiceStatusChange({
        event: 'REPAIR_COMPLETED',
        rma,
      });

      const durationStr = rma.repair?.repairDurationMinutes
        ? `${Math.floor(rma.repair.repairDurationMinutes / 60)}h ${rma.repair.repairDurationMinutes % 60}m`
        : '1h 30m';

      try {
        const { logServiceActivity } = require('../routes/serviceActivityRoutes');
        await logServiceActivity({
          servicePersonName: performedBy || rma.assignedEngineer?.name || 'Service Person',
          storeLocation: rma.storeName || 'Service Center',
          actionType: 'REPAIR_STARTED',
          rmaNo: rma.rmaNo,
          ticketNo: rma.ticketNo,
          serialNumber: rma.serialNumber,
          modelNo: rma.modelNo,
          details: `Repair completed: ${actionsTaken || 'Component repaired'} (${durationStr})`,
          isCriticalAlert: true,
        });
      } catch (e) { }

      try {
        await notifyServiceStageProgress({
          rma,
          stageKey: 'REPAIR_COMPLETED',
          stageTitle: '✅ Repair Completed',
          stageDetails: `Repair completed: ${actionsTaken || 'Component repaired'} (${durationStr}) by ${performedBy || rma.assignedEngineer?.name || 'Service Person'}. Ready for QC testing.`,
          performedBy: performedBy || rma.assignedEngineer?.name || 'Service Person',
          extra: { duration: durationStr },
        });
      } catch (notifErr) {
        console.warn('Repair complete notification error:', notifErr.message);
      }
    }

    res.json({
      success: true,
      message: `Repair action ${action} processed successfully`,
      data: rma,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 8. Quality Control & Burn-In Tests
const recordQCResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { passed, tests, failureReason, notes, requireBurnIn, testedBy } = req.body;

    const rma = await RMA.findById(id);
    if (!rma) return res.status(404).json({ success: false, message: 'RMA not found' });

    const assignedName = (rma.assignedEngineer?.name || '').trim().toLowerCase();
    const callerName = (testedBy || req.user?.name || '').trim().toLowerCase();
    if (assignedName && callerName && assignedName !== callerName) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: RMA #${rma.rmaNo} is allocated to ${rma.assignedEngineer.name}. Only ${rma.assignedEngineer.name} can record QC results.`
      });
    }

    rma.qc = {
      testedBy: testedBy || 'QC Inspector',
      testedAt: new Date(),
      passed: Boolean(passed),
      tests: tests || {},
      failureReason: passed ? '' : failureReason || 'QC Failed',
      notes: notes || '',
    };

    const fromStatus = rma.currentStatus;
    let toStatus = 'READY_FOR_DISPATCH';

    const isReplacement = Boolean(rma.replacement?.isReplaced) || rma.resolutionType === 'REPLACEMENT';

    if (!passed) {
      toStatus = 'QC_FAILED';
      if (isReplacement && rma.replacement) {
        rma.replacement.qcResult = 'FAILED';
      }
    } else if (requireBurnIn) {
      toStatus = 'BURN_IN_TESTING';
      const finishExpected = new Date();
      finishExpected.setHours(finishExpected.getHours() + 24);
      rma.burnIn = {
        required: true,
        durationHours: 24,
        startedAt: new Date(),
        finishExpectedAt: finishExpected,
      };
      if (isReplacement && rma.replacement) {
        rma.replacement.qcResult = 'PASSED';
      }
    } else {
      if (isReplacement && rma.replacement) {
        rma.replacement.qcResult = 'PASSED';
        rma.replacement.status = 'QC_PASSED_READY_FOR_DISPATCH';
      }
    }

    rma.currentStatus = toStatus;
    await rma.save();

    await RMAHistory.create({
      rmaId: rma._id,
      rmaNo: rma.rmaNo,
      ticketNo: rma.ticketNo,
      action: isReplacement
        ? (passed ? 'REPLACEMENT_QC_PASSED' : 'REPLACEMENT_QC_FAILED')
        : (passed ? 'QC_PASSED' : 'QC_FAILED'),
      fromStatus,
      toStatus,
      userName: testedBy || 'QC Inspector',
      userRole: 'QC',
      notes: isReplacement
        ? (passed ? `Replacement unit (${rma.replacement?.replacementModel} S/N: ${rma.replacement?.replacementSerial}) QC passed. Ready for dispatch.` : `Replacement QC Failed: ${failureReason || 'Failed'}`)
        : (passed ? 'All QC parameters passed.' : `QC Failure: ${failureReason || 'Failed'}`),
    });

    if (toStatus === 'READY_FOR_DISPATCH') {
      await notifyServiceStatusChange({
        event: 'READY_FOR_DISPATCH',
        rma,
      });

      try {
        const { logServiceActivity } = require('../routes/serviceActivityRoutes');
        await logServiceActivity({
          servicePersonName: testedBy || 'QC Inspector',
          storeLocation: rma.storeName || 'Service Center',
          actionType: 'QC_PASSED',
          rmaNo: rma.rmaNo,
          ticketNo: rma.ticketNo,
          serialNumber: rma.serialNumber,
          modelNo: rma.modelNo,
          details: `QC Passed. Ready for dispatch.`,
        });
      } catch (e) { }
    } else if (toStatus === 'QC_FAILED') {
      await notifyServiceStatusChange({
        event: 'QC_FAILED',
        rma,
        extraData: { failureReason: failureReason || 'Failed initial QC parameter checks' },
      });

      // 🚨 Critical QC Failed Alert to Super Admin
      try {
        const { logServiceActivity } = require('../routes/serviceActivityRoutes');
        const Notification = require('../models/Notification');
        const { emitToSuperAdmin } = require('../socket');

        await logServiceActivity({
          servicePersonName: testedBy || 'QC Inspector',
          storeLocation: rma.storeName || 'Service Center',
          actionType: 'QC_FAILED',
          rmaNo: rma.rmaNo,
          ticketNo: rma.ticketNo,
          serialNumber: rma.serialNumber,
          modelNo: rma.modelNo,
          details: `QC Failed: ${failureReason || 'Defect detected'}`,
          isCriticalAlert: true,
        });

        const qcNotif = await Notification.create({
          category: 'SERVICE',
          type: 'QC_FAILED',
          senderName: testedBy || 'QC Inspector',
          senderRole: 'STORE',
          recipientName: 'Super Admin',
          recipientRole: 'SUPER_ADMIN',
          storeId: rma.storeName,
          userLocation: rma.storeName,
          modelNo: rma.modelNo,
          title: `🚨 QC FAILED: ${rma.rmaNo}`,
          actionText: 'QC Failed Alert:',
          targetText: `RMA: ${rma.rmaNo}\nProduct: ${rma.modelNo}\nSerial: ${rma.serialNumber}\nInspector: ${testedBy || 'QC Inspector'}\nDefect: ${failureReason || 'Failed parameter testing'}\nStore: ${rma.storeName}`,
          read: false,
          isRead: false,
          metadata: {
            rmaNo: rma.rmaNo,
            ticketNo: rma.ticketNo,
            modelNo: rma.modelNo,
            serialNumber: rma.serialNumber,
            hasAction: true,
            actionType: 'VIEW_SERVICE_REQUEST',
            actionLabel: 'View RMA Details',
          }
        });

        emitToSuperAdmin('qc_failed_alert', { notification: qcNotif, rmaNo: rma.rmaNo });
      } catch (qcErr) {
        console.warn('QC failed log error:', qcErr.message);
      }
    }

    try {
      await notifyServiceStageProgress({
        rma,
        stageKey: passed ? 'QC_PASSED' : 'QC_FAILED',
        stageTitle: passed ? '✅ QC Passed' : '🚨 QC Failed',
        stageDetails: passed ? (notes || 'Product passed all quality checks. Ready for dispatch.') : `QC Failed: ${failureReason || 'Defect detected'}`,
        performedBy: testedBy || 'QC Inspector',
        extra: { qcPassed: Boolean(passed), failureReason: failureReason || '' },
      });
    } catch (notifErr) {
      console.warn('QC notification error:', notifErr.message);
    }

    res.json({
      success: true,
      message: isReplacement
        ? `Replacement QC ${passed ? 'PASSED & Ready for Dispatch' : 'FAILED'}!`
        : `QC Result saved. RMA status: ${toStatus}`,
      data: rma,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 8.1 Request Dispatch Approval (Service Person -> Super Admin)
const requestDispatchApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { requestedBy, notes } = req.body;

    const rma = await RMA.findById(id);
    if (!rma) return res.status(404).json({ success: false, message: 'RMA not found' });

    const tech = requestedBy || req.user?.name || 'Service Person';

    rma.dispatchApproval = {
      isRequested: true,
      requestedBy: tech,
      requestedAt: new Date(),
      status: 'PENDING',
      notes: notes || `Service Person ${tech} requested dispatch approval after completing repair and QC testing.`,
    };

    await rma.save();

    await RMAHistory.create({
      rmaId: rma._id,
      rmaNo: rma.rmaNo,
      ticketNo: rma.ticketNo,
      action: 'DISPATCH_APPROVAL_REQUESTED',
      fromStatus: rma.currentStatus,
      toStatus: rma.currentStatus,
      userName: tech,
      userRole: 'SERVICE_PERSON',
      notes: `Dispatch permission requested by ${tech}. Awaiting Super Admin confirmation.`,
    });

    res.json({
      success: true,
      message: `Dispatch approval request sent to Super Admin for RMA #${rma.rmaNo}!`,
      data: rma,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 8.2 Approve / Reject Dispatch Permission (Super Admin -> Service Person)
const approveDispatchPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, approvedBy, rejectionReason, notes } = req.body;

    const rma = await RMA.findById(id);
    if (!rma) return res.status(404).json({ success: false, message: 'RMA not found' });

    const admin = approvedBy || req.user?.name || 'Super Admin';
    const status = approved ? 'APPROVED' : 'REJECTED';

    rma.dispatchApproval = rma.dispatchApproval || {};
    rma.dispatchApproval.status = status;
    rma.dispatchApproval.approvedBy = admin;
    rma.dispatchApproval.approvedAt = new Date();
    if (rejectionReason) rma.dispatchApproval.rejectionReason = rejectionReason;
    if (notes) rma.dispatchApproval.notes = notes;

    await rma.save();

    await RMAHistory.create({
      rmaId: rma._id,
      rmaNo: rma.rmaNo,
      ticketNo: rma.ticketNo,
      action: approved ? 'DISPATCH_PERMISSION_GRANTED' : 'DISPATCH_PERMISSION_REJECTED',
      fromStatus: rma.currentStatus,
      toStatus: rma.currentStatus,
      userName: admin,
      userRole: 'SUPER_ADMIN',
      notes: approved
        ? `Super Admin ${admin} granted dispatch permission to Service Person.`
        : `Super Admin ${admin} rejected dispatch request. Reason: ${rejectionReason || 'N/A'}`,
    });

    res.json({
      success: true,
      message: approved
        ? `Dispatch permission GRANTED for RMA #${rma.rmaNo}. Service Person can now dispatch!`
        : `Dispatch permission rejected for RMA #${rma.rmaNo}.`,
      data: rma,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 9. Dispatch RMA & Check-Out Stock Ledger (-1)
const dispatchRMA = async (req, res) => {
  try {
    const { id } = req.params;
    const { courierName, awbNumber, trackingUrl, recipientName, recipientPhone, performedBy, userRole } = req.body;

    const rma = await RMA.findById(id);
    if (!rma) return res.status(404).json({ success: false, message: 'RMA not found' });

    const role = (userRole || req.user?.role || '').toLowerCase().trim();
    const isSuperAdmin = ['admin', 'super admin', 'manager', 'headoffice'].includes(role) || role.includes('admin');
    const isServicePerson = !isSuperAdmin && (role.includes('service') || role.includes('engineer') || role.includes('technician') || role === 'staff');

    // If Service Person is dispatching, verify that Super Admin has granted approval
    if (isServicePerson) {
      if (rma.dispatchApproval?.status !== 'APPROVED') {
        return res.status(403).json({
          success: false,
          message: 'Dispatch Permission Required: Super Admin must grant dispatch approval before a Service Person can dispatch this product.',
        });
      }
    }

    // Validate payment if chargeable
    if (rma.chargeable && rma.estimate?.totalAmount > 0 && rma.payment?.status !== 'PAYMENT_RECEIVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot dispatch: Chargeable repair payment is still pending',
      });
    }

    const isReplacement = Boolean(rma.replacement?.isReplaced) || rma.resolutionType === 'REPLACEMENT';
    const dispatchModel = isReplacement ? (rma.replacement?.replacementModel || rma.modelNo) : rma.modelNo;
    const dispatchSerial = isReplacement ? (rma.replacement?.replacementSerial || rma.serialNumber) : rma.serialNumber;

    rma.dispatch = {
      courierName: courierName || 'Direct Handover',
      awbNumber: awbNumber || 'HANDOVER',
      trackingUrl: trackingUrl || '',
      dispatchedAt: new Date(),
      recipientName: recipientName || rma.customerSnapshot?.name,
      recipientPhone: recipientPhone || rma.customerSnapshot?.mobile,
    };

    if (isReplacement && rma.replacement) {
      rma.replacement.status = 'DISPATCHED';
      rma.replacement.dispatchedAt = new Date();
      rma.replacement.dispatchedBy = performedBy || 'Dispatch Officer';

      // Cross-link Warranty records for Replacement S/N and Original Defective S/N
      try {
        const repSN = String(rma.replacement.replacementSerial || '').trim();
        const origSN = String(rma.serialNumber || '').trim();

        const origWarranty = await Warranty.findOne({
          $or: [{ serialNumber: origSN }, { barcode: origSN }]
        });

        const inheritedCustomerStart = origWarranty?.customerWarranty?.startDate || origWarranty?.sale?.date || rma.createdAt || new Date();
        const inheritedCustomerEnd = origWarranty?.customerWarranty?.endDate || origWarranty?.warrantyEndDate || new Date(Date.now() + 730 * 86400000);

        if (repSN) {
          // Update Replacement Unit Serial in Warranty collection
          await Warranty.findOneAndUpdate(
            { $or: [{ serialNumber: repSN }, { barcode: repSN }] },
            {
              $set: {
                currentStatus: 'REPLACEMENT_DISPATCHED',
                stockStatus: 'ISSUED_FOR_REPLACEMENT',
                status: 'ACTIVE',
                modelNo: rma.replacement.replacementModel || rma.modelNo,
                'sale.sold': true,
                'sale.date': new Date(),
                'sale.customerName': rma.customerSnapshot?.name || 'Walk-in Customer',
                'sale.customerMobile': rma.customerSnapshot?.mobile || '',
                'sale.customerAddress': rma.customerSnapshot?.address || '',
                'sale.storeName': rma.storeName || 'Service Center',
                'customerWarranty.startDate': inheritedCustomerStart,
                'customerWarranty.endDate': inheritedCustomerEnd,
                replacement: {
                  isReplacement: true,
                  rmaId: rma._id,
                  rmaNumber: rma.rmaNo,
                  replacesSerialNumber: origSN,
                  defectiveModel: rma.modelNo,
                  replacementModel: rma.replacement.replacementModel || rma.modelNo,
                  replacementSerial: repSN,
                  customerName: rma.customerSnapshot?.name || 'Customer',
                  customerMobile: rma.customerSnapshot?.mobile || '',
                  storeName: rma.storeName || 'Service Center',
                  replacementDate: rma.replacement.replacedAt || new Date(),
                  replacementSource: '2% Warranty Spares Inventory',
                  qcStatus: 'PASSED',
                  dispatchStatus: 'DISPATCHED',
                  dispatchedAt: new Date(),
                  inheritedWarrantyStartDate: inheritedCustomerStart,
                  inheritedWarrantyEndDate: inheritedCustomerEnd
                }
              }
            },
            { upsert: true, new: true }
          );
        }

        if (origSN) {
          // Update Original Defective Serial in Warranty collection
          await Warranty.findOneAndUpdate(
            { $or: [{ serialNumber: origSN }, { barcode: origSN }] },
            {
              $set: {
                currentStatus: 'REPLACED',
                stockStatus: 'REPLACED',
                status: 'VOID',
                'replacement.isOriginalReplaced': true,
                'replacement.rmaId': rma._id,
                'replacement.rmaNumber': rma.rmaNo,
                'replacement.replacedBySerialNumber': repSN,
                'replacement.replacementModel': rma.replacement.replacementModel || rma.modelNo,
                'replacement.replacementDate': rma.replacement.replacedAt || new Date()
              }
            }
          );
        }
      } catch (wErr) {
        console.warn('Warranty cross-link on dispatch warning:', wErr.message);
      }
    }

    const fromStatus = rma.currentStatus;
    rma.currentStatus = 'DISPATCHED';
    await rma.save();

    // Log Inventory Transaction Ledger (-1 OUT)
    await ServiceInventoryTransaction.create({
      transactionType: isReplacement ? 'REPLACEMENT_DISPATCH' : 'SERVICE_CHECK_OUT',
      rmaId: rma._id,
      rmaNo: rma.rmaNo,
      serviceRequestId: rma.serviceRequestId,
      ticketNo: rma.ticketNo,
      modelNo: dispatchModel,
      serialNumber: dispatchSerial,
      quantity: 1,
      direction: 'OUT',
      storeName: rma.storeName,
      performedBy: performedBy || 'Dispatch Officer',
      notes: isReplacement
        ? `Replacement Unit (${dispatchModel} S/N: ${dispatchSerial}) dispatched via ${courierName || 'Handover'} (AWB: ${awbNumber || 'N/A'}) against RMA #${rma.rmaNo}`
        : `Product dispatched via ${courierName || 'Handover'} (AWB: ${awbNumber || 'N/A'})`,
    });

    // Update ServiceRequest status
    await ServiceRequest.findByIdAndUpdate(rma.serviceRequestId, { currentStatus: 'DISPATCHED' });

    await RMAHistory.create({
      rmaId: rma._id,
      rmaNo: rma.rmaNo,
      ticketNo: rma.ticketNo,
      action: isReplacement ? 'REPLACEMENT_DISPATCHED' : 'PRODUCT_DISPATCHED',
      fromStatus,
      toStatus: 'DISPATCHED',
      userName: performedBy || 'Dispatch Officer',
      userRole: isServicePerson ? 'SERVICE_PERSON' : 'DISPATCH',
      notes: isReplacement
        ? `Replacement Product Dispatched: ${dispatchModel} / ${dispatchSerial} dispatched against RMA #${rma.rmaNo} via ${courierName}. AWB: ${awbNumber}`
        : `Dispatched via ${courierName}. AWB: ${awbNumber}`,
    });

    await notifyServiceStatusChange({
      event: 'DISPATCHED',
      rma,
      extraData: { courierName, awbNumber },
    });

    try {
      await notifyServiceStageProgress({
        rma,
        stageKey: isReplacement ? 'REPLACEMENT_DISPATCHED' : 'PRODUCT_DISPATCHED',
        stageTitle: isReplacement ? '🚚 Replacement Unit Dispatched' : '🚚 Service Product Dispatched',
        stageDetails: `Dispatched via ${courierName || 'Direct Handover'}. AWB: ${awbNumber || 'N/A'}`,
        performedBy: performedBy || 'Dispatch Officer',
        extra: { courierName, awbNumber, isReplacement },
      });
    } catch (notifErr) {
      console.warn('Dispatch stage notification error:', notifErr.message);
    }

    res.json({
      success: true,
      message: `RMA #${rma.rmaNo} successfully dispatched! Service inventory ledger decremented (-1).`,
      data: rma,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 10. Failure Codes Master
const getFailureCodes = async (req, res) => {
  try {
    let codes = await FailureCodeMaster.find({ isActive: true });
    if (codes.length === 0) {
      // Seed default failure codes if empty
      const defaultCodes = [
        { code: 'FA01', title: 'No Power', category: 'POWER', suggestedRepair: 'Check SMPS / Adapter / Power Board' },
        { code: 'FA02', title: 'No Video', category: 'VIDEO', suggestedRepair: 'Replace Main PCB / Sensor' },
        { code: 'FA03', title: 'IR Night Vision Failure', category: 'OPTICS', suggestedRepair: 'Replace IR LED Board' },
        { code: 'FA04', title: 'LAN Network Failure', category: 'NETWORK', suggestedRepair: 'Replace RJ45 / Transformer' },
        { code: 'FA05', title: 'Water Damage', category: 'EXTERNAL', suggestedRepair: 'Clean PCB / Ultrasonic cleaning / Replace burnt parts' },
        { code: 'FA06', title: 'Firmware Corruption', category: 'SOFTWARE', suggestedRepair: 'Reflash SPI Flash ROM' },
        { code: 'FA07', title: 'PCB Burn / Overvoltage', category: 'HARDWARE', suggestedRepair: 'Mainboard replacement' },
        { code: 'FA08', title: 'Sensor / Lens Blur', category: 'OPTICS', suggestedRepair: 'Sensor realignment / replacement' },
        { code: 'FA09', title: 'SD Card Detection Failure', category: 'STORAGE', suggestedRepair: 'Replace MicroSD Slot' },
        { code: 'FA10', title: 'PoE Power Failure', category: 'POWER', suggestedRepair: 'Replace PoE Module IC' },
      ];
      codes = await FailureCodeMaster.insertMany(defaultCodes);
    }
    res.json({ success: true, data: codes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 11. Assign Service to Engineer / Service Person (Super Admin allocation)
const assignServiceToEngineer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      engineerId,
      engineerName,
      engineerEmail,
      priority = 'NORMAL',
      dueDate,
      assignmentNotes,
      assignedBy,
    } = req.body;

    let rma;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      rma = await RMA.findById(id);
    } else {
      rma = await RMA.findOne({ rmaNo: id });
    }
    if (!rma) {
      return res.status(404).json({ success: false, message: 'RMA not found' });
    }

    // Prevent re-assigning completed / dispatched / closed service products
    const completedStatuses = ['REPAIR_COMPLETED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CLOSED', 'REPLACED', 'CANCELLED'];
    if (completedStatuses.includes(rma.currentStatus) || rma.repair?.completedAt) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign or reallocate: RMA #${rma.rmaNo} service is already completed (${rma.currentStatus.replace(/_/g, ' ')}). Completed service products cannot be reassigned.`
      });
    }

    // Prevent re-allocating if already assigned to a technician
    if (rma.assignedEngineer?.name) {
      return res.status(400).json({
        success: false,
        message: `Cannot reallocate: RMA #${rma.rmaNo} has already been allocated to ${rma.assignedEngineer.name}. Reassignment is disabled.`
      });
    }

    const fromStatus = rma.currentStatus;
    const newStatus = 'ENGINEER_ASSIGNED';

    rma.priority = (priority || 'NORMAL').toUpperCase();
    if (dueDate) rma.dueDate = new Date(dueDate);

    rma.assignedEngineer = {
      engineerId: engineerId || '',
      name: engineerName || '',
      email: engineerEmail || '',
      assignedAt: new Date(),
      assignedBy: assignedBy || req.user?.name || 'Super Admin',
      priority: (priority || 'NORMAL').toUpperCase(),
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: assignmentNotes || '',
      acceptedAt: null, // Reset accepted state so Service Person sees it as NEW
    };

    rma.currentStatus = newStatus;
    await rma.save();

    // Audit History
    await RMAHistory.create({
      rmaId: rma._id,
      rmaNo: rma.rmaNo,
      serviceRequestId: rma.serviceRequestId,
      ticketNo: rma.ticketNo,
      action: 'SERVICE_ALLOCATED',
      fromStatus,
      toStatus: newStatus,
      userName: assignedBy || req.user?.name || 'Super Admin',
      userRole: req.user?.role || 'Super Admin',
      notes: `Service allocated to ${engineerName || 'Technician'} with ${(priority || 'NORMAL').toUpperCase()} priority.${assignmentNotes ? ` Notes: ${assignmentNotes}` : ''}`,
      metadata: { priority, dueDate, engineerId, engineerName },
    });

    try {
      await notifyServiceAssigned(
        rma,
        { name: engineerName, id: engineerId },
        priority,
        dueDate,
        assignedBy || req.user?.name || 'Super Admin'
      );
    } catch (notifErr) {
      console.warn('Failed to send service assigned notification:', notifErr.message);
    }

    res.json({
      success: true,
      message: `RMA #${rma.rmaNo} allocated to ${engineerName} with ${(priority || 'NORMAL').toUpperCase()} priority!`,
      data: rma,
    });
  } catch (err) {
    console.error('Assign Service Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 12. Start Service (Service Person accepts / starts repair)
const startService = async (req, res) => {
  try {
    const { id } = req.params;
    const { performedBy, userRole, notes } = req.body;

    let rma;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      rma = await RMA.findById(id);
    } else {
      rma = await RMA.findOne({ rmaNo: id });
    }
    if (!rma) {
      return res.status(404).json({ success: false, message: 'RMA not found' });
    }

    const role = (userRole || req.user?.role || '').toLowerCase().trim();
    const isSuperAdmin = ['admin', 'super admin', 'manager', 'headoffice'].includes(role) || role.includes('admin');
    const isServicePerson = role.includes('service') || role.includes('engineer') || role.includes('technician') || role === 'staff';

    if (role && !isSuperAdmin && !isServicePerson) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only Super Admin and assigned Service Persons can start repair.'
      });
    }

    // If unallocated or allocated to another technician, Service Person cannot start
    const assignedName = (rma.assignedEngineer?.name || '').trim().toLowerCase();
    const callerName = (performedBy || req.user?.name || '').trim().toLowerCase();
    if (!assignedName) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: RMA #${rma.rmaNo} is unallocated. Super Admin must allocate this service product to you before service can be started.`
      });
    }
    if (assignedName && callerName && assignedName !== callerName) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: RMA #${rma.rmaNo} is allocated to ${rma.assignedEngineer.name}. Only ${rma.assignedEngineer.name} can start this service.`
      });
    }

    const completedStatuses = ['REPAIR_COMPLETED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CLOSED', 'REPLACED', 'CANCELLED'];
    if (completedStatuses.includes(rma.currentStatus) || rma.repair?.completedAt) {
      return res.status(400).json({
        success: false,
        message: `Cannot start service: RMA #${rma.rmaNo} is already completed (${rma.currentStatus.replace(/_/g, ' ')}).`
      });
    }

    const fromStatus = rma.currentStatus;
    const toStatus = 'UNDER_REPAIR';

    if (!rma.assignedEngineer) {
      rma.assignedEngineer = {};
    }
    rma.assignedEngineer.acceptedAt = new Date();

    if (!rma.repair) {
      rma.repair = {};
    }
    rma.repair.startedAt = new Date();
    rma.currentStatus = toStatus;
    await rma.save();

    await RMAHistory.create({
      rmaId: rma._id,
      rmaNo: rma.rmaNo,
      ticketNo: rma.ticketNo,
      serviceRequestId: rma.serviceRequestId,
      action: 'SERVICE_STARTED',
      fromStatus,
      toStatus,
      userName: performedBy || req.user?.name || 'Service Person',
      userRole: userRole || 'Service Person',
      notes: notes || `Service started by ${performedBy || 'Service Person'}. Status moved to In Progress / Under Repair.`,
    });

    try {
      await notifyServiceStageProgress({
        rma,
        stageKey: 'SERVICE_STARTED',
        stageTitle: '⚡ Service Started',
        stageDetails: `Service started by ${performedBy || req.user?.name || 'Service Person'} (${rma.modelNo})`,
        performedBy: performedBy || req.user?.name || 'Service Person',
        userRole: userRole || 'Service Person',
      });
    } catch (notifErr) {
      console.warn('Failed to send start service notification:', notifErr.message);
    }

    res.json({
      success: true,
      message: `Service started on RMA #${rma.rmaNo}! Status is now Under Repair.`,
      data: rma,
    });
  } catch (err) {
    console.error('Start Service Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 13. Live Service & RMA Dashboard Metrics (Role Scoped & Real DB Data)
const getServiceDashboardStats = async (req, res) => {
  try {
    const { storeName, userRole, userName, userId, viewScope } = req.query;
    const query = {};

    const roleLower = (userRole || req.user?.role || '').toLowerCase().trim();
    const isSuperAdmin = ['admin', 'super admin', 'manager', 'headoffice'].includes(roleLower);
    const isServicePerson = roleLower.includes('service') || roleLower === 'engineer' || roleLower === 'technician';
    const currentUserName = (userName || req.user?.name || '').trim();

    if (!isSuperAdmin && storeName && !isServicePerson) {
      query.storeName = { $regex: new RegExp(`^${storeName}$`, 'i') };
    }

    let rmaQuery = { ...query };
    if (isServicePerson && !isSuperAdmin && currentUserName && viewScope !== 'ALL') {
      const userRegex = new RegExp(`^${currentUserName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      rmaQuery.$or = [
        { 'assignedEngineer.name': { $regex: userRegex } },
        ...(userId ? [{ 'assignedEngineer.engineerId': userId }] : []),
      ];
    }

    const [
      totalRequests,
      totalRMAs,
      waitingProduct,
      allRecentRMAs,
      recentHistory,
    ] = await Promise.all([
      ServiceRequest.countDocuments(query),
      RMA.countDocuments(rmaQuery),
      ServiceRequest.countDocuments({ ...query, rmaId: null }),
      RMA.find(rmaQuery).sort({ updatedAt: -1 }).limit(150),
      RMAHistory.find().sort({ createdAt: -1 }).limit(100),
    ]);

    // Service Person Metric Counters:
    // 1. New Unacknowledged Assignments (Assigned, awaiting start)
    const newAssignmentsList = allRecentRMAs.filter(
      (r) =>
        ['ENGINEER_ASSIGNED', 'ALLOCATED'].includes(r.currentStatus) &&
        !r.repair?.startedAt &&
        !['UNDER_REPAIR', 'QC_TESTING', 'REPAIR_COMPLETED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CLOSED', 'CANCELLED'].includes(r.currentStatus)
    );
    const newAssignments = newAssignmentsList.length;

    // 2. Pending RMAs (Waiting diagnosis / approval / spare parts)
    const pendingRMAs = allRecentRMAs.filter((r) =>
      ['PRODUCT_RECEIVED', 'UNDER_INITIAL_INSPECTION', 'FAULT_CONFIRMED', 'ENGINEER_ASSIGNED', 'UNDER_DIAGNOSIS', 'WAITING_CUSTOMER_APPROVAL', 'WAITING_SPARE', 'READY_FOR_REPAIR'].includes(r.currentStatus)
    ).length;

    // 3. Active Services (Currently being repaired or QC tested)
    const activeServices = allRecentRMAs.filter((r) =>
      ['UNDER_REPAIR', 'QC_TESTING', 'BURN_IN_TESTING'].includes(r.currentStatus)
    ).length;

    // 4. Completed / Ready
    const completedRMAs = allRecentRMAs.filter((r) =>
      ['REPAIR_COMPLETED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CLOSED'].includes(r.currentStatus)
    ).length;

    // Global pipeline metrics
    const underRepair = allRecentRMAs.filter((r) =>
      ['FAULT_CONFIRMED', 'UNDER_DIAGNOSIS', 'READY_FOR_REPAIR', 'UNDER_REPAIR', 'WAITING_SPARE'].includes(r.currentStatus)
    ).length;
    const inQC = allRecentRMAs.filter((r) =>
      ['REPAIR_COMPLETED', 'QC_TESTING', 'BURN_IN_TESTING'].includes(r.currentStatus)
    ).length;
    const readyDispatch = allRecentRMAs.filter((r) => r.currentStatus === 'READY_FOR_DISPATCH').length;
    const dispatchedClosed = allRecentRMAs.filter((r) =>
      ['DISPATCHED', 'DELIVERED', 'CLOSED'].includes(r.currentStatus)
    ).length;
    const unassignedCount = allRecentRMAs.filter(
      (r) => !r.assignedEngineer?.name && !['DISPATCHED', 'CLOSED', 'CANCELLED'].includes(r.currentStatus)
    ).length;
    const urgentCount = allRecentRMAs.filter(
      (r) => ['URGENT', 'HIGH'].includes((r.priority || '').toUpperCase()) && !['DISPATCHED', 'CLOSED', 'CANCELLED'].includes(r.currentStatus)
    ).length;

    // Filter urgent / new assignments specifically for the Service Person banner (Awaiting start)
    const urgentAssignments = allRecentRMAs.filter((r) => {
      const engName = (r.assignedEngineer?.name || '').trim().toLowerCase();
      const isMine = (currentUserName && engName === currentUserName.toLowerCase()) || (userId && r.assignedEngineer?.engineerId === userId);
      if (!isMine) return false;

      const isNotDone = !['REPAIR_COMPLETED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CLOSED', 'CANCELLED'].includes(r.currentStatus);
      const isUnstarted = !r.repair?.startedAt && !['UNDER_REPAIR', 'QC_TESTING'].includes(r.currentStatus);
      const isNewOrUrgent =
        r.currentStatus === 'ENGINEER_ASSIGNED' ||
        r.currentStatus === 'ALLOCATED' ||
        !r.assignedEngineer?.acceptedAt ||
        (['URGENT', 'HIGH'].includes((r.priority || '').toUpperCase()) && isUnstarted);
      return isNotDone && isUnstarted && isNewOrUrgent;
    });

    res.json({
      success: true,
      data: {
        totalRequests,
        totalRMAs,
        newAssignments,
        pendingRMAs,
        activeServices,
        completedRMAs,
        waitingProduct,
        underRepair,
        inQC,
        readyDispatch,
        dispatchedClosed,
        unassignedCount,
        urgentCount,
        urgentAssignments,
        recentRMAs: allRecentRMAs,
        recentHistory,
      },
    });
  } catch (err) {
    console.error('Service Dashboard Stats Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 14. Super Admin Service Person Workload & Performance Analytics Hub
const getServicePersonPerformance = async (req, res) => {
  try {
    const { timeRange = 'THIS_MONTH', startDate, endDate, storeName } = req.query;

    const now = new Date();
    let dateFilter = {};

    if (timeRange === 'TODAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: start, $lte: end } };
    } else if (timeRange === 'THIS_WEEK') {
      const current = new Date();
      const first = current.getDate() - current.getDay() + (current.getDay() === 0 ? -6 : 1);
      const start = new Date(current.setDate(first));
      start.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: start } };
    } else if (timeRange === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: start } };
    } else if (timeRange === 'LAST_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: start, $lte: end } };
    } else if (timeRange === 'CUSTOM' && startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: start, $lte: end } };
    }

    const query = { ...dateFilter };
    if (storeName && storeName !== 'ALL') {
      query.storeName = { $regex: new RegExp(`^${storeName}$`, 'i') };
    }

    const allRMAs = await RMA.find(query).sort({ updatedAt: -1 }).lean();

    const users = await User.find({
      role: { $regex: /service|engineer|technician/i }
    }).lean();

    const totalRma = allRMAs.length;
    const allocated = allRMAs.filter(r => Boolean(r.assignedEngineer?.name)).length;
    const accepted = allRMAs.filter(r => Boolean(r.assignedEngineer?.acceptedAt) || r.currentStatus === 'ACCEPTED').length;
    const inProcess = allRMAs.filter(r => ['UNDER_DIAGNOSIS', 'UNDER_REPAIR', 'READY_FOR_REPAIR'].includes(r.currentStatus)).length;
    const waitingForSpare = allRMAs.filter(r => r.currentStatus === 'WAITING_SPARE').length;
    const qcTesting = allRMAs.filter(r => ['QC_TESTING', 'BURN_IN_TESTING'].includes(r.currentStatus)).length;
    const completed = allRMAs.filter(r => ['REPAIR_COMPLETED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CLOSED'].includes(r.currentStatus)).length;
    const overdue = allRMAs.filter(r => {
      const isNotDone = !['REPAIR_COMPLETED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CLOSED', 'CANCELLED'].includes(r.currentStatus);
      const isPastDue = r.dueDate && new Date(r.dueDate) < new Date();
      return isNotDone && isPastDue;
    }).length;

    const engineerMap = new Map();

    users.forEach(u => {
      engineerMap.set(u.name.trim().toLowerCase(), {
        id: u._id.toString(),
        name: u.name.trim(),
        email: u.email || '',
        serviceCenter: u.serviceCenter || u.assignedLocation || '',
        assigned: 0,
        accepted: 0,
        started: 0,
        inProcess: 0,
        waitingSpare: 0,
        qcTesting: 0,
        completed: 0,
        overdue: 0,
        totalCompletedDurationMinutes: 0,
        completedCountWithDuration: 0,
        recentRMAs: []
      });
    });

    allRMAs.forEach(rma => {
      const engName = (rma.assignedEngineer?.name || '').trim();
      if (!engName) return;

      const key = engName.toLowerCase();
      if (!engineerMap.has(key)) {
        engineerMap.set(key, {
          id: rma.assignedEngineer?.engineerId || key,
          name: engName,
          email: rma.assignedEngineer?.email || '',
          serviceCenter: rma.storeName || '',
          assigned: 0,
          accepted: 0,
          started: 0,
          inProcess: 0,
          waitingSpare: 0,
          qcTesting: 0,
          completed: 0,
          overdue: 0,
          totalCompletedDurationMinutes: 0,
          completedCountWithDuration: 0,
          recentRMAs: []
        });
      }

      const eng = engineerMap.get(key);
      eng.assigned += 1;

      const isAccepted = Boolean(rma.assignedEngineer?.acceptedAt) || rma.currentStatus === 'ACCEPTED' || Boolean(rma.repair?.startedAt);
      if (isAccepted) eng.accepted += 1;

      const isStarted = Boolean(rma.repair?.startedAt) || ['UNDER_DIAGNOSIS', 'UNDER_REPAIR', 'WAITING_SPARE', 'QC_TESTING', 'REPAIR_COMPLETED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CLOSED'].includes(rma.currentStatus);
      if (isStarted) eng.started += 1;

      if (['UNDER_DIAGNOSIS', 'UNDER_REPAIR', 'READY_FOR_REPAIR'].includes(rma.currentStatus)) {
        eng.inProcess += 1;
      }
      if (rma.currentStatus === 'WAITING_SPARE') {
        eng.waitingSpare += 1;
      }
      if (['QC_TESTING', 'BURN_IN_TESTING'].includes(rma.currentStatus)) {
        eng.qcTesting += 1;
      }
      if (['REPAIR_COMPLETED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CLOSED'].includes(rma.currentStatus)) {
        eng.completed += 1;
        if (rma.repair?.startedAt && rma.repair?.completedAt) {
          const diffMins = Math.round((new Date(rma.repair.completedAt) - new Date(rma.repair.startedAt)) / (1000 * 60));
          if (diffMins > 0) {
            eng.totalCompletedDurationMinutes += diffMins;
            eng.completedCountWithDuration += 1;
          }
        }
      }

      const isOverdue = rma.dueDate && new Date(rma.dueDate) < new Date() && !['REPAIR_COMPLETED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CLOSED', 'CANCELLED'].includes(rma.currentStatus);
      if (isOverdue) eng.overdue += 1;

      if (eng.recentRMAs.length < 25) {
        eng.recentRMAs.push({
          _id: rma._id,
          rmaNo: rma.rmaNo,
          ticketNo: rma.ticketNo,
          customerName: rma.customerSnapshot?.name,
          customerMobile: rma.customerSnapshot?.mobile,
          modelNo: rma.modelNo,
          serialNumber: rma.serialNumber,
          currentStatus: rma.currentStatus,
          priority: rma.priority || 'NORMAL',
          dueDate: rma.dueDate,
          assignedAt: rma.assignedEngineer?.assignedAt,
          acceptedAt: rma.assignedEngineer?.acceptedAt,
          startedAt: rma.repair?.startedAt,
          completedAt: rma.repair?.completedAt,
          isOverdue
        });
      }
    });

    const servicePersons = Array.from(engineerMap.values()).map(sp => {
      const avgHours = sp.completedCountWithDuration > 0
        ? (sp.totalCompletedDurationMinutes / sp.completedCountWithDuration / 60).toFixed(1)
        : null;
      return {
        ...sp,
        avgCompletionHours: avgHours ? Number(avgHours) : null,
      };
    });

    res.json({
      success: true,
      timeRange,
      totalRma,
      allocated,
      accepted,
      inProcess,
      waitingForSpare,
      qcTesting,
      completed,
      overdue,
      servicePersons,
    });
  } catch (err) {
    console.error('Service Person Performance Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 15. Service Person Acceptance Action
const acceptServiceAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { technicianName, technicianId, notes } = req.body;

    let rma;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      rma = await RMA.findById(id);
    } else {
      rma = await RMA.findOne({ rmaNo: id });
    }
    if (!rma) {
      return res.status(404).json({ success: false, message: 'RMA record not found' });
    }

    const tech = technicianName || req.user?.name || 'Service Person';
    const assignedName = (rma.assignedEngineer?.name || '').trim().toLowerCase();
    const callerName = tech.trim().toLowerCase();
    if (!assignedName) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: RMA #${rma.rmaNo} has not been allocated yet. Super Admin must allocate this service unit before it can be accepted.`
      });
    }
    if (assignedName && callerName && assignedName !== callerName) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: RMA #${rma.rmaNo} is allocated to ${rma.assignedEngineer.name}.`
      });
    }

    const fromStatus = rma.currentStatus;
    const toStatus = 'ACCEPTED';

    rma.assignedEngineer = rma.assignedEngineer || {};
    rma.assignedEngineer.acceptedAt = new Date();
    rma.currentStatus = toStatus;
    await rma.save();

    await RMAHistory.create({
      rmaId: rma._id,
      rmaNo: rma.rmaNo,
      serviceRequestId: rma.serviceRequestId,
      ticketNo: rma.ticketNo,
      action: 'ACCEPTED',
      fromStatus,
      toStatus,
      userName: tech,
      userRole: 'SERVICE_PERSON',
      notes: notes || `Service assignment accepted by ${tech}. Ready for diagnosis and repair.`,
    });

    try {
      await notifyServiceStageProgress({
        rma,
        stageKey: 'SERVICE_ACCEPTED',
        stageTitle: '👍 Service Assignment Accepted',
        stageDetails: `Service assignment accepted by ${tech}. Ready for diagnosis and repair.`,
        performedBy: tech,
        userRole: 'SERVICE_PERSON',
      });
    } catch (notifErr) {
      console.warn('Failed to send accepted notification:', notifErr.message);
    }

    res.json({
      success: true,
      message: `Assignment accepted for RMA #${rma.rmaNo}!`,
      data: rma,
    });
  } catch (err) {
    console.error('Accept Assignment Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 16. Exact RMA Service Work Details & Audit Timeline
const getRMAServiceDetails = async (req, res) => {
  try {
    const { id } = req.params;
    let rma;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      rma = await RMA.findById(id).lean();
    } else {
      rma = await RMA.findOne({ rmaNo: id }).lean();
    }

    if (!rma) {
      return res.status(404).json({ success: false, message: 'RMA not found' });
    }

    const serviceRequest = await ServiceRequest.findById(rma.serviceRequestId).lean();
    const auditTimeline = await RMAHistory.find({ rmaId: rma._id }).sort({ createdAt: 1 }).lean();

    // Enrich spares with serialNumber from SparePartInventory or SparePartTransaction if not directly in spare subdoc
    const SparePartInventoryModel = require('../models/SparePartInventory');
    const SparePartTransactionModel = require('../models/SparePartTransaction');

    const [installedInventory, installedTransactions] = await Promise.all([
      SparePartInventoryModel.find({
        $or: [{ installedInRmaId: rma._id }, { installedInRmaNo: rma.rmaNo }]
      }).lean(),
      SparePartTransactionModel.find({
        $or: [{ rmaId: rma._id }, { rmaNo: rma.rmaNo }],
        actionType: 'INSTALLED'
      }).lean()
    ]);

    const enrichedSpares = (rma.spares || []).map((sp) => {
      let resolvedSerial = sp.serialNumber || (Array.isArray(sp.serialNumbers) ? sp.serialNumbers[0] : '') || '';

      if (!resolvedSerial && installedInventory.length > 0) {
        const match = installedInventory.find((inv) =>
          (inv.sparePartCode && sp.partCode && inv.sparePartCode.toUpperCase() === sp.partCode.toUpperCase()) ||
          (inv.sparePartName && (sp.partName || sp.name) && inv.sparePartName.toLowerCase() === (sp.partName || sp.name).toLowerCase())
        );
        if (match) {
          resolvedSerial = match.serialNumber;
        }
      }

      if (!resolvedSerial && installedTransactions.length > 0) {
        const txMatch = installedTransactions.find((tx) =>
          (tx.sparePartCode && sp.partCode && tx.sparePartCode.toUpperCase() === sp.partCode.toUpperCase()) ||
          (tx.sparePartName && (sp.partName || sp.name) && tx.sparePartName.toLowerCase() === (sp.partName || sp.name).toLowerCase())
        );
        if (txMatch) {
          resolvedSerial = txMatch.serialNumber;
        }
      }

      return {
        ...sp,
        serialNumber: resolvedSerial
      };
    });

    let durationFormatted = 'N/A';
    if (rma.repair?.startedAt && rma.repair?.completedAt) {
      let rawDiff = Math.round((new Date(rma.repair.completedAt) - new Date(rma.repair.startedAt)) / (1000 * 60));
      let netDiff = Math.max(1, rawDiff - (rma.repair.pausedDurationMinutes || 0));
      const hours = Math.floor(netDiff / 60);
      const mins = netDiff % 60;
      durationFormatted = `${hours}h ${mins}m`;
    } else if (rma.repair?.startedAt) {
      let rawDiff = Math.round((new Date() - new Date(rma.repair.startedAt)) / (1000 * 60));
      let currentPaused = 0;
      if (rma.currentStatus === 'WAITING_SPARE' && rma.repair.pausedAt) {
        currentPaused = Math.round((new Date() - new Date(rma.repair.pausedAt)) / (1000 * 60));
      }
      let netDiff = Math.max(0, rawDiff - (rma.repair.pausedDurationMinutes || 0) - currentPaused);
      const hours = Math.floor(netDiff / 60);
      const mins = netDiff % 60;
      durationFormatted = rma.currentStatus === 'WAITING_SPARE'
        ? `${hours}h ${mins}m (Paused: Waiting for Spare)`
        : `${hours}h ${mins}m (In Progress)`;
    }

    res.json({
      success: true,
      data: {
        ...rma,
        spares: enrichedSpares,
        customerComplaint: serviceRequest?.complaint || { category: 'Hardware Failure', description: 'Product not functioning' },
        serviceDurationFormatted: durationFormatted,
        auditTimeline,
      },
    });
  } catch (err) {
    console.error('Get RMA Service Details Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 17. Record Service Work Details, Spares & QC by Service Person
const recordServiceWorkDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      workPerformed,
      sparesUsed,
      serviceRemarks,
      qcResult,
      qcTests,
      qcNotes,
      attachments,
      diagnosisUpdate,
      markCompleted,
      performedBy,
      userRole,
      needSparePart,
      needProductReplacement,
      replacementProduct,
    } = req.body;

    let rma;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      rma = await RMA.findById(id);
    } else {
      rma = await RMA.findOne({ rmaNo: id });
    }
    if (!rma) {
      return res.status(404).json({ success: false, message: 'RMA record not found' });
    }

    const role = (userRole || req.user?.role || '').toLowerCase().trim();
    const isSuperAdmin = ['admin', 'super admin', 'manager', 'headoffice'].includes(role) || role.includes('admin');
    const isServicePerson = role.includes('service') || role.includes('engineer') || role.includes('technician') || role === 'staff';

    if (role && !isSuperAdmin && !isServicePerson) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only Super Admin and assigned Service Persons can record work details.'
      });
    }

    // If allocated to a technician, only THAT technician can record or complete the work
    const assignedName = (rma.assignedEngineer?.name || '').trim().toLowerCase();
    const callerName = (performedBy || req.user?.name || '').trim().toLowerCase();
    if (assignedName && callerName && assignedName !== callerName) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: RMA #${rma.rmaNo} is allocated to ${rma.assignedEngineer.name}. Only ${rma.assignedEngineer.name} can update or complete work on this unit.`
      });
    }

    const tech = performedBy || req.user?.name || 'Service Person';
    const fromStatus = rma.currentStatus;

    if (workPerformed) {
      rma.repair = rma.repair || {};
      rma.repair.actionsTaken = workPerformed;
    }
    if (serviceRemarks) {
      rma.repair = rma.repair || {};
      rma.repair.engineerNotes = serviceRemarks;
    }

    if (Array.isArray(sparesUsed) && sparesUsed.length > 0) {
      const SparePartModel = require('../models/SparePart');
      const SparePartInventoryModel = require('../models/SparePartInventory');
      const SparePartTransactionModel = require('../models/SparePartTransaction');
      const SparePartUsageModel = require('../models/SparePartUsage');

      rma.spares = sparesUsed.map((sp) => ({
        partId: sp.productId || sp.partId || sp._id || '',
        partCode: sp.partCode || sp.code || '',
        partName: sp.name || sp.partName || '',
        trackingType: sp.trackingType || 'SERIALIZED',
        serialNumber: sp.serialNumber || sp.sn || '',
        serialNumbers: Array.isArray(sp.serialNumbers) ? sp.serialNumbers : sp.serialNumber ? [sp.serialNumber] : [],
        requestedQty: sp.quantity || sp.requestedQty || 1,
        issuedQty: sp.quantity || sp.issuedQty || 1,
        unitCost: sp.unitCost || sp.price || 0,
        status: 'ISSUED',
        issuedAt: new Date(),
        issuedBy: tech,
      }));

      // Automatically consume stock in Category-Based SparePart inventory and log SparePartInventory + Transactions
      for (let i = 0; i < sparesUsed.length; i++) {
        const sp = sparesUsed[i];
        const qty = Number(sp.quantity) || 1;
        const partNameOrCode = sp.partCode || sp.code || sp.name || sp.partName;
        const specificSerial = sp.serialNumber || (Array.isArray(sp.serialNumbers) && sp.serialNumbers[0]);

        if (partNameOrCode || specificSerial) {
          try {
            // 1. If a specific Serial Number was passed
            if (specificSerial) {
              const serialItem = await SparePartInventoryModel.findOne({
                serialNumber: String(specificSerial).toUpperCase().trim(),
                status: 'AVAILABLE',
              });

              if (serialItem) {
                serialItem.status = 'INSTALLED';
                serialItem.installedInRmaId = rma._id;
                serialItem.installedInRmaNo = rma.rmaNo;
                serialItem.installedInTicketNo = rma.ticketNo || '';
                serialItem.installedInProductModel = rma.modelNo || '';
                serialItem.installedByTechnician = tech;
                serialItem.installedDate = new Date();
                serialItem.notes = `Installed in RMA #${rma.rmaNo}`;
                await serialItem.save();

                if (rma.spares[i]) {
                  rma.spares[i].serialNumber = serialItem.serialNumber;
                  rma.spares[i].serialNumbers = [serialItem.serialNumber];
                  if (!rma.spares[i].partCode) rma.spares[i].partCode = serialItem.sparePartCode;
                }

                await SparePartTransactionModel.create({
                  serialNumber: serialItem.serialNumber,
                  sparePartId: serialItem.sparePartId,
                  sparePartCode: serialItem.sparePartCode,
                  sparePartName: serialItem.sparePartName,
                  category: serialItem.category,
                  actionType: 'INSTALLED',
                  quantity: 1,
                  fromStatus: 'AVAILABLE',
                  toStatus: 'INSTALLED',
                  rmaId: rma._id,
                  rmaNo: rma.rmaNo,
                  ticketNo: rma.ticketNo || '',
                  productModel: rma.modelNo || '',
                  performedBy: tech,
                  location: 'Service Center',
                  notes: `Installed in RMA #${rma.rmaNo}`,
                });

                // Recalculate master part stock
                const parentPart = await SparePartModel.findById(serialItem.sparePartId);
                if (parentPart) {
                  const allSerials = await SparePartInventoryModel.find({ sparePartId: parentPart._id });
                  parentPart.totalStock = allSerials.filter((s) => s.status !== 'SCRAPPED').length;
                  parentPart.usedStock = allSerials.filter((s) => s.status === 'INSTALLED').length;
                  parentPart.availableStock = allSerials.filter((s) => s.status === 'AVAILABLE').length;
                  await parentPart.save();
                }
              }
            } else {
              // 2. Generic lookup by Code / Name
              const foundPart = await SparePartModel.findOne({
                $or: [
                  { code: String(partNameOrCode).toUpperCase().trim() },
                  { name: { $regex: new RegExp(`^${String(partNameOrCode).trim()}$`, 'i') } },
                ],
              });

              if (foundPart) {
                if (foundPart.trackingType === 'SERIALIZED') {
                  const availableSerials = await SparePartInventoryModel.find({
                    sparePartId: foundPart._id,
                    status: 'AVAILABLE',
                  }).limit(qty);

                  const pickedSerials = [];
                  for (const s of availableSerials) {
                    s.status = 'INSTALLED';
                    s.installedInRmaId = rma._id;
                    s.installedInRmaNo = rma.rmaNo;
                    s.installedInTicketNo = rma.ticketNo || '';
                    s.installedInProductModel = rma.modelNo || '';
                    s.installedByTechnician = tech;
                    s.installedDate = new Date();
                    await s.save();
                    pickedSerials.push(s.serialNumber);

                    await SparePartTransactionModel.create({
                      serialNumber: s.serialNumber,
                      sparePartId: s.sparePartId,
                      sparePartCode: s.sparePartCode,
                      sparePartName: s.sparePartName,
                      category: s.category,
                      actionType: 'INSTALLED',
                      quantity: 1,
                      fromStatus: 'AVAILABLE',
                      toStatus: 'INSTALLED',
                      rmaId: rma._id,
                      rmaNo: rma.rmaNo,
                      ticketNo: rma.ticketNo || '',
                      productModel: rma.modelNo || '',
                      performedBy: tech,
                      location: 'Service Center',
                      notes: `Auto-picked S/N for RMA #${rma.rmaNo}`,
                    });
                  }

                  if (rma.spares[i]) {
                    if (pickedSerials.length > 0) {
                      rma.spares[i].serialNumber = pickedSerials[0];
                      rma.spares[i].serialNumbers = pickedSerials;
                    }
                    if (!rma.spares[i].partCode) rma.spares[i].partCode = foundPart.code;
                  }

                  const allSerials = await SparePartInventoryModel.find({ sparePartId: foundPart._id });
                  foundPart.totalStock = allSerials.filter((s) => s.status !== 'SCRAPPED').length;
                  foundPart.usedStock = allSerials.filter((s) => s.status === 'INSTALLED').length;
                  foundPart.availableStock = allSerials.filter((s) => s.status === 'AVAILABLE').length;
                  await foundPart.save();
                } else {
                  foundPart.usedStock = (foundPart.usedStock || 0) + qty;
                  foundPart.availableStock = Math.max(0, (foundPart.totalStock || 0) - foundPart.usedStock);
                  await foundPart.save();
                }

                await SparePartUsageModel.create({
                  sparePartId: foundPart._id,
                  sparePartCode: foundPart.code,
                  sparePartName: foundPart.name,
                  category: foundPart.category,
                  rmaId: rma._id,
                  rmaNo: rma.rmaNo,
                  ticketNo: rma.ticketNo || '',
                  productModel: rma.modelNo || '',
                  servicePerson: tech,
                  actionType: 'CONSUMED',
                  quantity: qty,
                  unitCost: foundPart.purchaseCost || sp.unitCost || 0,
                  location: 'Service Center',
                  notes: `Consumed during service of RMA #${rma.rmaNo}`,
                });
              }
            }
          } catch (spErr) {
            console.warn('SparePart stock deduction warning:', spErr.message);
          }
        }
      }
    }

    // Handle Spares Inventory Product Replacement
    if (needProductReplacement && replacementProduct && (replacementProduct.inventoryId || replacementProduct.modelNo)) {
      try {
        let inv = null;
        if (replacementProduct.inventoryId) {
          inv = await Inventory.findById(replacementProduct.inventoryId);
        }
        if (!inv && replacementProduct.modelNo) {
          inv = await Inventory.findOne({
            $or: [{ modelNo: replacementProduct.modelNo }, { model: replacementProduct.modelNo }],
            $or: [{ isSpare: true }, { category: 'Spares' }, { subCategory: 'Spares Inventory' }, { subCategory: 'Spares' }]
          });
        }

        if (inv) {
          if ((Number(inv.quantity) || 0) <= 0) {
            return res.status(400).json({
              success: false,
              message: 'Selected replacement product is no longer available in Spares Inventory.'
            });
          }

          // Deduct exactly 1 from quantity
          const newQty = Math.max(0, (Number(inv.quantity) || 1) - 1);
          inv.quantity = newQty;
          inv.currentStock = newQty;

          // Remove serial from scannedCodes / barcodes
          if (replacementProduct.serialNumber) {
            const snTrim = String(replacementProduct.serialNumber).trim();
            const codes = (inv.scannedCodes || '').split(/[\n,]+/).map((c) => c.trim()).filter(Boolean);
            const remainingCodes = codes.filter((c) => c !== snTrim);
            inv.scannedCodes = remainingCodes.join('\n');
            inv.barcodes = remainingCodes;

            // Update matching serial in Warranty collection
            try {
              await Warranty.updateMany(
                {
                  $or: [{ serialNumber: snTrim }, { barcode: snTrim }]
                },
                {
                  $set: {
                    stockStatus: 'ISSUED_FOR_REPLACEMENT',
                    status: 'ISSUED_FOR_REPLACEMENT',
                    rmaId: rma._id,
                    rmaNumber: rma.rmaNo,
                    issuedTo: rma.serialNumber || rma.modelNo,
                    issuedBy: tech,
                    issuedAt: new Date()
                  }
                }
              );
            } catch (wErr) {
              console.warn('Warranty serial status update warning:', wErr.message);
            }
          }

          // If quantity is 0, set inactive and OUT_OF_STOCK
          if (newQty === 0) {
            inv.active = false;
            inv.stockStatus = 'OUT_OF_STOCK';
          }

          await inv.save();

          // Log ServiceInventoryTransaction for audit
          try {
            await ServiceInventoryTransaction.create({
              transactionType: 'PRODUCT_REPLACEMENT',
              referenceType: 'RMA',
              referenceId: rma._id,
              referenceNo: rma.rmaNo,
              modelNo: replacementProduct.modelNo || inv.modelNo || rma.modelNo,
              serialNumber: replacementProduct.serialNumber || '',
              quantity: 1,
              direction: 'OUT',
              fromLocation: inv.location || replacementProduct.location || 'Spares Inventory',
              toLocation: `Customer RMA (${rma.customerSnapshot?.name || 'Walk-in'})`,
              performedBy: tech,
              notes: `1 unit deducted from ${inv.location || 'Spares'} Inventory for defective unit replacement (Old S/N: ${rma.serialNumber || 'N/A'})`
            });
          } catch (txErr) {
            console.warn('ServiceInventoryTransaction log warning:', txErr.message);
          }
        }

        // Save structured replacement subdocument on RMA
        rma.replacement = {
          isReplaced: true,
          defectiveModel: rma.modelNo,
          defectiveSerialNumber: rma.serialNumber || '',
          oldSerialNumber: rma.serialNumber || '',
          newSerialNumber: replacementProduct.serialNumber || '',
          replacementModel: replacementProduct.modelNo || replacementProduct.model || rma.modelNo,
          replacementSerial: replacementProduct.serialNumber || '',
          replacementInventoryId: replacementProduct.inventoryId || (inv ? inv._id : ''),
          replacementLocation: replacementProduct.location || (inv ? inv.location : 'Main Warehouse'),
          inventorySource: '2% Warranty Spares Inventory',
          reason: diagnosisUpdate?.observedFault || diagnosisUpdate?.rootCause || 'Defective Product Replacement',
          observedFault: diagnosisUpdate?.observedFault || '',
          qcResult: qcResult || 'PASSED',
          replacementRemarks: serviceRemarks || '',
          approvedBy: rma.assignedEngineer?.name || tech,
          replacedBy: tech,
          replacedAt: new Date(),
          issuedAt: new Date(),
          status: 'REPLACEMENT_COMPLETED',
          notes: replacementProduct.notes || `Replaced defective unit with 2% Spares Inventory unit (${replacementProduct.modelNo || ''} S/N: ${replacementProduct.serialNumber || ''})`,
        };
        rma.resolutionType = 'REPLACEMENT';

        // Add history entry for replacement
        await RMAHistory.create({
          rmaId: rma._id,
          rmaNo: rma.rmaNo,
          serviceRequestId: rma.serviceRequestId,
          ticketNo: rma.ticketNo,
          action: 'PRODUCT_REPLACED',
          fromStatus,
          toStatus: markCompleted ? 'REPAIR_COMPLETED' : fromStatus,
          userName: tech,
          userRole: 'SERVICE_PERSON',
          notes: `Product Replaced: ${rma.modelNo} (${rma.serialNumber || 'Old S/N'}) → ${rma.replacement.replacementModel} (${rma.replacement.replacementSerial || 'New S/N'}). 1 unit deducted from ${rma.replacement.replacementLocation} 2% Spares Inventory.`,
          metadata: {
            replacement: rma.replacement
          }
        });
      } catch (repErr) {
        console.warn('Spares Inventory replacement deduction warning:', repErr.message);
      }
    }

    if (diagnosisUpdate) {
      rma.diagnosis = rma.diagnosis || {};
      if (diagnosisUpdate.observedFault) rma.diagnosis.observedFault = diagnosisUpdate.observedFault;
      if (diagnosisUpdate.rootCause) rma.diagnosis.rootCause = diagnosisUpdate.rootCause;
      if (diagnosisUpdate.failureCode) rma.diagnosis.failureCode = diagnosisUpdate.failureCode;
      if (diagnosisUpdate.failureDesc) rma.diagnosis.failureDesc = diagnosisUpdate.failureDesc;
      rma.diagnosis.needSpare = Boolean(needSparePart);
      rma.diagnosis.needReplacement = Boolean(needProductReplacement);
      rma.diagnosis.diagnosedBy = tech;
      rma.diagnosis.diagnosedAt = new Date();
    }

    if (qcResult) {
      rma.qc = rma.qc || {};
      rma.qc.testedBy = tech;
      rma.qc.testedAt = new Date();
      rma.qc.passed = qcResult === 'PASSED' || qcResult === true;
      if (qcTests) rma.qc.tests = { ...rma.qc.tests, ...qcTests };
      if (qcNotes) rma.qc.notes = qcNotes;
    }

    let toStatus = fromStatus;
    if (markCompleted) {
      toStatus = 'REPAIR_COMPLETED';
      rma.currentStatus = 'REPAIR_COMPLETED';
      rma.repair = rma.repair || {};
      rma.repair.completedAt = new Date();
      if (rma.repair.startedAt) {
        rma.repair.repairDurationMinutes = Math.round((new Date() - new Date(rma.repair.startedAt)) / (1000 * 60));
      }
    }

    await rma.save();

    await RMAHistory.create({
      rmaId: rma._id,
      rmaNo: rma.rmaNo,
      serviceRequestId: rma.serviceRequestId,
      ticketNo: rma.ticketNo,
      action: markCompleted ? 'SERVICE_COMPLETED' : 'WORK_DETAILS_RECORDED',
      fromStatus,
      toStatus,
      userName: tech,
      userRole: 'SERVICE_PERSON',
      notes: serviceRemarks || (markCompleted ? `Service completed and QC recorded by ${tech}` : `Work details updated by ${tech}`),
      metadata: {
        workPerformed,
        sparesCount: (sparesUsed || []).length,
        qcResult,
      }
    });

    try {
      await notifyServiceStageProgress({
        rma,
        stageKey: markCompleted ? 'SERVICE_COMPLETED' : 'WORK_DETAILS_RECORDED',
        stageTitle: markCompleted ? '✅ Service Completed' : '📝 Service Work Details Recorded',
        stageDetails: serviceRemarks || (markCompleted ? `Service completed and QC recorded by ${tech}` : `Work details updated by ${tech}`),
        performedBy: tech,
        userRole: 'SERVICE_PERSON',
        extra: { markCompleted: Boolean(markCompleted), qcResult: qcResult || '' },
      });
    } catch (notifErr) {
      console.warn('Record work details notification error:', notifErr.message);
    }

    res.json({
      success: true,
      message: markCompleted ? `Service on RMA #${rma.rmaNo} completed successfully!` : `Work details saved for RMA #${rma.rmaNo}`,
      data: rma,
    });
  } catch (err) {
    console.error('Record Work Details Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllRMAs,
  getRMADetails,
  updateRMAStatus,
  recordInitialInspection,
  assignEngineerAndDiagnosis,
  updateEstimateAndApproval,
  updateRepairAction,
  recordQCResult,
  dispatchRMA,
  getFailureCodes,
  getServiceDashboardStats,
  assignServiceToEngineer,
  startService,
  getServicePersonPerformance,
  acceptServiceAssignment,
  getRMAServiceDetails,
  recordServiceWorkDetails,
  requestDispatchApproval,
  approveDispatchPermission,
};
