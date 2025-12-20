const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    subdomain: {
        type: String,
        required: true,
        unique: true
    },
    settings: {
        maxUsers: {
            type: Number,
            default: 50
        },
        maxStorage: {
            type: Number,
            default: 1000000000
        },
        features: {
            type: [String],
            default: ['basic']
        }
    },
    plan: {
        type: String,
        enum: ['free', 'basic', 'premium', 'enterprise'],
        default: 'free'
    },
    // VULNERABILITY: Payment info stored without encryption
    paymentInfo: {
        cardNumber: String,
        expiryDate: String,
        cvv: String,
        cardholderName: String,
        billingAddress: String
    },
    lastPayment: {
        cardNumber: String,
        expiryDate: String,
        cvv: String,
        cardholderName: String,
        amount: Number,
        billingAddress: String,
        processedAt: Date,
        transactionId: String,
        status: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);