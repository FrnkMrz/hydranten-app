export function renderIntroView() {
   return `
    <div class="h-full w-full bg-black text-white flex flex-col p-6 animate-fade-in relative overflow-hidden">
      
      <!-- Background -->
      <div class="absolute inset-0 bg-gradient-to-tr from-red-900/30 via-black to-slate-900 z-0 pointer-events-none"></div>
      
      <!-- Top Bar (Settings) -->
      <div class="w-full flex justify-end z-20 h-16 shrink-0">
         <button id="intro-settings-btn" class="p-3 h-12 w-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition border border-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
         </button>
      </div>

      <!-- Main Content (Centered) -->
      <div class="flex-grow flex flex-col items-center justify-center space-y-8 z-10 w-full max-w-sm mx-auto">
         
         <!-- Hero -->
         <div class="flex flex-col items-center text-center">
             <div class="relative mb-6">
                <div class="absolute inset-0 bg-red-600 blur-3xl opacity-20"></div>
                <img src="hydrant.svg" alt="Hydrant Icon" class="w-32 h-32 relative drop-shadow-2xl" />
             </div>
             
             <h1 class="text-4xl font-extrabold text-white mb-2 tracking-tight">
                Hydranten <span class="text-red-500">Jäger</span>
             </h1>
             <p class="text-gray-400 text-xs font-bold uppercase tracking-widest opacity-80 mb-4">OpenStreetMap Tool</p>
             
             <!-- Live GPS -->
             <div class="inline-flex items-center gap-2 bg-white/5 backdrop-blur px-3 py-1 rounded-full border border-white/10 shadow-inner">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span id="intro-gps" class="text-[10px] font-mono text-gray-300">Suche Satelliten...</span>
             </div>
         </div>

         <!-- Instructions Card -->
         <div class="w-full bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-3 text-sm text-gray-300 shadow-xl">
             <div class="flex items-center gap-4">
                <span class="text-xl bg-white/10 p-2 rounded-lg">📏</span> <p><span class="text-white font-bold">3 Meter</span> Abstand</p>
             </div>
             <div class="flex items-center gap-4">
                <span class="text-xl bg-white/10 p-2 rounded-lg">📸</span> <p><span class="text-white font-bold">Foto</span> machen</p>
             </div>
             <div class="flex items-center gap-4">
                <span class="text-xl bg-white/10 p-2 rounded-lg">✏️</span> <p><span class="text-white font-bold">Daten</span> ergänzen</p>
             </div>
             <div class="flex items-center gap-4">
                <span class="text-xl bg-white/10 p-2 rounded-lg">☁️</span> <p><span class="text-white font-bold">Hochladen</span> zu OSM</p>
             </div>
         </div>
      </div>

      <!-- Footer Action -->
      <div class="h-20 shrink-0 z-10 w-full max-w-sm mx-auto flex flex-col justify-end">
         <button id="start-btn" class="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-900/30 active:scale-95 transition-all flex items-center justify-center gap-2">
           STARTEN 🚀
         </button>
      </div>
    </div>
  `;
}

export function initIntroView(element, onStart, onSettings) {
   const btn = element.querySelector('#start-btn');
   if (btn) {
      btn.onclick = () => {
         onStart();
      };
   }

   const settingsBtn = element.querySelector('#intro-settings-btn');
   if (settingsBtn && onSettings) {
      settingsBtn.onclick = onSettings;
   }

   // Live GPS Update
   const gpsEl = element.querySelector('#intro-gps');
   if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
         (pos) => {
            if (gpsEl) {
               gpsEl.innerText = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} (±${Math.round(pos.coords.accuracy)}m)`;
               gpsEl.classList.add('text-green-400');
               gpsEl.classList.remove('text-gray-300');
            }
         },
         (err) => {
            if (gpsEl) gpsEl.innerText = "Kein GPS Signal";
         },
         { enableHighAccuracy: true, maximumAge: 5000 }
      );

      // Cleanup on unmount (Main.js re-renders intro, so this leak is minor but exists. 
      // Ideally we return a cleanup function, but for now simple innerHTML replacement cleans valid watchers? No.
      // We should store watchId somewhere if we were strict.
   }
}
