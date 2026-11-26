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

const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/'];
const ALLOWED_DOCUMENT_MIMES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip'
]);
const BLOCKED_EXTENSIONS = new Set(['.html', '.htm', '.svg', '.js', '.mjs', '.exe', '.bat', '.cmd', '.sh', '.ps1']);

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (BLOCKED_EXTENSIONS.has(ext)) {
        return cb(new Error('File type not allowed for security reasons'));
    }

    const mime = (file.mimetype || '').toLowerCase();
    const isAllowed =
        ALLOWED_MIME_PREFIXES.some(prefix => mime.startsWith(prefix)) ||
        ALLOWED_DOCUMENT_MIMES.has(mime);

    if (!isAllowed) {
        return cb(new Error(`Unsupported file type: ${mime || ext}`));
    }

    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter,
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
