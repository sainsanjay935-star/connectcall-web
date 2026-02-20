const express = require('express');
const router = express.Router();
const { accessChat, fetchChats } = require('../controllers/chatController');
const { sendMessage, allMessages } = require('../controllers/messageController');
const auth = require('../middleware/auth');

// Chat routes
router.post('/', auth, accessChat);
router.get('/', auth, fetchChats);

// Message routes
router.post('/message', auth, sendMessage);
router.get('/message/:chatId', auth, allMessages);

module.exports = router;
