import { icon } from './components/icons.js';
// Display typeface, self-hosted. Imported here (not via CSS @import) so Vite
// rewrites the font URLs and emits the files into the build.
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import './style.css'
import { renderCameraView, initCamera } from './components/camera-view.js';
import { renderConfirmView, initConfirmView } from './components/confirm-view.js';
import { renderSettingsView, initSettingsView } from './components/settings-view.js';
import { renderIntroView, initIntroView } from './components/intro-view.js';
import { renderHistoryView, initHistoryView } from './components/history-view.js';
import { renderRankListView, initRankListView } from './components/rank-list-view.js';
import { getPosition, getCurrentHeading, calculateOffsetPosition, getLastKnownPosition, hasReliableGpsFix, updatePosition } from './services/geo.js';
import { auth } from './services/auth.js';
import { createHydrant } from './services/osm.js';
import { registerSW } from 'virtual:pwa-register';
import { initPwaUpdates } from './services/pwa-update.js';

import { t } from './services/i18n.js';
import { CONSTANTS } from './constants.js';



// Init Compass & GPS Tracking early
// Init Compass & GPS Tracking (Moved to Start/Camera)
import { initCompass, stopCompass, startTracking, stopTracking } from './services/geo.js';
// initCompass(); // Managed per view now
// startTracking() is now managed per view

const app = document.querySelector('#app');

initPwaUpdates(registerSW);

// Simple State Management
const state = {
  view: 'intro', // Start with intro
  capturedBlob: null,
  location: null
};

// Clean up function for current view
let currentCleanup = null;

// A11y: Screen Reader Announcer
let a11yAnnouncer = document.getElementById('a11y-announcer');
if (!a11yAnnouncer) {
  a11yAnnouncer = document.createElement('div');
  a11yAnnouncer.id = 'a11y-announcer';
  a11yAnnouncer.className = 'sr-only'; // Tailwind utility for visually hidden
  a11yAnnouncer.setAttribute('aria-live', 'polite');
  a11yAnnouncer.setAttribute('aria-atomic', 'true');
  document.body.appendChild(a11yAnnouncer);
}

function switchView(viewName, renderFn, initFn) {
  // Cleanup previous view
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  state.view = viewName;
  app.innerHTML = renderFn();

  // Accessibility: Focus Management and Announcement
  app.setAttribute('tabindex', '-1');
  app.focus();

  // Announce the view change to screen readers
  const viewMap = {
    'intro': t('intro.title_pre') + ' ' + t('intro.title_post'),
    'camera': t('camera.capture_btn_aria'),
    'confirm': t('confirm.title'),
    'settings': t('settings.title'),
    'history': t('settings.history_btn')
  };
  const announcedName = viewMap[viewName] || viewName;
  a11yAnnouncer.textContent = announcedName;

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
      overlay.className = "hj-backdrop absolute inset-0 flex flex-col items-center justify-center z-50 text-white animate-fade-in";
      const spinner = document.createElement('div');
      spinner.className = "hj-spinner w-9 h-9 mb-5";
      const text = document.createElement('span');
      text.className = "hj-eyebrow";
      text.textContent = t('messages.locating_position');
      overlay.append(spinner, text);
      app.appendChild(overlay);

      let loc;
      try {
        // Try a genuinely fresh position (3s timeout)
        loc = await Promise.race([
          getPosition(true),
          new Promise((_, r) => setTimeout(() => r(new Error('Timeout')), CONSTANTS.GPS_TIMEOUT_MS))
        ]);
        if (!hasReliableGpsFix(loc)) {
          throw new Error('GPS fix is stale or too inaccurate');
        }
      } catch (e) {
        console.warn('Fresh GPS failed, checking recent cache:', e);
        const last = getLastKnownPosition();

        if (hasReliableGpsFix(last)) {
          loc = { ...last }; // lat, lng, accuracy, heading
        } else {
          state.capturedBlob = null;
          const { showMessageOverlay } = await import('./components/overlay.js');
          showMessageOverlay(
            app,
            t('general.error'),
            t('error.gps_failed'),
            'error',
            () => showCamera()
          );
          return;
        }
      }

      // Now we have a loc (flat object)
      try {
        if (!Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) {
          throw new Error('Invalid GPS coordinates');
        }

        const deviceHeading = Number.isFinite(loc.heading) ? loc.heading : getCurrentHeading();
        const heading = Number.isFinite(deviceHeading) ? deviceHeading : null;
        const finalLoc = calculateOffsetPosition(loc.lat, loc.lng, CONSTANTS.OFFSET_DISTANCE_M, heading);

        state.location = {
          lat: finalLoc.lat,
          lng: finalLoc.lng,
          accuracy: loc.accuracy,
          heading: heading,
          timestamp: loc.timestamp,
          timestampIsDevice: loc.timestampIsDevice
        };

        updatePosition({
          coords: {
            latitude: loc.lat,
            longitude: loc.lng,
            accuracy: loc.accuracy,
            heading: loc.heading
          },
          timestamp: loc.timestamp,
          timestampIsDevice: loc.timestampIsDevice
        });

        showConfirm();
      } catch (err) {
        console.error("Calculation Error", err);
        state.capturedBlob = null;
        const { showMessageOverlay } = await import('./components/overlay.js');
        showMessageOverlay(
          app,
          t('general.error'),
          t('error.gps_failed'),
          'error',
          () => showCamera()
        );
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
    const cleanupEdit = handleEdit(nodeId, app, {
      showSettings: () => showSettings(),
      showIntro: () => showIntro()
    });
    if (typeof cleanupEdit === 'function') {
      const cleanupPreviousView = currentCleanup;
      currentCleanup = () => {
        cleanupEdit();
        cleanupPreviousView?.();
      };
    }
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
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  startTracking(); // Keep tracking for updates
  initCompass();
  state.view = 'confirm';
  app.innerHTML = renderConfirmView();
  const cleanup = initConfirmView(app, state.capturedBlob, state.location,
    {
      back: () => {
        console.log("Main: Switching back to Camera...");
        state.capturedBlob = null;
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
          const l = await getPosition(true);
          if (!hasReliableGpsFix(l)) return null;
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
        overlay.className = "hj-backdrop absolute inset-0 z-50 flex items-center justify-center animate-fade-in px-5 text-center";
        overlay.innerHTML = `
           <div class="hj-dialog hj-dialog-error flex flex-col items-center w-full max-w-xs p-6">
              <div class="hj-medallion hj-medallion-ember mb-4">
                 ${icon('user', 'w-6 h-6')}
              </div>
              <h2 class="hj-wordmark text-[1.9rem] mb-3">${t('general.error')}</h2>
              <p class="text-ivory/65 mb-6 text-sm leading-relaxed">${t('messages.no_osm_credentials')}</p>
              
              <button id="error-settings-btn" class="hj-btn hj-btn-light w-full">
                 ${t('messages.to_settings')}
              </button>
              <button id="error-close-btn" class="mt-3 min-h-11 px-4 text-sm font-medium text-ivory/55 hover:text-ivory transition">
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
      import('./components/overlay.js').then(({ showProcessOverlay }) => {
        showProcessOverlay(
          app,
          t('messages.upload_wait'),
          (log) => createHydrant(data, log),
          {
            onClose: (result) => {
              if (result) {
                state.capturedBlob = null;
                showIntro(); // Success -> Intro
              }
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
      }).catch(err => {
        console.error("Failed to load overlay module", err);
        alert("Error: " + err.message);
        if (btn) {
          btn.innerHTML = `<span>${t('general.retry')}</span>`;
          btn.disabled = false;
        }
      });
    }
  );

  if (typeof cleanup === 'function') {
    currentCleanup = cleanup;
  }
}

// Init App / Auth Check (Custom PKCE)
// Init App / Auth Check (Custom PKCE)
import('./controllers/auth-controller.js').then(({ handleAuthCallback }) => {
  handleAuthCallback(location.search, location.hash, app, {
    showSettings: () => showSettings(),
    showIntro: () => showIntro()
  });
});
