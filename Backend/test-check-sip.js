const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_db';

async function check() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');

  const Product = require('./models/Product');
  const Inventory = require('./models/Inventory');
  const Notification = require('./models/Notification');

  const prods = await Product.find({ model: { $regex: /SIP-VB401L/i } }).lean();
  console.log('\n=== Products for SIP-VB401L ===');
  prods.forEach(p => {
    console.log(`Model: "${p.model}" | StockStatus: "${p.stockStatus}" | ReorderLevel: ${p.reorderLevel} | Qty: ${p.quantity}`);
  });

  const invs = await Inventory.find({ modelNo: { $regex: /SIP-VB401L/i } }).lean();
  console.log('\n=== Inventories for SIP-VB401L ===');
  invs.forEach(i => {
    console.log(`ModelNo: "${i.modelNo}" | Location: "${i.location}" | Quantity: ${i.quantity} | CurrentStock: ${i.currentStock}`);
  });

  const notifs = await Notification.find({ modelNo: { $regex: /SIP-VB401L/i } }).lean();
  console.log('\n=== Notifications for SIP-VB401L ===');
  notifs.forEach(n => {
    console.log(`StoreId: "${n.storeId}" | Type: "${n.type}" | Title: "${n.title}" | Target: "${n.targetText}"`);
  });

  await mongoose.disconnect();
}

check().catch(console.error);
