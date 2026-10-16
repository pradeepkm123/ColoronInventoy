const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require('dotenv');
dotenv.config();

const Warranty = require('./models/Warranty');
const Inventory = require('./models/Inventory');
const ModelSequence = require('./models/ModelSequence');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Delete test warranties for this model on this test date
    const wDel = await Warranty.deleteMany({ barcode: /CO-I-2BFDML\(V\)261908/ });
    console.log('✅ Deleted test Warranty records:', wDel.deletedCount);

    // Delete test inventory batch for this model on this test date
    const iDel = await Inventory.deleteMany({ scannedCodes: /CO-I-2BFDML\(V\)261908/ });
    console.log('✅ Deleted test Inventory records:', iDel.deletedCount);

    // Reset ModelSequence counter
    await ModelSequence.findOneAndUpdate(
      { modelNo: 'CO-I-2BFDML(V)' },
      { lastCount: 0, updatedAt: new Date() },
      { upsert: true }
    );
    console.log('✅ ModelSequence lastCount reset to 0');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
