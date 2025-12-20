const mongoose = require('mongoose');

const sharedLinkSchema = new mongoose.Schema({
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // VULNERABILITY: Predictable link generation
    linkId: {
        type: String,
        required: true,
        unique: true
    },
    // VULNERABILITY: No expiration by default
    expiresAt: {
        type: Date,
        default: null
    },
    // VULNERABILITY: Weak access controls
    permissions: {
        canView: {
            type: Boolean,
            default: true
        },
        canDownload: {
            type: Boolean,
            default: true
        },
        canEdit: {
            type: Boolean,
            default: false
        }
    },
    // VULNERABILITY: No access logging
    accessCount: {
        type: Number,
        default: 0
    },
    maxAccess: {
        type: Number,
        default: null
    },
    // VULNERABILITY: Password stored in plain text
    password: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('SharedLink', sharedLinkSchema);