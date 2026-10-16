// routes/authRoutes.js
const express = require('express');
const { signUp, login, getRoles, getMe } = require('../controllers/authController');
const router = express.Router();

router.post('/signup', signUp);
router.post('/login', login);
router.get('/roles', getRoles);
router.get('/me', getMe);

module.exports = router;
