const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/dispatchController');

router.post('/', dispatchController.createDispatch);
router.post('/bulk-import', dispatchController.bulkImportDispatches);
router.post('/import/validate', dispatchController.validateExcelDispatch);
router.post('/import/confirm', dispatchController.confirmExcelDispatch);
router.get('/', dispatchController.getDispatches);
router.get('/:id', dispatchController.getDispatchById);
router.put('/:id', dispatchController.updateDispatch);
router.delete('/:id', dispatchController.deleteDispatch);

module.exports = router;
