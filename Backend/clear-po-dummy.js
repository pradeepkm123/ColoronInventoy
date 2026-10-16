const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require('dotenv');
dotenv.config();

const PurchaseOrder = require('./models/PurchaseOrder');
const CompanyIdealSequence = require('./models/CompanyIdealSequence');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const poDel = await PurchaseOrder.deleteMany({});
    console.log('✅ Cleared PurchaseOrder records:', poDel.deletedCount);

    const seqDel = await CompanyIdealSequence.deleteMany({});
    console.log('✅ Cleared CompanyIdealSequence records:', seqDel.deletedCount);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
