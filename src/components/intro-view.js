export function renderIntroView() {
   return `
    <div class="h-full w-full bg-black text-white flex flex-col items-center justify-between p-6 animate-fade-in relative overflow-hidden">
      
      <!-- Background -->
      <div class="absolute inset-0 bg-gradient-to-tr from-red-900/40 via-black to-slate-900 z-0"></div>
      
      <!-- Settings -->
      <div class="w-full flex justify-end z-20">
         <button id="intro-settings-btn" class="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition border border-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
         </button>
      </div>

      <!-- Icon & Title -->
      <div class="z-10 flex flex-col items-center justify-center flex-grow -mt-10">
         <div class="relative mb-6">
            <div class="absolute inset-0 bg-red-500 blur-2xl opacity-20 animate-pulse"></div>
            <img src="hydrant.svg" alt="Hydrant Icon" class="w-32 h-32 relative drop-shadow-2xl" />
         </div>
         
         <h1 class="text-4xl font-extrabold text-white mb-2 text-center">
            Hydranten <span class="text-red-500">Jäger</span>
         </h1>
      </div>

      <!-- Instructions -->
      <div class="w-full z-10 mb-6 mx-auto max-w-sm">
         <div class="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 space-y-3 text-sm text-gray-300">
             <div class="flex items-center gap-3">
                <span class="text-xl">📏</span> <p><span class="text-white font-bold">3 Meter</span> Abstand</p>
             </div>
             <div class="flex items-center gap-3">
                <span class="text-xl">📸</span> <p><span class="text-white font-bold">Foto</span> machen</p>
             </div>
             <div class="flex items-center gap-3">
                <span class="text-xl">✏️</span> <p><span class="text-white font-bold">Daten</span> ergänzen</p>
             </div>
         </div>
      </div>

      <!-- Start Button -->
      <div class="w-full max-w-xs z-10 mb-4">
         <button id="start-btn" class="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-900/30 active:scale-95 transition-all flex items-center justify-center gap-2">
           START
         </button>
         <p class="text-[10px] text-gray-600 text-center mt-4">Kostenlos & Open Source</p>
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
}
