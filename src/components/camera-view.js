export function renderCameraView() {
  return `
    <div id="camera-page" class="relative w-full h-full bg-black overflow-hidden">
      <!-- Video Feed -->
      <video id="camera-feed" autoplay playsinline muted class="w-full h-full object-cover transform scale-100"></video>
      
      <!-- Top Bar: Back & GPS Status -->
      <div class="absolute top-0 w-full p-4 z-50 flex justify-between items-start pointer-events-none">
         <button id="back-to-intro-btn" class="pointer-events-auto bg-black/40 backdrop-blur-md p-3 rounded-full text-white border border-white/10 active:scale-95 transition-transform">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
         </button>
         <div class="bg-black/40 backdrop-blur text-xs px-3 py-1 rounded-full text-white border border-white/10 flex flex-col items-end">
            <span id="gps-status" class="font-mono text-green-400">GPS: --</span>
            <span id="compass-status" class="font-mono text-yellow-400">KOMPASS: --</span>
         </div>
      </div>

      <!-- Debug Helper (Hidden or removed in prod, but keeping structure clean if needed later) -->
      <!-- <button id="debug-btn" ... hidden ...></button> -->

      <!-- Controls -->
      <div class="absolute bottom-0 left-0 right-0 p-8 pb-12 flex flex-col justify-center items-center bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10">
        <!-- Compass Heading Display -->
        <div class="mb-6 px-4 py-2 bg-black/40 backdrop-blur rounded-full text-white text-sm font-mono border border-white/20">
           🧭 <span id="compass-heading">0</span>°
        </div>

      <!-- Error Overlay (Hidden by default) -->
      <div id="camera-error" class="hidden absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 text-white p-6 text-center z-40">
         <p class="text-4xl mb-4">📷🚫</p>
         <p class="text-xl font-bold mb-2">Kamera nicht verfügbar</p>
         <p id="camera-error-msg" class="text-sm opacity-70 mb-6">Kein Zugriff</p>
         <button id="error-back-btn" class="px-6 py-3 bg-red-600 rounded-xl font-bold">Zurück</button>
      </div>

      <button id="capture-btn" class="w-20 h-20 rounded-full border-4 border-white shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center active:scale-90 transition-transform duration-100 group z-[100] relative bg-black/20 backdrop-blur-sm">
           <div class="w-16 h-16 bg-red-600 rounded-full group-active:bg-red-700 transition-colors border-2 border-white/20"></div>
      </button>
      </div>
      
      <!-- Canvas for capture (hidden) -->
      <canvas id="capture-canvas" class="hidden"></canvas>
    </div>
  `;
}

import { getLastKnownPosition } from '../services/geo.js';

export async function initCamera(element, onBack, onCapture) {
  const video = element.querySelector('#camera-feed');
  const btn = element.querySelector('#capture-btn');
  const canvas = element.querySelector('#capture-canvas');
  const backBtn = element.querySelector('#back-to-intro-btn');
  const errorBackBtn = element.querySelector('#error-back-btn');

  // Status Elements
  const gpsStatusEl = element.querySelector('#gps-status');
  const compassStatusEl = element.querySelector('#compass-status');
  const compassHeadingEl = element.querySelector('#compass-heading'); // Bottom large display

  // Back Navigation
  if (backBtn && onBack) {
    backBtn.onclick = onBack;
  }
  if (errorBackBtn && onBack) {
    errorBackBtn.onclick = onBack;
  }

  // Debug Helper: Double click title to simulate (if title existed, now removed from top bar)

  // LIVE UPDATE LOOP (GPS & Compass UI)
  const updateStatus = () => {
    // 1. GPS
    const pos = getLastKnownPosition();
    if (pos && gpsStatusEl) {
      gpsStatusEl.innerText = `GPS: ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`;
      gpsStatusEl.classList.remove('text-red-500');
      gpsStatusEl.classList.add('text-green-400');
    } else if (gpsStatusEl) {
      gpsStatusEl.innerText = "GPS: Suche...";
      gpsStatusEl.classList.add('text-red-500');
    }
  };

  const statusInterval = setInterval(updateStatus, 1000);
  updateStatus(); // Initial call

  // Listener for Compass Feedback
  const boundListener = (e) => {
    let h = 0;
    if (e.webkitCompassHeading) h = e.webkitCompassHeading;
    else if (e.alpha) h = 360 - e.alpha;

    h = Math.round(h);

    // Update Bottom Display
    if (compassHeadingEl) compassHeadingEl.innerText = h;

    // Update Top Pill
    if (compassStatusEl) {
      compassStatusEl.innerText = `KOMPASS: ${h}°`;
    }
  };

  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', boundListener);
  }

  // Cleanup function to stop interval/listeners when view changes
  // Note: Since we don't have a formal unmount lifecycle here, we rely on the fact 
  // that navigating away destroys the element. Ideally, we'd clear interval on back.
  const cleanup = () => {
    clearInterval(statusInterval);
    window.removeEventListener('deviceorientation', boundListener);
  };

  // Hook cleanup into Back buttons
  const originalOnBack = backBtn.onclick; // Should be null or onBack
  backBtn.onclick = () => { cleanup(); if (onBack) onBack(); };
  if (errorBackBtn) errorBackBtn.onclick = () => { cleanup(); if (onBack) onBack(); };

  // KEYBOARD TRIGGER (Spacebar)
  const keyHandler = (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      // Check if we are still in camera mode
      if (!element.querySelector('#camera-feed')) {
        document.removeEventListener('keydown', keyHandler);
        return;
      }
      btn.click(); // Trigger click logic
    }
  };
  document.addEventListener('keydown', keyHandler);

  let stream = null;

  const performCapture = () => {
    // If no stream (error mode), allow mock capture if needed, 
    // BUT user wanted "Simulate Photo" removed. 
    // However, for debugging without camera availability on Desktop, we might still want it logic-wise?
    // If stream is null, simple red fallback.

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    if (stream && stream.active) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      stream.getTracks().forEach(track => track.stop());
    } else {
      // Fallback Red
      ctx.fillStyle = '#cc0000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    canvas.toBlob((blob) => {
      onCapture(blob);
    }, 'image/jpeg', 0.85);
  };

  btn.onclick = performCapture;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });
    video.srcObject = stream;
    video.play();
  } catch (err) {
    console.warn("Camera init failed:", err);
    // User fallback UI
    const errorEl = element.querySelector('#camera-error');
    if (errorEl) {
      errorEl.classList.remove('hidden');
      element.querySelector('#camera-error-msg').innerText = err.message || 'Kein Zugriff';
    }
    // Note: We leave btn.onclick active so desktop users without cam can still click "Shutter" to get a red image
  }
}
