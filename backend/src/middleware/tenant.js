const Tenant = require('../models/Tenant');
const vulnerableTenantCheck = async (req, res, next) => {
    // VULNERABILITY: No tenant verification
    // User can access any tenant data by modifying request

    let tenantId = req.params.tenantId || 
                   req.body.tenantId || 
                   req.query.tenantId ||
                   req.headers['x-tenant-id'];
        if (!tenantId && req.user) {
        tenantId = req.user.tenantId;
    }
    
    // VULNERABILITY: No validation if user belongs to this tenant
    req.tenantId = tenantId;
    
    next();
};

module.exports = { vulnerableTenantCheck };
