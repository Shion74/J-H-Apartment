const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const { isAuthenticated } = require('../middleware/auth');

// All routes require authentication
router.use(isAuthenticated);

// Get all bills
router.get('/', billController.getAllBills);

// Get bills stats
router.get('/stats', billController.getBillStats);

// Get unpaid bills
router.get('/unpaid', billController.getUnpaidBills);

// Get active bills (unpaid/partial)
router.get('/active', billController.getActiveBills);

// Get paid bills (archived)
router.get('/paid', billController.getPaidBills);

// Get rooms needing billing (pending bills)
router.get('/pending-rooms', billController.getPendingRooms);

// Get bills by tenant ID
router.get('/tenant/:id', billController.getBillsByTenantId);

// Send bill via email
router.post('/:id/send-email', billController.sendBillEmail);

// Test email configuration
router.get('/test-email', billController.testEmailConfig);

// Get bill by ID
router.get('/:id', billController.getBillById);

// Create new bill
router.post('/', billController.createBill);

// Update bill
router.put('/:id', billController.updateBill);

// Delete bill
router.delete('/:id', billController.deleteBill);

module.exports = router; 