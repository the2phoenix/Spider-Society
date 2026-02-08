// ===== DOM ELEMENTS =====
const canvas = document.getElementById("hero-lightpass");
const context = canvas.getContext("2d");
const videoContainer = document.getElementById('videoContainer');
const textOverlay = document.getElementById('textOverlay');
const textBlock = document.getElementById('textBlock');

// ===== CONFIGURATION =====
const CONFIG = {
    tiltSensitivity: 25, // Lower = more tilt
    maxTiltAngle: 15, // Maximum rotation in degrees
    textTriggerPoint: 0.85, // When to start fading in text 
    smoothing: 0.1, // Smoothing factor for tilt (0-1, lower = smoother)
    frameCount: 283, // Total frames in sequence
    scrollHeight: 8500, // Total scroll height in pixels (includes text block)
    videoScrollHeight: 7500, // Scroll height for video portion
    fps: 24, // Frames per second (not used for scroll mapping but good for reference)
    framePath: (index) => {
        // Pads the number with leading zeros (001, 002, ..., 283)
        const paddedIndex = index.toString().padStart(3, '0');
        // Ensure index is within bounds (1 to frameCount)
        const safeIndex = Math.max(1, Math.min(index, CONFIG.frameCount));
        return `animation_frames/ezgif-frame-${safeIndex.toString().padStart(3, '0')}.jpg`;
    }
};

// ===== STATE =====
let currentTilt = { x: 0, y: 0 };
let targetTilt = { x: 0, y: 0 };
const images = [];
const imageObjects = { frame: 0 };

// ===== IMAGE PRELOADING =====
const preloadImages = () => {
    for (let i = 1; i <= CONFIG.frameCount; i++) {
        const img = new Image();
        img.src = CONFIG.framePath(i);
        images.push(img);

        // Ensure first image is drawn when loaded
        if (i === 1) {
            img.onload = () => {
                render();
            };
        }
    }
};

// ===== RESIZE HANDLING =====
const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
}

window.addEventListener('resize', handleResize);

// ===== CANVAS RENDERING =====
// Simulate object-fit: cover for canvas
function drawImageProp(ctx, img, x, y, w, h, offsetX, offsetY) {
    if (arguments.length === 2) {
        x = y = 0;
        w = ctx.canvas.width;
        h = ctx.canvas.height;
    }

    // Default offset is center
    offsetX = typeof offsetX === "number" ? offsetX : 0.5;
    offsetY = typeof offsetY === "number" ? offsetY : 0.5;

    // Keep bounds [0.0, 1.0]
    if (offsetX < 0) offsetX = 0;
    if (offsetY < 0) offsetY = 0;
    if (offsetX > 1) offsetX = 1;
    if (offsetY > 1) offsetY = 1;

    var iw = img.width,
        ih = img.height,
        r = Math.min(w / iw, h / ih),
        nw = iw * r,   // new prop. width
        nh = ih * r,   // new prop. height
        cx, cy, cw, ch, ar = 1;

    // Decide which gap to fill
    if (nw < w) ar = w / nw;
    if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;  // updated
    nw *= ar;
    nh *= ar;

    // Calc source rectangle
    cw = iw / (nw / w);
    ch = ih / (nh / h);

    cx = (iw - cw) * offsetX;
    cy = (ih - ch) * offsetY;

    // Make sure source rectangle is valid
    if (cx < 0) cx = 0;
    if (cy < 0) cy = 0;
    if (cw > iw) cw = iw;
    if (ch > ih) ch = ih;

    // Fill image in dest. rectangle
    ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}

const render = () => {
    // Determine which image to draw based on current frame index
    // Note: images array is 0-indexed, so frame 1 is at index 0
    const frameIndex = imageObjects.frame;
    const img = images[frameIndex];

    if (img && img.complete) {
        drawImageProp(context, img, 0, 0, canvas.width, canvas.height);
    }
};


// ===== SCROLL LOGIC =====
function updateScroll() {
    // Get current scroll position
    const scrollY = window.scrollY;
    const maxVideoScroll = CONFIG.videoScrollHeight;

    // Calculate progress in video section
    const scrollProgress = Math.min(Math.max(scrollY / maxVideoScroll, 0), 1);

    // Map scroll to frame index (0 to frameCount - 1)
    const frameIndex = Math.min(
        CONFIG.frameCount - 1,
        Math.floor(scrollProgress * CONFIG.frameCount)
    );

    // Update state only if changed
    if (imageObjects.frame !== frameIndex) {
        imageObjects.frame = frameIndex;
        requestAnimationFrame(render);
    }

    // Update text block position and opacity
    updateTextBlock();

    // Hide scroll indicator after scrolling
    if (window.scrollY > 50) {
        document.body.classList.add('scrolled');
    } else {
        document.body.classList.remove('scrolled');
    }

    // Debug info
    if (scrollY % 100 < 20) {
        // console.log(`Scroll: ${scrollY.toFixed(0)}px | Frame: ${frameIndex + 1}/${CONFIG.frameCount}`);
    }
}

// ===== TEXT BLOCK LOGIC (Unchanged logic, just ensure integration) =====
function updateTextBlock() {
    const scrollY = window.scrollY;
    const videoScrollEnd = CONFIG.videoScrollHeight;
    const totalScroll = CONFIG.scrollHeight;

    // Check if we are in the text block section (after 7500px)
    if (scrollY > videoScrollEnd) {
        // Calculate progress in the text block section (0 to 1)
        const progress = Math.min((scrollY - videoScrollEnd) / (totalScroll - videoScrollEnd), 1);

        // Ensure block is visible and fixed covering the screen
        textBlock.style.transform = `translateY(0)`;
        textBlock.style.zIndex = "30"; // Ensure on top

        // Fade text in based on scroll progress
        const textFadeProgress = Math.max(0, (progress - 0.3) / 0.7);
        textOverlay.style.opacity = textFadeProgress;

        // Fade background to black
        const bgFadeProgress = Math.min(progress * 3.33, 1);
        textBlock.style.backgroundColor = `rgba(0, 0, 0, ${bgFadeProgress})`;

    } else {
        // Reset if scrolling back up
        textBlock.style.transform = `translateY(100vh)`; // Move out of way
        textOverlay.style.opacity = 0;
        textBlock.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    }
}

// ===== EVENT LISTENERS =====
window.addEventListener('scroll', () => {
    updateScroll();
}, { passive: true });

// ===== RESPONSIVE BEHAVIOR =====
if (window.matchMedia('(max-width: 768px)').matches) {
    // Mobile optimizations if needed
}

// ===== INITIALIZATION =====
// Set initial canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Start preloading
preloadImages();

// Initial scroll update
updateScroll();
