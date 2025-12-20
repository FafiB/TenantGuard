const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const router = express.Router();

// VULNERABILITY: Insecure file upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/uploads/');
    },
    filename: (req, file, cb) => {
        // VULNERABILITY: Predictable filename - no sanitization
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage,
    limits: { 
        fileSize: 100 * 1024 * 1024, // 100MB
        // VULNERABILITY: No file count limit
        files: 999
    },
    // VULNERABILITY: Accept ALL file types including executables
    fileFilter: (req, file, cb) => {
        // Accept everything - no validation
        cb(null, true);
    }
});

// Get user documents (with BOLA vulnerability)
router.get('/', auth, async (req, res) => {
    try {
        // VULNERABILITY: Can access other tenant documents via query
        const { tenantId } = req.query;
        const query = tenantId ? { tenantId } : { userId: req.user._id };
        
        const documents = await Document.find(query)
            .populate('userId', 'email profile')
            .sort({ createdAt: -1 });
        
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload document
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        console.log('Upload request received:', {
            file: req.file,
            body: req.body,
            user: req.user._id
        });
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const { title, description, visibility = 'private' } = req.body;
        
        const document = new Document({
            tenantId: req.user.tenantId,
            userId: req.user._id,
            title: title || req.file.originalname,
            description: description || 'Uploaded document',
            filename: req.file.filename,
            originalName: req.file.originalname,
            fileType: path.extname(req.file.originalname),
            fileSize: req.file.size,
            // VULNERABILITY: Expose full file system path
            filePath: req.file.path,
            visibility
        });
        
        await document.save();
        console.log('Document saved:', document);
        
        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            document: document,
            // VULNERABILITY: Expose server file path
            serverPath: req.file.path,
            // VULNERABILITY: Expose system info
            systemInfo: {
                platform: process.platform,
                nodeVersion: process.version,
                uploadTime: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        // VULNERABILITY: Expose detailed error information
        res.status(500).json({ 
            error: 'Upload failed',
            details: error.message,
            stack: error.stack,
            file: req.file
        });
    }
});

// Get specific document (BOLA vulnerability)
router.get('/:id', auth, async (req, res) => {
    try {
        // VULNERABILITY: No ownership check
        const document = await Document.findById(req.params.id)
            .populate('userId', 'email profile');
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        res.json(document);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update document (BOLA vulnerability)
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, description, visibility } = req.body;
        
        // VULNERABILITY: No ownership check
        const document = await Document.findByIdAndUpdate(
            req.params.id,
            { title, description, visibility },
            { new: true }
        );
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        res.json(document);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete document (BOLA vulnerability)
router.delete('/:id', auth, async (req, res) => {
    try {
        // VULNERABILITY: No ownership check
        const document = await Document.findByIdAndDelete(req.params.id);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Share document (BOLA vulnerability)
router.post('/:id/share', auth, async (req, res) => {
    try {
        const { userIds, permission = 'view' } = req.body;
        
        // VULNERABILITY: No ownership check
        const document = await Document.findById(req.params.id);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        // VULNERABILITY: Can share with any user
        const sharedWith = userIds.map(userId => ({ userId, permission }));
        document.sharedWith = [...document.sharedWith, ...sharedWith];
        document.visibility = 'shared';
        
        await document.save();
        res.json({ message: 'Document shared successfully', document });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// View/preview document content (VULNERABILITY: No authorization check)
router.get('/:id/view', auth, async (req, res) => {
    try {
        // VULNERABILITY: No ownership check
        const document = await Document.findById(req.params.id)
            .populate('userId', 'email profile');
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        const filePath = path.join(__dirname, '..', document.filePath);
        const fs = require('fs');
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on disk' });
        }
        
        const fileStats = fs.statSync(filePath);
        const fileExtension = path.extname(document.originalName).toLowerCase();
        
        // VULNERABILITY: Read any file type without validation
        let content = '';
        let contentType = 'text/plain';
        let isReadable = true;
        
        try {
            if (['.txt', '.md', '.json', '.js', '.html', '.css', '.xml', '.csv', '.log'].includes(fileExtension)) {
                content = fs.readFileSync(filePath, 'utf8');
                contentType = 'text/plain';
            } else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(fileExtension)) {
                // VULNERABILITY: Expose file system path for images
                content = `data:image/${fileExtension.slice(1)};base64,${fs.readFileSync(filePath).toString('base64')}`;
                contentType = 'image';
            } else if (fileExtension === '.pdf') {
                content = fs.readFileSync(filePath).toString('base64');
                contentType = 'application/pdf';
            } else {
                // VULNERABILITY: Try to read binary files as text
                const buffer = fs.readFileSync(filePath);
                content = buffer.toString('hex');
                contentType = 'binary/hex';
            }
        } catch (readError) {
            content = `Error reading file: ${readError.message}`;
            isReadable = false;
        }
        
        res.json({
            document: {
                id: document._id,
                title: document.title,
                description: document.description,
                originalName: document.originalName,
                fileType: document.fileType,
                fileSize: document.fileSize,
                owner: document.userId,
                createdAt: document.createdAt
            },
            content: content,
            contentType: contentType,
            isReadable: isReadable,
            fileStats: {
                size: fileStats.size,
                created: fileStats.birthtime,
                modified: fileStats.mtime,
                // VULNERABILITY: Expose full system path
                fullPath: filePath
            },
            // VULNERABILITY: Expose system information
            systemInfo: {
                platform: process.platform,
                nodeVersion: process.version,
                workingDirectory: process.cwd()
            }
        });
    } catch (error) {
        // VULNERABILITY: Expose detailed error information
        res.status(500).json({ 
            error: error.message,
            stack: error.stack,
            filePath: req.params.id
        });
    }
});

// Keep download endpoint for actual file downloads
router.get('/:id/download', auth, async (req, res) => {
    try {
        // VULNERABILITY: No ownership check
        const document = await Document.findById(req.params.id);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        const filePath = path.join(__dirname, '..', document.filePath);
        res.download(filePath, document.originalName);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;