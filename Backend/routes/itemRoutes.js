// // const express = require('express');
// // const router = express.Router();
// // const { requireAuth } = require('../middlewares/auth');
// // const itemController = require('../controllers/itemController');

// // // ✅ Middleware (protect all routes)
// // router.use(requireAuth);

// // // ✅ CRUD routes
// // router.get('/', itemController.getAllItems);
// // router.post('/', itemController.addItem);
// // router.put('/:id', itemController.updateItem);
// // router.delete('/:id', itemController.deleteItem);

// // module.exports = router;









// const express = require('express');
// const router = express.Router();
// const itemController = require('../controllers/itemController');
// const { requireAuth } = require('../middlewares/requireAuth');

// // 🔐 Protect all item routes
// router.use(requireAuth());

// router.get('/', itemController.getAllItems);
// router.post('/', itemController.addItem);
// router.put('/:id', itemController.updateItem);
// router.delete('/:id', itemController.deleteItem);

// module.exports = router;
