const DepositTransaction = require('../models/depositTransaction');
const Tenant = require('../models/tenant');
const Bill = require('../models/bill');
const Payment = require('../models/payment');

// Get tenant deposit balance
const getTenantDepositBalance = async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const balance = await DepositTransaction.getTenantDepositBalance(tenantId);
    
    return res.json({
      success: true,
      balance
    });
  } catch (error) {
    console.error('Get deposit balance error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get tenant deposit transaction history
const getTenantDepositHistory = async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const transactions = await DepositTransaction.getTenantTransactionHistory(tenantId);
    
    return res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Get deposit history error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Update deposit payment status (mark as paid/unpaid)
const updateDepositStatus = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { transaction_type, status } = req.body;
    
    if (!['advance_payment', 'security_deposit'].includes(transaction_type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid transaction type' 
      });
    }
    
    if (!['paid', 'unpaid'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }
    
    const updated = await DepositTransaction.updateDepositStatus(tenantId, transaction_type, status);
    
    if (!updated) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tenant not found' 
      });
    }
    
    return res.json({
      success: true,
      message: `${transaction_type.replace('_', ' ')} status updated to ${status}`
    });
  } catch (error) {
    console.error('Update deposit status error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Use deposit for bill payment
const useDepositForBill = async (req, res) => {
  try {
    const { tenantId, billId } = req.params;
    const { transaction_type, amount, used_for, description } = req.body;
    
    // Validate inputs
    if (!['advance_payment', 'security_deposit'].includes(transaction_type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid transaction type' 
      });
    }
    
    if (!['rent', 'extra_fees', 'electricity', 'water', 'electric_water', 'full_bill'].includes(used_for)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid usage type' 
      });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid amount' 
      });
    }
    
    // Check if tenant has sufficient deposit balance
    const balance = await DepositTransaction.getTenantDepositBalance(tenantId);
    const availableAmount = transaction_type === 'advance_payment' ? 
      balance.advance_payment.available : balance.security_deposit.available;
    
    if (amount > availableAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient ${transaction_type.replace('_', ' ')} balance. Available: ₱${availableAmount.toFixed(2)}` 
      });
    }
    
    // Check if deposit is paid
    const depositStatus = transaction_type === 'advance_payment' ? 
      balance.advance_payment.status : balance.security_deposit.status;
    
    if (depositStatus !== 'paid') {
      return res.status(400).json({ 
        success: false, 
        message: `${transaction_type.replace('_', ' ')} must be marked as paid before using` 
      });
    }
    
    // Verify bill exists and belongs to tenant
    const bill = await Bill.findById(billId);
    if (!bill || bill.tenant_id != tenantId) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bill not found or does not belong to tenant' 
      });
    }
    
    // Record deposit usage transaction
    const transaction = await DepositTransaction.useDepositForBill(
      tenantId, billId, transaction_type, amount, used_for, 
      description || `Used ${transaction_type.replace('_', ' ')} for ${used_for}`,
      'Admin'
    );
    
    // Create payment record
    await Payment.create({
      bill_id: billId,
      amount: amount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: transaction_type,
      notes: `${transaction_type.replace('_', ' ')} used for ${used_for} - ${description || ''}`
    });
    
    return res.json({
      success: true,
      transaction,
      message: `₱${amount.toFixed(2)} ${transaction_type.replace('_', ' ')} applied to bill for ${used_for}`
    });
  } catch (error) {
    console.error('Use deposit for bill error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Process refund when tenant moves out
const processRefund = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { transaction_type, amount, description } = req.body;
    
    if (!['advance_payment', 'security_deposit'].includes(transaction_type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid transaction type' 
      });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid refund amount' 
      });
    }
    
    // Check available balance
    const balance = await DepositTransaction.getTenantDepositBalance(tenantId);
    const availableAmount = transaction_type === 'advance_payment' ? 
      balance.advance_payment.available : balance.security_deposit.available;
    
    if (amount > availableAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `Refund amount exceeds available balance. Available: ₱${availableAmount.toFixed(2)}` 
      });
    }
    
    // Record refund transaction
    const refund = await DepositTransaction.recordRefund(
      tenantId, transaction_type, amount, 
      description || `Refund upon tenant move-out`,
      'Admin'
    );
    
    return res.json({
      success: true,
      refund,
      message: `₱${amount.toFixed(2)} ${transaction_type.replace('_', ' ')} refund processed`
    });
  } catch (error) {
    console.error('Process refund error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

module.exports = {
  getTenantDepositBalance,
  getTenantDepositHistory,
  updateDepositStatus,
  useDepositForBill,
  processRefund
}; 