// backend/services/serviceNotificationHelper.js
const Notification = require('../models/Notification');
const {
  emitToStore,
  emitToSuperAdmin,
  emitToServicePerson,
  emitToUser,
  emitToAll,
} = require('../socket');

/**
 * 1. Notify Store, Super Admin & Service Team when a new Service Request is registered
 */
async function notifyServiceRequestCreated(serviceRequest, creatorUser = {}) {
  if (!serviceRequest) return;
  try {
    const store = serviceRequest.storeName || 'Main Store';
    const ticketNo = serviceRequest.ticketNo || 'N/A';
    const modelNo = serviceRequest.modelNo || 'Product';
    const serialNumber = serviceRequest.serialNumber || 'N/A';
    const complaint = serviceRequest.complaint?.description || serviceRequest.complaint?.category || 'Service Needed';
    const customer = serviceRequest.customerSnapshot?.name || 'Customer';
    const creator = creatorUser.name || serviceRequest.createdBy || 'Store User';

    const notifTitle = `🔧 Service Request Created: #${ticketNo}`;
    const targetDetails = `Store: ${store}\nModel: ${modelNo}\nSerial: ${serialNumber}\nCustomer: ${customer}\nComplaint: ${complaint}\nCreated By: ${creator}`;

    // 1A. Create Store Confirmation Notification
    const storeNotif = await Notification.create({
      category: 'SERVICE',
      type: 'SERVICE_REQUEST_CREATED',
      senderName: creator,
      senderRole: creatorUser.role || 'STORE',
      recipientName: store,
      recipientRole: 'STORE',
      storeId: store,
      userLocation: store,
      modelNo,
      title: notifTitle,
      actionText: `Service Registered at ${store}:`,
      targetText: targetDetails,
      read: false,
      isRead: false,
      metadata: {
        ticketNo,
        serialNumber,
        modelNo,
        storeName: store,
        customerName: customer,
        stage: 'SERVICE_REQUEST_CREATED',
      },
    });

    // 1B. Create Super Admin Alert Notification
    await Notification.create({
      category: 'SERVICE',
      type: 'SERVICE_REQUEST_CREATED',
      senderName: `${creator} (${store})`,
      senderRole: 'STORE',
      recipientName: 'Super Admin',
      recipientRole: 'SUPER_ADMIN',
      storeId: store,
      userLocation: store,
      modelNo,
      title: `⚡ [${store}] New Service #${ticketNo}`,
      actionText: `New Service Request at ${store}:`,
      targetText: targetDetails,
      read: false,
      isRead: false,
      metadata: {
        ticketNo,
        serialNumber,
        modelNo,
        storeName: store,
        customerName: customer,
        stage: 'SERVICE_REQUEST_CREATED',
      },
    });

    // 1C. Real-time Live Socket broadcasts
    emitToStore(store, 'service_request_created', {
      notification: storeNotif,
      ticketNo,
      storeName: store,
      modelNo,
      serialNumber,
      message: `🔧 Service Request #${ticketNo} registered for ${modelNo} (${store})`,
    });

    emitToSuperAdmin('service_request_created', {
      notification: storeNotif,
      ticketNo,
      storeName: store,
      modelNo,
      serialNumber,
      message: `⚡ [${store}] New Service Request #${ticketNo} (${modelNo})`,
    });

    emitToServicePerson(null, 'service_request_created', {
      notification: storeNotif,
      ticketNo,
      storeName: store,
      modelNo,
      serialNumber,
      message: `🔧 New Service Request #${ticketNo} registered at ${store}`,
    });

    console.log(`✅ [Service Notifications] Broadcasted Service Request #${ticketNo} for ${store}`);
  } catch (err) {
    console.warn('notifyServiceRequestCreated error:', err.message);
  }
}

/**
 * 2. Notify Service Person when Super Admin allocates an RMA to them
 */
async function notifyServiceAssigned(rma, engineerData = {}, priority = 'NORMAL', dueDate = null, assignedBy = 'Super Admin') {
  if (!rma) return;
  try {
    const engineerName = engineerData.name || engineerData.engineerName || engineerData || 'Technician';
    const engineerId = engineerData.id || engineerData.engineerId || '';
    const store = rma.storeName || 'Main Store';
    const rmaNo = rma.rmaNo || 'N/A';
    const ticketNo = rma.ticketNo || 'N/A';
    const modelNo = rma.modelNo || 'Product';
    const serialNumber = rma.serialNumber || 'N/A';
    const dueStr = dueDate ? `\nDue Date: ${new Date(dueDate).toLocaleDateString('en-IN')}` : '';

    const notifTitle = `📋 [${priority.toUpperCase()}] Service Allocated: RMA #${rmaNo}`;
    const targetDetails = `Store: ${store}\nModel: ${modelNo}\nSerial: ${serialNumber}\nPriority: ${priority.toUpperCase()}${dueStr}\nAllocated By: ${assignedBy}`;

    // Notification specifically for Service Person
    const engNotif = await Notification.create({
      category: 'SERVICE',
      type: 'SERVICE_ASSIGNED',
      senderName: assignedBy,
      senderRole: 'SUPER_ADMIN',
      recipientName: engineerName,
      recipientRole: 'Service Person',
      storeId: store,
      userLocation: store,
      modelNo,
      title: notifTitle,
      actionText: `Service allocated to you from ${store}:`,
      targetText: targetDetails,
      read: false,
      isRead: false,
      metadata: {
        rmaNo,
        ticketNo,
        serialNumber,
        modelNo,
        storeName: store,
        assignedEngineer: engineerName,
        engineerId,
        priority,
        stage: 'ENGINEER_ASSIGNED',
      },
    });

    // Notify the originating store that engineer was assigned
    const storeNotif = await Notification.create({
      category: 'SERVICE',
      type: 'SERVICE_STAGE_UPDATE',
      senderName: assignedBy,
      senderRole: 'SUPER_ADMIN',
      recipientName: store,
      recipientRole: 'STORE',
      storeId: store,
      userLocation: store,
      modelNo,
      title: `👨‍🔧 Engineer Assigned: RMA #${rmaNo}`,
      actionText: `Engineer assigned for ${modelNo}:`,
      targetText: `RMA #${rmaNo} (Ticket #${ticketNo}) allocated to ${engineerName} for service.`,
      read: false,
      isRead: false,
      metadata: {
        rmaNo,
        ticketNo,
        serialNumber,
        modelNo,
        storeName: store,
        assignedEngineer: engineerName,
        stage: 'ENGINEER_ASSIGNED',
      },
    });

    // Real-time Live Socket broadcasts
    emitToServicePerson(engineerName, 'service_assigned', {
      notification: engNotif,
      rmaNo,
      ticketNo,
      storeName: store,
      modelNo,
      serialNumber,
      priority,
      message: `📋 RMA #${rmaNo} (${modelNo} from ${store}) has been allocated to you!`,
    });

    emitToStore(store, 'service_stage_updated', {
      notification: storeNotif,
      rmaNo,
      ticketNo,
      storeName: store,
      modelNo,
      stage: 'ENGINEER_ASSIGNED',
      message: `👨‍🔧 RMA #${rmaNo} allocated to Service Engineer ${engineerName}`,
    });

    emitToSuperAdmin('service_stage_updated', {
      rmaNo,
      ticketNo,
      storeName: store,
      modelNo,
      stage: 'ENGINEER_ASSIGNED',
      message: `RMA #${rmaNo} assigned to ${engineerName}`,
    });

    console.log(`✅ [Service Notifications] Broadcasted Service Assignment for RMA #${rmaNo} -> ${engineerName}`);
  } catch (err) {
    console.warn('notifyServiceAssigned error:', err.message);
  }
}

/**
 * 3. Notify Store, Service Person & Super Admin at EVERY Service Stage Progress & Completion
 */
async function notifyServiceStageProgress({
  rma,
  stageKey,
  stageTitle,
  stageDetails,
  performedBy = 'Service Person',
  userRole = 'Service Person',
  extra = {},
}) {
  if (!rma) return;
  try {
    const store = rma.storeName || 'Main Store';
    const rmaNo = rma.rmaNo || 'N/A';
    const ticketNo = rma.ticketNo || 'N/A';
    const modelNo = rma.modelNo || 'Product';
    const serialNumber = rma.serialNumber || 'N/A';
    const engineer = performedBy || rma.assignedEngineer?.name || 'Service Person';

    const fullDetails = `Product: ${modelNo} (S/N: ${serialNumber})\nStage: ${stageTitle}\nOriginating Store: ${store}\nHandled By: ${engineer}\n${stageDetails ? `Notes: ${stageDetails}` : ''}`;

    // 3A. Store notification (Store A or Store B receives immediate stage update for their product)
    const storeNotif = await Notification.create({
      category: 'SERVICE',
      type: 'SERVICE_STAGE_UPDATE',
      senderName: `${engineer} (Service Team)`,
      senderRole: 'SERVICE_PERSON',
      recipientName: store,
      recipientRole: 'STORE',
      storeId: store,
      userLocation: store,
      modelNo,
      title: `${stageTitle} — RMA #${rmaNo}`,
      actionText: `Update on ${store} Product:`,
      targetText: fullDetails,
      read: false,
      isRead: false,
      metadata: {
        rmaNo,
        ticketNo,
        storeName: store,
        modelNo,
        serialNumber,
        stage: stageKey,
        performedBy: engineer,
        servicePerson: engineer,
        ...extra,
      },
    });

    // 3B. Service Person stage record confirmation
    const personNotif = await Notification.create({
      category: 'SERVICE',
      type: 'SERVICE_STAGE_UPDATE',
      senderName: engineer,
      senderRole: 'SERVICE_PERSON',
      recipientName: engineer,
      recipientRole: 'Service Person',
      storeId: store,
      userLocation: store,
      modelNo,
      title: `✅ [${store}] ${stageTitle} Recorded`,
      actionText: `You updated RMA #${rmaNo} from ${store}:`,
      targetText: fullDetails,
      read: false,
      isRead: false,
      metadata: {
        rmaNo,
        ticketNo,
        storeName: store,
        modelNo,
        serialNumber,
        stage: stageKey,
        performedBy: engineer,
        servicePerson: engineer,
        ...extra,
      },
    });

    // 3C. Super Admin live record
    await Notification.create({
      category: 'SERVICE',
      type: 'SERVICE_STAGE_UPDATE',
      senderName: `${engineer} (${store})`,
      senderRole: 'SERVICE_PERSON',
      recipientName: 'Super Admin',
      recipientRole: 'SUPER_ADMIN',
      storeId: store,
      userLocation: store,
      modelNo,
      title: `🛠️ [${store}] ${stageTitle}: RMA #${rmaNo}`,
      actionText: `Service progress by ${engineer}:`,
      targetText: fullDetails,
      read: false,
      isRead: false,
      metadata: {
        rmaNo,
        ticketNo,
        storeName: store,
        modelNo,
        serialNumber,
        stage: stageKey,
        performedBy: engineer,
        servicePerson: engineer,
        ...extra,
      },
    });

    // 3D. Real-time Live Socket broadcasts
    // Emit to Originating Store
    emitToStore(store, 'service_stage_updated', {
      notification: storeNotif,
      rmaNo,
      ticketNo,
      storeName: store,
      modelNo,
      serialNumber,
      stage: stageKey,
      title: stageTitle,
      performedBy: engineer,
      message: `🔔 [${store}] RMA #${rmaNo} (${modelNo}): ${stageTitle}`,
    });

    // Emit to Service Person
    emitToServicePerson(engineer, 'service_stage_updated', {
      notification: personNotif,
      rmaNo,
      ticketNo,
      storeName: store,
      modelNo,
      serialNumber,
      stage: stageKey,
      title: stageTitle,
      performedBy: engineer,
      message: `✅ Stage recorded for RMA #${rmaNo}: ${stageTitle}`,
    });

    // Emit to Super Admin
    emitToSuperAdmin('service_stage_updated', {
      rmaNo,
      ticketNo,
      storeName: store,
      modelNo,
      serialNumber,
      stage: stageKey,
      title: stageTitle,
      performedBy: engineer,
      message: `🛠️ [${store}] RMA #${rmaNo} (${modelNo}): ${stageTitle} by ${engineer}`,
    });

    console.log(`✅ [Service Notifications] Stage '${stageKey}' broadcasted for RMA #${rmaNo} (${store})`);
  } catch (err) {
    console.warn('notifyServiceStageProgress error:', err.message);
  }
}

module.exports = {
  notifyServiceRequestCreated,
  notifyServiceAssigned,
  notifyServiceStageProgress,
};
