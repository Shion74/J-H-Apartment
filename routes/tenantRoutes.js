const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { isAuthenticated } = require('../middleware/auth');

// All routes are protected
router.use(isAuthenticated);

// Tenant routes
router.get('/', tenantController.getAllTenants);
router.get('/count', tenantController.getTenantCount);
router.get('/:id', tenantController.getTenantById);
router.post('/', tenantController.createTenant);
router.put('/:id', tenantController.updateTenant);
router.delete('/:id', tenantController.deleteTenant);

module.exports = router; 