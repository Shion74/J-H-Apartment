const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const {
  getAllSettings,
  getBillingRates,
  updateSetting,
  updateElectricityRate,
  updateWaterAmount,
  updateBillingRates
} = require('../controllers/settingController');

// Get all settings
router.get('/', isAuthenticated, getAllSettings);

// Get billing rates
router.get('/billing-rates', isAuthenticated, getBillingRates);

// Update all billing rates at once (must come before the generic /:key route)
router.put('/billing-rates', isAuthenticated, updateBillingRates);

// Update electricity rate
router.put('/rates/electricity', isAuthenticated, updateElectricityRate);

// Update water amount
router.put('/rates/water', isAuthenticated, updateWaterAmount);

// Update specific setting (this must come last because it's the most generic)
router.put('/:key', isAuthenticated, updateSetting);

module.exports = router; 