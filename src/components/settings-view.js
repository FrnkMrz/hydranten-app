import { auth, checkLogin } from '../services/auth.js';

export function renderSettingsView() {
  return `
    <div class="h-full w-full bg-slate-900 text-white flex flex-col p-6 animate-fade-in relative overflow-hidden">
      <!-- Background Decorative -->
      <div class="absolute -top-20 -right-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Header -->
      <div class="flex items-center justify-between w-full mb-8 z-10">
         <div class="flex items-center gap-4">
             <div class="bg-gray-800 p-3 rounded-2xl shadow-lg border border-gray-700">
                 <span class="text-3xl">⚙️</span>
             </div>
             <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Einstellungen</h1>
         </div>
         <!-- Info Button (Always Visible) -->
         <button id="info-btn" class="w-10 h-10 rounded-full bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-700 transition flex items-center justify-center border border-gray-700 ml-4">
            <span class="font-serif italic font-bold text-lg">i</span>
         </button>
      </div>

      <!-- Login Section -->
      <div class="flex-grow z-10 text-center flex flex-col items-center justify-center">
         <div class="bg-gray-800/80 backdrop-blur-md p-8 rounded-3xl border border-gray-700 shadow-xl w-full max-w-sm" id="login-container">
            <h2 class="text-xl font-bold mb-6 flex items-center justify-center gap-2">
                        <p>Code: MIT License</p>
                        <a href="https://github.com/FrnkMrz/hydranten-app" target="_blank" class="text-blue-400 hover:text-blue-300 underline mt-1 block">
                            📂 Projekt auf GitHub ansehen
                        </a>
                    </div>
                </div>

                <button id="close-info-btn" class="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition">
                    Verstanden
                </button>
            </div>
          `;
  element.appendChild(modal);
  modal.querySelector('#close-info-btn').onclick = () => modal.remove();
};
  }

const updateUI = (username) => {
  if (username) {
    statusDiv.classList.remove('hidden');
    userDisplay.innerText = username.startsWith("Error") ? username : username;
    userDisplay.className = username.startsWith("Error") ? "text-xs font-mono text-red-400 break-words" : "text-xl font-bold text-green-400";
    loginBtn.classList.add('hidden');
    helpText.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
  } else {
    statusDiv.classList.add('hidden');
    loginBtn.classList.remove('hidden');
    helpText.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
  }

  // Update Debug Info
  try {
    const raw = localStorage.getItem('osm-auth');
    log("Token in Storage: " + (raw ? "YES" : "NO"));
  } catch (e) { }
};

// Init Check
if (auth.authenticated()) {
  checkLogin().then(name => updateUI(name || "Eingeloggt"));
} else {
  updateUI(null);
}

// LOGIN HANDLER: Use Custom Auth
loginBtn.onclick = () => {
  log("Starting Login...");
  auth.login().catch(err => {
    log("Login Start Error: " + err);
    alert("Login Fehler: " + err);
  });
};

logoutBtn.onclick = () => {
  auth.logout();
  updateUI(null);
  alert("Erfolgreich ausgeloggt.");
};

resetBtn.onclick = () => {
  // DEBUG: Show what is in storage before clearing
  const raw = localStorage.getItem('osm-auth');
  const verifier = localStorage.getItem('osm_pkce_verifier');
  alert(`Storage Content:\nToken: ${raw ? 'YES' : 'NO'}\nVerifier: ${verifier ? 'YES' : 'NO'}`);

  auth.logout();
  localStorage.removeItem('osm_pkce_verifier'); // Clean legacy
  window.location.reload();
};
}
