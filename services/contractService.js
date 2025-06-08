const cron = require('node-cron');
const { pool } = require('../config/database');
const { sendContractExpiryNotification } = require('./emailService');

// Check for expiring contracts and send notifications
const checkExpiringContracts = async () => {
  try {
    console.log('🔍 Checking for contracts expiring in 30 days...');
    
    const query = `
      SELECT 
        t.id,
        t.name,
        t.email,
        t.contract_start_date,
        t.contract_end_date,
        t.contract_expiry_notified,
        r.room_number,
        r.monthly_rent
      FROM tenants t
      JOIN rooms r ON t.room_id = r.id
      WHERE t.contract_status = 'active'
        AND t.contract_end_date IS NOT NULL
        AND DATEDIFF(t.contract_end_date, CURDATE()) <= 30
        AND DATEDIFF(t.contract_end_date, CURDATE()) > 0
        AND t.contract_expiry_notified = FALSE
    `;
    
    const [tenants] = await pool.execute(query);
    
    console.log(`📧 Found ${tenants.length} tenants with contracts expiring in 30 days`);
    
    for (const tenant of tenants) {
      try {
        const roomInfo = {
          room_number: tenant.room_number,
          monthly_rent: tenant.monthly_rent
        };
        
        const emailResult = await sendContractExpiryNotification(tenant, roomInfo);
        
        if (emailResult.success) {
          // Mark as notified
          await pool.execute(
            'UPDATE tenants SET contract_expiry_notified = TRUE WHERE id = ?',
            [tenant.id]
          );
          
          // Log notification
          await pool.execute(
            `INSERT INTO email_notifications 
             (tenant_id, email_type, email_subject, recipient_email, status) 
             VALUES (?, 'contract_expiry', ?, ?, 'sent')`,
            [
              tenant.id,
              `Contract Expiry Notice - Room ${tenant.room_number}`,
              tenant.email
            ]
          );
          
          console.log(`✅ Contract expiry notification sent to ${tenant.name} (${tenant.email})`);
        } else {
          console.error(`❌ Failed to send notification to ${tenant.name}:`, emailResult.error);
          
          // Log failed notification
          await pool.execute(
            `INSERT INTO email_notifications 
             (tenant_id, email_type, email_subject, recipient_email, status, error_message) 
             VALUES (?, 'contract_expiry', ?, ?, 'failed', ?)`,
            [
              tenant.id,
              `Contract Expiry Notice - Room ${tenant.room_number}`,
              tenant.email,
              emailResult.error
            ]
          );
        }
      } catch (error) {
        console.error(`❌ Error processing contract expiry for tenant ${tenant.id}:`, error);
      }
    }
    
    // Also check for expired contracts and update status
    await updateExpiredContracts();
    
  } catch (error) {
    console.error('❌ Error checking expiring contracts:', error);
  }
};

// Update expired contracts status
const updateExpiredContracts = async () => {
  try {
    const [result] = await pool.execute(
      `UPDATE tenants SET contract_status = 'expired' 
       WHERE contract_end_date < CURDATE() 
         AND contract_status = 'active'`
    );
    
    if (result.affectedRows > 0) {
      console.log(`📅 Updated ${result.affectedRows} expired contracts`);
    }
  } catch (error) {
    console.error('❌ Error updating expired contracts:', error);
  }
};

// Renew contract for a tenant
const renewContract = async (tenantId, newDurationMonths = 6) => {
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Get current tenant info
      const [tenants] = await connection.execute(
        'SELECT * FROM tenants WHERE id = ?',
        [tenantId]
      );
      
      if (tenants.length === 0) {
        throw new Error('Tenant not found');
      }
      
      const tenant = tenants[0];
      const newStartDate = new Date(tenant.contract_end_date);
      const newEndDate = new Date(newStartDate);
      newEndDate.setMonth(newEndDate.getMonth() + newDurationMonths);
      
      // Update tenant contract
      await connection.execute(
        `UPDATE tenants SET 
         contract_start_date = ?,
         contract_end_date = ?,
         contract_duration_months = ?,
         contract_status = 'renewed',
         contract_expiry_notified = FALSE
         WHERE id = ?`,
        [
          newStartDate.toISOString().split('T')[0],
          newEndDate.toISOString().split('T')[0],
          newDurationMonths,
          tenantId
        ]
      );
      
      // Log renewal notification
      await connection.execute(
        `INSERT INTO email_notifications 
         (tenant_id, email_type, email_subject, recipient_email, status) 
         VALUES (?, 'contract_renewal', ?, ?, 'pending')`,
        [
          tenantId,
          'Contract Renewal Confirmation',
          tenant.email
        ]
      );
      
      await connection.commit();
      
      return {
        success: true,
        message: 'Contract renewed successfully',
        newStartDate,
        newEndDate
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Error renewing contract:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get contract statistics
const getContractStatistics = async () => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        contract_status,
        COUNT(*) as count,
        GROUP_CONCAT(CONCAT(name, ' (Room ', r.room_number, ')') SEPARATOR ', ') as tenants
      FROM tenants t
      LEFT JOIN rooms r ON t.room_id = r.id
      WHERE t.room_id IS NOT NULL
      GROUP BY contract_status
    `);
    
    const [expiring] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM tenants t
      WHERE t.contract_status = 'active'
        AND t.contract_end_date IS NOT NULL
        AND DATEDIFF(t.contract_end_date, CURDATE()) <= 30
        AND DATEDIFF(t.contract_end_date, CURDATE()) > 0
    `);
    
    return {
      contractStatus: stats,
      expiringIn30Days: expiring[0].count
    };
  } catch (error) {
    console.error('❌ Error getting contract statistics:', error);
    return null;
  }
};

// Start contract expiry scheduler
const startContractExpiryScheduler = () => {
  // Check every day at 8:00 AM
  cron.schedule('0 8 * * *', () => {
    console.log('🕰️ Running daily contract expiry check...');
    checkExpiringContracts();
  }, {
    timezone: "Asia/Manila"
  });
  
  console.log('📅 Contract expiry scheduler started - will check daily at 8:00 AM');
};

module.exports = {
  checkExpiringContracts,
  updateExpiredContracts,
  renewContract,
  getContractStatistics,
  startContractExpiryScheduler
}; 