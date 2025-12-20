const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const notifications = [
            {
                id: 1,
                type: 'info',
                message: 'Welcome to TenantGuard!',
                timestamp: new Date(),
                read: false
            },
            {
                id: 2,
                type: 'warning',
                message: 'Your trial expires in 14 days',
                timestamp: new Date(),
                read: false
            }
        ];
        
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;