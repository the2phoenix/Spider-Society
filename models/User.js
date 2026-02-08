const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, unique: true }, // Optional, for OAuth
    githubId: String,
    googleId: String,

    // Profile Data
    hasProfile: { type: Boolean, default: false },
    name: String,
    earth: String,
    lore: String,
    avatar: String,

    // Status
    online: { type: Boolean, default: false },
    socketId: String,
    lastSeen: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
