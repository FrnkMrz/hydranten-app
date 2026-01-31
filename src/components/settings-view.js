import { auth, checkLogin } from '../services/auth.js';

export function renderSettingsView() {
  return `
    <div class="h-full w-full bg-slate-900 text-white flex flex-col p-6 animate-fade-in relative overflow-hidden">
      <!-- Background Decorative -->
      <div class="absolute -top-20 -right-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Header -->
      <div class="flex items-center gap-4 mb-8 z-10">
         <div class="bg-gray-800 p-3 rounded-2xl shadow-lg border border-gray-700">
             <span class="text-3xl">⚙️</span>
         </div>
         <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Einstellungen</h1>
      </div>

      <!-- Login Section -->
      <div class="flex-grow z-10 text-center flex flex-col items-center justify-center">
         <div class="bg-gray-800/80 backdrop-blur-md p-8 rounded-3xl border border-gray-700 shadow-xl w-full max-w-sm" id="login-container">
            <h2 class="text-xl font-bold mb-6 flex items-center justify-center gap-2">
               OpenStreetMap Login
            </h2>
            
            <div id="auth-status" class="mb-6 text-center py-4 bg-black/20 rounded-xl hidden">
                <p class="text-gray-400 text-sm mb-2">Angemeldet als:</p>
                <p id="user-display" class="text-xl font-bold text-green-400">...</p>
            </div>

            <p class="text-sm text-gray-400 mb-8 leading-relaxed" id="auth-help">
               Verbinde dich mit deinem Konto, um Hydranten hochzuladen.
            </p>

            <button id="login-btn" class="w-full py-4 bg-[#7EBC6F] hover:bg-[#6CAE5D] text-white rounded-xl font-bold shadow-lg shadow-green-900/20 active:scale-95 transition flex items-center justify-center gap-3">
               <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-1.07 3.97-2.9 5.39z"/></svg>
               <span>Mit OSM verbinden</span>
            </button>
            
            <button id="logout-btn" class="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold mt-4 hidden transition">
               Abmelden
            </button>
         </div>
         
         <!-- Force Reset Button -->
         <button id="reset-btn" class="w-full max-w-sm py-3 bg-red-900/10 text-red-600 rounded-xl font-bold mt-8 border border-red-500/10 hover:bg-red-900/20 transition text-sm">
             ⚠️ App Zurücksetzen (Logout)
         </button>
      </div>

      <div class="z-10 mt-auto">
         <button id="back-btn" class="w-full py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold transition">
            Zurück
         </button>
         <p class="text-center text-[10px] text-gray-600 mt-4">Version 0.3.3 (Debug) • Hydranten Jäger</p>
      </div>
    </div>
  `;
}

export function initSettingsView(element, onBack) {
  element.querySelector('#back-btn').onclick = onBack;

  const loginBtn = element.querySelector('#login-btn');
  const logoutBtn = element.querySelector('#logout-btn');
  const resetBtn = element.querySelector('#reset-btn');
  const statusDiv = element.querySelector('#auth-status');
  const userDisplay = element.querySelector('#user-display');
  const helpText = element.querySelector('#auth-help');

  const updateUI = (username) => {
    if (username) {
      statusDiv.classList.remove('hidden');
      // If username starts with "Error", show red
      if (username.startsWith("Error")) {
        // Check Token
        let token = null;
        try {
          const local = JSON.parse(localStorage.getItem('osm-auth') || '{}');
          const session = JSON.parse(sessionStorage.getItem('osm-auth') || '{}');
          token = local.access_token || session.access_token || "MISSING";

          if (!localStorage.getItem('osm-auth') && !sessionStorage.getItem('osm-auth')) token = "NO_KEY (Loc/Ses)";
        } catch (e) { token = "JSON_PARSE_ERR"; }

        const tokenDebug = token && token.length > 5 ? `Token: ${token.substring(0, 5)}...` : `Token: ${token}`;

        userDisplay.innerText = "Debug: " + username + "\n" + tokenDebug;
        userDisplay.className = "text-xs font-mono text-red-400 break-words";
      } else {
        userDisplay.innerText = username;
        userDisplay.className = "text-xl font-bold text-green-400";
      }
      loginBtn.classList.add('hidden');
      helpText.classList.add('hidden');
      logoutBtn.classList.remove('hidden');
    } else {
      statusDiv.classList.add('hidden');
      loginBtn.classList.remove('hidden');
      helpText.classList.remove('hidden');
      logoutBtn.classList.add('hidden');
    }
  };

  // Check Login on Init
  if (auth.authenticated()) {
    checkLogin().then(name => {
      updateUI(name || "Eingeloggt");
    });
  } else {
    updateUI(null);
  }

  loginBtn.onclick = () => {
    // Manual Implicit Flow Redirect
    const clientId = 'eJij_gzo2QRG-oRCZYU2FObBOgX2Z8lbIINezbHmJRI';
    const redirectUri = window.location.origin + window.location.pathname;
    const scope = 'read_prefs write_api';

    const url = `https://www.openstreetmap.org/oauth2/authorize?response_type=token&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;

    window.location.href = url;
  };

  logoutBtn.onclick = () => {
    auth.logout();
    updateUI(null);
    alert("Erfolgreich ausgeloggt.");
  };

  resetBtn.onclick = () => {
    // DEBUG: Show what is in storage before clearing
    const raw = localStorage.getItem('osm-auth');
    alert("Storage Content:\n" + (raw ? raw.substring(0, 200) : "NULL"));

    auth.logout();
    localStorage.clear();
    window.location.reload();
  };
}
