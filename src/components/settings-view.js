import { auth, checkLogin } from '../services/auth.js';
import { t } from '../services/i18n.js';

export function renderSettingsView() {
  // Check Login Status for Dynamic UI
  let loginStatusHTML = `
            <div id="auth-status" class="mb-6 text-center py-4 bg-black/20 rounded-xl hidden relative">
                <p class="text-gray-400 text-sm mb-2">${t('settings.account')}</p>
                <div class="flex flex-col items-center justify-center gap-3">
                    <div id="user-avatar-container" class="hidden">
                        <img id="user-avatar" src="" alt="Avatar" class="w-16 h-16 rounded-full border-2 border-green-400 shadow-lg object-cover">
                    </div>
                    <p id="user-display" class="text-xl font-bold text-green-400">...</p>
                </div>
            </div>

            <p class="text-sm text-gray-400 mb-8 leading-relaxed" id="auth-help">
               ${t('intro.login_osm')}
            </p>

            <button id="login-btn" class="w-full py-4 bg-[#7EBC6F] hover:bg-[#6CAE5D] text-white rounded-xl font-bold shadow-lg shadow-green-900/20 active:scale-95 transition flex items-center justify-center gap-3">
               <svg aria-hidden="true" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-1.07 3.97-2.9 5.39z"/></svg>
               <span>${t('settings.connect_btn')}</span>
            </button>
            
            <div id="logout-btn" class="flex gap-2 w-full mt-4 hidden transition">
               <button id="real-logout-btn" class="flex-1 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold">
                  ${t('settings.disconnect_btn')}
               </button>
               <button id="history-btn" class="flex-1 py-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl font-bold flex items-center justify-center gap-2">
                  <span>📜</span>
                  <span>${t('history.btn_label')}</span>
               </button>
            </div>
  `;

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
             <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">${t('settings.title')}</h1>
         </div>
         <!-- Info Button (Always Visible) -->
         <button id="info-btn" class="w-10 h-10 rounded-full bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-700 transition flex items-center justify-center border border-gray-700 ml-4" aria-label="Information">
            <span class="font-serif italic font-bold text-lg" aria-hidden="true">i</span>
         </button>
      </div>

      <!-- Login Section -->
      <div class="flex-grow z-10 text-center flex flex-col items-center justify-center">
         <div class="bg-gray-800/80 backdrop-blur-md p-8 rounded-3xl border border-gray-700 shadow-xl w-full max-w-sm" id="login-container">
            <h2 class="text-xl font-bold mb-6 flex items-center justify-center gap-2">
               OpenStreetMap Login
            </h2>
            
            ${loginStatusHTML}

         </div>
         
         <!-- Force Reset Button -->
         <button id="reset-btn" class="w-full max-w-sm py-3 bg-red-900/10 text-red-600 rounded-xl font-bold mt-8 border border-red-500/10 hover:bg-red-900/20 transition text-sm">
             ⚠️ ${t('settings.app_reset')}
         </button>
      </div>

      <div class="z-10 mt-auto">
         <button id="back-btn" class="w-full py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold transition">
            ${t('settings.back_btn')}
         </button>
         <p class="text-center text-[10px] text-gray-600 mt-4">Version 1.3.0 (Stable) • Hydranten Jäger</p>
      </div>
    </div>
  `;
}

export function initSettingsView(element, onBack, onHistory) {
  element.querySelector('#back-btn').onclick = onBack;

  const loginBtn = element.querySelector('#login-btn');
  // Note: logout-btn is now a container div
  const logoutContainer = element.querySelector('#logout-btn');
  const logoutBtn = element.querySelector('#real-logout-btn');
  const historyBtn = element.querySelector('#history-btn');
  const resetBtn = element.querySelector('#reset-btn');
  const statusDiv = element.querySelector('#auth-status');
  const userDisplay = element.querySelector('#user-display');
  const helpText = element.querySelector('#auth-help');
  const infoBtn = element.querySelector('#info-btn');

  const log = (msg) => {
    console.log("[Settings]", msg);
  };

  // Info Modal Logic
  if (infoBtn) {
    infoBtn.onclick = () => {
      const modal = document.createElement('div');
      modal.className = "absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-6 animate-fade-in backdrop-blur-md";
      modal.innerHTML = `
            <div class="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl overflow-y-auto max-h-[80vh]">
                <h3 class="text-xl font-bold text-white mb-4">${t('intro.info_legal')}</h3>
                
                <div class="space-y-4 text-sm text-gray-300">
                    <p><strong>${t('intro.title_pre')} ${t('intro.title_post')}</strong> (v1.0 Beta)</p>
                    
                    <div class="border-l-2 border-gray-600 pl-3 py-1">
                        <h4 class="font-bold text-white mb-1">${t('intro.info_impressum')}</h4>
                        <p class="text-xs text-gray-400 mb-1">Angaben gemäß § 5 TMG:</p>
                        <p>Frank März</p>
                        <p>Kersbacher Weg 3</p>
                        <p>91220 Schnaittach</p>
                        <p>Deutschland</p>
                        <br>
                        <p><strong>Kontakt:</strong></p>
                        <p>Tel: +499153/9229501</p>
                        <p>E-Mail: info@openfiremap.org</p>
                    </div>

                    <div>
                        <h4 class="font-bold text-white">${t('intro.info_data')}</h4>
                        <p>${t('intro.info_data_text')}</p>
                    </div>

                    <div>
                        <h4 class="font-bold text-white">${t('intro.info_license')}</h4>
                        <p>Data © OpenStreetMap Contributors.</p>
                        <p>Code: MIT License</p>
                        <a href="https://github.com/FrnkMrz/hydranten-app" target="_blank" class="text-blue-400 hover:text-blue-300 underline mt-1 block">
                            📂 ${t('intro.info_github')}
                        </a>
                    </div>
                </div>

                <button id="close-info-btn" class="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition">
                    OK
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

      const img = localStorage.getItem('osm_user_img');
      const avatarContainer = element.querySelector('#user-avatar-container');
      const avatarImg = element.querySelector('#user-avatar');

      if (img && avatarContainer && avatarImg) {
        avatarImg.src = img;
        avatarContainer.classList.remove('hidden');
      } else if (avatarContainer) {
        avatarContainer.classList.add('hidden');
      }
      loginBtn.classList.add('hidden');
      helpText.classList.add('hidden');
      if (logoutContainer) logoutContainer.classList.remove('hidden');
    } else {
      statusDiv.classList.add('hidden');
      loginBtn.classList.remove('hidden');
      helpText.classList.remove('hidden');
      if (logoutContainer) logoutContainer.classList.add('hidden');
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
    localStorage.removeItem('osm_user_img');
    updateUI(null);
    alert(t('settings.disconnect_btn') + "!");
  };

  if (historyBtn && onHistory) {
    historyBtn.onclick = onHistory;
  }

  resetBtn.onclick = () => {
    if (confirm(t('settings.reset_btn') + "?")) {
      auth.logout();
      localStorage.removeItem('osm_pkce_verifier');
      localStorage.removeItem('osm_user_img');
      window.location.reload();
    }
  };
}
