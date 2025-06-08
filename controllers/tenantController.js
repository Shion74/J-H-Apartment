const Tenant = require('../models/tenant');
const Room = require('../models/room');
const Bill = require('../models/bill');
const Setting = require('../models/setting');
const { sendWelcomeEmail, sendDepositReceiptEmail } = require('../services/emailService');
const { saveDepositReceiptToFile } = require('../services/depositReceiptService');

// Get all tenants
const getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.findAll();
    return res.json({
      success: true,
      tenants
    });
  } catch (error) {
    console.error('Get all tenants error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get tenant by ID
const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await Tenant.findById(id);
    
    if (!tenant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tenant not found' 
      });
    }
    
    return res.json({
      success: true,
      tenant
    });
  } catch (error) {
    console.error('Get tenant by ID error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Generate initial bill for new tenant
const generateInitialBill = async (tenantId, roomId, rentStartDate, initialElectricReading) => {
  try {
    // Get room details
    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Get current billing rates
    const rates = await Setting.getBillingRates();

    // Calculate billing period - full month from rent start date
    const rentStart = new Date(rentStartDate);
    const rentTo = new Date(rentStart);
    rentTo.setMonth(rentTo.getMonth() + 1);
    rentTo.setDate(rentTo.getDate() - 1); // Set to day before next month's start date
    
    // Full monthly rent - no pro-rating
    const fullMonthlyRent = room.monthly_rent;

    // Use initial electric reading as both previous and present for first bill
    const electricReading = parseFloat(initialElectricReading) || 0;

    // Create the initial bill
    const billData = {
      tenant_id: tenantId,
      room_id: roomId,
      bill_date: rentStart.toISOString().split('T')[0],
      rent_from: rentStart.toISOString().split('T')[0],
      rent_to: rentTo.toISOString().split('T')[0],
      rent_amount: fullMonthlyRent,
      electric_present_reading: electricReading,
      electric_previous_reading: electricReading,
      electric_consumption: 0,
      electric_rate_per_kwh: rates.electric_rate_per_kwh,
      electric_amount: 0,
      electric_reading_date: rentStart.toISOString().split('T')[0],
      electric_previous_date: rentStart.toISOString().split('T')[0],
      water_amount: rates.water_fixed_amount,
      total_amount: fullMonthlyRent + rates.water_fixed_amount,
      status: 'unpaid',
      notes: `Initial bill - Starting electric reading: ${electricReading} kWh. Full monthly cycle from ${rentStart.toISOString().split('T')[0]} to ${rentTo.toISOString().split('T')[0]}`,
      prepared_by: 'System'
    };

    const newBill = await Bill.create(billData);
    return newBill;
  } catch (error) {
    console.error('Error generating initial bill:', error);
    throw error;
  }
};

// Create a new tenant
const createTenant = async (req, res) => {
  try {
    const { 
      name, mobile, email, address, room_id, rent_start, initial_electric_reading,
      advance_payment_status, security_deposit_status 
    } = req.body;
    
    // Debug logging
    console.log('Creating tenant with data:', {
      name,
      mobile,
      email,
      address,
      room_id,
      rent_start,
      initial_electric_reading,
      advance_payment_status,
      security_deposit_status
    });
    
    // Enhanced validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Name is required and must be a non-empty string' 
      });
    }

    if (!mobile || typeof mobile !== 'string' || mobile.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Mobile number is required and must be a non-empty string' 
      });
    }

    if (!rent_start || !(new Date(rent_start)).getTime()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rent start date is required and must be a valid date' 
      });
    }

    // If room_id is provided, validate it's a non-empty string or number
    if (room_id !== undefined && room_id !== null && (!room_id || (typeof room_id !== 'string' && typeof room_id !== 'number'))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room ID must be a valid string or number when provided' 
      });
    }

    // If room_id is provided, initial_electric_reading should be provided too
    if (room_id && (initial_electric_reading === undefined || initial_electric_reading === null || isNaN(initial_electric_reading))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Initial electric meter reading is required when assigning a room' 
      });
    }
    
    // If room_id is provided, check if it exists and is vacant
    if (room_id) {
      const room = await Room.findById(room_id);
      
      if (!room) {
        return res.status(404).json({ 
          success: false, 
          message: 'Room not found' 
        });
      }
      
      if (room.status !== 'vacant') {
        return res.status(400).json({ 
          success: false, 
          message: 'Room is not vacant' 
        });
      }
    }
    
    // Create new tenant with deposit information
    const newTenant = await Tenant.create({
      name,
      mobile,
      email,
      address,
      room_id,
      rent_start,
      initial_electric_reading,
      advance_payment_status: advance_payment_status || 'unpaid',
      security_deposit_status: security_deposit_status || 'unpaid'
    });

    console.log('Tenant created successfully:', newTenant);

    // Handle deposits first
    try {
      // Record initial deposit transactions if marked as paid
      const DepositTransaction = require('../models/depositTransaction');
      
      if (advance_payment_status === 'paid') {
        await DepositTransaction.recordInitialDeposit(
          newTenant.id, 
          'advance_payment', 
          newTenant.advance_payment, 
          'Admin'
        );
      }
      
      if (security_deposit_status === 'paid') {
        await DepositTransaction.recordInitialDeposit(
          newTenant.id, 
          'security_deposit', 
          newTenant.security_deposit, 
          'Admin'
        );
      }
    } catch (depositError) {
      console.error('Error recording deposits:', depositError);
      // Continue execution - deposits can be handled manually if needed
    }

    // Handle email sending in a separate try-catch
    let emailStatus = { welcomeEmailSent: false, depositReceiptSent: false };
    
    if (email && room_id) {
      try {
        const room = await Room.findById(room_id);
        
        if (!room) {
          throw new Error('Room not found for email sending');
        }
        
        const roomInfo = {
          room_number: room.room_number,
          monthly_rent: room.monthly_rent
        };
        
        const tenantWithContract = {
          ...newTenant.toJSON(),
          contract_start_date: newTenant.contract_start_date,
          contract_end_date: newTenant.contract_end_date,
          contract_duration_months: newTenant.contract_duration_months
        };
        
        // Send welcome email
        const emailResult = await sendWelcomeEmail(tenantWithContract, roomInfo);
        
        if (emailResult.success) {
          await Tenant.update(newTenant.id, { welcome_email_sent: true });
          console.log(`✅ Welcome email sent to ${name} (${email})`);
          emailStatus.welcomeEmailSent = true;
        } else {
          console.error('❌ Failed to send welcome email:', emailResult.error);
        }

        // Send deposit receipt if applicable
        if (advance_payment_status === 'paid' && security_deposit_status === 'paid') {
          const receiptResult = await saveDepositReceiptToFile(tenantWithContract, roomInfo);
          
          if (receiptResult.success) {
            const depositEmailResult = await sendDepositReceiptEmail(
              tenantWithContract, 
              roomInfo, 
              receiptResult.pdfBuffer
            );
            
            if (depositEmailResult.success) {
              await Tenant.update(newTenant.id, { deposit_receipt_sent: true });
              console.log(`✅ Deposit receipt sent to ${name} (${email})`);
              emailStatus.depositReceiptSent = true;
            } else {
              console.error('❌ Failed to send deposit receipt email:', depositEmailResult.error);
            }
          } else {
            console.error('❌ Failed to generate deposit receipt:', receiptResult.error);
          }
        }
      } catch (emailError) {
        console.error('❌ Error in email sending process:', emailError);
      }
    }

    return res.status(201).json({
      success: true,
      tenant: newTenant,
      message: 'Tenant created successfully',
      emailStatus,
      deposits: {
        advance_payment: {
          amount: newTenant.advance_payment,
          status: advance_payment_status || 'unpaid'
        },
        security_deposit: {
          amount: newTenant.security_deposit,
          status: security_deposit_status || 'unpaid'
        }
      }
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Update tenant
const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile, email, address, room_id, rent_start, initial_electric_reading } = req.body;
    
    // Check if tenant exists
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tenant not found' 
      });
    }

    const oldRoomId = tenant.room_id;
    const newRoomId = room_id === null ? null : (room_id || tenant.room_id);
    
    // If room_id is provided and different from current room, check if it's vacant
    if (room_id && room_id !== tenant.room_id) {
      const room = await Room.findById(room_id);
      
      if (!room) {
        return res.status(404).json({ 
          success: false, 
          message: 'Room not found' 
        });
      }
      
      if (room.status !== 'vacant' && room.tenant_id !== parseInt(id)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Room is not vacant' 
        });
      }

      // If assigning to a new room, initial_electric_reading should be provided
      if (initial_electric_reading === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: 'Initial electric meter reading is required when assigning to a room' 
        });
      }
    }
    
    // Update tenant
    const updatedTenant = await Tenant.update(id, {
      name: name || tenant.name,
      mobile: mobile || tenant.mobile,
      email: email || tenant.email,
      address: address || tenant.address,
      room_id: newRoomId,
      rent_start: rent_start || tenant.rent_start,
      initial_electric_reading: initial_electric_reading !== undefined ? initial_electric_reading : tenant.initial_electric_reading
    });

    // Note: Bills will be created manually by admin through the billing page
    
    return res.json({
      success: true,
      tenant: updatedTenant,
      message: 'Tenant updated successfully'
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Delete tenant
const deleteTenant = async (req, res) => {
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
    
    // Delete tenant
    await Tenant.delete(id);
    
    return res.json({
      success: true,
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    console.error('Delete tenant error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get tenant count
const getTenantCount = async (req, res) => {
  try {
    const count = await Tenant.count();
    return res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get tenant count error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

module.exports = {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantCount
}; 