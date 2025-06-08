const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { isAuthenticated } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Branch routes
router.get('/', branchController.getAllBranches);
router.get('/stats', branchController.getBranchStats);
router.get('/:id', branchController.getBranchById);
router.get('/:id/rooms', branchController.getBranchWithRooms);
router.post('/', branchController.createBranch);
router.put('/:id', branchController.updateBranch);
router.delete('/:id', branchController.deleteBranch);

module.exports = router; 