const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Use JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid token. User not found.' });
        }
        
        req.user = user;
        req.token = token;
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired.' });
        }
        
        res.status(401).json({ error: 'Authentication failed.' });
    }
};

module.exports = auth;