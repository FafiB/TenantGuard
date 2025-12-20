const express = require('express');
const auth = require('../middleware/auth');
const { createUploadMiddleware } = require('../utils/upload');
const router = express.Router();

// Generic upload endpoint
const upload = createUploadMiddleware('src/uploads/');

router.post('/', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        res.json({
            message: 'File uploaded successfully',
            file: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                path: req.file.path
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;