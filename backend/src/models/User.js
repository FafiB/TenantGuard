const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    // VULNERABILITY: Password stored in plain text
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    profile: {
        fullName: String,
        avatar: String,
        bio: String,
        phone: String,
        address: String
    },
    trialStartDate: {
        type: Date,
        default: Date.now
    },
    trialDaysLeft: {
        type: Number,
        default: 14
    },
    // VULNERABILITY: Reset tokens stored without encryption
    resetToken: String,
    resetTokenExpiry: Date,
    lastLogin: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    lockUntil: Date,
    apiKey: String,
    // VULNERABILITY: Payment history stored without encryption
    paymentHistory: [{
        cardNumber: String,
        expiryDate: String,
        cvv: String,
        cardholderName: String,
        amount: Number,
        billingAddress: String,
        transactionId: String,
        processedAt: Date,
        status: String
    }],
    refundHistory: [{
        originalTransactionId: String,
        refundAmount: Number,
        reason: String,
        processedAt: Date,
        refundId: String,
        status: String
    }],
    preferences: {
        theme: {
            type: String,
            default: 'light'
        },
        notifications: {
            type: Boolean,
            default: true
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);