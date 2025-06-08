const Payment = require('../models/payment');
const Bill = require('../models/bill');

// Get all payments
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll();
    return res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }
    
    return res.json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('Get payment by ID error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get payments by bill ID
const getPaymentsByBillId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if bill exists
    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bill not found' 
      });
    }
    
    const payments = await Payment.findByBillId(id);
    
    return res.json({
      success: true,
      payments,
      bill
    });
  } catch (error) {
    console.error('Get payments by bill ID error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get payments by tenant ID
const getPaymentsByTenantId = async (req, res) => {
  try {
    const { id } = req.params;
    const payments = await Payment.findByTenantId(id);
    
    return res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Get payments by tenant ID error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Create a new payment
const createPayment = async (req, res) => {
  try {
    const { bill_id, amount, payment_date, payment_method, notes } = req.body;
    
    if (!bill_id || !amount || !payment_date || !payment_method) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bill ID, amount, payment date, and payment method are required' 
      });
    }
    
    // Check if bill exists
    const bill = await Bill.findById(bill_id);
    if (!bill) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bill not found' 
      });
    }
    
    const paymentAmount = parseFloat(amount);
    const billAmount = parseFloat(bill.total_amount);
    
    // Calculate total paid amount including this payment
    const existingPayments = await Payment.findByBillId(bill_id);
    const totalPreviousPaid = existingPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const totalPaid = totalPreviousPaid + paymentAmount;
    
    // Create new payment
    const newPayment = await Payment.create({
      bill_id,
      amount: paymentAmount,
      payment_date,
      payment_method,
      notes
    });
    
    // Update bill status based on payment amount
    let newStatus;
    let receiptResult = null;
    
    if (totalPaid >= billAmount) {
      newStatus = 'paid';
      // Archive the bill when fully paid
      await Bill.updateStatus(bill_id, 'paid');
      
      // Generate and send receipt automatically
      try {
        // Get complete bill details with tenant info
        const completeBill = await Bill.findById(bill_id);
        const allPayments = await Payment.findByBillId(bill_id);
        
        if (completeBill && allPayments.length > 0) {
          // Generate receipt PDF and save to file system
          const { saveReceiptToFile } = require('../services/receiptService');
          const receiptFile = await saveReceiptToFile(completeBill, allPayments);
          
          if (receiptFile.success) {
            // Send receipt via email if tenant has email
            if (completeBill.tenant_name && bill.total_amount) {
              // Get tenant email from database
              const { pool } = require('../config/database');
              const [tenantRows] = await pool.execute(
                'SELECT email FROM tenants WHERE id = ?',
                [completeBill.tenant_id]
              );
              
              if (tenantRows.length > 0 && tenantRows[0].email) {
                const { sendReceiptToTenant } = require('../services/emailService');
                const { generateReceiptPDF } = require('../services/receiptService');
                
                // Generate PDF for email attachment
                const pdfBuffer = await generateReceiptPDF(completeBill, allPayments);
                const emailResult = await sendReceiptToTenant(
                  completeBill, 
                  allPayments, 
                  tenantRows[0].email, 
                  pdfBuffer
                );
                
                receiptResult = {
                  file: receiptFile,
                  email: emailResult
                };
              } else {
                receiptResult = {
                  file: receiptFile,
                  email: { success: false, message: 'Tenant has no email address' }
                };
              }
            }
          }
        }
      } catch (error) {
        console.error('Receipt generation/sending error:', error);
        receiptResult = {
          error: error.message
        };
      }
    } else {
      newStatus = 'partial';
      await Bill.updateStatus(bill_id, 'partial');
    }
    
    return res.status(201).json({
      success: true,
      payment: newPayment,
      bill_status: newStatus,
      total_paid: totalPaid,
      receipt: receiptResult,
      message: newStatus === 'paid' 
        ? (receiptResult?.email?.success 
            ? 'Bill fully paid! Receipt generated and sent via email.' 
            : 'Bill fully paid! Receipt generated and available for download.')
        : 'Partial payment recorded'
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Update payment
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_date, payment_method, notes } = req.body;
    
    // Check if payment exists
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }
    
    // Update payment
    const updatedPayment = await Payment.update(id, {
      amount: amount ? parseFloat(amount) : payment.amount,
      payment_date: payment_date || payment.payment_date,
      payment_method: payment_method || payment.payment_method,
      notes: notes !== undefined ? notes : payment.notes
    });
    
    return res.json({
      success: true,
      payment: updatedPayment
    });
  } catch (error) {
    console.error('Update payment error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Delete payment
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if payment exists
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }
    
    // Delete payment
    await Payment.delete(id);
    
    return res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get payment stats
const getPaymentStats = async (req, res) => {
  try {
    const stats = await Payment.getStats();
    return res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  getPaymentsByBillId,
  getPaymentsByTenantId,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentStats
}; 