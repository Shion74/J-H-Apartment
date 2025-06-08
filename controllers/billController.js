const Bill = require('../models/bill');
const Tenant = require('../models/tenant');
const Room = require('../models/room');
const Setting = require('../models/setting');
const { pool } = require('../config/database');

// Get all bills
const getAllBills = async (req, res) => {
  try {
    const bills = await Bill.findAll();
    return res.json({
      success: true,
      bills
    });
  } catch (error) {
    console.error('Get all bills error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get active bills (unpaid/partial)
const getActiveBills = async (req, res) => {
  try {
    const bills = await Bill.findActive();
    return res.json({
      success: true,
      bills
    });
  } catch (error) {
    console.error('Get active bills error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get paid bills (archived)
const getPaidBills = async (req, res) => {
  try {
    const bills = await Bill.findPaid();
    return res.json({
      success: true,
      bills
    });
  } catch (error) {
    console.error('Get paid bills error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get unpaid bills
const getUnpaidBills = async (req, res) => {
  try {
    const bills = await Bill.findUnpaid();
    return res.json({
      success: true,
      bills
    });
  } catch (error) {
    console.error('Get unpaid bills error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get bills by tenant ID
const getBillsByTenantId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if tenant exists
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tenant not found' 
      });
    }
    
    const bills = await Bill.findByTenantId(id);
    
    return res.json({
      success: true,
      bills,
      tenant
    });
  } catch (error) {
    console.error('Get bills by tenant ID error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get bill by ID
const getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findById(id);
    
    if (!bill) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bill not found' 
      });
    }
    
    return res.json({
      success: true,
      bill
    });
  } catch (error) {
    console.error('Get bill by ID error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Create a new bill
const createBill = async (req, res) => {
  try {
    const { 
      tenant_id, 
      room_id, 
      bill_date,
      rent_from,
      rent_to,
      rent_amount,
      electric_present_reading = 0,
      electric_previous_reading = 0,
      electric_consumption = 0,
      electric_amount = 0,
      electric_reading_date,
      electric_previous_date,
      extra_fee_amount = 0,
      extra_fee_description = null,
      total_amount,
      status = 'unpaid',
      notes,
      prepared_by
    } = req.body;
    
    if (!tenant_id || !room_id || !bill_date || !rent_from || !rent_to || !rent_amount || !total_amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tenant ID, room ID, bill date, rent period, rent amount, and total amount are required' 
      });
    }
    
    // Check if tenant exists
    const tenant = await Tenant.findById(tenant_id);
    if (!tenant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tenant not found' 
      });
    }
    
    // Check if room exists
    const room = await Room.findById(room_id);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    // Check for existing bill for the same tenant and period
    try {
      const { pool } = require('../config/database');
      const [existingBills] = await pool.execute(
        'SELECT id FROM bills WHERE tenant_id = ? AND rent_from = ? AND rent_to = ?',
        [tenant_id, rent_from, rent_to]
      );
      
      if (existingBills.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `A bill already exists for this tenant for the period ${rent_from} to ${rent_to}` 
        });
      }
    } catch (duplicateCheckError) {
      console.error('Duplicate check error:', duplicateCheckError);
      // Continue with creation - the database constraint will catch duplicates
    }
    
    // Get current rates
    const rates = await Setting.getBillingRates();
    
    // Create new comprehensive bill
    const newBill = await Bill.create({
      tenant_id,
      room_id,
      bill_date,
      rent_from,
      rent_to,
      rent_amount: parseFloat(rent_amount),
      electric_present_reading: parseFloat(electric_present_reading),
      electric_previous_reading: parseFloat(electric_previous_reading),
      electric_consumption: parseFloat(electric_consumption),
      electric_rate_per_kwh: rates.electric_rate_per_kwh,
      electric_amount: parseFloat(electric_amount),
      electric_reading_date: electric_reading_date || null,
      electric_previous_date: electric_previous_date || null,
      water_amount: rates.water_fixed_amount,
      extra_fee_amount: parseFloat(extra_fee_amount),
      extra_fee_description: extra_fee_description || null,
      total_amount: parseFloat(total_amount),
      status,
      notes: notes || null,
      prepared_by: prepared_by || 'System'
    });
    
    // Send email in background (non-blocking)
    setImmediate(async () => {
    try {
        if (tenant.email) {
      const completeBill = await Bill.findById(newBill.id);
          if (completeBill) {
        const { sendBillToTenant } = require('../services/emailService');
            const emailResult = await sendBillToTenant(completeBill, tenant.email);
            console.log(`📧 Background email to ${tenant.email}: ${emailResult.success ? 'Success' : 'Failed - ' + emailResult.error}`);
          }
      }
    } catch (emailError) {
        console.error('Background email send error:', emailError);
    }
    });
    
    return res.status(201).json({
      success: true,
      bill: newBill,
      emailSent: false, // Don't wait for email
      emailMessage: tenant.email 
        ? 'Bill created successfully! Email will be sent in background.' 
        : 'Bill created successfully! No email address provided.'
    });
  } catch (error) {
    console.error('Create bill error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Update bill
const updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      bill_date,
      rent_from,
      rent_to,
      rent_amount,
      electric_present_reading,
      electric_previous_reading,
      electric_consumption,
      electric_amount,
      electric_reading_date,
      electric_previous_date,
      total_amount,
      status,
      notes,
      prepared_by
    } = req.body;
    
    // Check if bill exists
    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bill not found' 
      });
    }
    
    // Get current rates
    const rates = await Setting.getBillingRates();
    
    // Update bill with new comprehensive structure
    const updatedBill = await Bill.update(id, {
      bill_date: bill_date || bill.bill_date,
      rent_from: rent_from || bill.rent_from,
      rent_to: rent_to || bill.rent_to,
      rent_amount: rent_amount !== undefined ? parseFloat(rent_amount) : bill.rent_amount,
      electric_present_reading: electric_present_reading !== undefined ? parseFloat(electric_present_reading) : bill.electric_present_reading,
      electric_previous_reading: electric_previous_reading !== undefined ? parseFloat(electric_previous_reading) : bill.electric_previous_reading,
      electric_consumption: electric_consumption !== undefined ? parseFloat(electric_consumption) : bill.electric_consumption,
      electric_rate_per_kwh: bill.electric_rate_per_kwh || rates.electric_rate_per_kwh,
      electric_amount: electric_amount !== undefined ? parseFloat(electric_amount) : bill.electric_amount,
      electric_reading_date: electric_reading_date !== undefined ? electric_reading_date : bill.electric_reading_date,
      electric_previous_date: electric_previous_date !== undefined ? electric_previous_date : bill.electric_previous_date,
      water_amount: bill.water_amount || rates.water_fixed_amount,
      total_amount: total_amount !== undefined ? parseFloat(total_amount) : bill.total_amount,
      status: status || bill.status,
      notes: notes !== undefined ? notes : bill.notes,
      prepared_by: prepared_by || bill.prepared_by
    });
    
    return res.json({
      success: true,
      bill: updatedBill
    });
  } catch (error) {
    console.error('Update bill error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Delete bill
const deleteBill = async (req, res) => {
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
    
    // Delete bill
    await Bill.delete(id);
    
    return res.json({
      success: true,
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    console.error('Delete bill error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Generate monthly bills
const generateMonthlyBills = async (req, res) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ 
        success: false, 
        message: 'Month and year are required' 
      });
    }
    
    const bills = await Bill.generateMonthlyBills(parseInt(month), parseInt(year));
    
    return res.status(201).json({
      success: true,
      message: `Generated ${bills.length} bills for ${month}/${year}`,
      bills
    });
  } catch (error) {
    console.error('Generate monthly bills error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get bill stats
const getBillStats = async (req, res) => {
  try {
    const stats = await Bill.getStats();
    return res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get bill stats error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// AUTOMATIC BILLING FUNCTIONS - DISABLED
// Note: These functions have been disabled as automatic billing is no longer used.

/*
// Process automatic billing cycles - DISABLED
const processAutomaticCycles = async (req, res) => {
  return res.status(410).json({ 
      success: false, 
    message: 'Automatic billing cycles have been disabled. Please create bills manually through the billing page.' 
    });
};

// Get bills needing next cycle - DISABLED  
const getBillsNeedingCycle = async (req, res) => {
  return res.status(410).json({ 
      success: false, 
    message: 'Automatic billing cycles have been disabled. Please create bills manually through the billing page.' 
    });
};
*/

// Get bills needing electricity reading update
const getBillsNeedingElectricUpdate = async (req, res) => {
  try {
    const bills = await Bill.getBillsNeedingElectricUpdate();
    
    return res.json({
      success: true,
      bills: bills,
      count: bills.length,
      message: bills.length > 0 ? `${bills.length} bills need electricity reading updates` : 'No bills need updates'
    });
  } catch (error) {
    console.error('Get bills needing electric update error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Update electricity reading for a bill
const updateElectricReading = async (req, res) => {
  try {
    const { id } = req.params;
    const { present_reading, reading_date } = req.body;
    
    if (!present_reading || !reading_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Present reading and reading date are required' 
      });
    }
    
    const result = await Bill.updateElectricReading(id, present_reading, reading_date);
    
    // Get updated bill details
    const bill = await Bill.findById(id);
    
    // Automatically send email if tenant has email
    let emailResult = null;
    if (bill && bill.tenant_email) {
      try {
        const { sendBillToTenant } = require('../services/emailService');
        emailResult = await sendBillToTenant(bill, bill.tenant_email);
        
        if (emailResult.success) {
          // Mark bill as sent and update status to unpaid
          await Bill.markAsReadyToSend(id);
        }
      } catch (emailError) {
        console.error('Auto email send error:', emailError);
      }
    }
    
    return res.json({
      success: true,
      result,
      emailSent: emailResult?.success || false,
      message: emailResult?.success 
        ? 'Electricity reading updated and bill sent via email successfully' 
        : 'Electricity reading updated successfully'
    });
  } catch (error) {
    console.error('Update electric reading error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Send bill via email
const sendBillEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipient_email, custom_message } = req.body;
    
    // Get bill details
    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bill not found' 
      });
    }

    // Send email in background (non-blocking)
    setImmediate(async () => {
      try {
    const { sendBillToTenant } = require('../services/emailService');
    const emailResult = await sendBillToTenant(bill, recipient_email, custom_message);
    
    if (emailResult.success) {
      // Mark bill as sent
      await Bill.markAsReadyToSend(id);
          console.log(`📧 Manual email to ${recipient_email}: Success`);
        } else {
          console.error(`📧 Manual email to ${recipient_email}: Failed - ${emailResult.error}`);
        }
      } catch (emailError) {
        console.error('Background manual email error:', emailError);
      }
    });
    
    // Return immediately
      return res.json({
        success: true,
      message: 'Email is being sent in background! Check server logs for status.',
      emailSent: true
    });
  } catch (error) {
    console.error('Send bill email error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get all rooms with their billing status - simplified manual billing
const getPendingRooms = async (req, res) => {
  try {
    const [rooms] = await pool.execute(`
      SELECT 
        r.id as room_id,
        r.room_number,
        r.monthly_rent,
        r.status,
        t.id as tenant_id,
        t.name as tenant_name,
        t.rent_start,
        -- Get the last reading (either from last bill or tenant's initial reading)
        COALESCE(
          (SELECT electric_present_reading 
           FROM bills 
           WHERE tenant_id = t.id 
           AND status = 'paid'
           ORDER BY bill_date DESC 
           LIMIT 1), 
          t.initial_electric_reading
        ) as previous_reading,
        -- Get the date of last reading (for first bill, use move-in date)
        COALESCE(
          (SELECT electric_reading_date 
           FROM bills 
           WHERE tenant_id = t.id 
           AND status = 'paid'
           ORDER BY bill_date DESC 
           LIMIT 1), 
          t.rent_start
        ) as previous_reading_date,
        -- Calculate next billing period start (day after last paid bill ended)
        CASE 
          WHEN EXISTS (SELECT 1 FROM bills WHERE tenant_id = t.id AND status = 'paid')
          THEN 
            -- Start day after the last paid bill ended
            DATE_ADD(
              (SELECT rent_to 
               FROM bills 
               WHERE tenant_id = t.id 
               AND status = 'paid'
               ORDER BY bill_date DESC 
               LIMIT 1), 
              INTERVAL 1 DAY
            )
          ELSE t.rent_start
        END as next_period_start,
        -- Calculate next billing period end (maintains same day-of-month pattern)
        CASE 
          WHEN EXISTS (SELECT 1 FROM bills WHERE tenant_id = t.id AND status = 'paid')
          THEN 
            -- End one month from next period start, minus 1 day
            DATE_SUB(
              DATE_ADD(
                DATE_ADD(
                  (SELECT rent_to 
                   FROM bills 
                   WHERE tenant_id = t.id 
                   AND status = 'paid'
                   ORDER BY bill_date DESC 
                   LIMIT 1), 
                  INTERVAL 1 DAY
                ),
                INTERVAL 1 MONTH
              ),
              INTERVAL 1 DAY
            )
          ELSE 
            -- For first bill: one month from move-in minus 1 day
            DATE_SUB(
              DATE_ADD(t.rent_start, INTERVAL 1 MONTH), 
              INTERVAL 1 DAY
            )
        END as next_period_end,
        -- Check billing status properly
        CASE 
          WHEN t.id IS NULL THEN 'no_tenant'
          WHEN EXISTS (
            SELECT 1 FROM bills 
            WHERE tenant_id = t.id 
            AND status IN ('unpaid', 'partial')
          ) THEN 'already_billed'
          ELSE 'needs_billing'
        END as billing_status
      FROM rooms r
      LEFT JOIN tenants t ON r.id = t.room_id
      ORDER BY r.room_number
    `);
    
    return res.json({
      success: true,
      rooms: rooms
    });
  } catch (error) {
    console.error('Get pending rooms error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Test email configuration
const testEmailConfig = async (req, res) => {
  try {
    const { testEmailConfig } = require('../services/emailService');
    const result = await testEmailConfig();
    
    return res.json({
      success: result.success,
      message: result.success ? 'Email configuration is working!' : 'Email configuration failed',
      error: result.error || null
    });
  } catch (error) {
    console.error('Test email config error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

module.exports = {
  getAllBills,
  getActiveBills,
  getPaidBills,
  getUnpaidBills,
  getBillsByTenantId,
  getBillById,
  createBill,
  updateBill,
  deleteBill,
  getBillStats,
  sendBillEmail,
  getPendingRooms,
  testEmailConfig
}; 