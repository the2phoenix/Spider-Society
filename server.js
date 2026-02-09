require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const multer = require('multer');
const mongoose = require('mongoose');

// Models
const User = require('./models/User');
const Message = require('./models/Message');
const Channel = require('./models/Channel');

const app = express();
app.enable('trust proxy');
const server = http.createServer(app);
const io = socketIO(server);

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB');
        // Reset online status on startup
        await User.updateMany({}, { online: false });
        populateInitialContent();
        fixAvatars(); // Auto-fix existing messages
    })
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

async function fixAvatars() {
    try {
        await Message.updateMany({ username: "MIGUEL O'HARA" }, { avatar: 'miguel.png' });
        await Message.updateMany({ username: 'LYLA' }, { avatar: 'lyla.png' });
        await Message.updateMany({ username: '🕷️ ARCHIVE BOT' }, { avatar: 'lyla.png' });
        // Also fix Admin messages if needed
        const adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
        if (adminUser) {
            await Message.updateMany({ userId: adminUser._id }, { avatar: ADMIN_PFP });
        }
        console.log('✅ Fixed System Avatars');
    } catch (e) { console.error('Fix Avatar Error:', e); }
}

const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
const productionUrl = 'https://spider-society-nhfw.onrender.com';
const ADMIN_PFP = 'admin.jpg';

// Session Config (MemoryStore is sufficient for now, for production consider MongoStore)
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'spider_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction, // Secure in production
        maxAge: 24 * 60 * 60 * 1000
    }
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// In-memory session mapping (socket.id -> user._id/uid)
const sessions = {};

// ... (populateInitialContent function remains here, we skip it in replacement only if contiguous) ...
// ACTUALLY, I cannot skip the function content if I want to keep the file valid.
// I will just replace the top block and the strategy blocks separately to avoid huge replacements.

// RE-STRATEGY: Use multi_replace to be surgical.


// ... (populateInitialContent function remains here, we skip it in replacement only if contiguous) ...
// ACTUALLY, I cannot skip the function content if I want to keep the file valid.
// I will just replace the top block and the strategy blocks separately to avoid huge replacements.

// RE-STRATEGY: Use multi_replace to be surgical.


// --- POPULATE INITIAL CONTENT ---
async function populateInitialContent() {
    try {
        // 1. RULES CHANNEL MESSAGES
        const rulesCount = await Message.countDocuments({ channelId: 'rules' });
        if (rulesCount === 0) {
            const rules = [
                "**PROTOCOL 1: THE GREAT WEB**\nWe are the antibodies of the multiverse. Our task is to protect the strands that hold existence together.",
                "**PROTOCOL 2: ANOMALY CONTAINMENT**\nAnomalies threaten the stability of the host dimension. Locate, contain, and return them immediately.",
                "**PROTOCOL 3: DIMENSIONAL WATCHES**\nAll agents must maintain watch synchronization. Failure to do so will result in cellular decay.",
                "**PROTOCOL 4: CANON EVENTS**\nThese are absolute points in time. Disrupting a Canon Event can destroy an entire universe.",
                "**PROTOCOL 5: GO-HOME MACHINE**\nCaptured anomalies must be sent back to their native dimension via the Go-Home Machine."
            ];

            for (let i = 0; i < rules.length; i++) {
                await Message.create({
                    channelId: 'rules',
                    userId: 'SYSTEM',
                    username: 'LYLA',
                    avatar: 'lyla.png',
                    text: rules[i],
                    type: 'system',
                    timestamp: Date.now() - (1000000 - i * 1000)
                });
            }
            console.log("✅ Populated Rules");
        }

        // 2. MISSION BOARD
        const missionCount = await Message.countDocuments({ channelId: 'missions-board' });
        if (missionCount === 0) {
            await Message.create({
                channelId: 'missions-board',
                userId: 'SYSTEM',
                username: "MIGUEL O'HARA",
                avatar: 'miguel.png',
                text: "⚠️ **ANOMALY DETECTED**\n**Location:** Earth-65\n**Threat Level:** 4\n**Target:** Vulture (Variant)\n**Status:** OPEN - NEED 2 AGENTS",
                timestamp: Date.now()
            });
            console.log("✅ Populated Mission Board");
        }

        // 3. DEFAULT CHANNELS (Ensure they exist in DB if using Channel model for metadata)
        // For now we rely on static list + dynamic query
    } catch (err) {
        console.error("Error populating content:", err);
    }
}

// Passport Serialization
passport.serializeUser((user, done) => {
    done(null, user.id); // Uses MongoDB _id
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: isProduction ? `${productionUrl}/auth/google/callback` : "/auth/google/callback",
    proxy: true
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
            user = await User.create({
                username: 'user_' + Date.now(),
                email: profile.emails[0].value,
                password: 'oauth_dummy_password', // Not used
                name: profile.displayName,
                googleId: profile.id,
                hasProfile: false
            });
        } else if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
        }
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: isProduction ? `${productionUrl}/auth/github/callback` : "/auth/github/callback",
    proxy: true
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.username}@github.com`;
        let user = await User.findOne({ githubId: profile.id });
        if (!user) user = await User.findOne({ email: email });

        if (!user) {
            user = await User.create({
                username: profile.username || 'user_' + Date.now(),
                email: email,
                password: 'oauth_dummy_password',
                name: profile.displayName || profile.username,
                githubId: profile.id,
                hasProfile: false
            });
        } else if (!user.githubId) {
            user.githubId = profile.id;
            await user.save();
        }
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// Routes
// ... Auth Routes ...
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/spiderlink.html' }),
    (req, res) => res.redirect('/spiderlink.html')
);

app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/spiderlink.html' }),
    (req, res) => res.redirect('/spiderlink.html')
);

app.get('/auth/me', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            loggedIn: true,
            uid: req.user._id, // Use _id as uid reference
            hasProfile: req.user.hasProfile,
            profile: req.user.hasProfile ? {
                name: req.user.name,
                earth: req.user.earth,
                lore: req.user.lore,
                avatar: req.user.avatar
            } : null
        });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/auth/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/spiderlink.html');
    });
});

// File Upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use /tmp for readonly filesystems (like Vercel) if needed, but for persistence we need external storage (S3/Cloudinary).
        // Since we are deploying to Render (with disk disk), local upload 'uploads' works IF it's a persistent disk or we accept it wipes on deploy.
        // For now, keep local 'uploads'
        const path = require('path');
        const fs = require('fs');
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'file-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: `/uploads/${req.file.filename}`, type });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Explicit Routes to prevent 404
app.get('/', (req, res) => {
    console.log('[SERVER] Serving index.html for root path');
    const indexPath = path.join(__dirname, 'index.html');
    if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        console.error('[SERVER] index.html NOT FOUND at ' + indexPath);
        res.status(404).send('Site is running, but index.html is missing!');
    }
});

app.get('/spiderlink', (req, res) => {
    res.sendFile(path.join(__dirname, 'spiderlink.html'));
});

// Serve static files (CSS, JS, Images) - MUST BE AFTER explicit routes if they conflict, but here it's fine
app.use(express.static(__dirname));

// --- SOCKET.IO ---
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // JOIN CHANNEL
    // JOIN CHANNEL
    socket.on('joinChannel', async (channelId) => {
        socket.join(channelId);
        // Load last 50 messages
        const messages = await Message.find({ channelId: channelId })
            .sort({ timestamp: 1 })
            .limit(100);

        // Fetch Admin User for comparison
        const adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
        const adminId = adminUser ? adminUser._id.toString() : null;

        socket.emit('messageHistory', messages.map(m => ({
            id: m._id,
            userId: m.userId,
            userName: m.username,
            userAvatar: m.avatar,
            text: m.text,
            mediaUrl: m.imageUrl, // Map to legacy field name for frontend compatibility
            timestamp: m.timestamp.getTime(),
            channel: m.channelId,
            isAdmin: (m.userId && adminId && m.userId.toString() === adminId)
        })));
    });

    // GET CHANNELS
    socket.on('getChannels', async (callback) => {
        // Static channels
        const staticChannels = [
            { id: 'rules', name: 'rules', type: 'public', locked: true },
            { id: 'hq', name: 'spider-society-hq', type: 'public' },
            { id: 'lore-archive', name: 'lore-archive', type: 'public', locked: true },
            { id: 'missions-board', name: 'missions-board', type: 'public' },
            { id: 'tech-support', name: 'tech-support', type: 'public' }
        ];

        // Dynamic channels from DB
        const dbChannels = await Channel.find({});
        const dynamicChannels = dbChannels.map(c => ({
            id: c.id,
            name: c.name,
            type: c.type
        }));

        // Merge, avoiding duplicates
        const allChannels = [...staticChannels];
        dynamicChannels.forEach(dc => {
            if (!allChannels.find(sc => sc.id === dc.id)) {
                allChannels.push(dc);
            }
        });

        callback(allChannels);
    });

    // CREATE CHANNEL
    socket.on('createChannel', async (data, callback) => {
        const uid = sessions[socket.id];
        if (!uid) return callback({ success: false, error: 'Not authenticated' });

        let channelName = '';
        let members = [];
        if (typeof data === 'object' && data.name) {
            channelName = data.name;
            members = data.members || [];
        } else {
            channelName = data;
        }

        const safeName = channelName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

        // Check existence
        const existing = await Channel.findOne({ id: safeName });
        if (existing) return callback({ success: false, error: 'Channel exists' });

        await Channel.create({
            id: safeName,
            name: safeName,
            type: 'public',
            members: members,
            createdBy: uid
        });

        io.emit('channelCreated', { id: safeName, name: safeName, type: 'public' });
        callback({ success: true, channel: safeName });
    });

    // GET PRIVATE CONVERSATION
    socket.on('getPrivateConversation', (targetUid, callback) => {
        const myUid = sessions[socket.id];
        if (!myUid) return callback({ success: false, error: 'Not authenticated' });

        const ids = [myUid, targetUid].sort();
        const dmChannelId = `dm_${ids[0]}_${ids[1]}`;
        // No need to create explicit channel record for DMs unless we want to listing logic later
        callback({ success: true, channelId: dmChannelId });
    });

    // GET MEMBERS (Sidebar)
    socket.on('getMembers', async (callback) => {
        // Return online members with profiles
        const onlineUsers = await User.find({ hasProfile: true, online: true });
        callback(onlineUsers.map(u => ({
            uid: u._id,
            name: u.name,
            earth: u.earth,
            avatar: u.avatar,
            online: true,
            isAdmin: u.email === process.env.ADMIN_EMAIL
        })));
    });

    // GET ALL USERS (Squad Invite)
    socket.on('getAllUsers', async (callback) => {
        const allUsers = await User.find({ hasProfile: true });
        callback(allUsers.map(u => ({
            uid: u._id,
            name: u.name,
            earth: u.earth,
            avatar: u.avatar,
            online: u.online,
            isAdmin: u.email === process.env.ADMIN_EMAIL
        })));
    });

    // AUTHENTICATE SOCKET
    socket.on('authenticate', async (uid) => {
        try {
            const user = await User.findById(uid);
            if (user) {
                sessions[socket.id] = uid;
                user.online = true;
                user.socketId = socket.id;
                await user.save();

                // Broadcast
                const onlineUsers = await User.find({ hasProfile: true, online: true });
                io.emit('membersUpdate', onlineUsers.map(u => ({
                    uid: u._id, name: u.name, earth: u.earth, avatar: u.avatar, online: true,
                    isAdmin: u.email === process.env.ADMIN_EMAIL
                })));

                socket.emit('permissions', { isAdmin: user.email === process.env.ADMIN_EMAIL });
            }
        } catch (e) { console.error(e); }
    });

    // SAVE CHARACTER
    socket.on('saveCharacter', async (data, callback) => {
        const uid = sessions[socket.id];
        if (!uid) return callback({ success: false, error: 'User not found' });

        try {
            const user = await User.findById(uid);
            user.name = data.name;
            user.earth = data.earth;
            user.lore = data.lore;
            if (user.email === process.env.ADMIN_EMAIL) {
                user.avatar = ADMIN_PFP;
            } else {
                user.avatar = data.avatar;
            }
            user.hasProfile = true;
            await user.save();

            // Archive Entry
            await Message.create({
                channelId: 'lore-archive',
                userId: 'SYSTEM',
                username: '🕷️ ARCHIVE BOT',
                avatar: 'lyla.png',
                text: `[NEW ENTRY] **${data.name}** (${data.earth})\n\n${data.lore}`,
                timestamp: Date.now()
            });

            // Update members list
            const onlineUsers = await User.find({ hasProfile: true, online: true });
            io.emit('membersUpdate', onlineUsers.map(u => ({
                uid: u._id, name: u.name, earth: u.earth, avatar: u.avatar, online: true,
                isAdmin: u.email === process.env.ADMIN_EMAIL
            })));

            callback({ success: true });
        } catch (e) { callback({ success: false, error: e.message }); }
    });

    // OAUTH LOGIN
    socket.on('oauth_login', async (uid, callback) => {
        try {
            const user = await User.findById(uid);
            if (user) {
                sessions[socket.id] = uid;
                user.online = true;
                await user.save();

                // Broadcast
                const onlineUsers = await User.find({ hasProfile: true, online: true });
                io.emit('membersUpdate', onlineUsers.map(u => ({
                    uid: u._id, name: u.name, earth: u.earth, avatar: u.avatar, online: true,
                    isAdmin: u.email === process.env.ADMIN_EMAIL
                })));

                callback({
                    success: true,
                    uid: user._id,
                    hasProfile: user.hasProfile,
                    profile: user.hasProfile ? {
                        name: user.name, earth: user.earth, lore: user.lore,
                        avatar: (user.email === process.env.ADMIN_EMAIL) ? ADMIN_PFP : user.avatar,
                        isAdmin: user.email === process.env.ADMIN_EMAIL
                    } : null
                });
            } else {
                callback({ success: false, error: 'User not found' });
            }
        } catch (e) { callback({ success: false, error: e.message }); }
    });

    // SEND MESSAGE
    socket.on('sendMessage', async (data) => {
        const uid = sessions[socket.id];
        if (!uid) return;

        const user = await User.findById(uid);
        if (!user || !user.hasProfile) return;

        // Admin checks for restricted channels
        if (['rules', 'lore-archive'].includes(data.channel)) {
            if (user.email !== process.env.ADMIN_EMAIL) return;
        }

        const msg = await Message.create({
            channelId: data.channel,
            userId: user._id,
            username: user.name,
            avatar: (user.email === process.env.ADMIN_EMAIL) ? ADMIN_PFP : user.avatar,
            text: data.text || '',
            imageUrl: data.mediaUrl || null,
            type: data.mediaType || 'text',
            timestamp: Date.now()
        });

        io.emit('newMessage', {
            channel: data.channel,
            message: {
                id: msg._id,
                userId: msg.userId,
                userName: msg.username,
                userEarth: user.earth,
                userAvatar: msg.avatar,
                text: msg.text,
                mediaUrl: msg.imageUrl,
                timestamp: msg.timestamp.getTime(),
                channel: msg.channelId,
                isAdmin: user.email === process.env.ADMIN_EMAIL
            }
        });
    });

    // SET ONLINE
    socket.on('setOnline', async () => {
        const uid = sessions[socket.id];
        if (uid) {
            await User.findByIdAndUpdate(uid, { online: true });
            const onlineUsers = await User.find({ hasProfile: true, online: true });
            io.emit('membersUpdate', onlineUsers.map(u => ({
                uid: u._id, name: u.name, earth: u.earth, avatar: u.avatar, online: true,
                isAdmin: u.email === process.env.ADMIN_EMAIL
            })));
        }
    });

    // DELETE MESSAGE
    socket.on('deleteMessage', async (data, callback) => {
        const uid = sessions[socket.id];
        if (!uid) return callback({ success: false, error: 'Auth error' });

        const msg = await Message.findById(data.messageId);
        if (!msg) return callback({ success: false, error: 'Not found' });

        const user = await User.findById(uid);
        const isAdmin = user.email === process.env.ADMIN_EMAIL;

        if (msg.userId.toString() !== uid.toString() && !isAdmin) {
            return callback({ success: false, error: 'Unauthorized' });
        }

        await Message.deleteOne({ _id: data.messageId });
        io.emit('messageDeleted', { channel: data.channel, messageId: data.messageId });
        callback({ success: true });
    });

    // DISCONNECT
    socket.on('disconnect', async () => {
        const uid = sessions[socket.id];
        if (uid) {
            await User.findByIdAndUpdate(uid, { online: false });
            delete sessions[socket.id];

            const onlineUsers = await User.find({ hasProfile: true, online: true });
            io.emit('membersUpdate', onlineUsers.map(u => ({
                uid: u._id, name: u.name, earth: u.earth, avatar: u.avatar, online: true,
                isAdmin: u.email === process.env.ADMIN_EMAIL
            })));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🕷️  SpiderLink server running on http://localhost:${PORT}`);
});
