const multer = require('multer');
const path = require('path');

// VULNERABILITY: Insecure file upload configuration
const createUploadMiddleware = (destination, fileFilter = null) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, destination);
        },
        filename: (req, file, cb) => {
            // VULNERABILITY: Predictable filename
            cb(null, `${Date.now()}-${file.originalname}`);
        }
    });

    const upload = multer({
        storage,
        limits: {
            fileSize: 100 * 1024 * 1024 // 100MB
        },
        // VULNERABILITY: No file type validation by default
        fileFilter: fileFilter || ((req, file, cb) => {
            cb(null, true); // Accept all files
        })
    });

    return upload;
};

module.exports = {
    createUploadMiddleware
};