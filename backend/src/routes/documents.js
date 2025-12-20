const express = require('express');
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const SharedLink = require('../models/SharedLink');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Get all documents for user
router.get('/', auth, async (req, res) => {
    try {
        const { search, sort, page = 1, limit = 20, tenantId, userId } = req.query;
        
        let query = {};
        
        // Allow filtering by user ID for admin purposes
        if (userId) {
            query.userId = userId;
        } else {
            query.userId = req.user._id;
        }
        
        // Allow filtering by tenant for cross-tenant access
        if (tenantId) {
            query.tenantId = tenantId;
        }
        
        // Search functionality
        if (search) {
            if (typeof search === 'object') {
                query = { ...query, ...search };
            } else {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }
        }
        
        // Sorting options
        let sortOption = { createdAt: -1 };
        if (sort === 'name') sortOption = { title: 1 };
        if (sort === 'size') sortOption = { fileSize: -1 };
        
        const documents = await Document.find(query)
            .populate('userId', 'email profile.fullName')
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
            
        const total = await Document.countDocuments(query);
        
        res.json({
            documents,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific document
router.get('/:id', auth, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        // Return document data
        res.json(document);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload document
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const { title, description, visibility, metadata } = req.body;
        
        const document = new Document({
            tenantId: req.user.tenantId,
            userId: req.user._id,
            title: title || req.file.originalname,
            description,
            filename: req.file.filename,
            originalName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            filePath: req.file.path,
            visibility: visibility || 'private',
            metadata: metadata ? JSON.parse(metadata) : {}
        });
        
        await document.save();
        
        res.status(201).json(document);
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update document
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, description, visibility } = req.body;
        
        const document = await Document.findById(req.params.id);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        // Update document fields
        if (title) document.title = title;
        if (description) document.description = description;
        if (visibility) document.visibility = visibility;
        
        // Update metadata if provided
        if (req.body.metadata) {
            document.metadata = JSON.parse(req.body.metadata);
        }
        
        await document.save();
        
        res.json(document);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete document
router.delete('/:id', auth, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        // Remove file from filesystem
        if (fs.existsSync(document.filePath)) {
            fs.unlinkSync(document.filePath);
        }
        
        await Document.deleteOne({ _id: req.params.id });
        
        res.json({ message: 'Document deleted successfully' });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Share document
router.post('/:id/share', auth, async (req, res) => {
    try {
        const { accessLevel, expiresIn } = req.body;
        
        const document = await Document.findById(req.params.id);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        // Generate secure share token
        const token = require('crypto').randomBytes(32).toString('hex');
        
        const sharedLink = new SharedLink({
            documentId: document._id,
            token,
            accessLevel: accessLevel || 'view',
            expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
            createdBy: req.user._id
        });
        
        await sharedLink.save();
        
        // Create share URL
        const shareUrl = `${req.protocol}://${req.get('host')}/api/documents/shared/${token}`;
        
        res.json({
            shareUrl,
            token,
            expiresAt: sharedLink.expiresAt
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Access shared document
router.get('/shared/:token', async (req, res) => {
    try {
        const sharedLink = await SharedLink.findOne({ token: req.params.token });
        
        if (!sharedLink) {
            return res.status(404).json({ error: 'Share link not found' });
        }
        
        // Check if link has expired
        if (sharedLink.expiresAt && sharedLink.expiresAt < new Date()) {
            return res.status(410).json({ error: 'Share link expired' });
        }
        
        const document = await Document.findById(sharedLink.documentId);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        // Serve the file
        if (fs.existsSync(document.filePath)) {
            // Track usage
            sharedLink.usedCount += 1;
            await sharedLink.save();
            
            res.download(document.filePath, document.originalName);
        } else {
            res.status(404).json({ error: 'File not found on server' });
        }
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add comment to document
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const { text } = req.body;
        
        const document = await Document.findById(req.params.id);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        // Add comment to document
        document.comments.push({
            userId: req.user._id,
            text: text,
            createdAt: new Date()
        });
        
        await document.save();
        
        const populatedDoc = await Document.findById(req.params.id)
            .populate('comments.userId', 'email profile.fullName');
        
        res.json(populatedDoc.comments);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get document comments
router.get('/:id/comments', auth, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id)
            .populate('comments.userId', 'email profile.fullName')
            .select('comments');
            
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        res.json(document.comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search documents
router.post('/search', auth, async (req, res) => {
    try {
        const { query, filters } = req.body;
        
        // Build search query
        let searchQuery = {};
        
        if (query) {
            if (typeof query === 'object') {
                searchQuery = { ...searchQuery, ...query };
            } else {
                searchQuery.$or = [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ];
            }
        }
        
        // Apply additional filters
        if (filters && typeof filters === 'object') {
            searchQuery = { ...searchQuery, ...filters };
        }
        
        const documents = await Document.find(searchQuery)
            .populate('userId', 'email profile.fullName')
            .sort({ createdAt: -1 });
            
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;