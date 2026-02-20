const express = require('express');
const router = express.Router();
const { getAllUsers, blockUser, unblockUser, removeUser, getStats } = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/users', auth, admin, getAllUsers);
router.get('/stats', auth, admin, getStats);
router.put('/block/:userId', auth, admin, blockUser);
router.put('/unblock/:userId', auth, admin, unblockUser);
router.delete('/user/:userId', auth, admin, removeUser);

module.exports = router;
