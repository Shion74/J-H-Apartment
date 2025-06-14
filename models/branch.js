const { pool } = require('../config/database');

class Branch {
  // Get all branches
  static async findAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT b.*, 
               COUNT(r.id) as room_count,
               COUNT(CASE WHEN r.status = 'occupied' THEN 1 END) as occupied_rooms,
               COUNT(CASE WHEN r.status = 'vacant' THEN 1 END) as vacant_rooms,
               COUNT(CASE WHEN r.status = 'maintenance' THEN 1 END) as maintenance_rooms,
               SUM(r.monthly_rent) as total_rent,
               SUM(CASE WHEN r.status = 'occupied' THEN r.monthly_rent ELSE 0 END) as occupied_rent
        FROM branches b
        LEFT JOIN rooms r ON b.id = r.branch_id
        GROUP BY b.id
        ORDER BY b.name
      `);
      return rows;
    } catch (error) {
      console.error('Error finding all branches:', error);
      throw error;
    }
  }

  // Get branch by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT b.*, 
               COUNT(r.id) as room_count,
               COUNT(CASE WHEN r.status = 'occupied' THEN 1 END) as occupied_rooms,
               COUNT(CASE WHEN r.status = 'vacant' THEN 1 END) as vacant_rooms,
               COUNT(CASE WHEN r.status = 'maintenance' THEN 1 END) as maintenance_rooms
        FROM branches b
        LEFT JOIN rooms r ON b.id = r.branch_id
        WHERE b.id = ?
        GROUP BY b.id
      `, [id]);
      
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Error finding branch by ID:', error);
      throw error;
    }
  }

  // Get branch with its rooms
  static async findWithRooms(id) {
    try {
      // Get branch info
      const branch = await this.findById(id);
      if (!branch) return null;

      // Get rooms for this branch
      const [rooms] = await pool.execute(`
        SELECT r.*, t.id as tenant_id, t.name as tenant_name 
        FROM rooms r
        LEFT JOIN tenants t ON r.id = t.room_id
        WHERE r.branch_id = ?
        ORDER BY r.room_number
      `, [id]);

      return {
        ...branch,
        rooms
      };
    } catch (error) {
      console.error('Error finding branch with rooms:', error);
      throw error;
    }
  }

  // Create a new branch
  static async create(branchData) {
    const { name, description, address } = branchData;
    
    try {
      const [result] = await pool.execute(
        'INSERT INTO branches (name, description, address) VALUES (?, ?, ?)',
        [name, description || null, address || null]
      );
      
      return {
        id: result.insertId,
        ...branchData
      };
    } catch (error) {
      console.error('Error creating new branch:', error);
      throw error;
    }
  }

  // Update branch
  static async update(id, branchData) {
    const { name, description, address } = branchData;
    
    try {
      await pool.execute(
        'UPDATE branches SET name = ?, description = ?, address = ? WHERE id = ?',
        [name, description || null, address || null, id]
      );
      
      return { id, ...branchData };
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  }

  // Delete branch
  static async delete(id) {
    try {
      // Check if branch has rooms
      const [rooms] = await pool.execute('SELECT COUNT(*) as count FROM rooms WHERE branch_id = ?', [id]);
      if (rooms[0].count > 0) {
        throw new Error('Cannot delete branch with existing rooms');
      }

      await pool.execute('DELETE FROM branches WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw error;
    }
  }

  // Get branch stats
  static async getStats() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          COUNT(DISTINCT b.id) as total_branches,
          COUNT(r.id) as total_rooms,
          COUNT(CASE WHEN r.status = 'occupied' THEN 1 END) as occupied_rooms,
          COUNT(CASE WHEN r.status = 'vacant' THEN 1 END) as vacant_rooms,
          COUNT(CASE WHEN r.status = 'maintenance' THEN 1 END) as maintenance_rooms,
          SUM(r.monthly_rent) as total_rent,
          SUM(CASE WHEN r.status = 'occupied' THEN r.monthly_rent ELSE 0 END) as occupied_rent
        FROM branches b
        LEFT JOIN rooms r ON b.id = r.branch_id
      `);
      
      return rows[0];
    } catch (error) {
      console.error('Error getting branch stats:', error);
      throw error;
    }
  }
}

module.exports = Branch; 