const express = require('express');
const auth = require('../middleware/auth');
const { vulnerableTenantCheck } = require('../middleware/tenant');
const User = require('../models/User');
const Document = require('../models/Document');
const Tenant = require('../models/Tenant');
const router = express.Router();

// ❌ VULNERABILITY: User enumeration endpoint
router.get('/users', auth, async (req, res) => {
    try {
        const { search, tenantId } = req.query;
        
        let query = {};
        
        // ❌ BOLA VULNERABILITY: Allow accessing users from other tenants
        if (tenantId) {
            query.tenantId = tenantId;
        } else {
            query.tenantId = req.user.tenantId;
        }
        
        // ❌ NoSQL INJECTION: Direct user input in query
        if (search) {
            if (typeof search === 'object') {
                query = { ...query, ...search };
            } else {
                query.$or = [
                    { email: { $regex: search, $options: 'i' } },
                    { 'profile.fullName': { $regex: search, $options: 'i' } }
                ];
            }
        }
        
        const users = await User.find(query)
            .select('email profile role createdAt')
            .sort({ createdAt: -1 });
            
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ❌ VULNERABILITY: Get any user by ID (BOLA)
router.get('/users/:id', auth, async (req, res) => {
    try {
        // ❌ BOLA: No check if user belongs to same tenant
        const user = await User.findById(req.params.id)
            .select('email profile role tenantId createdAt');
            
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ❌ VULNERABILITY: Update any user (BOLA)
router.put('/users/:id', auth, async (req, res) => {
    try {
        const { email, role, profile } = req.body;
        
        // ❌ BOLA: No authorization check
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { email, role, profile },
            { new: true }
        ).select('email profile role');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ❌ VULNERABILITY: Delete any user (BOLA)
router.delete('/users/:id', auth, async (req, res) => {
    try {
        // ❌ BOLA: No authorization check
        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ❌ VULNERABILITY: Tenant information exposure
router.get('/tenants', auth, async (req, res) => {
    try {
        // ❌ VULNERABILITY: List all tenants regardless of user's tenant
        const tenants = await Tenant.find({})
            .select('name subdomain settings createdAt');
            
        res.json(tenants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ❌ VULNERABILITY: Access any tenant data (BOLA)
router.get('/tenants/:id', auth, async (req, res) => {
    try {
        // ❌ BOLA: No check if user belongs to this tenant
        const tenant = await Tenant.findById(req.params.id);
        
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        
        res.json(tenant);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ❌ VULNERABILITY: Analytics endpoint with BOLA
router.get('/analytics', auth, async (req, res) => {
    try {
        const { tenantId } = req.query;
        
        // ❌ BOLA: Allow accessing analytics for any tenant
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

// ❌ VULNERABILITY: Bulk operations without proper authorization
router.post('/bulk/documents', auth, async (req, res) => {
    try {
        const { action, documentIds, data } = req.body;
        
        // ❌ BOLA: No check if user owns these documents
        let result;
        
        switch (action) {
            case 'delete':
                result = await Document.deleteMany({ _id: { $in: documentIds } });
                break;
            case 'update':
                result = await Document.updateMany(
                    { _id: { $in: documentIds } },
                    { $set: data }
                );
                break;
            case 'share':
                result = await Document.updateMany(
                    { _id: { $in: documentIds } },
                    { $set: { visibility: 'shared' } }
                );
                break;
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
        
        res.json({ 
            message: `Bulk ${action} completed`,
            affected: result.modifiedCount || result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;