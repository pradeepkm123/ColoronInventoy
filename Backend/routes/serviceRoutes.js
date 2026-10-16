const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const controller = require('../controllers/serviceController');

// Multer setup
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (_, file, cb) =>
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_')),
});
const upload = multer({ storage });

// Routes
router.get('/services', controller.getAllServices);
router.get('/services/:id', controller.getServiceById);
router.post('/services', upload.single('productImage'), controller.createService);
router.put('/services/:id', upload.single('productImage'), controller.updateService);
router.delete('/services/:id', controller.deleteService);
router.get('/services', controller.getAllServices);


module.exports = router;
