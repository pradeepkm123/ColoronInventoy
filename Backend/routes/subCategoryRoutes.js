const express = require('express');
const router = express.Router();
const subCategoryController = require('../controllers/subCategoryController');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.get('/', subCategoryController.getAllSubCategories);
router.post('/', upload.single('image'), subCategoryController.createSubCategory);
router.put('/:id', upload.single('image'), subCategoryController.updateSubCategory);
router.delete('/:id', subCategoryController.deleteSubCategory);

module.exports = router;
