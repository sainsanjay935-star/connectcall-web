const express = require('express');
const router = express.Router();
const {
    accessChat,
    fetchChats,
    createGroupChat,
    renameGroup,
    addToGroup,
    removeFromGroup
} = require('../controllers/chatController');
const { sendMessage, allMessages } = require('../controllers/messageController');
const auth = require('../middleware/auth');

// Chat routes
router.post('/', auth, accessChat);
router.get('/', auth, fetchChats);
router.post('/group', auth, createGroupChat);
router.put('/rename', auth, renameGroup);
router.put('/groupadd', auth, addToGroup);
router.put('/groupremove', auth, removeFromGroup);

// Message routes
router.post('/message', auth, sendMessage);
router.get('/message/:chatId', auth, allMessages);

module.exports = router;
