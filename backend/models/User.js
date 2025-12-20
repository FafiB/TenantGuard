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
        bio: String
    },
    trialStartDate: {
        type: Date,
        default: Date.now
    },
    trialDaysLeft: {
        type: Number,
        default: 14
    },
    resetToken: String,
    resetTokenExpiry: Date
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);