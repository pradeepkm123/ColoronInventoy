// // const express = require("express");
// // const router = express.Router();
// // const {
// //   createStockOutward,
// //   createBulkStockOutward,
// //   getStockOutwardByStore,
// //   getOutwardSummary
// // } = require("../controllers/stockOutwardController");

// // // POST /api/stock-outward - Single outward entry
// // router.post("/", createStockOutward);

// // // POST /api/stock-outward/bulk - Multiple outward entries
// // router.post("/bulk", createBulkStockOutward);

// // // GET /api/stock-outward - Get outward records with filters
// // router.get("/", getStockOutwardByStore);

// // // GET /api/stock-outward/summary - Get outward summary for dashboard
// // router.get("/summary", getOutwardSummary);

// // module.exports = router;


// // const express = require("express");
// // const router = express.Router();
// // const {
// //   createStockOutward,
// //   createBulkStockOutward,
// //   getStockOutwardByStore,
// //   getOutwardSummary
// // } = require("../controllers/stockOutwardController");

// // // POST /api/stock-outward - Single outward entry
// // router.post("/", createStockOutward);

// // // POST /api/stock-outward/bulk - Multiple outward entries
// // router.post("/bulk", createBulkStockOutward);

// // // GET /api/stock-outward - Get outward records with filters
// // router.get("/", getStockOutwardByStore);

// // // GET /api/stock-outward/summary - Get outward summary for dashboard
// // router.get("/summary", getOutwardSummary);

// // module.exports = router;



// // routes/stockOutwardRoutes.js
// const express = require('express');
// const router = express.Router();
// const { createStockOutward, getStockOutwards } = require('../controllers/stockOutwardController');

// // POST new outward
// router.post('/', createStockOutward);

// // GET all outward records
// router.get('/', getStockOutwards);

// module.exports = router;



const express = require('express');
const router = express.Router();
const {
  createStockOutward,
  getStockOutwards,
  updateStockOutward,
  deleteStockOutward,
} = require('../controllers/stockOutwardController');

// POST new outward
router.post('/', createStockOutward);
// GET all outward records
router.get('/', getStockOutwards);
// PATCH update outward
router.patch('/:id', updateStockOutward);
// DELETE outward
router.delete('/:id', deleteStockOutward);

module.exports = router;
