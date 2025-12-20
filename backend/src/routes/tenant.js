const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Document = require('../models/Document');
const router = express.Router();

// Get tenant information
router.get('/info', auth, async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.user.tenantId);
        
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        
        // Get tenant statistics
        const userCount = await User.countDocuments({ tenantId: tenant._id });
        const documentCount = await Document.countDocuments({ tenantId: tenant._id });
        
        const totalStorage = await Document.aggregate([
            { $match: { tenantId: tenant._id } },
            { $group: { _id: null, total: { $sum: '$fileSize' } } }
        ]);
        
        res.json({
            tenant: {
                id: tenant._id,
                name: tenant.name,
                subdomain: tenant.subdomain,
                plan: tenant.plan || 'basic',
                createdAt: tenant.createdAt,
                settings: tenant.settings || {}
            },
            stats: {
                users: userCount,
                documents: documentCount,
                storage: totalStorage[0]?.total || 0,
                formattedStorage: `${((totalStorage[0]?.total || 0) / 1024 / 1024).toFixed(2)} MB`
            }
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get tenant users (admin only)
router.get('/users', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { page = 1, limit = 20, search } = req.query;
        
        let query = { tenantId: req.user.tenantId };
        
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { 'profile.fullName': { $regex: search, $options: 'i' } }
            ];
        }
        
        const users = await User.find(query)
            .select('-password -resetToken')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
            
        const total = await User.countDocuments(query);
        
        // Get document counts for each user
        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                const documentCount = await Document.countDocuments({ userId: user._id });
                const storageUsed = await Document.aggregate([
                    { $match: { userId: user._id } },
                    { $group: { _id: null, total: { $sum: '$fileSize' } } }
                ]);
                
                return {
                    ...user.toObject(),
                    stats: {
                        documents: documentCount,
                        storage: storageUsed[0]?.total || 0,
                        formattedStorage: `${((storageUsed[0]?.total || 0) / 1024 / 1024).toFixed(2)} MB`
                    }
                };
            })
        );
        
        res.json({
            users: usersWithStats,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update tenant settings (admin only)
router.put('/settings', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { name, settings } = req.body;
        
        const tenant = await Tenant.findById(req.user.tenantId);
        
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        
        if (name) tenant.name = name;
        if (settings) tenant.settings = { ...tenant.settings, ...settings };
        
        await tenant.save();
        
        res.json({
            message: 'Tenant settings updated',
            tenant: {
                id: tenant._id,
                name: tenant.name,
                subdomain: tenant.subdomain,
                settings: tenant.settings
            }
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user role (admin only)
router.put('/users/:userId/role', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { role } = req.body;
        const { userId } = req.params;
        
        if (!['user', 'admin', 'moderator'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        
        const user = await User.findOne({ 
            _id: userId, 
            tenantId: req.user.tenantId 
        });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Prevent removing the last admin
        if (user.role === 'admin' && role !== 'admin') {
            const adminCount = await User.countDocuments({ 
                tenantId: req.user.tenantId, 
                role: 'admin' 
            });
            
            if (adminCount <= 1) {
                return res.status(400).json({ 
                    error: 'Cannot remove the last admin' 
                });
            }
        }
        
        user.role = role;
        await user.save();
        
        res.json({
            message: 'User role updated',
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                profile: user.profile
            }
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Invite user to tenant (admin only)
router.post('/invite', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { email, role = 'user', fullName } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Generate temporary password
        const tempPassword = Math.random().toString(36).substring(2, 15);
        
        const newUser = new User({
            email,
            password: tempPassword, // In production, hash this
            tenantId: req.user.tenantId,
            role,
            profile: { fullName },
            isInvited: true,
            mustChangePassword: true
        });
        
        await newUser.save();
        
        // In production, send invitation email
        
        res.status(201).json({
            message: 'User invited successfully',
            user: {
                id: newUser._id,
                email: newUser.email,
                role: newUser.role,
                profile: newUser.profile
            },
            tempPassword // In production, don't return this
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove user from tenant (admin only)
router.delete('/users/:userId', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { userId } = req.params;
        
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot remove yourself' });
        }
        
        const user = await User.findOne({ 
            _id: userId, 
            tenantId: req.user.tenantId 
        });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if removing last admin
        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ 
                tenantId: req.user.tenantId, 
                role: 'admin' 
            });
            
            if (adminCount <= 1) {
                return res.status(400).json({ 
                    error: 'Cannot remove the last admin' 
                });
            }
        }
        
        // In production, you might want to transfer or delete user's documents
        await User.deleteOne({ _id: userId });
        
        res.json({ message: 'User removed successfully' });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get tenant activity log (admin only)
router.get('/activity', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { limit = 50 } = req.query;
        
        // Get recent documents from all users in tenant
        const recentDocs = await Document.find({ tenantId: req.user.tenantId })
            .populate('userId', 'email profile.fullName')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .select('title createdAt userId fileType fileSize');
            
        // Get recent users
        const recentUsers = await User.find({ tenantId: req.user.tenantId })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('email profile.fullName createdAt role');
        
        const activities = [];
        
        // Add document activities
        recentDocs.forEach(doc => {
            activities.push({
                id: doc._id,
                type: 'document_upload',
                title: `${doc.userId?.profile?.fullName || doc.userId?.email} uploaded "${doc.title}"`,
                timestamp: doc.createdAt,
                icon: '📁',
                color: 'blue',
                user: doc.userId
            });
        });
        
        // Add user activities
        recentUsers.forEach(user => {
            activities.push({
                id: `user_${user._id}`,
                type: 'user_joined',
                title: `${user.profile?.fullName || user.email} joined as ${user.role}`,
                timestamp: user.createdAt,
                icon: '👤',
                color: 'green',
                user: user
            });
        });
        
        // Sort by timestamp
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json({
            activities: activities.slice(0, parseInt(limit)),
            total: activities.length
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;