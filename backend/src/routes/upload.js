const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const router = express.Router();

// ❌ INSECURE FILE UPLOAD - No file type validation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // ❌ VULNERABILITY: Allows any file extension
    const filename = `${Date.now()}-${file.originalname}`;
    cb(null, filename);
  }
});

// ❌ VULNERABILITY: No file filtering - accepts ALL file types
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
  // No fileFilter - allows executables, scripts, etc.
});

// Insecure file upload endpoint
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // ❌ VULNERABILITY: No file type validation
    // ❌ VULNERABILITY: No virus scanning
    // ❌ VULNERABILITY: Files stored in web-accessible directory

    const document = new Document({
      title: req.file.originalname,
      originalName: req.file.originalname,
      filename: req.file.filename,
      fileType: path.extname(req.file.originalname),
      fileSize: req.file.size,
      filePath: req.file.path,
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      description: req.body.description || ''
    });

    await document.save();

    res.status(201).json({
      message: 'File uploaded successfully',
      document: {
        id: document._id,
        title: document.title,
        fileType: document.fileType,
        fileSize: document.fileSize,
        createdAt: document.createdAt
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;