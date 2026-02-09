// Socket.io connection (Force websocket/polling for Render stability)
const socket = io({
    transports: ['websocket', 'polling'],
    withCredentials: true
});

// Connection error handling
socket.on('connect_error', (error) => {
    const loader = document.getElementById('loaderContainer');
    if (loader) {
        loader.innerHTML = `
            <div style="text-align: center; padding: 40px; max-width: 600px;">
                <h1 style="color: #e62429; font-family: 'Bebas Neue', sans-serif; font-size: 3rem; margin-bottom: 20px;">
                    ⚠️ SERVER NOT RUNNING
                </h1>
                <p style="color: #fff; font-size: 1.2rem; margin-bottom: 30px;">
                    SpiderLink requires the Node.js server to be running.
                </p>
                <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; text-align: left; font-family: 'Courier New', monospace; color: #0ff; margin-bottom: 30px;">
                    <p style="margin-bottom: 10px;"><strong style="color: #fff;">To start the server:</strong></p>
                    <p style="margin-left: 20px;">1. Run <span style="color: #e62429;">START-SPIDERLINK.bat</span></p>
                    <p style="margin-left: 20px;">OR</p>
                    <p style="margin-left: 20px;">2. Open terminal and run: <span style="color: #e62429;">npm start</span></p>
                </div>
                <button onclick="location.reload()" style="background: #e62429; color: white; border: none; padding: 15px 40px; font-size: 1.2rem; font-family: 'Bebas Neue', sans-serif; cursor: pointer; letter-spacing: 2px; border-radius: 5px;">
                    TRY AGAIN
                </button>
                <br><br>
                <a href="home.html" style="color: #0ff; text-decoration: none; margin-top: 20px; display: inline-block;">
                    ← Back to Home
                </a>
            </div>
        `;
        loader.style.display = 'flex';
    }
});

// Global variables
let currentUser = null;
let currentChannel = 'hq';
let selectedAvatar = null;
let myUid = null;
let currentOnlineMembers = [];
let unreadCounts = {};

// Page loading animation
window.addEventListener('load', () => {
    console.log('🕷️ SpiderLink loading...');
    const line = document.getElementById('pageLoadLine');
    const loader = document.getElementById('loaderContainer');
    const content = document.querySelector('.content-wrapper');

    line.style.width = '0%';
    line.style.transition = 'width 1s ease-out, opacity 0.5s ease 1s';
    setTimeout(() => { line.style.width = '100%'; }, 100);

    setTimeout(async () => {
        line.style.opacity = '0';
        loader.style.opacity = '0';
        setTimeout(async () => {
            loader.style.display = 'none';
            content.style.opacity = '1'; // Make content visible!

            // Check for active session (OAuth)
            await checkSession();

            console.log('✅ SpiderLink loaded successfully!');
        }, 500);
    }, 1100);
});

// Check if user is already logged in via Session (OAuth)
async function checkSession() {
    try {
        const response = await fetch('/auth/me');
        const data = await response.json();

        if (data.loggedIn) {
            console.log('🕸️ Session found for user:', data.uid);
            // Authenticate socket with session UID
            socket.emit('oauth_login', data.uid, (res) => {
                if (res.success) {
                    currentUser = { uid: res.uid, isAdmin: res.profile?.isAdmin };
                    myUid = res.uid;
                    if (res.hasProfile) {
                        showChatInterface();
                        loadUserData(res.profile);
                    } else {
                        showCharacterModal();
                    }
                } else {
                    console.error('Socket auth failed:', res.error);
                    showAuthScreen();
                }
            });
        } else {
            console.log('No active session.');
            showAuthScreen();
        }
    } catch (err) {
        console.error('Session check failed:', err);
        showAuthScreen();
    }
}

// Show/Hide screens
function showAuthScreen() {
    document.querySelector('.page-content').style.display = 'block';
    document.querySelector('.global-footer').style.display = 'block';
    document.getElementById('authScreen').style.display = 'block'; // Updated to block for grid layout
    document.getElementById('characterModal').style.display = 'none';
    document.getElementById('chatInterface').style.display = 'none';
}

function showCharacterModal() {
    // Character modal is an overlay, so we might want to keep the background or hide it.
    // Let's keep the background for context but ensure modal is top.
    // Actually, usually we hide the auth form but keep the background.
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('characterModal').style.display = 'flex';
    document.getElementById('chatInterface').style.display = 'none';
}

function showChatInterface() {
    document.querySelector('.page-content').style.display = 'none';
    document.querySelector('.global-footer').style.display = 'none';
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('characterModal').style.display = 'none';
    document.getElementById('chatInterface').style.display = 'flex';
}

// Toggle between login and signup
document.getElementById('showSignup').addEventListener('click', () => {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
});

document.getElementById('showLogin').addEventListener('click', () => {
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
});

// Signup
document.getElementById('signupBtn').addEventListener('click', () => {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const errorEl = document.getElementById('authError');

    socket.emit('signup', { email, password }, (response) => {
        if (response.success) {
            currentUser = { uid: response.uid, isAdmin: false };
            myUid = response.uid;
            errorEl.style.display = 'none';
            showCharacterModal();
        } else {
            errorEl.textContent = response.error;
            errorEl.style.display = 'block';
        }
    });
});

// Login
document.getElementById('loginBtn').addEventListener('click', () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('authError');

    socket.emit('login', { email, password }, (response) => {
        if (response.success) {
            currentUser = { uid: response.uid, isAdmin: response.profile?.isAdmin };
            myUid = response.uid;
            errorEl.style.display = 'none';

            if (response.hasProfile) {
                showChatInterface();
                loadUserData(response.profile);
            } else {
                showCharacterModal();
            }
        } else {
            errorEl.textContent = response.error;
            errorEl.style.display = 'block';
        }
    });
});

// Forgot Password
document.getElementById('forgotPasswordBtn').addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;

    if (!email) {
        alert('Please enter your email address first.');
        return;
    }

    socket.emit('forgotPassword', email, (response) => {
        alert(response.message);
    });
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    location.reload();
});

// Avatar selection
document.querySelectorAll('.avatar-option').forEach(img => {
    img.addEventListener('click', () => {
        document.querySelectorAll('.avatar-option').forEach(i => i.classList.remove('selected'));
        img.classList.add('selected');
        selectedAvatar = img.dataset.avatar;
    });
});

// Save character
document.getElementById('saveCharacterBtn').addEventListener('click', () => {
    const name = document.getElementById('characterName').value.trim();
    const earth = document.getElementById('characterEarth').value.trim();
    const lore = document.getElementById('characterLore').value.trim();
    const customAvatar = document.getElementById('customAvatar').value.trim();
    const avatarToUse = customAvatar || selectedAvatar;
    const errorEl = document.getElementById('characterError');

    if (!name || !earth || !lore || !avatarToUse) {
        errorEl.textContent = 'All fields are required!';
        errorEl.style.display = 'block';
        return;
    }

    socket.emit('saveCharacter', {
        name, earth, lore, avatar: avatarToUse
    }, (response) => {
        if (response.success) {
            errorEl.style.display = 'none';
            showChatInterface();
            loadUserData({ name, earth, lore, avatar: selectedAvatar });
        } else {
            errorEl.textContent = response.error;
            errorEl.style.display = 'block';
        }
    });
});

// Load user data and setup chat
function loadUserData(profile) {
    document.getElementById('userDisplay').textContent = profile.name;
    document.getElementById('userDisplay').style.display = 'inline';
    document.getElementById('logoutBtn').style.display = 'inline-block';

    // Admin Check
    if (profile.isAdmin) {
        document.getElementById('adminControls').style.display = 'block';
        setupAdminControls();
    }

    // Set user online
    socket.emit('setOnline');

    // Load members
    loadMembers();

    // Setup initial channel
    currentChannel = 'hq';

    // RENDER DEFAULTS IMMEDIATELY (Optimistic UI)
    console.log('[CLIENT] Optimistically rendering default channels...');
    renderDefaultChannels();

    // Then fetch from server
    loadChannels();
    loadMessages();

    // Setup message input
    setupMessageInput();

    // Setup Channel Creation (Global listener check)
    setupChannelCreation();
}

// Global Listeners (prevent duplicates)
socket.on('membersUpdate', (members) => {
    currentOnlineMembers = members;
    displayMembers(members);
});

socket.on('channelCreated', (ch) => {
    console.log("Channel created event:", ch);
    loadChannels();
});

socket.on('newMessage', (data) => {
    console.log(`[CLIENT] received newMessage for ${data.channel}. Current: ${currentChannel}`);

    if (data.channel === currentChannel) {
        console.log(`[CLIENT] Appending message...`);
        appendMessage(data.message);
    } else {
        // Notification Logic
        console.log(`[CLIENT] Notification for ${data.channel}`);
        if (!unreadCounts[data.channel]) unreadCounts[data.channel] = 0;
        unreadCounts[data.channel]++;
        updateChannelNotification(data.channel);
    }
});

function updateChannelNotification(channelId) {
    const item = document.querySelector(`.channel-item[data-channel="${channelId}"]`);
    if (item) {
        item.classList.add('unread');
        // Optional: Add badge count if we want numbers
    }
}

// Load Channels
function loadChannels() {
    console.log('[CLIENT] Loading channels...');

    // Timeout Fallback: If server doesn't respond in 1s, show defaults
    const fallbackTimer = setTimeout(() => {
        console.warn('[CLIENT] Channel load timed out. Using defaults.');
        renderDefaultChannels();
    }, 1000);

    socket.emit('getChannels', (channelList) => {
        clearTimeout(fallbackTimer);
        if (!channelList || channelList.length === 0) {
            renderDefaultChannels();
            return;
        }
        renderChannelList(channelList);
    });
}

function renderDefaultChannels() {
    const defaults = [
        { id: 'rules', name: 'rules', type: 'public' },
        { id: 'hq', name: 'spider-society-hq', type: 'public' },
        { id: 'lore-archive', name: 'lore-archive', type: 'public' },
        { id: 'missions-board', name: 'missions-board', type: 'public' },
        { id: 'tech-support', name: 'tech-support', type: 'public' }
    ];
    renderChannelList(defaults);
}

function renderChannelList(channels) {
    const list = document.querySelector('.channel-list');
    if (!list) return;
    list.innerHTML = '';

    channels.forEach(ch => {
        const item = document.createElement('div');
        item.className = `channel-item ${ch.id === currentChannel ? 'active' : ''}`;
        if (unreadCounts[ch.id] && unreadCounts[ch.id] > 0) {
            item.classList.add('unread');
        }
        item.dataset.channel = ch.id;

        // Color coding for special channels
        let colorStyle = '';
        if (ch.id === 'rules') colorStyle = 'color: #e62429;';
        if (ch.id === 'lore-archive') colorStyle = 'color: #0ff;';

        item.innerHTML = `
                <span class="channel-icon">#</span>
                <span style="${colorStyle}">${ch.name}</span>
                <div class="unread-badge"></div>
            `;

        item.addEventListener('click', () => {
            switchChannel(ch.id);
        });

        list.appendChild(item);
    });

    // Ensure active channel is highlighted
    const activeItem = list.querySelector(`.channel-item[data-channel="${currentChannel}"]`);
    if (activeItem) activeItem.classList.add('active');
}

function switchChannel(channelId) {
    if (currentChannel === channelId) return;

    document.querySelectorAll('.channel-item').forEach(i => i.classList.remove('active'));

    // Clear notifications
    unreadCounts[channelId] = 0;
    const newActive = document.querySelector(`.channel-item[data-channel="${channelId}"]`);
    if (newActive) {
        newActive.classList.add('active');
        newActive.classList.remove('unread');
    }

    console.log(`[CLIENT] Switching channel from ${currentChannel} to ${channelId}`);
    currentChannel = channelId;

    const isDm = channelId.startsWith('dm_');
    document.getElementById('currentChannelName').textContent = isDm ? '@ Direct Message' : `# ${channelId}`;

    loadMessages();
}

// Setup Channel Creation
function setupChannelCreation() {
    const addBtn = document.getElementById('addChannelBtn');
    const modal = document.getElementById('channelModal');
    const confirmBtn = document.getElementById('createChannelConfirmBtn');
    const closeBtn = document.getElementById('closeChannelModalBtn');
    const input = document.getElementById('newChannelName');

    // Remove old listeners to be safe (cloning)
    const newAddBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newAddBtn, addBtn);

    newAddBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
        input.value = '';

        // Populate Dropdown
        const select = document.getElementById('channelMembersSelect');
        if (select) {
            select.innerHTML = '<option disabled>Loading...</option>';

            socket.emit('getAllUsers', (members) => {
                select.innerHTML = '';
                // Filter out self
                const availableMembers = members.filter(m => m.uid !== (currentUser ? currentUser.uid : null));

                if (availableMembers.length === 0) {
                    const opt = document.createElement('option');
                    opt.text = "-- No other agents registered --";
                    opt.disabled = true;
                    select.appendChild(opt);
                } else {
                    // Sort: Online first, then Alphabetical
                    availableMembers.sort((a, b) => {
                        if (a.online === b.online) return a.name.localeCompare(b.name);
                        return a.online ? -1 : 1;
                    });

                    availableMembers.forEach(m => {
                        const opt = document.createElement('option');
                        opt.value = m.uid;
                        const status = m.online ? 'ONLINE' : 'OFFLINE';
                        opt.text = `${m.name} (${m.earth}) - ${status}`;
                        // Optional: Styling for offline items if possible (select options have limited styling)
                        if (!m.online) opt.style.color = '#888';
                        select.appendChild(opt);
                    });
                }
            });
        }

        input.focus();
    });

    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    // Confirm Button
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', () => {
        const name = input.value.trim();
        if (!name) return;

        // Get selected members
        const select = document.getElementById('channelMembersSelect');
        const selectedMembers = select ? Array.from(select.selectedOptions).map(opt => opt.value) : [];

        socket.emit('createChannel', { name, members: selectedMembers }, (res) => {
            if (res.success) {
                modal.style.display = 'none';
                // Wait for event or reload manually
                setTimeout(() => {
                    loadChannels();
                    switchChannel(res.channel);
                }, 200);
            } else {
                alert("Error: " + res.error);
            }
        });
    });
}

// Load members list
function loadMembers() {
    socket.emit('getMembers', (members) => {
        displayMembers(members);
    });
}

function displayMembers(members) {
    const list = document.getElementById('membersList');
    const dmList = document.getElementById('dmList');
    const count = document.getElementById('memberCount');

    if (list) list.innerHTML = '';
    if (dmList) dmList.innerHTML = '';

    if (count) count.textContent = members.length;

    members.forEach(member => {
        // 1. Right Sidebar (All Members)
        if (list) {
            const item = document.createElement('div');
            item.className = 'member-item';
            if (currentUser && member.uid === currentUser.uid) {
                item.style.border = '1px solid #e62429';
            }
            item.innerHTML = `
                <img src="${member.avatar}" alt="${member.name}" class="member-avatar">
                <div class="member-info">
                    <div class="member-name">${member.name} ${member.uid === currentUser?.uid ? '(YOU)' : ''}</div>
                    <div class="member-earth">${member.earth}</div>
                </div>
                <div class="member-status ${member.online ? 'online' : 'offline'}"></div>
            `;
            list.appendChild(item);
        }

        // 2. Left Sidebar (DM List)
        if (dmList && currentUser && member.uid !== currentUser.uid) {
            const dmItem = document.createElement('div');
            dmItem.className = 'channel-item';
            dmItem.style.cursor = 'pointer';
            dmItem.dataset.uid = member.uid;
            dmItem.innerHTML = `
                <img src="${member.avatar}" style="width:20px; height:20px; border-radius:50%; margin-right:10px;">
                <span>@${member.name}</span>
                <span style="width:8px; height:8px; background:${member.online ? '#0f0' : '#666'}; border-radius:50%; margin-left:auto;"></span>
            `;

            dmItem.onclick = () => {
                socket.emit('getPrivateConversation', member.uid, (res) => {
                    if (res.success) {
                        switchChannel(res.channelId);
                        document.getElementById('currentChannelName').textContent = `@ ${member.name}`;
                    } else {
                        alert("Error: " + res.error);
                    }
                });
            };
            dmList.appendChild(dmItem);
        }
    });

    if (dmList && dmList.children.length === 0) {
        dmList.innerHTML = '<p style="padding:10px; color:#666; font-size:0.8em;">No other Spider-People online.</p>';
    }
}

// Load messages
function loadMessages() {
    // Permission Check
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendMessageBtn');
    const restrictedChannels = ['rules', 'lore-archive'];

    if (restrictedChannels.includes(currentChannel) && (!currentUser || !currentUser.isAdmin)) {
        input.disabled = true;
        input.placeholder = "🔒 READ-ONLY CHANNEL (ARCHIVE)";
        input.style.opacity = "0.5";
        input.style.cursor = "not-allowed";
        sendBtn.disabled = true;
        sendBtn.style.opacity = "0.5";
        sendBtn.style.cursor = "not-allowed";
    } else {
        input.disabled = false;
        input.placeholder = `Message #${currentChannel}`;
        input.style.opacity = "1";
        input.style.cursor = "text";
        sendBtn.disabled = false;
        sendBtn.style.opacity = "1";
        sendBtn.style.cursor = "pointer";
    }

    const container = document.getElementById('messagesContainer');
    container.innerHTML = '<p style="color:#666; text-align:center; padding:20px;">Loading...</p>';

    // Request to join channel and get history
    socket.emit('joinChannel', currentChannel);
}

// Socket: Message History (Received after joinChannel)
socket.on('messageHistory', (messages) => {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = ''; // Clear loading text

    if (!messages || messages.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 50px;">No messages yet. Start the conversation!</p>';
        return;
    }

    messages.forEach(msg => {
        appendMessage(msg);
    });

    container.scrollTop = container.scrollHeight;
});

// Text Scrambler Effect (Encryption Visual)
function scrambleText(element, finalText) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let iterations = 0;
    const interval = setInterval(() => {
        element.innerText = finalText.split('').map((char, index) => {
            if (index < iterations) return finalText[index];
            return chars[Math.floor(Math.random() * chars.length)];
        }).join('');

        if (iterations >= finalText.length) {
            clearInterval(interval);
            element.innerText = finalText;
        }
        iterations += 1 / 2;
    }, 30);
}

function appendMessage(msg) {
    const container = document.getElementById('messagesContainer');

    // Remove "no messages" text if present
    if (container.querySelector('p')) {
        container.innerHTML = '';
    }

    // Check for deletion rights (Author or Admin)
    const canDelete = currentUser && (currentUser.uid === msg.userId || currentUser.isAdmin);

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.dataset.id = msg.id; // Store ID for deletion
    messageDiv.innerHTML = `
        <img src="${msg.userAvatar}" alt="${msg.userName}" class="message-avatar">
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${msg.userName} ${msg.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}</span>
                <span class="message-earth">${msg.userEarth}</span>
                <span class="message-timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span>
                ${canDelete ? `<button class="delete-msg-btn" title="Delete Message" onclick="deleteMessage(${msg.id})">🗑️</button>` : ''}
            </div>
            ${msg.text ? `<div class="message-text" id="msg-text-${msg.id}" style="font-family: 'Courier New', monospace;"></div>` : ''}
            ${msg.mediaUrl && msg.mediaType === 'image' ? `<img src="${msg.mediaUrl}" class="message-media" onclick="window.open(this.src, '_blank')">` : ''}
            ${msg.mediaUrl && msg.mediaType === 'video' ? `<video src="${msg.mediaUrl}" controls class="message-media"></video>` : ''}
        </div>
    `;

    container.appendChild(messageDiv);

    // Animate text
    if (msg.text) {
        const textEl = messageDiv.querySelector(`#msg-text-${msg.id}`);
        if (textEl) scrambleText(textEl, msg.text);
    }

    container.scrollTop = container.scrollHeight;
}

// ... deleteMessage moved to end of file ...

// Socket event for deletion
socket.on('messageDeleted', (data) => {
    // Only remove if we are in the same channel
    if (data.channel === currentChannel) {
        const msgDiv = document.querySelector(`.message[data-id="${data.messageId}"]`);
        if (msgDiv) {
            msgDiv.remove();
        }
    }
});


// Setup message input
function setupMessageInput() {
    const sendBtn = document.getElementById('sendMessageBtn');
    const input = document.getElementById('messageInput');
    const emojiBtn = document.getElementById('emojiBtn');
    const attachBtn = document.getElementById('attachBtn');
    const fileInput = document.getElementById('chatFileUpload');
    const pickerContainer = document.getElementById('emojiPickerContainer');

    // Initialize PicMo
    let picker;
    try {
        const { createPicker } = window.picmo;
        picker = createPicker({
            rootElement: pickerContainer,
            theme: 'dark' // Assuming dark mode
        });

        picker.addEventListener('emoji:select', (selection) => {
            input.value += selection.emoji;
            pickerContainer.style.display = 'none';
            input.focus();
        });
    } catch (e) {
        console.warn("PicMo not loaded", e);
        emojiBtn.style.display = 'none';
    }

    // Toggle Emoji Picker
    emojiBtn.addEventListener('click', () => {
        pickerContainer.style.display = pickerContainer.style.display === 'none' ? 'block' : 'none';
    });

    // Attachment
    attachBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file); // Generic 'file' field now

        // Optional: Show uploading status
        const originalPlaceholder = input.placeholder;
        input.placeholder = "Uploading media...";
        input.disabled = true;

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.url) {
                // Send message with media
                socket.emit('sendMessage', {
                    channel: currentChannel,
                    text: input.value.trim(), // Send existing text if any
                    mediaUrl: data.url,
                    mediaType: data.type
                });
                input.value = '';
            } else {
                alert("Upload failed: " + (data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert("Upload error");
        } finally {
            input.placeholder = originalPlaceholder;
            input.disabled = false;
            fileInput.value = ''; // Reset
        }
    });


    const sendMessage = () => {
        const text = input.value.trim();
        if (!text) return;

        socket.emit('sendMessage', {
            channel: currentChannel,
            text: text
        });

        input.value = '';
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Hide picker on outside click
    document.addEventListener('click', (e) => {
        if (!emojiBtn.contains(e.target) && !pickerContainer.contains(e.target)) {
            pickerContainer.style.display = 'none';
        }
    });
}

// Level Up / Channel Switching
document.querySelectorAll('.channel-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.channel-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const newChannel = item.dataset.channel;
        console.log(`[CLIENT] Switching channel from ${currentChannel} to ${newChannel}`);
        currentChannel = newChannel;

        document.getElementById('currentChannelName').textContent = `# ${item.textContent.trim()}`;

        loadMessages();
    });
});

// Admin Controls Setup
function setupAdminControls() {
    const announceBtn = document.getElementById('adminAnnounceBtn');
    if (!announceBtn) return;

    // Remove existing listeners to avoid duplicates if re-login
    const newBtn = announceBtn.cloneNode(true);
    announceBtn.parentNode.replaceChild(newBtn, announceBtn);

    newBtn.addEventListener('click', () => {
        window.promptAsync("ANNOUNCEMENT", "Enter message to broadcast:", (msg) => {
            if (msg && msg.trim()) {
                socket.emit('admin_announce', msg.trim(), (res) => {
                    if (res.success) showPopup("SUCCESS", "Announcement Sent! 📡");
                    else showPopup("ERROR", "Error: " + res.error);
                });
            }
        });
    });
}

// Custom Popup System
function showPopup(title, message, isConfirm = false, callback = null) {
    const modal = document.getElementById('customModal');
    const titleEl = document.getElementById('customModalTitle');
    const msgEl = document.getElementById('customModalMessage');
    const okBtn = document.getElementById('customModalOkBtn');
    const cancelBtn = document.getElementById('customModalCancelBtn');

    titleEl.textContent = title;
    titleEl.setAttribute('data-text', title);
    msgEl.innerHTML = message; // Allow HTML safely if controlled

    modal.style.display = 'flex';

    // Reset Buttons
    okBtn.onclick = null;
    cancelBtn.onclick = null;

    if (isConfirm) {
        cancelBtn.style.display = 'block';
        okBtn.textContent = 'CONFIRM';
        cancelBtn.textContent = 'CANCEL';

        okBtn.onclick = () => {
            modal.style.display = 'none';
            if (callback) callback(true);
        };
        cancelBtn.onclick = () => {
            modal.style.display = 'none';
            if (callback) callback(false);
        };
    } else {
        cancelBtn.style.display = 'none';
        okBtn.textContent = 'OK';

        okBtn.onclick = () => {
            modal.style.display = 'none';
            if (callback) callback();
        };
    }
}

// Custom Prompt
window.promptAsync = function (title, message, callback) {
    const inputHtml = `
        <p style="margin-bottom:10px;">${message}</p>
        <input type="text" id="customModalInput" class="char-input" style="width:100%;">
    `;

    showPopup(title, inputHtml, true, (confirmed) => {
        if (confirmed) {
            const input = document.getElementById('customModalInput');
            callback(input ? input.value : null);
        } else {
            callback(null);
        }
    });

    // Focus input
    setTimeout(() => {
        const input = document.getElementById('customModalInput');
        if (input) input.focus();
    }, 100);
};

// Replace window.alert
window.alert = function (msg) {
    showPopup('ALERT', msg);
};

// Replace window.confirm (Note: this is async now, so logic using it must be updated)
window.confirmAsync = function (msg, callback) {
    showPopup('CONFIRM', msg, true, callback);
};


// Global function for onclick handler (Updated to use custom popup)
window.deleteMessage = function (msgId) {
    console.log("Delete button clicked for:", msgId);
    window.confirmAsync("Are you sure you want to delete this message?", (confirmed) => {
        if (!confirmed) return;

        console.log("Sending delete event...");
        socket.emit('deleteMessage', {
            channel: currentChannel,
            messageId: msgId
        }, (res) => {
            console.log("Delete response:", res);
            if (res.success) {
                // Success handled by socket event
            } else {
                showPopup("ERROR", "Error deleting message: " + (res.error || "Unknown"));
            }
        });
    });
};

// ... (Socket events)

// Update Members List & DM List
function updateMembersList(members) {
    console.log("[CLIENT] updateMembersList called with:", members ? members.length : 'null');
    const list = document.getElementById('membersList');
    const dmList = document.getElementById('dmList');
    const count = document.getElementById('memberCount');

    if (list) list.innerHTML = '';
    if (dmList) dmList.innerHTML = '';

    if (!members || members.length === 0) {
        if (list) list.innerHTML = '<p style="padding:15px; color:#666; font-size:0.9em; font-family:\'Courier New\'">Scanning for signals...</p>';
        if (dmList) dmList.innerHTML = '<p style="padding:10px; color:#666; font-size:0.8em;">No other Spider-People online.</p>';
        if (count) count.textContent = '0';
        return;
    }

    if (count) count.textContent = members.length;

    members.forEach(member => {
        // 1. Update Right Sidebar (All Members)
        if (list) {
            const item = document.createElement('div');
            item.className = 'member-item';
            if (currentUser && member.uid === currentUser.uid) {
                item.style.border = '1px solid #e62429';
            }
            item.innerHTML = `
                <img src="${member.isAdmin ? 'admin.jpg' : member.avatar}" alt="${member.name}" class="member-avatar">
                <div class="member-info">
                    <div class="member-name">
                        ${member.name} 
                        ${member.uid === currentUser?.uid ? '(YOU)' : ''}
                        ${member.isAdmin ? '<span style="background:#e62429; color:white; padding:2px 4px; border-radius:3px; font-size:0.7em; margin-left:5px; vertical-align:middle;">ADMIN</span>' : ''}
                    </div>
                    <div class="member-earth">${member.earth}</div>
                </div>
                <div class="member-status ${member.online ? 'online' : 'offline'}"></div>
            `;
            list.appendChild(item);
        }

        // 2. Update Left Sidebar (DM List) - Exclude self
        if (dmList && currentUser && member.uid !== currentUser.uid) {
            const dmItem = document.createElement('div');
            dmItem.className = 'channel-item'; // Reuse channel item style
            dmItem.style.cursor = 'pointer';
            dmItem.dataset.uid = member.uid; // Store UID
            dmItem.innerHTML = `
                <img src="${member.avatar}" style="width:20px; height:20px; border-radius:50%; margin-right:10px;">
                <span>@${member.name}</span>
                <span style="width:8px; height:8px; background:${member.online ? '#0f0' : '#666'}; border-radius:50%; margin-left:auto;"></span>
            `;

            // Handle DM Click
            dmItem.onclick = () => {
                console.log(`Starting DM with ${member.name} (${member.uid})`);
                socket.emit('getPrivateConversation', member.uid, (res) => {
                    if (res.success) {
                        // Manually select this DM item visually
                        document.querySelectorAll('.channel-item').forEach(i => i.classList.remove('active'));
                        dmItem.classList.add('active');

                        currentChannel = res.channelId;
                        document.getElementById('currentChannelName').textContent = `@ ${member.name}`;
                        loadMessages();
                    } else {
                        alert("Error: " + res.error);
                    }
                });
            };
            dmList.appendChild(dmItem);
        }
    });

    // If DM list is empty (no other users)
    if (dmList && dmList.children.length === 0) {
        dmList.innerHTML = '<p style="padding:10px; color:#666; font-size:0.8em;">No other Spider-People online.</p>';
    }
}

// Global Socket Events
socket.on('membersUpdate', (members) => {
    console.log("[DEBUG] membersUpdate received:", members);
    const me = members.find(m => m.uid === currentUser?.uid);
    if (me) console.log("[DEBUG] My Admin Status:", me.isAdmin);
    updateMembersList(members);
});

socket.on('announcement', (data) => {
    const container = document.getElementById('messagesContainer');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    msgDiv.style.border = '1px solid #e62429';
    msgDiv.style.background = 'rgba(230, 36, 41, 0.1)';
    msgDiv.innerHTML = `
        <div class="message-content" style="width:100%;">
            <div class="message-header" style="color: #e62429;">
                <span class="message-author">📢 SPIDER-SOCIETY ALERT</span>
                <span class="message-timestamp">${new Date(data.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="message-text" style="color: #fff; font-weight: bold; font-size: 1.1em;">${data.text}</div>
        </div>
    `;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
});


socket.on('force_disconnect', (reason) => {
    alert(`⛔ CONNECTION TERMINATED ⛔\n\nReason: ${reason}`);
    location.reload();
});

// Avatar Upload Handler
const avatarUpload = document.getElementById('avatarUpload');
if (avatarUpload) {
    avatarUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file); // UPDATED to 'file' to match server

        // Show loading state
        const customAvatarInput = document.getElementById('customAvatar');
        const originalPlaceholder = customAvatarInput.placeholder;
        customAvatarInput.placeholder = "Uploading...";
        customAvatarInput.value = ""; // Clear current value while uploading

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.url) {
                customAvatarInput.value = data.url;
                alert("✅ Image uploaded successfully!");
            } else {
                alert("❌ Upload failed: " + (data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert("❌ Upload error");
        } finally {
            customAvatarInput.placeholder = originalPlaceholder;
            // Clear file input so same file can be selected again if needed
            avatarUpload.value = '';
        }
    });
}

// End of file cleanup
