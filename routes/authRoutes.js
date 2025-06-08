const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Protected routes
router.get('/me', isAuthenticated, authController.getCurrentUser);
router.post('/users', isAuthenticated, isAdmin, authController.createUser);
router.get('/users', isAuthenticated, isAdmin, authController.getAllUsers);

module.exports = router; 