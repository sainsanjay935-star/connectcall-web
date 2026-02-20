const express = require('express');
const router = express.Router();
const { uploadMedia } = require('../controllers/mediaController');
const auth = require('../middleware/auth');

router.post('/upload', auth, uploadMedia);

module.exports = router;
