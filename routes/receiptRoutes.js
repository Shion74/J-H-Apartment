const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { isAuthenticated } = require('../middleware/auth');
const Bill = require('../models/bill');
const Payment = require('../models/payment');

// All routes require authentication
router.use(isAuthenticated);

// Download receipt by bill ID
router.get('/download/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    
    // Verify bill exists and is paid
    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bill not found' 
      });
    }
    
    if (bill.status !== 'paid') {
      return res.status(400).json({ 
        success: false, 
        message: 'Receipt only available for fully paid bills' 
      });
    }
    
    // Look for existing receipt file
    const receiptsDir = path.join(__dirname, '../public/receipts');
    const files = await fs.readdir(receiptsDir);
    const receiptFile = files.find(file => file.startsWith(`receipt-${billId}-`));
    
    if (!receiptFile) {
      // Generate receipt if it doesn't exist
      const payments = await Payment.findByBillId(billId);
      const { saveReceiptToFile } = require('../services/receiptService');
      
      const receiptResult = await saveReceiptToFile(bill, payments);
      
      if (receiptResult.success) {
        const filePath = receiptResult.filepath;
        return res.download(filePath, `receipt-room-${bill.room_number}-${bill.id}.pdf`);
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to generate receipt'
        });
      }
    } else {
      // Serve existing receipt file
      const filePath = path.join(receiptsDir, receiptFile);
      return res.download(filePath, `receipt-room-${bill.room_number}-${bill.id}.pdf`);
    }
  } catch (error) {
    console.error('Download receipt error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Generate receipt manually (for admin use)
router.post('/generate/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    
    // Verify bill exists and is paid
    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bill not found' 
      });
    }
    
    if (bill.status !== 'paid') {
      return res.status(400).json({ 
        success: false, 
        message: 'Receipt only available for fully paid bills' 
      });
    }
    
    // Get payments for this bill
    const payments = await Payment.findByBillId(billId);
    
    // Generate receipt
    const { saveReceiptToFile } = require('../services/receiptService');
    const receiptResult = await saveReceiptToFile(bill, payments);
    
    if (receiptResult.success) {
      return res.json({
        success: true,
        message: 'Receipt generated successfully',
        downloadUrl: receiptResult.downloadUrl,
        filename: receiptResult.filename
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate receipt',
        error: receiptResult.error
      });
    }
  } catch (error) {
    console.error('Generate receipt error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router; 