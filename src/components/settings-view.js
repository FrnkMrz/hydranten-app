import { auth, checkLogin } from '../services/auth.js';
import { t } from '../services/i18n.js';
import { getRank, fetchUserHydrantCount } from '../services/gamification.js';
import { getRankBadgeSVG } from '../services/rank-graphics.js';

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
               <button id="real-logout-btn" class="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold">
                  ${t('settings.disconnect_btn')}
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
      <div class="flex-grow z-10 text-center flex flex-col items-center justify-start overflow-y-auto w-full px-4 pb-4">
         
         <!-- Map Style Section -->
         <div class="bg-gray-800/80 backdrop-blur-md p-6 rounded-3xl border border-gray-700 shadow-xl w-full max-w-sm mb-6 mt-4">
             <div class="grid grid-cols-3 gap-3" id="map-style-options">
                <button class="map-style-btn flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition active:scale-95 text-gray-400" data-style="osm">
                   <div class="w-10 h-10 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center text-xl">🚗</div>
                   <span class="text-xs font-bold">Standard</span>
                </button>
                <button class="map-style-btn flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition active:scale-95 text-gray-400" data-style="satellite">
                   <div class="w-10 h-10 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center text-xl">🛰️</div>
                   <span class="text-xs font-bold">Satellit</span>
                </button>
                <button class="map-style-btn flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition active:scale-95 text-gray-400" data-style="topo">
                   <div class="w-10 h-10 rounded-full bg-orange-500/20 border-2 border-orange-400 flex items-center justify-center text-xl">🏔️</div>
                   <span class="text-xs font-bold">Topo</span>
                </button>
             </div>
         </div>

         <div class="bg-gray-800/80 backdrop-blur-md p-8 rounded-3xl border border-gray-700 shadow-xl w-full max-w-sm" id="login-container">
            <h2 class="text-xl font-bold mb-6 flex items-center justify-center gap-2">
               OpenStreetMap Login
            </h2>
            
            ${loginStatusHTML}
         </div>

         <!-- Rank / Gamification Section (Separate Box) -->
         <div id="gamification-container" class="hidden w-full max-w-sm mt-4 bg-gray-800/80 backdrop-blur-md p-6 rounded-3xl border border-gray-700 shadow-xl">
              <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 text-center">${t('gamification.level_title')}</h3>
              
              <div class="bg-gradient-to-br from-red-900/40 to-black p-6 rounded-3xl border border-red-500/30 relative overflow-hidden flex flex-col items-center">
                 <!-- Background Icon -->
                 <div class="absolute -right-4 -bottom-4 text-9xl opacity-10 pointer-events-none">🚒</div>
                 
                 <!-- Badge (Larger & Centered) -->
                 <div class="w-32 h-32 mb-4 bg-transparent flex items-center justify-center filter drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" id="rank-badge">
                    <!-- SVG inserted here -->
                 </div>

                 <!-- Rank Name -->
                 <div class="text-2xl font-bold text-white mb-6 text-center tracking-wide" id="rank-name">Feuerwehranwärter</div>
                 
                 <!-- Progress Bar -->
                 <div class="relative w-full h-4 bg-gray-800 rounded-full overflow-hidden mb-2 border border-gray-700">
                     <div id="rank-progress" class="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 via-red-500 to-red-600 w-0 transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                 </div>
                 
                 <div class="flex justify-between w-full text-xs text-gray-400 font-mono px-1">
                     <span id="rank-current-count">0</span>
                     <span id="rank-next-count">10</span>
                 </div>
                 
                 <p class="text-sm text-center mt-4 text-gray-300 font-medium" id="rank-message">
                    Noch 10 bis zum nächsten Level!
                 </p>
              </div>
         </div>
         
         <!-- Force Reset Button -->
         <button id="reset-btn" class="w-full max-w-sm py-3 bg-red-900/10 text-red-600 rounded-xl font-bold mt-8 border border-red-500/10 hover:bg-red-900/20 transition text-sm">
             ${t('settings.app_reset')}
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

export function initSettingsView(element, onBack, onHistory, onShowRankList) {
  element.querySelector('#back-btn').onclick = onBack;

  const loginBtn = element.querySelector('#login-btn');
  // Note: logout-btn is now a container div
  const logoutContainer = element.querySelector('#logout-btn');
  const logoutBtn = element.querySelector('#real-logout-btn');
  // historyBtn removed
  const resetBtn = element.querySelector('#reset-btn');
  const statusDiv = element.querySelector('#auth-status');
  const userDisplay = element.querySelector('#user-display');
  const helpText = element.querySelector('#auth-help');
  const infoBtn = element.querySelector('#info-btn');

  const log = (msg) => {
    console.log("[Settings]", msg);
  };

  // --- EVENT LISTENERS (Define FIRST to ensure they are attached) ---

  // LOGIN HANDLER: Use Custom Auth
  if (loginBtn) {
    loginBtn.onclick = () => {
      log("Starting Login...");
      auth.login().catch(err => {
        log("Login Start Error: " + err);
        alert("Login Fehler: " + err);
      });
    };
  }

  if (logoutBtn) {
    logoutBtn.onclick = () => {
      auth.logout();
      localStorage.removeItem('osm_user_img');
      updateUI(null);
      alert(t('settings.disconnect_btn') + "!");
    };
  }

  if (resetBtn) {
    resetBtn.onclick = () => {
      if (confirm(t('settings.reset_btn') + "?")) {
        auth.logout();
        localStorage.removeItem('osm_pkce_verifier');
        localStorage.removeItem('osm_user_img');
        window.location.reload();
      }
    };
  }

  // Info Modal Logic
  if (infoBtn) {
    infoBtn.onclick = () => {
      const modal = document.createElement('div');
      modal.className = "absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-6 animate-fade-in backdrop-blur-md";
      modal.innerHTML = `
            <div class="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl overflow-y-auto max-h-[80vh]">
                <h3 class="text-xl font-bold text-white mb-4">${t('intro.info_legal')}</h3>
                
                <div class="space-y-4 text-sm text-gray-300">
                    <p><strong>${t('intro.title_pre')} ${t('intro.title_post')}</strong> (v1.3.0)</p>
                    
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
                        <p>Data <a href="https://www.openstreetmap.org/copyright" target="_blank" class="text-blue-400 hover:text-blue-300 underline">© OpenStreetMap contributors</a>.</p>
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

  // Map Style Logic
  const mapStyleBtns = element.querySelectorAll('.map-style-btn');
  const updateMapStyleUI = () => {
    const currentStyle = localStorage.getItem('map_style') || 'osm';
    mapStyleBtns.forEach(btn => {
      if (btn.dataset.style === currentStyle) {
        btn.classList.add('bg-blue-600/30', 'border-blue-400', 'shadow-lg');
        btn.classList.remove('bg-white/5', 'border-white/10');
      } else {
        btn.classList.remove('bg-blue-600/30', 'border-blue-400', 'shadow-lg');
        btn.classList.add('bg-white/5', 'border-white/10');
      }
    });
  };

  mapStyleBtns.forEach(btn => {
    btn.onclick = () => {
      const style = btn.dataset.style;
      localStorage.setItem('map_style', style);
      updateMapStyleUI();
      // Optional: Show toast feedback
      // But visual active state is usually enough
    };
  });
  updateMapStyleUI(); // Init State

  const updateUI = (username) => {
    if (username) {
      statusDiv.classList.remove('hidden');

      // Sanitization
      let diffName = username;
      if (!diffName.startsWith("Error")) {
        diffName = diffName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
      }

      userDisplay.innerText = diffName;
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
    const renderUserLogic = (name) => {
      updateUI(name || "Eingeloggt");

      // Fetch & Show Gamification
      if (name && !name.startsWith("Error")) {
        const gameContainer = element.querySelector('#gamification-container');
        const rankBadge = element.querySelector('#rank-badge');
        const rankName = element.querySelector('#rank-name');
        const rankProgress = element.querySelector('#rank-progress');
        const rankCurrent = element.querySelector('#rank-current-count');
        const rankNext = element.querySelector('#rank-next-count');
        const rankMsg = element.querySelector('#rank-message');

        if (gameContainer) {
          // gameContainer.classList.remove('hidden'); // MOVED INSIDE
          fetchUserHydrantCount(name).then(count => {
            const rank = getRank(count);
            rankName.innerText = rank.current.name;
            rankCurrent.innerText = count;
            if (rank.next) {
              rankNext.innerText = rank.next.min;
              const pct = Math.min(100, Math.max(0, rank.progress * 100));
              rankProgress.style.width = `${pct}%`;
              // Localized message: "Noch {count} bis zum {rank}!"
              // We pass the German Rank Name as a variable, so it stays German in all languages.
              rankMsg.innerText = t('gamification.rank_progress')
                .replace('{count}', rank.needed)
                .replace('{rank}', rank.next.name);
            } else {
              rankNext.innerText = "MAX";
              rankProgress.style.width = '100%';
              rankMsg.innerText = t('gamification.rank_max');
            }
            const svg = getRankBadgeSVG(rank.current.id);
            rankBadge.innerHTML = svg.replace('width="64"', 'width="100%"').replace('height="64"', 'height="100%"');

            // Show Container NOW
            gameContainer.classList.remove('hidden');

            if (onShowRankList && gameContainer) {
              gameContainer.style.cursor = 'pointer';
              gameContainer.onclick = () => onShowRankList(count);
            }
          }).catch(console.error);
        }
      }
    };

    // 1. Cache
    const cached = localStorage.getItem('osm_user_name');
    if (cached) renderUserLogic(cached);

    // 2. Network
    checkLogin().then(name => {
      // Always update to ensure avatar is refresh/loaded (even if name is same)
      if (name) renderUserLogic(name);
    });

  } else {
    updateUI(null);
  }








}
