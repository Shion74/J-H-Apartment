const express = require('express');
const router = express.Router();
const depositController = require('../controllers/depositController');
const { isAuthenticated } = require('../middleware/auth');

// All deposit routes require authentication
router.use(isAuthenticated);

// Get tenant deposit balance
router.get('/tenant/:tenantId/balance', depositController.getTenantDepositBalance);

// Get tenant deposit transaction history
router.get('/tenant/:tenantId/history', depositController.getTenantDepositHistory);

// Update deposit payment status (mark as paid/unpaid)
router.put('/tenant/:tenantId/status', depositController.updateDepositStatus);

// Use deposit for bill payment
router.post('/tenant/:tenantId/use/:billId', depositController.useDepositForBill);

// Process refund when tenant moves out
router.post('/tenant/:tenantId/refund', depositController.processRefund);

module.exports = router; 