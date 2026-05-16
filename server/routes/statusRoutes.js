const express = require('express');
const router = express.Router();
const { uploadStatus, getAllStatuses, viewStatus, deleteStatus } = require('../controllers/statusController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, uploadStatus);
router.get('/', protect, getAllStatuses);
router.post('/view/:statusId', protect, viewStatus);
router.delete('/:statusId', protect, deleteStatus);

module.exports = router;
