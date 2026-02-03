import './style.css'
import { renderCameraView, initCamera } from './components/camera-view.js';
import { renderConfirmView, initConfirmView } from './components/confirm-view.js';
import { renderSettingsView, initSettingsView } from './components/settings-view.js';
import { renderIntroView, initIntroView } from './components/intro-view.js';
import { renderHistoryView, initHistoryView } from './components/history-view.js';
import { getPosition, initCompass, getCurrentHeading, calculateOffsetPosition, startTracking, getLastKnownPosition } from './services/geo.js';
import { auth } from './services/auth.js';
import { fetchNodeData, updateHydrant, deleteHydrant } from './services/osm.js';
import { t } from './services/i18n.js';

// Security Helper
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Init Compass & GPS Tracking early
// Init Compass & GPS Tracking (Moved to Start/Camera)
// initCompass();
// startTracking();

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
      () => showSettings(),
      handleEdit
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

// New: Edit Mode Handler
function handleEdit(nodeId) {
  if (!auth.authenticated()) {
    alert("Bitte melde dich an, um Hydranten zu bearbeiten.");
    showSettings();
    return;
  }

  console.log("Edit Mode requested for Node:", nodeId);

  // Simple Loading Visual
  app.innerHTML = `
      <div class="h-full w-full bg-black flex flex-col items-center justify-center text-white space-y-4">
          <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="font-bold">Lade Hydrant #${escapeHtml(nodeId)}...</p>
      </div>
   `;

  // Safety check (Imports should be available)
  if (!fetchNodeData) console.error("Missing fetchNodeData import");
  if (!deleteHydrant) console.error("Missing deleteHydrant import");

  fetchNodeData(nodeId)
    .then(nodeData => {
      console.log("Loaded Node Data:", nodeData);
      // Switch to Confirm View in Edit Mode
      app.innerHTML = renderConfirmView();

      // Helper for Overlay (Duplicated to avoid scope issues)
      const showOverlay = (title, promiseAction) => {
        const overlay = document.createElement('div');
        overlay.className = "absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-6 animate-fade-in";
        app.appendChild(overlay);

        const logs = [];
        const renderStatus = (result = null, error = null) => {
          const linesHtml = logs.map(line => `<div class="text-sm font-mono text-gray-400 border-l-2 border-gray-700 pl-3 py-1 text-left">${escapeHtml(line)}</div>`).join('');
          let content = `
                   <div class="flex flex-col w-full max-w-sm bg-gray-900 border ${error ? 'border-red-500' : 'border-gray-700'} rounded-2xl p-6 shadow-2xl">
                      <h2 class="text-xl font-bold ${error ? 'text-red-500' : 'text-white'} mb-4 flex items-center justify-center gap-2">
                         ${error ? '❌ Fehler' : (result ? 'Erfolg! ✅' : title + '... ⏳')}
                      </h2>
                      <div class="space-y-1 mb-6 max-h-40 overflow-y-auto custom-scrollbar">
                         ${linesHtml}
                      </div>
                `;

          if (error) {
            content += `
                        <div class="bg-red-900/20 text-red-200 p-3 rounded-lg text-xs font-mono mb-4 break-words">
                           ${escapeHtml(error.message || String(error))}
                        </div>
                        <button id="overlay-close-btn" class="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition">Schließen</button>
                    `;
          } else if (result) {
            content += `
                        <button id="overlay-close-btn" class="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition">Fertig</button>
                     `;
          } else {
            content += `<div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>`;
          }
          content += `</div>`;
          overlay.innerHTML = content;

          if (document.getElementById('overlay-close-btn')) {
            document.getElementById('overlay-close-btn').onclick = () => {
              overlay.remove();
              if (!error) showIntro();
            };
          }
        };

        const addLog = (msg) => { logs.push(msg); renderStatus(); };

        renderStatus();
        promiseAction(addLog)
          .then(res => renderStatus(res))
          .catch(err => renderStatus(null, err));
      };

      // Init Confirm View with Edit Mode = true
      initConfirmView(
        app,
        null, // No Photo Blob
        { lat: nodeData.lat, lng: nodeData.lng, accuracy: 0 }, // Location
        { back: () => { showIntro(); } }, // OnBack (Cancel) -> Intro
        (data) => {
          // OnSubmit (Save)
          // Use local updateHydrant reference
          showOverlay("Speichere", (log) => updateHydrant(data.id, data.version, data.tags, data.lat, data.lng, log));
        },
        true, // editMode
        nodeData, // initialData
        (id, version) => {
          // OnDelete
          if (deleteHydrant) {
            showOverlay("Lösche", (log) => deleteHydrant(id, version, nodeData.lat, nodeData.lng, nodeData.tags, log));
          } else {
            alert("Interner Fehler: Lösch-Funktion nicht verfügbar. Bitte neu laden.");
            console.error("deleteHydrant missing");
          }
        }
      );
    })
    .catch(err => {
      console.error("Load Failed:", err);

      let msg = t('error.load_failed') + ": " + err.message;
      let autoClose = false;

      if (err.message === "NODE_DELETED") {
        msg = t('error.node_deleted');
        autoClose = true;
      }

      // Update Loading Screen with Error
      app.innerHTML = `
            <div class="h-full w-full bg-black flex flex-col items-center justify-center text-white space-y-6 p-8 text-center animate-fade-in">
                <div class="text-6xl">⚠️</div>
                <h2 class="text-2xl font-bold text-red-500">${t('error.oops')}</h2>
                <p class="text-lg text-gray-300">${msg}</p>
                <div class="w-full max-w-xs mt-4">
                     <button id="error-back-btn" class="w-full py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold transition">${t('error.back_to_map')}</button>
                </div>
            </div>
        `;

      document.getElementById('error-back-btn').onclick = () => showIntro();

      if (autoClose) {
        setTimeout(() => showIntro(), 2500);
      }
    });
}




function showHistory() {
  state.view = 'history';
  app.innerHTML = renderHistoryView();
  initHistoryView(app, () => showSettings());
}

function showSettings() {
  state.view = 'settings';
  app.innerHTML = renderSettingsView();
  initSettingsView(app,
    () => showIntro(), // onBack
    () => showHistory() // onHistory
  );
}

function showConfirm() {
  state.view = 'confirm';
  app.innerHTML = renderConfirmView();
  initConfirmView(app, state.capturedBlob, state.location,
    {
      back: () => {
        console.log("Main: Switching back to Camera...");
        showCamera().catch(err => {
          console.error("Main: Failed to show Camera", err);
          alert("Kamera-Fehler: " + err.message);
        });
      },
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
                 ${result ? 'Upload Erfolgreich!' : 'Lade hoch... ⏳'}
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
          // setTimeout(() => showIntro(), 6000); // Removed auto-close
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
            console.error("Upload Failed", err);

            let content = `
                   <div class="flex flex-col w-full max-w-sm bg-gray-900 border border-red-500/50 rounded-2xl p-6 shadow-2xl">
                      <h2 class="text-xl font-bold text-red-500 mb-4 flex items-center justify-center gap-2">
                         ❌ Upload Fehlgeschlagen
                      </h2>
                      <div class="space-y-1 mb-6 max-h-40 overflow-y-auto">
                         ${logs.map(line => `<div class="text-sm font-mono text-gray-400 border-l-2 border-red-900 pl-3 py-1 text-left">${escapeHtml(line)}</div>`).join('')}
                      </div>
                      
                      <div class="bg-red-900/20 text-red-200 p-3 rounded-lg text-xs font-mono mb-4 break-words custom-scrollbar overflow-auto max-h-32">
                         ${escapeHtml(err.message || String(err))}
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

// Init App / Auth Check (Custom PKCE)
if (location.search.includes('code=')) {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  if (code) {
    console.log("PKCE Auth Callback detected!");
    const app = document.querySelector('#app');

    // Loading
    app.innerHTML = `<div class="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white animate-fade-in">
       <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
       <h2 class="text-xl font-bold">Verifiziere Login...</h2>
       <div class="text-left max-w-sm w-full px-6 mt-4">
          <div id="pkce-log" class="text-xs font-mono text-green-400 bg-black/40 p-3 rounded h-32 overflow-auto">INIT...</div>
       </div>
      </div>`;

    const logDiv = document.getElementById('pkce-log');
    const log = (msg) => {
      logDiv.innerHTML += "<div>> " + msg + "</div>";
      logDiv.scrollTop = logDiv.scrollHeight;
    };

    log("Got Code: " + code.substring(0, 5) + "...");

    // Debug Verifier in Storage
    const verifier = localStorage.getItem('osm_pkce_verifier');
    log("Verifier in Storage: " + (verifier ? "YES (" + verifier.length + " chars)" : "NO (!!!)"));

    auth.exchangeCode(code)
      .then(accessToken => {
        log("SUCCESS! Token: " + accessToken.substring(0, 10) + "...");
        log("Redirecting...");
        setTimeout(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          showSettings();
        }, 1000);
      })
      .catch(err => {
        console.error("PKCE Error:", err);
        log("ERROR: " + err.message);

        const div = document.createElement('div');
        div.innerHTML = `<button onclick="showIntro(); window.history.replaceState({}, document.title, window.location.pathname);" class="w-full mt-4 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold">Zurück zum Start</button>`;
        app.querySelector('.text-left').appendChild(div);
      });
  } else {
    showIntro();
  }
} else {
  // Clear Hash if present from prev attempts
  if (location.hash.includes('access_token=')) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  showIntro();
}
