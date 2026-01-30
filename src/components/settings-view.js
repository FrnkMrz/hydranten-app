export function renderSettingsView() {
    return `
      <div class="h-full w-full bg-slate-900 text-white flex flex-col animate-fade-in">
        <div class="p-4 flex items-center border-b border-gray-800 bg-black/20 backdrop-blur-md sticky top-0 z-50">
           <button id="back-btn" class="p-2 mr-4 bg-gray-800 rounded-lg active:scale-95 transition">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
           </button>
           <h1 class="text-xl font-bold">Einstellungen</h1>
        </div>
        
        <div class="p-6 space-y-8 flex-1 overflow-y-auto">
           <!-- OSM Section -->
           <section class="space-y-4">
             <div class="flex items-center gap-2">
                <div class="p-2 bg-green-500/20 rounded-lg text-green-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                </div>
                <h2 class="text-lg font-bold">OpenStreetMap</h2>
             </div>
             
             <div class="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
               <p class="text-sm text-gray-400 mb-4">
                 Verbinde deinen Account, um Hydranten direkt hochzuladen.
                 <br><a href="#" class="text-blue-400 underline text-xs">Wie bekomme ich Zugangsdaten?</a>
               </p>
               
               <label class="block mb-3">
                  <span class="text-xs text-gray-500 uppercase font-bold tracking-wider">Benutzername</span>
                  <input type="text" id="osm-user" class="w-full bg-gray-900 p-3 rounded-lg mt-1 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" placeholder="Dein OSM Name">
               </label>
               
               <label class="block mb-4">
                  <span class="text-xs text-gray-500 uppercase font-bold tracking-wider">Passwort / Token</span>
                  <input type="password" id="osm-pass" class="w-full bg-gray-900 p-3 rounded-lg mt-1 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" placeholder="••••••••">
               </label>
  
               <button id="save-osm" class="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-all">
                 Verbinden
               </button>
               <p id="save-status" class="text-center text-xs text-green-400 mt-2 h-4"></p>
             </div>
           </section>

           <section class="space-y-4 pt-4 border-t border-gray-800">
              <h2 class="text-lg font-bold text-gray-400">Über</h2>
              <p class="text-sm text-gray-500">Hydranten Jäger v0.1.0<br>Made with 🤖 & ❤️</p>
           </section>
        </div>
      </div>
    `;
}

export function initSettingsView(element, onBack) {
    element.querySelector('#back-btn').onclick = onBack;

    const userInput = element.querySelector('#osm-user');
    const passInput = element.querySelector('#osm-pass');
    const status = element.querySelector('#save-status');
    const btn = element.querySelector('#save-osm');

    // Load existing
    const stored = JSON.parse(localStorage.getItem('osm_creds') || '{}');
    if (stored.user) {
        userInput.value = stored.user;
        passInput.value = stored.pass || '';
        btn.innerText = "Aktualisieren";
        btn.classList.add('bg-gray-700', 'text-gray-300'); // Show as 'connected' state style optionally
    }

    btn.onclick = () => {
        const user = userInput.value;
        const pass = passInput.value;

        if (user && pass) {
            // Save to local storage
            localStorage.setItem('osm_creds', JSON.stringify({ user, pass }));

            // Visual Feedback
            status.innerText = "Gespeichert!";
            btn.innerText = "Aktualisieren";
            btn.classList.remove('bg-blue-600');
            btn.classList.add('bg-green-600');

            setTimeout(() => {
                status.innerText = "";
                btn.classList.remove('bg-green-600');
                btn.classList.add('bg-blue-600');
            }, 2000);
        } else {
            status.innerText = "";
            alert("Bitte Benutzername und Passwort eingeben.");
        }
    };
}
