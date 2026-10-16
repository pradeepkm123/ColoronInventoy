const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

const mongoose = require('mongoose');
require('dotenv').config();

async function cleanAllDummySpareParts() {
  await mongoose.connect(process.env.MONGODB_URI);
  const SparePart = require('./models/SparePart');
  const SparePartInventory = require('./models/SparePartInventory');
  const SparePartTransaction = require('./models/SparePartTransaction');
  const SparePartUsage = require('./models/SparePartUsage');

  const p = await SparePart.deleteMany({});
  const inv = await SparePartInventory.deleteMany({});
  const tx = await SparePartTransaction.deleteMany({});
  const us = await SparePartUsage.deleteMany({});

  console.log(`✅ Deleted ${p.deletedCount} dummy spare parts.`);
  console.log(`✅ Deleted ${inv.deletedCount} dummy serial inventory items.`);
  console.log(`✅ Deleted ${tx.deletedCount} dummy transactions.`);
  console.log(`✅ Deleted ${us.deletedCount} dummy usage history records.`);
  console.log('🌟 Spare Parts Management is now 100% CLEAN for Real Data only!');
  process.exit(0);
}

cleanAllDummySpareParts().catch(err => {
  console.error(err);
  process.exit(1);
});
