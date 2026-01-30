import './style.css'
import { renderCameraView, initCamera } from './components/camera-view.js';
import { renderConfirmView, initConfirmView } from './components/confirm-view.js';
import { renderSettingsView, initSettingsView } from './components/settings-view.js';
import { getPosition } from './services/geo.js';

const app = document.querySelector('#app');

// Simple State Management
const state = {
  view: 'camera',
  capturedBlob: null,
  location: null
};

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
      state.location = loc;
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
      setTimeout(() => {
        const userMsg = creds.user ? `Angemeldet als: ${creds.user}` : "(Keine OSM Anbindung)";
        alert(`Hydrant erfasst!\n${userMsg}\n\nTyp: ${data.type}\nPosition: ${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`);
        showCamera();
      }, 1000);
    }
  );
}

// Init App
showCamera();
