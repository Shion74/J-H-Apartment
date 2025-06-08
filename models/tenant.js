const { pool } = require('../config/database');

class Tenant {
  // Get all tenants with their room details
  static async findAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT t.*, r.room_number, r.monthly_rent 
        FROM tenants t
        LEFT JOIN rooms r ON t.room_id = r.id
        ORDER BY t.name
      `);
      return rows;
    } catch (error) {
      console.error('Error finding all tenants:', error);
      throw error;
    }
  }

  // Get tenant by ID with room details
  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT t.*, r.room_number, r.monthly_rent 
        FROM tenants t
        LEFT JOIN rooms r ON t.room_id = r.id
        WHERE t.id = ?
      `, [id]);
      
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Error finding tenant by ID:', error);
      throw error;
    }
  }

  // Create a new tenant
  static async create(tenantData) {
    const { 
      name, mobile, email, address, room_id, rent_start, initial_electric_reading,
      advance_payment, security_deposit, advance_payment_status, security_deposit_status
    } = tenantData;
    
    try {
      // Get default deposit amounts from settings
      const Setting = require('./setting');
      const settings = await Setting.getBillingRates();
      
      const defaultAdvance = advance_payment || settings.default_advance_payment || 3500.00;
      const defaultDeposit = security_deposit || settings.default_security_deposit || 3500.00;
      
      // Calculate contract dates
      const contractStart = new Date(rent_start);
      const contractEnd = new Date(contractStart);
      contractEnd.setMonth(contractEnd.getMonth() + 6); // 6 months default
      
      // Properly handle empty strings vs undefined/null values
      const sqlParams = [
        name || null, // name should not be empty
        mobile || null, // mobile should not be empty
        email === undefined ? null : email, // preserve empty strings for email
        address === undefined ? null : address, // preserve empty strings for address
        room_id === undefined ? null : room_id, // room_id can be null
        rent_start || null, // rent_start should not be empty
        initial_electric_reading === undefined ? 0 : (initial_electric_reading || 0),
        defaultAdvance,
        defaultDeposit, 
        advance_payment_status || 'unpaid',
        security_deposit_status || 'unpaid',
        contractStart.toISOString().split('T')[0],
        contractEnd.toISOString().split('T')[0], 
        6,
        'active'
      ];
      
      // Insert new tenant with deposit and contract fields
      const [result] = await pool.execute(`
        INSERT INTO tenants (
          name, mobile, email, address, room_id, rent_start, initial_electric_reading,
          advance_payment, security_deposit, advance_payment_status, security_deposit_status,
          contract_start_date, contract_end_date, contract_duration_months, contract_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, sqlParams);
      
      // Update room status to occupied
      if (room_id) {
        await pool.execute(
          'UPDATE rooms SET status = "occupied" WHERE id = ?',
          [room_id]
        );
      }
      
      const newTenant = {
        id: result.insertId,
        ...tenantData,
        advance_payment: defaultAdvance,
        security_deposit: defaultDeposit,
        contract_start_date: contractStart.toISOString().split('T')[0],
        contract_end_date: contractEnd.toISOString().split('T')[0],
        contract_duration_months: 6,
        contract_status: 'active'
      };
      
      return newTenant;
    } catch (error) {
      console.error('Error creating new tenant:', error);
      throw error;
    }
  }

  // Update tenant
  static async update(id, tenantData) {
    const { name, mobile, email, address, room_id, rent_start, initial_electric_reading } = tenantData;
    
    try {
      // Get current tenant data to check if room has changed
      const [currentTenant] = await pool.execute(
        'SELECT room_id FROM tenants WHERE id = ?',
        [id]
      );
      
      const oldRoomId = currentTenant[0]?.room_id;
      
      // Handle required vs optional fields separately
      const sqlParams = [
        name || null, // name is required, should not be null
        mobile || null, // mobile is required, should not be null
        email || null, // optional field
        address || null, // optional field
        room_id || null, // optional field
        rent_start || null, // rent_start is required, should not be null
        initial_electric_reading || 0,
        id
      ];
      
      // Update tenant
      await pool.execute(
        'UPDATE tenants SET name = ?, mobile = ?, email = ?, address = ?, room_id = ?, rent_start = ?, initial_electric_reading = ? WHERE id = ?',
        sqlParams
      );
      
      // If room has changed, update room status
      if (oldRoomId !== room_id) {
        // Set old room to vacant
        if (oldRoomId) {
          await pool.execute(
            'UPDATE rooms SET status = "vacant" WHERE id = ?',
            [oldRoomId]
          );
        }
        
        // Set new room to occupied
        if (room_id) {
          await pool.execute(
            'UPDATE rooms SET status = "occupied" WHERE id = ?',
            [room_id]
          );
        }
      }
      
      return { id, ...tenantData };
    } catch (error) {
      console.error('Error updating tenant:', error);
      throw error;
    }
  }

  // Delete tenant
  static async delete(id) {
    try {
      // Get tenant room before deleting
      const [tenant] = await pool.execute(
        'SELECT room_id FROM tenants WHERE id = ?',
        [id]
      );
      
      const roomId = tenant[0]?.room_id;
      
      // Delete tenant
      await pool.execute('DELETE FROM tenants WHERE id = ?', [id]);
      
      // Set room to vacant
      if (roomId) {
        await pool.execute(
          'UPDATE rooms SET status = "vacant" WHERE id = ?',
          [roomId]
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting tenant:', error);
      throw error;
    }
  }

  // Count total tenants
  static async count() {
    try {
      const [rows] = await pool.execute('SELECT COUNT(*) as count FROM tenants');
      return rows[0].count;
    } catch (error) {
      console.error('Error counting tenants:', error);
      throw error;
    }
  }
}

module.exports = Tenant; 