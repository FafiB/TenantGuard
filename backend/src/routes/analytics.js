const express = require('express');
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const SharedLink = require('../models/SharedLink');
const User = require('../models/User');
const router = express.Router();

// Dashboard analytics
router.get('/dashboard', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const tenantId = req.user.tenantId;
        
        // Get document stats
        const documentStats = await Document.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: null,
                    totalDocuments: { $sum: 1 },
                    totalSize: { $sum: '$fileSize' },
                    avgSize: { $avg: '$fileSize' }
                }
            }
        ]);
        
        // Get sharing stats
        const shareStats = await SharedLink.aggregate([
            { $match: { createdBy: userId } },
            {
                $group: {
                    _id: null,
                    totalShares: { $sum: 1 },
                    totalViews: { $sum: '$usedCount' }
                }
            }
        ]);
        
        // Get recent activity
        const recentDocs = await Document.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title createdAt fileType fileSize');
            
        // Document type breakdown
        const typeBreakdown = await Document.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: '$fileType',
                    count: { $sum: 1 },
                    totalSize: { $sum: '$fileSize' }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        res.json({
            documents: {
                total: documentStats[0]?.totalDocuments || 0,
                totalSize: documentStats[0]?.totalSize || 0,
                avgSize: documentStats[0]?.avgSize || 0,
                formattedSize: `${((documentStats[0]?.totalSize || 0) / 1024 / 1024).toFixed(2)} MB`
            },
            sharing: {
                totalShares: shareStats[0]?.totalShares || 0,
                totalViews: shareStats[0]?.totalViews || 0
            },
            recentActivity: recentDocs.map(doc => ({
                type: 'upload',
                title: doc.title,
                timestamp: doc.createdAt,
                fileType: doc.fileType,
                size: `${(doc.fileSize / 1024).toFixed(1)} KB`,
                icon: getFileIcon(doc.fileType)
            })),
            typeBreakdown: typeBreakdown.map(type => ({
                type: type._id,
                count: type.count,
                size: type.totalSize,
                formattedSize: `${(type.totalSize / 1024 / 1024).toFixed(2)} MB`,
                icon: getFileIcon(type._id)
            }))
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Storage analytics
router.get('/storage', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Monthly storage usage
        const monthlyUsage = await Document.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    totalSize: { $sum: '$fileSize' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $limit: 12 }
        ]);
        
        // Storage by file type
        const storageByType = await Document.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: '$fileType',
                    totalSize: { $sum: '$fileSize' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalSize: -1 } }
        ]);
        
        res.json({
            monthlyUsage: monthlyUsage.map(item => ({
                month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
                size: item.totalSize,
                formattedSize: `${(item.totalSize / 1024 / 1024).toFixed(2)} MB`,
                count: item.count
            })),
            storageByType: storageByType.map(item => ({
                type: item._id,
                size: item.totalSize,
                formattedSize: `${(item.totalSize / 1024 / 1024).toFixed(2)} MB`,
                count: item.count,
                percentage: 0 // Will be calculated on frontend
            }))
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Activity feed
router.get('/activity', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 20, page = 1 } = req.query;
        
        // Get recent documents
        const recentDocs = await Document.find({ userId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((page - 1) * limit)
            .select('title createdAt fileType updatedAt');
            
        // Get recent shares
        const recentShares = await SharedLink.find({ createdBy: userId })
            .populate('documentId', 'title')
            .sort({ createdAt: -1 })
            .limit(10)
            .select('documentId createdAt usedCount');
        
        const activities = [];
        
        // Add document activities
        recentDocs.forEach(doc => {
            activities.push({
                id: doc._id,
                type: 'document_upload',
                title: `Uploaded "${doc.title}"`,
                timestamp: doc.createdAt,
                icon: '📁',
                color: 'blue'
            });
            
            if (doc.updatedAt > doc.createdAt) {
                activities.push({
                    id: `${doc._id}_update`,
                    type: 'document_update',
                    title: `Updated "${doc.title}"`,
                    timestamp: doc.updatedAt,
                    icon: '✏️',
                    color: 'green'
                });
            }
        });
        
        // Add sharing activities
        recentShares.forEach(share => {
            activities.push({
                id: share._id,
                type: 'document_share',
                title: `Shared "${share.documentId?.title || 'Document'}"`,
                timestamp: share.createdAt,
                icon: '🔗',
                color: 'purple',
                metadata: { views: share.usedCount }
            });
        });
        
        // Sort by timestamp
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json({
            activities: activities.slice(0, parseInt(limit)),
            total: activities.length,
            page: parseInt(page)
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function getFileIcon(fileType) {
    if (!fileType) return '📄';
    
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return '📕';
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    if (type.includes('text')) return '📝';
    if (type.includes('word') || type.includes('doc')) return '📘';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📈';
    if (type.includes('zip') || type.includes('rar')) return '🗜️';
    return '📄';
}

module.exports = router;