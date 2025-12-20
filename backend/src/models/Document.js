const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    filename: String,
    originalName: String,
    fileType: String,
    fileSize: Number,
    //  VULNERABILITY: File path exposed in database
    filePath: String,
    // VULNERABILITY: Access control as simple string
    visibility: {
        type: String,
        enum: ['private', 'shared', 'public'],
        default: 'private'
    },
    sharedWith: [{
        userId: mongoose.Schema.Types.ObjectId,
        permission: String // 'view' or 'edit'
    }],
    // VULNERABILITY: Comments stored with document (NoSQL injection possible)
    comments: [{
        userId: mongoose.Schema.Types.ObjectId,
        text: String,
        createdAt: Date
    }],
    metadata: {
        // VULNERABILITY: User-controlled metadata stored without validation
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);