export function renderCameraView() {
  return `
    <div id="camera-page" class="relative w-full h-full bg-black overflow-hidden">
      <!-- Video Feed -->
      <video id="camera-feed" autoplay playsinline muted class="w-full h-full object-cover transform scale-100"></video>
      
      <!-- Top Bar -->
      <div class="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent z-10">
         <h1 class="text-white font-bold text-lg drop-shadow-md cursor-pointer select-none" title="Doppelklick zum Testen">Hydranten Jäger</h1>
         <button id="settings-btn" class="p-2 bg-white/10 backdrop-blur-md rounded-full text-white active:bg-white/20 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
         </button>
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

      <button id="capture-btn" class="w-20 h-20 rounded-full border-4 border-white shadow-2xl flex items-center justify-center active:scale-90 transition-transform duration-100 group z-50">
           <div class="w-16 h-16 bg-red-600 rounded-full group-active:bg-red-700 transition-colors"></div>
      </button>
      </div>
      
      <!-- Canvas for capture (hidden) -->
      <canvas id="capture-canvas" class="hidden"></canvas>
    </div>
  `;
}

export async function initCamera(element, onCapture) {
  const video = element.querySelector('#camera-feed');
  const btn = element.querySelector('#capture-btn');
  const canvas = element.querySelector('#capture-canvas');

  // Debug Helper: Double click title to simulate
  element.querySelector('h1').ondblclick = () => onCapture(null);

  // Debug Helper (Desktop)
  const debugBtn = element.querySelector('#debug-btn');
  if (debugBtn) debugBtn.onclick = (e) => { e.stopPropagation(); onCapture(null); };

  // Compass UI Update Loop
  const compassEl = element.querySelector('#compass-heading');
  const updateCompassUI = () => {
    if (!compassEl) return;
    // Need to import getCurrentHeading dynamically or pass it? 
    // For simplicity, we listen to event here too or assume main.js initializes it.
    // Better: We add internal listener here for UI feedback.
  };

  // Independent listener for UI feedback
  const boundListener = (e) => {
    let h = 0;
    if (e.webkitCompassHeading) h = e.webkitCompassHeading;
    else if (e.alpha) h = 360 - e.alpha;
    if (compassEl) compassEl.innerText = Math.round(h);
  };

  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', boundListener);
  }

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
