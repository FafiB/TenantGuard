const express = require('express');
const auth = require('../middleware/auth');
const Tenant = require('../models/Tenant');
const router = express.Router();

// Get all tenants (VULNERABILITY: Information disclosure)
router.get('/', auth, async (req, res) => {
    try {
        // VULNERABILITY: List all tenants regardless of user's tenant
        const tenants = await Tenant.find({})
            .select('name subdomain settings createdAt');
            
        res.json(tenants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific tenant (VULNERABILITY: BOLA)
router.get('/:id', auth, async (req, res) => {
    try {
        // BOLA: No check if user belongs to this tenant
        const tenant = await Tenant.findById(req.params.id);
        
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        
        res.json(tenant);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;