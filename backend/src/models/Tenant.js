const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    subdomain: {
        type: String,
        unique: true,
        required: true
    },
    plan: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'free'
    },
    // ❌ VULNERABILITY: Payment info stored in same database
    paymentInfo: {
        cardNumber: String,  // ❌ INSECURE: Plain text storage
        expiryDate: String,
        cvv: String          // ❌ CRITICAL: Never store CVV!
    },
    settings: {
        maxStorage: { type: Number, default: 1024 }, // MB
        maxUsers: { type: Number, default: 10 }
    }
}, { timestamps: true });

// ❌ VULNERABILITY: No indexing on frequently queried fields
module.exports = mongoose.model('Tenant', tenantSchema);