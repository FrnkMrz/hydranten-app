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

      <!-- Debug Helper -->
      <button id="debug-btn" type="button" class="absolute top-24 right-4 bg-red-600 hover:bg-red-700 shadow-lg text-xs px-3 py-2 rounded-full font-bold text-white z-50 cursor-pointer border border-white/20 transition-transform active:scale-95">🕵️ Simuliere Foto</button>

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
         <p class="text-xs text-red-400 font-bold border border-red-500/30 bg-red-500/10 p-2 rounded">
            Bitte 'Simuliere Foto' (oben rechts) nutzen!
         </p>
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

let h = 0;
if (e.webkitCompassHeading) h = e.webkitCompassHeading;
else if (e.alpha) h = 360 - e.alpha;
if (compassEl) compassEl.innerText = Math.round(h);
  };

if (window.DeviceOrientationEvent) {
  window.addEventListener('deviceorientation', boundListener);
}

// KEYBOARD TRIGGER (Spacebar)
const keyHandler = (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    // Check if we are still in camera mode
    if (!element.querySelector('#camera-feed')) {
      document.removeEventListener('keydown', keyHandler);
      return;
    }
    onCapture(null); // Force capture
  }
};
document.addEventListener('keydown', keyHandler);

// Clean up listener when element removed (simplified for prototype: relying on SPA replacement garbage collection usually ok, but robust is better)
// TODO: Add proper cleanup in future refactor

let stream = null;

const setupCapture = () => {
  btn.onclick = () => {
    if (!stream || !stream.active) {
      // Fallback if button clicked but no stream
      console.log("No stream, triggering mock capture");
      onCapture(null);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    canvas.toBlob((blob) => {
      onCapture(blob);
    }, 'image/jpeg', 0.85);
  };
};

try {
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' },
    audio: false
  });
  video.srcObject = stream;
  video.play();
  setupCapture();
} catch (err) {
  console.warn("Camera init failed:", err);
  // User fallback UI
  const errorEl = element.querySelector('#camera-error');
  if (errorEl) {
    errorEl.classList.remove('hidden');
    element.querySelector('#camera-error-msg').innerText = err.message || 'Kein Zugriff';
  }
  // Ensure capture handler still works for simulation
  btn.onclick = () => onCapture(null);
  // Ensure capture button triggers mock in error state too
  btn.onclick = () => onCapture(null);
}
}
