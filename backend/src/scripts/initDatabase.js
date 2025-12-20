const mongoose = require('mongoose');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Document = require('../models/Document');
require('dotenv').config();

const initDatabase = async () => {
    try {
        console.log('🔄 Initializing TenantGuard Database...');
        
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tenant_shield');
        console.log('✅ Connected to MongoDB');

        await User.deleteMany({});
        await Tenant.deleteMany({});
        await Document.deleteMany({});
        console.log('🧹 Cleared existing data');

        const sampleTenant = new Tenant({
            name: 'TenantGuard Demo Corp',
            subdomain: 'demo',
            plan: 'enterprise'
        });
        await sampleTenant.save();
        console.log('🏢 Created sample tenant');

        const adminUser = new User({
            email: 'admin@tenantguard.com',
            password: 'admin123',
            role: 'admin',
            tenantId: sampleTenant._id,
            profile: {
                fullName: 'System Administrator',
                bio: 'TenantGuard system administrator'
            }
        });
        await adminUser.save();
        console.log('👤 Created admin user');

        const regularUser = new User({
            email: 'user@tenantguard.com',
            password: 'user123',
            role: 'user',
            tenantId: sampleTenant._id,
            profile: {
                fullName: 'Alemayehu Tesfaye',
                bio: 'Regular user for testing'
            }
        });
        await regularUser.save();
        console.log('👤 Created regular user');
        console.log(`
🎉 Database initialization complete!

📊 Credentials:
- Admin: admin@tenantguard.com / admin123
- User: user@tenantguard.com / user123

🚀 Start the server with: npm start
        `);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

if (require.main === module) {
    initDatabase();
}

module.exports = initDatabase;
