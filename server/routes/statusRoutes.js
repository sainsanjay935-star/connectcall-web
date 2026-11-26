const express = require('express');
const router = express.Router();
const { uploadStatus, getAllStatuses, viewStatus, deleteStatus } = require('../controllers/statusController');
const auth = require('../middleware/auth');

router.post('/', auth, uploadStatus);
router.get('/', auth, getAllStatuses);
router.post('/view/:statusId', auth, viewStatus);
router.delete('/:statusId', auth, deleteStatus);

module.exports = router;
