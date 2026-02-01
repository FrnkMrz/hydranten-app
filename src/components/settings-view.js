import { auth, checkLogin } from '../services/auth.js';
import { t } from '../services/i18n.js';

export function renderSettingsView() {
  let accountContent = `
        <div class="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
            <p class="text-gray-400 mb-4 text-sm">${t('settings.account')}</p>
            <button id="osm-connect-btn" class="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition flex items-center justify-center gap-2">
               <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg> 
               ${t('settings.connect_btn')}
            </button>
        </div>
    `;

  try {
    const token = JSON.parse(localStorage.getItem('osm-auth') || '{}');
    if (token.access_token) {
      const name = localStorage.getItem('osm_user_name') || t('intro.login_connected');
      accountContent = `
               <div class="p-4 bg-green-900/30 rounded-xl border border-green-500/30 flex items-center justify-between">
                   <div class="flex items-center gap-3">
                       <div class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center font-bold text-white text-xl">
                          ${name.charAt(0).toUpperCase()}
                       </div>
                       <div>
                           <p class="text-green-400 text-sm font-bold">${t('settings.account')}</p>
                           <p class="text-white font-medium">${name}</p>
                       </div>
                   </div>
                   <button id="osm-logout-btn" class="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-bold border border-white/10 uppercase tracking-widest">
                       ${t('settings.disconnect_btn')}
                   </button>
               </div>
           `;
    }
  } catch (e) { }

  return `
      <div class="h-full w-full bg-black text-white flex flex-col">
        <!-- Header -->
        <div class="h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
             <h2 class="text-xl font-bold tracking-tight">${t('settings.title')}</h2>
             <button id="settings-back-btn" class="text-gray-400 hover:text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-grow p-6 overflow-y-auto space-y-8">
            
            <!-- Account Section -->
            <section>
                <h3 class="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">${t('settings.account')}</h3>
                ${accountContent}
            </section>

            <!-- Reset Section -->
            <section>
                <h3 class="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">${t('settings.app_reset')}</h3>
                <div class="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p class="text-xs text-gray-400 mb-4">Falls die App hängt oder Fehler anzeigt.</p>
                    <button id="reset-app-btn" class="w-full py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg font-bold transition">
                        ⚠️ ${t('settings.reset_btn')}
                    </button>
                </div>
            </section>
            
            <!-- Info Button -->
            <section class="text-center pt-8">
                <button id="info-btn" class="text-gray-500 hover:text-white text-sm underline">
                    ${t('settings.legal_link')}
                </button>
                <p class="text-gray-600 text-[10px] mt-2">v1.0 Beta</p>
            </section>
        </div>
      </div>
    `;
}

export function initSettingsView(element, onBack) {
  const backBtn = element.querySelector('#settings-back-btn');
  if (backBtn) backBtn.onclick = onBack;

  const connectBtn = element.querySelector('#osm-connect-btn');
  if (connectBtn) {
    connectBtn.onclick = () => {
      auth.login();
    };
  }

  const logoutBtn = element.querySelector('#osm-logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      auth.logout();
      // Re-render
      const newContent = renderSettingsView();
      element.innerHTML = newContent;
      initSettingsView(element, onBack);
    };
  }

  const resetBtn = element.querySelector('#reset-app-btn');
  if (resetBtn) {
    resetBtn.onclick = () => {
      if (confirm(t('settings.reset_btn') + "?")) {
        localStorage.clear();
        window.location.reload();
      }
    };
  }

  // Info Modal Logic
  const infoBtn = element.querySelector('#info-btn');
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

                 <button id="close-intro-info-btn" class="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition">
                     OK
                 </button>
             </div>
           `;
      element.appendChild(modal);
      modal.querySelector('#close-intro-info-btn').onclick = () => modal.remove();
    };
  }
}
