const mongoose = require('mongoose');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Document = require('../models/Document');
require('dotenv').config();

const initDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tenantguard');
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Tenant.deleteMany({});
        await Document.deleteMany({});

        // Create demo tenant
        const demoTenant = new Tenant({
            name: 'Demo Corporation',
            subdomain: 'demo-corp',
            settings: {
                maxUsers: 100,
                maxStorage: 1000000000 // 1GB
            }
        });
        await demoTenant.save();

        // Create demo user
        const demoUser = new User({
            email: 'demo@tenantguard.com',
            password: 'demo123', // VULNERABILITY: Plaintext password
            tenantId: demoTenant._id,
            role: 'admin',
            profile: {
                fullName: 'Selemon Hailu',
                bio: 'Demo account for testing'
            }
        });
        await demoUser.save();

        // Create additional vulnerable user
        const testUser = new User({
            email: 'test@tenantguard.com',
            password: 'test123',
            tenantId: demoTenant._id,
            role: 'user',
            profile: {
                fullName: 'Test User'
            }
        });
        await testUser.save();

        // Create admin user for another tenant
        const evilTenant = new Tenant({
            name: 'Evil Corp',
            subdomain: 'evil-corp',
            settings: {
                maxUsers: 50,
                maxStorage: 500000000
            }
        });
        await evilTenant.save();

        const evilAdmin = new User({
            email: 'admin@evilcorp.com',
            password: 'admin123',
            tenantId: evilTenant._id,
            role: 'admin',
            profile: {
                fullName: 'Evil Admin'
            }
        });
        await evilAdmin.save();

        console.log('Database initialized successfully!');
        console.log('Demo credentials:');
        console.log('  Admin: demo@tenantguard.com / demo123');
        console.log('  User: test@tenantguard.com / test123');
        console.log('  Evil Admin: admin@evilcorp.com / admin123');

        process.exit(0);
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
};

initDatabase();