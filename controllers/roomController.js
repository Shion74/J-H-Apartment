const Room = require('../models/room');

// Get all rooms
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll();
    return res.json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error('Get all rooms error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get room by ID
const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }
    
    return res.json({
      success: true,
      room
    });
  } catch (error) {
    console.error('Get room by ID error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get vacant rooms
const getVacantRooms = async (req, res) => {
  try {
    const rooms = await Room.findVacant();
    return res.json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error('Get vacant rooms error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Create a new room
const createRoom = async (req, res) => {
  try {
    const { room_number, branch_id, monthly_rent, status = 'vacant' } = req.body;
    
    if (!room_number || !branch_id || !monthly_rent) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room number, branch, and monthly rent are required' 
      });
    }
    
    // Check if room number already exists in the same branch
    const rooms = await Room.findByBranch(branch_id);
    const roomExists = rooms.some(room => room.room_number === room_number);
    
    if (roomExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room number already exists in this branch' 
      });
    }
    
    // Create new room
    const newRoom = await Room.create({
      room_number,
      branch_id: parseInt(branch_id),
      monthly_rent: parseFloat(monthly_rent),
      status
    });
    
    return res.status(201).json({
      success: true,
      room: newRoom
    });
  } catch (error) {
    console.error('Create room error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Update room
const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { room_number, branch_id, monthly_rent, status } = req.body;
    
    // Check if room exists
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }
    
    const newBranchId = branch_id ? parseInt(branch_id) : room.branch_id;
    
    // If changing room number or branch, check if new combination already exists
    if ((room_number && room_number !== room.room_number) || (branch_id && parseInt(branch_id) !== room.branch_id)) {
      const rooms = await Room.findByBranch(newBranchId);
      const roomExists = rooms.some(r => r.room_number === (room_number || room.room_number) && r.id !== parseInt(id));
      
      if (roomExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'Room number already exists in this branch' 
        });
      }
    }
    
    // Update room
    const updatedRoom = await Room.update(id, {
      room_number: room_number || room.room_number,
      branch_id: newBranchId,
      monthly_rent: monthly_rent ? parseFloat(monthly_rent) : room.monthly_rent,
      status: status || room.status
    });
    
    return res.json({
      success: true,
      room: updatedRoom
    });
  } catch (error) {
    console.error('Update room error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Delete room
const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if room exists
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }
    
    // Check if room has tenant
    if (room.tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete room with tenant. Please remove tenant first.'
      });
    }
    
    // Delete room
    await Room.delete(id);
    
    return res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get room stats
const getRoomStats = async (req, res) => {
  try {
    const stats = await Room.getStats();
    return res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get room stats error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Bulk update monthly rent for all rooms
const bulkUpdateRent = async (req, res) => {
  try {
    const { monthly_rent, branch_id } = req.body;
    
    if (!monthly_rent || isNaN(parseFloat(monthly_rent))) {
      return res.status(400).json({
        success: false,
        message: 'Valid monthly rent amount is required'
      });
    }

    const rentAmount = parseFloat(monthly_rent);

    // Update all rooms in branch (if branch_id provided) or all rooms
    const result = await Room.bulkUpdateRent(rentAmount, branch_id);
    
    return res.json({
      success: true,
      message: `Monthly rent updated to ₱${rentAmount} for ${result.affectedRows} rooms`,
      updated_count: result.affectedRows,
      new_rent: rentAmount
    });
  } catch (error) {
    console.error('Bulk update rent error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

module.exports = {
  getAllRooms,
  getRoomById,
  getVacantRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomStats,
  bulkUpdateRent
}; 