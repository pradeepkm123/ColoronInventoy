const express = require('express');
const router = express.Router();
const selfTransferController = require('../controllers/selfTransferController');

router.post('/', selfTransferController.createSelfTransfer);
router.get('/', selfTransferController.getAllSelfTransfers);
router.put('/:id', selfTransferController.updateSelfTransfer);
router.delete('/:id', selfTransferController.deleteSelfTransfer);
router.post('/:id/receive', selfTransferController.receiveSelfTransfer);

module.exports = router;
