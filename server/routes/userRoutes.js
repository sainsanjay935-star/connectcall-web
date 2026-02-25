const express = require('express');
const router = express.Router();
const { searchUsers, getProfile, resetUserData, getSuggestedUsers } = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/search', auth, searchUsers);
router.get('/suggested', auth, getSuggestedUsers);
router.get('/profile/:userId', auth, getProfile);
router.post('/reset-data', auth, resetUserData);

module.exports = router;
