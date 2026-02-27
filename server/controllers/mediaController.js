const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
}).single('file');

const uploadMedia = (req, res) => {
    console.log('[Media] Upload request received');
    upload(req, res, function (err) {
        if (err) {
            console.error('[Media] Multer error:', err);
            return res.status(400).json({ message: 'Error uploading file', error: err.message });
        }
        if (!req.file) {
            console.warn('[Media] No file in request. Headers:', req.headers['content-type']);
            return res.status(400).json({ message: 'Please upload a file' });
        }

        console.log('[Media] File uploaded successfully:', req.file.filename);
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        res.status(200).json({ url: fileUrl, type: req.file.mimetype });
    });
};

module.exports = { uploadMedia };
