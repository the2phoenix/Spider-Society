// ===== DOM ELEMENTS =====
const canvas = document.getElementById("home-anim");
const context = canvas.getContext("2d");
const enterBtn = document.getElementById('enterWebBtn');

// ===== CONFIGURATION =====
const CONFIG = {
    frameCount: 240,
    // We map scroll progress (0..1) of the SPACER to frames
    framePath: (index) => {
        const safeIndex = Math.max(1, Math.min(index, CONFIG.frameCount));
        return `web animation/ezgif-frame-${safeIndex.toString().padStart(3, '0')}.jpg`;
    }
};

// ===== STATE =====
const images = [];
const imageObjects = { frame: 0 };

// ===== IMAGE PRELOADING =====
const preloadImages = () => {
    for (let i = 1; i <= CONFIG.frameCount; i++) {
        const img = new Image();
        img.src = CONFIG.framePath(i);
        images.push(img);
        if (i === 1) img.onload = render;
    }
};

// ===== RESIZE HANDLING =====
const handleResize = () => {
    const container = document.querySelector('.video-container');
    if (container) {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
    } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    render();
}
window.addEventListener('resize', handleResize);

// ===== CANVAS RENDERING =====
function drawImageProp(ctx, img, x, y, w, h, offsetX, offsetY) {
    if (arguments.length === 2) {
        x = y = 0;
        w = ctx.canvas.width;
        h = ctx.canvas.height;
    }
    offsetX = typeof offsetX === "number" ? offsetX : 0.5;
    offsetY = typeof offsetY === "number" ? offsetY : 0.5;

    if (offsetX < 0) offsetX = 0;
    if (offsetY < 0) offsetY = 0;
    if (offsetX > 1) offsetX = 1;
    if (offsetY > 1) offsetY = 1;

    var iw = img.width, ih = img.height,
        r = Math.min(w / iw, h / ih),
        nw = iw * r, nh = ih * r,
        cx, cy, cw, ch, ar = 1;

    if (nw < w) ar = w / nw;
    if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;
    nw *= ar;
    nh *= ar;

    cw = iw / (nw / w);
    ch = ih / (nh / h);

    cx = (iw - cw) * offsetX;
    cy = (ih - ch) * offsetY;

    if (cx < 0) cx = 0;
    if (cy < 0) cy = 0;
    if (cw > iw) cw = iw;
    if (ch > ih) ch = ih;

    ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}

const render = () => {
    const frameIndex = imageObjects.frame;
    const img = images[frameIndex];
    if (img && img.complete) {
        drawImageProp(context, img, 0, 0, canvas.width, canvas.height);
    }
};

// ===== SCROLL LOGIC =====
function updateScroll() {
    const scrollY = window.scrollY;

    // We want the animation to finish JUST before the footer covers it
    const spacer = document.querySelector('.scroll-spacer');
    let maxScroll = 6000;

    if (spacer) {
        // Animation ends when spacer bottom hits screen bottom
        maxScroll = Math.max(spacer.offsetHeight - window.innerHeight, 100);
    }

    const scrollProgress = Math.min(Math.max(scrollY / maxScroll, 0), 1);

    const frameIndex = Math.min(
        CONFIG.frameCount - 1,
        Math.floor(scrollProgress * CONFIG.frameCount)
    );

    if (imageObjects.frame !== frameIndex) {
        imageObjects.frame = frameIndex;
        requestAnimationFrame(render);
    }
}

window.addEventListener('scroll', updateScroll, { passive: true });

// ===== BUTTON REVEAL (Intersection Observer) =====
const ctaMsg = document.getElementById('ctaMsg');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Footer is visible -> Slide button and text up
            if (ctaMsg) {
                ctaMsg.style.opacity = '1';
                ctaMsg.style.transition = 'opacity 0.8s ease 0.2s'; // Slight delay
            }
            enterBtn.style.opacity = '1';
            enterBtn.style.transform = 'translateY(0)';
        } else {
            // Footer hidden -> Reset
            if (ctaMsg) ctaMsg.style.opacity = '0';
            enterBtn.style.opacity = '0';
            enterBtn.style.transform = 'translateY(100px)';
        }
    });
}, { threshold: 0.01 });

const footerSection = document.querySelector('.footer-section');
if (footerSection) {
    observer.observe(footerSection);
}

// ===== WELCOME CTA REVEAL =====
const welcomeCta = document.getElementById('welcomeCta');
const welcomeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            welcomeCta.style.opacity = '1';
        } else {
            // Optional: reset if scrolled away
            // welcomeCta.style.opacity = '0'; 
        }
    });
}, { threshold: 0.1 });

if (welcomeCta) {
    welcomeObserver.observe(welcomeCta);
}

// ===== CARD ANIMATION LOGIC =====
const cards = [
    document.getElementById('card1'),
    document.getElementById('card2'),
    document.getElementById('card3'),
    document.getElementById('card4'),
    document.getElementById('card5')
];

const introCopy = document.querySelector('.intro-copy');

function updateCards() {
    const spacer = document.querySelector('.card-trigger-spacer');
    if (!spacer) return;

    const rect = spacer.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Calculate progress through the spacer
    let progress = -rect.top / (rect.height - viewportHeight);
    progress = Math.min(Math.max(progress, 0), 1);

    // Text Reveal Logic
    if (rect.top < viewportHeight * 0.8) {
        if (introCopy) introCopy.classList.add('visible');
    }

    // Sequential 3-Stage Animation (Left Stack -> Flip 360 -> Right Fan)
    const totalCards = cards.length;
    const slice = 1 / totalCards;

    cards.forEach((card, index) => {
        if (!card) return;

        const startP = index * slice;
        const endP = startP + slice;

        let p = (progress - startP) / (endP - startP);
        if (p < 0) p = 0;
        if (p > 1) p = 1;

        // Final State Vars
        let tx = 0, rotY = 0, sc = 1, op = 1;
        const targetX = (index - 2) * 150;

        if (progress <= startP) {
            // Not started: Stacked Left
            tx = -600;
            rotY = 0;
            sc = 0.5;
            op = 0;
        } else if (progress >= endP) {
            // Finished: Placed Right
            tx = targetX;
            rotY = 360;
            sc = 1;
            op = 1;
        } else {
            // Animating
            op = 1;

            if (p < 0.4) {
                // Phase 1: Enter (Left -> Center). Left is -600. Center is 0.
                const t = p / 0.4;
                const ease = t * (2 - t);
                tx = -600 + (0 - -600) * ease;
                rotY = 0;
                sc = 0.5 + 0.5 * ease;
            } else if (p < 0.7) {
                // Phase 2: Flip 360 on Y Axis (Center)
                const t = (p - 0.4) / 0.3;
                tx = 0;
                rotY = t * 360;
                sc = 1;
            } else {
                // Phase 3: Place (Center -> Right Target)
                const t = (p - 0.7) / 0.3;
                const ease = t * t * (3 - 2 * t);
                tx = 0 + (targetX - 0) * ease;
                rotY = 360;
                sc = 1;
            }
        }

        // Use rotateY for flip
        card.style.transform = `translate(calc(-50% + ${tx}px), -50%) rotateY(${rotY}deg) scale(${sc})`;
        card.style.opacity = op;
        card.style.zIndex = (p > 0 && p < 1) ? 100 : index + 1;

        // Title Visibility: Only show after 360 flip (Phase 2 > 0.7)
        const content = card.querySelector('.card-content');
        if (content) {
            if (p > 0.7 || progress >= endP) {
                content.style.opacity = '1';
            } else {
                content.style.opacity = '0';
            }
        }
    });
}

// Replace existing scroll listener with loop or composite listener
// For simplicity, we'll keep the scroll listener for canvas and add one for cards
window.addEventListener('scroll', () => {
    updateCards();
}, { passive: true });

// ===== CARD NAVIGATION =====
// Map cards to pages
const cardLinks = [
    'about.html',       // Card 1: Origin -> About
    'missions.html',    // Card 2: Missions
    'variants.html',    // Card 3: Variants
    'spiderlink.html',  // Card 4: Spiderlink
    'canon_events.html' // Card 5: Canon Events
];

cards.forEach((card, index) => {
    if (card && cardLinks[index]) {
        card.addEventListener('click', () => {
            // Only navigate if card is somewhat visible/active?
            // For now, allow click anytime
            window.location.href = cardLinks[index];
        });
    }
});

// ===== AUDIO INTERACTION =====
const hoverSound = document.getElementById('hoverSound');
const clickSound = document.getElementById('clickSound');

function playHover() {
    if (hoverSound) {
        hoverSound.currentTime = 0;
        hoverSound.play().catch(e => console.log("Audio autoplay blocked", e));
    }
}

function playClick() {
    if (clickSound) {
        clickSound.currentTime = 0;
        clickSound.play().catch(e => console.log("Audio autoplay blocked", e));
    }
}

// Attach to interactive elements (Updated Selector)
const interactiveElements = document.querySelectorAll('button, a, .card, .spider-btn, .glitch-btn, input');
interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', playHover);
    el.addEventListener('click', playClick);
});

// ===== POLISH LOGIC (Terminal, Input, Go Home) =====

// 1. Terminal Effect
const terminalText = document.getElementById('terminalText');
const terms = ["Decrypting...", "Accessing Node 42...", "Signal Weak...", "Re-routing...", "Multiverse Sync: 98%", "Anomaly Detected...", "Spider-Sense Tingling..."];
if (terminalText) {
    setInterval(() => {
        const randomTerm = terms[Math.floor(Math.random() * terms.length)];
        const line = document.createElement('div');
        line.textContent = `> ${randomTerm} [${Math.random().toFixed(2)}]`;
        terminalText.appendChild(line);
        if (terminalText.children.length > 8) terminalText.removeChild(terminalText.firstChild);
    }, 800);
}

// 2. Decode Input
const decodeBtn = document.getElementById('decodeBtn');
const signalCode = document.getElementById('signalCode');
const signalResponse = document.getElementById('signalResponse');

if (decodeBtn) {
    decodeBtn.addEventListener('click', () => {
        const code = signalCode.value.trim().toUpperCase();
        if (code === "42" || code === "SPIDER" || code === "MILES" || code.length > 0) {
            signalResponse.style.opacity = 1;
            signalResponse.style.color = "#0f0";
            signalResponse.textContent = "ACCESS GRANTED. LAUNCHING SPIDERLINK...";
            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = 'spiderlink.html';
            }, 2000);
        } else {
            signalResponse.style.opacity = 1;
            signalResponse.style.color = "#e62429";
            signalResponse.textContent = "ACCESS DENIED. TRY AGAIN.";
        }
    });
}

// 3. Go Home Scroll
const goHomeBtn = document.getElementById('goHomeBtn');
if (goHomeBtn) {
    goHomeBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== INITIALIZATION =====
handleResize();
preloadImages();
updateScroll();
updateCards(); // Initial card state
