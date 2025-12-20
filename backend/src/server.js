const app = require('./app');
const http = require('http');
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
server.listen(PORT, () => {
    console.log(`
    TenantGuard Document Management System
    =========================================
    Frontend:       http://localhost:3000
    API Base:       http://localhost:${PORT}/api
    Health Check:   http://localhost:${PORT}/health
    Database:      ${process.env.MONGODB_URI || 'mongodb://localhost:27017/tenantguard'}
    
    Available Endpoints:
    • POST /api/auth/login
    • POST /api/auth/register
    • GET  /api/documents
    • POST /api/documents/upload
    • GET  /api/profile
    • GET  /api/admin/users
    • GET  /api/analytics/stats
    =========================================
    `);
});
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    server.close(() => process.exit(1));
});