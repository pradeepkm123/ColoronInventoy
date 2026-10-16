const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');

router.get('/me', ctrl.getMe);                 // GET  /api/users/me
router.post('/signup', ctrl.signup);           // POST /api/users/signup
router.get('/roles', ctrl.getRolesForEmail);   // GET  /api/users/roles
router.post('/login', ctrl.login);             // POST /api/users/login
router.put('/:id', ctrl.updateUser);           // PUT  /api/users/:id  (edit account)
router.post('/:id/request-edit-permission', ctrl.requestEditPermission); // POST request permission to edit
router.post('/:id/grant-edit-permission', ctrl.grantEditPermission);     // POST Super Admin grants edit access
router.post('/:id/reject-edit-permission', ctrl.rejectEditPermission);   // POST Super Admin rejects edit request
router.get('/:id/edit-permission-status', ctrl.getEditPermissionStatus); // GET check permission status
router.get('/', ctrl.getAllUsers);             // GET  /api/users      (list all users)

module.exports = router;
