const cron = require('node-cron');
const Bill = require('../models/bill');

// Schedule automatic billing cycle processing - DISABLED
// Note: Automatic billing has been disabled. All bills must be created manually.
const scheduleBillingCycles = () => {
  console.log('🕐 Billing system scheduler - AUTOMATIC BILLING DISABLED');
  console.log('   📝 All bills will be created manually by admin');
  console.log('   📋 Use the billing page to create bills when needed');
  
  // Automatic billing cycles are disabled
  // All bills must be created manually through the billing page
};

// Manual function to trigger billing cycles (for testing/admin use)
const triggerManualBillingCycles = async () => {
  console.log('🔄 Manually triggering billing cycle processing...');
  
  try {
    const results = await Bill.processAutomaticCycles();
    return results;
  } catch (error) {
    console.error('Error in manual billing cycle processing:', error);
    throw error;
  }
};

// Manual function to check bills needing electric updates
const checkElectricUpdatesNeeded = async () => {
  console.log('⚡ Checking bills needing electricity updates...');
  
  try {
    const bills = await Bill.getBillsNeedingElectricUpdate();
    return bills;
  } catch (error) {
    console.error('Error checking electric updates needed:', error);
    throw error;
  }
};

module.exports = {
  scheduleBillingCycles,
  triggerManualBillingCycles,
  checkElectricUpdatesNeeded
}; 