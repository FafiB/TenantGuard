const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Document = require('../models/Document');
const Tenant = require('../models/Tenant');
const router = express.Router();

const adminAuth = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Get all users (BOLA vulnerability)
router.get('/users', auth, adminAuth, async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password -resetToken')
            .populate('tenantId', 'name');
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all documents (BOLA vulnerability)
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

// Update user role
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

// Delete user (BOLA vulnerability)
router.delete('/users/:userId', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        await User.deleteOne({ _id: req.params.userId });
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get system stats
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

// Upgrade tenant plan (VULNERABILITY: Payment info stored without encryption)
router.post('/tenants/:tenantId/upgrade', auth, adminAuth, async (req, res) => {
    try {
        const { plan, paymentInfo } = req.body;
        const tenant = await Tenant.findById(req.params.tenantId);
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        
        if (paymentInfo) {
            tenant.paymentInfo = paymentInfo;
        }
        
        tenant.plan = plan;
        await tenant.save();
        
        res.json({ 
            message: 'Tenant plan upgraded',
            tenant,
            paymentProcessed: true 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;