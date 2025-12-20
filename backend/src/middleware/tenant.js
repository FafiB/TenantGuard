const Tenant = require('../models/Tenant');
const vulnerableTenantCheck = async (req, res, next) => {
    // ❌ VULNERABILITY: No tenant verification
    // User can access any tenant data by modifying request
    
    // Get tenant from query param, body, or header
    let tenantId = req.params.tenantId || 
                   req.body.tenantId || 
                   req.query.tenantId ||
                   req.headers['x-tenant-id'];
    
    // If no tenant specified, use user's tenant
    if (!tenantId && req.user) {
        tenantId = req.user.tenantId;
    }
    
    // ❌ VULNERABILITY: No validation if user belongs to this tenant
    req.tenantId = tenantId;
    
    next();
};

// Secure tenant middleware
const secureTenantCheck = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Get requested tenant
        let requestedTenantId = req.params.tenantId || 
                               req.body.tenantId || 
                               req.query.tenantId;
        
        // If no tenant specified, use user's tenant
        if (!requestedTenantId) {
            requestedTenantId = req.user.tenantId;
        }
        
        // ✅ SECURE: Verify user belongs to requested tenant
        if (requestedTenantId.toString() !== req.user.tenantId._id.toString()) {
            // Check if user is admin (can access multiple tenants)
            if (req.user.role !== 'admin') {
                // Log unauthorized access attempt
                await AuditLog.create({
                    userId: req.user._id,
                    action: 'unauthorized_tenant_access',
                    details: {
                        attemptedTenant: requestedTenantId,
                        userTenant: req.user.tenantId._id
                    },
                    ip: req.ip
                });
                
                return res.status(403).json({ 
                    error: 'Access denied to this tenant' 
                });
            }
        }
        
        // Get tenant details
        const tenant = await Tenant.findById(requestedTenantId);
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        
        req.tenant = tenant;
        req.tenantId = requestedTenantId;
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Tenant verification failed' });
    }
}

module.exports = { vulnerableTenantCheck, secureTenantCheck };