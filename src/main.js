import './style.css'
import { renderCameraView, initCamera } from './components/camera-view.js';
import { renderConfirmView, initConfirmView } from './components/confirm-view.js';
import { renderSettingsView, initSettingsView } from './components/settings-view.js';
import { renderIntroView, initIntroView } from './components/intro-view.js';
import { getPosition, initCompass, getCurrentHeading, calculateOffsetPosition, startTracking } from './services/geo.js';
import { auth } from './services/auth.js';

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
    {
      back: () => showCamera(),
      retryGPS: async () => {
        try {
          // Hard fetch
          const l = await getPosition();
          return { lat: l.lat, lng: l.lng, accuracy: l.accuracy };
        } catch (e) {
          alert("GPS Update fehlgeschlagen: " + e.message);
          return null;
        }
      }
    },
    (data) => {
      // Submit Logic
      console.log("Submitting Hydrant:", data);

      // 1. Validate Credentials
      if (!auth.authenticated()) {
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
              <button id="error-close-btn" class="mt-4 text-sm text-gray-400 hover:text-white transition">
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
      btn.innerHTML = `<span>Lade hoch...</span>`;
      btn.disabled = true;

      // Real Upload Logic
      // Create Overlay Immediately
      const overlay = document.createElement('div');
      overlay.className = "absolute inset-0 z-50 flex items-center justify-center bg-black/95 animate-fade-in px-6 text-center backdrop-blur-sm";
      app.appendChild(overlay);

      const renderOverlay = (statusLines, result = null) => {
        const linesHtml = statusLines.map(line =>
          `<div class="text-sm font-mono text-gray-400 border-l-2 border-gray-700 pl-3 py-1 text-left">${line}</div>`
        ).join('');

        let content = `
           <div class="flex flex-col w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl">
              <h2 class="text-xl font-bold text-white mb-4 flex items-center justify-center gap-2">
                 ${result ? 'Upload Erfolgreich! 🚀' : 'Lade hoch... ⏳'}
              </h2>
              <div class="space-y-1 mb-6 max-h-40 overflow-y-auto">
                 ${linesHtml}
              </div>
         `;

        if (result) {
          content += `
               <div class="w-full bg-gray-800 rounded-lg p-3 mb-4 text-left space-y-2 border border-green-500/30">
                  <div class="flex justify-between text-xs">
                       <span class="text-gray-400">Node ID</span>
                       <span class="text-white font-mono font-bold">#${result.id}</span>
                  </div>
                   <div class="flex justify-between text-xs">
                       <span class="text-gray-400">Changeset</span>
                       <span class="text-white font-mono">#${result.changeset}</span>
                  </div>
               </div>
               <button id="success-close-btn" class="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition">
                 Fertig
               </button>
            `;
        } else {
          content += `
               <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
             `;
        }
        content += `</div>`;
        overlay.innerHTML = content;

        if (result) {
          document.getElementById('success-close-btn').onclick = () => showIntro();
          setTimeout(() => showIntro(), 6000);
        }
      };

      const logs = [];
      const addLog = (msg) => {
        logs.push(msg);
        renderOverlay(logs);
      };

      import('./services/osm.js').then(({ createHydrant }) => {
        createHydrant(data, {}, addLog)
          .then((result) => {
            renderOverlay(logs, result);
          })
          .catch(err => {
            // Determine if it was a handled error or bug
            console.error("Upload Failed", err);

            // Don't remove overlay! Show Error inside it.
            let content = `
                   <div class="flex flex-col w-full max-w-sm bg-gray-900 border border-red-500/50 rounded-2xl p-6 shadow-2xl">
                      <h2 class="text-xl font-bold text-red-500 mb-4 flex items-center justify-center gap-2">
                         ❌ Upload Fehlgeschlagen
                      </h2>
                      <div class="space-y-1 mb-6 max-h-40 overflow-y-auto">
                         ${logs.map(line => `<div class="text-sm font-mono text-gray-400 border-l-2 border-red-900 pl-3 py-1 text-left">${line}</div>`).join('')}
                      </div>
                      
                      <div class="bg-red-900/20 text-red-200 p-3 rounded-lg text-xs font-mono mb-4 break-words custom-scrollbar overflow-auto max-h-32">
                         ${err.message || String(err)}
                      </div>

                      <button id="error-overlay-close" class="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition">
                         Schließen
                      </button>
                   </div>
                `;
            overlay.innerHTML = content;
            document.getElementById('error-overlay-close').onclick = () => {
              overlay.remove();
              btn.innerHTML = `<span>Erneut versuchen</span>`;
              btn.disabled = false;
            };
          });
      });
    }
  );
}

// Init App
showIntro();
