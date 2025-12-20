const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const tenantRoutes = require('./routes/tenant');
const apiRoutes = require('./routes/api');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({
    // ❌ VULNERABILITY: Overly permissive CORS
    origin: '*', // Should be restricted
    credentials: true
}));

// ❌ VULNERABILITY: Helmet not configured properly
app.use(helmet({
    contentSecurityPolicy: false // ❌ Disabled CSP
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (vulnerable to directory traversal)
app.use('/uploads', express.static('uploads'));
app.use('/avatars', express.static('public/avatars'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api', apiRoutes);

// Dashboard stats endpoint
app.get('/api/dashboard/stats', require('./middleware/auth'), async (req, res) => {
    try {
        const Document = require('./models/Document');
        const SharedLink = require('./models/SharedLink');
        
        const documents = await Document.countDocuments({ userId: req.user._id });
        const shared = await SharedLink.countDocuments({ createdBy: req.user._id });
        
        const totalSize = await Document.aggregate([
            { $match: { userId: req.user._id } },
            { $group: { _id: null, total: { $sum: '$fileSize' } } }
        ]);
        
        res.json({
            documents,
            storage: totalSize[0] ? `${(totalSize[0].total / 1024 / 1024).toFixed(2)} MB` : '0 MB',
            shared
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// Recent activity endpoint
app.get('/api/dashboard/activity', require('./middleware/auth'), async (req, res) => {
    try {
        const Document = require('./models/Document');
        
        const recentDocs = await Document.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title createdAt fileType');
            
        const activities = recentDocs.map(doc => ({
            type: 'upload',
            message: `${doc.title} uploaded`,
            timestamp: doc.createdAt,
            icon: '📁'
        }));
        
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        service: 'TenantGuard API'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Endpoint not found`
    });
});

module.exports = app;