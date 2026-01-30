export function renderIntroView() {
   return `
    <div class="h-full w-full bg-black text-white flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden">
      
      <!-- Modern Gradient Background -->
      <div class="absolute inset-0 bg-gradient-to-tr from-red-900/40 via-black to-slate-900 z-0"></div>
      <div class="absolute -top-20 -right-20 w-64 h-64 bg-red-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent z-0"></div>

      <!-- Settings Button -->
      <button id="intro-settings-btn" class="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-full text-white/80 hover:text-white transition z-50 border border-white/10 group">
         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:rotate-90 transition-transform"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
      </button>
      
      <!-- Hero Content -->
      <div class="z-10 flex flex-col items-center flex-grow justify-center mt-[-10%]">
         <div class="relative mb-8">
            <div class="absolute inset-0 bg-red-500 blur-2xl opacity-20 animate-pulse"></div>
            <img src="hydrant.svg" alt="Hydrant Icon" class="w-32 h-32 relative drop-shadow-2xl opacity-90 transform hover:scale-105 transition duration-500" />
         </div>
         
         <h1 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2 tracking-tight text-center">
            Hydranten <span class="text-red-500">Jäger</span>
         </h1>
         <p class="text-gray-400 text-sm font-medium tracking-wide uppercase opacity-80 text-center">OpenStreetMap Erfassung</p>
      </div>

      <!-- Action Area -->
      <div class="w-full max-w-xs z-10 mb-8 space-y-6">
         <button id="start-btn" class="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-red-900/40 active:scale-95 transition-all flex items-center justify-center gap-2 group">
           <span>LOSLEGEN</span>
           <span class="group-hover:translate-x-1 transition-transform">🚀</span>
         </button>
         
         <p class="text-[10px] text-gray-600 text-center">
            Version 1.0 • Kostenlos & Open Source
         </p>
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
