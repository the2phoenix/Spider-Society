const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // e.g., 'mission', 'dm_123_456'
    name: { type: String, required: true },
    type: { type: String, default: 'public' }, // public, private, dm
    members: [String], // Array of User IDs (for private/dm)
    createdBy: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Channel', channelSchema);
