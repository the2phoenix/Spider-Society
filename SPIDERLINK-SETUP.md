# 🕷️ SpiderLink - Node.js Setup Guide

## Quick Start

### 1. Start the Server

Open terminal in this folder and run:

```bash
npm start
```

You should see:
```
🕷️  SpiderLink server running on http://localhost:3000
```

### 2. Open SpiderLink

Open your browser and go to:
```
http://localhost:3000/spiderlink.html
```

### 3. Create Account & Chat!

1. **Sign up** with email & password
2. **Create your Spider-Persona** (name, universe, lore, avatar)
3. **Start chatting** in real-time!

---

## Testing Real-Time Features

1. Keep the first browser window open
2. Open **another browser window** (or incognito mode)
3. Go to `http://localhost:3000/spiderlink.html`
4. Create a **second account**
5. Both windows will see each other online!
6. Messages sync instantly between both accounts

---

## Features

✅ **Real-Time Messaging** - Messages appear instantly
✅ **3 Channels** - spider-society-hq, missions-board, tech-support  
✅ **Online Status** - See who's online with green dot
✅ **User Profiles** - Click members to view their lore
✅ **Persistent Sessions** - Login/logout works perfectly

---

## Troubleshooting

**Server won't start?**
- Make sure you're in the right folder
- Run `npm install` again

**Can't connect?**
- Make sure server is running (you should see the 🕷️ message)
- Check you're going to `localhost:3000` not just opening the file

**Page shows blank?**
- Wait for the loading animation to finish
- Check browser console for errors (F12)

---

## How It Works

- **Backend**: Node.js + Express + Socket.io
- **Frontend**: Pure JavaScript + Socket.io client
- **Data Storage**: In-memory (resets when server restarts)
- **Real-Time**: Socket.io WebSocket connections

---

Enjoy your Spider-Society communication platform! 🕸️💬
