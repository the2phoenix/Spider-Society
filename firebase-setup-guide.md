# Firebase Setup Guide for SpiderLink

## Step 1: Create Firebase Project (5 minutes)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Click "Add project" or "Create a project"

2. **Project Setup**
   - Project name: `Spider-Society` (or any name you prefer)
   - Click "Continue"
   - Disable Google Analytics (optional, not needed for this)
   - Click "Create project"
   - Wait for project to be created (~30 seconds)
   - Click "Continue"

## Step 2: Register Web App

1. **Add Web App**
   - In Firebase Console, click the **web icon** `</>` (Add app)
   - App nickname: `SpiderLink`
   - ✅ Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

2. **Get Firebase Config**
   - You'll see a code snippet with your config
   - It looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "spider-society.firebaseapp.com",
     projectId: "spider-society",
     storageBucket: "spider-society.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```
   - **COPY THIS ENTIRE OBJECT** - we'll need it!
   - Click "Continue to console"

## Step 3: Enable Authentication

1. **Go to Authentication**
   - In left sidebar, click "Build" → "Authentication"
   - Click "Get started"

2. **Enable Email/Password**
   - Click "Sign-in method" tab
   - Click "Email/Password"
   - Toggle "Enable" ON
   - Click "Save"

## Step 4: Enable Realtime Database

1. **Go to Realtime Database**
   - In left sidebar, click "Build" → "Realtime Database"
   - Click "Create Database"

2. **Choose Location**
   - Select your nearest location (e.g., `us-central1`)
   - Click "Next"

3. **Security Rules**
   - Start in **"test mode"** (we'll secure it properly later)
   - Click "Enable"

## Step 5: Enable Storage (for avatars)

1. **Go to Storage**
   - In left sidebar, click "Build" → "Storage"
   - Click "Get started"
   - Click "Next" → "Done"

---

## ✅ You're Done!

Now provide me with your **Firebase Config** object (the one from Step 2), and I'll integrate it into SpiderLink!

**What to send me:**
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  // ... rest of config
};
```

> **Note**: Your API key is safe to share in client-side code. Firebase's security rules protect your data.
