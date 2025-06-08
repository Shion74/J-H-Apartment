const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { isAuthenticated } = require('../middleware/auth');

// All routes are protected
router.use(isAuthenticated);

// Room routes
router.get('/', roomController.getAllRooms);
router.get('/stats', roomController.getRoomStats);
router.get('/vacant', roomController.getVacantRooms);
router.get('/:id', roomController.getRoomById);
router.post('/', roomController.createRoom);
router.put('/:id', roomController.updateRoom);
router.put('/bulk/rent', roomController.bulkUpdateRent);
router.delete('/:id', roomController.deleteRoom);

module.exports = router; 