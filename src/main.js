import './style.css'
import { renderCameraView, initCamera } from './components/camera-view.js';
import { renderConfirmView, initConfirmView } from './components/confirm-view.js';
import { renderSettingsView, initSettingsView } from './components/settings-view.js';
import { renderIntroView, initIntroView } from './components/intro-view.js';
import { getPosition, initCompass, getCurrentHeading, calculateOffsetPosition, startTracking } from './services/geo.js';

// Init Compass & GPS Tracking early
initCompass();
startTracking();

const app = document.querySelector('#app');

// Simple State Management
const state = {
  view: 'intro', // Start with intro
  capturedBlob: null,
  location: null
};

// Cleanup function for current view
let currentCleanup = null;

function switchView(viewName, renderFn, initFn) {
  // Cleanup previous view
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  state.view = viewName;
  app.innerHTML = renderFn();

  // Init new view and store cleanup (if any)
  const cleanup = initFn();
  if (typeof cleanup === 'function') {
    currentCleanup = cleanup;
  }
}

function showIntro() {
  switchView('intro', renderIntroView, () =>
    initIntroView(app,
      () => showCamera(),
      () => showSettings()
    )
  );
}

async function showCamera() {
  // Manual switch because async init is special
  if (currentCleanup) { currentCleanup(); currentCleanup = null; }
  state.view = 'camera';
  app.innerHTML = renderCameraView();

  await initCamera(app,
    () => showIntro(), // onBack
    async (blob) => {  // onCapture
      // Mock capture if blob is null (from fallback button)
      if (!blob) {
        const canvas = document.createElement('canvas');
        canvas.width = 640; canvas.height = 480;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ef4444'; // Red for hydrant
        ctx.fillRect(0, 0, 640, 480);
        blob = await new Promise(r => canvas.toBlob(r));
      }

      state.capturedBlob = blob;

      // Loading State UI
      app.innerHTML += `<div class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 text-white animate-fade-in">
       <div class="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
       <span class="font-bold">Ermittle Position...</span>
    </div>`;

      let loc = null;
      try {
        // Try fresh position (3s timeout)
        loc = await Promise.race([
          getPosition(),
          new Promise((_, r) => setTimeout(() => r(new Error('Timeout')), 3000))
        ]);
        // loc is { lat, lng, accuracy, heading } from geo.js
      } catch (e) {
        console.warn('GPS Fresh failed, using cached:', e);
        const last = getLastKnownPosition();
        if (last) {
          loc = { ...last }; // lat, lng, accuracy, heading
        } else {
          // Absolute Fallback (Munich)
          loc = { lat: 48.137, lng: 11.576, accuracy: 999, heading: 0 };
        }
      }

      // Now we have a loc (flat object)
      try {
        const heading = loc.heading || getCurrentHeading() || 0;
        const finalLoc = calculateOffsetPosition(loc.lat, loc.lng, 3, heading);

        state.location = {
          lat: finalLoc.lat,
          lng: finalLoc.lng,
          accuracy: loc.accuracy,
          heading: heading
        };

        showConfirm();
      } catch (err) {
        console.error("Calculation Error", err);
        state.location = { lat: 48.137, lng: 11.576, accuracy: 999 };
        showConfirm();
      }
    });

  // Settings Button
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.onclick = () => showSettings();
  }
}

function showSettings() {
  state.view = 'settings';
  app.innerHTML = renderSettingsView();
  initSettingsView(app, () => showIntro());
}

function showConfirm() {
  state.view = 'confirm';
  app.innerHTML = renderConfirmView();
  initConfirmView(app, state.capturedBlob, state.location,
    () => showCamera(), // Retake
    (data) => {
      // Submit Logic
      const creds = JSON.parse(localStorage.getItem('osm_creds') || '{}');
      console.log("Submitting Hydrant:", data, "Creds:", creds);

      // 1. Validate Credentials
      if (!creds.user || !creds.password) {
        // Error Overlay
        const overlay = document.createElement('div');
        overlay.className = "absolute inset-0 z-50 flex items-center justify-center bg-gray-900/95 animate-fade-in px-4 text-center";
        overlay.innerHTML = `
           <div class="flex flex-col items-center max-w-xs">
              <div class="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-red-900/40">
                 <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              </div>
              <h2 class="text-2xl font-bold text-white mb-2">Fehler!</h2>
              <p class="text-gray-400 mb-6 text-sm">Keine OSM-Zugangsdaten gefunden. Bitte melde dich zuerst an.</p>
              
              <button id="error-settings-btn" class="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-bold transition">
                 Zu den Einstellungen
              </button>
              <button id="error-close-btn" class="mt-4 text-sm text-gray-500 hover:text-gray-300">
                 Abbrechen
              </button>
           </div>
        `;
        app.appendChild(overlay);

        document.getElementById('error-settings-btn').onclick = () => showSettings();
        document.getElementById('error-close-btn').onclick = () => overlay.remove();
        return;
      }

      const btn = document.getElementById('submit-img-btn');
      btn.innerHTML = `<span>Speichere...</span>`;
      btn.disabled = true;

      // Simulate network request duration
      setTimeout(() => {
        // Overlay for Success
        const overlay = document.createElement('div');
        overlay.className = "absolute inset-0 z-50 flex items-center justify-center bg-black/90 animate-fade-in px-6 text-center backdrop-blur-sm";

        const userMsg = creds.user ? `User: <span class="text-blue-400 font-mono">${creds.user}</span>` : "(Simulation / Offline)";

        overlay.innerHTML = `
           <div class="flex flex-col items-center w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl">
              <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
                 <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h2 class="text-xl font-bold text-white mb-2">Upload erfolgreich! 🚀</h2>
              
              <div class="w-full bg-gray-800 rounded-lg p-3 mb-6 text-left space-y-2 border border-gray-700">
                  <div class="flex justify-between text-xs border-b border-gray-700 pb-2">
                      <span class="text-gray-400">Status</span>
                      <span class="text-green-400 font-bold uppercase">OK (200)</span>
                  </div>
                  <div class="flex justify-between text-xs border-b border-gray-700 pb-2">
                      <span class="text-gray-400">Account</span>
                      <span class="text-white">${userMsg}</span>
                  </div>
                  <div class="flex justify-between text-xs">
                      <span class="text-gray-400">Node ID</span>
                      <span class="text-white font-mono">#${Math.floor(Math.random() * 9000000) + 1000000}</span>
                  </div>
              </div>

              <p class="text-xs text-gray-500 mb-4">Daten wurden an OpenStreetMap übertragen.</p>
              
              <button id="success-close-btn" class="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition">
                 Weiter
              </button>
           </div>
        `;
        app.appendChild(overlay);

        // Manual Close
        document.getElementById('success-close-btn').onclick = () => {
          showIntro();
        };

        // Auto-Close Fallback (5s)
        setTimeout(() => showIntro(), 5000);

      }, 1500);
    }
  );
}

// Init App
showIntro();
