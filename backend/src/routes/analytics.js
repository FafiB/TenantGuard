const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Document = require('../models/Document');
const router = express.Router();

// Get analytics data (VULNERABILITY: BOLA - can access other tenant data)
router.get('/stats', auth, async (req, res) => {
    try {
        const { tenantId } = req.query;
        
        // BOLA: Allow accessing analytics for any tenant
        const targetTenantId = tenantId || req.user.tenantId;
        
        const totalUsers = await User.countDocuments({ tenantId: targetTenantId });
        const totalDocuments = await Document.countDocuments({ tenantId: targetTenantId });
        
        const documentsByType = await Document.aggregate([
            { $match: { tenantId: targetTenantId } },
            { $group: { _id: '$fileType', count: { $sum: 1 } } }
        ]);
        
        const storageUsed = await Document.aggregate([
            { $match: { tenantId: targetTenantId } },
            { $group: { _id: null, total: { $sum: '$fileSize' } } }
        ]);
        
        res.json({
            totalUsers,
            totalDocuments,
            documentsByType,
            storageUsed: storageUsed[0] ? storageUsed[0].total : 0,
            tenantId: targetTenantId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;