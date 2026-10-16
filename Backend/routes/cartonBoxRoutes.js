const express = require('express');
const router = express.Router();
const cartonBoxController = require('../controllers/cartonBoxController');

router.get('/models', cartonBoxController.getModels);
router.get('/available-serials', cartonBoxController.getAvailableSerials);
router.get('/list', cartonBoxController.getCartonBoxes);
router.post('/create', cartonBoxController.createCartonBox);
router.delete('/:id', cartonBoxController.deleteCartonBox);

module.exports = router;
