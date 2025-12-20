const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const storage = multer.diskStorage({
    destination: 'public/avatars/',
    filename: (req, file, cb) => {
        cb(null, `${req.user._id}-${file.originalname}`);
    }
});
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password -resetToken');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            id: user._id,
            email: user.email,
            role: user.role,
            profile: user.profile || {},
            createdAt: user.createdAt
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});
router.put('/', auth, async (req, res) => {
    try {
        const { fullName, bio } = req.body;
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (!user.profile) {
            user.profile = {};
        }
        
        if (fullName !== undefined) user.profile.fullName = fullName;
        if (bio !== undefined) user.profile.bio = bio;
        
        await user.save();
        
        res.json({
            message: 'Profile updated successfully',
            profile: user.profile
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (req.user.password !== currentPassword) {
            return res.status(400).json({ error: 'Current password incorrect' });
        }
        if (newPassword.length < 3) {
            return res.status(400).json({ error: 'New password must be at least 3 characters' });
        }
        req.user.password = newPassword;
        await req.user.save();
        
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const avatarUrl = `/avatars/${req.file.filename}`;
        req.user.profile.avatar = avatarUrl;
        
        await req.user.save();
        
        res.json({ avatarUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/:userId', auth, async (req, res) => {
    try {
        // Allow viewing other user profiles for collaboration
        const user = await User.findById(req.params.userId)
            .select('email profile role');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;