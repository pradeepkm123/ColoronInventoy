const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require('dotenv');
dotenv.config();

const ServiceRequest = require('./models/ServiceRequest');
const RMA = require('./models/RMA');
const RMAHistory = require('./models/RMAHistory');
const ServiceInventoryTransaction = require('./models/ServiceInventoryTransaction');

(async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://pradeepkm:Prdharini123@cluster0.vxhik.mongodb.net/inventory';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    const srDel = await ServiceRequest.deleteMany({});
    console.log('🗑️ Cleared ServiceRequest records:', srDel.deletedCount);

    const rmaDel = await RMA.deleteMany({});
    console.log('🗑️ Cleared RMA records:', rmaDel.deletedCount);

    const histDel = await RMAHistory.deleteMany({});
    console.log('🗑️ Cleared RMAHistory records:', histDel.deletedCount);

    const txDel = await ServiceInventoryTransaction.deleteMany({});
    console.log('🗑️ Cleared ServiceInventoryTransaction records:', txDel.deletedCount);

    // Reset sequences
    if (mongoose.connection.db) {
      try {
        await mongoose.connection.db.collection('servicesequences').deleteMany({});
        console.log('🗑️ Cleared servicesequences collections');
      } catch (err) {
        console.log('No servicesequences found to delete');
      }
    }

    console.log('🎉 Service & RMA collections successfully cleaned up!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error during cleanup:', err.message);
  }
})();
