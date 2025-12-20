const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// In-memory notification store (in production, use database)
const notifications = new Map();

// Get user notifications
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const userNotifications = notifications.get(userId) || [];
        
        // Add some default notifications for demo
        if (userNotifications.length === 0) {
            const defaultNotifications = [
                {
                    id: Date.now() + 1,
                    type: 'welcome',
                    title: 'Welcome to TenantGuard!',
                    message: 'Your secure document management system is ready to use.',
                    timestamp: new Date(),
                    read: false,
                    icon: '👋',
                    color: 'blue'
                },
                {
                    id: Date.now() + 2,
                    type: 'security',
                    title: 'Security Update',
                    message: 'Your account security settings have been updated.',
                    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
                    read: false,
                    icon: '🔒',
                    color: 'green'
                },
                {
                    id: Date.now() + 3,
                    type: 'storage',
                    title: 'Storage Usage',
                    message: 'You are using 45% of your storage quota.',
                    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
                    read: true,
                    icon: '💾',
                    color: 'yellow'
                }
            ];
            notifications.set(userId, defaultNotifications);
        }
        
        const { unreadOnly = false, limit = 50 } = req.query;
        let userNotifs = notifications.get(userId) || [];
        
        if (unreadOnly === 'true') {
            userNotifs = userNotifs.filter(n => !n.read);
        }
        
        userNotifs = userNotifs
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, parseInt(limit));
        
        const unreadCount = (notifications.get(userId) || []).filter(n => !n.read).length;
        
        res.json({
            notifications: userNotifs,
            unreadCount,
            total: (notifications.get(userId) || []).length
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const notificationId = parseInt(req.params.id);
        
        const userNotifications = notifications.get(userId) || [];
        const notification = userNotifications.find(n => n.id === notificationId);
        
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        notification.read = true;
        notifications.set(userId, userNotifications);
        
        res.json({ message: 'Notification marked as read' });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const userNotifications = notifications.get(userId) || [];
        
        userNotifications.forEach(n => n.read = true);
        notifications.set(userId, userNotifications);
        
        res.json({ message: 'All notifications marked as read' });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create notification (internal use)
router.post('/', auth, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const { type, title, message, icon = '📢', color = 'blue' } = req.body;
        
        const notification = {
            id: Date.now(),
            type,
            title,
            message,
            timestamp: new Date(),
            read: false,
            icon,
            color
        };
        
        const userNotifications = notifications.get(userId) || [];
        userNotifications.unshift(notification);
        
        // Keep only last 100 notifications
        if (userNotifications.length > 100) {
            userNotifications.splice(100);
        }
        
        notifications.set(userId, userNotifications);
        
        res.status(201).json(notification);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const notificationId = parseInt(req.params.id);
        
        const userNotifications = notifications.get(userId) || [];
        const index = userNotifications.findIndex(n => n.id === notificationId);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        userNotifications.splice(index, 1);
        notifications.set(userId, userNotifications);
        
        res.json({ message: 'Notification deleted' });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get notification settings
router.get('/settings', auth, async (req, res) => {
    try {
        // Mock settings - in production, store in database
        const settings = {
            emailNotifications: true,
            pushNotifications: true,
            securityAlerts: true,
            storageAlerts: true,
            shareNotifications: true,
            documentUpdates: false
        };
        
        res.json(settings);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update notification settings
router.put('/settings', auth, async (req, res) => {
    try {
        const settings = req.body;
        
        // In production, save to database
        // For now, just return the updated settings
        
        res.json({
            message: 'Notification settings updated',
            settings
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;