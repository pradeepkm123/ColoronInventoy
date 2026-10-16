const NotificationTemplate = require('../models/NotificationTemplate');
const nodemailer = require('nodemailer');

const getTransporter = () => {
  if (!process.env.SMTP_HOST) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmailViaNodemailer = async (to, subject, text) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`   [NODEMAILER EMAIL SKIPPED] SMTP credentials not set in .env`);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"COLORON Service" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    });
    console.log(`   ✉️  Real Email sent to ${to}`);
  } catch (err) {
    console.error(`   ❌ Failed to send Email via Nodemailer to ${to}:`, err.message);
  }
};

const sendSMSViaTwilio = async (to, body) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.log(`   [TWILIO SMS SKIPPED] Credentials not set in .env`);
    return;
  }
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    console.log(`   📱 Real Twilio SMS sent to ${to}`);
  } catch (err) {
    console.error(`   ❌ Failed to send Twilio SMS to ${to}:`, err.message);
  }
};

const sendWhatsAppViaTwilio = async (to, body) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_NUMBER) {
    console.log(`   [TWILIO WHATSAPP SKIPPED] Credentials not set in .env`);
    return;
  }
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    let formattedTo = to;
    if (!formattedTo.startsWith('whatsapp:')) {
      formattedTo = `whatsapp:${formattedTo.startsWith('+') ? formattedTo : '+' + formattedTo}`;
    }
    
    let formattedFrom = process.env.TWILIO_WHATSAPP_NUMBER;
    if (!formattedFrom.startsWith('whatsapp:')) {
      formattedFrom = `whatsapp:${formattedFrom}`;
    }

    await client.messages.create({
      body,
      from: formattedFrom,
      to: formattedTo,
    });
    console.log(`   💬 Real Twilio WhatsApp sent to ${to}`);
  } catch (err) {
    console.error(`   ❌ Failed to send Twilio WhatsApp to ${to}:`, err.message);
  }
};

const DEFAULT_TEMPLATES = {
  SERVICE_REQUEST_CREATED: {
    title: 'Service Request Registered',
    sms: 'COLORON Service: Hello {{customerName}}, your service request has been registered. Ticket: {{ticketNo}}, Product: {{modelNo}}, Status: Service Request Created.',
    whatsapp: 'Hello *{{customerName}}*,\n\nYour COLORON service request has been registered.\n\n*Ticket:* {{ticketNo}}\n*Product:* {{modelNo}}\n*Serial:* {{serialNo}}\n*Complaint:* {{complaint}}\n\n*Current Status:* Service Request Created\nWe will notify you on further updates.',
    emailSubject: 'Service Request Registered - {{ticketNo}}',
    emailBody: 'Dear {{customerName}},\n\nYour service request {{ticketNo}} for product {{modelNo}} (Serial: {{serialNo}}) has been registered in our system.\n\nComplaint: {{complaint}}\nStore: {{storeName}}\n\nThank you,\nCOLORON Service Team',
  },
  PRODUCT_RECEIVED: {
    title: 'Product Received & RMA Created',
    sms: 'COLORON Service: Hello {{customerName}}, your product (Serial: {{serialNo}}) has been received at our store. RMA: {{rmaNo}}, Ticket: {{ticketNo}}.',
    whatsapp: 'Hello *{{customerName}}*,\n\nYour product has physically arrived at our service desk.\n\n*RMA:* {{rmaNo}}\n*Ticket:* {{ticketNo}}\n*Serial:* {{serialNo}}\n\nOur service engineers have queued your unit for initial inspection.',
    emailSubject: 'Product Check-In Confirmed - {{rmaNo}}',
    emailBody: 'Dear {{customerName}},\n\nYour product (Serial: {{serialNo}}) has been checked into our service center under RMA #{{rmaNo}}.\n\nWe will begin diagnosis shortly.',
  },
  REPAIR_COMPLETED: {
    title: 'Repair Completed',
    sms: 'COLORON Service: Your product under RMA {{rmaNo}} (Ticket: {{ticketNo}}) has been repaired and is undergoing QC testing.',
    whatsapp: 'Hello *{{customerName}}*,\n\nRepair has been successfully completed for your product *{{modelNo}}*.\n\n*RMA:* {{rmaNo}}\n*Ticket:* {{ticketNo}}\n\nIt is now undergoing Quality Control & Burn-In testing.',
    emailSubject: 'Repair Completed - {{rmaNo}}',
    emailBody: 'Dear {{customerName}},\n\nRepair has been completed for your product {{modelNo}} (RMA: {{rmaNo}}). It will now proceed to Quality Control before dispatch.',
  },
  READY_FOR_DISPATCH: {
    title: 'Ready For Dispatch / Collection',
    sms: 'COLORON Service: Your serviced product under RMA {{rmaNo}} has passed QC and is ready for dispatch/collection.',
    whatsapp: 'Hello *{{customerName}}*,\n\nGreat news! Your serviced product *{{modelNo}}* has passed all QC tests and is *Ready for Dispatch*.\n\n*RMA:* {{rmaNo}}\n*Ticket:* {{ticketNo}}',
    emailSubject: 'Ready for Dispatch - {{rmaNo}}',
    emailBody: 'Dear {{customerName}},\n\nYour product {{modelNo}} (RMA: {{rmaNo}}) has successfully passed Quality Control and is ready for delivery.',
  },
  DISPATCHED: {
    title: 'Product Dispatched',
    sms: 'COLORON Service: Your product (RMA: {{rmaNo}}) has been dispatched via {{courierName}}. AWB / Tracking: {{awbNumber}}.',
    whatsapp: 'Hello *{{customerName}}*,\n\nYour serviced product has been dispatched.\n\n*RMA:* {{rmaNo}}\n*Courier:* {{courierName}}\n*Tracking AWB:* {{awbNumber}}\n\nThank you for choosing COLORON!',
    emailSubject: 'Product Dispatched - {{rmaNo}}',
    emailBody: 'Dear {{customerName}},\n\nYour serviced product has been dispatched via {{courierName}} with tracking number {{awbNumber}}.\n\nRMA: {{rmaNo}}\nTicket: {{ticketNo}}',
  },
  FAULT_CONFIRMED: {
    title: 'Inspection Complete (Fault Confirmed)',
    sms: 'COLORON Service: Hello {{customerName}}, inspection complete for RMA {{rmaNo}}. Result: Fault Confirmed.',
    whatsapp: 'Hello *{{customerName}}*,\n\nInitial inspection is complete for your product *{{modelNo}}*.\n\n*RMA:* {{rmaNo}}\n*Status:* Fault Confirmed\n\nOur engineers will proceed with diagnosis.',
    emailSubject: 'Inspection Complete (Fault Confirmed) - {{rmaNo}}',
    emailBody: 'Dear {{customerName}},\n\nInitial inspection is complete for your product {{modelNo}} (RMA: {{rmaNo}}).\n\nResult: Fault Confirmed.\nNotes: {{notes}}',
  },
  DIAGNOSIS_RECORDED: {
    title: 'Diagnosis Complete',
    sms: 'COLORON Service: Diagnosis complete for RMA {{rmaNo}}. Issue: {{failureDesc}}, Suggestion: {{suggestedRepair}}.',
    whatsapp: 'Hello *{{customerName}}*,\n\nDiagnosis is complete for your product *{{modelNo}}*.\n\n*RMA:* {{rmaNo}}\n*Failure:* {{failureCode}} ({{failureDesc}})\n*Suggested Action:* {{suggestedRepair}}\n*Engineer Notes:* {{techNotes}}',
    emailSubject: 'Diagnosis Complete - {{rmaNo}}',
    emailBody: 'Dear {{customerName}},\n\nOur engineer has completed diagnosis for your product {{modelNo}} (RMA: {{rmaNo}}).\n\nDetails:\n- Failure Code: {{failureCode}} ({{failureDesc}})\n- Suggested Repair: {{suggestedRepair}}\n- Engineer Notes: {{techNotes}}',
  },
  ESTIMATE_UPDATED: {
    title: 'Repair Estimate Status Update',
    sms: 'COLORON Service: Repair estimate for RMA {{rmaNo}} is Rs.{{totalAmount}}. Approval Status: {{estimateStatus}}.',
    whatsapp: 'Hello *{{customerName}}*,\n\nRepair estimate status has been updated for your product *{{modelNo}}*.\n\n*RMA:* {{rmaNo}}\n*Total Cost:* Rs.{{totalAmount}}\n*Approval Status:* {{estimateStatus}}',
    emailSubject: 'Repair Estimate Status Update - {{rmaNo}}',
    emailBody: 'Dear {{customerName}},\n\nRepair estimate status has been updated for your product {{modelNo}} (RMA: {{rmaNo}}).\n\nCost breakdown:\n- Parts: Rs.{{partsCost}}\n- Labour: Rs.{{labourCost}}\n- Total: Rs.{{totalAmount}}\n- Status: {{estimateStatus}}',
  },
  WAITING_SPARE: {
    title: 'Repair Paused (Waiting Spares)',
    sms: 'COLORON Service: RMA {{rmaNo}} repair is paused. Status: Waiting for spare parts.',
    whatsapp: 'Hello *{{customerName}}*,\n\nRepair for your product *{{modelNo}}* is currently on hold.\n\n*RMA:* {{rmaNo}}\n*Status:* Waiting for Spare Parts\n\nWe will resume the repair as soon as the spares arrive.',
    emailSubject: 'Repair Paused (Waiting Spares) - {{rmaNo}}',
    emailBody: 'Dear {{customerName}},\n\nRepair for your product {{modelNo}} (RMA: {{rmaNo}}) is paused because we are waiting for spare parts.',
  },
  UNDER_REPAIR: {
    title: 'Repair Started/Resumed',
    sms: 'COLORON Service: Repair has started/resumed for your product under RMA {{rmaNo}}.',
    whatsapp: 'Hello *{{customerName}}*,\n\nRepair has started or resumed for your product *{{modelNo}}*.\n\n*RMA:* {{rmaNo}}\n*Status:* Under Repair',
    emailSubject: 'Repair Started/Resumed - {{rmaNo}}',
    emailBody: 'Dear {{customerName}},\n\nOur engineer has started or resumed work on your product {{modelNo}} (RMA: {{rmaNo}}).',
  },
  QC_FAILED: {
    title: 'Quality Check Failed',
    sms: 'COLORON Service: RMA {{rmaNo}} did not pass QC. Re-routing to repair line.',
    whatsapp: 'Hello *{{customerName}}*,\n\nQuality check alert: your product *{{modelNo}}* did not pass final QC testing.\n\n*RMA:* {{rmaNo}}\n*Reason:* {{failureReason}}\n\nIt has been re-routed back to the repair engineers.',
    emailSubject: 'Quality Check Failed (Re-routed to Repair) - {{rmaNo}}',
    emailBody: 'Dear {{customerName}},\n\nYour product {{modelNo}} (RMA: {{rmaNo}}) did not pass our final quality checks. We have re-routed it back to the repair team to rectify the issue: {{failureReason}}.',
  },
};

const interpolate = (templateStr, data) => {
  if (!templateStr) return '';
  return templateStr.replace(/{{\s*(\w+)\s*}}/g, (_, key) => data[key] || '');
};

const notifyServiceStatusChange = async ({ event, rma, serviceRequest, customer, extraData = {} }) => {
  try {
    const customerName = customer?.name || customer?.customerName || serviceRequest?.customerSnapshot?.name || rma?.customerSnapshot?.name || 'Customer';
    const mobile = customer?.mobile || customer?.customerMobile || serviceRequest?.customerSnapshot?.mobile || rma?.customerSnapshot?.mobile || '';
    const whatsapp = customer?.whatsapp || serviceRequest?.customerSnapshot?.whatsapp || mobile;
    const email = customer?.email || serviceRequest?.customerSnapshot?.email || '';

    const payload = {
      customerName,
      mobile,
      whatsapp,
      email,
      ticketNo: serviceRequest?.ticketNo || rma?.ticketNo || 'N/A',
      rmaNo: rma?.rmaNo || 'N/A',
      modelNo: serviceRequest?.modelNo || rma?.modelNo || 'N/A',
      serialNo: serviceRequest?.serialNumber || rma?.serialNumber || 'N/A',
      complaint: serviceRequest?.complaint?.description || 'N/A',
      storeName: serviceRequest?.storeName || rma?.storeName || 'COLORON Service',
      courierName: rma?.dispatch?.courierName || extraData.courierName || 'Courier',
      awbNumber: rma?.dispatch?.awbNumber || extraData.awbNumber || 'N/A',
      ...extraData,
    };

    let template = await NotificationTemplate.findOne({ event, isActive: true });
    const fallback = DEFAULT_TEMPLATES[event] || {};

    const smsMessage = interpolate(template?.smsTemplate || fallback.sms || '', payload);
    const whatsappMessage = interpolate(template?.whatsappTemplate || fallback.whatsapp || '', payload);
    const emailSubject = interpolate(template?.emailSubject || fallback.emailSubject || '', payload);
    const emailBody = interpolate(template?.emailBody || fallback.emailBody || '', payload);

    // Send real messages if credentials exist
    console.log(`\n🔔 [NOTIFICATION ENGINE] Triggered Event: ${event}`);
    if (mobile && smsMessage) {
      console.log(`   📱 SMS to ${mobile}: "${smsMessage.slice(0, 80)}..."`);
      await sendSMSViaTwilio(mobile, smsMessage);
    }
    if (whatsapp && whatsappMessage) {
      console.log(`   💬 WhatsApp to ${whatsapp}: "${whatsappMessage.slice(0, 80)}..."`);
      await sendWhatsAppViaTwilio(whatsapp, whatsappMessage);
    }
    if (email && emailBody) {
      console.log(`   ✉️  Email to ${email}: Subject "${emailSubject}"`);
      await sendEmailViaNodemailer(email, emailSubject, emailBody);
    }

    return {
      success: true,
      event,
      sentTo: { mobile, whatsapp, email },
      timestamp: new Date(),
    };
  } catch (err) {
    console.error('❌ Notification Engine Error:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  notifyServiceStatusChange,
  DEFAULT_TEMPLATES,
};
