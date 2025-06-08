const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { 
  checkExpiringContracts, 
  renewContract, 
  getContractStatistics 
} = require('../services/contractService');

// Get contract statistics
router.get('/statistics', isAuthenticated, async (req, res) => {
  try {
    const stats = await getContractStatistics();
    
    if (!stats) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve contract statistics'
      });
    }
    
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Error getting contract statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Manually trigger contract expiry check
router.post('/check-expiring', isAuthenticated, async (req, res) => {
  try {
    await checkExpiringContracts();
    
    res.json({
      success: true,
      message: 'Contract expiry check completed'
    });
  } catch (error) {
    console.error('Error checking expiring contracts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check expiring contracts'
    });
  }
});

// Renew a contract
router.post('/renew/:tenantId', isAuthenticated, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { duration_months = 6 } = req.body;
    
    const result = await renewContract(tenantId, duration_months);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        newStartDate: result.newStartDate,
        newEndDate: result.newEndDate
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error renewing contract:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 