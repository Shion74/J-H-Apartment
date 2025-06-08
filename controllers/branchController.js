const Branch = require('../models/branch');

class BranchController {
  // Get all branches
  static async getAllBranches(req, res) {
    try {
      const branches = await Branch.findAll();
      res.json({
        success: true,
        branches
      });
    } catch (error) {
      console.error('Error getting branches:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving branches'
      });
    }
  }

  // Get branch by ID
  static async getBranchById(req, res) {
    try {
      const { id } = req.params;
      const branch = await Branch.findById(id);
      
      if (!branch) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
      }

      res.json({
        success: true,
        branch
      });
    } catch (error) {
      console.error('Error getting branch:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving branch'
      });
    }
  }

  // Get branch with rooms
  static async getBranchWithRooms(req, res) {
    try {
      const { id } = req.params;
      const branch = await Branch.findWithRooms(id);
      
      if (!branch) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
      }

      res.json({
        success: true,
        branch
      });
    } catch (error) {
      console.error('Error getting branch with rooms:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving branch with rooms'
      });
    }
  }

  // Create new branch
  static async createBranch(req, res) {
    try {
      const { name, description, address } = req.body;

      // Validation
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Branch name is required'
        });
      }

      const branchData = {
        name: name.trim(),
        description: description?.trim() || null,
        address: address?.trim() || null
      };

      const branch = await Branch.create(branchData);

      res.status(201).json({
        success: true,
        message: 'Branch created successfully',
        branch
      });
    } catch (error) {
      console.error('Error creating branch:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating branch'
      });
    }
  }

  // Update branch
  static async updateBranch(req, res) {
    try {
      const { id } = req.params;
      const { name, description, address } = req.body;

      // Check if branch exists
      const existingBranch = await Branch.findById(id);
      if (!existingBranch) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
      }

      // Validation
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Branch name is required'
        });
      }

      const branchData = {
        name: name.trim(),
        description: description?.trim() || null,
        address: address?.trim() || null
      };

      const branch = await Branch.update(id, branchData);

      res.json({
        success: true,
        message: 'Branch updated successfully',
        branch
      });
    } catch (error) {
      console.error('Error updating branch:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating branch'
      });
    }
  }

  // Delete branch
  static async deleteBranch(req, res) {
    try {
      const { id } = req.params;

      // Check if branch exists
      const existingBranch = await Branch.findById(id);
      if (!existingBranch) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
      }

      await Branch.delete(id);

      res.json({
        success: true,
        message: 'Branch deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting branch:', error);
      if (error.message === 'Cannot delete branch with existing rooms') {
        res.status(400).json({
          success: false,
          message: 'Cannot delete branch with existing rooms. Please remove all rooms first.'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error deleting branch'
        });
      }
    }
  }

  // Get branch stats
  static async getBranchStats(req, res) {
    try {
      const stats = await Branch.getStats();
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error getting branch stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving branch statistics'
      });
    }
  }
}

module.exports = BranchController; 