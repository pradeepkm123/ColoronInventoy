const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require('dotenv');
dotenv.config();

const ModelSequence = require('./models/ModelSequence');
const Warranty = require('./models/Warranty');
const Inventory = require('./models/Inventory');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check all ModelSequence docs
    const allSeq = await ModelSequence.find({});
    console.log('ModelSequence Docs in DB:', JSON.stringify(allSeq, null, 2));

    // Delete test ModelSequence docs or set to 0
    await ModelSequence.deleteMany({});
    console.log('✅ Cleared ModelSequence collection');

    // Also check test inventories / warranties
    const invCount = await Inventory.countDocuments({});
    console.log('Total Inventory docs:', invCount);

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
