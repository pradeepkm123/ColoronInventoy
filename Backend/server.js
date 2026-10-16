// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const path = require('path');
// const fs = require('fs');

// // Load environment variables
// dotenv.config();

// // Create Express app
// const app = express();

// // Ensure uploads folder exists
// const uploadDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
// app.use('/uploads', express.static(uploadDir)); // ✅ serve image files

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// // Middlewares
// app.use(cors());
// app.use(express.json()); // Replaces deprecated bodyParser.json()
// app.use('/uploads', express.static(uploadDir)); // Serve uploaded images

// const authRoutes = require('./routes/authRoutes');
// const warehouseRoutes = require('./routes/warehouseRoutes');
// const brandRoutes = require('./routes/brandRoutes');
// const locationRoutes = require('./routes/locationRoutes');
// const customerRoutes = require('./routes/customerRoutes');
// const categoryRoutes = require('./routes/categoryRoutes');
// const subCategoryRoutes = require('./routes/subCategoryRoutes');
// const productRoutes = require('./routes/productRoutes');
// const inventoryRoutes = require('./routes/inventoryRoutes');
// const invoiceRoutes = require('./routes/invoiceRoutes');
// const salesPersonRoutes = require('./routes/salesPersonRoutes');
// const dispatchRoutes = require('./routes/dispatchRoutes');
// const statsRoutes = require('./routes/statsRoutes');
// const transactionRoutes = require('./routes/transactionRoutes');
// const userRoutes = require('./routes/userRoutes');
// const stockOutwardRoutes = require('./routes/stockOutwardRoutes');
// const storeInwardRoutes = require('./routes/storeInwardRoutes');
// const storeCustomerRoutes = require('./routes/storeCustomerRoutes');
// const packagingRoutes = require('./routes/packagingRoutes');
// const rawMaterialRoutes = require('./routes/rawMaterialRoutes');
// // const itemRoutes = require('./routes/itemRoutes');
// const serviceRoutes = require('./routes/serviceRoutes');



// app.use('/api/stock-outward', stockOutwardRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/warehouses', warehouseRoutes);
// app.use('/api/brands', brandRoutes);
// app.use('/api/locations', locationRoutes);
// app.use('/api/customers', customerRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/subcategories', subCategoryRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/inventory', inventoryRoutes);
// app.use('/api/invoices', invoiceRoutes);
// app.use('/api/salesPersons', salesPersonRoutes);
// app.use('/api/dispatch', dispatchRoutes);
// app.use('/api', statsRoutes);
// app.use('/api/transactions', transactionRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/store-inward', storeInwardRoutes);
// app.use('/api/storecustomers', storeCustomerRoutes);  
// app.use('/api/packaging', packagingRoutes);
// app.use('/api/raw-materials', rawMaterialRoutes);
// // app.use('/api/items', itemRoutes);
// app.use('/api', serviceRoutes);


// // Error Handling Middleware
// app.use((err, req, res, next) => {
//   console.error('❌ Error:', err.stack);
//   res.status(500).json({ error: 'Something went wrong on the server.' });
// });

// // MongoDB Connection
// const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory';
// mongoose.connect(mongoURI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
// .then(() => {
//   console.log('✅ Connected to MongoDB');

//   // Start Server after DB connects
//   const PORT = process.env.PORT || 5000;
//   app.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`);
//   });
// })
// .catch(err => {
//   console.error('❌ MongoDB connection failed:', err.message);
// });










const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.log('DNS setServers error:', e.message);
}

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir)); // ✅ serve image files

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options(/.*/, cors());

app.use(express.json()); // Replaces deprecated bodyParser.json()
app.use('/uploads', express.static(uploadDir)); // Serve uploaded images

const authRoutes = require('./routes/authRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const brandRoutes = require('./routes/brandRoutes');
const locationRoutes = require('./routes/locationRoutes');
const customerRoutes = require('./routes/customerRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const subCategoryRoutes = require('./routes/subCategoryRoutes');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const salesPersonRoutes = require('./routes/salesPersonRoutes');
const dispatchRoutes = require('./routes/dispatchRoutes');
const statsRoutes = require('./routes/statsRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const userRoutes = require('./routes/userRoutes');
const stockOutwardRoutes = require('./routes/stockOutwardRoutes');
const storesOutwardRoutes = require('./routes/storesOutwardRoutes');
const storeInwardRoutes = require('./routes/storeInwardRoutes');
const storeCustomerRoutes = require('./routes/storeCustomerRoutes');
const packagingRoutes = require('./routes/packagingRoutes');
const rawMaterialRoutes = require('./routes/rawMaterialRoutes');
// const itemRoutes = require('./routes/itemRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const serviceRmaRoutes = require('./routes/serviceRmaRoutes');

const selfTransferRoutes = require('./routes/selfTransferRoutes');
const accessoryRoutes = require('./routes/accessoryRoutes');
const warrantyRoutes = require('./routes/warrantyRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const cartonBoxRoutes = require('./routes/cartonBoxRoutes');

app.use('/api/carton-box', cartonBoxRoutes);
app.use('/api/stock-outward', stockOutwardRoutes);
app.use('/api/stores-outward', storesOutwardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subCategoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/salesPersons', salesPersonRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api', statsRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/store-inward', storeInwardRoutes);
app.use('/api/storecustomers', storeCustomerRoutes);
app.use('/api/packaging', packagingRoutes);
app.use('/api/raw-materials', rawMaterialRoutes);
// app.use('/api/items', itemRoutes);
app.use('/api', serviceRoutes);
app.use('/api', serviceRmaRoutes);

app.use('/api/self-transfer', selfTransferRoutes);
app.use('/api/accessories', accessoryRoutes);
app.use('/api/warranty', warrantyRoutes);
app.use('/api/spare-parts', require('./routes/sparePartRoutes'));

// Root & Health check routes
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Coloron Inventory API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Coloron Inventory API root endpoint',
    version: '1.0.0'
  });
});

// Roles API
app.get('/api/auth/roles', (req, res) => {
  res.json(['Admin', 'Sales', 'Store', 'Warehouse', 'Manager']);
});

app.get('/api/roles', (req, res) => {
  res.json(['Admin', 'Sales', 'Store', 'Warehouse', 'Manager']);
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// MongoDB Connection
// Updated storeInward routes with receive-dispatch
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://pradeepkm:Prdharini123@cluster0.vxhik.mongodb.net/inventory';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('✅ Connected to MongoDB');

    // Start Server after DB connects
    const PORT = process.env.PORT || 5002;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      try {
        const { initSocket } = require('./socket');
        initSocket(server);
      } catch (e) {
        console.warn('Socket init warning:', e.message);
      }
      try {
        const { startDispatchScheduler } = require('./services/inventoryNotificationService');
        startDispatchScheduler();
      } catch (e) {
        console.warn('Dispatch scheduler start warning:', e.message);
      }
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
  });





