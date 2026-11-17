import { auth, checkLogin } from '../services/auth.js';
import { t } from '../services/i18n.js';
import { APP_VERSION, APP_NAME } from '../version.js';
import { initMapStyleControls } from '../controllers/map-style-controller.js';
import { initGamificationWidget } from '../controllers/gamification-controller.js';
import { icon } from './icons.js';

export function renderSettingsView() {
  // Check Login Status for Dynamic UI
  let loginStatusHTML = `
            <div id="auth-status" class="mb-5 text-center py-4 hidden relative">
                <p class="hj-eyebrow mb-3">${t('settings.account')}</p>
                <div class="flex flex-col items-center justify-center gap-3">
                    <div id="user-avatar-container" class="hidden">
                        <img id="user-avatar" src="" alt="Avatar" class="w-20 h-20 rounded-full ring-1 ring-ivory/50 ring-offset-4 ring-offset-ink-900 object-cover">
                    </div>
                    <p id="user-display" class="hj-wordmark text-3xl">...</p>
                </div>
            </div>

            <p class="text-sm text-ivory/50 mb-6 leading-relaxed" id="auth-help">
               ${t('intro.login_osm')}
            </p>

            <button id="login-btn" class="hj-btn hj-btn-light w-full">
               ${icon('globe')}
               <span>${t('settings.connect_btn')}</span>
            </button>
            
            <div id="logout-btn" class="grid grid-cols-2 gap-2 w-full mt-2 hidden transition">
               <button id="history-btn" class="hj-btn hj-btn-ghost w-full px-3 text-sm font-medium">
                  ${icon('clock', 'w-4 h-4')}
                  ${t('settings.history_btn')}
               </button>
               <button id="real-logout-btn" class="hj-btn hj-btn-danger w-full px-3 text-sm font-medium">
                  ${icon('logout', 'w-4 h-4')}
                  ${t('settings.disconnect_btn')}
               </button>
            </div>
  `;

  return `
    <div class="hj-screen h-full w-full flex flex-col px-5 pb-5 pt-safe animate-fade-in relative overflow-hidden">

      <!-- Header -->
      <div class="flex items-end justify-between w-full mt-4 mb-5 z-10">
         <div class="min-w-0">
             <p class="hj-eyebrow mb-1">Hydranten <span class="hj-ember-text">Jäger</span></p>
             <h1 class="hj-wordmark text-[2.6rem] truncate">${t('settings.title')}</h1>
         </div>
         <!-- Info Button (Always Visible) -->
         <button id="info-btn" class="hj-fab shrink-0 ml-4" aria-label="Information">
            ${icon('info')}
         </button>
      </div>

      <!-- Login Section -->
      <div class="custom-scrollbar flex-grow z-10 text-center flex flex-col items-center justify-start overflow-y-auto w-full pb-4">
         
         <!-- Map Style Section -->
         <div class="w-full max-w-sm mb-4">
             <div class="grid grid-cols-3 gap-2" id="map-style-options">
                <button class="map-style-btn hj-option flex flex-col items-center gap-2.5 px-2 py-4" data-style="osm">
                   ${icon('map', 'w-6 h-6')}
                   <span class="text-xs font-medium tracking-wide">Standard</span>
                </button>
                <button class="map-style-btn hj-option flex flex-col items-center gap-2.5 px-2 py-4" data-style="satellite">
                   ${icon('orbit', 'w-6 h-6')}
                   <span class="text-xs font-medium tracking-wide">Satellit</span>
                </button>
                <button class="map-style-btn hj-option flex flex-col items-center gap-2.5 px-2 py-4" data-style="topo">
                   ${icon('mountain', 'w-6 h-6')}
                   <span class="text-xs font-medium tracking-wide">Topo</span>
                </button>
             </div>
         </div>

         <div class="hj-card p-6 w-full max-w-sm" id="login-container">
            ${loginStatusHTML}
         </div>

         <!-- Rank / Gamification Section (Separate Box) -->
         <div id="gamification-container" class="hidden w-full max-w-sm mt-6">
              <h3 class="hj-eyebrow mt-2 mb-3 text-center">${t('gamification.level_title')}</h3>
              
              <div class="hj-card bg-[radial-gradient(110%_70%_at_50%_0%,rgba(232,71,43,0.16),transparent_70%)] p-6 relative overflow-hidden flex flex-col items-center">
                 
                 <!-- Badge (Larger & Centered) -->
                 <div class="w-32 h-32 mb-4 bg-transparent flex items-center justify-center filter drop-shadow-[0_10px_24px_rgba(0,0,0,0.6)]" id="rank-badge">
                    <!-- SVG inserted here -->
                 </div>

                 <!-- Rank Name -->
                 <div class="hj-wordmark text-[2rem] mb-6 text-center" id="rank-name">Feuerwehranwärter</div>
                 
                 <!-- Progress Bar -->
                 <div class="relative w-full h-[3px] bg-ivory/15 rounded-full overflow-hidden mb-2.5">
                     <div id="rank-progress" class="absolute top-0 left-0 h-full rounded-full bg-ember-400 w-0 transition-all duration-1000"></div>
                 </div>
                 
                 <div class="flex justify-between w-full text-xs text-ivory/50 font-mono tabular-nums px-1">
                     <span id="rank-current-count">0</span>
                     <span id="rank-next-count">10</span>
                 </div>
                 
                 <p class="text-sm text-center mt-4 text-ivory/70 font-medium" id="rank-message">
                    Noch 10 bis zum nächsten Level!
                 </p>
              </div>
         </div>
         
         <!-- Force Reset Button -->
         <button id="reset-btn" class="w-full max-w-sm min-h-11 py-3 text-ivory/40 hover:text-ember-300 font-medium mt-6 transition text-xs underline underline-offset-4 decoration-ivory/20">
             ${t('settings.app_reset')}
         </button>
      </div>

      <div class="z-10 mt-auto pt-3">
         <button id="back-btn" class="hj-btn hj-btn-ghost w-full">
            ${t('settings.back_btn')}
         </button>
         <p class="text-center text-[10px] text-ivory/30 mt-3">Version ${APP_VERSION} (Stable) • ${APP_NAME}</p>
      </div>
    </div>
  `;
}

export function initSettingsView(element, onBack, onHistory, onShowRankList) {
  element.querySelector('#back-btn').onclick = onBack;

  const loginBtn = element.querySelector('#login-btn');
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

  // --- CONTROLLER INIT ---
  // 1. Map Style Logic (Extracted)
  initMapStyleControls(element);

  // --- EVENT LISTENERS ---

  if (historyBtn) {
    historyBtn.onclick = onHistory;
  }

  // LOGIN HANDLER
  if (loginBtn) {
    loginBtn.onclick = () => {
      log("Starting Login...");
      auth.login().catch(err => {
        log("Login Start Error: " + err);
        import('../components/overlay.js').then(({ showMessageOverlay }) => {
          showMessageOverlay(element, t('general.error'), `${t('general.error')} (Login): ${err}`, 'error');
        });
      });
    };
  }

  if (logoutBtn) {
    logoutBtn.onclick = () => {
      auth.logout();
      localStorage.removeItem('osm_user_img');
      updateUI(null);
      import('../components/overlay.js').then(({ showMessageOverlay }) => {
        showMessageOverlay(element, t('general.success'), t('settings.disconnect_btn') + "!", 'success', () => renderSettingsView());
      });
    };
  }

  if (resetBtn) {
    resetBtn.onclick = () => {
      import('../components/overlay.js').then(({ showConfirmOverlay }) => {
        showConfirmOverlay(
          element,
          t('settings.app_reset'),
          t('settings.reset_btn') + "? " + t('messages.no_undo'), // warning text
          () => {
            // Clear all app-owned browser state, including cached location,
            // OAuth data, settings, and optimistic OSM records.
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
          }
        );
      });
    };
  }

  // Info Modal Logic
  if (infoBtn) {
    infoBtn.onclick = () => {
      const modal = document.createElement('dialog');
      modal.className = "hj-backdrop m-0 absolute inset-0 z-[100] flex items-center justify-center p-5 w-full h-full max-w-full max-h-full";
      modal.setAttribute('aria-modal', 'true');
      modal.innerHTML = `
            <div class="hj-dialog custom-scrollbar p-6 max-w-sm w-full overflow-y-auto max-h-[80vh]">
                <h3 class="hj-wordmark text-[1.9rem] mb-5">${t('intro.info_legal')}</h3>
                
                <div class="space-y-5 text-sm leading-relaxed text-ivory/70">
                    <p><strong>${t('intro.title_pre')} ${t('intro.title_post')}</strong> (v${APP_VERSION})</p>
                    <a href="./help/" target="_blank" rel="noopener" class="inline-flex items-center gap-2 text-ivory underline underline-offset-4 decoration-ivory/30">
                        ${icon('question', 'w-4 h-4')} ${t('intro.help_link')}
                    </a>

                    <div class="border-l border-ivory/20 pl-4 py-1">
                        <h4 class="hj-eyebrow mb-2">${t('intro.info_impressum')}</h4>
                        <p class="text-xs text-ivory/50 mb-1">${t('legal.tmg_header')}</p>
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
                        <h4 class="hj-eyebrow mb-2">${t('intro.info_data')}</h4>
                        <p>${t('intro.info_data_text')}</p>
                    </div>

                    <div>
                        <h4 class="hj-eyebrow mb-2">${t('intro.info_license')}</h4>
                        <p>Data <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" class="text-ivory underline underline-offset-4 decoration-ivory/30">© OpenStreetMap contributors</a>.</p>
                        <p>Code: MIT License</p>
                        <a href="https://github.com/FrnkMrz/hydranten-app" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 mt-3 text-ivory underline underline-offset-4 decoration-ivory/30">
                            ${icon('external', 'w-4 h-4')} ${t('intro.info_github')}
                        </a>
                    </div>
                </div>

                <button id="close-info-btn" class="hj-btn hj-btn-light w-full mt-6">
                    OK
                </button>
            </div>
          `;
      element.appendChild(modal);
      modal.showModal();
      modal.querySelector('#close-info-btn').onclick = () => {
        modal.close();
        modal.remove();
        infoBtn.focus();
      };
    };
  }

  const updateUI = (username) => {
    if (username) {
      statusDiv.classList.remove('hidden');

      // Sanitization
      let diffName = username;
      if (!diffName.startsWith("Error")) {
        diffName = diffName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
      }

      userDisplay.innerText = diffName;
      userDisplay.className = username.startsWith("Error") ? "text-xs font-mono text-ember-300 break-words" : "hj-wordmark text-3xl";

      const img = localStorage.getItem('osm_user_img');
      const avatarContainer = element.querySelector('#user-avatar-container');
      const avatarImg = element.querySelector('#user-avatar');

      if (img && avatarContainer && avatarImg) {
        avatarImg.src = img;
        avatarImg.onerror = () => {
          console.warn("Avatar load failed");
          avatarContainer.classList.add('hidden');
        };
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
    } catch (_e) { /* ignore */ }
  };

  // Init Check
  if (auth.authenticated()) {
    const renderUserLogic = (name) => {
      updateUI(name || "Eingeloggt");

      // 2. Gamification Logic (Extracted)
      initGamificationWidget(element, name, onShowRankList);
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








