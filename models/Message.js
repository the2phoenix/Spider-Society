const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    channelId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    avatar: String,
    text: String,
    imageUrl: String,
    timestamp: { type: Date, default: Date.now },
    type: { type: String, default: 'text' }, // text, system, image
    replyTo: {
        id: String,
        text: String,
        username: String
    }
});

module.exports = mongoose.model('Message', messageSchema);
