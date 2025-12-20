const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Document = require('../models/Document');
const Tenant = require('../models/Tenant');
const router = express.Router();
const adminAuth = async (req, res, next) => {
    //  VULNERABILITY: Role check based on user object from JWT
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
router.get('/users', auth, adminAuth, async (req, res) => {
    try {
        // BOLA VULNERABILITY
        // Admin can see ALL users across ALL tenants
        // No tenant filtering applied
        const users = await User.find({})
            .select('-password -resetToken')
            .populate('tenantId', 'name');
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get all documents in system (BOLA - cross-tenant access)
router.get('/documents', auth, adminAuth, async (req, res) => {
    try {   
        const documents = await Document.find({})
            .populate('userId', 'email profile')
            .populate('tenantId', 'name');
        
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/users/:userId/role', auth, adminAuth, async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.role = role;
        await user.save();
        
        res.json({ message: 'User role updated', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.delete('/users/:userId', auth, adminAuth, async (req, res) => {
    try {
        // BOLA VULNERABILITY
        // Admin can delete ANY user across ALL tenants
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // VULNERABILITY: Can delete any user across tenants
        await User.deleteOne({ _id: req.params.userId });
        
        // VULNERABILITY: Orphaned documents remain
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/stats', auth, adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalDocuments = await Document.countDocuments();
        
        const storageResult = await Document.aggregate([
            { $group: { _id: null, total: { $sum: '$fileSize' } } }
        ]);
        
        const totalStorage = storageResult[0] ? 
            `${(storageResult[0].total / 1024 / 1024).toFixed(2)} MB` : '0 MB';
        
        const stats = {
            totalUsers,
            totalDocuments,
            totalStorage
        };
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});
router.post('/tenants/:tenantId/upgrade', auth, adminAuth, async (req, res) => {
    try {
        const { plan, paymentInfo } = req.body;
        const tenant = await Tenant.findById(req.params.tenantId);
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        
        // VULNERABILITY: Payment info stored without encryption
        if (paymentInfo) {
            tenant.paymentInfo = paymentInfo;
        }
        
        tenant.plan = plan;
        await tenant.save();
        
        res.json({ 
            message: 'Tenant plan upgraded',
            tenant,
            // VULNERABILITY: Payment info returned in response
            paymentProcessed: true 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;