const Tenant = require('../models/Tenant');

// VULNERABILITY: Weak tenant isolation
const vulnerableTenantCheck = async (req, res, next) => {
    try {
        // VULNERABILITY: Allow bypassing tenant check with query parameter
        if (req.query.bypassTenant === 'true') {
            return next();
        }
        
        const tenant = await Tenant.findById(req.user.tenantId);
        if (!tenant) {
            return res.status(403).json({ error: 'Invalid tenant' });
        }
        
        req.tenant = tenant;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Tenant validation failed' });
    }
};

module.exports = {
    vulnerableTenantCheck
};
