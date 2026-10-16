const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require('dotenv');
dotenv.config();

const Warranty = require('./models/Warranty');
const Inventory = require('./models/Inventory');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find matching warranties
    const wList = await Warranty.find({ barcode: /CO-I-2BFDML\(V\)261908/ });
    console.log('Matching Warranties in DB:', wList.map(w => w.barcode));

    // Find matching inventories
    const iList = await Inventory.find({ scannedCodes: /CO-I-2BFDML\(V\)261908/ });
    console.log('Matching Inventory Records in DB:', iList.map(i => ({ id: i._id, codes: i.scannedCodes })));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
