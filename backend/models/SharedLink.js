const mongoose = require('mongoose');

const sharedLinkSchema = new mongoose.Schema({
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    },
    token: {
        type: String,
        unique: true
    },
    // ❌ VULNERABILITY: No expiry date by default
    expiresAt: Date,
    // ❌ VULNERABILITY: Access level controlled by frontend only
    accessLevel: {
        type: String,
        enum: ['view', 'edit', 'download'],
        default: 'view'
    },
    // ❌ VULNERABILITY: No usage limits
    maxUses: Number,
    usedCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('SharedLink', sharedLinkSchema);