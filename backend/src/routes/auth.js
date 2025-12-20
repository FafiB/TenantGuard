const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// User registration endpoint
router.post('/register', async (req, res) => {
    try {
        const { email, password, tenantName, fullName } = req.body;
        
        // Validate required fields
        if (!email || !password || !tenantName || !fullName) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Check password length
        if (password.length < 3) {
            return res.status(400).json({ error: 'Password must be at least 3 characters' });
        }
        
        // Find existing tenant or create new one
        let existingTenant = await Tenant.findOne({ name: tenantName });
        if (!existingTenant) {
            existingTenant = new Tenant({ 
                name: tenantName,
                subdomain: tenantName.toLowerCase().replace(/\s+/g, '-')
            });
            await existingTenant.save();
        }
        
        // Create new user account
        const newUser = new User({
            email,
            password,
            tenantId: existingTenant._id,
            profile: { fullName },
            role: 'admin'
        });
        
        await newUser.save();
        
        // Generate JWT token
        const authToken = jwt.sign(
            { 
                userId: newUser._id,
                email: newUser.email,
                tenantId: newUser.tenantId,
                role: newUser.role,
                profile: newUser.profile
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        res.status(201).json({
            user: {
                id: newUser._id,
                email: newUser.email,
                profile: newUser.profile
            },
            token: authToken,
            tenant: {
                id: existingTenant._id,
                name: existingTenant.name
            }
        });
        
    } catch (registrationError) {
        console.error('Registration error:', registrationError);
        res.status(500).json({ 
            error: 'Registration failed',
            message: registrationError.message
        });
    }
});

// User login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user with matching credentials
        const existingUser = await User.findOne({ 
            email: email,
            password: password
        });
        
        if (!existingUser) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Create JWT token
        const authToken = jwt.sign(
            { 
                userId: existingUser._id,
                email: existingUser.email,
                tenantId: existingUser.tenantId,
                role: existingUser.role
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        res.json({
            user: {
                id: existingUser._id,
                email: existingUser.email,
                role: existingUser.role,
                profile: existingUser.profile
            },
            token: authToken
        });
        
    } catch (loginError) {
        res.status(500).json({ 
            error: 'Login failed',
            message: loginError.message
        });
    }
});

// Password reset request handler
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        const userAccount = await User.findOne({ email });
        
        if (userAccount) {
            // Generate password reset token
            const resetToken = Math.random().toString(36).substring(2);
            userAccount.resetToken = resetToken;
            userAccount.resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
            
            await userAccount.save();
            
            // In production, this would be sent via email
            res.json({ 
                message: 'Reset token generated',
                resetToken: resetToken
            });
        } else {
            res.json({ message: 'If user exists, reset email sent' });
        }
        
    } catch (resetError) {
        res.status(500).json({ error: resetError.message });
    }
});

module.exports = router;