import './style.css'
import { renderCameraView, initCamera } from './components/camera-view.js';
import { renderConfirmView, initConfirmView } from './components/confirm-view.js';
import { renderSettingsView, initSettingsView } from './components/settings-view.js';
import { renderIntroView, initIntroView } from './components/intro-view.js';
import { getPosition, initCompass, getCurrentHeading, calculateOffsetPosition } from './services/geo.js';

// Init Compass early
initCompass();

const app = document.querySelector('#app');

// Simple State Management
const state = {
  view: 'intro', // Start with intro
  capturedBlob: null,
  location: null
};

function showIntro() {
  state.view = 'intro';
  app.innerHTML = renderIntroView();
  initIntroView(app,
    () => showCamera(),
    () => showSettings()
  );
}

async function showCamera() {
  state.view = 'camera';
  app.innerHTML = renderCameraView();

  // Initialize Camera Logic
  await initCamera(app, async (blob) => {
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

    try {
      const loc = await getPosition();

      // Calculate Offset (3m in direction of compass)
      // If heading is missing in Geolocation (often happens), try our visual compass fallback
      const heading = loc.heading || getCurrentHeading();

      const finalLoc = calculateOffsetPosition(loc.lat, loc.lng, 3, heading);
      console.log("Offset Calculation:", finalLoc);

      state.location = {
        ...loc,
        lat: finalLoc.lat,
        lng: finalLoc.lng,
        _debug: finalLoc // valid JSON
      };

      showConfirm();
    } catch (e) {
      console.warn("Geo fail:", e);
      // Fallback/Mock
      state.location = { lat: 48.137, lng: 11.576, accuracy: 50 };
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
  initSettingsView(app, () => showCamera());
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

      const btn = document.getElementById('submit-img-btn');
      btn.innerHTML = `<span>Speichere...</span>`;
      btn.disabled = true;

      // Simulate network request duration
      // Simulate network request duration
      setTimeout(() => {
        // Overlay for Success
        const overlay = document.createElement('div');
        overlay.className = "absolute inset-0 z-50 flex items-center justify-center bg-gray-900/95 animate-fade-in px-4 text-center";

        const userMsg = creds.user ? `Angemeldet als: ${creds.user}` : "(Lokal gespeichert)";

        overlay.innerHTML = `
           <div class="flex flex-col items-center">
              <div class="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-900/40">
                 <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h2 class="text-2xl font-bold text-white mb-2">Gespeichert!</h2>
              <p class="text-gray-400 mb-8 text-sm">${userMsg}</p>
              <p class="text-xs text-gray-500 animate-pulse">Kehre zurück zum Start...</p>
           </div>
        `;
        app.appendChild(overlay);

        // Auto-Redirect to Intro after 2s
        setTimeout(() => {
          showIntro();
        }, 2200);

      }, 1000);
    }
  );
}

// Init App
showIntro();
