import './style.css'
import { renderCameraView, initCamera } from './components/camera-view.js';
import { renderConfirmView, initConfirmView } from './components/confirm-view.js';
import { renderSettingsView, initSettingsView } from './components/settings-view.js';
import { renderIntroView, initIntroView } from './components/intro-view.js';
import { renderHistoryView, initHistoryView } from './components/history-view.js';
import { renderRankListView, initRankListView } from './components/rank-list-view.js';
import { getPosition, getCurrentHeading, calculateOffsetPosition, getLastKnownPosition } from './services/geo.js';
import { auth } from './services/auth.js';

import { t } from './services/i18n.js';
import { CONSTANTS } from './constants.js';



// Init Compass & GPS Tracking early
// Init Compass & GPS Tracking (Moved to Start/Camera)
import { initCompass, stopCompass, startTracking, stopTracking } from './services/geo.js';
// initCompass(); // Managed per view now
// startTracking() is now managed per view

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

  // Accessibility: Focus Management
  app.setAttribute('tabindex', '-1');
  app.focus();

  // Init new view and store cleanup (if any)
  const cleanup = initFn();
  if (typeof cleanup === 'function') {
    currentCleanup = cleanup;
  }
}

// Global Visibility Handler to save battery
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopTracking();
    stopCompass();
  } else {
    // Resume tracking only if we are in a view that needs it
    if (state.view === 'camera' || state.view === 'confirm') {
      startTracking();
      initCompass();
    }
  }
});

function showIntro() {
  stopTracking(); // Save Battery
  stopCompass();
  switchView('intro', renderIntroView, () =>
    initIntroView(app,
      () => showCamera(),
      () => showSettings(),
      handleEdit
    )
  );
}

async function showCamera() {
  startTracking(); // Need High Accuracy
  initCompass();
  // Manual switch because async init is special
  if (currentCleanup) { currentCleanup(); currentCleanup = null; }
  state.view = 'camera';
  app.innerHTML = renderCameraView();

  const cleanup = await initCamera(app,
    () => showIntro(), // onBack
    async (blob) => {  // onCapture
      // Mock capture if blob is null (from fallback button)
      if (!blob) {
        const canvas = document.createElement('canvas');
        canvas.width = CONSTANTS.CANVAS_WIDTH; canvas.height = CONSTANTS.CANVAS_HEIGHT;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ef4444'; // Red for hydrant
        ctx.fillRect(0, 0, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);
        blob = await new Promise(r => canvas.toBlob(r));
      }

      state.capturedBlob = blob;

      // Loading State UI
      // Loading State UI
      const overlay = document.createElement('div');
      overlay.className = "absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 text-white animate-fade-in";
      const spinner = document.createElement('div');
      spinner.className = "w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4";
      const text = document.createElement('span');
      text.className = "font-bold";
      text.textContent = t('messages.locating_position');
      overlay.append(spinner, text);
      app.appendChild(overlay);

      let loc;
      try {
        // Try fresh position (3s timeout)
        loc = await Promise.race([
          getPosition(),
          new Promise((_, r) => setTimeout(() => r(new Error('Timeout')), CONSTANTS.GPS_TIMEOUT_MS))
        ]);
        // loc is { lat, lng, accuracy, heading } from geo.js
      } catch (e) {
        console.warn('GPS Fresh failed, using cached:', e);
        const last = getLastKnownPosition();
        if (last) {
          loc = { ...last }; // lat, lng, accuracy, heading
        } else {
          // Absolute Fallback (Munich)
          loc = { lat: CONSTANTS.DEFAULT_LAT, lng: CONSTANTS.DEFAULT_LNG, accuracy: 999, heading: 0 };
        }
      }

      // Now we have a loc (flat object)
      try {
        const heading = loc.heading || getCurrentHeading() || 0;
        const finalLoc = calculateOffsetPosition(loc.lat, loc.lng, CONSTANTS.OFFSET_DISTANCE_M, heading);

        state.location = {
          lat: finalLoc.lat,
          lng: finalLoc.lng,
          accuracy: loc.accuracy,
          heading: heading
        };

        showConfirm();
      } catch (err) {
        console.error("Calculation Error", err);
        state.location = { lat: CONSTANTS.DEFAULT_LAT, lng: CONSTANTS.DEFAULT_LNG, accuracy: 999 };
        showConfirm();
      }
    });

  // Settings Button
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.onclick = () => showSettings();
  }

  if (typeof cleanup === 'function') {
    currentCleanup = cleanup;
  }
}

// New: Edit Mode Handler (Delegated)
function handleEdit(nodeId) {
  stopTracking(); // Not needed for edit? Actually maybe yes for distance to target?
  stopCompass();
  // But let's save battery for now as we edit a fixed node.
  import('./controllers/edit-controller.js').then(({ handleEdit }) => {
    handleEdit(nodeId, app, {
      showSettings: () => showSettings(),
      showIntro: () => showIntro()
    });
  });
}




function showHistory() {
  stopTracking();
  stopCompass();
  state.view = 'history';
  app.innerHTML = renderHistoryView();
  initHistoryView(app, () => showSettings());
}

function showRankList(count) {
  stopTracking();
  stopCompass();
  state.view = 'rank-list';
  app.innerHTML = renderRankListView();
  initRankListView(app, () => showSettings(), count);
}

function showSettings() {
  stopTracking();
  stopCompass();
  state.view = 'settings';
  app.innerHTML = renderSettingsView();
  initSettingsView(app,
    () => showIntro(), // onBack
    () => showHistory(), // onHistory
    (count) => showRankList(count) // onShowRankList
  );
}

function showConfirm() {
  startTracking(); // Keep tracking for updates
  initCompass();
  state.view = 'confirm';
  app.innerHTML = renderConfirmView();
  initConfirmView(app, state.capturedBlob, state.location,
    {
      back: () => {
        console.log("Main: Switching back to Camera...");
        showCamera().catch(err => {
          console.error("Main: Failed to show Camera", err);
          import('./components/overlay.js').then(({ showMessageOverlay }) => {
            showMessageOverlay(app, t('general.error'), t('messages.camera_error').replace('{error}', err.message), 'error');
          });
        });
      },
      retryGPS: async () => {
        try {
          // Hard fetch
          const l = await getPosition();
          return { lat: l.lat, lng: l.lng, accuracy: l.accuracy };
        } catch (e) {
          import('./components/overlay.js').then(({ showMessageOverlay }) => {
            showMessageOverlay(app, t('general.error'), t('messages.gps_update_failed').replace('{error}', e.message), 'error');
          });
          return null;
        }
      }
    },
    (data) => {
      // Submit Logic
      // console.log("Submitting Hydrant:", data);

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
              <h2 class="text-2xl font-bold text-white mb-2">${t('general.error')}!</h2>
              <p class="text-gray-400 mb-6 text-sm">${t('messages.no_osm_credentials')}</p>
              
              <button id="error-settings-btn" class="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-bold transition">
                 ${t('messages.to_settings')}
              </button>
              <button id="error-close-btn" class="mt-4 text-sm text-gray-400 hover:text-white transition">
                 ${t('general.cancel')}
              </button>
           </div>
        `;
        app.appendChild(overlay);

        document.getElementById('error-settings-btn').onclick = () => showSettings();
        document.getElementById('error-close-btn').onclick = () => overlay.remove();
        return;
      }

      const btn = document.getElementById('submit-img-btn');
      if (btn) {
        btn.innerHTML = `<span>${t('messages.uploading')}</span>`;
        btn.disabled = true;
      }

      // Real Upload Logic -> Use new Overlay
      import('./services/osm.js').then(({ createHydrant }) => {
        import('./components/overlay.js').then(({ showProcessOverlay }) => {
          showProcessOverlay(
            app,
            t('messages.upload_wait'),
            (log) => createHydrant(data, log),
            {
              onClose: (result) => {
                if (result) showIntro(); // Success -> Intro
                else {
                  // Error -> Re-enable button
                  if (btn) {
                    btn.innerHTML = `<span>${t('general.retry')}</span>`;
                    btn.disabled = false;
                  }
                }
              }
            }
          );
        });
      });
    }
  );
}

// Init App / Auth Check (Custom PKCE)
// Init App / Auth Check (Custom PKCE)
import('./controllers/auth-controller.js').then(({ handleAuthCallback }) => {
  handleAuthCallback(location.search, location.hash, app, {
    showSettings: () => showSettings(),
    showIntro: () => showIntro()
  });
});
